"""
LogiPredict AI - Historical Demand Telemetry ORM Model
======================================================
Records daily consumption history, weather factors, surge markers,
and synthetic attribution flags for AI model training and evaluation.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class DemandHistoryModel(Base):
    """
    Time-series ground truth demand telemetry recorded daily per SKU and location.
    """
    __tablename__ = "demand_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    location_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # YYYY-MM-DD
    actual_demand: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit_of_measurement: Mapped[str] = mapped_column(String(32), nullable=False)
    temperature_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    snowfall_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_surge_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    data_source: Mapped[str] = mapped_column(String(32), default="synthetic", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_demand_item_loc_date", "item_id", "location_id", "date", unique=True),
        Index("idx_demand_date", "date"),
    )
