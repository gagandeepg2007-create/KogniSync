import asyncio
import pytest
import uuid
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from typing import List

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select, delete

from app.core.config import settings
from app.db.models.inventory import InventoryCalendar, Hold
from app.db.models.booking import Booking, BookingItem
from app.db.models.payment import Payment
from app.db.models.travel import User
from app.services.booking_service import BookingService
from app.db.queries.invariant_checker import check_inventory_invariants
from app.repositories import (
    InsufficientInventoryError,
    IdempotencyPayloadConflictError,
    HoldNotFoundError,
    HoldExpiredError,
    PaymentFailedError
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def session_factory():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    yield factory
    await engine.dispose()


@pytest.fixture
async def test_user_id(session_factory):
    async with session_factory() as session:
        stmt = select(User.user_id).limit(1)
        res = await session.execute(stmt)
        return res.scalar_one()


async def create_test_inventory(session: AsyncSession, total_units: int = 3) -> str:
    """Helper to create an isolated test inventory row with known capacity."""
    inv_id = f"inv_test_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    item = InventoryCalendar(
        inventory_id=inv_id,
        entity_type="room_type",
        entity_id=f"rmt_test_{uuid.uuid4().hex[:8]}",
        for_date=date(2026, 11, 1),
        total_units=total_units,
        booked_units=0,
        held_units=0,
        price=Decimal("150.00"),
        currency="USD",
        min_stay_nights=1,
        closed_to_arrival=False,
        updated_at=now
    )
    session.add(item)
    await session.commit()
    return inv_id


# ---------------------------------------------------------------------------
# Test A: Single allocation
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_a_single_allocation(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        hold = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=1,
            idempotency_key=f"idemp_{uuid.uuid4().hex[:12]}",
            correlation_id=f"corr_{uuid.uuid4().hex[:12]}"
        )
        assert hold.status == "active"
        assert hold.units == 1

        # Invariant check
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test B: Inventory exhaustion
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_b_inventory_exhaustion(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        # Allocate 3 units successfully
        for i in range(3):
            await service.create_hold(
                inventory_id=inv_id,
                user_id=test_user_id,
                units=1,
                idempotency_key=f"idemp_seq_{i}_{uuid.uuid4().hex[:8]}",
                correlation_id=f"corr_seq_{i}"
            )

        # 4th request must be rejected
        with pytest.raises(InsufficientInventoryError):
            await service.create_hold(
                inventory_id=inv_id,
                user_id=test_user_id,
                units=1,
                idempotency_key=f"idemp_seq_4_{uuid.uuid4().hex[:8]}",
                correlation_id="corr_seq_4"
            )

        # Check database invariant
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test C: Concurrent contention
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_c_concurrent_contention(session_factory, test_user_id):
    # Setup inventory: 3 units
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)

    # Launch 25 concurrent requests for 1 unit across separate sessions
    concurrent_requests = 25

    async def attempt_hold(idx: int):
        async with session_factory() as sess:
            srv = BookingService(sess)
            try:
                hold = await srv.create_hold(
                    inventory_id=inv_id,
                    user_id=test_user_id,
                    units=1,
                    idempotency_key=f"idemp_c_{idx}_{uuid.uuid4().hex[:8]}",
                    correlation_id=f"corr_c_{idx}"
                )
                return ("SUCCESS", hold.hold_id)
            except InsufficientInventoryError:
                return ("REJECTED", None)
            except Exception as e:
                return ("ERROR", str(e))

    results = await asyncio.gather(*(attempt_hold(i) for i in range(concurrent_requests)))

    successes = [r for r in results if r[0] == "SUCCESS"]
    rejections = [r for r in results if r[0] == "REJECTED"]
    errors = [r for r in results if r[0] == "ERROR"]

    assert len(errors) == 0, f"Unexpected errors during concurrent hold: {errors}"
    assert len(successes) == 3, f"Expected exactly 3 successful allocations, got {len(successes)}"
    assert len(rejections) == concurrent_requests - 3

    # Check database invariant
    async with session_factory() as session:
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test D: Mixed quantities
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_d_mixed_quantities(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)

    # Requests for quantities: 2, 2, 1, 3
    quantities = [2, 2, 1, 3]

    async def attempt_qty(idx: int, qty: int):
        async with session_factory() as sess:
            srv = BookingService(sess)
            try:
                hold = await srv.create_hold(
                    inventory_id=inv_id,
                    user_id=test_user_id,
                    units=qty,
                    idempotency_key=f"idemp_d_{idx}_{uuid.uuid4().hex[:8]}",
                    correlation_id=f"corr_d_{idx}"
                )
                return ("SUCCESS", qty)
            except InsufficientInventoryError:
                return ("REJECTED", qty)

    results = await asyncio.gather(*(attempt_qty(i, q) for i, q in enumerate(quantities)))
    allocated_units = sum(r[1] for r in results if r[0] == "SUCCESS")

    assert allocated_units <= 3, f"Allocated units {allocated_units} exceeds capacity 3!"

    # Invariant check
    async with session_factory() as session:
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test E: Idempotent retries
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_e_idempotent_retries(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        key = f"idemp_retry_{uuid.uuid4().hex[:12]}"
        payload = {"inventory_id": inv_id, "user_id": "usr_00000001", "units": 1}

        # First request
        hold1 = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=1,
            idempotency_key=key,
            correlation_id="corr_1",
            payload_dict=payload
        )

        # Retry with identical key and payload
        hold2 = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=1,
            idempotency_key=key,
            correlation_id="corr_2",
            payload_dict=payload
        )

        assert hold1.hold_id == hold2.hold_id

        # Retry with same key but conflicting payload must raise IdempotencyPayloadConflictError
        conflicting_payload = {"inventory_id": inv_id, "user_id": "usr_00000001", "units": 2}
        with pytest.raises(IdempotencyPayloadConflictError):
            await service.create_hold(
                inventory_id=inv_id,
                user_id=test_user_id,
                units=2,
                idempotency_key=key,
                correlation_id="corr_3",
                payload_dict=conflicting_payload
            )

        # Verify invariant
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test F: Duplicate concurrent idempotency keys
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_f_duplicate_concurrent_idempotency_keys(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)

    shared_key = f"shared_idemp_{uuid.uuid4().hex[:12]}"
    payload = {"inventory_id": inv_id, "user_id": "usr_00000001", "units": 1}

    async def attempt_with_shared_key(idx: int):
        async with session_factory() as sess:
            srv = BookingService(sess)
            hold = await srv.create_hold(
                inventory_id=inv_id,
                user_id=test_user_id,
                units=1,
                idempotency_key=shared_key,
                correlation_id=f"corr_shared_{idx}",
                payload_dict=payload
            )
            return hold.hold_id

    # Launch 5 concurrent calls with same idempotency key
    hold_ids = await asyncio.gather(*(attempt_with_shared_key(i) for i in range(5)))

    # All 5 calls must resolve to the EXACT SAME hold_id
    assert len(set(hold_ids)) == 1, f"Multiple hold IDs created for same key: {set(hold_ids)}"

    # Database invariant must show exactly 1 unit held
    async with session_factory() as session:
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test G: Hold expiration
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_g_hold_expiration(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        # Create hold with 1 second TTL
        hold = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=2,
            idempotency_key=f"idemp_exp_{uuid.uuid4().hex[:8]}",
            correlation_id="corr_exp_test",
            ttl_seconds=1
        )
        assert hold.status == "active"

        # Check inventory shows 2 held units
        inv_status = await service.get_inventory_status(inv_id)
        assert inv_status["held_units"] == 2
        assert inv_status["available_units"] == 1

        # Simulate time passing beyond expiration
        future_time = datetime.now(timezone.utc) + timedelta(seconds=10)
        expired_ids = await service.expire_holds(as_of_time=future_time, inventory_id=inv_id)
        assert hold.hold_id in expired_ids

        # Re-check inventory: held units restored to 0, available units back to 3
        inv_status_after = await service.get_inventory_status(inv_id)
        assert inv_status_after["held_units"] == 0
        assert inv_status_after["available_units"] == 3

        # Invariant check
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test H: Payment failure and compensation
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_h_payment_failure_and_compensation(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        # Create an active hold
        hold = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=1,
            idempotency_key=f"idemp_pay_fail_{uuid.uuid4().hex[:8]}",
            correlation_id="corr_pay_fail"
        )
        assert hold.status == "active"

        # Attempt confirmation with simulated payment failure
        with pytest.raises(PaymentFailedError):
            await service.confirm_booking(
                hold_id=hold.hold_id,
                user_id=test_user_id,
                payment_method="card",
                idempotency_key=f"idemp_confirm_fail_{uuid.uuid4().hex[:8]}",
                correlation_id="corr_confirm_fail",
                simulate_payment_failure=True,
                payment_failure_code="insufficient_funds"
            )

        # Verify compensation: hold released and capacity restored to available
        inv_status = await service.get_inventory_status(inv_id)
        assert inv_status["held_units"] == 0
        assert inv_status["booked_units"] == 0
        assert inv_status["available_units"] == 3

        # Invariant check
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test I: Cancellation or release
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_i_cancellation_and_release(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        # 1. Test explicit hold release
        hold = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=1,
            idempotency_key=f"idemp_rel_{uuid.uuid4().hex[:8]}",
            correlation_id="corr_rel"
        )
        released_hold = await service.release_hold(hold.hold_id, correlation_id="corr_rel_do")
        assert released_hold.status == "released"
        inv1 = await service.get_inventory_status(inv_id)
        assert inv1["available_units"] == 3

        # 2. Test booking confirmation followed by cancellation
        hold2 = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=2,
            idempotency_key=f"idemp_bkg_{uuid.uuid4().hex[:8]}",
            correlation_id="corr_bkg"
        )
        booking = await service.confirm_booking(
            hold_id=hold2.hold_id,
            user_id=test_user_id,
            idempotency_key=f"idemp_bkg_confirm_{uuid.uuid4().hex[:8]}",
            correlation_id="corr_bkg_confirm",
            simulate_payment_failure=False
        )
        assert booking.status == "confirmed"
        inv2 = await service.get_inventory_status(inv_id)
        assert inv2["booked_units"] == 2
        assert inv2["available_units"] == 1

        # Cancel booking and verify capacity restored
        cancelled_bkg = await service.cancel_booking(booking.booking_id, correlation_id="corr_cancel")
        assert cancelled_bkg.status == "cancelled"
        inv3 = await service.get_inventory_status(inv_id)
        assert inv3["booked_units"] == 0
        assert inv3["available_units"] == 3

        # Invariant check
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test J: Failure injection
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_j_failure_injection(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)

        # Attempt to hold invalid/excessive units inside a failed transaction
        with pytest.raises(InsufficientInventoryError):
            await service.create_hold(
                inventory_id=inv_id,
                user_id=test_user_id,
                units=100,  # exceeds 3
                idempotency_key=f"idemp_fail_inj_{uuid.uuid4().hex[:8]}",
                correlation_id="corr_fail_inj"
            )

        # Inventory must remain completely pristine (0 held, 0 booked, 3 available)
        inv = await service.get_inventory_status(inv_id)
        assert inv["held_units"] == 0
        assert inv["booked_units"] == 0
        assert inv["available_units"] == 3

        # Invariant check
        audit = await check_inventory_invariants(session, inventory_id=inv_id)
        assert audit["passed"] is True
        assert audit["total_violations"] == 0


# ---------------------------------------------------------------------------
# Test K: Lifecycle consistency
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_k_lifecycle_consistency(session_factory, test_user_id):
    async with session_factory() as session:
        inv_id = await create_test_inventory(session, total_units=3)
        service = BookingService(session)
        corr_id = f"corr_trace_{uuid.uuid4().hex[:12]}"

        # Step 1: Hold
        hold = await service.create_hold(
            inventory_id=inv_id,
            user_id=test_user_id,
            units=1,
            idempotency_key=f"idemp_trace_{uuid.uuid4().hex[:8]}",
            correlation_id=corr_id
        )

        # Step 2: Confirm
        booking = await service.confirm_booking(
            hold_id=hold.hold_id,
            user_id=test_user_id,
            idempotency_key=f"idemp_trace_confirm_{uuid.uuid4().hex[:8]}",
            correlation_id=corr_id,
            simulate_payment_failure=False
        )

        # Step 3: Cancel
        await service.cancel_booking(booking.booking_id, correlation_id=corr_id)

        # Fetch lifecycle event trail
        events = await service.get_events(corr_id)
        event_types = [e.event_type for e in events]

        assert "HOLD_CREATED" in event_types
        assert "BOOKING_CONFIRMED" in event_types
        assert "BOOKING_CANCELLED" in event_types

        # Verify all events share the exact correlation_id
        for ev in events:
            assert ev.correlation_id == corr_id


# ---------------------------------------------------------------------------
# Test L: Final database invariant
# ---------------------------------------------------------------------------
@pytest.mark.anyio
async def test_scenario_l_final_database_invariant(session_factory):
    async with session_factory() as session:
        # Check invariants across the entire database, not just isolated rows
        audit = await check_inventory_invariants(session)
        assert audit["passed"] is True, f"Invariant violations found: {audit['violations']}"
        assert audit["total_violations"] == 0
        assert audit["total_overallocated_units"] == 0
        assert audit["total_items_checked"] > 0
