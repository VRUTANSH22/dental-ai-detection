"""
Reports routes — generate and download PDF reports for predictions.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from database.mongodb import get_database
from middlewares.auth_middleware import get_current_user
from services.pdf_service import generate_prediction_pdf

router = APIRouter(prefix="/api/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


@router.get("/{prediction_id}/pdf")
async def download_report_pdf(
    prediction_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate and download a hospital-style PDF report for a prediction.
    
    The PDF includes patient info, AI prediction, Grad-CAM, disease info,
    doctor review (if available), and AI disclaimer.
    """
    db = get_database()

    # Fetch prediction
    try:
        pred = await db.predictions.find_one({"_id": ObjectId(prediction_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    # Access control
    role = current_user["role"]
    if role == "patient" and pred["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Fetch patient info
    patient_user = await db.users.find_one({"_id": ObjectId(pred["patient_id"])})
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Fetch doctor info if reviewed
    doctor_review = pred.get("doctor_review", {}) or {}

    # Build report data
    report_id = str(uuid.uuid4())[:8].upper()
    report_data = {
        "report_id": report_id,
        "patient": {
            "id": pred["patient_id"],
            # Optional profile fields are stored as None for many users.
            # ReportLab Paragraph expects text, not None.
            "name": patient_user.get("full_name") or "—",
            "email": patient_user.get("email") or "—",
            "age": patient_user.get("age") or "—",
            "gender": patient_user.get("gender") or "—",
            "phone": patient_user.get("phone") or "—",
        },
        "prediction": {
            "predicted_class": pred.get("predicted_class", "Unknown"),
            "confidence": pred.get("confidence", 0),
            "top3": pred.get("top3", []),
            "all_confidences": pred.get("all_confidences", {}),
            "created_at": pred.get("created_at"),
        },
        "disease_info": pred.get("disease_info", {}),
        "doctor_review": doctor_review,
        "image_url": pred.get("image_url", ""),
        "gradcam_url": pred.get("gradcam_url", ""),
    }

    # Generate PDF
    try:
        pdf_bytes = await generate_prediction_pdf(
            report_data=report_data,
            gradcam_overlay_b64=pred.get("gradcam_overlay_base64"),
        )
    except Exception:
        logger.exception("PDF generation failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate PDF report. Please try again."
        )

    # Update report record
    await db.reports.update_one(
        {"prediction_id": prediction_id},
        {"$set": {"report_id": report_id, "generated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )

    patient_name = patient_user.get("full_name", "patient").replace(" ", "_")
    filename = f"DentalAI_Report_{patient_name}_{report_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("")
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    """Get all report records for the current user."""
    db = get_database()
    query = {"patient_id": current_user["id"]}

    reports = []
    async for rep in db.reports.find(query).sort("created_at", -1):
        rep["id"] = str(rep["_id"])
        del rep["_id"]
        reports.append(rep)

    return {"reports": reports}


@router.get("/public/disease-info")
async def get_disease_info():
    """Public endpoint — get all disease information."""
    from services.ai_service import get_all_disease_info
    return get_all_disease_info()


@router.get("/public/disease-info/{disease_name}")
async def get_single_disease_info(disease_name: str):
    """Public endpoint — get information for a specific disease."""
    from services.ai_service import get_disease_info
    info = get_disease_info(disease_name)
    if not info:
        raise HTTPException(status_code=404, detail=f"Disease '{disease_name}' not found.")
    return info
