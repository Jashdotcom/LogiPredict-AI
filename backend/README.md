# LogiPredict AI — Backend API

FastAPI backend service for **LogiPredict AI**, an autonomous predictive logistics and forward supply chain management platform.

---

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py        # Package initializer
│   └── main.py            # FastAPI application with root & health endpoints
├── .gitignore             # Python-specific git ignore rules
├── README.md              # Backend setup and run instructions
└── requirements.txt       # Core Python dependencies
```

---

## 1. Virtual Environment Setup

From the project root:

```bash
cd backend
```

Create a virtual environment named `venv`:

```bash
python -m venv venv
```
*(On systems with multiple Python versions, you can also use `python3 -m venv venv` or `py -m venv venv`)*

---

## 2. Activation Instructions

### Windows (PowerShell)
```powershell
.\venv\Scripts\Activate.ps1
```
*Note: If script execution is restricted in PowerShell, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` first.*

### Windows (Command Prompt `cmd.exe`)
```cmd
venv\Scripts\activate.bat
```

### Windows (Git Bash)
```bash
source venv/Scripts/activate
```

### macOS / Linux
```bash
source venv/bin/activate
```

---

## 3. Install Dependencies

Once the virtual environment is activated:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Run the Backend API

Start the FastAPI application with Uvicorn and hot-reload enabled:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## 5. Verify API Endpoints

Once the server is running:

| Endpoint | Method | URL | Description |
|---|---|---|---|
| **Root** | `GET` | `http://127.0.0.1:8000/` | Welcome message & API metadata |
| **Health Check** | `GET` | `http://127.0.0.1:8000/health` | Service status (`{"status": "healthy"}`) |
| **Interactive Docs (Swagger)** | `GET` | `http://127.0.0.1:8000/docs` | Interactive OpenAPI Swagger UI |
| **Alternative Docs (ReDoc)** | `GET` | `http://127.0.0.1:8000/redoc` | ReDoc API documentation |

---

## 6. Testing Endpoints via cURL or Browser

### Test Root Endpoint:
```bash
curl http://127.0.0.1:8000/
```
Expected Response:
```json
{
  "message": "Welcome to LogiPredict AI API",
  "status": "online",
  "version": "0.1.0",
  "docs_url": "/docs",
  "health_url": "/health"
}
```

### Test Health Endpoint:
```bash
curl http://127.0.0.1:8000/health
```
Expected Response:
```json
{
  "status": "healthy",
  "service": "LogiPredict AI Backend",
  "version": "0.1.0",
  "environment": "development"
}
```
