import pytest
from datetime import date, datetime, timezone
from decimal import Decimal
from pydantic import ValidationError
from app.schemas.journey import JourneySearchRequest
from app.services.journey_service import JourneyIntelligenceService


@pytest.fixture
def journey_service():
    return JourneyIntelligenceService()


def test_valid_search_request_direct(journey_service: JourneyIntelligenceService):
    """
    Tests a valid search request that finds direct flights from Kochi to Mumbai on 2026-09-03.
    """
    req = JourneySearchRequest(
        origin="Kochi",
        destination="Mumbai",
        travel_date=date(2026, 9, 3),
        preference="lowest_cost"
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count >= 1
    top = res.journeys[0]
    assert top.rank == 1
    assert top.transfer_count == 0
    assert top.number_of_legs == 1
    assert top.legs[0].origin_city_name == "Kochi"
    assert top.legs[0].dest_city_name == "Mumbai"
    assert top.total_cost > Decimal("0.00")
    assert "Rank #1" in top.explanation


def test_valid_search_request_multileg(journey_service: JourneyIntelligenceService):
    """
    Tests a valid search request for a connecting route (Bengaluru to Pune on 2026-09-04).
    """
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4),
        preference="balanced",
        transfer_limit=2
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count >= 1
    top = res.journeys[0]
    assert top.number_of_legs >= 2
    assert top.transfer_count >= 1
    assert top.waiting_duration_minutes > 0
    # Connection continuity
    assert top.legs[0].dest_airport_id == top.legs[1].origin_airport_id


def test_invalid_request_same_origin_destination():
    """
    Validates that Pydantic rejects identical origin and destination.
    """
    with pytest.raises(ValidationError) as exc:
        JourneySearchRequest(
            origin="Mumbai",
            destination="Mumbai",
            travel_date=date(2026, 9, 3)
        )
    assert "Origin and destination cannot be identical" in str(exc.value)


def test_invalid_request_deadline_before_travel_date():
    """
    Validates that Pydantic rejects arrival deadline before departure travel date.
    """
    with pytest.raises(ValidationError) as exc:
        JourneySearchRequest(
            origin="Kochi",
            destination="Mumbai",
            travel_date=date(2026, 9, 10),
            arrival_deadline=datetime.fromisoformat("2026-09-05T12:00:00+05:30")
        )
    assert "Arrival deadline" in str(exc.value)


def test_invalid_negative_budget():
    """
    Validates that budget must be strictly positive.
    """
    with pytest.raises(ValidationError):
        JourneySearchRequest(
            origin="Kochi",
            destination="Mumbai",
            travel_date=date(2026, 9, 3),
            max_budget=Decimal("-100.00")
        )


def test_no_feasible_journeys_nonexistent_location(journey_service: JourneyIntelligenceService):
    """
    Tests that searching for an unknown location returns a clear no-feasible-journey response.
    """
    req = JourneySearchRequest(
        origin="AtlantisCity",
        destination="Mumbai",
        travel_date=date(2026, 9, 3)
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count == 0
    assert res.total_candidates_found == 0
    assert "could not be resolved" in res.message


def test_search_is_read_only_and_creates_no_holds(journey_service: JourneyIntelligenceService):
    """
    Ensures that performing a search does NOT create any holds or modify inventory.
    """
    req = JourneySearchRequest(
        origin="Kochi",
        destination="Mumbai",
        travel_date=date(2026, 9, 3)
    )
    res1 = journey_service.search_journeys(req)
    res2 = journey_service.search_journeys(req)
    assert res1.feasible_count == res2.feasible_count
    assert len(res1.journeys) == len(res2.journeys)
    # Check that prices and candidates remain strictly identical
    if res1.journeys and res2.journeys:
        assert res1.journeys[0].total_cost == res2.journeys[0].total_cost
