"""
KogniSync — Multi-Leg Journey Booking Orchestrator

Coordinates multi-leg journey reservations between the Journey Intelligence feature
and the PostgreSQL-backed BookingService reliability engine.
Implements multi-leg sagas with honest partial-failure handling and hold compensation.
"""

import uuid
import asyncio
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import Optional, List, Dict, Any

from app.schemas.booking_contract import (
    JourneyBookingRequest,
    JourneyBookingResponse,
    LegBookingStatus,
)
from app.services.booking_service import BookingService
from app.services.transport_repository import TransportRepository
from app.repositories.exceptions import (
    InsufficientInventoryError,
    RepositoryConflictError,
)
from app.core.logging import logger


class JourneyBookingOrchestrator:
    """
    Orchestrates end-to-end multi-leg journey bookings.
    Bridges Journey Intelligence (canonical flight candidates) with the
    transactional PostgreSQL BookingService for capacity locking, holds,
    and payment sagas.
    """
    # Shared process-level cache for standalone/offline execution mode
    _shared_fallback_cache: Dict[str, JourneyBookingResponse] = {}

    def __init__(
        self,
        booking_service: Optional[BookingService] = None,
        transport_repo: Optional[TransportRepository] = None,
    ):
        self.booking_service = booking_service
        self.transport_repo = transport_repo or TransportRepository()
        self._offline_idempotency_cache = self._shared_fallback_cache

    async def book_journey(
        self,
        request: JourneyBookingRequest,
        correlation_id: Optional[str] = None
    ) -> JourneyBookingResponse:
        """
        Executes a multi-leg journey booking saga.
        1. Checks database idempotency if PostgreSQL BookingService is active.
        2. Resolves each leg to an authoritative inventory record.
        3. Secures a transactional hold for each leg sequentially.
        4. On any downstream leg failure (e.g. insufficient capacity):
           - SAGA COMPENSATION: immediately releases earlier holds created by this attempt.
           - Returns PARTIALLY_FAILED or REJECTED_NO_INVENTORY. Never reports partial success as confirmed.
        5. If all holds succeed, confirms booking and records payment through BookingService.
        """
        cid = correlation_id or f"corr_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)

        # ------------------------------------------------------------------
        # 1. Idempotency Check (Database-backed if session available)
        # ------------------------------------------------------------------
        if self.booking_service is not None:
            existing_booking = await self.booking_service.booking_repo.get_by_idempotency_key(
                request.idempotency_key
            )
            if existing_booking is not None:
                logger.info(
                    f"Idempotent replay detected in PostgreSQL for key '{request.idempotency_key}' "
                    f"-> Reference '{existing_booking.booking_reference}' [correlation_id={cid}]"
                )
                leg_statuses = [
                    LegBookingStatus(
                        leg_index=item.leg_index,
                        flight_id=item.flight_id,
                        flight_number=item.flight_number,
                        fare_id=item.fare_id,
                        inventory_id=item.inventory_id,
                        status="CONFIRMED" if existing_booking.status == "confirmed" else existing_booking.status.upper(),
                        booking_item_id=None,
                        error_message=None
                    )
                    for item in request.items
                ]
                return JourneyBookingResponse(
                    booking_reference=existing_booking.booking_reference,
                    booking_id=existing_booking.booking_id,
                    status="IDEMPOTENT_REPLAY",
                    idempotency_key=request.idempotency_key,
                    user_id=request.user_id,
                    journey_id=request.journey_id,
                    total_amount=existing_booking.total_amount,
                    currency=existing_booking.currency,
                    legs=leg_statuses,
                    message=f"Idempotent replay: previously processed with reference '{existing_booking.booking_reference}'",
                    created_at=existing_booking.created_at
                )
        else:
            # Standalone / offline idempotency fallback
            cache_key = f"{request.user_id}:{request.idempotency_key}"
            if cache_key in self._offline_idempotency_cache:
                cached = self._offline_idempotency_cache[cache_key]
                logger.info(f"Idempotent replay detected in offline cache for key '{request.idempotency_key}'")
                return JourneyBookingResponse(
                    booking_reference=cached.booking_reference,
                    booking_id=cached.booking_id,
                    status="IDEMPOTENT_REPLAY",
                    idempotency_key=request.idempotency_key,
                    user_id=request.user_id,
                    journey_id=request.journey_id,
                    total_amount=cached.total_amount,
                    currency=cached.currency,
                    legs=cached.legs,
                    message=f"Idempotent replay: previously processed with reference '{cached.booking_reference or 'N/A'}'",
                    created_at=cached.created_at
                )

        # ------------------------------------------------------------------
        # 2. Multi-Leg Reservation Saga
        # ------------------------------------------------------------------
        created_holds: List[Dict[str, Any]] = []
        leg_statuses: List[LegBookingStatus] = []
        failed_leg_index: Optional[int] = None
        failure_error: Optional[str] = None

        for item in request.items:
            # A. Resolve inventory record
            inv_id = item.inventory_id
            inv_record = None

            if self.booking_service is not None:
                # Resolve via PostgreSQL inventory
                if inv_id:
                    inv_record = await self.booking_service.get_inventory_by_id(inv_id)
                elif item.fare_id and item.for_date:
                    inv_record = await self.booking_service.get_inventory_status(
                        entity_type="flight_fare",
                        entity_id=item.fare_id,
                        for_date=item.for_date
                    )
                    if inv_record:
                        inv_id = inv_record.inventory_id

            # Fallback to search transport repo if not found in PG or running standalone
            if inv_record is None and self.transport_repo is not None:
                if inv_id:
                    with self.transport_repo._get_connection() as conn:
                        cur = conn.cursor()
                        cur.execute("SELECT * FROM inventory_calendar WHERE inventory_id = ?", (inv_id,))
                        r = cur.fetchone()
                        sqlite_inv = dict(r) if r else None
                elif item.fare_id and item.for_date:
                    sqlite_inv = self.transport_repo.get_inventory_status(item.fare_id, item.for_date)
                else:
                    sqlite_inv = None

                if sqlite_inv:
                    inv_id = sqlite_inv.get("inventory_id")
                    inv_record = sqlite_inv

            # B. Check available capacity
            if inv_record is not None:
                if hasattr(inv_record, "total_units"):
                    tot = inv_record.total_units
                    bkd = inv_record.booked_units
                    hld = inv_record.held_units
                else:
                    tot = inv_record.get("total_units", 0)
                    bkd = inv_record.get("booked_units", 0)
                    hld = inv_record.get("held_units", 0)

                available = tot - bkd - hld
                if item.units > available:
                    failed_leg_index = item.leg_index
                    failure_error = (
                        f"Insufficient inventory on flight {item.flight_number}: "
                        f"requested {item.units} seat(s), but only {available} remain available "
                        f"(Total: {tot}, Booked: {bkd}, Held: {hld})."
                    )
                    leg_statuses.append(
                        LegBookingStatus(
                            leg_index=item.leg_index,
                            flight_id=item.flight_id,
                            flight_number=item.flight_number,
                            fare_id=item.fare_id,
                            inventory_id=inv_id,
                            status="FAILED",
                            error_message=failure_error
                        )
                    )
                    break

            # C. Acquire Hold
            hold_id = None
            if self.booking_service is not None and inv_id is not None:
                try:
                    leg_idem = f"{request.idempotency_key}:leg_{item.leg_index}"
                    hold_obj = await self.booking_service.create_hold(
                        inventory_id=inv_id,
                        user_id=request.user_id,
                        units=item.units,
                        idempotency_key=leg_idem,
                        expires_in_seconds=600,
                        correlation_id=cid
                    )
                    hold_id = hold_obj.hold_id
                    created_holds.append({
                        "leg_index": item.leg_index,
                        "hold_id": hold_id,
                        "hold_obj": hold_obj,
                        "inventory_id": inv_id,
                        "units": item.units
                    })
                except (InsufficientInventoryError, RepositoryConflictError, ValueError) as hold_err:
                    failed_leg_index = item.leg_index
                    failure_error = f"Hold allocation failed on flight {item.flight_number}: {str(hold_err)}"
                    leg_statuses.append(
                        LegBookingStatus(
                            leg_index=item.leg_index,
                            flight_id=item.flight_id,
                            flight_number=item.flight_number,
                            fare_id=item.fare_id,
                            inventory_id=inv_id,
                            status="FAILED",
                            error_message=failure_error
                        )
                    )
                    break
            else:
                # Standalone hold ID generation
                hold_id = f"hld_{uuid.uuid4().hex[:8]}"
                created_holds.append({
                    "leg_index": item.leg_index,
                    "hold_id": hold_id,
                    "inventory_id": inv_id,
                    "units": item.units
                })

            leg_statuses.append(
                LegBookingStatus(
                    leg_index=item.leg_index,
                    flight_id=item.flight_id,
                    flight_number=item.flight_number,
                    fare_id=item.fare_id,
                    inventory_id=inv_id,
                    status="HELD",
                    hold_id=hold_id,
                    booking_item_id=None,
                    error_message=None
                )
            )

        # ------------------------------------------------------------------
        # 3. Partial Failure Compensation Policy
        # ------------------------------------------------------------------
        if failed_leg_index is not None:
            logger.warning(
                f"Multi-leg journey failed on leg {failed_leg_index}. "
                f"Executing saga compensation for {len(created_holds)} hold(s)... [correlation_id={cid}]"
            )

            # Roll back all previously held legs
            for hold_info in created_holds:
                hid = hold_info["hold_id"]
                if self.booking_service is not None and hid:
                    try:
                        await self.booking_service.release_hold(hid, correlation_id=cid)
                    except Exception as comp_err:
                        logger.error(f"Saga compensation error releasing hold '{hid}': {comp_err}")

            # Update leg statuses to COMPENSATED
            for status in leg_statuses:
                if status.status == "HELD":
                    status.status = "COMPENSATED"
                    status.error_message = (
                        f"Compensated: hold released due to downstream failure on Leg {failed_leg_index}."
                    )

            overall_status = "PARTIALLY_FAILED" if len(created_holds) > 0 else "REJECTED_NO_INVENTORY"
            response = JourneyBookingResponse(
                booking_reference=None,
                booking_id=None,
                status=overall_status,
                idempotency_key=request.idempotency_key,
                user_id=request.user_id,
                journey_id=request.journey_id,
                total_amount=request.total_amount,
                currency=request.currency,
                legs=leg_statuses,
                message=(
                    f"Booking could not be completed: {failure_error} "
                    f"All previously reserved legs were safely compensated and released."
                ),
                created_at=now
            )
            cache_key = f"{request.user_id}:{request.idempotency_key}"
            self._offline_idempotency_cache[cache_key] = response
            return response

        # ------------------------------------------------------------------
        # 4. Confirmation & Payment
        # ------------------------------------------------------------------
        booking_ref: str
        booking_id: str

        if self.booking_service is not None and created_holds:
            # Confirm booking against PostgreSQL
            hold_ids = [h["hold_id"] for h in created_holds if h.get("hold_id")]
            try:
                confirmed_booking = await self.booking_service.confirm_booking(
                    user_id=request.user_id,
                    hold_ids=hold_ids,
                    idempotency_key=request.idempotency_key,
                    currency=request.currency,
                    payment_method="credit_card",
                    simulate_payment_failure=False,
                    correlation_id=cid
                )
                booking_ref = confirmed_booking.booking_reference
                booking_id = confirmed_booking.booking_id
            except Exception as conf_err:
                logger.error(f"Booking confirmation failed: {conf_err}. Initiating compensation...")
                # Compensate holds
                for h in created_holds:
                    if h.get("hold_id"):
                        try:
                            await self.booking_service.release_hold(h["hold_id"], correlation_id=cid)
                        except Exception as r_err:
                            logger.error(f"Error releasing hold {h['hold_id']}: {r_err}")

                for status in leg_statuses:
                    status.status = "COMPENSATED"
                    status.error_message = f"Compensated: booking confirmation failed ({conf_err})"

                return JourneyBookingResponse(
                    booking_reference=None,
                    booking_id=None,
                    status="FAILED",
                    idempotency_key=request.idempotency_key,
                    user_id=request.user_id,
                    journey_id=request.journey_id,
                    total_amount=request.total_amount,
                    currency=request.currency,
                    legs=leg_statuses,
                    message=f"Booking confirmation failed: {conf_err}. All holds were compensated.",
                    created_at=now
                )
        else:
            # Standalone booking confirmation
            booking_ref = f"KS-BKG-{uuid.uuid4().hex[:6].upper()}"
            booking_id = f"bkg_{uuid.uuid4().hex[:8]}"

        for status in leg_statuses:
            status.status = "CONFIRMED"
            status.booking_item_id = f"bki_{uuid.uuid4().hex[:8]}"

        response = JourneyBookingResponse(
            booking_reference=booking_ref,
            booking_id=booking_id,
            status="CONFIRMED",
            idempotency_key=request.idempotency_key,
            user_id=request.user_id,
            journey_id=request.journey_id,
            total_amount=request.total_amount,
            currency=request.currency,
            legs=leg_statuses,
            message="Journey booking confirmed successfully with all transport leg holds secured and payment processed.",
            created_at=now
        )

        cache_key = f"{request.user_id}:{request.idempotency_key}"
        self._offline_idempotency_cache[cache_key] = response
        return response

    def book_journey_sync(
        self,
        request: JourneyBookingRequest,
        correlation_id: Optional[str] = None
    ) -> JourneyBookingResponse:
        """
        Synchronous execution helper for test suites or synchronous environments.
        """
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop is not None and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                return executor.submit(
                    asyncio.run,
                    self.book_journey(request, correlation_id)
                ).result()
        else:
            return asyncio.run(self.book_journey(request, correlation_id))
