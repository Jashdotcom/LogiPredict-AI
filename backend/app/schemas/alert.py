"""
LogiPredict AI - Alert Schemas
==============================
Pydantic schemas for rule-based and predictive supply chain anomaly alerts,
severities, trigger conditions, acknowledgments, and resolution tracking.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AlertSeverity(str, Enum):
    """Alert severity tiers"""
    INFO = "info"  # Informational advisory
    WARNING = "warning"  # Reorder buffer reached or slight delay
    CRITICAL = "critical"  # Severe stockout hazard, cold-chain spike, or route blocked


class AlertType(str, Enum):
    """Categorized root trigger causes"""
    LOW_STOCK = "low_stock"  # Stock <= reorder level
    PREDICTED_STOCKOUT = "predicted_stockout"  # Forecast predicts depletion before replenishment
    REPLENISHMENT_REQUIRED = "replenishment_required"  # Stock <= safety stock & no active PO
    DEMAND_SURGE = "demand_surge"  # Consumption rate >= 1.5x historical mean
    DELAYED_SUPPLY = "delayed_supply"  # Convoy transit ETA exceeded
    ROUTE_DISRUPTION = "route_disruption"  # High terrain risk, landslide, or snow block
    FORECAST_ANOMALY = "forecast_anomaly"  # Residual deviation > 3 sigma from expected pattern
    COLD_CHAIN_EXCURSION = "cold_chain_excursion"  # Temperature outside acceptable range


class AlertBase(BaseModel):
    """Base schema for supply chain anomaly alerts"""
    alert_id: str = Field(..., description="Unique alert identifier (e.g. ALT-1049)")
    alert_type: AlertType = Field(..., description="Rule-based or ML anomaly classification")
    severity: AlertSeverity = Field(..., description="Severity classification (info, warning, critical)")
    title: str = Field(..., min_length=5, max_length=150, description="Concise alert title")
    description: str = Field(..., description="Detailed operational impact description")
    trigger_condition: str = Field(..., description="Exact mathematical rule or telemetry condition triggered")
    item_id: Optional[str] = Field(None, description="Linked inventory SKU code if item-specific")
    item_name: Optional[str] = Field(None, description="SKU standard nomenclature")
    location_id: Optional[str] = Field(None, description="Linked FOB or Depot node ID")
    location_name: Optional[str] = Field(None, description="Depot / Base name")
    route_id: Optional[str] = Field(None, description="Linked convoy route ID if route-specific")
    predicted_impact: str = Field(..., description="Estimated operational impact (e.g., Depletion in 42h)")
    recommended_action: str = Field(..., description="Actionable recommendation for logistics officer")
    dedup_hash: Optional[str] = Field(
        None,
        description="Deterministic hash to prevent duplicate active alerts (e.g. md5(type+item+cond))",
    )


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    """Schema for updating acknowledgment or resolution state"""
    is_acknowledged: Optional[bool] = None
    acknowledged_by: Optional[str] = None
    is_resolved: Optional[bool] = None
    resolution_notes: Optional[str] = None


class AlertResponse(AlertBase):
    """Full alert response representation"""
    id: int = Field(..., description="Internal DB ID")
    is_acknowledged: bool = Field(default=False, description="Whether alert was acknowledged by operator")
    acknowledged_by: Optional[str] = Field(None, description="Callsign / Username who acknowledged")
    acknowledged_at: Optional[datetime] = Field(None, description="Acknowledgment timestamp")
    is_resolved: bool = Field(default=False, description="Whether root anomaly condition was resolved")
    resolved_by: Optional[str] = Field(None, description="Callsign / Username who resolved")
    resolved_at: Optional[datetime] = Field(None, description="Resolution timestamp")
    resolution_notes: Optional[str] = Field(None, description="Resolution explanation or action taken")
    created_at: datetime = Field(..., description="Alert creation timestamp (ISO 8601)")
    updated_at: datetime = Field(..., description="Last update timestamp (ISO 8601)")

    model_config = ConfigDict(from_attributes=True)


class AlertSummary(BaseModel):
    """High-level summary of active alerts across the supply network"""
    total_active_alerts: int = Field(..., description="Count of unresolved alerts")
    critical_count: int = Field(..., description="Count of critical severity alerts")
    warning_count: int = Field(..., description="Count of warning severity alerts")
    info_count: int = Field(..., description="Count of informational notices")
    unacknowledged_count: int = Field(..., description="Alerts requiring immediate officer acknowledgment")
    latest_critical_alert: Optional[AlertResponse] = None
