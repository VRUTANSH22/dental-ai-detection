"""
Patient routes — profile management, prediction history, disease information.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from database.mongodb import get_database
from middlewares.auth_middleware import get_current_user, require_patient
from models.user import UpdateProfileRequest, UserPublic
from services.cloudinary_service import upload_profile_photo

router = APIRouter(prefix="/api/patient", tags=["Patient"])
logger = logging.getLogger(__name__)


@router.get("/profile", response_model=UserPublic)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the authenticated patient's profile."""
    return UserPublic(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_verified=current_user.get("is_verified", False),
        is_active=current_user.get("is_active", True),
        avatar_url=current_user.get("avatar_url"),
        created_at=current_user["created_at"],
    )


@router.put("/profile")
async def update_profile(
    body: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update patient profile information."""
    db = get_database()
    update_data = body.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    return {"message": "Profile updated successfully."}


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload or update profile avatar."""
    if file.content_type not in {"image/jpeg", "image/jpg", "image/png"}:
        raise HTTPException(status_code=422, detail="Only JPG and PNG images are allowed.")

    image_bytes = await file.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large. Max 5MB.")

    result = await upload_profile_photo(image_bytes, current_user["id"])
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"avatar_url": result["url"], "updated_at": datetime.now(timezone.utc)}}
    )
    return {"avatar_url": result["url"]}


@router.get("/predictions")
async def get_my_predictions(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    disease: Optional[str] = Query(None),
    sort: str = Query("desc", pattern="^(asc|desc)$"),
):
    """
    Get paginated list of the patient's prediction history.
    Supports filtering by disease name and sorting.
    """
    db = get_database()
    query: dict = {"patient_id": current_user["id"]}
    if disease:
        query["predicted_class"] = {"$regex": disease, "$options": "i"}

    sort_order = -1 if sort == "desc" else 1
    skip = (page - 1) * limit

    cursor = db.predictions.find(
        query,
        {"gradcam_base64": 0, "gradcam_overlay_base64": 0}  # Exclude large fields
    ).sort("created_at", sort_order).skip(skip).limit(limit)

    predictions = []
    async for pred in cursor:
        pred["id"] = str(pred["_id"])
        del pred["_id"]
        predictions.append(pred)

    total = await db.predictions.count_documents(query)

    return {
        "predictions": predictions,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get patient dashboard statistics."""
    db = get_database()
    patient_id = current_user["id"]

    total_predictions = await db.predictions.count_documents({"patient_id": patient_id})
    total_appointments = await db.appointments.count_documents({"patient_id": patient_id})
    pending_appointments = await db.appointments.count_documents(
        {"patient_id": patient_id, "status": "pending"}
    )

    # Most common disease
    pipeline = [
        {"$match": {"patient_id": patient_id}},
        {"$group": {"_id": "$predicted_class", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1},
    ]
    most_common = None
    async for doc in db.predictions.aggregate(pipeline):
        most_common = doc["_id"]

    return {
        "total_predictions": total_predictions,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "most_common_disease": most_common,
    }
