"""
LogiPredict AI - Forecasting Schemas
====================================
Phase 5.2: Forecasting Engine Schemas
Indian Army Forward Supply Chain (SIH 2026)

Pydantic schemas for demand predictions, time-series horizons, confidence intervals,
and model performance evaluation metrics.
"""

from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict


class ForecastModelType(str, Enum):
    """Ensemble and individual forecasting algorithms"""
    ENSEMBLE = "Ensemble_LSTM_XGBoost_Prophet"
    LSTM = "Bidirectional_LSTM"
    XGBOOST = "XGBoost_Regressor"
    PROPHET = "Meta_Prophet"
    MOVING_AVERAGE = "Moving_Average"
    BASELINE = "Historical_Mean_Baseline"


class ForecastSeriesItem(BaseModel):
    """Single point in the historical lookback and future forecast time-series"""
    dayIndex: int = Field(..., description="Day index (-N for history, 0 to H-1 for future)")
    date: str = Field(..., description="Calendar date string (YYYY-MM-DD)")
    label: str = Field(..., description="Formatted display label (e.g. 'Thu, Oct 08')")
    isHistorical: bool = Field(..., description="True if historical ground truth observation")
    actual: Optional[float] = Field(None, ge=0, description="Observed demand if historical period")
    forecast: Optional[float] = Field(None, ge=0, description="Predicted demand if future period")
    lowerBound: Optional[float] = Field(None, ge=0, description="95% lower confidence interval boundary")
    upperBound: Optional[float] = Field(None, ge=0, description="95% upper confidence interval boundary")
    currentStock: float = Field(..., ge=0, description="Current depot on-hand stock")
    projectedStock: float = Field(..., ge=0, description="Simulated forward stock drawdown")
    stockStatus: str = Field(..., description="Stock health status (Healthy, Warning, Critical, Out of Stock)")


class ForecastSummary(BaseModel):
    """Aggregated demand and performance summary metrics"""
    totalPredictedDemand: float = Field(..., ge=0, description="Sum of projected demand across horizon")
    avgDailyDemand: float = Field(..., ge=0, description="Mean daily demand across horizon")
    peakDemand: float = Field(..., ge=0, description="Peak single-day projected demand")
    minDemand: float = Field(..., ge=0, description="Minimum single-day projected demand")
    expectedChangePct: float = Field(..., description="Percentage change from start to end of horizon")
    horizonDays: int = Field(..., ge=1, description="Forecast horizon in days")
    modelName: str = Field(..., description="Model identifier used for inference")
    accuracy: float = Field(..., description="Holdout accuracy score (0.0 to 1.0)")
    mape: float = Field(..., description="Mean Absolute Percentage Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    mae: float = Field(..., description="Mean Absolute Error")
    r2_score: float = Field(..., description="Coefficient of determination (R²)")


class ForecastDatasetResponse(BaseModel):
    """Structured forecast payload matching frontend command center interface"""
    series: List[ForecastSeriesItem] = Field(..., description="Sequential historical and forecasted data points")
    summary: ForecastSummary = Field(..., description="Forecast aggregate summary and validation metrics")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata and synthetic attribution")


class ModelBenchmarkItem(BaseModel):
    """Comparative performance benchmark for a single algorithm"""
    name: str = Field(..., description="Model display nomenclature")
    model_type: str = Field(..., description="Internal model type slug")
    accuracy: str = Field(..., description="Formatted accuracy percentage (e.g. '96.8%')")
    mape: str = Field(..., description="Formatted MAPE percentage (e.g. '3.2%')")
    rmse: float = Field(..., description="Root Mean Squared Error")
    mae: float = Field(..., description="Mean Absolute Error")
    r2_score: float = Field(..., description="R² goodness of fit score")
    status: str = Field(..., description="Operational status: active, standby, baseline")


class ValidationMetricsResponse(BaseModel):
    """Validation metrics and multi-model benchmark leaderboard"""
    mape: float = Field(..., description="Active ensemble MAPE")
    rmse: float = Field(..., description="Active ensemble RMSE")
    mae: float = Field(..., description="Active ensemble MAE")
    r2_score: float = Field(..., description="Active ensemble R² score")
    accuracy: float = Field(..., description="Active ensemble Accuracy")
    training_sample_count: int = Field(default=8640, description="Historical time-steps trained on")
    last_trained_at: str = Field(..., description="Timestamp of latest model retraining (ISO 8601)")
    models: List[ModelBenchmarkItem] = Field(default_factory=list, description="Model leaderboard")
    is_synthetic: bool = Field(default=True, description="Synthetic data disclaimer flag")
    data_source: str = Field(default="synthetic", description="Attribution origin")


class ForecastRequest(BaseModel):
    """Request payload to trigger on-demand time-series inference"""
    item_ids: Optional[List[str]] = Field(default=None, description="List of SKU codes to forecast")
    item_id: Optional[str] = Field(default="all", description="Single SKU code or 'all'")
    location_id: Optional[str] = Field(default="all", description="Target FOB / Depot filter")
    depot: Optional[str] = Field(default="all", description="Target FOB / Depot filter (alias)")
    horizon_days: int = Field(default=14, ge=1, le=90, description="Forecast horizon window (1-90 days)")
    include_weather_factors: bool = Field(default=True, description="Incorporate mountain climate/snowfall features")
    include_operational_surge: bool = Field(default=False, description="Simulate military exercise / surge tempo")
    model_override: Optional[str] = Field(default="ensemble", description="Optional specific model architecture")


class RetrainResponse(BaseModel):
    """Response payload for pipeline retrain trigger"""
    pipeline_status: str = Field(..., description="Status of retrain pipeline (e.g. synchronized)")
    timestamp: str = Field(..., description="Completion timestamp (ISO 8601)")
    accuracy: str = Field(..., description="Achieved accuracy percentage")
    mape: str = Field(..., description="Achieved MAPE percentage")
    rmse: float = Field(..., description="Model RMSE score")
    mae: float = Field(..., description="Model MAE score")
    r2_score: float = Field(..., description="Model R² score")
    retrained_epochs: int = Field(default=150, description="Number of completed neural epochs")
    message: str = Field(..., description="Operational status message")
    is_synthetic: bool = Field(default=True, description="Synthetic data disclaimer flag")
    data_source: str = Field(default="synthetic", description="Attribution origin")
