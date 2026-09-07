"""
Admin routes — user management, system analytics, disease info management.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from database.mongodb import get_database
from middlewares.auth_middleware import require_admin
from models.user import AdminUpdateUserRequest, UserRole
from services.ai_service import get_all_disease_info

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


@router.get("/users")
async def get_all_users(
    current_user: dict = Depends(require_admin),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Get paginated list of all users with optional filters."""
    db = get_database()
    query: dict = {}
    if role:
        query["role"] = role
    if is_active is not None:
        query["is_active"] = is_active
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    users = []
    async for user in db.users.find(query, {"password_hash": 0}).skip(skip).limit(limit):
        user["id"] = str(user["_id"])
        del user["_id"]
        users.append(user)

    total = await db.users.count_documents(query)
    return {"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    body: AdminUpdateUserRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: activate/deactivate user, change role, verify email."""
    db = get_database()
    update_data = body.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.now(timezone.utc)

    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"message": "User updated successfully."}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Admin: permanently delete a user and all their data."""
    db = get_database()
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.predictions.delete_many({"patient_id": user_id})
    await db.appointments.delete_many({"patient_id": user_id})
    await db.reports.delete_many({"patient_id": user_id})
    await db.tokens.delete_many({"user_id": user_id})
    return {"message": "User and all associated data deleted."}


@router.get("/analytics")
async def get_system_analytics(current_user: dict = Depends(require_admin)):
    """Get system-wide analytics for admin dashboard."""
    db = get_database()

    total_users = await db.users.count_documents({})
    total_patients = await db.users.count_documents({"role": "patient"})
    total_doctors = await db.users.count_documents({"role": "doctor"})
    total_predictions = await db.predictions.count_documents({})
    total_appointments = await db.appointments.count_documents({})
    pending_appointments = await db.appointments.count_documents({"status": "pending"})

    # Disease prediction distribution
    disease_pipeline = [
        {"$group": {"_id": "$predicted_class", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    disease_dist = {}
    async for doc in db.predictions.aggregate(disease_pipeline):
        disease_dist[doc["_id"]] = doc["count"]

    # Predictions per day (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
    ]
    daily_predictions = []
    async for doc in db.predictions.aggregate(daily_pipeline):
        daily_predictions.append({"date": doc["_id"], "count": doc["count"]})

    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_predictions": total_predictions,
        "total_appointments": total_appointments,
        "pending_appointments": pending_appointments,
        "disease_distribution": disease_dist,
        "daily_predictions": daily_predictions,
    }


@router.get("/predictions")
async def get_all_predictions(
    current_user: dict = Depends(require_admin),
    disease: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Admin: view all predictions across all patients."""
    db = get_database()
    query: dict = {}
    if disease:
        query["predicted_class"] = {"$regex": disease, "$options": "i"}

    skip = (page - 1) * limit
    predictions = []
    async for pred in db.predictions.find(
        query, {"gradcam_base64": 0}
    ).sort("created_at", -1).skip(skip).limit(limit):
        pred["id"] = str(pred["_id"])
        del pred["_id"]
        predictions.append(pred)

    total = await db.predictions.count_documents(query)
    return {"predictions": predictions, "total": total}


@router.get("/contact-messages")
async def get_contact_messages(
    current_user: dict = Depends(require_admin),
    is_read: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Get contact form messages."""
    db = get_database()
    query: dict = {}
    if is_read is not None:
        query["is_read"] = is_read

    skip = (page - 1) * limit
    messages = []
    async for msg in db.contact_messages.find(query).sort("created_at", -1).skip(skip).limit(limit):
        msg["id"] = str(msg["_id"])
        del msg["_id"]
        messages.append(msg)

    total = await db.contact_messages.count_documents(query)
    return {"messages": messages, "total": total}


@router.put("/contact-messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    current_user: dict = Depends(require_admin),
):
    """Mark a contact message as read."""
    db = get_database()
    await db.contact_messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Message marked as read."}
