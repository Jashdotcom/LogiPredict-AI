# LogiPredict AI — System Architecture Specification

## 1. Executive Overview

**LogiPredict AI** is an AI-powered predictive logistics, forward supply chain optimization, and multi-echelon inventory management platform developed for the **Indian Army** (Smart India Hackathon 2026).

The platform delivers proactive situational awareness, neural demand forecasting, GIS-driven convoy route risk assessment, automated replenishment requisitioning, and discrete-event stress-test simulations across rugged, high-altitude operational sectors (e.g. Northern Command, Ladakh, Kargil, Siachen).

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (React 19 + Tailwind CSS v4)"]
        UI["Command Center Dashboard\n(Overview, Inventory, Forecasting,\nGIS Routes, Supplies, Alerts, Simulation)"]
        State["React Client State\n& Custom Hooks"]
        ApiClient["Centralized API Client\n(src/services/apiClient.js)"]
        UI --> State --> ApiClient
    end

    subgraph ApiGateway["API Gateway & Service Layer (FastAPI 0.142+)"]
        Cors["CORS & Security Middleware"]
        Router["API Router (/api/v1)"]
        ErrHandler["Centralized Error Handlers\n(AppException, 422, 500)"]
        Cors --> Router --> ErrHandler
    end

    subgraph ServiceModules["Core Domain Services (app/services)"]
        InvSvc["Inventory Health Service"]
        FrcSvc["Forecasting Orchestrator"]
        GisSvc["GIS & Route Optimizer"]
        AlertSvc["Rule-Based Anomaly Engine"]
        SimSvc["Discrete-Event Simulation Engine"]
    end

    subgraph MlEngine["Predictive ML Pipeline (app/ml)"]
        LSTM["Bidirectional LSTM"]
        ProphetModel["Prophet (Seasonality)"]
        XGB["XGBoost Regressor"]
        Ensemble["Weighted Ensemble Engine\n(MAPE < 4.0%)"]
        LSTM & ProphetModel & XGB --> Ensemble
    end

    subgraph PersistenceLayer["Persistence Tier (PostgreSQL / SQLite)"]
        DB[(Relational Database\nORM Entities)]
        SyntheticCatalog[(Shared Synthetic Catalog\nJSON Ground Truth)]
    end

    ApiClient -- "HTTPS / JSON REST (Port 8000)" --> Cors
    Router --> ServiceModules
    FrcSvc <--> MlEngine
    ServiceModules <--> DB
    ServiceModules <--> SyntheticCatalog
```

---

## 2. Architectural Principles & Layer Boundaries

| Layer | Technology | Primary Responsibilities | Boundaries & Isolation |
|---|---|---|---|
| **Presentation Tier** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Leaflet | UI rendering, responsive layouts, data visualization, client-side route navigation. | Purely decoupled from backend. Communicates exclusively via `apiClient.js` using JSON envelopes. |
| **API Gateway Tier** | FastAPI, Uvicorn, Pydantic v2 | Routing, schema validation, HTTP status mapping, CORS filtering, standardized error envelopes. | Enforces strict contract validation before passing sanitized payloads to service layer. |
| **Domain Services Tier** | Python 3.11+, Scikit-Learn | Business logic: safety buffer computations, replenishment logic, alert deduplication, convoy payload calculations. | Free from direct HTTP or UI dependencies; reusable by background cron workers and simulation workers. |
| **Predictive ML Tier** | NumPy, Pandas, Scikit-learn, Time-Series Ensembles | Feature transformers, historical demand smoothing, multi-horizon inference, weather/altitude adjustments. | Stateless inference pipelines receiving clean feature matrices and returning confidence intervals. |
| **Persistence Tier** | PostgreSQL (Production) / SQLite (Local Dev) | Relational integrity, foreign key constraints, indexing on location/item/time axes. | Schema designed to support atomic transactions, audit logs, and deterministic simulations. |

---

## 3. Data Flow Architecture

The following sequence outlines how an automated inventory health check, neural forecast generation, and anomaly alert dispatch flow through the system:

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Command Center
    participant API as FastAPI Router (/api/v1)
    participant InvService as Inventory Service
    participant ML as ML Inference Engine
    participant AlertEngine as Alert Anomaly Engine
    participant DB as Relational Database

    UI->>API: GET /api/v1/inventory/health-summary
    API->>InvService: calculate_stock_health()
    InvService->>DB: Query on-hand stocks vs safety thresholds
    DB-->>InvService: Return SKU levels & consumption rates
    InvService->>ML: evaluate_stockout_risk(item_ids, horizon=14d)
    ML-->>InvService: Predicted trajectories & confidence intervals
    InvService->>AlertEngine: evaluate_anomaly_rules(stock, forecast)
    AlertEngine->>DB: Check for existing active unacknowledged alerts (dedup_hash)
    alt New Anomaly Detected
        AlertEngine->>DB: Persist new Alert record (Severity: Critical)
    end
    AlertEngine-->>InvService: Active alerts summary
    InvService-->>API: StockHealthSummary payload
    API-->>UI: ApiResponse<StockHealthSummary> (JSON)
    UI->>UI: Render KPIs, Charts, and Priority Alert Banners
```

---

## 4. Security, Authentication & Deployment Strategy

1. **Environment Configuration**:
   - Frontend reads `VITE_API_BASE_URL` (defaulting to `http://localhost:8000/api/v1`).
   - Backend reads `.env` via `app.config.py` for `DATABASE_URL`, `SECRET_KEY`, and `ALLOWED_ORIGINS`.
2. **Authentication Roadmap**:
   - Bearer JWT token in `Authorization: Bearer <token>` HTTP header.
   - Role-Based Access Control (RBAC):
     - `COMMAND_OFFICER`: Full access to requisitions, forecasts, convoy rerouting, and simulation dispatch.
     - `DEPOT_OPERATOR`: Stock count updates, dispatch vouchers, receipt acknowledgments.
     - `VIEWER_ANALYST`: Read-only telemetry, reports, and analytics.
3. **CORS Security**:
   - Strict origin allowlist configured for trusted dashboard origins (`http://localhost:5173`, `http://127.0.0.1:5173`).
4. **Resilience & Fault Tolerance**:
   - Standard 15-second request timeouts with explicit `AbortController` in frontend.
   - Graceful degradation: offline dashboard fallbacks preserve user workflows if network connection is lost.
