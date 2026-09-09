"""
Appointment routes — book, view, update, cancel appointments.
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from database.mongodb import get_database
from middlewares.auth_middleware import get_current_user, require_doctor
from models.appointment import AppointmentStatus, BookAppointmentRequest, UpdateAppointmentRequest
from services.email_service import send_appointment_confirmation

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])
logger = logging.getLogger(__name__)


@router.post("", status_code=201)
async def book_appointment(
    body: BookAppointmentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Book a new appointment with a doctor."""
    db = get_database()

    # Verify doctor exists and is active
    doctor = await db.users.find_one({
        "_id": ObjectId(body.doctor_id),
        "role": "doctor",
        "is_active": True,
    })
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found or inactive.")

    # Check for conflicts (doctor already has appointment at same time ±30 min)
    from datetime import timedelta
    slot_start = body.datetime - timedelta(minutes=30)
    slot_end = body.datetime + timedelta(minutes=30)
    conflict = await db.appointments.find_one({
        "doctor_id": body.doctor_id,
        "datetime": {"$gte": slot_start, "$lte": slot_end},
        "status": {"$in": ["pending", "confirmed"]},
    })
    if conflict:
        raise HTTPException(
            status_code=409,
            detail="This time slot is already booked. Please choose a different time.",
        )

    appt_doc = {
        "patient_id": current_user["id"],
        "doctor_id": body.doctor_id,
        "patient_name": current_user["full_name"],
        "doctor_name": doctor["full_name"],
        "datetime": body.datetime,
        "status": AppointmentStatus.PENDING.value,
        "reason": body.reason,
        "prediction_id": body.prediction_id,
        "doctor_notes": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.appointments.insert_one(appt_doc)

    # Send confirmation email (non-blocking)
    try:
        await send_appointment_confirmation(
            to_email=current_user["email"],
            patient_name=current_user["full_name"],
            doctor_name=doctor["full_name"],
            appointment_date=body.datetime.strftime("%d %B %Y"),
            appointment_time=body.datetime.strftime("%I:%M %p"),
        )
    except Exception as e:
        logger.warning(f"Appointment email failed: {e}")

    appt_doc["id"] = str(result.inserted_id)
    appt_doc.pop("_id", None)
    return appt_doc


@router.get("")
async def get_my_appointments(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    """Get current user's appointments (patients see own; doctors see assigned)."""
    db = get_database()
    role = current_user["role"]

    if role == "patient":
        query: dict = {"patient_id": current_user["id"]}
    elif role in ("doctor", "admin"):
        query = {"doctor_id": current_user["id"]}
    else:
        query = {}

    if status:
        query["status"] = status

    skip = (page - 1) * limit
    appointments = []
    async for appt in db.appointments.find(query).sort("datetime", -1).skip(skip).limit(limit):
        appt["id"] = str(appt["_id"])
        del appt["_id"]
        appointments.append(appt)

    total = await db.appointments.count_documents(query)
    return {"appointments": appointments, "total": total, "page": page}


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a single appointment by ID."""
    db = get_database()
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Access control
    user_id = current_user["id"]
    role = current_user["role"]
    if role == "patient" and appt["patient_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied.")

    appt["id"] = str(appt["_id"])
    del appt["_id"]
    return appt


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    body: UpdateAppointmentRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update appointment status or reschedule."""
    db = get_database()
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    role = current_user["role"]
    user_id = current_user["id"]

    # Permission checks
    if role == "patient":
        if appt["patient_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied.")
        # Patients can only cancel
        if body.status and body.status != AppointmentStatus.CANCELLED:
            raise HTTPException(status_code=403, detail="Patients can only cancel appointments.")
    elif role in ("doctor", "admin"):
        if role == "doctor" and appt["doctor_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied.")

    update_data: dict = {"updated_at": datetime.now(timezone.utc)}
    if body.status:
        update_data["status"] = body.status.value
    if body.doctor_notes:
        update_data["doctor_notes"] = body.doctor_notes
    if body.new_datetime:
        update_data["datetime"] = body.new_datetime
        update_data["status"] = AppointmentStatus.RESCHEDULED.value

    await db.appointments.update_one({"_id": ObjectId(appointment_id)}, {"$set": update_data})
    return {"message": "Appointment updated successfully."}


@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Cancel an appointment."""
    db = get_database()
    appt = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    if current_user["role"] == "patient" and appt["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied.")

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": AppointmentStatus.CANCELLED.value, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Appointment cancelled."}


@router.get("/available-doctors")
async def get_available_doctors(db=Depends(get_database)):
    """Get list of active doctors for appointment booking."""
    doctors = []
    async for doc in db.users.find({"role": "doctor", "is_active": True}, {"password_hash": 0}):
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        doctors.append(doc)
    return {"doctors": doctors}
