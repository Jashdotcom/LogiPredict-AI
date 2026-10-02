# LogiPredict AI — Backend Architecture

FastAPI backend service for **LogiPredict AI**, an AI-powered predictive logistics and forward supply chain management system for the Indian Army (SIH 2026).

---

## 1. Directory Structure

```
backend/
├── app/
│   ├── __init__.py           # Application package
│   ├── main.py               # FastAPI entry point, middleware & router mounting
│   ├── config.py             # Centralized environment & settings configuration
│   │
│   ├── api/                  # API endpoints and route definitions
│   │   ├── __init__.py
│   │   └── v1/               # Version 1 API
│   │       ├── __init__.py
│   │       └── router.py     # Master v1 router (/api/v1)
│   │
│   ├── models/               # Database ORM models and domain entities
│   │   └── __init__.py
│   │
│   ├── schemas/              # Pydantic request/response validation schemas
│   │   └── __init__.py
│   │
│   ├── services/             # Core business logic decoupled from API routes
│   │   └── __init__.py
│   │
│   ├── database/             # DB engine connection & session management
│   │   └── __init__.py
│   │
│   ├── ml/                   # ML inference pipelines & demand forecasting models
│   │   └── __init__.py
│   │
│   └── utils/                # Shared utilities & helper functions
│       └── __init__.py
│
├── .env.example              # Environment variable template
├── .gitignore                # Python & virtual environment ignore rules
├── README.md                 # Backend documentation
└── requirements.txt          # Python dependencies
```

---

## 2. Environment Setup & Activation

### Step 2.1: Navigate to the `backend` directory
```bash
cd backend
```

### Step 2.2: Create and Activate the Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 2.3: Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 3. Starting the Server

Run Uvicorn with hot-reloading from the `backend/` directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 4. API Endpoints & Verification

| Endpoint | Method | Response Model | Description |
|---|---|---|---|
| `/` | `GET` | `MessageResponse` | Root welcome message and status |
| `/health` | `GET` | `HealthCheckResponse` | Service health status and environment |
| `/api/v1/info` | `GET` | `JSON` | API v1 system metadata and module listing |
| `/docs` | `GET` | HTML (Swagger) | Interactive OpenAPI documentation |
| `/redoc` | `GET` | HTML (ReDoc) | Alternative ReDoc documentation |

---

## 5. Testing via cURL

### Root Endpoint
```bash
curl http://127.0.0.1:8000/
```
```json
{
  "message": "Welcome to LogiPredict AI API",
  "status": "online",
  "version": "0.1.0"
}
```

### Health Check Endpoint
```bash
curl http://127.0.0.1:8000/health
```
```json
{
  "status": "healthy",
  "service": "LogiPredict AI API",
  "version": "0.1.0",
  "environment": "development"
}
```

### API v1 System Info Endpoint
```bash
curl http://127.0.0.1:8000/api/v1/info
```
```json
{
  "api_version": "v1",
  "system": "LogiPredict AI — Indian Army Forward Supply Chain Engine",
  "edition": "SIH 2026",
  "engine_status": "standby",
  "modules": [
    "inventory_management",
    "demand_forecasting",
    "route_planning",
    "supply_requisitions",
    "predictive_alerts",
    "analytics_reports"
  ]
}
```
