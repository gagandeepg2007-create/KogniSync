from typing import Optional, List
from pydantic import BaseModel, Field


class TravelContext(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    date: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_deadline: Optional[str] = None
    passengers: int = 1
    budget: Optional[float] = None
    currency: str = "INR"
    time_priority: float = 0.5
    comfort: float = 0.5
    sustainability: float = 0.5
    preferred_modes: List[str] = Field(default_factory=list)


class TravelIntent(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    date: Optional[str] = None  # Format: YYYY-MM-DD
    departure_time: Optional[str] = None  # Format: HH:mm (24-hour)
    arrival_deadline: Optional[str] = None  # Format: HH:mm (24-hour)
    passengers: int = 1
    budget: Optional[float] = None
    currency: str = "INR"
    time_priority: float = 0.5  # 0.0 = flexible/slow, 1.0 = fastest/urgent
    comfort: float = 0.5  # 0.0 = basic/budget, 1.0 = premium/luxury
    sustainability: float = 0.5  # 0.0 = any, 1.0 = eco-friendly
    preferred_modes: List[str] = Field(default_factory=list)  # flight, train, bus, cab, metro, walk
    intent_summary: Optional[str] = None
    confidence: float = 0.0


class ParseIntentRequest(BaseModel):
    text: str
    current_context: Optional[TravelContext] = None


class ParseIntentResponse(BaseModel):
    intent: TravelIntent
