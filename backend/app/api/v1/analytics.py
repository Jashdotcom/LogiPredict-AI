"""
LogiPredict AI - Analytics API Router
=====================================
FastAPI endpoints for executive KPIs, time-series telemetry feeds,
multi-echelon inventory trends, forecast accuracy metrics, risk distribution,
replenishment lifecycle tracking, convoy delivery performance, and audit reports.

Indian Army Forward Supply Chain (SIH 2026)
"""

from typing import Optional, List
from fastapi import APIRouter, Query, status

from app.schemas.common import ApiResponse
from app.schemas.analytics import (
    KpiMetric,
    DashboardSummaryResponse,
    InventoryTrendResponse,
    ForecastAccuracyResponse,
    StockoutRiskDistribution,
    ReplenishmentSummaryResponse,
    DeliveryPerformanceResponse,
    AnalyticsOverviewResponse,
    AuditReportResponse,
)
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


@router.get(
    "/overview",
    response_model=ApiResponse[AnalyticsOverviewResponse],
    summary="Get comprehensive unified analytics overview",
)
async def get_analytics_overview(
    timeframe: str = Query("7d", description="Timeframe filter: 24h, 7d, 30d, custom"),
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional supply category filter"),
    start_date: Optional[str] = Query(None, description="Start date for custom range (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date for custom range (YYYY-MM-DD)"),
):
    """
    Returns aggregated executive KPIs, multi-echelon inventory trend curves,
    demand forecast accuracy benchmarks, stockout risk distribution, replenishment lifecycle,
    and convoy telematics metrics in a single high-performance payload.
    """
    overview = analytics_service.get_analytics_overview(
        timeframe=timeframe,
        depot_id=depot_id,
        category=category,
        start_date=start_date,
        end_date=end_date,
    )
    return ApiResponse(
        success=True,
        data=overview,
        meta={"timeframe": timeframe, "source": "LogiPredict Telematics & Analytics Engine"},
    )


@router.get(
    "/kpis",
    response_model=ApiResponse[List[KpiMetric]],
    summary="Get 6 Core Executive Summary KPIs",
)
async def get_analytics_kpis(
    timeframe: str = Query("7d", description="Timeframe filter: 24h, 7d, 30d, custom"),
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
):
    """
    Returns the 6 Core Summary KPI cards: Total Inventory Value, Average Inventory Health,
    Forecast Accuracy, Critical Stockout Risks, Pending Replenishments, and On-Time Delivery Rate.
    """
    kpis = analytics_service.get_summary_kpis(
        timeframe=timeframe,
        depot_id=depot_id,
        category=category,
    )
    return ApiResponse(
        success=True,
        data=kpis,
        meta={"total_kpis": len(kpis)},
    )


@router.get(
    "/inventory-trends",
    response_model=ApiResponse[InventoryTrendResponse],
    summary="Get Multi-Echelon Inventory Trend Series",
)
async def get_inventory_trends(
    timeframe: str = Query("7d", description="Timeframe filter: 24h, 7d, 30d, custom"),
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    start_date: Optional[str] = Query(None, description="Start date for custom range"),
    end_date: Optional[str] = Query(None, description="End date for custom range"),
):
    """
    Returns on-hand stock levels, stock-in inflows, and stock-out outflows over time
    with safety threshold lines and net velocity.
    """
    trends = analytics_service.get_inventory_trends(
        timeframe=timeframe,
        depot_id=depot_id,
        category=category,
        start_date=start_date,
        end_date=end_date,
    )
    return ApiResponse(
        success=True,
        data=trends,
        meta={"resolution": trends.resolution},
    )


@router.get(
    "/forecast-accuracy",
    response_model=ApiResponse[ForecastAccuracyResponse],
    summary="Get Demand Forecast Accuracy & Residuals",
)
async def get_forecast_accuracy(
    timeframe: str = Query("7d", description="Timeframe filter: 24h, 7d, 30d"),
):
    """
    Returns actual vs forecasted demand curves, residual error tracking,
    Mean Absolute Percentage Error (MAPE), and Mean Absolute Error (MAE).
    """
    accuracy = analytics_service.get_forecast_accuracy(timeframe=timeframe)
    return ApiResponse(
        success=True,
        data=accuracy,
    )


@router.get(
    "/stockout-risks",
    response_model=ApiResponse[StockoutRiskDistribution],
    summary="Get Stockout Risk Distribution across Nodes",
)
async def get_stockout_risks(
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
):
    """
    Returns distribution of healthy, low stock, critical, and predicted stockout SKUs
    grouped by military depot and category.
    """
    risks = analytics_service.get_stockout_risks(depot_id=depot_id, category=category)
    return ApiResponse(
        success=True,
        data=risks,
    )


@router.get(
    "/replenishment-summary",
    response_model=ApiResponse[ReplenishmentSummaryResponse],
    summary="Get Requisition Lifecycle & Fulfillment Summary",
)
async def get_replenishment_summary():
    """
    Returns requisition status progression across canonical military states
    (draft, submitted, approved, dispatched, in_transit, delivered, cancelled),
    fulfillment rates, and category volumes.
    """
    summary = analytics_service.get_replenishment_summary()
    return ApiResponse(
        success=True,
        data=summary,
    )


@router.get(
    "/delivery-performance",
    response_model=ApiResponse[DeliveryPerformanceResponse],
    summary="Get Convoy Delivery Performance & Corridor Telematics",
)
async def get_delivery_performance():
    """
    Returns convoy mission metrics, on-time delivery percentages, transit duration benchmarks,
    and corridor pass status (Zoji La, Fotu La, Khardung La).
    """
    perf = analytics_service.get_delivery_performance()
    return ApiResponse(
        success=True,
        data=perf,
    )


@router.get(
    "/audit-report",
    response_model=ApiResponse[AuditReportResponse],
    summary="Generate Formatted Logistics Audit Report",
)
async def get_audit_report(
    scope: str = Query("Northern Command Ladakh Sector", description="Audited military command sector"),
):
    """
    Generates formal military compliance audit report with readiness index,
    mitigated stockouts, optimized fuel conservation, and risk highlights.
    """
    report = analytics_service.generate_audit_report(scope=scope)
    return ApiResponse(
        success=True,
        data=report,
    )
