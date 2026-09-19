from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, SmallInteger, Boolean, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    home_city_id: Mapped[str] = mapped_column(String, ForeignKey("cities.city_id"), nullable=False)
    home_currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    locale: Mapped[str] = mapped_column(String, ForeignKey("languages.bcp47"), nullable=False)
    budget_band: Mapped[str] = mapped_column(String, nullable=False)
    travel_style: Mapped[str] = mapped_column(String, nullable=False)
    traveller_type: Mapped[str] = mapped_column(String, nullable=False)
    segment: Mapped[str] = mapped_column(String, nullable=False)
    date_of_signup: Mapped[date] = mapped_column(Date, nullable=False)
    loyalty_tier: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    home_city: Mapped["City"] = relationship("City")
    currency: Mapped["Currency"] = relationship("Currency")
    language: Mapped["Language"] = relationship("Language")

    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="owner_user")
    holds: Mapped[List["Hold"]] = relationship("Hold", back_populates="user")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="user")


class Trip(Base):
    __tablename__ = "trips"

    trip_id: Mapped[str] = mapped_column(String, primary_key=True)
    owner_user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    origin_city_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("cities.city_id"), nullable=True)
    destination_city_id: Mapped[str] = mapped_column(String, ForeignKey("cities.city_id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    party_size: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    adults: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    children: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    trip_type: Mapped[str] = mapped_column(String, nullable=False)
    is_group_trip: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    home_currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    owner_user: Mapped["User"] = relationship("User", back_populates="trips")
    origin_city: Mapped[Optional["City"]] = relationship("City", foreign_keys=[origin_city_id])
    destination_city: Mapped["City"] = relationship("City", foreign_keys=[destination_city_id])
    currency: Mapped["Currency"] = relationship("Currency")
    itineraries: Mapped[List["Itinerary"]] = relationship("Itinerary", back_populates="trip")


class Itinerary(Base):
    __tablename__ = "itineraries"

    itinerary_id: Mapped[str] = mapped_column(String, primary_key=True)
    trip_id: Mapped[str] = mapped_column(String, ForeignKey("trips.trip_id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False)
    generated_by: Mapped[str] = mapped_column(String, nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    total_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    total_carbon_kg: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    optimizer_weights: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    trip: Mapped["Trip"] = relationship("Trip", back_populates="itineraries")
    currency_rel: Mapped["Currency"] = relationship("Currency")
