import pytest
from datetime import date
from decimal import Decimal
from app.schemas.booking_contract import (
    JourneyBookingRequest,
    BookingLegItem,
)
from app.services.journey_booking_orchestrator import JourneyBookingOrchestrator
from app.services.transport_repository import TransportRepository


@pytest.fixture
def booking_service():
    return JourneyBookingOrchestrator()


def test_booking_contract_successful_confirmation(booking_service: JourneyBookingOrchestrator):
    """
    Tests that a valid booking request secures holds, confirms reservation,
    and returns an official booking reference.
    """
    req = JourneyBookingRequest(
        journey_id="jny_test_001",
        user_id="usr_00000001",
        idempotency_key="test_idem_success_123",
        total_amount=Decimal("6316.04"),
        currency="INR",
        items=[
            BookingLegItem(
                leg_index=0,
                flight_id="flt_test_1",
                flight_number="QF-9281",
                fare_id="far_test_1",
                inventory_id=None,
                for_date=date(2026, 9, 3),
                units=1,
                unit_price=Decimal("5500.00"),
                taxes=Decimal("816.04"),
                currency="INR"
            )
        ]
    )
    res = booking_service.book_journey_sync(req)
    assert res.status == "CONFIRMED"
    assert res.booking_reference is not None
    assert res.booking_reference.startswith("KS-BKG-")
    assert len(res.legs) == 1
    assert res.legs[0].status == "CONFIRMED"


def test_idempotency_key_replay(booking_service: JourneyBookingOrchestrator):
    """
    Tests that re-submitting the exact same idempotency key returns
    an idempotent replay without re-reserving or creating duplicate bookings.
    """
    idem_key = "test_idem_replay_unique_456"
    req = JourneyBookingRequest(
        journey_id="jny_test_002",
        user_id="usr_00000001",
        idempotency_key=idem_key,
        total_amount=Decimal("4500.00"),
        currency="INR",
        items=[
            BookingLegItem(
                leg_index=0,
                flight_id="flt_test_2",
                flight_number="6E-101",
                fare_id="far_test_2",
                for_date=date(2026, 9, 3),
                units=1,
                unit_price=Decimal("4000.00"),
                taxes=Decimal("500.00"),
                currency="INR"
            )
        ]
    )
    first_res = booking_service.book_journey_sync(req)
    assert first_res.status == "CONFIRMED"
    first_ref = first_res.booking_reference

    # Re-submit identical key
    second_res = booking_service.book_journey_sync(req)
    assert second_res.status == "IDEMPOTENT_REPLAY"
    assert second_res.booking_reference == first_ref
    assert "Idempotent replay" in second_res.message


def test_multileg_partial_failure_compensation(booking_service: JourneyBookingOrchestrator):
    """
    Tests partial-failure policy:
    Leg 0 succeeds (available), but Leg 1 fails (exceeds inventory).
    Leg 0 MUST be compensated and overall status must NEVER be CONFIRMED.
    """
    # Find an actual inventory row from APS-05.db to test realistic inventory limits
    repo = TransportRepository()
    records = []
    with repo._get_connection() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT inventory_id, entity_id, for_date, total_units, booked_units, held_units
            FROM inventory_calendar
            WHERE entity_type = 'flight_fare'
            LIMIT 2
        """)
        records = [dict(r) for r in cur.fetchall()]

    if len(records) >= 2:
        r1 = records[0]
        r2 = records[1]
        avail_r2 = r2["total_units"] - r2["booked_units"] - r2["held_units"]

        req = JourneyBookingRequest(
            journey_id="jny_multileg_fail_demo",
            user_id="usr_00000001",
            idempotency_key="test_idem_partial_fail_789",
            total_amount=Decimal("12000.00"),
            currency="INR",
            items=[
                # Leg 0: Valid request within units
                BookingLegItem(
                    leg_index=0,
                    flight_id="flt_leg0",
                    flight_number="AI-101",
                    fare_id=r1["entity_id"],
                    inventory_id=r1["inventory_id"],
                    for_date=date.fromisoformat(r1["for_date"]),
                    units=1,
                    unit_price=Decimal("5000.00"),
                    taxes=Decimal("1000.00"),
                    currency="INR"
                ),
                # Leg 1: Request units exceeding remaining available capacity
                BookingLegItem(
                    leg_index=1,
                    flight_id="flt_leg1",
                    flight_number="AI-102",
                    fare_id=r2["entity_id"],
                    inventory_id=r2["inventory_id"],
                    for_date=date.fromisoformat(r2["for_date"]),
                    units=avail_r2 + 100,  # Deliberately excessive units
                    unit_price=Decimal("5000.00"),
                    taxes=Decimal("1000.00"),
                    currency="INR"
                )
            ]
        )

        res = booking_service.book_journey_sync(req)
        # Invariant: Journey must NEVER be reported as confirmed
        assert res.status in ("PARTIALLY_FAILED", "REJECTED_NO_INVENTORY")
        assert res.booking_reference is None

        # Verify saga compensation: Leg 0 must be COMPENSATED
        assert res.legs[0].status == "COMPENSATED"
        assert "Compensated" in str(res.legs[0].error_message)

        # Leg 1 must be FAILED
        assert res.legs[1].status == "FAILED"
        assert "Insufficient inventory" in str(res.legs[1].error_message)
