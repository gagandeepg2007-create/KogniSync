from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, SmallInteger, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class City(Base):
    __tablename__ = "cities"

    city_id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    country_id: Mapped[str] = mapped_column(String, ForeignKey("countries.country_id"), nullable=False)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False)
    lat: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    lng: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    season_profile: Mapped[str] = mapped_column(String, nullable=False)
    peak_months: Mapped[str] = mapped_column(String, nullable=False)
    primary_language: Mapped[str] = mapped_column(String, ForeignKey("languages.bcp47"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    country: Mapped["Country"] = relationship("Country")
    language: Mapped["Language"] = relationship("Language")


class Airline(Base):
    __tablename__ = "airlines"

    airline_id: Mapped[str] = mapped_column(String, primary_key=True)
    iata: Mapped[str] = mapped_column(String(2), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    alliance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    country_id: Mapped[str] = mapped_column(String, ForeignKey("countries.country_id"), nullable=False)
    low_cost: Mapped[bool] = mapped_column(Boolean, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    country: Mapped["Country"] = relationship("Country")


class Airport(Base):
    __tablename__ = "airports"

    airport_id: Mapped[str] = mapped_column(String, primary_key=True)
    iata: Mapped[str] = mapped_column(String(3), nullable=False, unique=True)
    icao: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    city_id: Mapped[str] = mapped_column(String, ForeignKey("cities.city_id"), nullable=False)
    lat: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    lng: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    is_international: Mapped[bool] = mapped_column(Boolean, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    city: Mapped["City"] = relationship("City")
