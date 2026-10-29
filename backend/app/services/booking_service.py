"""
KogniSync — Authoritative PostgreSQL Booking Lifecycle & Reliability Service

Core transactional orchestration service for inventory holds, booking sagas,
hold expiration, durable idempotency, row-level locking, and compensation workflows.
Preserves strict data invariants: booked_units + held_units <= total_units.
"""

import uuid
import json
import hashlib
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from typing import Optional, List, Sequence, Dict, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models.inventory import InventoryCalendar, Hold
from app.db.models.booking import Booking, BookingItem
from app.db.models.payment import Payment
from app.db.models.events import BookingLifecycleEvent
from app.repositories import (
    InventoryRepository,
    HoldRepository,
    BookingRepository,
    PaymentRepository,
    UserRepository,
    EventRepository,
    IdempotencyRepository,
    InventoryNotFoundError,
    InsufficientInventoryError,
    RepositoryConflictError,
    IdempotencyPayloadConflictError,
    HoldNotFoundError,
    HoldExpiredError,
    HoldNotActiveError,
    BookingNotFoundError,
    PaymentFailedError
)
from app.services.payment_simulator import PaymentSimulator, PaymentSimulationResult
from app.core.logging import logger


class BookingService:
    """
    Authoritative asynchronous PostgreSQL booking service.
    Owns database transaction boundaries (session.begin() / commit / rollback).
    Guarantees the central invariant: booked_units + held_units <= total_units.
    Coordinates hold lifecycle, confirmation, compensation, and idempotency deduplication.
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.inv_repo = InventoryRepository(session)
        self.inventory_repo = self.inv_repo  # Alias for backward compatibility
        self.hold_repo = HoldRepository(session)
        self.booking_repo = BookingRepository(session)
        self.payment_repo = PaymentRepository(session)
        self.user_repo = UserRepository(session)
        self.event_repo = EventRepository(session)
        self.idemp_repo = IdempotencyRepository(session)

    @asynccontextmanager
    async def _tx(self):
        """
        Safely executes operations within a database transaction boundary,
        accommodating SQLAlchemy 2.0 autobegin state.
        """
        if self.session.in_transaction():
            try:
                yield
                await self.session.commit()
            except Exception:
                await self.session.rollback()
                raise
        else:
            async with self.session.begin():
                yield

    @staticmethod
    def _compute_payload_hash(payload: Optional[Dict[str, Any]]) -> str:
        if not payload:
            return ""
        payload_str = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

    async def get_inventory_by_id(self, inventory_id: str) -> Optional[InventoryCalendar]:
        """
        Reads inventory calendar record by primary key.
        """
        return await self.inv_repo.get_by_id(inventory_id)

    async def get_inventory_by_natural_key(
        self,
        entity_type: str,
        entity_id: str,
        for_date: date
    ) -> Optional[InventoryCalendar]:
        """
        Reads inventory calendar record by natural key.
        """
        return await self.inv_repo.get_by_natural_key(entity_type, entity_id, for_date)

    async def get_inventory_status(
        self,
        inventory_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        for_date: Optional[date] = None
    ) -> Any:
        """
        Returns inventory status. If called with inventory_id, returns dictionary
        with available_units suitable for concurrency audits. If called with natural keys,
        returns the InventoryCalendar entity.
        """
        if inventory_id:
            item = await self.inv_repo.get_by_id(inventory_id)
            if not item:
                return None
            available = item.total_units - item.booked_units - item.held_units
            return {
                "inventory_id": item.inventory_id,
                "entity_type": item.entity_type,
                "entity_id": item.entity_id,
                "for_date": str(item.for_date),
                "total_units": item.total_units,
                "booked_units": item.booked_units,
                "held_units": item.held_units,
                "available_units": available,
                "price": str(item.price),
                "currency": item.currency
            }
        elif entity_type and entity_id and for_date:
            return await self.inv_repo.get_by_natural_key(entity_type, entity_id, for_date)
        return None

    async def create_hold(
        self,
        inventory_id: str,
        user_id: str,
        units: int,
        idempotency_key: str,
        correlation_id: Optional[str] = None,
        ttl_seconds: int = 600,
        payload_dict: Optional[Dict[str, Any]] = None,
        expires_in_seconds: Optional[int] = None
    ) -> Hold:
        """
        Creates a temporary inventory hold backed by PostgreSQL row locking (SELECT ... FOR UPDATE).
        Enforces booked_units + held_units <= total_units.
        Handles idempotency deduplication and payload conflict validation.
        """
        if units <= 0:
            raise ValueError(f"Requested units must be positive (received {units})")

        effective_ttl = expires_in_seconds if expires_in_seconds is not None else ttl_seconds
        cid = correlation_id or f"corr_{uuid.uuid4().hex[:12]}"
        payload_hash = self._compute_payload_hash(payload_dict)

        # 1. Check idempotency record first (fast path)
        existing_idemp = await self.idemp_repo.get_by_key(idempotency_key)
        if existing_idemp:
            if payload_hash and existing_idemp.request_hash and existing_idemp.request_hash != payload_hash:
                raise IdempotencyPayloadConflictError(
                    f"Idempotency key '{idempotency_key}' reused with conflicting request payload"
                )
            if existing_idemp.resource_id:
                existing_hold = await self.hold_repo.get_by_id(existing_idemp.resource_id)
                if existing_hold:
                    return existing_hold

        # Check existing hold table idempotency key
        existing_hold = await self.hold_repo.get_by_idempotency_key(idempotency_key)
        if existing_hold:
            if (
                existing_hold.inventory_id != inventory_id
                or existing_hold.user_id != user_id
                or existing_hold.units != units
            ):
                raise IdempotencyPayloadConflictError(
                    f"Idempotency collision for key '{idempotency_key}': "
                    f"existing payload conflicts with requested payload."
                )
            return existing_hold

        # 2. Transactional hold creation with row locking
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=effective_ttl)
        new_hold_id = f"hld_{uuid.uuid4().hex[:16]}"

        async with self._tx():
            # Check hold idempotency inside transaction
            existing_hold = await self.hold_repo.get_by_idempotency_key(idempotency_key)
            if existing_hold:
                return existing_hold

            # Pessimistic row-level lock on inventory_calendar
            inv_item = await self.inv_repo.lock_by_id(inventory_id)

            # Strict invariant check: booked + held + requested <= total
            available = inv_item.total_units - inv_item.booked_units - inv_item.held_units
            if units > available:
                await self.event_repo.record_event(
                    event_type="HOLD_REJECTED",
                    correlation_id=cid,
                    inventory_id=inventory_id,
                    user_id=user_id,
                    units=units,
                    metadata={"reason": "insufficient_inventory", "available": available, "requested": units}
                )
                raise InsufficientInventoryError(
                    f"Insufficient inventory for item '{inventory_id}'. Available: {available}, Requested: {units}"
                )

            # Increment held units safely under lock
            inv_item.held_units += units

            # Create hold record
            hold = Hold(
                hold_id=new_hold_id,
                inventory_id=inventory_id,
                user_id=user_id,
                units=units,
                idempotency_key=idempotency_key,
                created_at=now,
                expires_at=expires_at,
                released_at=None,
                booking_id=None,
                status="active",
                updated_at=now
            )

            try:
                async with self.session.begin_nested():
                    self.hold_repo.add(hold)
                    await self.session.flush()
            except IntegrityError:
                # Concurrent request inserted with same idempotency key
                existing = await self.hold_repo.get_by_idempotency_key(idempotency_key)
                if existing:
                    inv_item.held_units -= units
                    return existing
                raise

            # Record lifecycle event
            await self.event_repo.record_event(
                event_type="HOLD_CREATED",
                correlation_id=cid,
                inventory_id=inventory_id,
                hold_id=new_hold_id,
                user_id=user_id,
                state_from=None,
                state_to="active",
                units=units,
                metadata={"expires_at": expires_at.isoformat(), "ttl_seconds": effective_ttl}
            )

            # Store idempotency record
            await self.idemp_repo.record_response(
                idempotency_key=idempotency_key,
                scope="hold",
                request_hash=payload_hash or "none",
                resource_id=new_hold_id,
                response_status=201,
                response_body=json.dumps({"hold_id": new_hold_id, "units": units, "status": "active"})
            )

        return hold

    async def get_hold(self, hold_id: str) -> Optional[Hold]:
        return await self.hold_repo.get_by_id(hold_id)

    async def release_hold(
        self,
        hold_id: str,
        correlation_id: Optional[str] = None
    ) -> Hold:
        """
        Explicitly releases an active hold, immediately restoring available capacity.
        """
        cid = correlation_id or f"corr_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)
        async with self._tx():
            hold = await self.hold_repo.lock_by_id(hold_id)
            if not hold:
                raise HoldNotFoundError(f"Hold '{hold_id}' not found")
            if hold.status != "active":
                raise HoldNotActiveError(f"Hold '{hold_id}' is in status '{hold.status}', cannot release")

            # Restore inventory capacity
            await self.inv_repo.release_held_units(hold.inventory_id, hold.units)

            hold.status = "released"
            hold.released_at = now
            hold.updated_at = now

            await self.event_repo.record_event(
                event_type="HOLD_RELEASED",
                correlation_id=cid,
                inventory_id=hold.inventory_id,
                hold_id=hold.hold_id,
                user_id=hold.user_id,
                state_from="active",
                state_to="released",
                units=hold.units
            )

        return hold

    async def expire_holds(
        self,
        as_of_time: Optional[datetime] = None,
        inventory_id: Optional[str] = None,
        limit: int = 100,
        correlation_id: Optional[str] = None,
        now: Optional[datetime] = None
    ) -> List[str]:
        """
        Processes expired holds whose TTL has elapsed.
        Safely restores held units back to available capacity under row locking.
        Returns list of expired hold IDs.
        """
        check_time = as_of_time or now or datetime.now(timezone.utc)
        candidates = await self.hold_repo.find_expired_holds(as_of_time=check_time, inventory_id=inventory_id, limit=limit)
        expired_ids: List[str] = []

        for candidate in candidates:
            async with self._tx():
                hold = await self.hold_repo.lock_by_id(candidate.hold_id)
                # Verify still active and expired under lock
                if not hold or hold.status != "active" or hold.expires_at > check_time:
                    continue

                # Release held units back to inventory
                await self.inv_repo.release_held_units(hold.inventory_id, hold.units)

                hold.status = "expired"
                hold.released_at = check_time
                hold.updated_at = check_time

                await self.event_repo.record_event(
                    event_type="HOLD_EXPIRED",
                    correlation_id=correlation_id or f"exp_{hold.hold_id}",
                    inventory_id=hold.inventory_id,
                    hold_id=hold.hold_id,
                    user_id=hold.user_id,
                    state_from="active",
                    state_to="expired",
                    units=hold.units
                )
                expired_ids.append(hold.hold_id)

        return expired_ids

    async def confirm_booking(
        self,
        hold_id: Union[str, List[str], None] = None,
        user_id: str = "",
        payment_method: str = "card",
        idempotency_key: str = "",
        correlation_id: Optional[str] = None,
        simulate_payment_failure: bool = False,
        payment_failure_code: Optional[str] = None,
        hold_ids: Optional[List[str]] = None,
        currency: Optional[str] = None,
    ) -> Booking:
        """
        Confirms a held reservation (or multiple held legs in a multi-leg journey)
        into a confirmed booking.
        Simulates payment processing outside long-held database locks.
        Compensates (releases held inventory) if payment fails.
        Converts held units into booked units if payment succeeds (capacity neutral).
        """
        cid = correlation_id or f"corr_{uuid.uuid4().hex[:16]}"
        if not idempotency_key:
            idempotency_key = f"bkg_idemp_{uuid.uuid4().hex[:16]}"

        # Resolve target hold IDs
        target_hold_ids: List[str] = []
        if hold_ids:
            target_hold_ids = list(hold_ids)
        elif hold_id:
            if isinstance(hold_id, list):
                target_hold_ids = list(hold_id)
            else:
                target_hold_ids = [hold_id]
        else:
            raise ValueError("Cannot confirm booking without at least one hold identifier.")

        # Check existing booking by idempotency key
        existing_booking = await self.booking_repo.get_by_idempotency_key(idempotency_key)
        if existing_booking:
            return existing_booking

        # Verify all holds exist and are active
        now = datetime.now(timezone.utc)
        resolved_holds: List[Hold] = []
        resolved_invs: List[InventoryCalendar] = []
        total_price = Decimal("0.00")
        booking_currency = currency or "INR"

        for hid in target_hold_ids:
            hold = await self.hold_repo.get_by_id(hid)
            if not hold:
                raise HoldNotFoundError(f"Hold '{hid}' not found")
            if hold.status != "active":
                raise HoldNotActiveError(f"Hold '{hid}' is '{hold.status}', cannot confirm")
            if hold.expires_at <= now:
                await self.expire_holds(as_of_time=now)
                raise HoldExpiredError(f"Hold '{hid}' has expired at {hold.expires_at.isoformat()}")

            inv_item = await self.inv_repo.get_by_id(hold.inventory_id)
            if not inv_item:
                raise InventoryNotFoundError(f"Inventory '{hold.inventory_id}' not found")

            booking_currency = inv_item.currency
            line_total = Decimal(str(inv_item.price)) * Decimal(hold.units)
            total_price += line_total
            resolved_holds.append(hold)
            resolved_invs.append(inv_item)

        # 1. Execute payment processing outside long database lock
        pay_result = PaymentSimulator.process_payment(
            amount=total_price,
            currency=booking_currency,
            method=payment_method,
            idempotency_key=f"pay_{idempotency_key}",
            simulate_failure=simulate_payment_failure,
            failure_code=payment_failure_code
        )

        # 2. Compensation saga on payment failure
        if not pay_result.success:
            async with self._tx():
                for hid in target_hold_ids:
                    locked_hold = await self.hold_repo.lock_by_id(hid)
                    if locked_hold and locked_hold.status == "active":
                        await self.inv_repo.release_held_units(locked_hold.inventory_id, locked_hold.units)
                        locked_hold.status = "released"
                        locked_hold.released_at = now
                        locked_hold.updated_at = now

                        await self.event_repo.record_event(
                            event_type="PAYMENT_FAILED",
                            correlation_id=cid,
                            inventory_id=locked_hold.inventory_id,
                            hold_id=locked_hold.hold_id,
                            user_id=user_id or locked_hold.user_id,
                            state_from="active",
                            state_to="released",
                            units=locked_hold.units,
                            metadata={"failure_code": pay_result.failure_code, "reason": pay_result.message}
                        )

            raise PaymentFailedError(
                f"Payment authorization failed ({pay_result.failure_code}). All holds released and inventory compensated."
            )

        # 3. Complete booking saga on payment success
        booking_id = f"bkg_{uuid.uuid4().hex[:16]}"
        booking_ref = f"REF-{uuid.uuid4().hex[:8].upper()}"
        payment_id = f"pay_{uuid.uuid4().hex[:16]}"

        async with self._tx():
            # Check idempotency inside transaction
            existing_booking = await self.booking_repo.get_by_idempotency_key(idempotency_key)
            if existing_booking:
                return existing_booking

            # Create Booking
            booking = Booking(
                booking_id=booking_id,
                user_id=user_id or resolved_holds[0].user_id,
                trip_id=None,
                itinerary_id=None,
                booking_reference=booking_ref,
                channel="web",
                total_amount=total_price,
                currency=booking_currency,
                tax_amount=Decimal("0.00"),
                idempotency_key=idempotency_key,
                status="confirmed",
                confirmed_at=now,
                cancelled_at=None,
                cancellation_reason=None,
                created_at=now,
                updated_at=now
            )
            self.session.add(booking)

            # Re-lock each hold, transition capacity, and create booking item
            for hold, inv_item in zip(resolved_holds, resolved_invs):
                locked_hold = await self.hold_repo.lock_by_id(hold.hold_id)
                if not locked_hold or locked_hold.status != "active":
                    raise HoldExpiredError(f"Hold '{hold.hold_id}' expired or became inactive prior to confirmation")

                # Atomically transition capacity: booked + units, held - units
                await self.inv_repo.confirm_held_units(locked_hold.inventory_id, locked_hold.units)

                line_total = Decimal(str(inv_item.price)) * Decimal(locked_hold.units)
                booking_item_id = f"bit_{uuid.uuid4().hex[:16]}"

                booking_item = BookingItem(
                    booking_item_id=booking_item_id,
                    booking_id=booking_id,
                    entity_type=inv_item.entity_type,
                    entity_id=inv_item.entity_id,
                    inventory_id=inv_item.inventory_id,
                    title=f"Reservation for {inv_item.entity_type} {inv_item.entity_id}",
                    for_date=inv_item.for_date,
                    units=locked_hold.units,
                    unit_price=inv_item.price,
                    line_total=line_total,
                    currency=inv_item.currency,
                    status="confirmed",
                    compensated_at=None,
                    updated_at=now
                )
                self.session.add(booking_item)

                locked_hold.status = "confirmed"
                locked_hold.booking_id = booking_id
                locked_hold.updated_at = now

                await self.event_repo.record_event(
                    event_type="BOOKING_CONFIRMED",
                    correlation_id=cid,
                    inventory_id=locked_hold.inventory_id,
                    hold_id=locked_hold.hold_id,
                    booking_id=booking_id,
                    payment_id=payment_id,
                    user_id=user_id or locked_hold.user_id,
                    state_from="held",
                    state_to="confirmed",
                    units=locked_hold.units,
                    metadata={"booking_reference": booking_ref, "total_amount": str(total_price)}
                )

            # Create Payment
            payment = Payment(
                payment_id=payment_id,
                booking_id=booking_id,
                method=payment_method,
                status="captured",
                authorised_amount=total_price,
                captured_amount=total_price,
                refunded_amount=Decimal("0.00"),
                currency=booking_currency,
                gateway_reference=pay_result.gateway_reference,
                idempotency_key=f"pay_{idempotency_key}",
                failure_code=None,
                authorised_at=now,
                captured_at=now,
                created_at=now,
                updated_at=now
            )
            self.session.add(payment)

            # Store idempotency record
            await self.idemp_repo.record_response(
                idempotency_key=idempotency_key,
                scope="booking",
                request_hash=self._compute_payload_hash({"hold_ids": target_hold_ids, "user_id": user_id}),
                resource_id=booking_id,
                response_status=200,
                response_body=json.dumps({"booking_id": booking_id, "booking_reference": booking_ref, "status": "confirmed"})
            )

        return booking

    async def cancel_booking(
        self,
        booking_id: str,
        correlation_id: Optional[str] = None,
        reason: str = "user_cancelled"
    ) -> Booking:
        """
        Cancels a confirmed booking and restores booked units to available inventory capacity.
        """
        cid = correlation_id or f"corr_{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)
        async with self._tx():
            booking = await self.booking_repo.get_by_id_with_items(booking_id)
            if not booking:
                raise BookingNotFoundError(f"Booking '{booking_id}' not found")
            if booking.status != "confirmed":
                raise ValueError(f"Booking '{booking_id}' is '{booking.status}', cannot cancel")

            # Restore booked units for all items
            for item in booking.booking_items:
                if item.inventory_id and item.status == "confirmed":
                    await self.inv_repo.release_booked_units(item.inventory_id, item.units)
                    item.status = "cancelled"
                    item.compensated_at = now
                    item.updated_at = now

            booking.status = "cancelled"
            booking.cancelled_at = now
            booking.cancellation_reason = reason
            booking.updated_at = now

            # Update payments to refunded
            for p in booking.payments:
                if p.status == "captured":
                    p.status = "refunded"
                    p.refunded_amount = p.captured_amount
                    p.updated_at = now

            await self.event_repo.record_event(
                event_type="BOOKING_CANCELLED",
                correlation_id=cid,
                booking_id=booking_id,
                user_id=booking.user_id,
                state_from="confirmed",
                state_to="cancelled",
                metadata={"reason": reason}
            )

        return booking

    async def get_booking(self, booking_id: str) -> Optional[Booking]:
        return await self.booking_repo.get_by_id(booking_id)

    async def get_events(self, correlation_id: str) -> Sequence[BookingLifecycleEvent]:
        return await self.event_repo.list_by_correlation_id(correlation_id)
