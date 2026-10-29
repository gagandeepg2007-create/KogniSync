from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Literal, Union
from pydantic import BaseModel, Field, model_validator, field_validator, computed_field


class JourneySearchRequest(BaseModel):
    """
    Validated search request for Journey Intelligence candidate routing.
    Supports origin, destination, departure date constraint, optional deadline,
    optional budget, preference mode, transfer limit, and optional cabin class.
    """
    origin: str = Field(
        ...,
        description="Origin airport IATA code (e.g. 'DEL', 'BEN') or city name (e.g. 'Bengaluru', 'New Delhi')",
        min_length=2,
        max_length=60
    )
    destination: str = Field(
        ...,
        description="Destination airport IATA code or city name",
        min_length=2,
        max_length=60
    )
    travel_date: date = Field(
        ...,
        description="Travel date (calendar date YYYY-MM-DD)"
    )
    arrival_deadline: Optional[datetime] = Field(
        default=None,
        description="Optional latest acceptable arrival datetime with offset (e.g. '2026-09-04T22:00:00+05:30')"
    )
    max_budget: Optional[Decimal] = Field(
        default=None,
        gt=0,
        description="Optional maximum total budget in standard currency units"
    )
    preference: Literal["lowest_cost", "shortest_duration", "balanced"] = Field(
        default="balanced",
        description="Ranking preference: 'lowest_cost', 'shortest_duration', or 'balanced'"
    )
    transfer_limit: Optional[int] = Field(
        default=2,
        ge=0,
        le=3,
        description="Maximum allowed transfers (0 = direct only, 1 = 1 transfer, 2 = up to 2 transfers)"
    )
    cabin_class: Optional[Literal["economy", "business", "any"]] = Field(
        default="any",
        description="Preferred cabin class ('economy', 'business', or 'any')"
    )
    passengers: int = Field(
        default=1,
        ge=1,
        le=9,
        description="Number of adult passengers (1 to 9)"
    )
    transport_modes: Optional[List[str]] = Field(
        default_factory=lambda: ["flights"],
        description="Selected transport modes: 'flights', 'trains', 'buses', 'cars'"
    )
    service_tier: Optional[Literal["budget", "balanced", "premium"]] = Field(
        default="balanced",
        description="Service level: 'budget', 'balanced', or 'premium'"
    )

    @field_validator("origin", "destination")
    @classmethod
    def clean_string_inputs(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Location string cannot be empty or whitespace only.")
        return v

    @model_validator(mode="after")
    def validate_search_constraints(self) -> "JourneySearchRequest":
        if self.origin.lower() == self.destination.lower():
            raise ValueError(f"Origin and destination cannot be identical ('{self.origin}').")

        if self.arrival_deadline is not None:
            deadline_date = self.arrival_deadline.date()
            if deadline_date < self.travel_date:
                raise ValueError(
                    f"Arrival deadline ({deadline_date}) cannot be before the travel departure date ({self.travel_date})."
                )

        return self


class JourneyLeg(BaseModel):
    """
    Represents a single transport flight leg in a journey, constructed from actual database records.
    """
    leg_index: int = Field(..., description="0-indexed leg sequence number in the journey")
    flight_id: str = Field(..., description="Canonical flight identifier (flt_*)")
    flight_number: str = Field(..., description="Flight code, e.g. 6E-2043")
    airline_id: str = Field(..., description="Carrier ID (arl_*)")
    airline_name: str = Field(..., description="Carrier full name")
    airline_iata: str = Field(..., description="Carrier 2-character IATA code")
    origin_airport_id: str = Field(..., description="Origin airport canonical ID")
    origin_airport_iata: str = Field(..., description="Origin airport 3-letter IATA code")
    origin_airport_name: str = Field(..., description="Origin airport descriptive name")
    origin_city_name: str = Field(..., description="Origin city name")
    dest_airport_id: str = Field(..., description="Destination airport canonical ID")
    dest_airport_iata: str = Field(..., description="Destination airport 3-letter IATA code")
    dest_airport_name: str = Field(..., description="Destination airport descriptive name")
    dest_city_name: str = Field(..., description="Destination city name")
    departs_at: datetime = Field(..., description="Scheduled departure timestamp with timezone offset")
    arrives_at: datetime = Field(..., description="Scheduled arrival timestamp with timezone offset")
    duration_minutes: int = Field(..., description="Flight airborne duration in minutes")
    aircraft_type: Optional[str] = Field(default=None, description="Aircraft model if available")
    cabin_class: str = Field(..., description="Cabin class: economy, business, etc.")
    fare_id: str = Field(..., description="Canonical fare identifier (far_*)")
    base_fare: Decimal = Field(..., description="Base fare amount")
    taxes: Decimal = Field(..., description="Taxes and airport charges")
    total_fare: Decimal = Field(..., description="Total leg fare (base_fare + taxes)")
    currency: str = Field(..., description="ISO-4217 3-character currency code")
    carbon_kg: Decimal = Field(..., description="Estimated per-seat carbon emissions in kg")
    inventory_id: Optional[str] = Field(default=None, description="Linked inventory calendar ID if present")
    available_units: Optional[int] = Field(default=None, description="Available seats if tracked in inventory")


class JourneyOption(BaseModel):
    """
    A candidate multi-modal or multi-leg journey with calculated metrics,
    feasibility status, preference-aware ranking, and deterministic explanation.
    """
    journey_id: str = Field(..., description="Deterministic unique identifier for this itinerary")
    origin_display: str = Field(..., description="Summary departure location")
    destination_display: str = Field(..., description="Summary arrival location")
    departure_time: datetime = Field(..., description="Earliest leg departure timestamp")
    arrival_time: datetime = Field(..., description="Final leg arrival timestamp")
    total_elapsed_duration_minutes: int = Field(
        ...,
        description="Total elapsed journey time from departure to final arrival in minutes"
    )
    flight_duration_minutes: int = Field(
        ...,
        description="Sum of airborne duration across all legs in minutes"
    )
    waiting_duration_minutes: int = Field(
        ...,
        description="Sum of layover/transfer durations between legs in minutes"
    )
    number_of_legs: int = Field(..., description="Count of transport legs in this journey")

    @computed_field
    @property
    def transfer_count(self) -> int:
        return max(0, self.number_of_legs - 1)

    total_cost: Decimal = Field(..., description="Total price across all legs (scaled for all passengers)")
    currency: str = Field(..., description="ISO-4217 currency code")
    passengers: int = Field(default=1, description="Number of passengers")
    unit_cost_per_passenger: Optional[Decimal] = Field(default=None, description="Per-passenger base total fare")
    transport_mode: str = Field(default="flights", description="Primary transport modality")
    service_tier: str = Field(default="balanced", description="Service tier represented")
    total_carbon_kg: Decimal = Field(..., description="Total journey carbon footprint in kg")
    legs: List[JourneyLeg] = Field(..., description="Ordered list of journey transport legs")

    # Ranking and Feasibility Attributes
    rank: Optional[int] = Field(default=None, description="Deterministic rank (1 = top recommendation)")
    preference: str = Field(default="balanced", description="Ranking preference applied")
    normalized_cost_score: Optional[float] = Field(default=None, description="0..1 normalized cost for balanced ranking")
    normalized_duration_score: Optional[float] = Field(default=None, description="0..1 normalized duration for balanced ranking")
    composite_score: Optional[float] = Field(default=None, description="Composite ranking score")

    feasible: bool = Field(default=True, description="Whether this journey satisfies all hard constraints")
    rejection_reasons: List[str] = Field(default_factory=list, description="List of reasons if rejected as infeasible")
    explanation: str = Field(default="", description="Deterministic justification for ranking or selection")


class PlaceItem(BaseModel):
    """
    Location item for autocomplete and dropdown selectors.
    """
    id: str
    type: Literal["city", "airport"]
    name: str
    iata: Optional[str] = None
    city_name: str
    country_code: str
    display_label: str


class JourneySearchResponse(BaseModel):
    """
    Complete response returned by the Journey Intelligence search endpoint.
    """
    origin_queried: str
    destination_queried: str
    travel_date: date
    preference: str
    total_candidates_found: int
    feasible_count: int
    infeasible_count: int
    journeys: List[JourneyOption] = Field(
        ...,
        description="Ranked list of feasible journey options. Empty if no feasible option exists."
    )
    rejected_journeys: List[JourneyOption] = Field(
        default_factory=list,
        description="Infeasible candidates with explicit violation explanations"
    )
    message: str = Field(..., description="Summary status message")
