"""MongoDB async client using Motor."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Create MongoDB connection pool on startup."""
    global _client, _db
    logger.info("Connecting to MongoDB Atlas...")
    try:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=10,
            minPoolSize=2,
        )
        _db = _client[settings.MONGODB_DB_NAME]
        # Verify connection
        await _client.admin.command("ping")
        logger.info(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")
        await _create_indexes()
    except Exception as e:
        logger.error(f"⚠️ MongoDB connection failed on startup: {e}. Verify MONGODB_URI.")


async def close_mongo_connection() -> None:
    """Close MongoDB connection pool on shutdown."""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the database instance (dependency injection)."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _db


async def _create_indexes() -> None:
    """Create necessary indexes for performance and uniqueness."""
    db = get_database()

    # Users collection
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.users.create_index("is_active")

    # Predictions collection
    await db.predictions.create_index("patient_id")
    await db.predictions.create_index("created_at")
    await db.predictions.create_index([("patient_id", 1), ("created_at", -1)])

    # Appointments collection
    await db.appointments.create_index("patient_id")
    await db.appointments.create_index("doctor_id")
    await db.appointments.create_index("datetime")
    await db.appointments.create_index("status")

    # Reports collection
    await db.reports.create_index("prediction_id")
    await db.reports.create_index("patient_id")

    # Tokens (for refresh tokens and password reset)
    await db.tokens.create_index("token", unique=True)
    await db.tokens.create_index("expires_at", expireAfterSeconds=0)

    logger.info("MongoDB indexes created successfully.")
