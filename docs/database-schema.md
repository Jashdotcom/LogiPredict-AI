# LogiPredict AI — Relational Database Schema Specification

## 1. Schema Design Philosophy

The LogiPredict AI database schema is designed to model multi-echelon forward supply chains for defense logistics. It balances high relational integrity (ACID compliance, strict foreign key cascading, check constraints) with high-throughput time-series forecasting records and event logs.

- **Primary Target Database**: PostgreSQL 15+
- **Local Development Compatibility**: SQLite 3.35+
- **ORM Compatibility**: SQLAlchemy 2.0+ / Pydantic v2 serialization

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    SUPPLY_LOCATION ||--o{ INVENTORY_ITEM : "stores"
    SUPPLY_LOCATION ||--o{ SUPPLY_ROUTE : "originates"
    SUPPLY_LOCATION ||--o{ SUPPLY_ROUTE : "terminates"
    SUPPLY_LOCATION ||--o{ SUPPLY_REQUISITION : "requests/supplies"
    SUPPLY_LOCATION ||--o{ DEMAND_FORECAST : "forecasted_at"
    
    INVENTORY_ITEM ||--o{ INVENTORY_TRANSACTION : "records"
    INVENTORY_ITEM ||--o{ DEMAND_FORECAST : "forecasts"
    INVENTORY_ITEM ||--o{ ALERT : "triggers"
    INVENTORY_ITEM ||--o{ REQUISITION_ITEM : "contains"
    
    SUPPLY_ROUTE ||--o{ ALERT : "triggers"
    SUPPLY_REQUISITION ||--o{ REQUISITION_ITEM : "includes"
    
    SIMULATION ||--o{ SIMULATION_RESULT : "generates"
    SIMULATION_RESULT ||--o{ SIMULATED_STOCK_POINT : "projects"
    SIMULATION_RESULT ||--o{ STOCKOUT_EVENT : "flags"

    SUPPLY_LOCATION {
        int id PK
        string location_id UK "LOC-XXX-NN"
        string name
        string location_type
        float latitude
        float longitude
        float altitude_meters
        float total_capacity_mt
        float current_utilization_pct
        boolean is_active
        string contact_callsign
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_ITEM {
        int id PK
        string item_id UK "SKU-XXX-NN"
        string item_name
        string category
        float current_stock
        float min_threshold
        float max_capacity
        float reorder_level
        string unit_of_measurement
        string storage_location_id FK
        float consumption_rate_daily
        int lead_time_days
        boolean is_temperature_sensitive
        float target_temp_min
        float target_temp_max
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_TRANSACTION {
        int id PK
        string transaction_id UK "TXN-YYYY-NNNN"
        string item_id FK
        string location_id FK
        string transaction_type "inflow|outflow|transfer|adjustment"
        float quantity
        string unit_of_measurement
        float balance_after
        string reference_order_id
        string notes
        timestamp logged_at
    }

    SUPPLY_ROUTE {
        int id PK
        string route_id UK "RTE-XXX-NN"
        string route_name
        string origin_location_id FK
        string destination_location_id FK
        float distance_km
        float standard_transit_hours
        float current_estimated_transit_hours
        float max_vehicle_payload_tonnes
        string road_condition
        float risk_score
        boolean is_blocked
        json waypoints
        timestamp created_at
        timestamp updated_at
    }

    DEMAND_FORECAST {
        int id PK
        string forecast_id UK "FRC-YYYY-NNNN"
        string item_id FK
        string location_id FK
        int forecast_horizon_days
        string model_identifier
        float mape
        float rmse
        float r2_score
        float total_projected_demand
        boolean stockout_risk_projected
        json time_series_points
        timestamp generated_at
    }

    ALERT {
        int id PK
        string alert_id UK "ALT-NNNN"
        string alert_type
        string severity "info|warning|critical"
        string title
        text description
        string trigger_condition
        string item_id FK
        string location_id FK
        string route_id FK
        string predicted_impact
        string recommended_action
        string dedup_hash UK
        boolean is_acknowledged
        string acknowledged_by
        timestamp acknowledged_at
        boolean is_resolved
        string resolved_by
        timestamp resolved_at
        text resolution_notes
        timestamp created_at
        timestamp updated_at
    }

    SUPPLY_REQUISITION {
        int id PK
        string requisition_id UK "REQ-YYYY-NNNN"
        string origin_depot_id FK
        string destination_fob_id FK
        string priority "routine|priority|emergency"
        string status "draft|submitted|approved|in_transit|delivered"
        string assigned_convoy_id
        timestamp estimated_departure
        timestamp estimated_delivery
        timestamp actual_delivery
        text justification
        timestamp created_at
        timestamp updated_at
    }

    SIMULATION {
        int id PK
        string simulation_id UK "SIM-YYYY-NNN"
        string simulation_name
        text description
        int duration_days
        float demand_surge_pct
        int lead_time_dilation_days
        json disruption_config
        int random_seed
        string status "pending|running|completed|failed"
        float execution_time_seconds
        timestamp created_at
        timestamp completed_at
    }

    SIMULATION_RESULT {
        int id PK
        string simulation_id FK
        float overall_service_level_pct
        int total_stockout_incidents
        float total_unmet_demand_volume
        int total_replenishments_needed
        float avg_fleet_utilization_pct
        string bottleneck_route
        json item_trajectories
        json stockout_events
        json replenishment_recommendations
    }
```

---

## 3. Detailed Table Specifications & Constraints

### 3.1 `supply_locations` (Locations Master)
- **Primary Key**: `id` (SERIAL / INTEGER)
- **Unique Key**: `location_id` (`VARCHAR(32)`)
- **Indexes**: `CREATE INDEX idx_location_type ON supply_locations(location_type);`
- **Constraints**:
  - `CHECK (latitude BETWEEN -90.0 AND 90.0)`
  - `CHECK (longitude BETWEEN -180.0 AND 180.0)`
  - `CHECK (total_capacity_metric_tonnes > 0)`

### 3.2 `inventory_items` (SKU Master & Real-Time Stock)
- **Primary Key**: `id` (SERIAL / INTEGER)
- **Unique Key**: `item_id` (`VARCHAR(64)`)
- **Foreign Key**: `storage_location_id` REFERENCES `supply_locations(location_id)` ON DELETE RESTRICT
- **Indexes**:
  - `CREATE INDEX idx_item_location ON inventory_items(storage_location_id);`
  - `CREATE INDEX idx_item_category ON inventory_items(category);`
- **Constraints**:
  - `CHECK (current_stock >= 0)`
  - `CHECK (min_threshold >= 0)`
  - `CHECK (max_capacity > min_threshold)`

### 3.3 `inventory_transactions` (Audit Log & Ledger)
- **Primary Key**: `id` (SERIAL / INTEGER)
- **Unique Key**: `transaction_id` (`VARCHAR(64)`)
- **Foreign Keys**:
  - `item_id` REFERENCES `inventory_items(item_id)` ON DELETE RESTRICT
  - `location_id` REFERENCES `supply_locations(location_id)` ON DELETE RESTRICT
- **Indexes**:
  - `CREATE INDEX idx_txn_item_time ON inventory_transactions(item_id, logged_at DESC);`
  - `CREATE INDEX idx_txn_location ON inventory_transactions(location_id);`

### 3.4 `supply_routes` (Transit Corridors & Road Telematics)
- **Primary Key**: `id` (SERIAL / INTEGER)
- **Unique Key**: `route_id` (`VARCHAR(32)`)
- **Foreign Keys**:
  - `origin_location_id` REFERENCES `supply_locations(location_id)` ON DELETE RESTRICT
  - `destination_location_id` REFERENCES `supply_locations(location_id)` ON DELETE RESTRICT
- **Indexes**:
  - `CREATE INDEX idx_route_endpoints ON supply_routes(origin_location_id, destination_location_id);`
  - `CREATE INDEX idx_route_risk ON supply_routes(risk_score);`

### 3.5 `demand_forecasts` (Time-Series AI Inference Runs)
- **Primary Key**: `id` (SERIAL / INTEGER)
- **Unique Key**: `forecast_id` (`VARCHAR(64)`)
- **Foreign Keys**:
  - `item_id` REFERENCES `inventory_items(item_id)` ON DELETE CASCADE
  - `location_id` REFERENCES `supply_locations(location_id)` ON DELETE CASCADE
- **Indexes**:
  - `CREATE INDEX idx_forecast_item_gen ON demand_forecasts(item_id, generated_at DESC);`

### 3.6 `alerts` (Rule-Based & Predictive Anomaly Table)
- **Primary Key**: `id` (SERIAL / INTEGER)
- **Unique Key**: `alert_id` (`VARCHAR(32)`)
- **Unique Constraint**: `dedup_hash` (`VARCHAR(64)`) UNIQUE (Active alert deduplication)
- **Foreign Keys**:
  - `item_id` REFERENCES `inventory_items(item_id)` ON DELETE SET NULL
  - `location_id` REFERENCES `supply_locations(location_id)` ON DELETE SET NULL
  - `route_id` REFERENCES `supply_routes(route_id)` ON DELETE SET NULL
- **Indexes**:
  - `CREATE INDEX idx_alert_severity_status ON alerts(severity, is_resolved, is_acknowledged);`
  - `CREATE INDEX idx_alert_created ON alerts(created_at DESC);`
