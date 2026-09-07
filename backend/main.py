"""
Main FastAPI application entry point.
AI-Based Dental Disease Detection System.

Architecture:
    - Lifespan context manager loads AI model and configures services at startup
    - Rate limiting via slowapi
    - CORS configured for frontend domain
    - All routes mounted under /api prefix
    - Global exception handlers for clean error responses
"""
import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config.settings import settings
from database.mongodb import connect_to_mongo, close_mongo_connection
from services.ai_service import load_model
from services.cloudinary_service import configure_cloudinary

# ─── Logging Setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ─── Lifespan (Startup / Shutdown) ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Startup: connect MongoDB, load AI model, configure Cloudinary.
    Shutdown: close database connections.
    """
    logger.info("=" * 60)
    logger.info("  🦷 Dental AI System — Starting Up")
    logger.info("=" * 60)

    # Connect to MongoDB
    await connect_to_mongo()

    # Load EfficientNet-B0 model (once, into memory)
    load_model()

    # Configure Cloudinary
    configure_cloudinary()

    logger.info("✅ All services initialized. Application ready.")
    logger.info("=" * 60)

    yield  # ← Application runs here

    # Shutdown
    logger.info("Shutting down Dental AI System...")
    await close_mongo_connection()
    logger.info("Goodbye. 👋")


# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_GENERAL])


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Dental Disease Detection API",
    description=(
        "Production-ready REST API for AI-powered dental disease detection using EfficientNet-B0. "
        "Supports patient registration, AI prediction with Grad-CAM visualization, "
        "doctor review workflow, appointment management, and PDF report generation."
    ),
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)


# ─── Global Exception Handlers ────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return user-friendly validation error messages."""
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Standardize HTTP error responses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all for unexpected errors (don't expose internals in production)."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    message = str(exc) if settings.DEBUG else "An internal server error occurred."
    return JSONResponse(
        status_code=500,
        content={"detail": message, "status_code": 500},
    )


# ─── Include Routers ──────────────────────────────────────────────────────────
from routes.auth import router as auth_router
from routes.prediction import router as prediction_router
from routes.patient import router as patient_router
from routes.doctor import router as doctor_router
from routes.admin import router as admin_router
from routes.appointment import router as appointment_router
from routes.reports import router as reports_router
from routes.contact import router as contact_router

app.include_router(auth_router)
app.include_router(prediction_router)
app.include_router(patient_router)
app.include_router(doctor_router)
app.include_router(admin_router)
app.include_router(appointment_router)
app.include_router(reports_router)
app.include_router(contact_router)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    from services.ai_service import get_class_names
    classes = get_class_names()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "model_loaded": len(classes) > 0,
        "disease_classes": classes,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — redirect info."""
    return {
        "message": "🦷 AI Dental Disease Detection API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
        "health": "/health",
    }


# ─── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
        workers=1,  # Keep 1 worker to share the loaded ML model
    )
