"""
JWT authentication middleware and RBAC dependency functions.
Used as FastAPI dependency injection (Depends).
"""
import logging
from typing import Optional

from bson import ObjectId
from fastapi import Cookie, Depends, Header, HTTPException, status
from jose import JWTError

from config.settings import settings
from database.mongodb import get_database
from models.user import UserRole, UserPublic
from utils.security import decode_token

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> dict:
    """
    Extract and validate JWT access token from Authorization header.

    Returns:
        MongoDB user document as dict.

    Raises:
        HTTPException 401: If token is missing, invalid, or expired.
        HTTPException 403: If user is inactive or unverified.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization.split(" ", 1)[1]

    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not user_id or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise credentials_exception

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    # Serialize _id to string for downstream use
    user["id"] = str(user["_id"])
    return user


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Alias for get_current_user with clearer intent."""
    return current_user


def require_role(*roles: UserRole):
    """
    Role-based access control dependency factory.

    Usage:
        @router.get("/admin-only")
        async def admin_route(user = Depends(require_role(UserRole.ADMIN))):
            ...
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(r.value for r in roles)}",
            )
        return current_user

    return role_checker


# Convenience role dependencies
require_patient = require_role(UserRole.PATIENT)
require_doctor = require_role(UserRole.DOCTOR, UserRole.ADMIN)
require_admin = require_role(UserRole.ADMIN)
require_patient_or_doctor = require_role(UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN)
