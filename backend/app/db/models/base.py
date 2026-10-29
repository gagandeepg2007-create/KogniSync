from sqlalchemy.orm import DeclarativeBase
from app.db.database import Base


class AppBase(DeclarativeBase):
    """Declarative base for application-owned tables (separate from canonical schema)."""
    pass


__all__ = ["Base", "AppBase"]
