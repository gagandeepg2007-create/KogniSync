import pytest
from datetime import date, datetime
from decimal import Decimal
from app.schemas.journey import JourneySearchRequest
from app.services.journey_service import JourneyIntelligenceService


@pytest.fixture
def journey_service():
    return JourneyIntelligenceService()


def test_budget_constraint_enforcement(journey_service: JourneyIntelligenceService):
    """
    Tests that candidates exceeding the max budget are marked infeasible,
    excluded from valid recommendations, and given clear rejection reasons.
    """
    # Actual cost between Bengaluru and Pune is ~7,297 INR
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4),
        max_budget=Decimal("5000.00")
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count == 0
    assert res.infeasible_count >= 1
    assert len(res.journeys) == 0
    rejected = res.rejected_journeys[0]
    assert not rejected.feasible
    assert any("exceeds maximum allowed budget" in r for r in rejected.rejection_reasons)


def test_arrival_deadline_enforcement(journey_service: JourneyIntelligenceService):
    """
    Tests that candidates arriving after the specified arrival deadline are marked infeasible.
    """
    # Route arrives at 14:37; deadline set to 12:00 PM
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4),
        arrival_deadline=datetime.fromisoformat("2026-09-04T12:00:00+05:30")
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count == 0
    assert res.infeasible_count >= 1
    rejected = res.rejected_journeys[0]
    assert any("exceeds the required arrival deadline" in r for r in rejected.rejection_reasons)


def test_transfer_limit_enforcement(journey_service: JourneyIntelligenceService):
    """
    Tests that routes with transfers are rejected when direct flights only (limit 0) are requested.
    """
    req = JourneySearchRequest(
        origin="Bengaluru",
        destination="Pune",
        travel_date=date(2026, 9, 4),
        transfer_limit=0
    )
    res = journey_service.search_journeys(req)
    # No direct flight exists on this day
    assert res.feasible_count == 0


def test_ranking_lowest_cost(journey_service: JourneyIntelligenceService):
    """
    Tests that lowest_cost preference sorts feasible candidates strictly by total_cost ascending.
    """
    req = JourneySearchRequest(
        origin="Kochi",
        destination="Mumbai",
        travel_date=date(2026, 9, 3),
        preference="lowest_cost"
    )
    res = journey_service.search_journeys(req)
    if len(res.journeys) > 1:
        for i in range(len(res.journeys) - 1):
            assert res.journeys[i].total_cost <= res.journeys[i + 1].total_cost
    if res.journeys:
        assert res.journeys[0].rank == 1
        assert "Lowest Cost" in res.journeys[0].explanation


def test_ranking_shortest_duration(journey_service: JourneyIntelligenceService):
    """
    Tests that shortest_duration preference sorts feasible candidates strictly by total elapsed duration.
    """
    req = JourneySearchRequest(
        origin="Kochi",
        destination="Mumbai",
        travel_date=date(2026, 9, 3),
        preference="shortest_duration"
    )
    res = journey_service.search_journeys(req)
    if len(res.journeys) > 1:
        for i in range(len(res.journeys) - 1):
            assert res.journeys[i].total_elapsed_duration_minutes <= res.journeys[i + 1].total_elapsed_duration_minutes
    if res.journeys:
        assert res.journeys[0].rank == 1
        assert "Shortest Duration" in res.journeys[0].explanation


def test_ranking_balanced_normalization(journey_service: JourneyIntelligenceService):
    """
    Tests balanced preference: verifies normalized cost and duration scores in range [0, 1]
    and composite score sort.
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
    assert top.normalized_cost_score is not None
    assert 0.0 <= top.normalized_cost_score <= 1.0
    assert top.normalized_duration_score is not None
    assert 0.0 <= top.normalized_duration_score <= 1.0
    assert "Balanced" in top.explanation


def test_explanations_match_computed_metrics(journey_service: JourneyIntelligenceService):
    """
    Tests that the natural text explanation agrees with the actual metrics on the object.
    """
    req = JourneySearchRequest(
        origin="Kochi",
        destination="Mumbai",
        travel_date=date(2026, 9, 3),
        preference="lowest_cost"
    )
    res = journey_service.search_journeys(req)
    assert res.feasible_count > 0
    top = res.journeys[0]
    # Check that formatted cost is present in explanation
    cost_str = f"{top.total_cost:,.2f}"
    assert cost_str in top.explanation
