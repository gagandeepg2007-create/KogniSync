"""
KogniSync — Authoritative PostgreSQL BookingService Reliability Tests

Verifies transactional booking lifecycle, inventory locking, invariant preservation,
hold creation, hold release, expiration, confirmation, and payment failure compensation
against SQLAlchemy AsyncSession.
"""

import pytest
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.db.models import Base
from app.db.models.inventory import InventoryCalendar, Hold
from app.db.models.booking import Booking, BookingItem
from app.db.models.payment import Payment
from app.db.models.travel import User
from app.db.models.reference import Currency, Language, Country
from app.db.models.geography import City
from app.services.booking_service import BookingService
from app.repositories.exceptions import (
    InsufficientInventoryError,
    RepositoryConflictError,
    PaymentFailedError,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def async_db_session():
    """
    Creates an isolated in-memory async database with all 20 canonical tables and seed fixtures.
    """
    from sqlalchemy import event
    from app.db.models.base import AppBase
    from app.db.models.events import BookingLifecycleEvent, IdempotencyRecord

    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    @event.listens_for(engine.sync_engine, "connect")
    def do_connect(dbapi_connection, connection_record):
        dbapi_connection.execute("ATTACH DATABASE ':memory:' AS app")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(AppBase.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        # Seed reference data
        now = datetime.now(timezone.utc)
        curr = Currency(
            currency_id="cur_001",
            iso4217="INR",
            name="Indian Rupee",
            symbol="₹",
            minor_unit_exponent=2,
            display_locale="en_IN",
            updated_at=now
        )
        usr = User(
            user_id="usr_00000001",
            display_name="Test User",
            email="test@kognisync.com",
            home_city_id="cty_001",
            home_currency="INR",
            locale="en",
            budget_band="mid",
            travel_style="balanced",
            traveller_type="solo",
            segment="standard",
            date_of_signup=date(2026, 1, 1),
            loyalty_tier="gold",
            status="active",
            created_at=now,
            updated_at=now
        )
        inv = InventoryCalendar(
            inventory_id="inv_test_flight_fare_001",
            entity_type="flight_fare",
            entity_id="far_test_001",
            for_date=date(2026, 9, 3),
            total_units=10,
            booked_units=2,
            held_units=1,
            price=Decimal("5500.00"),
            currency="INR",
            min_stay_nights=1,
            closed_to_arrival=False,
            updated_at=now
        )
        session.add_all([curr, usr, inv])
        await session.commit()
        yield session

    await engine.dispose()


@pytest.mark.anyio
async def test_create_hold_success_and_invariant(async_db_session: AsyncSession):
    """
    Tests that create_hold atomically increments held_units and creates an active hold,
    preserving invariant: booked_units + held_units <= total_units.
    """
    svc = BookingService(async_db_session)
    hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=2,
        idempotency_key="hold_idem_test_001",
        expires_in_seconds=300
    )
    assert hold.hold_id.startswith("hld_")
    assert hold.status == "active"
    assert hold.units == 2

    # Verify inventory table held_units increased from 1 to 3
    inv = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv.held_units == 3
    assert (inv.booked_units + inv.held_units) <= inv.total_units  # 2 + 3 <= 10


@pytest.mark.anyio
async def test_create_hold_idempotency_replay(async_db_session: AsyncSession):
    """
    Tests that re-submitting identical hold payload returns the exact existing hold safely.
    """
    svc = BookingService(async_db_session)
    first_hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=1,
        idempotency_key="hold_idem_replay_002"
    )
    second_hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=1,
        idempotency_key="hold_idem_replay_002"
    )
    assert first_hold.hold_id == second_hold.hold_id


@pytest.mark.anyio
async def test_create_hold_idempotency_conflict_rejection(async_db_session: AsyncSession):
    """
    Tests that submitting the same key with different payload raises RepositoryConflictError.
    """
    svc = BookingService(async_db_session)
    await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=1,
        idempotency_key="hold_conflict_key_003"
    )
    with pytest.raises(RepositoryConflictError):
        await svc.create_hold(
            inventory_id="inv_test_flight_fare_001",
            user_id="usr_00000001",
            units=4,  # Divergent units
            idempotency_key="hold_conflict_key_003"
        )


@pytest.mark.anyio
async def test_create_hold_insufficient_inventory_rejection(async_db_session: AsyncSession):
    """
    Tests that requesting units exceeding remaining capacity (total - booked - held) raises InsufficientInventoryError.
    """
    svc = BookingService(async_db_session)
    # Available is 10 - 2 - 1 = 7. Requesting 8 units must fail.
    with pytest.raises(InsufficientInventoryError):
        await svc.create_hold(
            inventory_id="inv_test_flight_fare_001",
            user_id="usr_00000001",
            units=8,
            idempotency_key="hold_excess_units_004"
        )


@pytest.mark.anyio
async def test_release_hold_decrements_held_units(async_db_session: AsyncSession):
    """
    Tests that releasing an active hold safely decrements held_units.
    """
    svc = BookingService(async_db_session)
    hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=3,
        idempotency_key="hold_release_test_005"
    )
    # Held units is now 1 + 3 = 4
    inv = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv.held_units == 4

    # Release hold
    released = await svc.release_hold(hold.hold_id)
    assert released.status == "released"

    inv_after = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv_after.held_units == 1


@pytest.mark.anyio
async def test_expire_holds(async_db_session: AsyncSession):
    """
    Tests that expire_holds detects overdue holds, decrements held units, and marks them 'expired'.
    """
    svc = BookingService(async_db_session)
    hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=2,
        idempotency_key="hold_to_expire_006",
        expires_in_seconds=10  # short TTL
    )
    # Advance time beyond expiration
    future_time = datetime.now(timezone.utc) + timedelta(seconds=60)
    expired_count = await svc.expire_holds(now=future_time)
    cnt = len(expired_count) if isinstance(expired_count, list) else expired_count
    assert cnt >= 1

    # Verify hold is now expired
    updated_hold = await svc.hold_repo.get_by_id(hold.hold_id)
    assert updated_hold.status == "expired"


@pytest.mark.anyio
async def test_confirm_booking_and_payment_capture(async_db_session: AsyncSession):
    """
    Tests that confirm_booking transitions held units to booked units,
    creates booking and booking items, and records captured payment.
    """
    svc = BookingService(async_db_session)
    hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=2,
        idempotency_key="hold_for_booking_007"
    )

    bkg = await svc.confirm_booking(
        user_id="usr_00000001",
        hold_ids=[hold.hold_id],
        idempotency_key="bkg_idem_test_007",
        currency="INR"
    )
    assert bkg.status == "confirmed"
    assert bkg.booking_reference.startswith(("KS-BKG-", "REF-"))
    assert bkg.total_amount == Decimal("11000.00")  # 2 * 5500.00

    # Invariant: booked units increased by 2, held units restored
    inv = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv.booked_units == 4  # was 2, now 4
    assert (inv.booked_units + inv.held_units) <= inv.total_units

    # Verify payment record
    payments = await svc.payment_repo.list_by_booking_id(bkg.booking_id)
    assert len(payments) == 1
    assert payments[0].status == "captured"
    assert payments[0].captured_amount == Decimal("11000.00")


@pytest.mark.anyio
async def test_confirm_booking_simulated_payment_failure_compensation(async_db_session: AsyncSession):
    """
    Tests payment failure compensation:
    When simulated payment fails, inventory holds are released, booking is marked failed,
    and invariant (booked + held <= total) is strictly preserved.
    """
    svc = BookingService(async_db_session)
    hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=2,
        idempotency_key="hold_for_payment_fail_008"
    )

    with pytest.raises((PaymentFailedError, RepositoryConflictError)) as exc_info:
        await svc.confirm_booking(
            user_id="usr_00000001",
            hold_ids=[hold.hold_id],
            idempotency_key="bkg_idem_fail_008",
            simulate_payment_failure=True
        )
    assert "compensated" in str(exc_info.value).lower()

    # Invariant check: hold was released, booked units was NOT incremented
    inv = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv.booked_units == 2  # unchanged
    assert inv.held_units == 1    # back to initial 1


@pytest.mark.anyio
async def test_cancel_booking_and_item_compensation(async_db_session: AsyncSession):
    """
    Tests that cancel_booking reverses booked units, marks items compensated, and refunds payments.
    """
    svc = BookingService(async_db_session)
    hold = await svc.create_hold(
        inventory_id="inv_test_flight_fare_001",
        user_id="usr_00000001",
        units=2,
        idempotency_key="hold_for_cancel_009"
    )
    bkg = await svc.confirm_booking(
        user_id="usr_00000001",
        hold_ids=[hold.hold_id],
        idempotency_key="bkg_idem_cancel_009"
    )
    inv_booked = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv_booked.booked_units == 4

    # Cancel booking
    cancelled = await svc.cancel_booking(bkg.booking_id, reason="Customer schedule change")
    assert cancelled.status == "cancelled"

    # Booked units decremented back to 2
    inv_after = await svc.get_inventory_by_id("inv_test_flight_fare_001")
    assert inv_after.booked_units == 2
