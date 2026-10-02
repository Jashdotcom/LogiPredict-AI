"""
LogiPredict AI - Location & Route Schemas
=========================================
Pydantic schemas for Forward Operating Bases, Base Depots, GIS coordinates,
convoy routes, road constraints, and shortest-path optimization.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
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


class Waypoint(BaseModel):
    """Geographical waypoint with altitude and transit data"""
    sequence_order: int = Field(..., ge=1, description="Order in the transit sequence")
    waypoint_name: str = Field(..., description="Checkpoint / Pass / Village name")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    altitude_meters: float = Field(..., description="Elevation above sea level in meters")
    road_condition: RoadCondition = Field(default=RoadCondition.CLEAR_ALL_WEATHER)


class SupplyLocationBase(BaseModel):
    """Base schema for a military supply location"""
    location_id: str = Field(..., description="Unique node code (e.g., LOC-FOB-LEH-01)")
    name: str = Field(..., min_length=2, max_length=120, description="Base or depot name")
    location_type: LocationType = Field(..., description="Echelon node type")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    altitude_meters: float = Field(..., description="Elevation in meters")
    total_capacity_metric_tonnes: float = Field(..., gt=0, description="Maximum storage capacity in MT")
    current_utilization_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    is_active: bool = Field(default=True)
    contact_callsign: Optional[str] = Field(None, description="Military communication callsign")


class SupplyLocationCreate(SupplyLocationBase):
    pass


class SupplyLocationResponse(SupplyLocationBase):
    id: int = Field(..., description="Internal DB identifier")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupplyRouteBase(BaseModel):
    """Base schema for a supply route segment"""
    route_id: str = Field(..., description="Route code (e.g., RTE-SRI-KRG-01)")
    route_name: str = Field(..., description="Route corridor name (e.g., NH-1D via Zoji La)")
    origin_location_id: str = Field(..., description="Starting depot/hub ID")
    destination_location_id: str = Field(..., description="Target forward base ID")
    distance_km: float = Field(..., gt=0, description="Road distance in kilometers")
    standard_transit_hours: float = Field(..., gt=0, description="Clear weather transit duration")
    current_estimated_transit_hours: float = Field(..., gt=0, description="Live weather/risk adjusted ETA")
    max_vehicle_payload_tonnes: float = Field(..., gt=0, description="Axle/bridge load limit")
    road_condition: RoadCondition = Field(default=RoadCondition.CLEAR_ALL_WEATHER)
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0, description="AI terrain/weather risk score (0-1)")
    is_blocked: bool = Field(default=False, description="Whether route is currently impassable")


class SupplyRouteCreate(SupplyRouteBase):
    waypoints: Optional[List[Waypoint]] = Field(default_factory=list)


class SupplyRouteResponse(SupplyRouteBase):
    id: int = Field(..., description="Internal database ID")
    waypoints: List[Waypoint] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RouteOptimizationRequest(BaseModel):
    """Payload to request shortest-path and risk-optimized convoy routing"""
    origin_location_id: str = Field(..., description="Depot of departure")
    destination_location_id: str = Field(..., description="Forward base destination")
    total_cargo_weight_tonnes: float = Field(..., gt=0, description="Total convoy cargo load")
    priority_level: str = Field(default="Standard", description="Standard, Urgent, Emergency")
    avoid_avalanche_zones: bool = Field(default=True)
    allow_unpaved_detours: bool = Field(default=False)


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
