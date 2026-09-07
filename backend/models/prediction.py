"""
Pydantic v2 schemas for AI predictions and reports.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PredictionResult(BaseModel):
    """Single prediction result from AI model."""
    predicted_class: str
    class_index: int
    confidence: float
    all_confidences: dict[str, float]
    top3: list[dict]
    gradcam_base64: str
    gradcam_overlay_base64: str
    disease_info: dict


class PredictionRecord(BaseModel):
    """Prediction record stored in MongoDB."""
    id: str
    patient_id: str
    image_url: str
    gradcam_url: Optional[str] = None
    predicted_class: str
    class_index: int
    confidence: float
    top3: list[dict]
    disease_info: dict
    doctor_review: Optional["DoctorReview"] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorReview(BaseModel):
    """Doctor's review of a prediction."""
    doctor_id: str
    doctor_name: str
    status: str  # "approved" | "rejected" | "needs_review"
    notes: Optional[str] = None
    prescription: Optional[str] = None
    reviewed_at: datetime


class DoctorReviewRequest(BaseModel):
    """Request body for doctor to review a prediction."""
    status: str = Field(pattern="^(approved|rejected|needs_review)$")
    notes: Optional[str] = Field(None, max_length=2000)
    prescription: Optional[str] = Field(None, max_length=2000)


class ReportRecord(BaseModel):
    """PDF report record stored in MongoDB."""
    id: str
    prediction_id: str
    patient_id: str
    doctor_id: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
