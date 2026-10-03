"""
LogiPredict AI - Analytics & Reporting Schemas
==============================================
Pydantic schemas for executive KPIs, time-series telemetry feeds,
multi-echelon inventory trends, forecast accuracy metrics, risk distribution,
replenishment lifecycle tracking, convoy delivery performance, and audit reports.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


# ==============================================================================
# Executive KPI Schemas
# ==============================================================================

class KpiMetric(BaseModel):
    id: str = Field(..., description="Unique KPI slug")
    title: str = Field(..., description="Metric display title")
    value: str = Field(..., description="Formatted string display value")
    raw_number: float = Field(..., description="Numeric value for charting")
    rawNumber: Optional[float] = Field(None, description="CamelCase alias for frontend")
    unit: Optional[str] = Field(None, description="Unit suffix (e.g., %, Cr, SKUs)")
    change: str = Field(..., description="Delta percentage or absolute change (e.g., +2.4%)")
    trend: Optional[str] = Field(default="neutral", description="up, down, or neutral")
    is_positive: bool = Field(..., description="Whether change represents a positive operational trend")
    isPositive: Optional[bool] = Field(None, description="CamelCase alias")
    timeframe: str = Field(..., description="Context benchmark (e.g., 'vs last 7 days')")
    description: Optional[str] = Field(None, description="Subtext explanation")
    status: Optional[str] = Field(None, description="Status badge label (e.g. Optimal, Warning, Critical)")
    status_variant: Optional[str] = Field(None, description="UI badge variant (success, warning, danger, brand, info)")
    statusVariant: Optional[str] = Field(None, description="CamelCase alias")
    icon_name: str = Field(default="Boxes", description="Lucide icon reference name")
    iconName: Optional[str] = Field(None, description="CamelCase alias")
    color_scheme: str = Field(default="indigo", description="Color theme slug (indigo, emerald, amber, rose, blue, purple)")
    colorScheme: Optional[str] = Field(None, description="CamelCase alias")

    model_config = ConfigDict(from_attributes=True)


class ActivityLogEntry(BaseModel):
    id: str = Field(..., description="Activity entry ID")
    type: str = Field(..., description="Event type: reorder, reroute, model_sync, transfer, delivery")
    title: str = Field(..., description="Activity title")
    detail: str = Field(..., description="Detailed description")
    timestamp: datetime = Field(..., description="Event timestamp")
    user: str = Field(..., description="Operator or AI Agent name")
    status: str = Field(..., description="Operational status: Completed, In Progress, Dispatched")


class DashboardSummaryResponse(BaseModel):
    kpis: List[KpiMetric] = Field(..., description="Primary executive KPI cards")
    recent_activities: List[ActivityLogEntry] = Field(default_factory=list)
    system_status: str = Field(default="optimal")
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)


# ==============================================================================
# 1. Multi-Echelon Inventory Trend Schemas
# ==============================================================================

class InventoryTrendPoint(BaseModel):
    timestamp: str = Field(..., description="ISO timestamp or formatted date")
    date: str = Field(..., description="Short date label (e.g., Oct 03, 14:00)")
    total_stock: float = Field(..., description="On-hand inventory level")
    stock_in: float = Field(default=0.0, description="Inflow volume / receipts")
    stock_out: float = Field(default=0.0, description="Outflow volume / consumption")
    safety_threshold: float = Field(..., description="Minimum safety stock threshold")
    net_velocity: float = Field(default=0.0, description="Net velocity (inflow - outflow)")


class InventoryTrendResponse(BaseModel):
    timeframe: str = Field(default="7d", description="Requested timeframe (24h, 7d, 30d, custom)")
    resolution: str = Field(default="daily", description="Sampling resolution (hourly, daily, weekly)")
    depot_id: Optional[str] = Field(None, description="Filtered depot ID or None for all")
    category: Optional[str] = Field(None, description="Filtered category or None for all")
    data: List[InventoryTrendPoint] = Field(default_factory=list, description="Time series data points")
    summary: Dict[str, Any] = Field(
        default_factory=dict,
        description="Summary metrics (current_stock, total_inflow, total_outflow, net_change, turnover_rate)",
    )


# ==============================================================================
# 2. Demand Forecast Accuracy & Error Residual Schemas
# ==============================================================================

class ForecastAccuracyPoint(BaseModel):
    date: str = Field(..., description="Timeline point label (e.g., Sep 27)")
    actual_demand: float = Field(..., description="Actual observed demand consumption")
    forecasted_demand: float = Field(..., description="AI model forecasted demand")
    residual_error: float = Field(..., description="Actual - Forecasted (signed error)")
    absolute_error: float = Field(..., description="Absolute error |Actual - Forecasted|")
    percentage_error: float = Field(..., description="Absolute percentage error %")


class ForecastAccuracyResponse(BaseModel):
    timeframe: str = Field(default="7d", description="Evaluation timeframe")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")
    mae: float = Field(..., description="Mean Absolute Error (Units)")
    rmse: float = Field(..., description="Root Mean Squared Error")
    accuracy_percentage: float = Field(..., description="Overall model accuracy (100 - MAPE)")
    r_squared: float = Field(default=0.96, description="Coefficient of determination (R²)")
    data: List[ForecastAccuracyPoint] = Field(default_factory=list, description="Historical demand evaluation series")


# ==============================================================================
# 3. Stockout Risk Distribution Schemas
# ==============================================================================

class StockoutRiskByDepot(BaseModel):
    depot_id: str = Field(..., description="Depot identifier")
    depot_name: str = Field(..., description="Depot nomenclature")
    healthy: int = Field(default=0, description="Count of healthy stock items")
    low_stock: int = Field(default=0, description="Count of low stock / reorder items")
    critical: int = Field(default=0, description="Count of critical stockout risk items")
    predicted_stockout: int = Field(default=0, description="Items predicted to stockout within 7 days")


class StockoutRiskByCategory(BaseModel):
    category: str = Field(..., description="Supply category (e.g. POL, Ammunition)")
    healthy: int = Field(default=0, description="Healthy count")
    low_stock: int = Field(default=0, description="Low stock count")
    critical: int = Field(default=0, description="Critical count")
    predicted_stockout: int = Field(default=0, description="Predicted stockout count")


class StockoutRiskDistribution(BaseModel):
    healthy_count: int = Field(..., description="Aggregate healthy SKUs")
    low_stock_count: int = Field(..., description="Aggregate low stock SKUs")
    critical_count: int = Field(..., description="Aggregate critical SKUs")
    predicted_stockout_count: int = Field(..., description="Aggregate predicted stockouts")
    total_items: int = Field(..., description="Total tracked SKUs")
    healthy_percentage: float = Field(default=0.0, description="Percentage of healthy stock")
    by_depot: List[StockoutRiskByDepot] = Field(default_factory=list, description="Breakdown by military location")
    by_category: List[StockoutRiskByCategory] = Field(default_factory=list, description="Breakdown by supply category")
    critical_items: List[Dict[str, Any]] = Field(default_factory=list, description="Top high-risk SKUs requiring urgent replenishment")


# ==============================================================================
# 4. Replenishment Summary & Lifecycle Tracking Schemas
# ==============================================================================

class ReplenishmentTrendPoint(BaseModel):
    date: str = Field(..., description="Timeline label")
    created_orders: int = Field(default=0, description="New purchase requisitions created")
    dispatched_orders: int = Field(default=0, description="Convoys dispatched from base depots")
    delivered_orders: int = Field(default=0, description="Consignments received and verified at FOBs")


class ReplenishmentSummaryResponse(BaseModel):
    total_requisitions: int = Field(..., description="Total requisitions across lifecycle")
    active_requisitions: int = Field(..., description="Open orders requiring depot action or transit")
    status_breakdown: Dict[str, int] = Field(
        ...,
        description="Count by canonical status (draft, submitted, approved, dispatched, in_transit, delivered, cancelled)",
    )
    fulfillment_rate_percentage: float = Field(..., description="Percentage of orders delivered on schedule")
    average_lead_time_days: float = Field(..., description="Average replenishment cycle duration in days")
    volume_by_category: Dict[str, float] = Field(default_factory=dict, description="Allocated requisition volume by category")
    requisition_trends: List[ReplenishmentTrendPoint] = Field(default_factory=list, description="Time series of order volumes")


# ==============================================================================
# 5. Convoy Delivery Performance & Corridor Telematics Schemas
# ==============================================================================

class CorridorMetricPoint(BaseModel):
    route_id: str = Field(..., description="Route corridor ID")
    route_name: str = Field(..., description="Corridor Name (e.g., NH-1D via Zoji La)")
    origin: str = Field(..., description="Origin Hub")
    destination: str = Field(..., description="Destination FOB")
    standard_hours: float = Field(..., description="Nominal benchmark transit hours")
    actual_hours: float = Field(..., description="Observed average transit hours")
    delay_hours: float = Field(..., description="Delay relative to benchmark")
    on_time_rate_percentage: float = Field(..., description="Corridor on-time delivery rate")
    total_convoys: int = Field(..., description="Total convoy missions completed")
    road_condition: str = Field(default="Clear_All_Weather", description="Current corridor pass status")


class DeliveryPerformanceResponse(BaseModel):
    total_deliveries: int = Field(..., description="Total completed convoy missions")
    completed_deliveries: int = Field(..., description="Deliveries successfully completed")
    delayed_deliveries: int = Field(..., description="Deliveries delayed beyond SLA")
    in_transit_deliveries: int = Field(..., description="Active convoys currently en route")
    on_time_delivery_rate_percentage: float = Field(..., description="On-Time Delivery (OTD) percentage")
    average_transit_hours: float = Field(..., description="Fleet-wide mean transit duration")
    transit_delay_hours: float = Field(..., description="Mean delay in transit hours")
    corridor_metrics: List[CorridorMetricPoint] = Field(default_factory=list, description="Per-corridor performance")


# ==============================================================================
# Master Analytics Overview & Audit Report Schemas
# ==============================================================================

class AnalyticsOverviewResponse(BaseModel):
    timeframe: str = Field(default="7d", description="Active timeframe query")
    start_date: Optional[str] = Field(None, description="Start date of analysis")
    end_date: Optional[str] = Field(None, description="End date of analysis")
    depot_filter: Optional[str] = Field(None, description="Active depot filter")
    category_filter: Optional[str] = Field(None, description="Active category filter")
    kpis: List[KpiMetric] = Field(..., description="6 Core Executive Summary KPIs")
    inventory_trends: InventoryTrendResponse = Field(..., description="Stock velocity and levels")
    forecast_accuracy: ForecastAccuracyResponse = Field(..., description="Neural model accuracy diagnostics")
    stockout_risks: StockoutRiskDistribution = Field(..., description="Risk distribution across forward posts")
    replenishment_summary: ReplenishmentSummaryResponse = Field(..., description="Requisition lifecycle breakdown")
    delivery_performance: DeliveryPerformanceResponse = Field(..., description="Fleet telematics & OTD")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Analysis generation timestamp")


class AuditReportResponse(BaseModel):
    report_id: str = Field(..., description="Audit report ID")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    classification: str = Field(default="RESTRICTED // SIH-2026-DEMO")
    scope: str = Field(..., description="Audited command sector")
    overall_readiness_score: float = Field(..., description="Scale 0 to 100")
    total_requisitions_processed: int = Field(..., ge=0)
    total_fuel_burn_optimized_liters: float = Field(..., ge=0)
    stockout_mitigation_rate: float = Field(..., description="Percentage of avoided stockouts")
    summary_notes: str = Field(...)
    kpi_highlights: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    top_risk_locations: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


# ==============================================================================
# Comprehensive Executive Demo Report Schemas (Phase 9.2)
# ==============================================================================

class DemoReportRecommendation(BaseModel):
    priority: str = Field(..., description="URGENT, HIGH, MEDIUM, ROUTINE")
    category: str = Field(..., description="POL, Ordnance, Medical, Route, Buffer")
    title: str = Field(..., description="Action recommendation headline")
    description: str = Field(..., description="Operational detail and risk mitigation context")
    target_node: str = Field(..., description="Affected depot, corridor, or brigade FOB")
    suggested_action: str = Field(..., description="Specific command intervention")
    requires_human_review: bool = Field(default=True, description="Human-in-the-loop sign-off required")


class DemoReportResponse(BaseModel):
    report_id: str = Field(..., description="Unique report identifier e.g. REP-HQNC-2026-...")
    title: str = Field(default="HQ Northern Command Master Readiness & Logistics Report")
    subtitle: str = Field(default="Multi-Echelon Telematics, AI Forecasting Diagnostics & Stockout Risk Audit")
    classification: str = Field(default="RESTRICTED // HQ NC // SIH 2026")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    period: str = Field(default="Last 7 Days (Standard Military Assessment)")
    scope: str = Field(default="Northern Command Forward Supply Chain (Ladakh & Kashmir Sectors)")
    disclaimer: str = Field(
        default="SYNTHETIC DATA DISCLAIMER: All metrics, inventory figures, convoy telematics, and demand projections are simulated for demonstration, research, and testing purposes under the Smart India Hackathon (SIH 2026) framework."
    )
    executive_summary: Dict[str, Any] = Field(..., description="High-level readiness, valuation, health %, and key takeaways")
    inventory_analysis: Dict[str, Any] = Field(..., description="Multi-echelon stock levels, category allocation, and critical stockout items")
    forecasting_analysis: Dict[str, Any] = Field(..., description="Neural model accuracy, residual metrics, and 7-day demand projections")
    predictive_alerts_summary: Dict[str, Any] = Field(..., description="Anomaly counts by severity, active vs resolved, and top alerts")
    logistics_performance: Dict[str, Any] = Field(..., description="Mountain corridor transit telemetry, delays, and OTD rate")
    strategic_recommendations: List[DemoReportRecommendation] = Field(default_factory=list, description="Prioritized human-in-the-loop action items")
    certification: Dict[str, Any] = Field(default_factory=dict, description="Algorithmic verification hash and command sign-off block")

