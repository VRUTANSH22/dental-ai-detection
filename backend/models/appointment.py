"""
Pydantic v2 schemas for appointments.
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookAppointmentRequest(BaseModel):
    doctor_id: str
    datetime: datetime
    reason: Optional[str] = Field(None, max_length=500)
    prediction_id: Optional[str] = None  # Link to a specific prediction


class AppointmentRecord(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    datetime: datetime
    status: AppointmentStatus
    reason: Optional[str] = None
    prediction_id: Optional[str] = None
    doctor_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UpdateAppointmentRequest(BaseModel):
    status: Optional[AppointmentStatus] = None
    doctor_notes: Optional[str] = Field(None, max_length=1000)
    new_datetime: Optional[datetime] = None  # For rescheduling
