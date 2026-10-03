"""
LogiPredict AI - Forecast Projections ORM Model
===============================================
Stores neural ensemble predictions, upper/lower confidence bounds (95%),
actual demand observations, residual errors, and evaluation diagnostics (MAPE, RMSE).
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


class ForecastRecordModel(Base):
    """
    Demand forecast time-series record with ensemble predictions,
    confidence intervals, and evaluation tracking.
    """
    __tablename__ = "forecast_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    forecast_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    item_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    location_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    forecast_date: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # YYYY-MM-DD
    predicted_demand: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_lower: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_upper: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.95, nullable=False)
    model_name: Mapped[str] = mapped_column(String(64), default="NeuralEnsemble", nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), default="v1.0.0", nullable=False)
    evaluation_mape: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    evaluation_rmse: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_demand: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    residual_error: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_forecast_item_loc_date", "item_id", "location_id", "forecast_date", unique=True),
        Index("idx_forecast_date", "forecast_date"),
    )
