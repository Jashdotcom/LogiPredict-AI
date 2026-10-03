"""
LogiPredict AI - Analytics API Router
=====================================
FastAPI endpoints for executive KPIs, time-series telemetry feeds,
multi-echelon inventory trends, forecast accuracy metrics, risk distribution,
replenishment lifecycle tracking, convoy delivery performance, and audit reports.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Query, status, Response

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
    DemoReportResponse,
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


# ==============================================================================
# CSV Data Export Endpoints (Phase 9.2)
# ==============================================================================

@router.get(
    "/export/inventory",
    summary="Export Filtered Inventory Catalog to CSV",
    response_description="RFC 4180 CSV attachment containing inventory telemetry",
)
async def export_inventory_csv(
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    search: Optional[str] = Query(None, description="Optional search term"),
):
    """
    Exports inventory status, daily burn rates, days of cover, safety thresholds,
    and valuation metrics to CSV with UTF-8 BOM encoding.
    """
    csv_data = analytics_service.export_inventory_csv(
        depot_id=depot_id,
        category=category,
        search=search,
    )
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    filename = f"logipredict_inventory_{today_str}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


@router.get(
    "/export/forecasts",
    summary="Export Demand Forecasts & Neural Error Metrics to CSV",
    response_description="RFC 4180 CSV attachment with historical and forward forecasts",
)
async def export_forecasts_csv(
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    timeframe: str = Query("7d", description="Evaluation timeframe"),
    horizon_days: int = Query(14, description="Forward forecast horizon in days"),
):
    """
    Exports historical demand evaluation (actual vs predicted, residuals, MAPE)
    and forward projections with 95% confidence intervals to CSV.
    """
    csv_data = analytics_service.export_forecasts_csv(
        depot_id=depot_id,
        category=category,
        timeframe=timeframe,
        horizon_days=horizon_days,
    )
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    filename = f"logipredict_forecasts_{today_str}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


@router.get(
    "/export/alerts",
    summary="Export Predictive Anomaly Alerts Repository to CSV",
    response_description="RFC 4180 CSV attachment containing anomaly alerts",
)
async def export_alerts_csv(
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
    severity: Optional[str] = Query(None, description="Optional severity filter: critical, warning, info"),
    status: Optional[str] = Query(None, description="Optional status filter: new, acknowledged, resolved"),
    search: Optional[str] = Query(None, description="Optional search term"),
):
    """
    Exports predictive anomaly alerts, severity levels, trigger conditions,
    recommended actions, and operational status to CSV.
    """
    csv_data = analytics_service.export_alerts_csv(
        depot_id=depot_id,
        category=category,
        severity=severity,
        status=status,
        search=search,
    )
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    filename = f"logipredict_alerts_{today_str}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )


# ==============================================================================
# Comprehensive Executive Demo Report Endpoints (Phase 9.2)
# ==============================================================================

@router.get(
    "/reports/demo-report",
    response_model=ApiResponse[DemoReportResponse],
    summary="Generate Comprehensive Executive Demo Report",
)
async def get_demo_report(
    timeframe: str = Query("7d", description="Timeframe filter: 24h, 7d, 30d"),
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
):
    """
    Generates multi-echelon executive briefing report combining inventory health,
    neural demand forecasting, anomaly alerts, convoy corridor telematics, and strategic recommendations.
    """
    report = analytics_service.generate_demo_report(
        timeframe=timeframe,
        depot_id=depot_id,
        category=category,
    )
    return ApiResponse(
        success=True,
        data=report,
        meta={"report_id": report.report_id, "generated_at": report.generated_at.isoformat()},
    )


@router.get(
    "/reports/demo-html",
    summary="Generate Printable Military Executive Demo Report (HTML)",
    response_description="Self-contained styled HTML document suitable for print or PDF conversion",
)
async def get_demo_report_html(
    timeframe: str = Query("7d", description="Timeframe filter: 24h, 7d, 30d"),
    depot_id: Optional[str] = Query(None, description="Optional depot filter ID"),
    category: Optional[str] = Query(None, description="Optional category filter"),
):
    """
    Renders military-grade HTML document for the Executive Demo Report with print CSS styling.
    """
    report = analytics_service.generate_demo_report(
        timeframe=timeframe,
        depot_id=depot_id,
        category=category,
    )
    html_content = analytics_service.generate_demo_report_html(report)
    return Response(
        content=html_content,
        media_type="text/html; charset=utf-8",
    )
