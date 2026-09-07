"""
Authentication routes: register, login, Google OAuth, token refresh,
email verification, forgot/reset password.
"""
import logging
from datetime import datetime, timezone, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from config.settings import settings
from database.mongodb import get_database
from middlewares.auth_middleware import get_current_user
from models.user import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserPublic,
    VerifyEmailRequest,
)
from services.email_service import send_verification_email, send_password_reset_email
from utils.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


# ─── Register ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(body: RegisterRequest):
    """Register a new user account."""
    db = get_database()

    # Check if email already exists
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Hash password
    hashed = hash_password(body.password)

    # Generate email verification token
    verify_token = create_email_verification_token()

    user_doc = {
        "email": body.email.lower(),
        "password_hash": hashed,
        "full_name": body.full_name,
        "role": body.role.value,
        "phone": body.phone,
        "age": body.age,
        "gender": body.gender.value if body.gender else None,
        "is_verified": False,
        "is_active": True,
        "avatar_url": None,
        "bio": None,
        "specialization": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Store verification token
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    await db.tokens.insert_one({
        "token": verify_token,
        "user_id": user_id,
        "type": "email_verification",
        "expires_at": expires,
    })

    # Send verification email (non-blocking — if SMTP fails, still register)
    try:
        await send_verification_email(body.email, body.full_name, verify_token)
    except Exception as e:
        logger.warning(f"Failed to send verification email: {e}")

    return RegisterResponse(
        message="Registration successful! Please check your email to verify your account.",
        user_id=user_id,
        email=body.email,
    )


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Authenticate user and return JWT tokens."""
    db = get_database()

    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    user_id = str(user["_id"])
    token_data = {"sub": user_id, "role": user["role"], "email": user["email"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": user_id})

    # Store refresh token in DB for rotation/revocation
    await db.tokens.insert_one({
        "token": refresh_token,
        "user_id": user_id,
        "type": "refresh",
        "expires_at": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    })

    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    user_public = UserPublic(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_verified=user.get("is_verified", False),
        is_active=user.get("is_active", True),
        avatar_url=user.get("avatar_url"),
        created_at=user["created_at"],
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_public,
    )


# ─── Refresh Token ────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(body: RefreshTokenRequest):
    """Issue new access token using a valid refresh token."""
    db = get_database()

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
    )

    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise credentials_exception
        user_id = payload.get("sub")
    except Exception:
        raise credentials_exception

    # Verify token exists in DB (not revoked)
    token_doc = await db.tokens.find_one({"token": body.refresh_token, "type": "refresh"})
    if not token_doc:
        raise credentials_exception

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_active", False):
        raise credentials_exception

    # Rotate: revoke old, issue new
    await db.tokens.delete_one({"token": body.refresh_token})
    new_refresh = create_refresh_token({"sub": user_id})
    await db.tokens.insert_one({
        "token": new_refresh,
        "user_id": user_id,
        "type": "refresh",
        "expires_at": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    })

    token_data = {"sub": user_id, "role": user["role"], "email": user["email"]}
    new_access = create_access_token(token_data)

    user_public = UserPublic(
        id=user_id,
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_verified=user.get("is_verified", False),
        is_active=user.get("is_active", True),
        avatar_url=user.get("avatar_url"),
        created_at=user["created_at"],
    )

    return TokenResponse(access_token=new_access, refresh_token=new_refresh, user=user_public)


# ─── Logout ───────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(body: RefreshTokenRequest):
    """Revoke refresh token on logout."""
    db = get_database()
    await db.tokens.delete_one({"token": body.refresh_token, "type": "refresh"})
    return {"message": "Logged out successfully."}


# ─── Email Verification ───────────────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest):
    """Verify user email address using the verification token."""
    db = get_database()

    token_doc = await db.tokens.find_one({
        "token": body.token,
        "type": "email_verification",
    })
    if not token_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )

    await db.users.update_one(
        {"_id": ObjectId(token_doc["user_id"])},
        {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc)}}
    )
    await db.tokens.delete_one({"token": body.token})

    return {"message": "Email verified successfully! You can now log in."}


# ─── Forgot Password ──────────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """Send password reset email."""
    db = get_database()

    user = await db.users.find_one({"email": body.email.lower()})
    # Always return same message for security (prevent email enumeration)
    if not user:
        return {"message": "If an account exists with this email, a reset link has been sent."}

    # Revoke any existing reset tokens
    await db.tokens.delete_many({"user_id": str(user["_id"]), "type": "password_reset"})

    reset_token = create_password_reset_token()
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.tokens.insert_one({
        "token": reset_token,
        "user_id": str(user["_id"]),
        "type": "password_reset",
        "expires_at": expires,
    })

    try:
        await send_password_reset_email(body.email, user["full_name"], reset_token)
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")

    return {"message": "If an account exists with this email, a reset link has been sent."}


# ─── Reset Password ───────────────────────────────────────────────────────────

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """Reset password using the reset token."""
    db = get_database()

    token_doc = await db.tokens.find_one({
        "token": body.token,
        "type": "password_reset",
    })
    if not token_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    new_hash = hash_password(body.new_password)
    await db.users.update_one(
        {"_id": ObjectId(token_doc["user_id"])},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
    )
    await db.tokens.delete_one({"token": body.token})
    # Also revoke all refresh tokens for security
    await db.tokens.delete_many({"user_id": token_doc["user_id"], "type": "refresh"})

    return {"message": "Password reset successfully. Please log in with your new password."}


# ─── Get Current User ─────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's public profile."""
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
