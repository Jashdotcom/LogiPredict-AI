"""
LogiPredict AI - Forecasting Schemas
====================================
Pydantic schemas for AI demand predictions, time-series horizons, confidence intervals,
and model performance evaluation metrics.
"""

from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ForecastModelType(str, Enum):
    """Ensemble and individual forecasting algorithms"""
    ENSEMBLE = "Ensemble_LSTM_XGBoost_Prophet"
    LSTM = "Bidirectional_LSTM"
    XGBOOST = "XGBoost_Regressor"
    PROPHET = "Meta_Prophet"
    ARIMA = "SARIMAX"


class ForecastDataPoint(BaseModel):
    """Individual forecast timestamp prediction"""
    timestamp: datetime = Field(..., description="Target forecast date/time (ISO 8601)")
    period_label: str = Field(..., description="Display label (e.g., 'Day 1 (Mon)', 'Week 38')")
    actual_demand: Optional[float] = Field(None, ge=0, description="Actual demand if historical period")
    predicted_demand: float = Field(..., ge=0, description="Model point prediction")
    lower_bound: float = Field(..., ge=0, description="80% lower confidence interval boundary")
    upper_bound: float = Field(..., ge=0, description="80% upper confidence interval boundary")
    confidence_score: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Statistical confidence score for the prediction",
    )


class ModelEvaluationMetrics(BaseModel):
    """Standard forecast validation error metrics"""
    mape: float = Field(..., description="Mean Absolute Percentage Error (e.g. 3.2%)")
    rmse: float = Field(..., description="Root Mean Squared Error")
    mae: float = Field(..., description="Mean Absolute Error")
    r2_score: float = Field(..., description="Coefficient of determination (R²)")
    training_sample_count: int = Field(..., ge=0, description="Number of historical time-steps trained on")
    last_trained_at: datetime = Field(..., description="Timestamp of latest model retraining")


class ForecastRequest(BaseModel):
    """Request payload to trigger on-demand time-series inference"""
    item_ids: List[str] = Field(..., min_length=1, description="List of SKU codes to forecast")
    location_id: Optional[str] = Field(None, description="Optional target FOB / Depot filter")
    horizon_days: int = Field(default=14, ge=1, le=90, description="Forecast horizon window (1-90 days)")
    include_weather_factors: bool = Field(default=True, description="Incorporate mountain climate/snowfall features")
    include_operational_surge: bool = Field(default=False, description="Simulate military exercise / surge tempo")
    model_override: Optional[str] = Field(None, description="Optional specific model architecture")


class DemandForecastResponse(BaseModel):
    """Complete multi-period demand forecast dataset for an item"""
    forecast_id: str = Field(..., description="Unique forecast run identifier (e.g., FRC-2026-0891)")
    item_id: str = Field(..., description="Referenced inventory SKU code")
    item_name: str = Field(..., description="SKU standard nomenclature")
    category: str = Field(..., description="Supply echelon category")
    location_id: str = Field(..., description="Depot / Forward Operating Base ID")
    location_name: str = Field(..., description="Depot / FOB Name")
    unit_of_measurement: str = Field(..., description="Base unit (e.g. Liters, Packs)")
    forecast_horizon_days: int = Field(..., description="Number of future days predicted")
    generated_at: datetime = Field(..., description="Forecast generation timestamp (ISO 8601)")
    model_identifier: str = Field(..., description="Algorithm or ensemble identifier")
    evaluation_metrics: ModelEvaluationMetrics = Field(..., description="Model accuracy and error metrics")
    time_series: List[ForecastDataPoint] = Field(..., description="Sequential daily forecasted data points")
    total_projected_demand: float = Field(..., description="Sum of projected demand across horizon")
    peak_demand_date: Optional[datetime] = Field(None, description="Timestamp with highest projected load")
    stockout_risk_projected: bool = Field(default=False, description="Flag if forecast breaches safety threshold")

    model_config = ConfigDict(from_attributes=True)
