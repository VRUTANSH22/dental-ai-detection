"""
Application configuration using Pydantic BaseSettings.
Reads values from environment variables / .env file.
"""
from pathlib import Path
from typing import List
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "AI Dental Disease Detection"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_use_a_very_long_random_string"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "dental_db"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@dentalai.com"
    SMTP_FROM_NAME: str = "Dental AI System"

    # CORS
    FRONTEND_URL: str = "https://dental-ai-detection-final.vercel.app"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://dental-ai-detection-final.vercel.app,https://dental-ai-detection.vercel.app"

    @property
    def allowed_origins_list(self) -> List[str]:
        origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL.strip())
        return origins

    # Model paths (resolved relative to backend root)
    MODEL_PATH: str = "../models/efficientnet_b0_dental.pth"
    CLASS_MAPPING_PATH: str = "../models/class_mapping.json"
    DISEASE_INFO_PATH: str = "../models/disease_info.json"

    @property
    def model_path_resolved(self) -> Path:
        base = Path(__file__).parent.parent
        return (base / self.MODEL_PATH).resolve()

    @property
    def class_mapping_path_resolved(self) -> Path:
        base = Path(__file__).parent.parent
        return (base / self.CLASS_MAPPING_PATH).resolve()

    @property
    def disease_info_path_resolved(self) -> Path:
        base = Path(__file__).parent.parent
        return (base / self.DISEASE_INFO_PATH).resolve()

    # Rate Limiting
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_PREDICT: str = "5/minute"
    RATE_LIMIT_GENERAL: str = "100/minute"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_value(cls, value: object) -> bool:
        """Tolerate a host-level ``DEBUG=release`` environment variable.

        Some Windows development environments define DEBUG as a text label.
        Pydantic only accepts boolean strings for the application's DEBUG
        setting, which otherwise prevents the API from starting at all.
        """
        if isinstance(value, str) and value.strip().lower() in {"release", "production", "prod"}:
            return False
        return value


# Singleton settings instance
settings = Settings()
