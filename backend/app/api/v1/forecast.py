"""
LogiPredict AI - Demand Forecasting API Router
===============================================
Phase 5.2: Demand Forecasting API Router & Inference Endpoints
Indian Army Forward Supply Chain (SIH 2026)

Delegates all time-series demand forecasting, model inference, validation benchmarking,
and pipeline retraining to modular backend services.

DISCLAIMER: All predictions, metrics, and stock drawdown simulations are generated
from synthetic models and are strictly for demonstration, research, and testing.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, Path, Body, status, HTTPException

from app.schemas.common import ApiResponse
from app.schemas.forecast import (
    ForecastRequest,
    ForecastDatasetResponse,
    ValidationMetricsResponse,
    RetrainResponse,
)
from app.services.forecast_service import forecasting_service
from app.utils.exceptions import ValidationError, NotFoundError

router = APIRouter(prefix="", tags=["Demand Forecasting"])


@router.get(
    "/forecast",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Aggregated or SKU Demand Forecast",
)
async def get_forecast(
    itemId: Optional[str] = Query(None, alias="itemId", description="Item SKU ID"),
    item_id: Optional[str] = Query(None, description="Item SKU ID (snake_case)"),
    depot: str = Query("all", description="Depot or storage location filter"),
    horizonDays: Optional[int] = Query(None, alias="horizonDays", ge=1, le=90, description="Forecast horizon in days"),
    horizon_days: Optional[int] = Query(None, ge=1, le=90, description="Forecast horizon in days (snake_case)"),
    modelName: Optional[str] = Query(None, alias="modelName", description="Model architecture"),
    model_name: Optional[str] = Query(None, description="Model architecture (snake_case)"),
):
    """
    Returns multi-horizon demand projections, 95% confidence intervals, and summary metrics.
    Supports both camelCase (frontend standard) and snake_case query parameter aliases.
    """
    selected_item = itemId or item_id or "all"
    selected_horizon = horizonDays or horizon_days or 14
    selected_model = modelName or model_name or "ensemble"

    result = forecasting_service.generate_demand_forecast(
        item_id=selected_item,
        depot=depot,
        horizon_days=selected_horizon,
        model_name=selected_model,
        history_days=7,
        confidence_level=0.95,
    )

    return ApiResponse(
        success=True,
        data={
            "series": result["series"],
            "summary": result["summary"],
        },
        meta=result.get("metadata", {
            "engine": "Ensemble-LSTM-Prophet-XGBoost-v2",
            "confidence_level": 0.95,
            "lookback_days": 7,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "is_synthetic": True,
            "data_source": "synthetic",
        }),
    )


@router.get(
    "/forecasting/item/{item_id}",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Item Specific Forecast",
)
async def get_item_forecast(
    item_id: str = Path(..., description="Target inventory item SKU"),
    depot: str = Query("all", description="Storage location"),
    horizon_days: int = Query(14, ge=1, le=90, description="Horizon days"),
    model_name: str = Query("ensemble", description="Model identifier"),
):
    """
    Retrieves granular forecast data points for a specific item SKU.
    """
    result = forecasting_service.generate_demand_forecast(
        item_id=item_id,
        depot=depot,
        horizon_days=horizon_days,
        model_name=model_name,
        history_days=7,
        confidence_level=0.95,
    )

    return ApiResponse(
        success=True,
        data={
            "series": result["series"],
            "summary": result["summary"],
        },
        meta=result.get("metadata"),
    )


@router.post(
    "/forecast/retrain",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Trigger Model Pipeline Retrain",
)
@router.post(
    "/forecasting/predict",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Trigger Inference Pipeline",
)
async def trigger_retrain(payload: Dict[str, Any] = Body(default_factory=dict)):
    """
    Executes neural model retraining or on-demand inference across forward logistics nodes.
    """
    result = forecasting_service.retrain_model_pipeline(payload=payload)
    return ApiResponse(
        success=True,
        data=result,
        meta={
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "is_synthetic": True,
            "data_source": "synthetic",
        },
    )


@router.get(
    "/forecasting/metrics",
    response_model=ApiResponse[Dict[str, Any]],
    summary="Get Forecasting Validation Metrics",
)
async def get_forecast_metrics(
    item_id: str = Query("SKU-POL-DSL-01", description="Reference SKU for validation benchmarks"),
    depot: str = Query("all", description="Depot filter"),
):
    """
    Returns model validation benchmarks, MAPE, RMSE, R² scores, and training metadata.
    """
    result = forecasting_service.get_validation_benchmarks(item_id=item_id, depot=depot)
    return ApiResponse(
        success=True,
        data=result,
        meta={
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "is_synthetic": True,
            "data_source": "synthetic",
        },
    )
