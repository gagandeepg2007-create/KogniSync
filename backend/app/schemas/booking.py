from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class CreateHoldRequest(BaseModel):
    inventory_id: str
    user_id: str
    units: int = Field(gt=0, description="Number of units to hold (must be positive)")
    idempotency_key: str
    correlation_id: Optional[str] = None
    ttl_seconds: int = Field(default=600, gt=0, description="Hold TTL in seconds")


class HoldResponse(BaseModel):
    hold_id: str
    inventory_id: str
    user_id: str
    units: int
    idempotency_key: str
    created_at: datetime
    expires_at: datetime
    status: str


class ConfirmBookingRequest(BaseModel):
    hold_id: str
    user_id: str
    payment_method: str = "card"
    idempotency_key: str
    correlation_id: Optional[str] = None
    simulate_payment_failure: bool = False
    payment_failure_code: Optional[str] = None


class BookingResponse(BaseModel):
    booking_id: str
    booking_reference: str
    user_id: str
    total_amount: Decimal
    currency: str
    status: str
    confirmed_at: Optional[datetime] = None


class CancelBookingRequest(BaseModel):
    correlation_id: Optional[str] = None
    reason: str = "user_cancelled"


class InventoryStatusResponse(BaseModel):
    inventory_id: str
    entity_type: str
    entity_id: str
    for_date: str
    total_units: int
    booked_units: int
    held_units: int
    available_units: int
    price: str
    currency: str


class LifecycleEventResponse(BaseModel):
    event_id: str
    event_type: str
    correlation_id: str
    inventory_id: Optional[str] = None
    hold_id: Optional[str] = None
    booking_id: Optional[str] = None
    payment_id: Optional[str] = None
    user_id: Optional[str] = None
    state_from: Optional[str] = None
    state_to: Optional[str] = None
    units: Optional[int] = None
    metadata_json: Optional[str] = None
    created_at: datetime


class InvariantCheckResponse(BaseModel):
    passed: bool
    total_items_checked: int
    total_violations: int
    total_overallocated_units: int
    violations: List[Dict[str, Any]]
