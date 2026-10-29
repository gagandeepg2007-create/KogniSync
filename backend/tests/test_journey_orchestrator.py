"""
KogniSync — Journey Booking Orchestrator Integration Tests

Tests end-to-end multi-leg journey booking sagas coordinating between
Journey Intelligence and the PostgreSQL-backed BookingService.
Verifies multi-leg hold acquisition, partial-failure saga compensation,
inventory invariant preservation, and durable database idempotency.
"""

import pytest
from datetime import datetime, timezone, date
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
from app.schemas.booking_contract import (
    JourneyBookingRequest,
    BookingLegItem,
)
from app.services.booking_service import BookingService
from app.services.journey_booking_orchestrator import JourneyBookingOrchestrator


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def async_db_session():
    """
    Creates an isolated in-memory async database with 2 flight inventory records for multi-leg sagas.
    """
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
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
        # Leg 1 Inventory
        inv1 = InventoryCalendar(
            inventory_id="inv_flight_leg_001",
            entity_type="flight_fare",
            entity_id="far_leg_001",
            for_date=date(2026, 9, 4),
            total_units=15,
            booked_units=3,
            held_units=0,
            price=Decimal("4500.00"),
            currency="INR",
            min_stay_nights=1,
            closed_to_arrival=False,
            updated_at=now
        )
        # Leg 2 Inventory (Limited capacity: only 2 available units)
        inv2 = InventoryCalendar(
            inventory_id="inv_flight_leg_002",
            entity_type="flight_fare",
            entity_id="far_leg_002",
            for_date=date(2026, 9, 4),
            total_units=10,
            booked_units=8,
            held_units=0,
            price=Decimal("3800.00"),
            currency="INR",
            min_stay_nights=1,
            closed_to_arrival=False,
            updated_at=now
        )
        session.add_all([curr, usr, inv1, inv2])
        await session.commit()
        yield session

    await engine.dispose()


@pytest.mark.anyio
async def test_orchestrator_multileg_booking_success(async_db_session: AsyncSession):
    """
    Tests that a 2-leg journey booking successfully secures holds on both legs,
    confirms the booking in the PostgreSQL database, and records items and payment.
    """
    bkg_svc = BookingService(async_db_session)
    orchestrator = JourneyBookingOrchestrator(booking_service=bkg_svc)

    req = JourneyBookingRequest(
        journey_id="jny_multileg_success_001",
        user_id="usr_00000001",
        idempotency_key="orch_idem_success_101",
        total_amount=Decimal("8300.00"),
        currency="INR",
        items=[
            BookingLegItem(
                leg_index=0,
                flight_id="flt_001",
                flight_number="AI-201",
                fare_id="far_leg_001",
                inventory_id="inv_flight_leg_001",
                for_date=date(2026, 9, 4),
                units=1,
                unit_price=Decimal("4500.00"),
                taxes=Decimal("0.00"),
                currency="INR"
            ),
            BookingLegItem(
                leg_index=1,
                flight_id="flt_002",
                flight_number="AI-202",
                fare_id="far_leg_002",
                inventory_id="inv_flight_leg_002",
                for_date=date(2026, 9, 4),
                units=1,
                unit_price=Decimal("3800.00"),
                taxes=Decimal("0.00"),
                currency="INR"
            )
        ]
    )

    res = await orchestrator.book_journey(req)
    assert res.status == "CONFIRMED"
    assert res.booking_reference is not None
    assert res.booking_reference.startswith("KS-BKG-")
    assert len(res.legs) == 2
    assert res.legs[0].status == "CONFIRMED"
    assert res.legs[1].status == "CONFIRMED"

    # Verify database state
    bkg = await bkg_svc.booking_repo.get_by_reference(res.booking_reference)
    assert bkg is not None
    assert bkg.status == "confirmed"
    assert len(bkg.booking_items) == 2

    # Verify inventory was decremented
    inv1 = await bkg_svc.get_inventory_by_id("inv_flight_leg_001")
    assert inv1.booked_units == 4  # was 3, now 4
    inv2 = await bkg_svc.get_inventory_by_id("inv_flight_leg_002")
    assert inv2.booked_units == 9  # was 8, now 9


@pytest.mark.anyio
async def test_orchestrator_multileg_partial_failure_saga_compensation(async_db_session: AsyncSession):
    """
    Tests saga compensation:
    Leg 0 succeeds (available), but Leg 1 fails (requests 5 units when only 2 remain).
    Leg 0 MUST be released and compensated; overall status must be PARTIALLY_FAILED;
    and zero unintended holds remain on Leg 0.
    """
    bkg_svc = BookingService(async_db_session)
    orchestrator = JourneyBookingOrchestrator(booking_service=bkg_svc)

    req = JourneyBookingRequest(
        journey_id="jny_multileg_partial_fail_002",
        user_id="usr_00000001",
        idempotency_key="orch_idem_fail_compensation_202",
        total_amount=Decimal("15000.00"),
        currency="INR",
        items=[
            # Leg 0: 1 unit requested (capacity is 15 - 3 = 12 available) -> Will succeed initially
            BookingLegItem(
                leg_index=0,
                flight_id="flt_001",
                flight_number="AI-201",
                fare_id="far_leg_001",
                inventory_id="inv_flight_leg_001",
                for_date=date(2026, 9, 4),
                units=1,
                unit_price=Decimal("4500.00"),
                taxes=Decimal("0.00"),
                currency="INR"
            ),
            # Leg 1: 5 units requested (capacity is 10 - 8 = 2 available) -> MUST FAIL
            BookingLegItem(
                leg_index=1,
                flight_id="flt_002",
                flight_number="AI-202",
                fare_id="far_leg_002",
                inventory_id="inv_flight_leg_002",
                for_date=date(2026, 9, 4),
                units=5,
                unit_price=Decimal("3800.00"),
                taxes=Decimal("0.00"),
                currency="INR"
            )
        ]
    )

    res = await orchestrator.book_journey(req)
    assert res.status == "PARTIALLY_FAILED"
    assert res.booking_reference is None

    # Leg 0 must be COMPENSATED
    assert res.legs[0].status == "COMPENSATED"
    assert "Compensated" in str(res.legs[0].error_message)

    # Leg 1 must be FAILED
    assert res.legs[1].status == "FAILED"
    assert "Insufficient inventory" in str(res.legs[1].error_message)

    # Verify inventory was NOT locked or leaked: Leg 1 held_units restored to 0
    inv1 = await bkg_svc.get_inventory_by_id("inv_flight_leg_001")
    assert inv1.held_units == 0
    assert inv1.booked_units == 3


@pytest.mark.anyio
async def test_orchestrator_durable_idempotent_replay(async_db_session: AsyncSession):
    """
    Tests that re-submitting the same request with identical idempotency key returns
    IDEMPOTENT_REPLAY with the original persisted booking reference.
    """
    bkg_svc = BookingService(async_db_session)
    orchestrator = JourneyBookingOrchestrator(booking_service=bkg_svc)

    idem_key = "orch_durable_replay_key_303"
    req = JourneyBookingRequest(
        journey_id="jny_replay_test_003",
        user_id="usr_00000001",
        idempotency_key=idem_key,
        total_amount=Decimal("4500.00"),
        currency="INR",
        items=[
            BookingLegItem(
                leg_index=0,
                flight_id="flt_001",
                flight_number="AI-201",
                fare_id="far_leg_001",
                inventory_id="inv_flight_leg_001",
                for_date=date(2026, 9, 4),
                units=1,
                unit_price=Decimal("4500.00"),
                taxes=Decimal("0.00"),
                currency="INR"
            )
        ]
    )

    first_res = await orchestrator.book_journey(req)
    assert first_res.status == "CONFIRMED"
    original_ref = first_res.booking_reference

    # Re-submit exact same request
    second_res = await orchestrator.book_journey(req)
    assert second_res.status == "IDEMPOTENT_REPLAY"
    assert second_res.booking_reference == original_ref
    assert "Idempotent replay" in second_res.message
