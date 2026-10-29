import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.booking_service import BookingService
from app.db.queries.invariant_checker import check_inventory_invariants
from app.repositories import (
    InventoryNotFoundError,
    InsufficientInventoryError,
    IdempotencyPayloadConflictError,
    HoldNotFoundError,
    HoldExpiredError,
    HoldNotActiveError,
    BookingNotFoundError,
    PaymentFailedError
)
from app.schemas.booking import (
    CreateHoldRequest,
    HoldResponse,
    ConfirmBookingRequest,
    BookingResponse,
    CancelBookingRequest,
    InventoryStatusResponse,
    LifecycleEventResponse,
    InvariantCheckResponse
)

router = APIRouter(prefix="/api/v1", tags=["Booking & Inventory"])


@router.post("/holds", response_model=HoldResponse, status_code=status.HTTP_201_CREATED)
async def create_hold(req: CreateHoldRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a temporary inventory hold backed by PostgreSQL row-level locking (SELECT ... FOR UPDATE).
    Enforces the central invariant: booked_units + held_units <= total_units.
    """
    correlation_id = req.correlation_id or f"corr_{uuid.uuid4().hex[:16]}"
    service = BookingService(db)
    try:
        hold = await service.create_hold(
            inventory_id=req.inventory_id,
            user_id=req.user_id,
            units=req.units,
            idempotency_key=req.idempotency_key,
            correlation_id=correlation_id,
            ttl_seconds=req.ttl_seconds,
            payload_dict=req.model_dump()
        )
        return HoldResponse(
            hold_id=hold.hold_id,
            inventory_id=hold.inventory_id,
            user_id=hold.user_id,
            units=hold.units,
            idempotency_key=hold.idempotency_key,
            created_at=hold.created_at,
            expires_at=hold.expires_at,
            status=hold.status
        )
    except InventoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except InsufficientInventoryError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except IdempotencyPayloadConflictError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("/holds/{hold_id}", response_model=HoldResponse)
async def get_hold(hold_id: str, db: AsyncSession = Depends(get_db)):
    service = BookingService(db)
    hold = await service.get_hold(hold_id)
    if not hold:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Hold '{hold_id}' not found")
    return HoldResponse(
        hold_id=hold.hold_id,
        inventory_id=hold.inventory_id,
        user_id=hold.user_id,
        units=hold.units,
        idempotency_key=hold.idempotency_key,
        created_at=hold.created_at,
        expires_at=hold.expires_at,
        status=hold.status
    )


@router.post("/holds/{hold_id}/release", response_model=HoldResponse)
async def release_hold(
    hold_id: str,
    correlation_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    corr = correlation_id or f"corr_rel_{uuid.uuid4().hex[:12]}"
    service = BookingService(db)
    try:
        hold = await service.release_hold(hold_id, correlation_id=corr)
        return HoldResponse(
            hold_id=hold.hold_id,
            inventory_id=hold.inventory_id,
            user_id=hold.user_id,
            units=hold.units,
            idempotency_key=hold.idempotency_key,
            created_at=hold.created_at,
            expires_at=hold.expires_at,
            status=hold.status
        )
    except HoldNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except HoldNotActiveError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/holds/expire", response_model=List[str])
async def trigger_hold_expiration(limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Triggers hold expiration sweep, safely releasing held inventory for elapsed holds.
    """
    service = BookingService(db)
    expired_ids = await service.expire_holds(limit=limit)
    return expired_ids


@router.post("/bookings/confirm", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def confirm_booking(req: ConfirmBookingRequest, db: AsyncSession = Depends(get_db)):
    """
    Confirms an active hold into a confirmed booking.
    Executes simulated payment processing and compensation if payment fails.
    """
    correlation_id = req.correlation_id or f"corr_bkg_{uuid.uuid4().hex[:12]}"
    service = BookingService(db)
    try:
        booking = await service.confirm_booking(
            hold_id=req.hold_id,
            user_id=req.user_id,
            payment_method=req.payment_method,
            idempotency_key=req.idempotency_key,
            correlation_id=correlation_id,
            simulate_payment_failure=req.simulate_payment_failure,
            payment_failure_code=req.payment_failure_code
        )
        return BookingResponse(
            booking_id=booking.booking_id,
            booking_reference=booking.booking_reference,
            user_id=booking.user_id,
            total_amount=booking.total_amount,
            currency=booking.currency,
            status=booking.status,
            confirmed_at=booking.confirmed_at
        )
    except HoldNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except (HoldExpiredError, HoldNotActiveError) as e:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=str(e))
    except PaymentFailedError as e:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=str(e))


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, db: AsyncSession = Depends(get_db)):
    service = BookingService(db)
    booking = await service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Booking '{booking_id}' not found")
    return BookingResponse(
        booking_id=booking.booking_id,
        booking_reference=booking.booking_reference,
        user_id=booking.user_id,
        total_amount=booking.total_amount,
        currency=booking.currency,
        status=booking.status,
        confirmed_at=booking.confirmed_at
    )


@router.post("/bookings/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    req: CancelBookingRequest,
    db: AsyncSession = Depends(get_db)
):
    correlation_id = req.correlation_id or f"corr_can_{uuid.uuid4().hex[:12]}"
    service = BookingService(db)
    try:
        booking = await service.cancel_booking(booking_id, correlation_id=correlation_id, reason=req.reason)
        return BookingResponse(
            booking_id=booking.booking_id,
            booking_reference=booking.booking_reference,
            user_id=booking.user_id,
            total_amount=booking.total_amount,
            currency=booking.currency,
            status=booking.status,
            confirmed_at=booking.confirmed_at
        )
    except BookingNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/inventory/{inventory_id}", response_model=InventoryStatusResponse)
async def get_inventory(inventory_id: str, db: AsyncSession = Depends(get_db)):
    service = BookingService(db)
    inv = await service.get_inventory_status(inventory_id)
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Inventory '{inventory_id}' not found")
    return InventoryStatusResponse(**inv)


@router.get("/events/{correlation_id}", response_model=List[LifecycleEventResponse])
async def get_lifecycle_events(correlation_id: str, db: AsyncSession = Depends(get_db)):
    service = BookingService(db)
    events = await service.get_events(correlation_id)
    return [
        LifecycleEventResponse(
            event_id=ev.event_id,
            event_type=ev.event_type,
            correlation_id=ev.correlation_id,
            inventory_id=ev.inventory_id,
            hold_id=ev.hold_id,
            booking_id=ev.booking_id,
            payment_id=ev.payment_id,
            user_id=ev.user_id,
            state_from=ev.state_from,
            state_to=ev.state_to,
            units=ev.units,
            metadata_json=ev.metadata_json,
            created_at=ev.created_at
        )
        for ev in events
    ]


@router.get("/reliability/invariant-check", response_model=InvariantCheckResponse)
async def run_invariant_check(
    inventory_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes live PostgreSQL inventory invariant check across all inventory items.
    Asserts: booked_units + held_units <= total_units.
    """
    res = await check_inventory_invariants(db, inventory_id=inventory_id)
    return InvariantCheckResponse(**res)
