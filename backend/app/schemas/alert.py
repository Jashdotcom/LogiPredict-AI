"""
LogiPredict AI - Alert Schemas
==============================
Pydantic schemas for rule-based and predictive supply chain anomaly alerts,
severities, trigger conditions, acknowledgments, deduplication, and resolution tracking.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AlertSeverity(str, Enum):
    """Alert severity tiers"""
    INFO = "info"  # Informational advisory / low risk
    WARNING = "warning"  # Reorder buffer reached or slight delay / moderate risk
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
    title: str = Field(..., min_length=5, max_length=200, description="Concise alert title")
    description: str = Field(..., description="Detailed operational impact description")
    trigger_condition: str = Field(..., description="Exact mathematical rule or telemetry condition triggered")
    category: Optional[str] = Field(None, description="Supply category (e.g. POL, Medical, Ordnance)")
    item_id: Optional[str] = Field(None, description="Linked inventory SKU code if item-specific")
    item_name: Optional[str] = Field(None, description="SKU standard nomenclature")
    sku: Optional[str] = Field(None, description="SKU code alias")
    location_id: Optional[str] = Field(None, description="Linked FOB or Depot node ID")
    location_name: Optional[str] = Field(None, description="Depot / Base name")
    warehouse: Optional[str] = Field(None, description="Warehouse or location display name")
    route_id: Optional[str] = Field(None, description="Linked convoy route ID if route-specific")
    predicted_impact: str = Field(..., description="Estimated operational impact (e.g., Depletion in 42h)")
    predictedImpact: Optional[str] = Field(None, description="Frontend alias for predicted impact")
    recommended_action: str = Field(..., description="Actionable recommendation for logistics officer")
    recommendedAction: Optional[str] = Field(None, description="Frontend alias for recommended action")
    confidence_score: Optional[float] = Field(0.95, description="ML confidence score (0.0 to 1.0)")
    dedup_hash: Optional[str] = Field(
        None,
        description="Deterministic hash to prevent duplicate active alerts (e.g. md5(type+item+cond))",
    )
    is_synthetic: bool = Field(default=True, description="Whether generated synthetically for simulation")


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    """Schema for updating acknowledgment or resolution state"""
    is_acknowledged: Optional[bool] = None
    acknowledged_by: Optional[str] = None
    is_resolved: Optional[bool] = None
    resolution_notes: Optional[str] = None


class AlertAcknowledgeRequest(BaseModel):
    """Payload for operator acknowledgment"""
    acknowledged_by: str = Field(
        default="Col. Rajesh Verma",
        min_length=2,
        max_length=100,
        description="Callsign or name of the acknowledging logistics officer",
    )


class AlertResolveRequest(BaseModel):
    """Payload for anomaly mitigation resolution"""
    resolved_by: Optional[str] = Field(
        default="Col. Rajesh Verma",
        description="Callsign or name of the resolving logistics officer",
    )
    resolution_notes: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Details of mitigation protocol executed",
    )


class AlertEvaluationRequest(BaseModel):
    """Payload for on-demand rule evaluation against telemetry or inventory items"""
    inventory_items: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional batch of inventory items to evaluate. If omitted, uses stored inventory catalog.",
    )
    routes: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional batch of routes to evaluate. If omitted, uses stored route network.",
    )
    auto_persist: bool = Field(
        default=True,
        description="Whether triggered alerts should be automatically stored in active alert registry.",
    )


class AlertResponse(AlertBase):
    """Full alert response representation"""
    id: int = Field(..., description="Internal DB ID")
    status: str = Field(default="new", description="Lifecycle state ('new' | 'acknowledged' | 'resolved')")
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
    transit_risks_count: int = Field(default=0, description="Active route or transit disruption alerts")
    resolved_count: int = Field(default=0, description="Total mitigated alerts")
    latest_critical_alert: Optional[AlertResponse] = None
