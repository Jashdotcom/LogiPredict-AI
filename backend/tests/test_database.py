"""
LogiPredict AI - Database Integration & ORM Models Test Suite
=============================================================
Phase 10.1: SQLite Database Engine, Models, Seeding, and Inventory REST API Tests
Indian Army Forward Supply Chain (SIH 2026)
"""

import unittest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import inspect, create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.base import Base
from app.database.session import engine, SessionLocal, get_db
from app.database.seed import init_db, seed_database
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


class TestDatabaseIntegration(unittest.TestCase):
    """
    Comprehensive test suite verifying database schema creation, model relationships,
    idempotent data seeding, and database-backed inventory REST endpoints.
    """

    @classmethod
    def setUpClass(cls):
        """Initialize database schema and seed baseline data once for class."""
        init_db()
        cls.db = SessionLocal()
        cls.seed_counts = seed_database(cls.db, force_reset=False)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        """Clean up database session."""
        cls.db.close()

    def setUp(self):
        """Ensure clean state per test."""
        self.db.rollback()

    # ==========================================================================
    # 1. SCHEMA & TABLE INTEGRITY TESTS
    # ==========================================================================

    def test_all_relational_tables_exist(self):
        """Verify that all 11 core domain tables are registered and created in SQLite."""
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        expected_tables = [
            "inventory_items",
            "inventory_transactions",
            "demand_history",
            "forecast_records",
            "predictive_alerts",
            "simulation_scenarios",
            "simulation_runs",
            "simulation_recommendations",
            "supply_requisitions",
            "requisition_items",
            "military_locations",
            "convoy_routes",
            "route_waypoints",
        ]

        for table in expected_tables:
            self.assertIn(table, tables, f"Expected table '{table}' was not created in database.")

    def test_inventory_items_table_columns(self):
        """Verify column structure and types of inventory_items table."""
        inspector = inspect(engine)
        columns = {col["name"]: col for col in inspector.get_columns("inventory_items")}

        self.assertIn("id", columns)
        self.assertIn("item_id", columns)
        self.assertIn("item_name", columns)
        self.assertIn("category", columns)
        self.assertIn("current_stock", columns)
        self.assertIn("min_threshold", columns)
        self.assertIn("max_capacity", columns)
        self.assertIn("reorder_level", columns)
        self.assertIn("unit_of_measurement", columns)
        self.assertIn("storage_location_id", columns)
        self.assertIn("consumption_rate_daily", columns)
        self.assertIn("lead_time_days", columns)
        self.assertIn("is_temperature_sensitive", columns)
        self.assertIn("created_at", columns)
        self.assertIn("updated_at", columns)

    # ==========================================================================
    # 2. SEEDING & IDEMPOTENCY TESTS
    # ==========================================================================

    def test_database_seeder_populated_records(self):
        """Verify that seeder successfully populated all required entity domains."""
        self.assertGreaterEqual(self.seed_counts.get("locations", 0) + self.db.query(MilitaryLocationModel).count(), 10)
        self.assertGreaterEqual(self.seed_counts.get("routes", 0) + self.db.query(ConvoyRouteModel).count(), 4)
        self.assertGreaterEqual(self.seed_counts.get("waypoints", 0) + self.db.query(RouteWaypointModel).count(), 15)
        self.assertGreaterEqual(self.seed_counts.get("inventory_items", 0) + self.db.query(InventoryItemModel).count(), 25)
        self.assertGreaterEqual(self.db.query(DemandHistoryModel).count(), 90)
        self.assertGreaterEqual(self.db.query(ForecastRecordModel).count(), 25)
        self.assertGreaterEqual(self.db.query(PredictiveAlertModel).count(), 5)
        self.assertGreaterEqual(self.db.query(SimulationScenarioModel).count(), 2)
        self.assertGreaterEqual(self.db.query(SimulationRunModel).count(), 2)
        self.assertGreaterEqual(self.db.query(SimulationRecommendationModel).count(), 3)
        self.assertGreaterEqual(self.db.query(SupplyRequisitionModel).count(), 2)

    def test_database_seeder_idempotency(self):
        """Verify that running seed_database repeatedly is completely idempotent."""
        # Run seeder a second time without force_reset
        second_counts = seed_database(self.db, force_reset=False)
        self.assertIsInstance(second_counts, dict)

        # Record counts in database must not duplicate
        total_items = self.db.query(InventoryItemModel).count()
        self.assertEqual(total_items, 25, "Inventory item count changed after second seed run.")

        total_locations = self.db.query(MilitaryLocationModel).count()
        self.assertEqual(total_locations, 10, "Location count changed after second seed run.")

    # ==========================================================================
    # 3. ORM COMPUTED PROPERTIES & CASCADE TESTS
    # ==========================================================================

    def test_inventory_model_computed_properties(self):
        """Verify stock health ratio, days of supply, and status properties."""
        item = InventoryItemModel(
            item_id="SKU-TEST-PROP-01",
            item_name="Test Ammunition Box",
            category="Ammunition & Ordnance",
            current_stock=50.0,
            min_threshold=30.0,
            max_capacity=100.0,
            reorder_level=60.0,
            unit_of_measurement="Boxes",
            storage_location_id="DEPOT-LEH-01",
            consumption_rate_daily=10.0,
            lead_time_days=3,
        )

        # Health ratio = 50 / 100 * 100 = 50.0%
        self.assertEqual(item.stock_health_ratio, 50.0)

        # Days of supply = 50 / 10 = 5.0 days
        self.assertEqual(item.days_of_supply_remaining, 5.0)

        # Status: 50 <= 60 (reorder_level) and 50 > 30 (min_threshold) -> Warning
        self.assertEqual(item.status, "Warning")

        # Critical condition
        item.current_stock = 20.0
        self.assertEqual(item.status, "Critical")

        # Optimal condition
        item.current_stock = 85.0
        self.assertEqual(item.status, "Optimal")

        # Overstock condition
        item.current_stock = 120.0
        self.assertEqual(item.status, "Overstock")

    def test_convoy_route_waypoint_cascade_delete(self):
        """Verify that deleting a convoy route cascades delete to all child waypoints."""
        # Create temporary route with waypoints
        route = ConvoyRouteModel(
            route_id="ROUTE-TEST-CASCADE-01",
            route_name="Test Cascade Transit Corridor",
            origin_id="DEPOT-LEH-01",
            destination_id="DEPOT-KGL-02",
            distance_km=150.0,
            estimated_duration_hours=4.5,
            status="ACTIVE",
            risk_level="LOW",
        )
        wp1 = RouteWaypointModel(
            route_id="ROUTE-TEST-CASCADE-01",
            sequence_order=1,
            waypoint_name="Test WP 1",
            latitude=34.2,
            longitude=77.1,
            altitude_meters=3000.0,
        )
        wp2 = RouteWaypointModel(
            route_id="ROUTE-TEST-CASCADE-01",
            sequence_order=2,
            waypoint_name="Test WP 2",
            latitude=34.3,
            longitude=76.8,
            altitude_meters=3500.0,
        )
        self.db.add(route)
        self.db.add(wp1)
        self.db.add(wp2)
        self.db.commit()

        # Verify insertion
        self.assertEqual(self.db.query(RouteWaypointModel).filter_by(route_id="ROUTE-TEST-CASCADE-01").count(), 2)

        # Delete route
        self.db.delete(route)
        self.db.commit()

        # Verify cascade
        self.assertEqual(self.db.query(RouteWaypointModel).filter_by(route_id="ROUTE-TEST-CASCADE-01").count(), 0)

    def test_inventory_item_transaction_cascade_delete(self):
        """Verify that deleting an inventory SKU cascades delete to its transaction history."""
        item = InventoryItemModel(
            item_id="SKU-TEST-CASCADE-TXN",
            item_name="Cascade Test Item",
            category="General Stores",
            current_stock=100.0,
            min_threshold=20.0,
            max_capacity=200.0,
            reorder_level=40.0,
            unit_of_measurement="Packs",
            storage_location_id="DEPOT-LEH-01",
            consumption_rate_daily=5.0,
            lead_time_days=2,
        )
        self.db.add(item)
        self.db.commit()

        txn = InventoryTransactionModel(
            transaction_id="TXN-TEST-CASCADE-01",
            item_id="SKU-TEST-CASCADE-TXN",
            location_id="DEPOT-LEH-01",
            transaction_type="inflow",
            quantity=100.0,
            unit_of_measurement="Packs",
            balance_after=100.0,
            notes="Cascade test transaction",
        )
        self.db.add(txn)
        self.db.commit()

        self.assertEqual(self.db.query(InventoryTransactionModel).filter_by(item_id="SKU-TEST-CASCADE-TXN").count(), 1)

        # Delete item
        self.db.delete(item)
        self.db.commit()

        self.assertEqual(self.db.query(InventoryTransactionModel).filter_by(item_id="SKU-TEST-CASCADE-TXN").count(), 0)

    # ==========================================================================
    # 4. INVENTORY REST API ENDPOINT INTEGRATION TESTS
    # ==========================================================================

    def test_get_inventory_endpoint(self):
        """Test GET /api/v1/inventory returns full list of inventory items."""
        response = self.client.get("/api/v1/inventory")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        items = data["data"]
        self.assertIsInstance(items, list)
        self.assertGreaterEqual(len(items), 25)

        # Verify dual camelCase / snake_case and computed property attributes
        sample = items[0]
        self.assertIn("item_id", sample)
        self.assertIn("item_name", sample)
        self.assertIn("category", sample)
        self.assertIn("current_stock", sample)
        self.assertIn("min_threshold", sample)
        self.assertIn("minimum_stock", sample)
        self.assertIn("max_capacity", sample)
        self.assertIn("maximum_capacity", sample)
        self.assertIn("reorder_level", sample)
        self.assertIn("stock_health_ratio", sample)
        self.assertIn("days_of_supply_remaining", sample)
        self.assertIn("status", sample)

    def test_get_inventory_with_filters(self):
        """Test filtering inventory by category, search query, depot, and status."""
        # Category filter
        resp_cat = self.client.get("/api/v1/inventory?category=POL")
        self.assertEqual(resp_cat.status_code, 200)
        items_cat = resp_cat.json()["data"]
        self.assertTrue(all("POL" in i["category"] for i in items_cat))

        # Search filter
        resp_search = self.client.get("/api/v1/inventory?search=Diesel")
        self.assertEqual(resp_search.status_code, 200)
        items_search = resp_search.json()["data"]
        self.assertTrue(any("Diesel" in i["item_name"] for i in items_search))

        # Status filter
        resp_status = self.client.get("/api/v1/inventory?status=optimal")
        self.assertEqual(resp_status.status_code, 200)
        items_status = resp_status.json()["data"]
        self.assertTrue(all(i["status"] in ("Optimal", "Healthy") for i in items_status))

    def test_get_inventory_item_by_id(self):
        """Test GET /api/v1/inventory/{item_id} retrieves accurate single item."""
        response = self.client.get("/api/v1/inventory/SKU-POL-DSL-01")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        item = data["data"]
        self.assertEqual(item["item_id"], "SKU-POL-DSL-01")
        self.assertIn("Diesel", item["item_name"])

    def test_get_inventory_item_not_found(self):
        """Test GET /api/v1/inventory/{item_id} returns 404 for invalid SKU."""
        response = self.client.get("/api/v1/inventory/SKU-NON-EXISTENT-999")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertFalse(data["success"])
        self.assertEqual(data["error"]["code"], "RESOURCE_NOT_FOUND")

    def test_create_and_delete_inventory_item(self):
        """Test POST and DELETE /api/v1/inventory creates and deletes an item."""
        payload = {
            "item_id": "SKU-TEST-NEW-01",
            "item_name": "High-Calorie Field Ration MRE (Special Forces)",
            "category": "Rations & Subsistence",
            "current_stock": 500.0,
            "min_threshold": 100.0,
            "max_capacity": 1000.0,
            "reorder_level": 250.0,
            "unit_of_measurement": "Packs",
            "storage_location_id": "DEPOT-DRA-03",
            "storage_location_name": "Drass Forward Operating Base",
            "consumption_rate_daily": 25.0,
            "lead_time_days": 4,
            "is_temperature_sensitive": False,
        }

        # Create
        create_resp = self.client.post("/api/v1/inventory", json=payload)
        self.assertEqual(create_resp.status_code, 201)
        created_data = create_resp.json()["data"]
        self.assertEqual(created_data["item_id"], "SKU-TEST-NEW-01")

        # Duplicate conflict test (409)
        dup_resp = self.client.post("/api/v1/inventory", json=payload)
        self.assertEqual(dup_resp.status_code, 409)

        # Delete
        del_resp = self.client.delete("/api/v1/inventory/SKU-TEST-NEW-01")
        self.assertEqual(del_resp.status_code, 200)
        self.assertEqual(del_resp.json()["data"]["deleted_item_id"], "SKU-TEST-NEW-01")

        # Verify deletion
        get_resp = self.client.get("/api/v1/inventory/SKU-TEST-NEW-01")
        self.assertEqual(get_resp.status_code, 404)

    def test_update_inventory_item(self):
        """Test PATCH /api/v1/inventory/{item_id} partially updates SKU fields."""
        update_payload = {
            "item_name": "Winter-Grade Diesel ATF-800 Premium Anti-Freeze",
            "min_threshold": 35000.0,
        }
        patch_resp = self.client.patch("/api/v1/inventory/SKU-POL-DSL-01", json=update_payload)
        self.assertEqual(patch_resp.status_code, 200)
        updated_data = patch_resp.json()["data"]
        self.assertEqual(updated_data["item_name"], "Winter-Grade Diesel ATF-800 Premium Anti-Freeze")
        self.assertEqual(updated_data["min_threshold"], 35000.0)

    def test_adjust_stock_quantity_endpoint(self):
        """Test PATCH /api/v1/inventory/{item_id}/stock adjusts stock and logs audit transaction."""
        adj_payload = {
            "current_stock": 75000.0,
            "reason": "Emergency Reserve Dispatch to Forward Post",
        }
        resp = self.client.patch("/api/v1/inventory/SKU-POL-DSL-01/stock", json=adj_payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertEqual(data["current_stock"], 75000.0)

        # Verify transaction log was created
        txn_resp = self.client.get("/api/v1/inventory/transactions?item_id=SKU-POL-DSL-01")
        self.assertEqual(txn_resp.status_code, 200)
        txns = txn_resp.json()["data"]
        self.assertGreaterEqual(len(txns), 1)
        latest_txn = txns[0]
        self.assertEqual(latest_txn["item_id"], "SKU-POL-DSL-01")
        self.assertIn("Emergency Reserve Dispatch", latest_txn["notes"])

    def test_create_inventory_transaction_endpoint(self):
        """Test POST /api/v1/inventory/transactions records inflow and updates stock."""
        item_before = self.client.get("/api/v1/inventory/SKU-ORD-556-03").json()["data"]
        stock_before = item_before["current_stock"]

        txn_payload = {
            "transaction_id": "TXN-TEST-ORD-INFLOW-01",
            "item_id": "SKU-ORD-556-03",
            "location_id": "DEPOT-KGL-02",
            "transaction_type": "inflow",
            "quantity": 150.0,
            "unit_of_measurement": "Tins",
            "reference_order_id": "CONVOY-NORTH-402",
            "notes": "Reinforcement ammunition resupply",
        }

        post_resp = self.client.post("/api/v1/inventory/transactions", json=txn_payload)
        self.assertEqual(post_resp.status_code, 201)
        txn_data = post_resp.json()["data"]
        self.assertEqual(txn_data["balance_after"], stock_before + 150.0)

        # Verify item stock updated
        item_after = self.client.get("/api/v1/inventory/SKU-ORD-556-03").json()["data"]
        self.assertEqual(item_after["current_stock"], stock_before + 150.0)

    def test_inventory_summary_and_categories_endpoints(self):
        """Test GET /api/v1/inventory/summary and /api/v1/inventory/categories."""
        summary_resp = self.client.get("/api/v1/inventory/summary")
        self.assertEqual(summary_resp.status_code, 200)
        summary_data = summary_resp.json()["data"]

        self.assertIn("overall_health_percentage", summary_data)
        self.assertIn("total_active_skus", summary_data)
        self.assertIn("critical_stockout_risks", summary_data)
        self.assertIn("pending_reorder_pos", summary_data)
        self.assertIn("categories_breakdown", summary_data)
        self.assertGreaterEqual(summary_data["total_active_skus"], 25)

        cat_resp = self.client.get("/api/v1/inventory/categories")
        self.assertEqual(cat_resp.status_code, 200)
        cat_data = cat_resp.json()["data"]
        self.assertIsInstance(cat_data, list)
        self.assertGreater(len(cat_data), 0)
        for cat in cat_data:
            self.assertIn("category", cat)
            self.assertIn("total_skus", cat)
            self.assertIn("optimal_count", cat)
            self.assertIn("warning_count", cat)
            self.assertIn("critical_count", cat)
            self.assertIn("average_health_percentage", cat)


if __name__ == "__main__":
    unittest.main()
