"""
Public contact form submission route.
"""
from fastapi import APIRouter, Body
from pydantic import BaseModel, EmailStr
from datetime import datetime

from database.mongodb import get_database

router = APIRouter(tags=["Contact"])


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/contact", status_code=201)
async def submit_contact(data: ContactMessage = Body(...)):
    """Accept contact form submissions from the public website."""
    db = await get_database()
    document = {
        "name": data.name,
        "email": data.email,
        "subject": data.subject,
        "message": data.message,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }
    result = await db.contact_messages.insert_one(document)
    return {"message": "Thank you! Your message has been received.", "id": str(result.inserted_id)}
