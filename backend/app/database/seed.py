"""
LogiPredict AI - Master Database Seeder & Idempotent Initialization
===================================================================
Phase 10.1: SQLite Database Integration & Canonical Data Population
Indian Army Forward Supply Chain (SIH 2026)

Populates all 25 canonical military SKUs across 10 forward command depots,
90-day demand history telemetry, forecast projections, predictive anomaly alerts,
discrete-event simulation scenarios, and multi-echelon supply requisitions.

DISCLAIMER: All seeded data is 100% synthetic and generated for research,
benchmarking, and hackathon evaluation purposes.
"""

from datetime import datetime, timedelta
import math
import random
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.models.inventory import InventoryItemModel, InventoryTransactionModel
from app.models.demand import DemandHistoryModel
from app.models.forecast import ForecastRecordModel
from app.models.alert import PredictiveAlertModel
from app.models.simulation import (
    SimulationScenarioModel,
    SimulationRunModel,
    SimulationRecommendationModel,
)
from app.models.supplies import SupplyRequisitionModel, RequisitionItemModel
from app.models.locations import (
    MilitaryLocationModel,
    ConvoyRouteModel,
    RouteWaypointModel,
)


def init_db() -> None:
    """
    Creates all relational database tables defined in SQLAlchemy Base metadata.
    Safe to execute on application startup.
    """
    Base.metadata.create_all(bind=engine)


# -----------------------------------------------------------------------------
# Canonical Dataset Definitions
# -----------------------------------------------------------------------------

CANONICAL_LOCATIONS: List[Dict[str, Any]] = [
    {
        "location_id": "DEPOT-LEH-01",
        "name": "Leh Corps Supply Depot",
        "echelon_type": "BASE_DEPOT",
        "latitude": 34.1526,
        "longitude": 77.5771,
        "altitude_meters": 3500.0,
        "capacity_tonnes": 15000.0,
    },
    {
        "location_id": "DEPOT-KGL-02",
        "name": "Kargil Forward Logistics Hub",
        "echelon_type": "FORWARD_DEPOT",
        "latitude": 34.5539,
        "longitude": 76.1349,
        "altitude_meters": 2676.0,
        "capacity_tonnes": 8000.0,
    },
    {
        "location_id": "DEPOT-DRA-03",
        "name": "Drass Forward Operating Base",
        "echelon_type": "FOB",
        "latitude": 34.4294,
        "longitude": 75.7533,
        "altitude_meters": 3290.0,
        "capacity_tonnes": 5000.0,
    },
    {
        "location_id": "DEPOT-SIA-04",
        "name": "Siachen Base Support Camp",
        "echelon_type": "FORWARD_DEPOT",
        "latitude": 35.2000,
        "longitude": 77.1000,
        "altitude_meters": 3657.0,
        "capacity_tonnes": 6000.0,
    },
    {
        "location_id": "DEPOT-SRN-05",
        "name": "Srinagar Central Logistics Depot",
        "echelon_type": "BASE_DEPOT",
        "latitude": 34.0837,
        "longitude": 74.7973,
        "altitude_meters": 1585.0,
        "capacity_tonnes": 20000.0,
    },
    {
        "location_id": "DEPOT-KUP-06",
        "name": "Kupwara Forward Support Hub",
        "echelon_type": "FOB",
        "latitude": 34.5262,
        "longitude": 74.2546,
        "altitude_meters": 1615.0,
        "capacity_tonnes": 4000.0,
    },
    {
        "location_id": "DEPOT-AHM-07",
        "name": "Ahmedabad Cold Hub",
        "echelon_type": "BASE_DEPOT",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "altitude_meters": 53.0,
        "capacity_tonnes": 25000.0,
    },
    {
        "location_id": "DEPOT-SNM-08",
        "name": "Sonamarg Staging Transit Camp",
        "echelon_type": "FOB",
        "latitude": 34.3000,
        "longitude": 75.2900,
        "altitude_meters": 2730.0,
        "capacity_tonnes": 3500.0,
    },
    {
        "location_id": "DEPOT-NYM-09",
        "name": "Nyoma Advanced Landing Ground",
        "echelon_type": "FOB",
        "latitude": 33.2000,
        "longitude": 78.6800,
        "altitude_meters": 4175.0,
        "capacity_tonnes": 4500.0,
    },
    {
        "location_id": "DEPOT-DIS-10",
        "name": "Diskit / Nubra Base Logistics Depot",
        "echelon_type": "FORWARD_DEPOT",
        "latitude": 34.5700,
        "longitude": 77.5600,
        "altitude_meters": 3140.0,
        "capacity_tonnes": 5500.0,
    },
]

CANONICAL_SKUS: List[Dict[str, Any]] = [
    {
        "item_id": "SKU-POL-DSL-01",
        "item_name": "Winter-Grade Diesel ATF-800",
        "category": "POL",
        "unit_of_measurement": "Liters",
        "current_stock": 84000.0,
        "min_threshold": 30000.0,
        "max_capacity": 120000.0,
        "reorder_level": 45000.0,
        "storage_location_id": "DEPOT-LEH-01",
        "storage_location_name": "Leh Corps Supply Depot",
        "consumption_rate_daily": 3200.0,
        "lead_time_days": 7,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-POL-KRS-02",
        "item_name": "High-Altitude Kerosene SKO",
        "category": "POL",
        "unit_of_measurement": "Liters",
        "current_stock": 24000.0,
        "min_threshold": 25000.0,
        "max_capacity": 80000.0,
        "reorder_level": 32000.0,
        "storage_location_id": "DEPOT-KGL-02",
        "storage_location_name": "Kargil Forward Logistics Hub",
        "consumption_rate_daily": 1800.0,
        "lead_time_days": 6,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ORD-556-03",
        "item_name": "5.56x45mm INSAS Ball Ammunition",
        "category": "Ordnance & Ammunition",
        "unit_of_measurement": "Tins",
        "current_stock": 650.0,
        "min_threshold": 200.0,
        "max_capacity": 1000.0,
        "reorder_level": 350.0,
        "storage_location_id": "DEPOT-LEH-01",
        "storage_location_name": "Leh Corps Supply Depot",
        "consumption_rate_daily": 12.0,
        "lead_time_days": 10,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ORD-81M-04",
        "item_name": "81mm Mortar High-Explosive Shells",
        "category": "Ordnance & Ammunition",
        "unit_of_measurement": "Crates",
        "current_stock": 420.0,
        "min_threshold": 150.0,
        "max_capacity": 600.0,
        "reorder_level": 250.0,
        "storage_location_id": "DEPOT-DRA-03",
        "storage_location_name": "Drass Forward Operating Base",
        "consumption_rate_daily": 8.0,
        "lead_time_days": 12,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-RAT-MRE-05",
        "item_name": "High-Altitude 24hr Combat Rations (MRE)",
        "category": "Rations & Subsistence",
        "unit_of_measurement": "Packs",
        "current_stock": 14200.0,
        "min_threshold": 5000.0,
        "max_capacity": 20000.0,
        "reorder_level": 7500.0,
        "storage_location_id": "DEPOT-SIA-04",
        "storage_location_name": "Siachen Base Support Camp",
        "consumption_rate_daily": 450.0,
        "lead_time_days": 5,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-MED-PLM-07",
        "item_name": "Freeze-Dried Plasma & Vaccines",
        "category": "Medical & Cold-Chain",
        "unit_of_measurement": "Kits",
        "current_stock": 120.0,
        "min_threshold": 100.0,
        "max_capacity": 400.0,
        "reorder_level": 150.0,
        "storage_location_id": "DEPOT-AHM-07",
        "storage_location_name": "Ahmedabad Cold Hub",
        "consumption_rate_daily": 6.0,
        "lead_time_days": 4,
        "is_temperature_sensitive": True,
        "target_temp_min": 2.0,
        "target_temp_max": 8.0,
    },
    {
        "item_id": "SKU-ENG-BAT-09",
        "item_name": "LiFePO4 Extreme-Cold Battery 24V",
        "category": "Spares & Engineering",
        "unit_of_measurement": "Units",
        "current_stock": 48.0,
        "min_threshold": 30.0,
        "max_capacity": 150.0,
        "reorder_level": 50.0,
        "storage_location_id": "DEPOT-LEH-01",
        "storage_location_name": "Leh Corps Supply Depot",
        "consumption_rate_daily": 2.5,
        "lead_time_days": 14,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-CLO-ECW-10",
        "item_name": "Extreme Cold Weather Clothing (ECWCS)",
        "category": "General Stores",
        "unit_of_measurement": "Sets",
        "current_stock": 340.0,
        "min_threshold": 400.0,
        "max_capacity": 1200.0,
        "reorder_level": 550.0,
        "storage_location_id": "DEPOT-DRA-03",
        "storage_location_name": "Drass Forward Operating Base",
        "consumption_rate_daily": 15.0,
        "lead_time_days": 9,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-POL-AVF-11",
        "item_name": "Aviation Turbine Fuel (ATF Jet A-1)",
        "category": "POL",
        "unit_of_measurement": "Liters",
        "current_stock": 45000.0,
        "min_threshold": 15000.0,
        "max_capacity": 60000.0,
        "reorder_level": 22000.0,
        "storage_location_id": "DEPOT-SRN-05",
        "storage_location_name": "Srinagar Central Logistics Depot",
        "consumption_rate_daily": 1400.0,
        "lead_time_days": 8,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-RAT-DRB-12",
        "item_name": "High-Energy Composite Ration Bars",
        "category": "Rations & Subsistence",
        "unit_of_measurement": "Boxes",
        "current_stock": 8900.0,
        "min_threshold": 3000.0,
        "max_capacity": 10000.0,
        "reorder_level": 4000.0,
        "storage_location_id": "DEPOT-KGL-02",
        "storage_location_name": "Kargil Forward Logistics Hub",
        "consumption_rate_daily": 210.0,
        "lead_time_days": 4,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ORD-155-13",
        "item_name": "155mm Artillery High-Explosive Shells",
        "category": "Ordnance & Ammunition",
        "unit_of_measurement": "Shells",
        "current_stock": 210.0,
        "min_threshold": 100.0,
        "max_capacity": 350.0,
        "reorder_level": 140.0,
        "storage_location_id": "DEPOT-LEH-01",
        "storage_location_name": "Leh Corps Supply Depot",
        "consumption_rate_daily": 4.0,
        "lead_time_days": 15,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-MED-OXY-14",
        "item_name": "Portable Medical Oxygen Cylinders (40L)",
        "category": "Medical & Cold-Chain",
        "unit_of_measurement": "Cylinders",
        "current_stock": 85.0,
        "min_threshold": 90.0,
        "max_capacity": 250.0,
        "reorder_level": 110.0,
        "storage_location_id": "DEPOT-SIA-04",
        "storage_location_name": "Siachen Base Support Camp",
        "consumption_rate_daily": 5.0,
        "lead_time_days": 6,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ENG-SPW-15",
        "item_name": "All-Terrain Snowmobile Drive Tracks",
        "category": "Spares & Engineering",
        "unit_of_measurement": "Sets",
        "current_stock": 18.0,
        "min_threshold": 10.0,
        "max_capacity": 40.0,
        "reorder_level": 15.0,
        "storage_location_id": "DEPOT-SNM-08",
        "storage_location_name": "Sonamarg Staging Transit Camp",
        "consumption_rate_daily": 0.8,
        "lead_time_days": 20,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-CLO-GLV-16",
        "item_name": "Heated Electric Cold-Weather Mittens",
        "category": "General Stores",
        "unit_of_measurement": "Pairs",
        "current_stock": 520.0,
        "min_threshold": 250.0,
        "max_capacity": 800.0,
        "reorder_level": 350.0,
        "storage_location_id": "DEPOT-KUP-06",
        "storage_location_name": "Kupwara Forward Support Hub",
        "consumption_rate_daily": 12.0,
        "lead_time_days": 8,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-POL-LUB-17",
        "item_name": "Synthetic Multi-Grade Gear Oil SAE 75W-90",
        "category": "POL",
        "unit_of_measurement": "Liters",
        "current_stock": 3100.0,
        "min_threshold": 1200.0,
        "max_capacity": 5000.0,
        "reorder_level": 1800.0,
        "storage_location_id": "DEPOT-SRN-05",
        "storage_location_name": "Srinagar Central Logistics Depot",
        "consumption_rate_daily": 65.0,
        "lead_time_days": 7,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-MED-ANT-18",
        "item_name": "High-Altitude Cerebral Edema (HACE) Kits",
        "category": "Medical & Cold-Chain",
        "unit_of_measurement": "Kits",
        "current_stock": 190.0,
        "min_threshold": 80.0,
        "max_capacity": 300.0,
        "reorder_level": 120.0,
        "storage_location_id": "DEPOT-SIA-04",
        "storage_location_name": "Siachen Base Support Camp",
        "consumption_rate_daily": 3.0,
        "lead_time_days": 5,
        "is_temperature_sensitive": True,
        "target_temp_min": 4.0,
        "target_temp_max": 12.0,
    },
    {
        "item_id": "SKU-ORD-762-19",
        "item_name": "7.62mm NATO Sniper Ammunition Match Grade",
        "category": "Ordnance & Ammunition",
        "unit_of_measurement": "Boxes",
        "current_stock": 140.0,
        "min_threshold": 150.0,
        "max_capacity": 500.0,
        "reorder_level": 200.0,
        "storage_location_id": "DEPOT-DRA-03",
        "storage_location_name": "Drass Forward Operating Base",
        "consumption_rate_daily": 4.0,
        "lead_time_days": 12,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-RAT-WAT-20",
        "item_name": "Emergency Mineralized Water Purifier Packets",
        "category": "Rations & Subsistence",
        "unit_of_measurement": "Tablets",
        "current_stock": 28000.0,
        "min_threshold": 10000.0,
        "max_capacity": 40000.0,
        "reorder_level": 15000.0,
        "storage_location_id": "DEPOT-LEH-01",
        "storage_location_name": "Leh Corps Supply Depot",
        "consumption_rate_daily": 850.0,
        "lead_time_days": 3,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ENG-GEN-21",
        "item_name": "Tactical Silent Diesel Generator 5kW",
        "category": "Spares & Engineering",
        "unit_of_measurement": "Units",
        "current_stock": 12.0,
        "min_threshold": 15.0,
        "max_capacity": 30.0,
        "reorder_level": 18.0,
        "storage_location_id": "DEPOT-NYM-09",
        "storage_location_name": "Nyoma Advanced Landing Ground",
        "consumption_rate_daily": 0.2,
        "lead_time_days": 25,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-CLO-TENT-22",
        "item_name": "Modular High-Wind Mountain Tent 4-Seater",
        "category": "General Stores",
        "unit_of_measurement": "Tents",
        "current_stock": 75.0,
        "min_threshold": 40.0,
        "max_capacity": 150.0,
        "reorder_level": 60.0,
        "storage_location_id": "DEPOT-DIS-10",
        "storage_location_name": "Diskit / Nubra Base Logistics Depot",
        "consumption_rate_daily": 1.0,
        "lead_time_days": 14,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ENG-TYR-23",
        "item_name": "Heavy Tactical Truck Radial Tire 14.00R20",
        "category": "Spares & Engineering",
        "unit_of_measurement": "Tyres",
        "current_stock": 94.0,
        "min_threshold": 50.0,
        "max_capacity": 200.0,
        "reorder_level": 80.0,
        "storage_location_id": "DEPOT-LEH-01",
        "storage_location_name": "Leh Corps Supply Depot",
        "consumption_rate_daily": 2.0,
        "lead_time_days": 18,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-MED-TRA-24",
        "item_name": "Advanced Battlefield Trauma & Bandage Kits",
        "category": "Medical & Cold-Chain",
        "unit_of_measurement": "Kits",
        "current_stock": 640.0,
        "min_threshold": 300.0,
        "max_capacity": 1000.0,
        "reorder_level": 450.0,
        "storage_location_id": "DEPOT-KGL-02",
        "storage_location_name": "Kargil Forward Logistics Hub",
        "consumption_rate_daily": 15.0,
        "lead_time_days": 5,
        "is_temperature_sensitive": False,
    },
    {
        "item_id": "SKU-ORD-GRN-25",
        "item_name": "Multi-Role Fragmentation Hand Grenades HE 36M",
        "category": "Ordnance & Ammunition",
        "unit_of_measurement": "Pieces",
        "current_stock": 1200.0,
        "min_threshold": 500.0,
        "max_capacity": 2000.0,
        "reorder_level": 800.0,
        "storage_location_id": "DEPOT-KUP-06",
        "storage_location_name": "Kupwara Forward Support Hub",
        "consumption_rate_daily": 18.0,
        "lead_time_days": 10,
        "is_temperature_sensitive": False,
    },
]

CANONICAL_ROUTES: List[Dict[str, Any]] = [
    {
        "route_id": "ROUTE-LEH-KGL",
        "route_name": "Leh - Kargil Strategic Highway (NH-1)",
        "origin_id": "DEPOT-LEH-01",
        "destination_id": "DEPOT-KGL-02",
        "distance_km": 216.0,
        "estimated_duration_hours": 6.5,
        "status": "ACTIVE",
        "risk_level": "LOW",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh Supply Depot Gate", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "current_condition": "CLEAR"},
            {"sequence_order": 2, "waypoint_name": "Nimmu Staging Post", "latitude": 34.1950, "longitude": 77.3400, "altitude_meters": 3150.0, "current_condition": "CLEAR"},
            {"sequence_order": 3, "waypoint_name": "Khalsi Checkpoint", "latitude": 34.3200, "longitude": 76.8800, "altitude_meters": 2980.0, "current_condition": "CLEAR"},
            {"sequence_order": 4, "waypoint_name": "Fotu La Pass Checkpoint", "latitude": 34.2800, "longitude": 76.7200, "altitude_meters": 4108.0, "pass_name": "Fotu La", "current_condition": "CLEAR"},
            {"sequence_order": 5, "waypoint_name": "Namika La Pass Checkpoint", "latitude": 34.3600, "longitude": 76.4300, "altitude_meters": 3700.0, "pass_name": "Namika La", "current_condition": "CLEAR"},
            {"sequence_order": 6, "waypoint_name": "Kargil Hub Terminal", "latitude": 34.5539, "longitude": 76.1349, "altitude_meters": 2676.0, "current_condition": "CLEAR"},
        ],
    },
    {
        "route_id": "ROUTE-SRN-KGL",
        "route_name": "Srinagar - Zoji La - Kargil Highway (NH-1D)",
        "origin_id": "DEPOT-SRN-05",
        "destination_id": "DEPOT-KGL-02",
        "distance_km": 204.0,
        "estimated_duration_hours": 7.0,
        "status": "RESTRICTED",
        "risk_level": "HIGH",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Srinagar Central Gate", "latitude": 34.0837, "longitude": 74.7973, "altitude_meters": 1585.0, "current_condition": "CLEAR"},
            {"sequence_order": 2, "waypoint_name": "Ganderbal Confluence Checkpoint", "latitude": 34.2160, "longitude": 74.7800, "altitude_meters": 1620.0, "current_condition": "CLEAR"},
            {"sequence_order": 3, "waypoint_name": "Sonamarg Staging Transit Camp", "latitude": 34.3000, "longitude": 75.2900, "altitude_meters": 2730.0, "current_condition": "RAIN_ICING"},
            {"sequence_order": 4, "waypoint_name": "Baltal Convoy Staging Area", "latitude": 34.2600, "longitude": 75.4200, "altitude_meters": 2900.0, "current_condition": "SNOW_HAZARD"},
            {"sequence_order": 5, "waypoint_name": "Zoji La Pass Military Outpost", "latitude": 34.2800, "longitude": 75.4800, "altitude_meters": 3528.0, "pass_name": "Zoji La", "current_condition": "BLIZZARD_ALERT"},
            {"sequence_order": 6, "waypoint_name": "Drass Forward Operating Base", "latitude": 34.4294, "longitude": 75.7533, "altitude_meters": 3290.0, "current_condition": "LOW_TEMP"},
            {"sequence_order": 7, "waypoint_name": "Kargil Forward Logistics Hub", "latitude": 34.5539, "longitude": 76.1349, "altitude_meters": 2676.0, "current_condition": "CLEAR"},
        ],
    },
    {
        "route_id": "ROUTE-KGL-SIA",
        "route_name": "Kargil - Khardung La - Siachen Base Corridor",
        "origin_id": "DEPOT-KGL-02",
        "destination_id": "DEPOT-SIA-04",
        "distance_km": 185.0,
        "estimated_duration_hours": 6.0,
        "status": "ACTIVE",
        "risk_level": "MEDIUM",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Kargil Staging Yard", "latitude": 34.5539, "longitude": 76.1349, "altitude_meters": 2676.0, "current_condition": "CLEAR"},
            {"sequence_order": 2, "waypoint_name": "Batalik Sector Checkpoint", "latitude": 34.6200, "longitude": 76.3500, "altitude_meters": 2800.0, "current_condition": "CLEAR"},
            {"sequence_order": 3, "waypoint_name": "Khalsi Transit Post", "latitude": 34.3200, "longitude": 76.8800, "altitude_meters": 2980.0, "current_condition": "CLEAR"},
            {"sequence_order": 4, "waypoint_name": "Khardung La High Pass Post", "latitude": 34.2800, "longitude": 77.6000, "altitude_meters": 5359.0, "pass_name": "Khardung La", "current_condition": "HIGH_WIND"},
            {"sequence_order": 5, "waypoint_name": "Diskit Base Logistics Hub", "latitude": 34.5700, "longitude": 77.5600, "altitude_meters": 3140.0, "current_condition": "CLEAR"},
            {"sequence_order": 6, "waypoint_name": "Siachen Base Support Camp", "latitude": 35.2000, "longitude": 77.1000, "altitude_meters": 3657.0, "current_condition": "SUB_ZERO"},
        ],
    },
    {
        "route_id": "ROUTE-LEH-NYM",
        "route_name": "Leh - Karu - Nyoma ALG Highway",
        "origin_id": "DEPOT-LEH-01",
        "destination_id": "DEPOT-NYM-09",
        "distance_km": 145.0,
        "estimated_duration_hours": 4.5,
        "status": "ACTIVE",
        "risk_level": "LOW",
        "waypoints": [
            {"sequence_order": 1, "waypoint_name": "Leh South Depot Gate", "latitude": 34.1526, "longitude": 77.5771, "altitude_meters": 3500.0, "current_condition": "CLEAR"},
            {"sequence_order": 2, "waypoint_name": "Karu Junction Checkpoint", "latitude": 33.9200, "longitude": 77.7400, "altitude_meters": 3450.0, "current_condition": "CLEAR"},
            {"sequence_order": 3, "waypoint_name": "Upshi Transit Depot", "latitude": 33.8200, "longitude": 77.8100, "altitude_meters": 3400.0, "current_condition": "CLEAR"},
            {"sequence_order": 4, "waypoint_name": "Chumathang Staging Post", "latitude": 33.3600, "longitude": 78.3300, "altitude_meters": 3950.0, "current_condition": "CLEAR"},
            {"sequence_order": 5, "waypoint_name": "Nyoma Advanced Landing Ground Gate", "latitude": 33.2000, "longitude": 78.6800, "altitude_meters": 4175.0, "current_condition": "CLEAR"},
        ],
    },
]


def seed_database(db: Session, force_reset: bool = False) -> Dict[str, int]:
    """
    Deterministically and idempotently seeds all tables in the SQLite database.
    Returns counts of seeded entities.
    """
    counts = {
        "locations": 0,
        "routes": 0,
        "waypoints": 0,
        "inventory_items": 0,
        "transactions": 0,
        "demand_history": 0,
        "forecast_records": 0,
        "alerts": 0,
        "scenarios": 0,
        "simulation_runs": 0,
        "simulation_recommendations": 0,
        "requisitions": 0,
        "requisition_items": 0,
    }

    # 1. Seed Military Locations
    for loc_data in CANONICAL_LOCATIONS:
        existing_loc = db.scalar(
            select(MilitaryLocationModel).where(MilitaryLocationModel.location_id == loc_data["location_id"])
        )
        if not existing_loc:
            loc_obj = MilitaryLocationModel(**loc_data)
            db.add(loc_obj)
            counts["locations"] += 1

    db.flush()

    # 2. Seed Convoy Routes & Waypoints
    for route_info in CANONICAL_ROUTES:
        route_id = route_info["route_id"]
        existing_route = db.scalar(
            select(ConvoyRouteModel).where(ConvoyRouteModel.route_id == route_id)
        )
        if not existing_route:
            route_obj = ConvoyRouteModel(
                route_id=route_id,
                route_name=route_info["route_name"],
                origin_id=route_info["origin_id"],
                destination_id=route_info["destination_id"],
                distance_km=route_info["distance_km"],
                estimated_duration_hours=route_info["estimated_duration_hours"],
                status=route_info["status"],
                risk_level=route_info["risk_level"],
            )
            db.add(route_obj)
            db.flush()
            counts["routes"] += 1

            for wp in route_info["waypoints"]:
                wp_obj = RouteWaypointModel(
                    route_id=route_id,
                    sequence_order=wp["sequence_order"],
                    waypoint_name=wp["waypoint_name"],
                    latitude=wp["latitude"],
                    longitude=wp["longitude"],
                    altitude_meters=wp["altitude_meters"],
                    pass_name=wp.get("pass_name"),
                    current_condition=wp.get("current_condition", "CLEAR"),
                )
                db.add(wp_obj)
                counts["waypoints"] += 1

    db.flush()

    # 3. Seed Canonical Inventory Items & Initial Transactions
    for sku in CANONICAL_SKUS:
        existing_item = db.scalar(
            select(InventoryItemModel).where(InventoryItemModel.item_id == sku["item_id"])
        )
        if not existing_item:
            item_obj = InventoryItemModel(
                item_id=sku["item_id"],
                item_name=sku["item_name"],
                category=sku["category"],
                current_stock=sku["current_stock"],
                min_threshold=sku["min_threshold"],
                max_capacity=sku["max_capacity"],
                reorder_level=sku["reorder_level"],
                unit_of_measurement=sku["unit_of_measurement"],
                storage_location_id=sku["storage_location_id"],
                storage_location_name=sku["storage_location_name"],
                consumption_rate_daily=sku["consumption_rate_daily"],
                lead_time_days=sku["lead_time_days"],
                is_temperature_sensitive=sku.get("is_temperature_sensitive", False),
                target_temp_min=sku.get("target_temp_min"),
                target_temp_max=sku.get("target_temp_max"),
            )
            db.add(item_obj)
            counts["inventory_items"] += 1

            # Create initial opening stock transaction
            txn = InventoryTransactionModel(
                transaction_id=f"TXN-INIT-{sku['item_id']}",
                item_id=sku["item_id"],
                location_id=sku["storage_location_id"],
                transaction_type="inflow",
                quantity=sku["current_stock"],
                unit_of_measurement=sku["unit_of_measurement"],
                balance_after=sku["current_stock"],
                reference_order_id=f"PO-INIT-2026-HQ",
                notes="Initial opening stock buffer verification",
                logged_at=datetime.utcnow() - timedelta(days=15),
            )
            db.add(txn)
            counts["transactions"] += 1

    db.flush()

    # 4. Seed Historical Demand Telemetry (90 Days)
    rng = random.Random(42)
    base_date = datetime(2026, 10, 2)
    start_date = base_date - timedelta(days=90)

    # Check if demand history already exists
    existing_demand_count = db.scalar(select(DemandHistoryModel.id).limit(1))
    if not existing_demand_count:
        for sku in CANONICAL_SKUS[:10]:  # Seed detailed 90-day demand for top 10 SKUs
            base_daily = sku["consumption_rate_daily"]
            for day_idx in range(90):
                dt = start_date + timedelta(days=day_idx)
                date_str = dt.strftime("%Y-%m-%d")

                # Synthetic day-of-week & seasonal fluctuations
                dow_factor = 1.0 + 0.15 * math.sin(day_idx * (2 * math.pi / 7))
                temp_c = round(-5.0 - 15.0 * math.cos(day_idx * (2 * math.pi / 365)) + rng.uniform(-2, 2), 1)
                snow_mm = round(max(0.0, -temp_c * 1.5 + rng.uniform(-5, 10)), 1)
                is_surge = (day_idx in [25, 26, 55, 56, 78, 79])
                surge_mult = 1.8 if is_surge else 1.0

                noise = rng.gauss(0, 0.1 * base_daily)
                daily_val = max(0.0, round(base_daily * dow_factor * surge_mult + noise, 2))

                demand_rec = DemandHistoryModel(
                    item_id=sku["item_id"],
                    location_id=sku["storage_location_id"],
                    date=date_str,
                    actual_demand=daily_val,
                    unit_of_measurement=sku["unit_of_measurement"],
                    temperature_celsius=temp_c,
                    snowfall_mm=snow_mm,
                    is_surge_day=is_surge,
                    is_synthetic=True,
                    data_source="synthetic",
                    created_at=dt,
                )
                db.add(demand_rec)
                counts["demand_history"] += 1

        db.flush()

    # 5. Seed Forecast Projections (14 Days)
    existing_forecast_count = db.scalar(select(ForecastRecordModel.id).limit(1))
    if not existing_forecast_count:
        for sku in CANONICAL_SKUS[:10]:
            base_daily = sku["consumption_rate_daily"]
            for day_offset in range(1, 15):
                f_date = base_date + timedelta(days=day_offset)
                date_str = f_date.strftime("%Y-%m-%d")
                predicted = round(base_daily * (1.0 + 0.05 * math.sin(day_offset)), 2)
                lower = round(predicted * 0.85, 2)
                upper = round(predicted * 1.18, 2)

                f_rec = ForecastRecordModel(
                    forecast_id=f"FCT-{sku['item_id']}-{date_str}",
                    item_id=sku["item_id"],
                    location_id=sku["storage_location_id"],
                    forecast_date=date_str,
                    predicted_demand=predicted,
                    confidence_lower=lower,
                    confidence_upper=upper,
                    confidence_score=0.95,
                    model_name="NeuralEnsemble-LSTM-XGB",
                    model_version="v2.4.1",
                    evaluation_mape=4.85,
                    evaluation_rmse=round(base_daily * 0.06, 2),
                    is_synthetic=True,
                )
                db.add(f_rec)
                counts["forecast_records"] += 1

        db.flush()

    # 6. Seed Predictive Anomaly Alerts
    canonical_alerts = [
        {
            "alert_id": "ALT-2026-POL-01",
            "item_id": "SKU-POL-KRS-02",
            "item_name": "High-Altitude Kerosene SKO",
            "location_id": "DEPOT-KGL-02",
            "location_name": "Kargil Forward Logistics Hub",
            "alert_type": "STOCKOUT_RISK",
            "severity": "CRITICAL",
            "status": "ACTIVE",
            "description": "Stock balance (24,000L) is below minimum critical safety buffer (25,000L). 13.3 days of supply remaining under forecast sub-zero temperatures.",
            "recommended_action": "Execute urgent lateral stock transfer of 20,000L from Srinagar Central Depot via Route NH-1D.",
            "trigger_condition": "current_stock <= min_threshold",
            "metric_value": 24000.0,
            "threshold_value": 25000.0,
            "dedup_hash": "a1b2c3d4e5f601",
        },
        {
            "alert_id": "ALT-2026-MED-02",
            "item_id": "SKU-MED-PLM-07",
            "item_name": "Freeze-Dried Plasma & Vaccines",
            "location_id": "DEPOT-AHM-07",
            "location_name": "Ahmedabad Cold Hub",
            "alert_type": "COLD_CHAIN_BREACH",
            "severity": "HIGH",
            "status": "ACTIVE",
            "description": "Bunker telemetry sensor recorded +8.4°C exceeding maximum allowed cold-chain threshold (+8.0°C).",
            "recommended_action": "Switch to secondary backup cryogenic compressor unit and inspect batch seal integrity.",
            "trigger_condition": "current_temp > target_temp_max",
            "metric_value": 8.4,
            "threshold_value": 8.0,
            "dedup_hash": "b2c3d4e5f6a102",
        },
        {
            "alert_id": "ALT-2026-CLO-03",
            "item_id": "SKU-CLO-ECW-10",
            "item_name": "Extreme Cold Weather Clothing (ECWCS)",
            "location_id": "DEPOT-DRA-03",
            "location_name": "Drass Forward Operating Base",
            "alert_type": "STOCKOUT_RISK",
            "severity": "HIGH",
            "status": "ACKNOWLEDGED",
            "description": "Current on-hand inventory (340 sets) breached safety threshold (400 sets). 22.7 days of cover.",
            "recommended_action": "Expedite delivery requisition REQ-2026-0893 from Leh Base Supply Depot.",
            "trigger_condition": "current_stock < min_threshold",
            "metric_value": 340.0,
            "threshold_value": 400.0,
            "dedup_hash": "c3d4e5f6a1b203",
            "acknowledged_at": datetime.utcnow() - timedelta(hours=4),
            "acknowledged_by": "Maj. R. Sharma (Logistics Officer)",
        },
        {
            "alert_id": "ALT-2026-ORD-04",
            "item_id": "SKU-ORD-762-19",
            "item_name": "7.62mm NATO Sniper Ammunition Match Grade",
            "location_id": "DEPOT-DRA-03",
            "location_name": "Drass Forward Operating Base",
            "alert_type": "SURGE_ANOMALY",
            "severity": "MEDIUM",
            "status": "ACTIVE",
            "description": "Consumption spike detected (+85% vs baseline) due to sector marksmanship exercises.",
            "recommended_action": "Rebalance buffer target to 250 boxes and review tactical reserve allocations.",
            "trigger_condition": "consumption_surge > 1.5x",
            "metric_value": 7.4,
            "threshold_value": 4.0,
            "dedup_hash": "d4e5f6a1b2c304",
        },
        {
            "alert_id": "ALT-2026-ENG-05",
            "item_id": "SKU-ENG-GEN-21",
            "item_name": "Tactical Silent Diesel Generator 5kW",
            "location_id": "DEPOT-NYM-09",
            "location_name": "Nyoma Advanced Landing Ground",
            "alert_type": "REORDER_TRIGGER",
            "severity": "MEDIUM",
            "status": "RESOLVED",
            "description": "Inventory dipped to 12 units below reorder point of 18 units.",
            "recommended_action": "Reorder 10 generator units from Chandigarh base depot.",
            "trigger_condition": "current_stock <= reorder_level",
            "metric_value": 12.0,
            "threshold_value": 18.0,
            "dedup_hash": "e5f6a1b2c3d405",
            "resolved_at": datetime.utcnow() - timedelta(days=1),
            "resolved_by": "Lt. Col. V. Nair",
            "resolution_notes": "Stock replenished via C-130 airbridge flight to Nyoma ALG.",
        },
    ]

    for alt in canonical_alerts:
        existing_alt = db.scalar(
            select(PredictiveAlertModel).where(PredictiveAlertModel.alert_id == alt["alert_id"])
        )
        if not existing_alt:
            alt_obj = PredictiveAlertModel(**alt)
            db.add(alt_obj)
            counts["alerts"] += 1

    db.flush()

    # 7. Seed Simulation Scenarios, Runs & Recommendations
    canonical_scenarios = [
        {
            "scenario_id": "SCN-ZOJILA-BLIZZARD",
            "scenario_name": "Severe Winter Blizzard & Zoji La Pass Closure",
            "description": "10-day severe blizzard event shutting down Highway NH-1D with -25°C temperatures across Drass and Kargil sectors.",
            "disruption_type": "WEATHER_BLIZZARD",
            "severity": "CRITICAL",
            "duration_days": 10,
            "affected_nodes_json": json.dumps(["DEPOT-DRA-03", "DEPOT-KGL-02", "DEPOT-SNM-08"]),
            "parameters_json": json.dumps({
                "road_closure": True,
                "temperature_drop_celsius": 15.0,
                "consumption_surge_ratio": 1.45,
                "lead_time_delay_days": 8,
            }),
            "run": {
                "run_id": "RUN-ZOJILA-2026-01",
                "resilience_score": 68.4,
                "stockout_events_count": 2,
                "cost_impact_inr": 485000.0,
                "delivery_delay_hours": 192.0,
                "baseline_metrics_json": json.dumps({"service_level": 98.5, "stockout_risk": 2.1}),
                "simulated_metrics_json": json.dumps({"service_level": 79.2, "stockout_risk": 24.8}),
                "recommendations": [
                    {
                        "recommendation_id": "REC-ZJ-01",
                        "title": "Pre-position 30,000L Winter Diesel at Drass FOB",
                        "recommendation_type": "PRE_POSITION_STOCK",
                        "priority": "CRITICAL",
                        "action_payload_json": json.dumps({"item_id": "SKU-POL-DSL-01", "quantity": 30000, "target_node": "DEPOT-DRA-03"}),
                        "estimated_resilience_boost": 16.5,
                    },
                    {
                        "recommendation_id": "REC-ZJ-02",
                        "title": "Activate Nyoma-Leh Aerial Resupply Corridor",
                        "recommendation_type": "REROUTE_AERIAL",
                        "priority": "HIGH",
                        "action_payload_json": json.dumps({"mode": "IL-76_C130", "flight_frequency": "DAILY"}),
                        "estimated_resilience_boost": 9.2,
                    },
                ],
            },
        },
        {
            "scenario_id": "SCN-SIACHEN-SURGE",
            "scenario_name": "Siachen Sector Formation Mobilization Surge",
            "description": "Simulates a 40% sudden increase in troop deployment requiring accelerated combat rations, ECWCS gear, and kerosene delivery.",
            "disruption_type": "DEMAND_SURGE",
            "severity": "HIGH",
            "duration_days": 14,
            "affected_nodes_json": json.dumps(["DEPOT-SIA-04", "DEPOT-DIS-10"]),
            "parameters_json": json.dumps({
                "troop_surge_percentage": 40.0,
                "rations_multiplier": 1.40,
                "fuel_multiplier": 1.35,
            }),
            "run": {
                "run_id": "RUN-SIACHEN-2026-01",
                "resilience_score": 81.2,
                "stockout_events_count": 0,
                "cost_impact_inr": 310000.0,
                "delivery_delay_hours": 24.0,
                "baseline_metrics_json": json.dumps({"service_level": 99.0, "stockout_risk": 1.0}),
                "simulated_metrics_json": json.dumps({"service_level": 91.5, "stockout_risk": 8.5}),
                "recommendations": [
                    {
                        "recommendation_id": "REC-SIA-01",
                        "title": "Dispatch High-Altitude MRE Convoy from Leh Hub",
                        "recommendation_type": "FORWARD_DISPATCH",
                        "priority": "HIGH",
                        "action_payload_json": json.dumps({"item_id": "SKU-RAT-MRE-05", "quantity": 6000}),
                        "estimated_resilience_boost": 11.0,
                    },
                ],
            },
        },
    ]

    for scn in canonical_scenarios:
        existing_scn = db.scalar(
            select(SimulationScenarioModel).where(SimulationScenarioModel.scenario_id == scn["scenario_id"])
        )
        if not existing_scn:
            scn_obj = SimulationScenarioModel(
                scenario_id=scn["scenario_id"],
                scenario_name=scn["scenario_name"],
                description=scn["description"],
                disruption_type=scn["disruption_type"],
                severity=scn["severity"],
                duration_days=scn["duration_days"],
                affected_nodes_json=scn["affected_nodes_json"],
                parameters_json=scn["parameters_json"],
            )
            db.add(scn_obj)
            db.flush()
            counts["scenarios"] += 1

            run_info = scn["run"]
            run_obj = SimulationRunModel(
                run_id=run_info["run_id"],
                scenario_id=scn["scenario_id"],
                status="COMPLETED",
                resilience_score=run_info["resilience_score"],
                stockout_events_count=run_info["stockout_events_count"],
                cost_impact_inr=run_info["cost_impact_inr"],
                delivery_delay_hours=run_info["delivery_delay_hours"],
                baseline_metrics_json=run_info["baseline_metrics_json"],
                simulated_metrics_json=run_info["simulated_metrics_json"],
                completed_at=datetime.utcnow(),
            )
            db.add(run_obj)
            db.flush()
            counts["simulation_runs"] += 1

            for rec in run_info["recommendations"]:
                rec_obj = SimulationRecommendationModel(
                    recommendation_id=rec["recommendation_id"],
                    run_id=run_info["run_id"],
                    title=rec["title"],
                    recommendation_type=rec["recommendation_type"],
                    priority=rec["priority"],
                    action_payload_json=rec["action_payload_json"],
                    estimated_resilience_boost=rec["estimated_resilience_boost"],
                    status="PENDING",
                )
                db.add(rec_obj)
                counts["simulation_recommendations"] += 1

    db.flush()

    # 8. Seed Supply Requisitions
    canonical_requisitions = [
        {
            "requisition_id": "REQ-2026-0891",
            "requesting_unit": "14 Corps / 8 Mountain Division Forward HQ",
            "origin_depot_id": "DEPOT-LEH-01",
            "destination_node_id": "DEPOT-KGL-02",
            "priority": "URGENT",
            "status": "DISPATCHED",
            "total_weight_kg": 14200.0,
            "total_volume_m3": 18.5,
            "estimated_cost_inr": 850000.0,
            "notes": "Urgent kerosene and combat rations convoy dispatched via NH-1.",
            "required_by_date": "2026-10-08",
            "dispatched_at": datetime.utcnow() - timedelta(days=1),
            "items": [
                {
                    "item_id": "SKU-POL-KRS-02",
                    "item_name": "High-Altitude Kerosene SKO",
                    "quantity_requested": 10000.0,
                    "quantity_fulfilled": 10000.0,
                    "unit_of_measurement": "Liters",
                    "unit_cost_inr": 65.0,
                },
                {
                    "item_id": "SKU-RAT-MRE-05",
                    "item_name": "High-Altitude 24hr Combat Rations (MRE)",
                    "quantity_requested": 1500.0,
                    "quantity_fulfilled": 1500.0,
                    "unit_of_measurement": "Packs",
                    "unit_cost_inr": 200.0,
                },
            ],
        },
        {
            "requisition_id": "REQ-2026-0892",
            "requesting_unit": "121 Infantry Brigade Drass",
            "origin_depot_id": "DEPOT-SRN-05",
            "destination_node_id": "DEPOT-DRA-03",
            "priority": "EMERGENCY",
            "status": "IN_TRANSIT",
            "total_weight_kg": 22000.0,
            "total_volume_m3": 30.0,
            "estimated_cost_inr": 1450000.0,
            "notes": "Emergency winter ECWCS and ammunition resupply convoy navigating Zoji La pass.",
            "required_by_date": "2026-10-06",
            "dispatched_at": datetime.utcnow() - timedelta(hours=14),
            "items": [
                {
                    "item_id": "SKU-CLO-ECW-10",
                    "item_name": "Extreme Cold Weather Clothing (ECWCS)",
                    "quantity_requested": 500.0,
                    "quantity_fulfilled": 500.0,
                    "unit_of_measurement": "Sets",
                    "unit_cost_inr": 1800.0,
                },
                {
                    "item_id": "SKU-ORD-81M-04",
                    "item_name": "81mm Mortar High-Explosive Shells",
                    "quantity_requested": 100.0,
                    "quantity_fulfilled": 100.0,
                    "unit_of_measurement": "Crates",
                    "unit_cost_inr": 5500.0,
                },
            ],
        },
    ]

    for req in canonical_requisitions:
        existing_req = db.scalar(
            select(SupplyRequisitionModel).where(SupplyRequisitionModel.requisition_id == req["requisition_id"])
        )
        if not existing_req:
            req_obj = SupplyRequisitionModel(
                requisition_id=req["requisition_id"],
                requesting_unit=req["requesting_unit"],
                origin_depot_id=req["origin_depot_id"],
                destination_node_id=req["destination_node_id"],
                priority=req["priority"],
                status=req["status"],
                total_weight_kg=req["total_weight_kg"],
                total_volume_m3=req["total_volume_m3"],
                estimated_cost_inr=req["estimated_cost_inr"],
                notes=req.get("notes"),
                required_by_date=req["required_by_date"],
                dispatched_at=req.get("dispatched_at"),
            )
            db.add(req_obj)
            db.flush()
            counts["requisitions"] += 1

            for item in req["items"]:
                item_obj = RequisitionItemModel(
                    requisition_id=req["requisition_id"],
                    item_id=item["item_id"],
                    item_name=item["item_name"],
                    quantity_requested=item["quantity_requested"],
                    quantity_fulfilled=item["quantity_fulfilled"],
                    unit_of_measurement=item["unit_of_measurement"],
                    unit_cost_inr=item["unit_cost_inr"],
                )
                db.add(item_obj)
                counts["requisition_items"] += 1

    db.commit()
    return counts


if __name__ == "__main__":
    print("[INIT] Creating database tables...")
    init_db()
    with SessionLocal() as session:
        print("[SEED] Seeding database with canonical records...")
        results = seed_database(session)
        print(f"[SUCCESS] Database seeded successfully: {results}")
