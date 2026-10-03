"""
LogiPredict AI - Database Declarative Base
==========================================
Defines the SQLAlchemy 2.0 DeclarativeBase for all ORM models in the system.
Indian Army Forward Supply Chain (SIH 2026).
"""

from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models in LogiPredict AI.
    Provides standard table metadata and serialization support.
    """
    pass


class TimestampMixin:
    """
    Standard mixin adding created_at and updated_at datetime columns.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
