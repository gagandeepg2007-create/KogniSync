"""
KogniSync — Authoritative PostgreSQL Booking Lifecycle & Reliability Service

Implements transactional booking lifecycle, inventory locking, holds, expiration,
confirmation, payment recording, and compensation using SQLAlchemy AsyncSession.
Preserves strict data invariants: booked_units + held_units <= total_units.
"""

import uuid
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from typing import Optional, List, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models.inventory import InventoryCalendar, Hold
from app.db.models.booking import Booking, BookingItem
from app.db.models.payment import Payment
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.hold_repository import HoldRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.user_repository import UserRepository
from app.repositories.exceptions import (
    InventoryNotFoundError,
    InsufficientInventoryError,
    RepositoryConflictError,
)
from app.core.logging import logger


class BookingService:
    """
    Authoritative asynchronous PostgreSQL booking service.
    Enforces transactional inventory capacity checks, row-level locking,
    idempotency protection, hold lifecycle, confirmation, and payment compensation.
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.inventory_repo = InventoryRepository(session)
        self.hold_repo = HoldRepository(session)
        self.booking_repo = BookingRepository(session)
        self.payment_repo = PaymentRepository(session)
        self.user_repo = UserRepository(session)

    async def get_inventory_status(
        self,
        entity_type: str,
        entity_id: str,
        for_date: date
    ) -> Optional[InventoryCalendar]:
        """
        Reads inventory calendar record by natural key.
        """
        return await self.inventory_repo.get_by_natural_key(entity_type, entity_id, for_date)

    async def get_inventory_by_id(self, inventory_id: str) -> Optional[InventoryCalendar]:
        """
        Reads inventory calendar record by primary key.
        """
        return await self.inventory_repo.get_by_id(inventory_id)

    async def create_hold(
        self,
        inventory_id: str,
        user_id: str,
        units: int,
        idempotency_key: str,
        expires_in_seconds: int = 600,
        correlation_id: Optional[str] = None
    ) -> Hold:
        """
        Creates a temporary inventory hold.
        1. Checks idempotency: if key exists, returns existing hold or raises conflict if payload diverges.
        2. Locks inventory row with SELECT ... FOR UPDATE.
        3. Verifies invariant (booked + held + requested <= total) and increments held_units.
        4. Persists hold record with status 'active'.
        """
        if units <= 0:
            raise ValueError(f"Requested units must be positive (received {units}).")

        # 1. Idempotency Check
        existing_hold = await self.hold_repo.get_by_idempotency_key(idempotency_key)
        if existing_hold is not None:
            # Verify payload equivalence
            if (
                existing_hold.inventory_id != inventory_id
                or existing_hold.user_id != user_id
                or existing_hold.units != units
            ):
                raise RepositoryConflictError(
                    f"Idempotency collision for key '{idempotency_key}': "
                    f"existing payload (inv={existing_hold.inventory_id}, user={existing_hold.user_id}, units={existing_hold.units}) "
                    f"conflicts with requested payload (inv={inventory_id}, user={user_id}, units={units})."
                )
            logger.info(
                f"Hold idempotency replay: returning existing hold '{existing_hold.hold_id}' "
                f"[correlation_id={correlation_id}]"
            )
            return existing_hold

        # 2. Row-level lock and capacity increment (atomic check-and-set)
        await self.inventory_repo.allocate_held_units(inventory_id, units)

        # 3. Create Hold Record
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=expires_in_seconds)
        hold_id = f"hld_{uuid.uuid4().hex[:8]}"

        hold = Hold(
            hold_id=hold_id,
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

        created = await self.hold_repo.create_hold(hold)
        await self.session.flush()
        logger.info(
            f"Created hold '{hold_id}' for {units} unit(s) on inventory '{inventory_id}' "
            f"[user_id={user_id}, correlation_id={correlation_id}]"
        )
        return created

    async def release_hold(
        self,
        hold_id: str,
        correlation_id: Optional[str] = None
    ) -> Hold:
        """
        Releases an active inventory hold, decrementing held_units on inventory_calendar.
        """
        hold = await self.hold_repo.get_by_id(hold_id)
        if hold is None:
            raise ValueError(f"Hold id '{hold_id}' not found.")

        if hold.status == "active":
            await self.inventory_repo.release_held_units(hold.inventory_id, hold.units)
            now = datetime.now(timezone.utc)
            hold.status = "released"
            hold.released_at = now
            hold.updated_at = now
            await self.session.flush()
            logger.info(
                f"Released hold '{hold_id}' for {hold.units} unit(s) on inventory '{hold.inventory_id}' "
                f"[correlation_id={correlation_id}]"
            )

        return hold

    async def expire_holds(
        self,
        now: Optional[datetime] = None
    ) -> int:
        """
        Scans for active holds that have exceeded their expires_at timestamp,
        releases held inventory units, and transitions status to 'expired'.
        Returns total number of expired holds processed.
        """
        check_time = now or datetime.now(timezone.utc)
        stmt = (
            select(Hold)
            .where(Hold.status == "active", Hold.expires_at <= check_time)
            .with_for_update()
        )
        res = await self.session.execute(stmt)
        expired_holds = res.scalars().all()

        count = 0
        for hold in expired_holds:
            await self.inventory_repo.release_held_units(hold.inventory_id, hold.units)
            hold.status = "expired"
            hold.updated_at = check_time
            count += 1

        if count > 0:
            await self.session.flush()
            logger.info(f"Expired {count} overdue inventory hold(s) at {check_time.isoformat()}")

        return count

    async def confirm_booking(
        self,
        user_id: str,
        hold_ids: List[str],
        idempotency_key: str,
        currency: str = "INR",
        payment_method: str = "credit_card",
        simulate_payment_failure: bool = False,
        correlation_id: Optional[str] = None
    ) -> Booking:
        """
        Confirms a booking backed by one or more active holds.
        1. Checks idempotency: if booking already exists for key, returns it.
        2. Validates all holds: active, unexpired, belonging to user_id.
        3. Locks each inventory row, decrements held_units, increments booked_units.
        4. Simulates payment authorization:
           - On success: records captured Payment, marks Booking confirmed.
           - On failure: marks Booking failed, marks Payment failed, compensates holds.
        """
        if not hold_ids:
            raise ValueError("Cannot confirm booking without at least one hold identifier.")

        # 1. Idempotency Check
        existing_booking = await self.booking_repo.get_by_idempotency_key(idempotency_key)
        if existing_booking is not None:
            logger.info(
                f"Booking idempotency replay for key '{idempotency_key}': "
                f"returning reference '{existing_booking.booking_reference}' [correlation_id={correlation_id}]"
            )
            return existing_booking

        # 2. Validate all holds inside transaction
        holds: List[Hold] = []
        now = datetime.now(timezone.utc)

        for hid in hold_ids:
            hold = await self.hold_repo.get_by_id(hid)
            if hold is None:
                raise ValueError(f"Hold '{hid}' not found.")
            if hold.user_id != user_id:
                raise ValueError(f"Hold '{hid}' belongs to user '{hold.user_id}', not '{user_id}'.")
            if hold.status != "active":
                raise ValueError(f"Hold '{hid}' is not active (current status: '{hold.status}').")
            if hold.expires_at <= now:
                raise ValueError(f"Hold '{hid}' expired at {hold.expires_at.isoformat()}.")
            holds.append(hold)

        # 3. Calculate financial totals and prepare items
        total_amount = Decimal("0.00")
        booking_id = f"bkg_{uuid.uuid4().hex[:8]}"
        booking_ref = f"KS-BKG-{uuid.uuid4().hex[:6].upper()}"

        items: List[BookingItem] = []
        locked_inventories: List[InventoryCalendar] = []

        for hold in holds:
            inv = await self.inventory_repo.lock_by_id(hold.inventory_id)
            locked_inventories.append(inv)
            line_total = Decimal(str(inv.price)) * Decimal(hold.units)
            total_amount += line_total

            item = BookingItem(
                booking_item_id=f"bki_{uuid.uuid4().hex[:8]}",
                booking_id=booking_id,
                entity_type=inv.entity_type,
                entity_id=inv.entity_id,
                inventory_id=inv.inventory_id,
                title=f"{inv.entity_type.replace('_', ' ').title()} ({inv.entity_id})",
                for_date=inv.for_date,
                units=hold.units,
                unit_price=inv.price,
                line_total=line_total,
                currency=currency,
                status="pending",
                compensated_at=None,
                updated_at=now
            )
            items.append(item)

        # 4. Handle Payment & Compensation
        payment_id = f"pay_{uuid.uuid4().hex[:8]}"
        payment_idem = f"pay_{idempotency_key}"

        if simulate_payment_failure:
            # Payment failed -> Compensate holds
            logger.warning(
                f"Simulated payment failure triggered for booking '{booking_id}'. "
                f"Initiating saga compensation for {len(holds)} hold(s)... [correlation_id={correlation_id}]"
            )
            for hold in holds:
                await self.inventory_repo.release_held_units(hold.inventory_id, hold.units)
                hold.status = "released"
                hold.released_at = now
                hold.updated_at = now

            for item in items:
                item.status = "compensated"
                item.compensated_at = now

            failed_booking = Booking(
                booking_id=booking_id,
                user_id=user_id,
                booking_reference=booking_ref,
                channel="web_journey_orchestrator",
                total_amount=total_amount,
                currency=currency,
                tax_amount=Decimal("0.00"),
                idempotency_key=idempotency_key,
                status="failed",
                confirmed_at=None,
                cancelled_at=now,
                cancellation_reason="Payment authorization failed: simulated payment gateway decline",
                created_at=now,
                updated_at=now
            )
            await self.booking_repo.create_booking(failed_booking, items)

            payment = Payment(
                payment_id=payment_id,
                booking_id=booking_id,
                method=payment_method,
                status="failed",
                authorised_amount=Decimal("0.00"),
                captured_amount=Decimal("0.00"),
                refunded_amount=Decimal("0.00"),
                currency=currency,
                gateway_reference=f"gw_fail_{uuid.uuid4().hex[:8]}",
                idempotency_key=payment_idem,
                failure_code="SIMULATED_PAYMENT_FAILURE",
                authorised_at=None,
                captured_at=None,
                created_at=now,
                updated_at=now
            )
            await self.payment_repo.create_payment(payment)
            await self.session.flush()

            raise RepositoryConflictError(
                f"Booking '{booking_ref}' failed due to payment decline. "
                f"All {len(holds)} inventory holds have been safely compensated and released."
            )

        # Successful path: transition held -> booked
        for hold, inv in zip(holds, locked_inventories):
            inv.held_units = max(0, inv.held_units - hold.units)
            inv.booked_units += hold.units
            hold.status = "converted"
            hold.booking_id = booking_id
            hold.updated_at = now

        for item in items:
            item.status = "confirmed"

        booking = Booking(
            booking_id=booking_id,
            user_id=user_id,
            booking_reference=booking_ref,
            channel="web_journey_orchestrator",
            total_amount=total_amount,
            currency=currency,
            tax_amount=Decimal("0.00"),
            idempotency_key=idempotency_key,
            status="confirmed",
            confirmed_at=now,
            cancelled_at=None,
            cancellation_reason=None,
            created_at=now,
            updated_at=now
        )
        await self.booking_repo.create_booking(booking, items)

        payment = Payment(
            payment_id=payment_id,
            booking_id=booking_id,
            method=payment_method,
            status="captured",
            authorised_amount=total_amount,
            captured_amount=total_amount,
            refunded_amount=Decimal("0.00"),
            currency=currency,
            gateway_reference=f"gw_{uuid.uuid4().hex[:8]}",
            idempotency_key=payment_idem,
            failure_code=None,
            authorised_at=now,
            captured_at=now,
            created_at=now,
            updated_at=now
        )
        await self.payment_repo.create_payment(payment)
        await self.session.flush()

        logger.info(
            f"Booking '{booking_ref}' successfully confirmed with {len(items)} item(s) "
            f"for amount {currency} {total_amount} [correlation_id={correlation_id}]"
        )
        return booking

    async def cancel_booking(
        self,
        booking_id: str,
        reason: str = "User requested cancellation"
    ) -> Booking:
        """
        Cancels a confirmed booking, restoring booked units to available inventory,
        marking booking items as compensated, and recording payment refund.
        """
        stmt = (
            select(Booking)
            .options(selectinload(Booking.booking_items))
            .where(Booking.booking_id == booking_id)
        )
        res = await self.session.execute(stmt)
        booking = res.scalar_one_or_none()
        if booking is None:
            raise ValueError(f"Booking id '{booking_id}' not found.")

        if booking.status != "confirmed":
            logger.info(f"Booking '{booking_id}' is already in status '{booking.status}'; no cancellation needed.")
            return booking

        now = datetime.now(timezone.utc)

        # Release booked units for each confirmed item
        for item in booking.booking_items:
            if item.status == "confirmed" and item.inventory_id:
                inv = await self.inventory_repo.lock_by_id(item.inventory_id)
                inv.booked_units = max(0, inv.booked_units - item.units)
                item.status = "compensated"
                item.compensated_at = now
                item.updated_at = now

        booking.status = "cancelled"
        booking.cancelled_at = now
        booking.cancellation_reason = reason
        booking.updated_at = now

        # Record payment refund if payment was captured
        payments = await self.payment_repo.list_by_booking_id(booking_id)
        for pay in payments:
            if pay.status == "captured":
                pay.status = "refunded"
                pay.refunded_amount = pay.captured_amount
                pay.updated_at = now

        await self.session.flush()
        logger.info(f"Cancelled booking '{booking_id}' (reference '{booking.booking_reference}'). Reason: {reason}")
        return booking
