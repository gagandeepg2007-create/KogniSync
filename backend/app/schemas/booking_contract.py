from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class BookingLegItem(BaseModel):
    """
    Represents a specific transport leg reservation item required by the booking engine.
    Maps directly to canonical booking_items and inventory_calendar entity references.
    """
    leg_index: int = Field(..., description="Leg sequence number (0, 1, 2...)")
    flight_id: str = Field(..., description="Canonical flight identifier (flt_*)")
    flight_number: str = Field(..., description="Flight code (e.g. 6E-2043)")
    fare_id: str = Field(..., description="Canonical flight fare identifier (far_*)")
    inventory_id: Optional[str] = Field(default=None, description="Linked inventory calendar ID (inv_*)")
    for_date: date = Field(..., description="Date of travel for this leg")
    units: int = Field(default=1, ge=1, description="Quantity of seats/units to reserve")
    unit_price: Decimal = Field(..., description="Unit price per seat")
    taxes: Decimal = Field(default=Decimal("0.00"), description="Taxes and fees for this leg")
    currency: str = Field(..., description="ISO-4217 currency code")


class JourneyBookingRequest(BaseModel):
    """
    Contract request sent from Journey Intelligence to the Booking Service.
    Contains all information required to execute inventory holds and booking confirmation
    with idempotency protection.
    """
    journey_id: str = Field(..., description="ID of the journey selected by traveller")
    user_id: str = Field(default="usr_00000001", description="ID of booking user (usr_*)")
    idempotency_key: str = Field(
        ...,
        min_length=8,
        max_length=120,
        description="Unique client-provided idempotency key ensuring safe retry semantics"
    )
    items: List[BookingLegItem] = Field(
        ...,
        min_length=1,
        description="Transport legs to be reserved and booked"
    )
    total_amount: Decimal = Field(..., gt=0, description="Agreed total booking amount")
    currency: str = Field(..., description="ISO-4217 currency code")
    customer_notes: Optional[str] = Field(default=None, description="Optional booking notes")


class LegBookingStatus(BaseModel):
    """
    Tracks the individual reservation outcome of each leg in a multi-leg itinerary.
    Crucial for representing multi-item sagas and partial-failure compensations.
    """
    leg_index: int
    flight_id: str
    flight_number: str
    fare_id: str
    inventory_id: Optional[str] = None
    status: Literal["HELD", "CONFIRMED", "COMPENSATED", "FAILED"] = Field(
        ...,
        description="Reservation state of this leg"
    )
    hold_id: Optional[str] = None
    booking_item_id: Optional[str] = None
    error_message: Optional[str] = None


class JourneyBookingResponse(BaseModel):
    """
    Standard response returned by the Booking Service contract.
    Guarantees honest status reporting: if any leg fails to reserve,
    the overall journey is NEVER reported as confirmed.
    """
    booking_reference: Optional[str] = Field(
        default=None,
        description="Official human-readable booking reference (e.g. KS-BKG-8A9F2D)"
    )
    booking_id: Optional[str] = Field(
        default=None,
        description="Internal canonical booking ID (bkg_*)"
    )
    status: Literal["CONFIRMED", "PARTIALLY_FAILED", "REJECTED_NO_INVENTORY", "FAILED", "IDEMPOTENT_REPLAY"] = Field(
        ...,
        description="High-level booking outcome"
    )
    idempotency_key: str
    user_id: str
    journey_id: str
    total_amount: Decimal
    currency: str
    legs: List[LegBookingStatus]
    message: str
    created_at: datetime
