"""
Doctor routes — view patients, review predictions, manage appointments.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from database.mongodb import get_database
from middlewares.auth_middleware import get_current_user, require_doctor
from models.prediction import DoctorReview, DoctorReviewRequest

router = APIRouter(prefix="/api/doctor", tags=["Doctor"])
logger = logging.getLogger(__name__)


@router.get("/patients")
async def get_assigned_patients(
    current_user: dict = Depends(require_doctor),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
):
    """Get list of patients with predictions assigned to this doctor."""
    db = get_database()
    doctor_id = current_user["id"]

    # Find unique patient IDs from predictions reviewed/assigned to this doctor
    pipeline = [
        {"$match": {"doctor_review.doctor_id": doctor_id}},
        {"$group": {"_id": "$patient_id"}},
    ]
    patient_ids = set()
    async for doc in db.predictions.aggregate(pipeline):
        patient_ids.add(doc["_id"])

    # Also include patients with appointments with this doctor
    async for appt in db.appointments.find({"doctor_id": doctor_id}, {"patient_id": 1}):
        patient_ids.add(appt["patient_id"])

    query: dict = {"_id": {"$in": [ObjectId(pid) for pid in patient_ids]}}
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    patients = []
    async for user in db.users.find(
        query,
        {"password_hash": 0}
    ).skip(skip).limit(limit):
        user["id"] = str(user["_id"])
        del user["_id"]
        patients.append(user)

    return {"patients": patients, "total": len(patients)}


@router.get("/patients/{patient_id}/predictions")
async def get_patient_predictions(
    patient_id: str,
    current_user: dict = Depends(require_doctor),
):
    """Get all predictions for a specific patient."""
    db = get_database()
    predictions = []
    async for pred in db.predictions.find(
        {"patient_id": patient_id},
        {"gradcam_base64": 0}
    ).sort("created_at", -1):
        pred["id"] = str(pred["_id"])
        del pred["_id"]
        predictions.append(pred)

    return {"predictions": predictions, "patient_id": patient_id}


@router.put("/predictions/{prediction_id}/review")
async def review_prediction(
    prediction_id: str,
    body: DoctorReviewRequest,
    current_user: dict = Depends(require_doctor),
):
    """
    Submit doctor review for a prediction.
    Can approve, reject, or flag for additional review.
    """
    db = get_database()

    pred = await db.predictions.find_one({"_id": ObjectId(prediction_id)})
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found.")

    review = {
        "doctor_id": current_user["id"],
        "doctor_name": current_user["full_name"],
        "status": body.status,
        "notes": body.notes,
        "prescription": body.prescription,
        "reviewed_at": datetime.now(timezone.utc),
    }

    await db.predictions.update_one(
        {"_id": ObjectId(prediction_id)},
        {"$set": {"doctor_review": review}}
    )

    # Update report with doctor info
    await db.reports.update_one(
        {"prediction_id": prediction_id},
        {"$set": {"doctor_id": current_user["id"]}},
        upsert=True,
    )

    return {"message": "Review submitted successfully.", "review": review}


@router.get("/appointments")
async def get_doctor_appointments(
    current_user: dict = Depends(require_doctor),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
):
    """Get appointments for this doctor."""
    db = get_database()
    query: dict = {"doctor_id": current_user["id"]}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    appointments = []
    async for appt in db.appointments.find(query).sort("datetime", 1).skip(skip).limit(limit):
        appt["id"] = str(appt["_id"])
        del appt["_id"]
        appointments.append(appt)

    total = await db.appointments.count_documents(query)
    return {"appointments": appointments, "total": total}


@router.get("/analytics")
async def get_doctor_analytics(current_user: dict = Depends(require_doctor)):
    """Get analytics for the doctor's activity."""
    db = get_database()
    doctor_id = current_user["id"]

    total_reviews = await db.predictions.count_documents(
        {"doctor_review.doctor_id": doctor_id}
    )
    approved = await db.predictions.count_documents(
        {"doctor_review.doctor_id": doctor_id, "doctor_review.status": "approved"}
    )
    rejected = await db.predictions.count_documents(
        {"doctor_review.doctor_id": doctor_id, "doctor_review.status": "rejected"}
    )
    pending_reviews = await db.predictions.count_documents(
        {"doctor_review": None}
    )
    total_appointments = await db.appointments.count_documents({"doctor_id": doctor_id})

    # Disease distribution in reviews
    pipeline = [
        {"$match": {"doctor_review.doctor_id": doctor_id}},
        {"$group": {"_id": "$predicted_class", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    disease_dist = {}
    async for doc in db.predictions.aggregate(pipeline):
        disease_dist[doc["_id"]] = doc["count"]

    return {
        "total_reviews": total_reviews,
        "approved": approved,
        "rejected": rejected,
        "pending_reviews": pending_reviews,
        "total_appointments": total_appointments,
        "disease_distribution": disease_dist,
    }
