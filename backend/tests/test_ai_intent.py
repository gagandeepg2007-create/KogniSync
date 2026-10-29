from datetime import datetime, timedelta
import pytest
from app.services.ai.schemas import TravelContext
from app.services.ai.gemini import GeminiIntentService


@pytest.fixture
def fixed_now():
    # 2026-10-29 is a Thursday
    return datetime(2026, 10, 29, 12, 0, 0)


@pytest.fixture
def intent_service():
    return GeminiIntentService()


def test_intent_test_case_1(intent_service, fixed_now):
    """
    Test 1:
    "I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed."
    """
    text = "I need to reach Chennai from Bangalore tomorrow before 2 PM. My budget is ₹3000 and I prefer saving money over speed."
    intent = intent_service.parse_travel_intent(text, now=fixed_now)

    assert intent.origin == "Bangalore"
    assert intent.destination == "Chennai"
    # Tomorrow from 2026-10-29 is 2026-10-30
    assert intent.date == "2026-10-30"
    assert intent.arrival_deadline == "14:00"
    assert intent.departure_time is None
    assert intent.budget == 3000.0
    assert intent.time_priority <= 0.3  # Low time priority / cost focused


def test_intent_test_case_2(intent_service, fixed_now):
    """
    Test 2:
    "Fastest way from Bangalore to Goa this Saturday. Money isn't a problem."
    """
    text = "Fastest way from Bangalore to Goa this Saturday. Money isn't a problem."
    intent = intent_service.parse_travel_intent(text, now=fixed_now)

    assert intent.origin == "Bangalore"
    assert intent.destination == "Goa"
    # Upcoming Saturday from Thursday Oct 29 is Oct 31, 2026
    assert intent.date == "2026-10-31"
    assert intent.time_priority >= 0.7  # High time priority / fastest
    assert intent.comfort >= 0.7  # Money isn't a problem


def test_intent_test_case_3(intent_service, fixed_now):
    """
    Test 3:
    "I prefer trains and want to keep it under ₹2000."
    """
    text = "I prefer trains and want to keep it under ₹2000."
    intent = intent_service.parse_travel_intent(text, now=fixed_now)

    assert "train" in intent.preferred_modes
    assert intent.budget == 2000.0


def test_intent_test_case_4_context_preservation(intent_service, fixed_now):
    """
    Test 4:
    "Make the budget ₹5000."
    With existing context: Bangalore → Chennai
    """
    context = TravelContext(
        origin="Bangalore",
        destination="Chennai",
        date="2026-10-30",
        budget=3000.0,
        passengers=1,
    )
    text = "Make the budget ₹5000."
    intent = intent_service.parse_travel_intent(text, current_context=context, now=fixed_now)

    assert intent.origin == "Bangalore"
    assert intent.destination == "Chennai"
    assert intent.budget == 5000.0


def test_intent_test_case_5_sustainability(intent_service, fixed_now):
    """
    Test 5:
    "I want an eco-friendly trip."
    Preserve existing fields.
    """
    context = TravelContext(
        origin="Bangalore",
        destination="Chennai",
        date="2026-10-30",
        budget=3000.0,
        passengers=2,
    )
    text = "I want an eco-friendly trip."
    intent = intent_service.parse_travel_intent(text, current_context=context, now=fixed_now)

    assert intent.sustainability >= 0.8
    assert intent.origin == "Bangalore"
    assert intent.destination == "Chennai"
    assert intent.passengers == 2
