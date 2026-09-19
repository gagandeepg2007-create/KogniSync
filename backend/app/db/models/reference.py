from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Integer, SmallInteger, Boolean, Numeric, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.models.base import Base


class Currency(Base):
    __tablename__ = "currencies"

    currency_id: Mapped[str] = mapped_column(String, primary_key=True)
    iso4217: Mapped[str] = mapped_column(String(3), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    symbol: Mapped[str] = mapped_column(String, nullable=False)
    minor_unit_exponent: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    display_locale: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Language(Base):
    __tablename__ = "languages"

    language_id: Mapped[str] = mapped_column(String, primary_key=True)
    bcp47: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    english_name: Mapped[str] = mapped_column(String, nullable=False)
    native_name: Mapped[str] = mapped_column(String, nullable=False)
    script: Mapped[str] = mapped_column(String, nullable=False)
    rtl: Mapped[bool] = mapped_column(Boolean, nullable=False)
    tts_supported: Mapped[bool] = mapped_column(Boolean, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Country(Base):
    __tablename__ = "countries"

    country_id: Mapped[str] = mapped_column(String, primary_key=True)
    iso2: Mapped[str] = mapped_column(String(2), nullable=False, unique=True)
    iso3: Mapped[str] = mapped_column(String(3), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    default_currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    calling_code: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    currency: Mapped["Currency"] = relationship("Currency", foreign_keys=[default_currency])


class FxRate(Base):
    __tablename__ = "fx_rates"

    fx_rate_id: Mapped[str] = mapped_column(String, primary_key=True)
    base_currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    quote_currency: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.iso4217"), nullable=False)
    rate_date: Mapped[date] = mapped_column(Date, nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        UniqueConstraint("base_currency", "quote_currency", "rate_date", name="fx_rates_base_currency_quote_currency_rate_date_key"),
    )
