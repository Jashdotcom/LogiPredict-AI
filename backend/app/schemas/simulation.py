"""
LogiPredict AI - Simulation Schemas
===================================
Pydantic schemas for forward logistics discrete-event / Monte Carlo simulations:
scenario parameters, disruption matrices, projected inventory trajectories,
before-versus-after comparison telematic envelopes, and resource recommendations.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DisruptionScenarioType(str, Enum):
    """Pre-configured stress-test scenario modes"""
    BASELINE_PEACETIME = "baseline_peacetime"
    WINTER_PASS_CLOSURE = "winter_pass_closure"  # Snow block cuts main highway for 10-30 days
    HIGH_INTENSITY_SURGE = "high_intensity_surge"  # Daily ammunition/fuel consumption x2-x3.5
    AVALANCHE_LANDSLIDE = "avalanche_landslide"  # Specific route transit time x4.0 / blocked
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
    simulation_name: str = Field(default="Tactical Logistics Simulation", min_length=3, max_length=100, description="Simulation run name")
    description: Optional[str] = Field(None, description="Operational objectives or hypothesis tested")
    duration_days: int = Field(default=30, ge=7, le=180, description="Simulation duration in days (7-180)")
    demand_surge_percentage: float = Field(
        default=0.0,
        ge=-50.0,
        le=500.0,
        description="Global baseline demand increase percentage (-50% to +500%)",
    )
    lead_time_dilation_days: int = Field(
        default=0,
        ge=0,
        le=60,
        description="Additional delay added to rear replenishment supply lines (0 to 60 days)",
    )
    inventory_change_percentage: float = Field(
        default=0.0,
        ge=-80.0,
        le=200.0,
        description="Initial inventory level adjustment percentage (-80% to +200%)",
    )
    selected_item_ids: List[str] = Field(default_factory=list, description="Specific SKUs to simulate (empty = all)")
    selected_location_ids: List[str] = Field(default_factory=list, description="Specific FOBs to simulate (empty = all)")
    selected_category: Optional[str] = Field(None, description="Category filter (e.g. POL, Ammunition)")
    scenario_preset: Optional[str] = Field(None, description="Preset scenario ID if loaded from preset")
    route_disruption_preset: Optional[str] = Field(None, description="Route disruption preset (e.g. zoji_la_blizzard, khardung_la_landslide)")
    transport_capacity_limit_tonnes: Optional[float] = Field(
        None,
        gt=0,
        description="Constrained fleet convoy capacity in MT",
    )
    initial_stock_overrides: Optional[List[InitialStockOverride]] = Field(
        default_factory=list,
        description="Optional custom initial inventory levels",
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
    category: str = Field(default="General", description="Supply category")
    location_id: str = Field(..., description="FOB / Base location ID")
    location_name: str = Field(..., description="FOB Name")
    start_day: int = Field(..., description="Day stock reached 0")
    duration_days: int = Field(..., description="Number of days location remained in stockout")
    total_unmet_units: float = Field(..., description="Total deficit in base units")
    unit: str = Field(default="Units", description="Unit of measurement")
    severity: str = Field(default="Critical", description="Operational severity: Critical, High, Medium")


class ReplenishmentRecommendation(BaseModel):
    """Simulated proactive replenishment order recommendation"""
    recommendation_id: str = Field(..., description="Unique recommendation ID")
    item_id: str = Field(..., description="SKU identifier")
    item_name: str = Field(..., description="Item nomenclature")
    category: str = Field(default="General", description="Supply category")
    source_location_id: str = Field(..., description="Recommended dispatch depot (e.g. Rear Hub)")
    source_location_name: str = Field(default="Base Depot", description="Source depot name")
    target_location_id: str = Field(..., description="Target Forward Operating Base")
    target_location_name: str = Field(default="Forward FOB", description="Target FOB name")
    recommended_order_day: int = Field(..., description="Day order should be dispatched")
    recommended_quantity: float = Field(..., gt=0, description="Calculated optimal transfer quantity")
    unit_of_measurement: str = Field(..., description="Unit (e.g. Liters, Rounds)")
    estimated_arrival_day: int = Field(..., description="Projected delivery day")
    urgency: str = Field(default="High", description="Urgency level: Critical, High, Medium, Routine")
    rationale: str = Field(..., description="AI reasoning explaining why this order mitigates risk")


class MetricComparisonPoint(BaseModel):
    """Single metric before-versus-after comparative point with delta and percentage change"""
    baseline_value: float = Field(..., description="Nominal baseline value")
    simulated_value: float = Field(..., description="Simulated outcome value")
    delta: float = Field(..., description="Absolute difference (Simulated - Baseline)")
    percentage_change: float = Field(..., description="Percentage change ((Simulated - Baseline) / Baseline * 100)")
    unit: str = Field(default="", description="Unit of measurement (e.g. %, Units, Days, Hours)")
    status: str = Field(default="nominal", description="Status assessment: improved, degraded, neutral")


class BeforeVsAfterComparison(BaseModel):
    """Structured 7-dimension before-versus-after comparative metrics"""
    inventory_levels: MetricComparisonPoint = Field(..., description="Ending total on-hand inventory")
    demand_forecasts: MetricComparisonPoint = Field(..., description="Total projected demand consumption")
    stock_coverage_days: MetricComparisonPoint = Field(..., description="Average days of inventory runway remaining")
    predicted_stockouts: MetricComparisonPoint = Field(..., description="Count of stockout events / SKUs exhausted")
    replenishment_requisitions: MetricComparisonPoint = Field(..., description="Count of emergency/proactive orders needed")
    supply_delays: MetricComparisonPoint = Field(..., description="Average lead time delay in days")
    route_travel_times: MetricComparisonPoint = Field(..., description="Average convoy corridor transit hours")


class DailyTrajectoryPoint(BaseModel):
    """Aggregated daily trajectory point for before-versus-after comparative charts"""
    day: int = Field(..., ge=1, description="Simulation day number")
    date: str = Field(..., description="Date label (e.g. Oct 03)")
    baseline_stock: float = Field(..., description="Aggregate baseline stock level")
    simulated_stock: float = Field(..., description="Aggregate simulated stock level")
    baseline_demand: float = Field(..., description="Aggregate daily baseline demand")
    simulated_demand: float = Field(..., description="Aggregate daily simulated demand")
    safety_threshold: float = Field(..., description="Aggregate minimum safety threshold")
    unmet_demand: float = Field(default=0.0, description="Daily stockout deficit")


class SkuSimulationSummary(BaseModel):
    """Per-SKU comparative summary across the simulation horizon"""
    item_id: str = Field(..., description="SKU identifier")
    item_name: str = Field(..., description="Item name")
    category: str = Field(..., description="Supply category")
    unit: str = Field(..., description="Unit of measurement")
    initial_stock: float = Field(..., description="Starting inventory")
    baseline_final_stock: float = Field(..., description="Baseline ending stock")
    simulated_final_stock: float = Field(..., description="Simulated ending stock")
    stock_coverage_days_baseline: float = Field(..., description="Baseline stock coverage runway in days")
    stock_coverage_days_simulated: float = Field(..., description="Simulated stock coverage runway in days")
    stockout_day: Optional[int] = Field(None, description="Day on which stock depleted to 0 (if any)")
    status: str = Field(..., description="Operational status: Nominal, Warning, Critical Stockout")


class RouteImpactSummary(BaseModel):
    """Route corridor before-versus-after operational impact"""
    route_id: str = Field(..., description="Route ID")
    route_name: str = Field(..., description="Corridor Name")
    origin_name: str = Field(..., description="Origin Hub")
    destination_name: str = Field(..., description="Destination FOB")
    baseline_transit_hours: float = Field(..., description="Standard transit hours")
    simulated_transit_hours: float = Field(..., description="Simulated transit hours under disruption")
    delta_hours: float = Field(..., description="Delay in hours")
    percentage_change: float = Field(..., description="Percentage increase in transit time")
    status: str = Field(..., description="Operational, Delayed, Disrupted, Unavailable")
    is_blocked: bool = Field(default=False, description="True if route is completely severed")
    recommended_detour_id: Optional[str] = Field(None, description="Alternative route ID")
    recommended_detour_name: Optional[str] = Field(None, description="Alternative corridor name")


class SimulationSummaryMetrics(BaseModel):
    """Aggregated key metrics summarizing simulation outcome"""
    total_simulated_days: int = Field(..., description="Total duration modeled")
    overall_service_level_percentage: float = Field(
        ...,
        description="Percentage of demand fulfilled without stockouts (e.g. 96.4%)",
    )
    resilience_score: float = Field(..., description="Composite logistics resilience score (0-100%)")
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


class PresetScenarioInfo(BaseModel):
    """Metadata for pre-configured military disruption scenario presets"""
    id: str = Field(..., description="Preset ID (e.g. SCN-WINTER-01)")
    name: str = Field(..., description="Scenario Title")
    category: str = Field(..., description="Disruption Category")
    description: str = Field(..., description="Scenario narrative description")
    demand_surge_percentage: float = Field(default=0.0, description="Preset demand surge %")
    lead_time_dilation_days: int = Field(default=0, description="Preset lead time dilation in days")
    inventory_change_percentage: float = Field(default=0.0, description="Preset initial inventory delta %")
    route_disruption_preset: Optional[str] = Field(None, description="Associated route disruption preset")
    severity: str = Field(default="warning", description="Severity level: info, warning, critical")
    lead_time_label: str = Field(default="Standard", description="Human-readable lead time delta label")
    demand_surge_label: str = Field(default="0%", description="Human-readable demand surge label")
    stockout_risk_label: str = Field(default="Low", description="Stockout risk summary label")


class SimulationBaselineResponse(BaseModel):
    """Baseline state and default parameters for simulation workspace initialization"""
    baseline_metrics: Dict[str, Any] = Field(..., description="Key baseline inventory and transport metrics")
    sku_catalog_summary: List[Dict[str, Any]] = Field(default_factory=list, description="Catalog of available SKUs")
    locations_summary: List[Dict[str, Any]] = Field(default_factory=list, description="Military hubs and FOBs")
    routes_summary: List[Dict[str, Any]] = Field(default_factory=list, description="Strategic route corridors")
    preset_scenarios: List[PresetScenarioInfo] = Field(default_factory=list, description="Available disruption presets")
    default_parameters: Dict[str, Any] = Field(..., description="Default simulation parameters")


class SimulationResultResponse(BaseModel):
    """Complete simulation result dataset with before-versus-after comparison, trajectories, and recommendations"""
    simulation_id: str = Field(..., description="Unique simulation execution run ID (e.g. SIM-2026-012)")
    simulation_name: str = Field(..., description="Simulation title")
    status: str = Field(default="completed", description="Execution status: pending, running, completed, failed")
    created_at: datetime = Field(..., description="Execution start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    parameters: SimulationRequest = Field(..., description="Input parameters used for this run")
    summary_metrics: SimulationSummaryMetrics = Field(..., description="High-level performance metrics")
    comparison: BeforeVsAfterComparison = Field(..., description="7-Dimension before-versus-after comparative metrics")
    impact_summary: List[str] = Field(default_factory=list, description="Dynamic rule-based impact findings")
    recommendations: List[ReplenishmentRecommendation] = Field(
        default_factory=list,
        description="Proactive dispatch and reroute recommendations",
    )
    route_impacts: List[RouteImpactSummary] = Field(
        default_factory=list,
        description="Corridor impact and detour evaluations",
    )
    sku_summaries: List[SkuSimulationSummary] = Field(
        default_factory=list,
        description="Per-item before/after stock summaries",
    )
    daily_trajectories: List[DailyTrajectoryPoint] = Field(
        default_factory=list,
        description="Aggregated daily time series for comparative chart rendering",
    )
    stockout_events: List[StockoutEvent] = Field(default_factory=list, description="List of stockout occurrences")
    item_trajectories: Dict[str, List[ProjectedStockPoint]] = Field(
        default_factory=dict,
        description="Map of SKU ID to daily projected stock time-series",
    )
    resilience_score: float = Field(default=100.0, description="Resilience score percentage (0-100%)")
    execution_time_seconds: float = Field(..., description="Model computation wall-clock time")

    model_config = ConfigDict(from_attributes=True)
