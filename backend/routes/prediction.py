"""
AI Prediction routes — core feature of the application.
POST /api/predict — upload image, get disease prediction + Grad-CAM.
"""
import base64
import logging
import uuid
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from database.mongodb import get_database
from middlewares.auth_middleware import get_current_user, require_patient_or_doctor
from models.prediction import DoctorReview, DoctorReviewRequest, PredictionRecord
from services import ai_service, cloudinary_service

router = APIRouter(prefix="/api", tags=["Predictions"])
logger = logging.getLogger(__name__)

# Allowed image MIME types
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/bmp", "image/webp"}
MAX_FILE_SIZE_MB = 10


@router.post("/predict")
async def predict_disease(
    file: UploadFile = File(..., description="Dental image (JPG/PNG, max 10MB)"),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a dental image and receive AI disease prediction.

    - Validates image type and size
    - Uploads original image to Cloudinary
    - Runs EfficientNet-B0 inference
    - Generates Grad-CAM heatmap
    - Stores prediction in MongoDB
    - Returns full prediction result

    Returns:
        PredictionRecord with all prediction details.
    """
    # ── File validation ────────────────────────────────────────────────────────
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type '{file.content_type}'. Accepted: JPG, PNG, BMP, WebP.",
        )

    image_bytes = await file.read()
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({size_mb:.1f}MB). Maximum allowed: {MAX_FILE_SIZE_MB}MB.",
        )

    patient_id = current_user["id"]
    prediction_id = str(uuid.uuid4())

    # ── Upload original image to Cloudinary ────────────────────────────────────
    try:
        upload_result = await cloudinary_service.upload_prediction_image(
            image_bytes=image_bytes,
            patient_id=patient_id,
            prediction_id=prediction_id,
            filename=file.filename or "dental_image",
        )
        image_url = upload_result["url"]
        image_public_id = upload_result["public_id"]
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        # Continue with local processing even if Cloudinary fails
        image_url = ""
        image_public_id = ""

    # ── AI Inference ──────────────────────────────────────────────────────────
    try:
        prediction_result = await ai_service.predict_disease(image_bytes)
    except Exception as e:
        logger.error(f"AI inference failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI inference failed. Please try again with a clearer dental image.",
        )

    # ── Upload Grad-CAM overlay to Cloudinary ──────────────────────────────────
    gradcam_url = ""
    try:
        gradcam_bytes = base64.b64decode(prediction_result["gradcam_overlay_base64"])
        gradcam_result = await cloudinary_service.upload_gradcam_image(
            image_bytes=gradcam_bytes,
            patient_id=patient_id,
            prediction_id=prediction_id,
        )
        gradcam_url = gradcam_result["url"]
    except Exception as e:
        logger.warning(f"Grad-CAM Cloudinary upload failed (non-critical): {e}")

    # ── Store prediction in MongoDB ────────────────────────────────────────────
    db = get_database()
    prediction_doc = {
        "_id": ObjectId(),
        "prediction_id": prediction_id,
        "patient_id": patient_id,
        "image_url": image_url,
        "image_public_id": image_public_id,
        "gradcam_url": gradcam_url,
        "predicted_class": prediction_result["predicted_class"],
        "class_index": prediction_result["class_index"],
        "confidence": prediction_result["confidence"],
        "all_confidences": prediction_result["all_confidences"],
        "top3": prediction_result["top3"],
        "disease_info": prediction_result["disease_info"],
        "doctor_review": None,
        "created_at": datetime.now(timezone.utc),
    }
    insert_result = await db.predictions.insert_one(prediction_doc)
    db_id = str(insert_result.inserted_id)

    # ── Create report record ───────────────────────────────────────────────────
    await db.reports.insert_one({
        "prediction_id": db_id,
        "patient_id": patient_id,
        "doctor_id": None,
        "pdf_url": None,
        "created_at": datetime.now(timezone.utc),
    })

    # ── Return full result (including base64 for immediate display) ────────────
    return {
        "id": db_id,
        "prediction_id": prediction_id,
        "patient_id": patient_id,
        "image_url": image_url,
        "gradcam_url": gradcam_url,
        "predicted_class": prediction_result["predicted_class"],
        "class_index": prediction_result["class_index"],
        "confidence": prediction_result["confidence"],
        "all_confidences": prediction_result["all_confidences"],
        "top3": prediction_result["top3"],
        "gradcam_base64": prediction_result["gradcam_base64"],
        "gradcam_overlay_base64": prediction_result["gradcam_overlay_base64"],
        "disease_info": prediction_result["disease_info"],
        "doctor_review": None,
        "created_at": prediction_doc["created_at"].isoformat(),
    }


@router.get("/predictions/{prediction_id}")
async def get_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a single prediction by its MongoDB ObjectId."""
    db = get_database()

    try:
        pred = await db.predictions.find_one({"_id": ObjectId(prediction_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    # Patients can only see their own predictions
    if current_user["role"] == "patient" and pred["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    pred["id"] = str(pred["_id"])
    del pred["_id"]
    return pred


@router.delete("/predictions/{prediction_id}")
async def delete_prediction(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a prediction (patient can only delete own; admin can delete any)."""
    db = get_database()

    pred = await db.predictions.find_one({"_id": ObjectId(prediction_id)})
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    if current_user["role"] == "patient" and pred["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Clean up Cloudinary images
    if pred.get("image_public_id"):
        await cloudinary_service.delete_image(pred["image_public_id"])

    await db.predictions.delete_one({"_id": ObjectId(prediction_id)})
    await db.reports.delete_many({"prediction_id": prediction_id})

    return {"message": "Prediction deleted successfully."}
