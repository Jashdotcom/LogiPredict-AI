"""
LogiPredict AI - Route Planning & Logistics GIS Service
======================================================
Manages synthetic military supply depots, strategic route corridors,
multi-criteria convoy path optimization, capacity utilization tracking,
and non-destructive disruption scenario simulation.

Indian Army Forward Supply Chain (SIH 2026)
"""

import copy
import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.location_route import (
    LocationType,
    RoadCondition,
    RouteStatus,
    Waypoint,
    SupplyLocationBase,
    SupplyRouteBase,
    RouteOptimizationRequest,
    RouteOptimizationResponse,
    DisruptionSimulationRequest,
    DisruptionSimulationResponse,
    RouteKPIs,
)
from app.utils.exceptions import NotFoundError, ValidationError


# ==============================================================================
# Master Synthetic Military Supply Depots (Forward Logistics Nodes)
# ==============================================================================

DEFAULT_LOCATIONS: List[Dict[str, Any]] = [
    {
        "location_id": "LOC-LEH-01",
        "name": "Leh Base Logistics Hub",
        "location_type": LocationType.CORPS_HQ,
        "latitude": 34.1526,
        "longitude": 77.5771,
        "altitude_meters": 3500.0,
        "total_capacity_metric_tonnes": 14000.0,
        "current_utilization_percentage": 68.5,
        "is_active": True,
        "contact_callsign": "FIRE-FURY-LEH-HQ",
        "svg_x": 580.0,
        "svg_y": 340.0,
    },
    {
        "location_id": "LOC-UDH-02",
        "name": "Udhampur Northern Depot",
        "location_type": LocationType.BASE_DEPOT,
        "latitude": 32.9255,
        "longitude": 75.1416,
        "altitude_meters": 750.0,
        "total_capacity_metric_tonnes": 28000.0,
        "current_utilization_percentage": 45.2,
        "is_active": True,
        "contact_callsign": "NORTH-COMMAND-UDH-01",
        "svg_x": 160.0,
        "svg_y": 590.0,
    },
    {
        "location_id": "LOC-SRI-03",
        "name": "Srinagar Staging Depot",
        "location_type": LocationType.FORWARD_HUB,
        "latitude": 34.0837,
        "longitude": 74.7973,
        "altitude_meters": 1585.0,
        "total_capacity_metric_tonnes": 18500.0,
        "current_utilization_percentage": 72.4,
        "is_active": True,
        "contact_callsign": "CHINAR-LOG-SRI-02",
        "svg_x": 220.0,
        "svg_y": 380.0,
    },
    {
        "location_id": "LOC-KRG-04",
        "name": "Kargil Sector Transit Depot",
        "location_type": LocationType.FORWARD_HUB,
        "latitude": 34.5539,
        "longitude": 76.1310,
        "altitude_meters": 2676.0,
        "total_capacity_metric_tonnes": 8200.0,
        "current_utilization_percentage": 81.0,
        "is_active": True,
        "contact_callsign": "DRAS-KARGIL-CONVOY-04",
        "svg_x": 390.0,
        "svg_y": 320.0,
    },
    {
        "location_id": "LOC-DRS-05",
        "name": "Drass Forward Support Post",
        "location_type": LocationType.FOB,
        "latitude": 34.4290,
        "longitude": 75.7533,
        "altitude_meters": 3280.0,
        "total_capacity_metric_tonnes": 4500.0,
        "current_utilization_percentage": 88.5,
        "is_active": True,
        "contact_callsign": "TIGER-HILL-LOG-05",
        "svg_x": 310.0,
        "svg_y": 350.0,
    },
    {
        "location_id": "LOC-SIA-06",
        "name": "Siachen Base Supply Camp",
        "location_type": LocationType.BORDER_OUTPOST,
        "latitude": 35.2000,
        "longitude": 77.1000,
        "altitude_meters": 3600.0,
        "total_capacity_metric_tonnes": 3200.0,
        "current_utilization_percentage": 92.0,
        "is_active": True,
        "contact_callsign": "SIACHEN-COLD-CHAIN-06",
        "svg_x": 560.0,
        "svg_y": 120.0,
    },
    {
        "location_id": "LOC-NBR-07",
        "name": "Nubra Valley Forward Post",
        "location_type": LocationType.FOB,
        "latitude": 34.6863,
        "longitude": 77.5673,
        "altitude_meters": 3048.0,
        "total_capacity_metric_tonnes": 3800.0,
        "current_utilization_percentage": 64.0,
        "is_active": True,
        "contact_callsign": "SHYOK-VALLEY-POST-07",
        "svg_x": 640.0,
        "svg_y": 210.0,
    },
    {
        "location_id": "LOC-PNG-08",
        "name": "Pangong Sector Outpost",
        "location_type": LocationType.BORDER_OUTPOST,
        "latitude": 33.7595,
        "longitude": 78.6674,
        "altitude_meters": 4350.0,
        "total_capacity_metric_tonnes": 2400.0,
        "current_utilization_percentage": 76.5,
        "is_active": True,
        "contact_callsign": "PANGONG-TRISHUL-08",
        "svg_x": 820.0,
        "svg_y": 420.0,
    },
]


# ==============================================================================
# Master Synthetic Route Corridors & Waypoints
# ==============================================================================

DEFAULT_ROUTES: List[Dict[str, Any]] = [
    # --------------------------------------------------------------------------
    # 1. Srinagar <-> Kargil Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-SRI-KRG-01",
        "route_name": "NH-1D via Zoji La Axis (Primary)",
        "origin_location_id": "LOC-SRI-03",
        "destination_location_id": "LOC-KRG-04",
        "origin_name": "Srinagar Staging Depot",
        "destination_name": "Kargil Sector Transit Depot",
        "distance_km": 204.0,
        "standard_transit_hours": 6.5,
        "current_estimated_transit_hours": 6.8,
        "max_vehicle_payload_tonnes": 35.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.32,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 45.0,
        "total_capacity_tonnes": 60.0,
        "capacity_utilization_pct": 75.0,
        "estimated_fuel_liters": 185.0,
        "estimated_cost_inr": 24500.0,
        "elevation_gain_meters": 2200.0,
        "peak_pass_name": "Zoji La Pass",
        "peak_pass_altitude": 3528.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Standard high-altitude convoy protocol. Mandatory snow chains between Baltal and Gumri.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Srinagar Depot Checkpoint", "latitude": 34.0837, "longitude": 74.7973, "altitude_meters": 1585.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Ganderbal Staging Point", "latitude": 34.2164, "longitude": 74.7813, "altitude_meters": 1619.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Sonamarg Valley Base", "latitude": 34.3075, "longitude": 75.2954, "altitude_meters": 2740.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Baltal Convoy Gate", "latitude": 34.2600, "longitude": 75.4100, "altitude_meters": 2900.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 5, "waypoint_name": "Zoji La Pass Summit", "latitude": 34.2800, "longitude": 75.4900, "altitude_meters": 3528.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 6, "waypoint_name": "Gumri Transit Shelter", "latitude": 34.3300, "longitude": 75.5600, "altitude_meters": 3310.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 7, "waypoint_name": "Drass Forward Hub", "latitude": 34.4290, "longitude": 75.7533, "altitude_meters": 3280.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 8, "waypoint_name": "Kargil Sector Post", "latitude": 34.5539, "longitude": 76.1310, "altitude_meters": 2676.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-SRI-KRG-02",
        "route_name": "Sinthan Pass - Suru Valley Corridor (Alternative)",
        "origin_location_id": "LOC-SRI-03",
        "destination_location_id": "LOC-KRG-04",
        "origin_name": "Srinagar Staging Depot",
        "destination_name": "Kargil Sector Transit Depot",
        "distance_km": 278.0,
        "standard_transit_hours": 9.5,
        "current_estimated_transit_hours": 9.8,
        "max_vehicle_payload_tonnes": 25.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.44,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 18.0,
        "total_capacity_tonnes": 40.0,
        "capacity_utilization_pct": 45.0,
        "estimated_fuel_liters": 260.0,
        "estimated_cost_inr": 34200.0,
        "elevation_gain_meters": 2850.0,
        "peak_pass_name": "Sinthan Top Pass",
        "peak_pass_altitude": 3748.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "Tactical bypass when Zoji La is congested or snow-bound. Single-lane movement at Suru Gorge.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Srinagar Staging Hub", "latitude": 34.0837, "longitude": 74.7973, "altitude_meters": 1585.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Anantnag Logistic Node", "latitude": 33.7311, "longitude": 75.1522, "altitude_meters": 1600.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Sinthan Top Pass", "latitude": 33.5600, "longitude": 75.5000, "altitude_meters": 3748.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Kishtwar Transit Post", "latitude": 33.3100, "longitude": 75.7600, "altitude_meters": 1638.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Suru Valley Junction", "latitude": 34.1200, "longitude": 76.0100, "altitude_meters": 2980.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 6, "waypoint_name": "Sankoo Checkpoint", "latitude": 34.3800, "longitude": 75.9600, "altitude_meters": 2850.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Kargil Transit Depot", "latitude": 34.5539, "longitude": 76.1310, "altitude_meters": 2676.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 2. Kargil <-> Leh Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-KRG-LEH-01",
        "route_name": "NH-1 Indus Axis via Fotu La (Primary)",
        "origin_location_id": "LOC-KRG-04",
        "destination_location_id": "LOC-LEH-01",
        "origin_name": "Kargil Sector Transit Depot",
        "destination_name": "Leh Base Logistics Hub",
        "distance_km": 216.0,
        "standard_transit_hours": 5.0,
        "current_estimated_transit_hours": 5.2,
        "max_vehicle_payload_tonnes": 40.0,
        "road_condition": RoadCondition.CLEAR_ALL_WEATHER,
        "risk_score": 0.22,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 52.0,
        "total_capacity_tonnes": 70.0,
        "capacity_utilization_pct": 74.3,
        "estimated_fuel_liters": 195.0,
        "estimated_cost_inr": 25800.0,
        "elevation_gain_meters": 1950.0,
        "peak_pass_name": "Fotu La Pass",
        "peak_pass_altitude": 4108.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Double-lane paved highway. Dual high-altitude pass crossings: Namika La and Fotu La.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Kargil Transit Depot", "latitude": 34.5539, "longitude": 76.1310, "altitude_meters": 2676.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Mulbekh Gompa Checkpoint", "latitude": 34.3800, "longitude": 76.3500, "altitude_meters": 3230.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Namika La Pass", "latitude": 34.3600, "longitude": 76.4500, "altitude_meters": 3700.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Bodhkharbu Staging Post", "latitude": 34.3500, "longitude": 76.6000, "altitude_meters": 3360.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Fotu La Pass Summit", "latitude": 34.2800, "longitude": 76.7300, "altitude_meters": 4108.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 6, "waypoint_name": "Lamayuru Moonland Post", "latitude": 34.2800, "longitude": 76.7700, "altitude_meters": 3510.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Khaltsi Indus Bridge", "latitude": 34.3200, "longitude": 76.8800, "altitude_meters": 2990.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 8, "waypoint_name": "Nimmu Confluence Hub", "latitude": 34.1800, "longitude": 77.3400, "altitude_meters": 3150.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 9, "waypoint_name": "Leh Base Logistics Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-KRG-LEH-02",
        "route_name": "Batalik - Dha Hanu Indus Gorge Corridor (Alternative)",
        "origin_location_id": "LOC-KRG-04",
        "destination_location_id": "LOC-LEH-01",
        "origin_name": "Kargil Sector Transit Depot",
        "destination_name": "Leh Base Logistics Hub",
        "distance_km": 248.0,
        "standard_transit_hours": 7.2,
        "current_estimated_transit_hours": 7.5,
        "max_vehicle_payload_tonnes": 20.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.48,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 15.0,
        "total_capacity_tonnes": 35.0,
        "capacity_utilization_pct": 42.9,
        "estimated_fuel_liters": 240.0,
        "estimated_cost_inr": 31500.0,
        "elevation_gain_meters": 2300.0,
        "peak_pass_name": "Hamboting La Pass",
        "peak_pass_altitude": 4056.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "Forward tactical corridor along the Indus river. Strict speed limits on Hamboting La hairpins.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Kargil Transit Depot", "latitude": 34.5539, "longitude": 76.1310, "altitude_meters": 2676.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Hamboting La Summit", "latitude": 34.5600, "longitude": 76.2800, "altitude_meters": 4056.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 3, "waypoint_name": "Batalik Sector Post", "latitude": 34.6500, "longitude": 76.5400, "altitude_meters": 2740.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Dha Hanu Valley Post", "latitude": 34.5700, "longitude": 76.7000, "altitude_meters": 2800.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Khaltsi Junction", "latitude": 34.3200, "longitude": 76.8800, "altitude_meters": 2990.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 6, "waypoint_name": "Leh Base Logistics Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 3. Leh <-> Siachen Base Camp Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-LEH-SIA-01",
        "route_name": "Khardung La - Shyok Strategic Axis (Primary)",
        "origin_location_id": "LOC-LEH-01",
        "destination_location_id": "LOC-SIA-06",
        "origin_name": "Leh Base Logistics Hub",
        "destination_name": "Siachen Base Supply Camp",
        "distance_km": 215.0,
        "standard_transit_hours": 7.5,
        "current_estimated_transit_hours": 8.0,
        "max_vehicle_payload_tonnes": 25.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.42,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 28.0,
        "total_capacity_tonnes": 35.0,
        "capacity_utilization_pct": 80.0,
        "estimated_fuel_liters": 265.0,
        "estimated_cost_inr": 36000.0,
        "elevation_gain_meters": 3400.0,
        "peak_pass_name": "Khardung La Pass",
        "peak_pass_altitude": 5359.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Traverses Khardung La (5,359m). Mandatory oxygen kits for vehicle operators and winter diesel additive.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Base Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "South Pullu Checkpoint", "latitude": 34.2300, "longitude": 77.6000, "altitude_meters": 4600.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 3, "waypoint_name": "Khardung La Pass Summit", "latitude": 34.2800, "longitude": 77.6050, "altitude_meters": 5359.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "North Pullu Post", "latitude": 34.3300, "longitude": 77.6100, "altitude_meters": 4690.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 5, "waypoint_name": "Khalsar Junction", "latitude": 34.4900, "longitude": 77.5900, "altitude_meters": 3100.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 6, "waypoint_name": "Panamik Hot Springs Post", "latitude": 34.7800, "longitude": 77.5300, "altitude_meters": 3183.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Sasoma Bridge Depot", "latitude": 34.9800, "longitude": 77.4100, "altitude_meters": 3350.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 8, "waypoint_name": "Siachen Base Supply Camp", "latitude": 35.2000, "longitude": 77.1000, "altitude_meters": 3600.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-LEH-SIA-02",
        "route_name": "Wari La - Nubra River Bypass (Winter Alternative)",
        "origin_location_id": "LOC-LEH-01",
        "destination_location_id": "LOC-SIA-06",
        "origin_name": "Leh Base Logistics Hub",
        "destination_name": "Siachen Base Supply Camp",
        "distance_km": 260.0,
        "standard_transit_hours": 9.8,
        "current_estimated_transit_hours": 10.2,
        "max_vehicle_payload_tonnes": 18.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.55,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 12.0,
        "total_capacity_tonnes": 30.0,
        "capacity_utilization_pct": 40.0,
        "estimated_fuel_liters": 310.0,
        "estimated_cost_inr": 42000.0,
        "elevation_gain_meters": 3600.0,
        "peak_pass_name": "Wari La Pass",
        "peak_pass_altitude": 5312.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "Bypasses Khardung La when snow clearance is in progress. Requires 4x4 heavy all-wheel drive vehicles.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Base Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Karu Logistics Base", "latitude": 33.9100, "longitude": 77.7400, "altitude_meters": 3450.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Sakti Village Staging", "latitude": 34.0200, "longitude": 77.7800, "altitude_meters": 3800.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Wari La Pass Summit", "latitude": 34.1200, "longitude": 77.7500, "altitude_meters": 5312.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 5, "waypoint_name": "Tangyar Post", "latitude": 34.2500, "longitude": 77.7000, "altitude_meters": 4100.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 6, "waypoint_name": "Agham Shyok Confluence", "latitude": 34.4100, "longitude": 77.6200, "altitude_meters": 3200.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Siachen Base Supply Camp", "latitude": 35.2000, "longitude": 77.1000, "altitude_meters": 3600.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 4. Leh <-> Nubra Valley Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-LEH-NBR-01",
        "route_name": "Khardung La Express Corridor (Primary)",
        "origin_location_id": "LOC-LEH-01",
        "destination_location_id": "LOC-NBR-07",
        "origin_name": "Leh Base Logistics Hub",
        "destination_name": "Nubra Valley Forward Post",
        "distance_km": 125.0,
        "standard_transit_hours": 4.0,
        "current_estimated_transit_hours": 4.2,
        "max_vehicle_payload_tonnes": 30.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.35,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 32.0,
        "total_capacity_tonnes": 45.0,
        "capacity_utilization_pct": 71.1,
        "estimated_fuel_liters": 140.0,
        "estimated_cost_inr": 18200.0,
        "elevation_gain_meters": 2800.0,
        "peak_pass_name": "Khardung La Pass",
        "peak_pass_altitude": 5359.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Direct conduit connecting Leh to Diskit and Hunder forward garrisons.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Base Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Khardung La Pass", "latitude": 34.2800, "longitude": 77.6050, "altitude_meters": 5359.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 3, "waypoint_name": "Khalsar Post", "latitude": 34.4900, "longitude": 77.5900, "altitude_meters": 3100.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Diskit Garrison", "latitude": 34.5422, "longitude": 77.5583, "altitude_meters": 3144.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Nubra Valley Forward Post", "latitude": 34.6863, "longitude": 77.5673, "altitude_meters": 3048.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-LEH-NBR-02",
        "route_name": "Shyok River Low-Altitude Track (Alternative)",
        "origin_location_id": "LOC-LEH-01",
        "destination_location_id": "LOC-NBR-07",
        "origin_name": "Leh Base Logistics Hub",
        "destination_name": "Nubra Valley Forward Post",
        "distance_km": 168.0,
        "standard_transit_hours": 5.5,
        "current_estimated_transit_hours": 5.8,
        "max_vehicle_payload_tonnes": 20.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.45,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 14.0,
        "total_capacity_tonnes": 30.0,
        "capacity_utilization_pct": 46.7,
        "estimated_fuel_liters": 185.0,
        "estimated_cost_inr": 23500.0,
        "elevation_gain_meters": 2950.0,
        "peak_pass_name": "Digar La Pass",
        "peak_pass_altitude": 5400.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "Unpaved military patrol track along the Shyok canyon. Suitable for light troop carriers.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Base Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Saboo Valley Post", "latitude": 34.1700, "longitude": 77.6200, "altitude_meters": 3600.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Digar La Pass", "latitude": 34.2500, "longitude": 77.7200, "altitude_meters": 5400.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Shyok Village Gate", "latitude": 34.4500, "longitude": 77.8000, "altitude_meters": 3300.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Nubra Valley Forward Post", "latitude": 34.6863, "longitude": 77.5673, "altitude_meters": 3048.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 5. Leh <-> Pangong Sector Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-LEH-PNG-01",
        "route_name": "Chang La - Tangtse Strategic Highway (Primary)",
        "origin_location_id": "LOC-LEH-01",
        "destination_location_id": "LOC-PNG-08",
        "origin_name": "Leh Base Logistics Hub",
        "destination_name": "Pangong Sector Outpost",
        "distance_km": 160.0,
        "standard_transit_hours": 5.2,
        "current_estimated_transit_hours": 5.4,
        "max_vehicle_payload_tonnes": 30.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.38,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 22.0,
        "total_capacity_tonnes": 30.0,
        "capacity_utilization_pct": 73.3,
        "estimated_fuel_liters": 180.0,
        "estimated_cost_inr": 23400.0,
        "elevation_gain_meters": 3100.0,
        "peak_pass_name": "Chang La Pass",
        "peak_pass_altitude": 5360.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Main resupply route to Pangong Tso defense perimeter via Chang La Pass (5,360m).",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Base Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Karu Logistics Base", "latitude": 33.9100, "longitude": 77.7400, "altitude_meters": 3450.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Sakti Base Post", "latitude": 34.0200, "longitude": 77.7800, "altitude_meters": 3800.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Chang La Pass Summit", "latitude": 34.0500, "longitude": 77.9300, "altitude_meters": 5360.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 5, "waypoint_name": "Durbuk Transit Post", "latitude": 34.1200, "longitude": 78.1200, "altitude_meters": 3850.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 6, "waypoint_name": "Tangtse Supply Depot", "latitude": 34.0300, "longitude": 78.1800, "altitude_meters": 3950.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Lukung Lake Front", "latitude": 33.9000, "longitude": 78.4300, "altitude_meters": 4250.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 8, "waypoint_name": "Pangong Sector Outpost", "latitude": 33.7595, "longitude": 78.6674, "altitude_meters": 4350.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-LEH-PNG-02",
        "route_name": "Chushul - Tsaka La Border Track (Tactical Alternative)",
        "origin_location_id": "LOC-LEH-01",
        "destination_location_id": "LOC-PNG-08",
        "origin_name": "Leh Base Logistics Hub",
        "destination_name": "Pangong Sector Outpost",
        "distance_km": 210.0,
        "standard_transit_hours": 7.0,
        "current_estimated_transit_hours": 7.3,
        "max_vehicle_payload_tonnes": 20.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.50,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 8.0,
        "total_capacity_tonnes": 25.0,
        "capacity_utilization_pct": 32.0,
        "estimated_fuel_liters": 235.0,
        "estimated_cost_inr": 30500.0,
        "elevation_gain_meters": 2700.0,
        "peak_pass_name": "Tsaka La Pass",
        "peak_pass_altitude": 4660.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "Southern flank tactical axis connecting Upshi through Chumathang and Chushul valley.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Base Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Upshi Logistics Junction", "latitude": 33.8200, "longitude": 77.8100, "altitude_meters": 3380.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Chumathang Post", "latitude": 33.3500, "longitude": 78.3300, "altitude_meters": 3950.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Mahe Bridge Depot", "latitude": 33.2700, "longitude": 78.5000, "altitude_meters": 4180.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Tsaka La Pass", "latitude": 33.4700, "longitude": 78.8500, "altitude_meters": 4660.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 6, "waypoint_name": "Chushul Airstrip Garrison", "latitude": 33.6000, "longitude": 78.6500, "altitude_meters": 4350.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Pangong Sector Outpost", "latitude": 33.7595, "longitude": 78.6674, "altitude_meters": 4350.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 6. Udhampur <-> Srinagar Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-UDH-SRI-01",
        "route_name": "NH-44 Nav-Yug Tunnel Corridor (Primary)",
        "origin_location_id": "LOC-UDH-02",
        "destination_location_id": "LOC-SRI-03",
        "origin_name": "Udhampur Northern Depot",
        "destination_name": "Srinagar Staging Depot",
        "distance_km": 215.0,
        "standard_transit_hours": 5.5,
        "current_estimated_transit_hours": 5.8,
        "max_vehicle_payload_tonnes": 50.0,
        "road_condition": RoadCondition.CLEAR_ALL_WEATHER,
        "risk_score": 0.18,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 140.0,
        "total_capacity_tonnes": 180.0,
        "capacity_utilization_pct": 77.8,
        "estimated_fuel_liters": 210.0,
        "estimated_cost_inr": 27500.0,
        "elevation_gain_meters": 1600.0,
        "peak_pass_name": "Nav-Yug Qazigund Tunnel",
        "peak_pass_altitude": 1800.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Four-lane all-weather artery connecting Northern Command HQ to Kashmir Valley.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Udhampur Northern Depot", "latitude": 32.9255, "longitude": 75.1416, "altitude_meters": 750.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Chenani-Nashri Tunnel", "latitude": 33.0400, "longitude": 75.2800, "altitude_meters": 1200.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Ramban Transit Base", "latitude": 33.2400, "longitude": 75.2400, "altitude_meters": 1156.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Banihal South Portal", "latitude": 33.4900, "longitude": 75.2000, "altitude_meters": 1730.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Nav-Yug Tunnel North", "latitude": 33.5600, "longitude": 75.1800, "altitude_meters": 1800.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 6, "waypoint_name": "Qazigund Gate", "latitude": 33.5900, "longitude": 75.1600, "altitude_meters": 1670.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Srinagar Staging Depot", "latitude": 34.0837, "longitude": 74.7973, "altitude_meters": 1585.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-UDH-SRI-02",
        "route_name": "Mughal Road via Peer Ki Gali (Seasonal Alternative)",
        "origin_location_id": "LOC-UDH-02",
        "destination_location_id": "LOC-SRI-03",
        "origin_name": "Udhampur Northern Depot",
        "destination_name": "Srinagar Staging Depot",
        "distance_km": 265.0,
        "standard_transit_hours": 8.0,
        "current_estimated_transit_hours": 8.4,
        "max_vehicle_payload_tonnes": 25.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.40,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 35.0,
        "total_capacity_tonnes": 75.0,
        "capacity_utilization_pct": 46.7,
        "estimated_fuel_liters": 270.0,
        "estimated_cost_inr": 35000.0,
        "elevation_gain_meters": 2900.0,
        "peak_pass_name": "Peer Ki Gali Pass",
        "peak_pass_altitude": 3485.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "Historic trans-Pir Panjal route through Poonch and Shopian. Active during clear summer/autumn window.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Udhampur Northern Depot", "latitude": 32.9255, "longitude": 75.1416, "altitude_meters": 750.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Reasi Logistics Post", "latitude": 33.0800, "longitude": 74.8300, "altitude_meters": 466.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Rajouri Base Depot", "latitude": 33.3700, "longitude": 74.3100, "altitude_meters": 915.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Bafliaz Staging Gate", "latitude": 33.6000, "longitude": 74.4500, "altitude_meters": 1500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 5, "waypoint_name": "Peer Ki Gali Summit", "latitude": 33.6300, "longitude": 74.5200, "altitude_meters": 3485.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 6, "waypoint_name": "Shopian Apple Orchard Gate", "latitude": 33.7200, "longitude": 74.8300, "altitude_meters": 2057.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 7, "waypoint_name": "Srinagar Staging Depot", "latitude": 34.0837, "longitude": 74.7973, "altitude_meters": 1585.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 7. Kargil <-> Drass Corridors
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-KRG-DRS-01",
        "route_name": "NH-1 Drass Valley Highway (Primary)",
        "origin_location_id": "LOC-KRG-04",
        "destination_location_id": "LOC-DRS-05",
        "origin_name": "Kargil Sector Transit Depot",
        "destination_name": "Drass Forward Support Post",
        "distance_km": 58.0,
        "standard_transit_hours": 1.5,
        "current_estimated_transit_hours": 1.6,
        "max_vehicle_payload_tonnes": 40.0,
        "road_condition": RoadCondition.CLEAR_ALL_WEATHER,
        "risk_score": 0.15,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 38.0,
        "total_capacity_tonnes": 50.0,
        "capacity_utilization_pct": 76.0,
        "estimated_fuel_liters": 55.0,
        "estimated_cost_inr": 7200.0,
        "elevation_gain_meters": 750.0,
        "peak_pass_name": "Fotuksla Approach",
        "peak_pass_altitude": 3280.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Direct paved all-weather connection along Drass River.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Kargil Transit Depot", "latitude": 34.5539, "longitude": 76.1310, "altitude_meters": 2676.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Kharbu Convoy Shelter", "latitude": 34.5100, "longitude": 75.9800, "altitude_meters": 2850.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Kakshar Bridge Node", "latitude": 34.4700, "longitude": 75.8400, "altitude_meters": 3050.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Drass Forward Post", "latitude": 34.4290, "longitude": 75.7533, "altitude_meters": 3280.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
    {
        "route_id": "RTE-KRG-DRS-02",
        "route_name": "Mushkoh Valley Patrol Track (Tactical Alternative)",
        "origin_location_id": "LOC-KRG-04",
        "destination_location_id": "LOC-DRS-05",
        "origin_name": "Kargil Sector Transit Depot",
        "destination_name": "Drass Forward Support Post",
        "distance_km": 74.0,
        "standard_transit_hours": 2.8,
        "current_estimated_transit_hours": 2.9,
        "max_vehicle_payload_tonnes": 15.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.46,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 8.0,
        "total_capacity_tonnes": 20.0,
        "capacity_utilization_pct": 40.0,
        "estimated_fuel_liters": 82.0,
        "estimated_cost_inr": 10500.0,
        "elevation_gain_meters": 1100.0,
        "peak_pass_name": "Mushkoh Ridge Crest",
        "peak_pass_altitude": 3650.0,
        "is_primary": False,
        "active_disruptions": [],
        "mitigation_notes": "High ridge unpaved patrol track bypassing the main Drass valley floor.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Kargil Transit Depot", "latitude": 34.5539, "longitude": 76.1310, "altitude_meters": 2676.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Chulichan Post", "latitude": 34.4800, "longitude": 75.9500, "altitude_meters": 3100.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Mushkoh Valley Forward Base", "latitude": 34.4000, "longitude": 75.8000, "altitude_meters": 3450.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 4, "waypoint_name": "Drass Forward Post", "latitude": 34.4290, "longitude": 75.7533, "altitude_meters": 3280.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },

    # --------------------------------------------------------------------------
    # 8. Udhampur <-> Leh Strategic Direct Axis
    # --------------------------------------------------------------------------
    {
        "route_id": "RTE-UDH-LEH-01",
        "route_name": "Manali - Sarchu - Atal Tunnel Strategic Axis (Direct)",
        "origin_location_id": "LOC-UDH-02",
        "destination_location_id": "LOC-LEH-01",
        "origin_name": "Udhampur Northern Depot",
        "destination_name": "Leh Base Logistics Hub",
        "distance_km": 490.0,
        "standard_transit_hours": 14.5,
        "current_estimated_transit_hours": 15.0,
        "max_vehicle_payload_tonnes": 35.0,
        "road_condition": RoadCondition.HIGH_ALTITUDE_PASS,
        "risk_score": 0.36,
        "is_blocked": False,
        "status": RouteStatus.OPERATIONAL,
        "allocated_capacity_tonnes": 85.0,
        "total_capacity_tonnes": 120.0,
        "capacity_utilization_pct": 70.8,
        "estimated_fuel_liters": 490.0,
        "estimated_cost_inr": 64000.0,
        "elevation_gain_meters": 4800.0,
        "peak_pass_name": "Tanglang La Pass",
        "peak_pass_altitude": 5328.0,
        "is_primary": True,
        "active_disruptions": [],
        "mitigation_notes": "Strategic alternative corridor bypassing Kashmir Valley. Crosses Atal Tunnel, Baralacha La, and Tanglang La.",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Udhampur Depot", "latitude": 32.9255, "longitude": 75.1416, "altitude_meters": 750.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 2, "waypoint_name": "Atal Tunnel North Portal", "latitude": 32.3600, "longitude": 77.1700, "altitude_meters": 3060.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 3, "waypoint_name": "Keylong Logistics Depot", "latitude": 32.5700, "longitude": 77.0300, "altitude_meters": 3080.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 4, "waypoint_name": "Baralacha La Pass Summit", "latitude": 32.7600, "longitude": 77.4200, "altitude_meters": 4890.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 5, "waypoint_name": "Sarchu Military Transit Camp", "latitude": 32.9100, "longitude": 77.5800, "altitude_meters": 4290.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 6, "waypoint_name": "Nakee La & Lachung La", "latitude": 33.0800, "longitude": 77.6200, "altitude_meters": 5059.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 7, "waypoint_name": "Pang High-Altitude Base", "latitude": 33.1300, "longitude": 77.7900, "altitude_meters": 4600.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 8, "waypoint_name": "Tanglang La Pass Summit", "latitude": 33.5000, "longitude": 77.7700, "altitude_meters": 5328.0, "road_condition": RoadCondition.HIGH_ALTITUDE_PASS},
            {"sequence_order": 9, "waypoint_name": "Upshi Transit Node", "latitude": 33.8200, "longitude": 77.8100, "altitude_meters": 3380.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
            {"sequence_order": 10, "waypoint_name": "Leh Base Logistics Hub", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "road_condition": RoadCondition.CLEAR_ALL_WEATHER},
        ],
    },
]


# ==============================================================================
# Route Planning & Disruption Management Service
# ==============================================================================

class RouteService:
    """
    Core Route Planning and GIS Telematics Service
    """

    def __init__(self):
        self._locations: List[Dict[str, Any]] = copy.deepcopy(DEFAULT_LOCATIONS)
        self._routes: List[Dict[str, Any]] = copy.deepcopy(DEFAULT_ROUTES)
        self._recalculate_all_capacities()

    def reset_to_pristine(self) -> None:
        """Reset service state back to default synthetic baseline"""
        self._locations = copy.deepcopy(DEFAULT_LOCATIONS)
        self._routes = copy.deepcopy(DEFAULT_ROUTES)
        self._recalculate_all_capacities()

    # --------------------------------------------------------------------------
    # Capacity & Status Computation Rules
    # --------------------------------------------------------------------------

    @staticmethod
    def compute_capacity_utilization(allocated: float, total: float) -> float:
        """
        Mathematical capacity utilization formula with zero-division safeguard:
        Capacity Utilization (%) = (Allocated Capacity / Total Capacity) * 100
        """
        if total <= 0:
            return 0.0
        pct = (allocated / total) * 100.0
        return round(min(max(pct, 0.0), 100.0), 1)

    def _determine_route_status(self, route: Dict[str, Any]) -> RouteStatus:
        """
        Calculates status tier based on operational flags:
        - is_blocked == True -> UNAVAILABLE or DISRUPTED
        - risk_score >= 0.70 or SNOW_BOUND / LANDSLIDE_BLOCKED -> DISRUPTED
        - ETA delay >= 1.25x or utilization >= 90% or risk >= 0.40 -> DELAYED
        - Else -> OPERATIONAL
        """
        if route.get("is_blocked", False):
            return RouteStatus.DISRUPTED

        road_cond = route.get("road_condition", RoadCondition.CLEAR_ALL_WEATHER)
        if road_cond in [RoadCondition.LANDSLIDE_BLOCKED, RoadCondition.SNOW_BOUND]:
            return RouteStatus.DISRUPTED

        risk = route.get("risk_score", 0.0)
        if risk >= 0.70:
            return RouteStatus.DISRUPTED

        std_time = route.get("standard_transit_hours", 1.0)
        est_time = route.get("current_estimated_transit_hours", std_time)
        util_pct = route.get("capacity_utilization_pct", 0.0)

        if (est_time / max(std_time, 0.1) >= 1.25) or util_pct >= 90.0 or risk >= 0.40:
            return RouteStatus.DELAYED

        return RouteStatus.OPERATIONAL

    def _recalculate_all_capacities(self) -> None:
        """Refresh computed fields across all active route records"""
        for route in self._routes:
            alloc = route.get("allocated_capacity_tonnes", 0.0)
            total = route.get("total_capacity_tonnes", 100.0)
            route["capacity_utilization_pct"] = self.compute_capacity_utilization(alloc, total)
            route["status"] = self._determine_route_status(route)

    # --------------------------------------------------------------------------
    # Queries & Lookups
    # --------------------------------------------------------------------------

    def get_all_locations(self) -> List[SupplyLocationBase]:
        """List all military logistics depot nodes"""
        return [SupplyLocationBase(**loc) for loc in self._locations]

    def get_location_by_id(self, location_id: str) -> SupplyLocationBase:
        """Retrieve a specific logistics depot by ID"""
        for loc in self._locations:
            if loc["location_id"] == location_id:
                return SupplyLocationBase(**loc)
        raise NotFoundError(f"Logistics location '{location_id}' not found.")

    def query_routes(
        self,
        origin_location_id: Optional[str] = None,
        destination_location_id: Optional[str] = None,
        status: Optional[str] = None,
        road_condition: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "transit_time",
        sort_order: str = "asc",
    ) -> List[SupplyRouteBase]:
        """
        Filter, search, and sort route corridors
        """
        results = copy.deepcopy(self._routes)

        if origin_location_id and origin_location_id != "all":
            results = [r for r in results if r["origin_location_id"] == origin_location_id]

        if destination_location_id and destination_location_id != "all":
            results = [r for r in results if r["destination_location_id"] == destination_location_id]

        if status and status != "all":
            results = [r for r in results if str(r["status"]).lower() == status.lower()]

        if road_condition and road_condition != "all":
            results = [r for r in results if str(r["road_condition"]).lower() == road_condition.lower()]

        if search and search.strip():
            q = search.lower().strip()
            results = [
                r for r in results
                if q in r["route_id"].lower()
                or q in r["route_name"].lower()
                or q in (r.get("origin_name") or "").lower()
                or q in (r.get("destination_name") or "").lower()
                or q in (r.get("peak_pass_name") or "").lower()
            ]

        # Sorting logic
        def sort_key(item: Dict[str, Any]):
            if sort_by == "distance":
                return item.get("distance_km", 0.0)
            elif sort_by == "capacity_utilization":
                return item.get("capacity_utilization_pct", 0.0)
            elif sort_by == "risk_score":
                return item.get("risk_score", 0.0)
            elif sort_by == "cost":
                return item.get("estimated_cost_inr", 0.0)
            elif sort_by == "transit_time":
            default:
                return item.get("current_estimated_transit_hours", 0.0)

        reverse = (sort_order.lower() == "desc")
        results.sort(key=sort_key, reverse=reverse)

        return [SupplyRouteBase(**r) for r in results]

    def get_route_by_id(self, route_id: str) -> Dict[str, Any]:
        """Retrieve a specific route with full waypoint details"""
        for r in self._routes:
            if r["route_id"] == route_id:
                return copy.deepcopy(r)
        raise NotFoundError(f"Route corridor '{route_id}' not found.")

    def calculate_kpis(self) -> RouteKPIs:
        """Calculate network-wide aggregated metrics"""
        total = len(self._routes)
        if total == 0:
            return RouteKPIs(
                total_routes=0,
                operational_routes=0,
                delayed_routes=0,
                disrupted_routes=0,
                unavailable_routes=0,
                average_transit_hours=0.0,
                average_capacity_utilization_pct=0.0,
                total_network_distance_km=0.0,
                active_disruptions_count=0,
            )

        op = sum(1 for r in self._routes if r["status"] == RouteStatus.OPERATIONAL)
        delays = sum(1 for r in self._routes if r["status"] == RouteStatus.DELAYED)
        disrupt = sum(1 for r in self._routes if r["status"] == RouteStatus.DISRUPTED)
        unavail = sum(1 for r in self._routes if r["status"] == RouteStatus.UNAVAILABLE)

        avg_hours = sum(r["current_estimated_transit_hours"] for r in self._routes) / total
        avg_util = sum(r["capacity_utilization_pct"] for r in self._routes) / total
        total_dist = sum(r["distance_km"] for r in self._routes)
        active_disrupt_count = sum(len(r.get("active_disruptions", [])) for r in self._routes)

        return RouteKPIs(
            total_routes=total,
            operational_routes=op,
            delayed_routes=delays,
            disrupted_routes=disrupt,
            unavailable_routes=unavail,
            average_transit_hours=round(avg_hours, 1),
            average_capacity_utilization_pct=round(avg_util, 1),
            total_network_distance_km=round(total_dist, 1),
            active_disruptions_count=active_disrupt_count,
        )

    # --------------------------------------------------------------------------
    # AI Convoy Route Optimization
    # --------------------------------------------------------------------------

    def optimize_route(self, request: RouteOptimizationRequest) -> RouteOptimizationResponse:
        """
        AI Shortest-Path & Risk-Optimized Convoy Routing Algorithm
        Selects primary corridor and generates ranked alternatives.
        """
        origin_id = request.origin_location_id
        dest_id = request.destination_location_id

        if origin_id == dest_id:
            raise ValidationError("Origin and destination depots cannot be identical.")

        # Find matching candidate corridors
        candidates = [
            r for r in self._routes
            if r["origin_location_id"] == origin_id and r["destination_location_id"] == dest_id
        ]

        if not candidates:
            # Check reverse or generate fallback
            candidates = [
                r for r in self._routes
                if r["origin_location_id"] == dest_id and r["destination_location_id"] == origin_id
            ]

        if not candidates:
            raise NotFoundError(f"No established corridor between '{origin_id}' and '{dest_id}'.")

        # Multi-objective scoring function
        def evaluate_candidate(r: Dict[str, Any]) -> float:
            score = 0.0
            # Weight 1: Transit time
            score += r["current_estimated_transit_hours"] * 10.0
            # Weight 2: Distance
            score += r["distance_km"] * 0.1
            # Weight 3: Risk penalty
            score += r["risk_score"] * 50.0
            # Weight 4: Road blockage penalty
            if r.get("is_blocked", False):
                score += 1000.0
            # Weight 5: Capacity headroom
            if r.get("capacity_utilization_pct", 0) > 90:
                score += 40.0
            if request.avoid_avalanche_zones and r.get("road_condition") == RoadCondition.AVALANCHE_WARNING:
                score += 80.0
            return score

        # Rank candidates
        sorted_candidates = sorted(candidates, key=evaluate_candidate)
        primary = sorted_candidates[0]
        alternatives = sorted_candidates[1:]

        # Calculate time saved vs baseline
        baseline_time = max(c["current_estimated_transit_hours"] for c in candidates)
        hours_saved = max(0.0, round(baseline_time - primary["current_estimated_transit_hours"], 1))

        # Fuel estimation: 0.9L per km on mountain gradients + payload adjustment
        fuel = round(primary["distance_km"] * 0.9 + (request.total_cargo_weight_tonnes * 1.5), 1)

        summary = (
            f"Optimized corridor '{primary['route_name']}' selected. "
            f"Pass elevation: {primary.get('peak_pass_name', 'N/A')} ({primary.get('peak_pass_altitude', 0)}m). "
            f"Risk index: {int(primary['risk_score'] * 100)}%. "
            f"Capacity headroom: {round(100.0 - primary['capacity_utilization_pct'], 1)}%."
        )

        return RouteOptimizationResponse(
            optimization_id=f"OPT-{int(datetime.now(timezone.utc).timestamp())}",
            primary_route_id=primary["route_id"],
            primary_route_name=primary["route_name"],
            alternative_route_ids=[a["route_id"] for a in alternatives],
            total_distance_km=primary["distance_km"],
            estimated_transit_hours=primary["current_estimated_transit_hours"],
            hours_saved_vs_baseline=hours_saved,
            fuel_estimate_liters=fuel,
            risk_assessment_summary=summary,
            waypoints=[Waypoint(**w) for w in primary.get("waypoints", [])],
            alternative_routes=[SupplyRouteBase(**a) for a in alternatives],
        )

    # --------------------------------------------------------------------------
    # Disruption Simulation Engine
    # --------------------------------------------------------------------------

    def simulate_disruption(self, request: DisruptionSimulationRequest) -> DisruptionSimulationResponse:
        """
        Non-destructively injects real-world mountain pass disruptions:
        - Avalanche warnings / blizzards
        - Landslide blockages
        - Capacity restrictions & heavy artillery convoys
        - Transit time multipliers
        """
        sim_id = f"SIM-DISRUPT-{int(datetime.now(timezone.utc).timestamp())}"
        scenario_name = request.scenario_preset or "Custom Tactical Disruption"
        affected: List[Dict[str, Any]] = []
        reroutes: List[Dict[str, Any]] = []

        # Target specific route or apply preset
        target_route_id = request.route_id
        preset = request.scenario_preset

        if preset == "zoji_la_blizzard":
            scenario_name = "Zoji La Winter Blizzard & Snow Accumulation"
            target_route_id = "RTE-SRI-KRG-01"
            request.delay_multiplier = 2.4
            request.road_condition = RoadCondition.SNOW_BOUND
            request.risk_score_override = 0.82
            request.capacity_reduction_pct = 40.0

        elif preset == "khardung_la_landslide":
            scenario_name = "Khardung La Axis Avalanche / Rockfall Blockage"
            target_route_id = "RTE-LEH-SIA-01"
            request.is_blocked = True
            request.road_condition = RoadCondition.LANDSLIDE_BLOCKED
            request.risk_score_override = 0.95

        elif preset == "drass_artillery_priority":
            scenario_name = "Drass Sector Heavy Ammunition Convoy Surge"
            target_route_id = "RTE-KRG-DRS-01"
            request.delay_hours = 3.5
            request.risk_score_override = 0.45
            request.capacity_reduction_pct = 30.0

        # Apply disruption modifications
        for route in self._routes:
            if target_route_id and route["route_id"] != target_route_id:
                continue

            # Modifiers
            if request.delay_hours and request.delay_hours > 0:
                route["current_estimated_transit_hours"] = round(
                    route["standard_transit_hours"] + request.delay_hours, 1
                )
            elif request.delay_multiplier and request.delay_multiplier > 1.0:
                route["current_estimated_transit_hours"] = round(
                    route["standard_transit_hours"] * request.delay_multiplier, 1
                )

            if request.capacity_reduction_pct and request.capacity_reduction_pct > 0:
                original_total = route["total_capacity_tonnes"]
                route["total_capacity_tonnes"] = round(
                    original_total * (1.0 - (request.capacity_reduction_pct / 100.0)), 1
                )

            if request.is_blocked is not None:
                route["is_blocked"] = request.is_blocked

            if request.road_condition:
                route["road_condition"] = request.road_condition

            if request.risk_score_override is not None:
                route["risk_score"] = request.risk_score_override

            # Update alert and status
            disruption_tag = f"SIMULATED: {scenario_name}"
            if disruption_tag not in route.get("active_disruptions", []):
                route.setdefault("active_disruptions", []).append(disruption_tag)

            route["capacity_utilization_pct"] = self.compute_capacity_utilization(
                route.get("allocated_capacity_tonnes", 0.0),
                route.get("total_capacity_tonnes", 100.0)
            )
            route["status"] = self._determine_route_status(route)
            affected.append(copy.deepcopy(route))

            # Find alternative detour for blocked/disrupted route
            if route["status"] in [RouteStatus.DISRUPTED, RouteStatus.UNAVAILABLE] or route.get("is_blocked"):
                alt_routes = [
                    r for r in self._routes
                    if r["origin_location_id"] == route["origin_location_id"]
                    and r["destination_location_id"] == route["destination_location_id"]
                    and r["route_id"] != route["route_id"]
                    and not r.get("is_blocked", False)
                ]
                if alt_routes:
                    best_alt = min(alt_routes, key=lambda x: x["current_estimated_transit_hours"])
                    reroutes.append({
                        "disrupted_route_id": route["route_id"],
                        "disrupted_route_name": route["route_name"],
                        "recommended_detour_id": best_alt["route_id"],
                        "recommended_detour_name": best_alt["route_name"],
                        "detour_transit_hours": best_alt["current_estimated_transit_hours"],
                        "transit_time_delta_hours": round(best_alt["current_estimated_transit_hours"] - route["standard_transit_hours"], 1),
                    })

        impact_summary = (
            f"Scenario '{scenario_name}' applied. "
            f"Affected {len(affected)} corridor(s). "
            f"Generated {len(reroutes)} dynamic tactical detour recommendation(s)."
        )

        return DisruptionSimulationResponse(
            simulation_id=sim_id,
            scenario_name=scenario_name,
            applied_at=datetime.now(timezone.utc),
            affected_routes_count=len(affected),
            affected_routes=[SupplyRouteBase(**a) for a in affected],
            reroute_recommendations=reroutes,
            system_impact_summary=impact_summary,
        )


# Singleton instance
route_service = RouteService()
