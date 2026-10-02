"""
LogiPredict AI - Analytics & Reporting Schemas
==============================================
Pydantic schemas for executive KPIs, telemetry feeds, audit reports,
and export metadata.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class KpiMetric(BaseModel):
    id: str = Field(..., description="Unique KPI slug")
    title: str = Field(..., description="Metric display title")
    value: str = Field(..., description="Formatted string display value")
    raw_number: float = Field(..., description="Numeric value for charting")
    change: str = Field(..., description="Delta percentage or absolute change")
    is_positive: bool = Field(..., description="Whether change represents a positive operational trend")
    timeframe: str = Field(..., description="Context benchmark (e.g., 'vs last week')")
    description: str = Field(..., description="Subtext explanation")
    status: str = Field(..., description="Status badge label (e.g. Optimal, Action Needed)")
    status_variant: str = Field(..., description="UI badge variant (success, warning, danger, brand)")
    icon_name: str = Field(..., description="Lucide icon reference name")
    color_scheme: str = Field(..., description="Color theme slug")


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
