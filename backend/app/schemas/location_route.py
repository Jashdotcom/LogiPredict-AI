"""
LogiPredict AI - Location & Route Schemas
=========================================
Pydantic schemas for Forward Operating Bases, Base Depots, GIS coordinates,
convoy routes, road constraints, capacity utilization, disruption simulation,
and shortest-path multi-criteria optimization.

Indian Army Forward Supply Chain (SIH 2026)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class LocationType(str, Enum):
    """Military supply node hierarchy"""
    CORPS_HQ = "Corps_HQ"
    BASE_DEPOT = "Base_Depot"
    FORWARD_HUB = "Forward_Logistics_Hub"
    FOB = "Forward_Operating_Base"
    BORDER_OUTPOST = "Border_Outpost"


class RoadCondition(str, Enum):
    """Terrain and route operability state"""
    CLEAR_ALL_WEATHER = "Clear_All_Weather"
    HIGH_ALTITUDE_PASS = "High_Altitude_Pass"
    SNOW_BOUND = "Snow_Bound"
    AVALANCHE_WARNING = "Avalanche_Warning"
    LANDSLIDE_BLOCKED = "Landslide_Blocked"
    MONSOON_VULNERABLE = "Monsoon_Vulnerable"


class RouteStatus(str, Enum):
    """Operational status of transit corridor"""
    OPERATIONAL = "operational"
    DELAYED = "delayed"
    DISRUPTED = "disrupted"
    UNAVAILABLE = "unavailable"


class Waypoint(BaseModel):
    """Geographical waypoint with altitude and transit data"""
    sequence_order: int = Field(..., ge=1, description="Order in the transit sequence")
    waypoint_name: str = Field(..., description="Checkpoint / Pass / Village name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    altitude_meters: float = Field(..., description="Elevation above sea level in meters")
    road_condition: RoadCondition = Field(default=RoadCondition.CLEAR_ALL_WEATHER)


class SupplyLocationBase(BaseModel):
    """Base schema for a military supply location / hub"""
    location_id: str = Field(..., description="Unique node code (e.g., LOC-LEH-01)")
    name: str = Field(..., min_length=2, max_length=120, description="Base or depot name")
    location_type: LocationType = Field(..., description="Echelon node type")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    altitude_meters: float = Field(..., description="Elevation in meters")
    total_capacity_metric_tonnes: float = Field(..., gt=0, description="Maximum storage capacity in MT")
    current_utilization_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    is_active: bool = Field(default=True)
    contact_callsign: Optional[str] = Field(None, description="Military communication callsign")
    svg_x: Optional[float] = Field(None, description="Schematic map X coordinate (0-1000)")
    svg_y: Optional[float] = Field(None, description="Schematic map Y coordinate (0-700)")


class SupplyLocationCreate(SupplyLocationBase):
    pass


class SupplyLocationResponse(SupplyLocationBase):
    id: Optional[int] = Field(None, description="Internal DB identifier")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SupplyRouteBase(BaseModel):
    """Base schema for a supply route segment"""
    route_id: str = Field(..., description="Route code (e.g., RTE-SRI-KRG-01)")
    route_name: str = Field(..., description="Route corridor name (e.g., NH-1D via Zoji La)")
    origin_location_id: str = Field(..., description="Starting depot/hub ID")
    destination_location_id: str = Field(..., description="Target forward base ID")
    origin_name: Optional[str] = Field(None, description="Origin hub name")
    destination_name: Optional[str] = Field(None, description="Destination hub name")
    distance_km: float = Field(..., gt=0, description="Road distance in kilometers")
    standard_transit_hours: float = Field(..., gt=0, description="Clear weather transit duration")
    current_estimated_transit_hours: float = Field(..., gt=0, description="Live weather/risk adjusted ETA")
    max_vehicle_payload_tonnes: float = Field(..., gt=0, description="Axle/bridge load limit")
    road_condition: RoadCondition = Field(default=RoadCondition.CLEAR_ALL_WEATHER)
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0, description="AI terrain/weather risk score (0-1)")
    is_blocked: bool = Field(default=False, description="Whether route is currently impassable")
    status: RouteStatus = Field(default=RouteStatus.OPERATIONAL, description="Operational status tier")

    # Capacity Utilization Metrics
    allocated_capacity_tonnes: float = Field(default=0.0, ge=0.0, description="Currently assigned convoy cargo")
    total_capacity_tonnes: float = Field(default=100.0, gt=0.0, description="Maximum daily convoy throughput")
    capacity_utilization_pct: float = Field(default=0.0, ge=0.0, description="Capacity utilization percentage")

    # Operational & Terrain Telemetry
    estimated_fuel_liters: float = Field(default=0.0, description="Estimated convoy diesel consumption")
    estimated_cost_inr: float = Field(default=0.0, description="Estimated operational transit cost in INR")
    elevation_gain_meters: float = Field(default=0.0, description="Total mountain elevation gain")
    peak_pass_name: Optional[str] = Field(None, description="Highest mountain pass name")
    peak_pass_altitude: Optional[float] = Field(None, description="Highest mountain pass elevation in meters")
    is_primary: bool = Field(default=True, description="Whether route is standard primary corridor or alternative detour")
    active_disruptions: List[str] = Field(default_factory=list, description="Active weather or terrain hazard alerts")
    mitigation_notes: Optional[str] = Field(None, description="Tactical detour and convoy advisory notes")


class SupplyRouteCreate(SupplyRouteBase):
    waypoints: Optional[List[Waypoint]] = Field(default_factory=list)


class SupplyRouteResponse(SupplyRouteBase):
    id: Optional[int] = Field(None, description="Internal database ID")
    waypoints: List[Waypoint] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RouteOptimizationRequest(BaseModel):
    """Payload to request shortest-path and risk-optimized convoy routing"""
    origin_location_id: str = Field(..., description="Depot of departure")
    destination_location_id: str = Field(..., description="Forward base destination")
    total_cargo_weight_tonnes: float = Field(default=20.0, gt=0, description="Total convoy cargo load")
    priority_level: str = Field(default="Standard", description="Standard, Urgent, Emergency")
    avoid_avalanche_zones: bool = Field(default=True)
    allow_unpaved_detours: bool = Field(default=False)
    optimization_objective: str = Field(default="balanced", description="fastest, shortest, safest, balanced")


class RouteOptimizationResponse(BaseModel):
    """Result of GIS optimization algorithm"""
    optimization_id: str = Field(..., description="Unique optimization calculation ID")
    primary_route_id: str = Field(..., description="Selected optimal route ID")
    primary_route_name: str = Field(..., description="Primary route corridor")
    alternative_route_ids: List[str] = Field(default_factory=list)
    total_distance_km: float = Field(..., description="Calculated road distance")
    estimated_transit_hours: float = Field(..., description="Estimated convoy transit time")
    hours_saved_vs_baseline: float = Field(default=0.0, description="Time saved over congested route")
    fuel_estimate_liters: float = Field(..., description="Estimated convoy fuel consumption")
    risk_assessment_summary: str = Field(..., description="Summary of terrain, weather, and bottlenecks")
    waypoints: List[Waypoint] = Field(default_factory=list)
    alternative_routes: List[SupplyRouteBase] = Field(default_factory=list)


class DisruptionSimulationRequest(BaseModel):
    """Payload to simulate real-world logistics disruptions non-destructively"""
    route_id: Optional[str] = Field(None, description="Specific route to disrupt (or None for global scenario)")
    scenario_preset: Optional[str] = Field(None, description="Preset scenario code (e.g. zoji_la_blizzard)")
    delay_hours: Optional[float] = Field(0.0, ge=0.0, description="Additive transit delay in hours")
    delay_multiplier: Optional[float] = Field(1.0, ge=1.0, le=5.0, description="Transit duration multiplier")
    capacity_reduction_pct: Optional[float] = Field(0.0, ge=0.0, le=100.0, description="Percentage capacity reduction")
    is_blocked: Optional[bool] = Field(False, description="Whether route is impassable")
    road_condition: Optional[RoadCondition] = Field(None, description="Override road condition")
    risk_score_override: Optional[float] = Field(None, ge=0.0, le=1.0, description="Override terrain risk score")
    affected_pass: Optional[str] = Field(None, description="Named mountain pass affected")


class DisruptionSimulationResponse(BaseModel):
    """Result of disruption scenario evaluation"""
    simulation_id: str
    scenario_name: str
    applied_at: datetime
    affected_routes_count: int
    affected_routes: List[SupplyRouteBase]
    reroute_recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    system_impact_summary: str


class RouteKPIs(BaseModel):
    """Aggregated route network metrics"""
    total_routes: int
    operational_routes: int
    delayed_routes: int
    disrupted_routes: int
    unavailable_routes: int
    average_transit_hours: float
    average_capacity_utilization_pct: float
    total_network_distance_km: float
    active_disruptions_count: int
