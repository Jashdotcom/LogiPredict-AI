"""
LogiPredict AI - Backend FastAPI Application
=============================================
Step 0.3: Initial Backend API Setup
Provides root and health-check endpoints with CORS configured for the Vite frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="LogiPredict AI API",
    description="Predictive Logistics and Forward Supply Chain Management API for SIH 2026",
    version="0.1.0",
)

# Configure Allowed Origins for Cross-Origin Resource Sharing (CORS)
# Allows the React + Vite frontend to communicate with the FastAPI backend
ALLOWED_ORIGINS = [
    "http://localhost:5173",    # Vite dev server default
    "http://127.0.0.1:5173",    # Vite dev server IP variant
    "http://localhost:3000",    # Alternative React port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
async def root():
    """
    Root Endpoint
    Returns a simple welcome message and API metadata.
    """
    return {
        "message": "Welcome to LogiPredict AI API",
        "status": "online",
        "version": "0.1.0",
        "docs_url": "/docs",
        "health_url": "/health",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health Check Endpoint
    Used to monitor API operational status and service connectivity.
    """
    return {
        "status": "healthy",
        "service": "LogiPredict AI Backend",
        "version": "0.1.0",
        "environment": "development",
    }


if __name__ == "__main__":
    import uvicorn

    # Run Uvicorn server directly when executing this file
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
