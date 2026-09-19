from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, SmallInteger, Boolean, Numeric, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class InventoryCalendar(Base):
    __tablename__ = "inventory_calendar"

    inventory_id: Mapped[str] = mapped_column(String, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    for_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_units: Mapped[int] = mapped_column(Integer, nullable=False)
    booked_units: Mapped[int] = mapped_column(Integer, nullable=False)
    held_units: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    min_stay_nights: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    closed_to_arrival: Mapped[bool] = mapped_column(Boolean, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    currency_rel: Mapped["Currency"] = relationship("Currency")
    holds: Mapped[List["Hold"]] = relationship("Hold", back_populates="inventory")
    booking_items: Mapped[List["BookingItem"]] = relationship("BookingItem", back_populates="inventory")

    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "for_date", name="inventory_calendar_entity_type_entity_id_for_date_key"),
    )


class Hold(Base):
    __tablename__ = "holds"

    hold_id: Mapped[str] = mapped_column(String, primary_key=True)
    inventory_id: Mapped[str] = mapped_column(String, ForeignKey("inventory_calendar.inventory_id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.user_id"), nullable=False)
    units: Mapped[int] = mapped_column(Integer, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    released_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    booking_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("bookings.booking_id"), nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    inventory: Mapped["InventoryCalendar"] = relationship("InventoryCalendar", back_populates="holds")
    user: Mapped["User"] = relationship("User", back_populates="holds")
    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="holds")
