# LogiPredict AI — REST API Contracts & Endpoint Specifications

## 1. Global API Standards

- **Base URL**: `http://127.0.0.1:8000/api/v1`
- **Protocol**: HTTP/1.1 or HTTP/2 over TLS (HTTPS in production)
- **Data Exchange Format**: `application/json; charset=utf-8`
- **Versioning Strategy**: URI path versioning (`/api/v1/`)

---

## 2. Standard Envelope Specifications

### 2.1 Success Envelope (`ApiResponse[T]`)

Every 2xx response wraps payload data in a standard top-level JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-02T08:30:00Z",
    "page": 1,
    "page_size": 20,
    "total_items": 48
  }
}
```

### 2.2 Error Envelope (`ApiErrorResponse`)

Every 4xx and 5xx error response returns a uniform machine-readable error structure:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Inventory item SKU-POL-DSL-99 does not exist in depot LOC-DRS-04.",
    "details": {
      "item_id": "SKU-POL-DSL-99",
      "location_id": "LOC-DRS-04"
    }
  }
}
```

### 2.3 HTTP Status Code Mapping

| Status Code | Meaning | Standard Error Code (`error.code`) |
|---|---|---|
| `200 OK` | Request succeeded | *N/A (success: true)* |
| `201 Created` | Resource successfully created | *N/A (success: true)* |
| `400 Bad Request` | Malformed parameters or logic failure | `BAD_REQUEST` or `SIMULATION_EXECUTION_ERROR` |
| `401 Unauthorized` | Missing or expired authorization token | `UNAUTHORIZED` |
| `403 Forbidden` | Insufficient operational clearance | `FORBIDDEN` |
| `404 Not Found` | Target resource does not exist | `RESOURCE_NOT_FOUND` |
| `422 Unprocessable` | Pydantic schema validation failure | `VALIDATION_ERROR` |
| `429 Rate Limited` | Request quota exceeded | `RATE_LIMIT_EXCEEDED` |
| `500 Server Error` | Unexpected backend server fault | `INTERNAL_SERVER_ERROR` |
| `503 Unavailable` | External GIS/ML engine offline | `SERVICE_UNAVAILABLE` |

---

## 3. Core Module Endpoints

### 3.1 Inventory Management

#### `GET /api/v1/inventory`
- **Description**: List tracked SKUs with optional location and category filtering.
- **Query Parameters**:
  - `location_id` (string, optional): Filter by FOB/Depot ID (e.g. `LOC-LEH-03`).
  - `category` (string, optional): Filter by supply echelon category (e.g. `POL`, `Ordnance & Ammunition`).
  - `status` (string, optional): `Optimal`, `Warning`, `Critical`.
  - `page` (int, default: 1), `page_size` (int, default: 20).
- **Response**: `ApiResponse[List[InventoryItemResponse]]`

#### `GET /api/v1/inventory/{item_id}`
- **Description**: Fetch full inventory record, days of supply, and location details for a single SKU.
- **Response**: `ApiResponse[InventoryItemResponse]`

#### `GET /api/v1/inventory/health-summary`
- **Description**: Aggregated stock health percentage, critical stockout counts, and category breakdowns across all forward locations.
- **Response**: `ApiResponse[StockHealthSummary]`

#### `POST /api/v1/inventory/transactions`
- **Description**: Log an inflow, outflow, transfer, or physical audit adjustment.
- **Request Body**: `InventoryTransactionCreate`
- **Response**: `ApiResponse[InventoryTransactionResponse]` (Status: `201 Created`)

---

### 3.2 Predictive Demand Forecasting

#### `GET /api/v1/forecasting/item/{item_id}`
- **Description**: Retrieve active 14-day neural forecast trajectory and confidence bands for a specific SKU.
- **Query Parameters**:
  - `horizon_days` (int, default: 14, min: 1, max: 90)
- **Response**: `ApiResponse[DemandForecastResponse]`

#### `POST /api/v1/forecasting/predict`
- **Description**: Trigger on-demand inference run with custom horizon, weather modifiers, or operational surge flags.
- **Request Body**: `ForecastRequest`
- **Response**: `ApiResponse[List[DemandForecastResponse]]`

#### `GET /api/v1/forecasting/metrics`
- **Description**: Retrieve active model performance benchmarks (MAPE, RMSE, R², last retrained timestamp).
- **Response**: `ApiResponse[ModelEvaluationMetrics]`

---

### 3.3 GIS Route Planning & Convoy Telematics

#### `GET /api/v1/routes`
- **Description**: List forward supply route corridors, road conditions, risk scores, and block statuses.
- **Response**: `ApiResponse[List[SupplyRouteResponse]]`

#### `GET /api/v1/routes/locations`
- **Description**: List all supply locations (Base Depots, Forward Logistics Hubs, FOBs) with coordinates and altitudes.
- **Response**: `ApiResponse[List[SupplyLocationResponse]]`

#### `POST /api/v1/routes/optimize`
- **Description**: Calculate shortest, least-risk convoy transit path avoiding snow-bound passes or high-risk corridors.
- **Request Body**: `RouteOptimizationRequest`
- **Response**: `ApiResponse[RouteOptimizationResponse]`

---

### 3.4 Supply Requisitions & Purchase Orders

#### `GET /api/v1/supplies`
- **Description**: List supply requisitions with status filter (`draft`, `approved`, `in_transit`, `delivered`).
- **Response**: `ApiResponse[List[SupplyRequisitionResponse]]`

#### `POST /api/v1/supplies`
- **Description**: Draft and submit a forward supply requisition.
- **Request Body**: `SupplyRequisitionCreate`
- **Response**: `ApiResponse[SupplyRequisitionResponse]` (Status: `201 Created`)

#### `PATCH /api/v1/supplies/{requisition_id}/status`
- **Description**: Update requisition lifecycle status (e.g. approve, dispatch convoy, confirm delivery).
- **Request Body**: `SupplyRequisitionUpdate`
- **Response**: `ApiResponse[SupplyRequisitionResponse]`

---

### 3.5 Anomaly Alerts & Early Warnings

#### `GET /api/v1/alerts`
- **Description**: Query active and historical anomaly alerts.
- **Query Parameters**:
  - `severity` (string, optional): `info`, `warning`, `critical`.
  - `is_acknowledged` (boolean, optional).
  - `is_resolved` (boolean, optional).
- **Response**: `ApiResponse[List[AlertResponse]]`

#### `GET /api/v1/alerts/summary`
- **Description**: Count of critical/warning alerts and highest priority unresolved event.
- **Response**: `ApiResponse[AlertSummary]`

#### `POST /api/v1/alerts/{alert_id}/acknowledge`
- **Description**: Acknowledge receipt and operational ownership of an alert.
- **Request Body**: `{"acknowledged_by": "MAJOR-KUMAR"}`
- **Response**: `ApiResponse[AlertResponse]`

#### `POST /api/v1/alerts/{alert_id}/resolve`
- **Description**: Mark an alert resolved with action notes.
- **Request Body**: `{"resolution_notes": "15,000L bowser convoy arrived and fuel decanted."}`
- **Response**: `ApiResponse[AlertResponse]`

---

### 3.6 Logistics Simulation Engine

#### `POST /api/v1/simulation/run`
- **Description**: Execute a discrete-event logistics stress-test simulation with custom disruption scenarios.
- **Request Body**: `SimulationRequest`
- **Response**: `ApiResponse[SimulationResultResponse]`

#### `GET /api/v1/simulation/{simulation_id}`
- **Description**: Retrieve saved simulation trajectory results and recommendations.
- **Response**: `ApiResponse[SimulationResultResponse]`

---

### 3.7 Analytics & Executive Reporting

#### `GET /api/v1/analytics/kpis`
- **Description**: High-level executive KPI metrics for Command Center dashboard.
- **Response**: `ApiResponse[List[KpiMetric]]`

#### `GET /api/v1/analytics/dashboard`
- **Description**: Complete aggregated dashboard bundle (KPIs, recent activity feed, status).
- **Response**: `ApiResponse[DashboardSummaryResponse]`

#### `GET /api/v1/analytics/audit-report`
- **Description**: Generate readiness audit report for SIH 2026 inspection.
- **Response**: `ApiResponse[AuditReportResponse]`
