from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, SmallInteger, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class Hotel(Base):
    __tablename__ = "hotels"

    hotel_id: Mapped[str] = mapped_column(String, primary_key=True)
    city_id: Mapped[str] = mapped_column(String, ForeignKey("cities.city_id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    property_type: Mapped[str] = mapped_column(String, nullable=False)
    star_rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    guest_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1), nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False)
    address_line: Mapped[str] = mapped_column(String, nullable=False)
    lat: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    lng: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    distance_to_centre_km: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    base_currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    checkin_time: Mapped[str] = mapped_column(String, nullable=False)
    checkout_time: Mapped[str] = mapped_column(String, nullable=False)
    chain_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    has_xr_scene: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    city: Mapped["City"] = relationship("City")
    currency: Mapped["Currency"] = relationship("Currency")
    room_types: Mapped[List["HotelRoomType"]] = relationship("HotelRoomType", back_populates="hotel")


class HotelRoomType(Base):
    __tablename__ = "hotel_room_types"

    room_type_id: Mapped[str] = mapped_column(String, primary_key=True)
    hotel_id: Mapped[str] = mapped_column(String, ForeignKey("hotels.hotel_id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    max_occupancy: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    max_adults: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    max_children: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    bed_config: Mapped[str] = mapped_column(String, nullable=False)
    size_sqm: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    base_rate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    total_units: Mapped[int] = mapped_column(Integer, nullable=False)
    smoking_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    hotel: Mapped["Hotel"] = relationship("Hotel", back_populates="room_types")
    currency_rel: Mapped["Currency"] = relationship("Currency")
    rate_plans: Mapped[List["HotelRatePlan"]] = relationship("HotelRatePlan", back_populates="room_type")


class HotelRatePlan(Base):
    __tablename__ = "hotel_rate_plans"

    rate_plan_id: Mapped[str] = mapped_column(String, primary_key=True)
    room_type_id: Mapped[str] = mapped_column(String, ForeignKey("hotel_room_types.room_type_id"), nullable=False)
    plan_type: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    price_delta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    cancellation_window_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    cancellation_penalty_pct: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    includes_breakfast: Mapped[bool] = mapped_column(Boolean, nullable=False)
    min_stay_nights: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    room_type: Mapped["HotelRoomType"] = relationship("HotelRoomType", back_populates="rate_plans")
    currency_rel: Mapped["Currency"] = relationship("Currency")


class Flight(Base):
    __tablename__ = "flights"

    flight_id: Mapped[str] = mapped_column(String, primary_key=True)
    airline_id: Mapped[str] = mapped_column(String, ForeignKey("airlines.airline_id"), nullable=False)
    flight_number: Mapped[str] = mapped_column(String, nullable=False)
    origin_airport_id: Mapped[str] = mapped_column(String, ForeignKey("airports.airport_id"), nullable=False)
    dest_airport_id: Mapped[str] = mapped_column(String, ForeignKey("airports.airport_id"), nullable=False)
    departs_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    arrives_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    stops: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    aircraft_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cabin_classes: Mapped[str] = mapped_column(String, nullable=False)
    carbon_kg: Mapped[Decimal] = mapped_column(Numeric(8, 3), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    airline: Mapped["Airline"] = relationship("Airline")
    origin_airport: Mapped["Airport"] = relationship("Airport", foreign_keys=[origin_airport_id])
    dest_airport: Mapped["Airport"] = relationship("Airport", foreign_keys=[dest_airport_id])
    fares: Mapped[List["FlightFare"]] = relationship("FlightFare", back_populates="flight")


class FlightFare(Base):
    __tablename__ = "flight_fares"

    fare_id: Mapped[str] = mapped_column(String, primary_key=True)
    flight_id: Mapped[str] = mapped_column(String, ForeignKey("flights.flight_id"), nullable=False)
    cabin_class: Mapped[str] = mapped_column(String, nullable=False)
    fare_class: Mapped[str] = mapped_column(String, nullable=False)
    base_fare: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    taxes: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    baggage_kg: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    cabin_baggage_kg: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    changeable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    change_fee: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    refundable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    seats_total: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    flight: Mapped["Flight"] = relationship("Flight", back_populates="fares")
    currency_rel: Mapped["Currency"] = relationship("Currency")
