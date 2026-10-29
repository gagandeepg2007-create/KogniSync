from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query
from app.schemas.journey import (
    JourneySearchRequest,
    JourneySearchResponse,
    PlaceItem,
)
from app.schemas.booking_contract import (
    JourneyBookingRequest,
    JourneyBookingResponse,
)
from app.services.journey_service import JourneyIntelligenceService
from app.services.booking_service import BookingService

router = APIRouter(prefix="/api/v1/journeys", tags=["Journey Intelligence"])

# Shared singleton instances
journey_service = JourneyIntelligenceService()
booking_service = BookingService()


@router.get("/places", response_model=List[PlaceItem], summary="List all searchable cities and airports")
def get_searchable_places():
    """
    Returns all canonical cities and airports available in the transport database.
    Used for frontend typeaheads, dropdowns, and search assistance.
    """
    return journey_service.get_places()


@router.post("/search", response_model=JourneySearchResponse, summary="Search and rank journeys")
def search_journeys(request: JourneySearchRequest):
    """
    Executes Journey Intelligence search:
    - Origin and destination resolution
    - Deterministic candidate route construction (direct and connecting)
    - Hard constraint feasibility evaluation (budget, arrival deadline, transfers)
    - Preference-aware deterministic ranking (lowest_cost, shortest_duration, balanced)
    - Metric-grounded explanations
    """
    try:
        response = journey_service.search_journeys(request)
        return response
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Journey search failed: {str(exc)}"
        )


@router.post("/book", response_model=JourneyBookingResponse, summary="Book a selected journey")
def book_journey(request: JourneyBookingRequest):
    """
    Invokes the agreed booking contract:
    - Enforces idempotency via idempotency_key
    - Checks inventory availability across all transport legs
    - Enforces saga compensation: if any leg fails, previously held legs are compensated
      and the entire booking is reported as PARTIALLY_FAILED / REJECTED
    - Returns transparent confirmation details
    """
    try:
        response = booking_service.book_journey(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Booking transaction failed: {str(exc)}"
        )


@router.get("/presets", summary="Demo presets for rapid testing by judges")
def get_demo_presets() -> List[Dict[str, Any]]:
    """
    Returns curated search scenarios highlighting direct routes, multi-leg connections,
    and hard-constraint feasibility enforcement.
    """
    return [
        {
            "id": "preset_direct",
            "title": "Direct Flight (Kochi → Mumbai)",
            "description": "Direct flight with lowest cost ranking and clear metric explanation.",
            "origin": "Kochi",
            "destination": "Mumbai",
            "travel_date": "2026-09-03",
            "arrival_deadline": None,
            "max_budget": None,
            "preference": "lowest_cost",
            "transfer_limit": 2
        },
        {
            "id": "preset_connecting",
            "title": "Connecting 1-Stop Route (Bengaluru → Pune)",
            "description": "Multi-leg journey with layover transfer time validation and balanced ranking.",
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "arrival_deadline": None,
            "max_budget": None,
            "preference": "balanced",
            "transfer_limit": 2
        },
        {
            "id": "preset_budget_constraint",
            "title": "Strict Budget Constraint Rejection",
            "description": "Bengaluru → Pune with max budget of ₹5,000 (actual ₹7,297). Proves hard-constraint rejection.",
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "arrival_deadline": None,
            "max_budget": "5000.00",
            "preference": "lowest_cost",
            "transfer_limit": 2
        },
        {
            "id": "preset_deadline_constraint",
            "title": "Arrival Deadline Constraint Rejection",
            "description": "Bengaluru → Pune requiring arrival by 12:00 PM (actual arrival 14:37). Transparent rejection.",
            "origin": "Bengaluru",
            "destination": "Pune",
            "travel_date": "2026-09-04",
            "arrival_deadline": "2026-09-04T12:00:00+05:30",
            "max_budget": None,
            "preference": "shortest_duration",
            "transfer_limit": 2
        }
    ]
