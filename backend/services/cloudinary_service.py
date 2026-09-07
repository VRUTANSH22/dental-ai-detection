"""
Cloudinary integration service for image upload and management.
All dental images and Grad-CAM heatmaps are stored in Cloudinary.
"""
import logging
from typing import Optional

import cloudinary
import cloudinary.uploader
import cloudinary.api

from config.settings import settings

logger = logging.getLogger(__name__)


def configure_cloudinary() -> None:
    """Configure Cloudinary with credentials from settings."""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    logger.info("Cloudinary configured successfully.")


async def upload_prediction_image(
    image_bytes: bytes,
    patient_id: str,
    prediction_id: str,
    filename: str = "dental_image",
) -> dict:
    """
    Upload a dental prediction image to Cloudinary.

    Args:
        image_bytes: Raw image bytes.
        patient_id: Patient's MongoDB ObjectId string.
        prediction_id: Prediction record ID.
        filename: Original filename.

    Returns:
        dict with 'url' and 'public_id'.
    """
    folder = f"dental_app/predictions/{patient_id}"
    public_id = f"{folder}/{prediction_id}_original"

    result = cloudinary.uploader.upload(
        image_bytes,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        format="jpg",
        transformation=[
            {"quality": "auto:good"},
            {"fetch_format": "auto"},
        ],
        tags=[f"patient_{patient_id}", "prediction", "dental"],
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_gradcam_image(
    image_bytes: bytes,
    patient_id: str,
    prediction_id: str,
) -> dict:
    """
    Upload a Grad-CAM overlay image to Cloudinary.

    Args:
        image_bytes: Grad-CAM overlay PNG bytes.
        patient_id: Patient's MongoDB ObjectId string.
        prediction_id: Prediction record ID.

    Returns:
        dict with 'url' and 'public_id'.
    """
    folder = f"dental_app/gradcam/{patient_id}"
    public_id = f"{folder}/{prediction_id}_gradcam"

    result = cloudinary.uploader.upload(
        image_bytes,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        format="png",
        tags=[f"patient_{patient_id}", "gradcam", "dental"],
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_profile_photo(
    image_bytes: bytes,
    user_id: str,
) -> dict:
    """
    Upload a user profile photo to Cloudinary.

    Args:
        image_bytes: Raw image bytes.
        user_id: User's MongoDB ObjectId string.

    Returns:
        dict with 'url' and 'public_id'.
    """
    public_id = f"dental_app/profiles/{user_id}/avatar"

    result = cloudinary.uploader.upload(
        image_bytes,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
        transformation=[
            {"width": 300, "height": 300, "crop": "fill", "gravity": "face"},
            {"quality": "auto:good"},
        ],
        tags=[f"user_{user_id}", "profile"],
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def delete_image(public_id: str) -> bool:
    """
    Delete an image from Cloudinary by its public_id.

    Args:
        public_id: Cloudinary public_id of the image.

    Returns:
        True if deleted successfully, False otherwise.
    """
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        return result.get("result") == "ok"
    except Exception as e:
        logger.error(f"Failed to delete Cloudinary image {public_id}: {e}")
        return False


async def delete_patient_images(patient_id: str) -> None:
    """
    Delete all images associated with a patient (for GDPR/data deletion).

    Args:
        patient_id: Patient's MongoDB ObjectId string.
    """
    try:
        # Delete all images with patient tag
        cloudinary.api.delete_resources_by_tag(f"patient_{patient_id}")
        logger.info(f"Deleted all images for patient {patient_id}")
    except Exception as e:
        logger.error(f"Failed to delete images for patient {patient_id}: {e}")
