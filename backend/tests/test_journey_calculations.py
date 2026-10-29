import pytest
from datetime import date, datetime
from decimal import Decimal
from app.schemas.journey import JourneySearchRequest, JourneyOption
from app.services.journey_service import JourneyIntelligenceService


@pytest.fixture
def journey_service():
    return JourneyIntelligenceService()


def test_deterministic_cost_calculations(journey_service: JourneyIntelligenceService):
    """
    Verifies that journey cost equals the exact sum of (base_fare + taxes) across all legs,
    using fixed-point Decimal arithmetic without rounding floats.
    """
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4),
        preference="lowest_cost"
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count > 0
    for jny in res.journeys:
        expected_total = sum(leg.total_fare for leg in jny.legs)
        assert jny.total_cost == expected_total
        for leg in jny.legs:
            assert leg.total_fare == (leg.base_fare + leg.taxes)
            assert isinstance(leg.total_fare, Decimal)


def test_deterministic_duration_and_waiting_calculations(journey_service: JourneyIntelligenceService):
    """
    Verifies that elapsed duration = arrival_time - departure_time in minutes,
    and waiting duration = sum of layovers between consecutive legs.
    """
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4),
        preference="balanced"
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count > 0
    top = res.journeys[0]

    # Elapsed duration check
    expected_elapsed = int((top.arrival_time - top.departure_time).total_seconds() / 60)
    assert top.total_elapsed_duration_minutes == expected_elapsed

    # Waiting layover check
    expected_waiting = 0
    for i in range(len(top.legs) - 1):
        layover = int((top.legs[i + 1].departs_at - top.legs[i].arrives_at).total_seconds() / 60)
        assert layover >= 45, "Layover must be at least 45 minutes"
        expected_waiting += layover
    assert top.waiting_duration_minutes == expected_waiting


def test_invalid_transfer_timing_rejection(journey_service: JourneyIntelligenceService):
    """
    Verifies that flight pairs with layovers less than 45 minutes or negative layovers
    (arriving after connecting flight departs) are never constructed as valid candidates.
    """
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4)
    )
    res = journey_service.search_journeys(req)
    for jny in res.journeys + res.rejected_journeys:
        for i in range(len(jny.legs) - 1):
            layover = (jny.legs[i + 1].departs_at - jny.legs[i].arrives_at).total_seconds() / 60
            assert layover >= 45, f"Found invalid connection with layover {layover} mins"


def test_cyclic_routes_prevented(journey_service: JourneyIntelligenceService):
    """
    Verifies that candidates never visit the same city or airport more than once in the same journey.
    """
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4)
    )
    res = journey_service.search_journeys(req)
    for jny in res.journeys + res.rejected_journeys:
        airports_visited = [leg.origin_airport_id for leg in jny.legs] + [jny.legs[-1].dest_airport_id]
        cities_visited = [leg.origin_city_name for leg in jny.legs] + [jny.legs[-1].dest_city_name]
        assert len(airports_visited) == len(set(airports_visited)), "Found cyclic airport route!"
        assert len(cities_visited) == len(set(cities_visited)), "Found cyclic city route!"
