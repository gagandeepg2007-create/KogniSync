from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    booking_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"), nullable=False)
    trip_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("trips.trip_id"), nullable=True)
    itinerary_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("itineraries.itinerary_id"), nullable=True)
    booking_reference: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    channel: Mapped[str] = mapped_column(String, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="bookings")
    trip: Mapped[Optional["Trip"]] = relationship("Trip")
    itinerary: Mapped[Optional["Itinerary"]] = relationship("Itinerary")
    currency_rel: Mapped["Currency"] = relationship("Currency")

    booking_items: Mapped[List["BookingItem"]] = relationship("BookingItem", back_populates="booking")
    holds: Mapped[List["Hold"]] = relationship("Hold", back_populates="booking")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="booking")


class BookingItem(Base):
    __tablename__ = "booking_items"

    booking_item_id: Mapped[str] = mapped_column(String, primary_key=True)
    booking_id: Mapped[str] = mapped_column(String, ForeignKey("bookings.booking_id"), nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    inventory_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("inventory_calendar.inventory_id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    for_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    units: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    compensated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="booking_items")
    inventory: Mapped[Optional["InventoryCalendar"]] = relationship("InventoryCalendar", back_populates="booking_items")
    currency_rel: Mapped["Currency"] = relationship("Currency")
