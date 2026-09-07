"""
Pydantic v2 models (schemas) for request/response validation.
Users, Patients, Doctors — all user-related schemas.
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


# ─── Registration ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    full_name: str = Field(min_length=2, max_length=100)
    role: UserRole = UserRole.PATIENT
    phone: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[Gender] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.match(r"^\+?[\d\s\-()]{7,15}$", v):
            raise ValueError("Invalid phone number format")
        return v


class RegisterResponse(BaseModel):
    message: str
    user_id: str
    email: str


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserPublic"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ─── Password Reset ───────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=64)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class VerifyEmailRequest(BaseModel):
    token: str


# ─── User Public Profile ──────────────────────────────────────────────────────

class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Profile Update ───────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[Gender] = None
    bio: Optional[str] = Field(None, max_length=500)
    specialization: Optional[str] = None  # Doctors only


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=64)


# ─── Admin: User Management ───────────────────────────────────────────────────

class AdminUpdateUserRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    is_verified: Optional[bool] = None
