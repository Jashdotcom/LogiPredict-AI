"""
LogiPredict AI - Simulation Schemas
===================================
Pydantic schemas for forward logistics discrete-event / Monte Carlo simulations:
scenario parameters, disruption matrices, projected inventory trajectories,
and resource utilization outcomes.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DisruptionScenarioType(str, Enum):
    """Pre-configured stress-test scenario modes"""
    BASELINE_PEACETIME = "baseline_peacetime"
    WINTER_PASS_CLOSURE = "winter_pass_closure"  # Snow block cuts main highway for 10-30 days
    HIGH_INTENSITY_SURGE = "high_intensity_surge"  # Daily ammunition/fuel consumption x3.5
    AVALANCHE_LANDSLIDE = "avalanche_landslide"  # Specific route transit time x4.0
    COLD_CHAIN_POWER_FAILURE = "cold_chain_power_failure"  # Backup generators down at forward hub
    SUPPLIER_LEAD_TIME_DILATION = "supplier_lead_time_dilation"  # Rear depot delivery delayed +100%


class DisruptionScenario(BaseModel):
    """Configurable disruption event injected into simulation run"""
    scenario_type: DisruptionScenarioType = Field(..., description="Scenario type identifier")
    start_day: int = Field(default=1, ge=1, description="Day on which disruption starts")
    duration_days: int = Field(default=7, ge=1, description="Duration in days of disruption")
    severity_multiplier: float = Field(
        default=1.5,
        gt=0.0,
        description="Demand or delay multiplier applied (e.g., 2.0 = double consumption)",
    )
    affected_routes: Optional[List[str]] = Field(default_factory=list, description="Affected route IDs")
    affected_locations: Optional[List[str]] = Field(default_factory=list, description="Affected FOB node IDs")
    affected_categories: Optional[List[str]] = Field(default_factory=list, description="Affected supply categories")


class InitialStockOverride(BaseModel):
    """Optional override for starting item stock in simulation"""
    item_id: str = Field(..., description="SKU identifier")
    initial_stock: float = Field(..., ge=0, description="Initial stock level")


class SimulationRequest(BaseModel):
    """Input parameters for running a logistics simulation"""
    simulation_name: str = Field(..., min_length=3, max_length=100, description="Simulation run name")
    description: Optional[str] = Field(None, description="Operational objectives or hypothesis tested")
    duration_days: int = Field(default=30, ge=7, le=180, description="Simulation duration in days (7-180)")
    selected_item_ids: List[str] = Field(default_factory=list, description="Specific SKUs to simulate (empty = all)")
    selected_location_ids: List[str] = Field(default_factory=list, description="Specific FOBs to simulate")
    initial_stock_overrides: Optional[List[InitialStockOverride]] = Field(
        default_factory=list,
        description="Optional custom initial inventory levels",
    )
    demand_surge_percentage: float = Field(
        default=0.0,
        ge=-50.0,
        le=500.0,
        description="Global baseline demand increase percentage",
    )
    lead_time_dilation_days: int = Field(
        default=0,
        ge=0,
        le=60,
        description="Additional delay added to rear replenishment supply lines",
    )
    transport_capacity_limit_tonnes: Optional[float] = Field(
        None,
        gt=0,
        description="Constrained fleet convoy capacity in MT",
    )
    disruptions: List[DisruptionScenario] = Field(
        default_factory=list,
        description="List of stress-test disruption scenarios to simulate",
    )
    random_seed: int = Field(default=42, description="Seed for deterministic Monte Carlo reproducibility")


class ProjectedStockPoint(BaseModel):
    """Daily projected stock level trajectory for a SKU at a location"""
    day: int = Field(..., ge=1, description="Simulation day number (1 to N)")
    date_offset: str = Field(..., description="ISO date representation (e.g., 'Day 5 (2026-10-07)')")
    projected_stock: float = Field(..., ge=0, description="Calculated on-hand stock")
    inflow_received: float = Field(default=0.0, ge=0, description="Convoy replenishment delivered")
    demand_consumed: float = Field(..., ge=0, description="Stock consumed by forward units")
    unmet_demand: float = Field(default=0.0, ge=0, description="Stockout deficit (unfilled demand)")
    safety_stock_threshold: float = Field(..., description="Safety buffer benchmark")
    is_stockout: bool = Field(default=False, description="True if stock dropped to 0")


class StockoutEvent(BaseModel):
    """Detail of a projected stockout incident during simulation"""
    event_id: str = Field(..., description="Stockout event ID")
    item_id: str = Field(..., description="SKU identifier")
    item_name: str = Field(..., description="Item nomenclature")
    location_id: str = Field(..., description="FOB / Base location ID")
    location_name: str = Field(..., description="FOB Name")
    start_day: int = Field(..., description="Day stock reached 0")
    duration_days: int = Field(..., description="Number of days location remained in stockout")
    total_unmet_units: float = Field(..., description="Total deficit in base units")
    severity: str = Field(default="Critical", description="Operational severity")


class ReplenishmentRecommendation(BaseModel):
    """Simulated proactive replenishment order recommendation"""
    recommendation_id: str = Field(..., description="Unique recommendation ID")
    item_id: str = Field(..., description="SKU identifier")
    item_name: str = Field(..., description="Item nomenclature")
    source_location_id: str = Field(..., description="Recommended dispatch depot (e.g. Rear Hub)")
    target_location_id: str = Field(..., description="Target Forward Operating Base")
    recommended_order_day: int = Field(..., description="Day order should be dispatched")
    recommended_quantity: float = Field(..., gt=0, description="Calculated optimal transfer quantity")
    unit_of_measurement: str = Field(..., description="Unit (e.g. Liters, Rounds)")
    estimated_arrival_day: int = Field(..., description="Projected delivery day")
    rationale: str = Field(..., description="AI reasoning explaining why this order mitigates risk")


class SimulationSummaryMetrics(BaseModel):
    """Aggregated key metrics summarizing simulation outcome"""
    total_simulated_days: int = Field(..., description="Total duration modeled")
    overall_service_level_percentage: float = Field(
        ...,
        description="Percentage of demand fulfilled without stockouts (e.g. 96.4%)",
    )
    total_stockout_incidents: int = Field(..., description="Total count of stockout events")
    total_unmet_demand_volume: float = Field(..., description="Aggregate unfulfilled quantity")
    total_replenishment_orders_needed: int = Field(..., description="Count of proactive requisitions required")
    average_fleet_capacity_utilization_percentage: float = Field(
        ...,
        description="Mean transport utilization across corridors",
    )
    critical_bottleneck_route: Optional[str] = Field(
        None,
        description="Route corridor with highest congestion/delay",
    )


class SimulationResultResponse(BaseModel):
    """Complete simulation result dataset"""
    simulation_id: str = Field(..., description="Unique simulation execution run ID (e.g. SIM-2026-012)")
    simulation_name: str = Field(..., description="Simulation title")
    status: str = Field(default="completed", description="Execution status: pending, running, completed, failed")
    created_at: datetime = Field(..., description="Execution start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    parameters: SimulationRequest = Field(..., description="Input parameters used for this run")
    summary_metrics: SimulationSummaryMetrics = Field(..., description="High-level performance metrics")
    stockout_events: List[StockoutEvent] = Field(default_factory=list, description="List of stockout occurrences")
    replenishment_recommendations: List[ReplenishmentRecommendation] = Field(
        default_factory=list,
        description="Proactive dispatch recommendations",
    )
    item_trajectories: Dict[str, List[ProjectedStockPoint]] = Field(
        default_factory=dict,
        description="Map of SKU ID to daily projected stock time-series",
    )
    execution_time_seconds: float = Field(..., description="Model computation wall-clock time")

    model_config = ConfigDict(from_attributes=True)
