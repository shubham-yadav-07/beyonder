from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import ServerSelectionTimeoutError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_db():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(
        settings.MONGO_URL,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db_instance.db = db_instance.client[settings.DB_NAME]
    try:
        await _create_indexes()
    except ServerSelectionTimeoutError as e:
        db_instance.client = None
        db_instance.db = None
        logger.error(
            "=" * 70 + "\n"
            f"COULD NOT CONNECT TO MONGODB at {settings.MONGO_URL}\n"
            "\n"
            "Beyonder requires MongoDB to be running before the API starts.\n"
            "  - Local install : run `mongod` (or `sudo systemctl start mongod`)\n"
            "  - Docker        : docker run -d -p 27017:27017 --name beyonder-mongo mongo\n"
            "\n"
            f"Original error: {e}\n" + "=" * 70
        )
        raise RuntimeError(
            f"MongoDB is not reachable at {settings.MONGO_URL}. "
            f"Start MongoDB and restart the API (see logs above for instructions)."
        ) from e
    logger.info(f"Connected to MongoDB: {settings.DB_NAME}")

async def close_db():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed")

def get_db() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return db_instance.db

async def _create_indexes():
    db = db_instance.db
    # users
    await db.users.create_index([("email", ASCENDING)], unique=True)
    # threats
    await db.threats.create_index([("detected_at", DESCENDING)])
    await db.threats.create_index([("level", ASCENDING), ("status", ASCENDING)])
    await db.threats.create_index([("hash", ASCENDING)])
    # blockchain_logs
    await db.blockchain_logs.create_index([("timestamp", DESCENDING)])
    await db.blockchain_logs.create_index([("block_number", DESCENDING)])
    # backups
    await db.backups.create_index([("created_at", DESCENDING)])
    # monitored_folders
    await db.monitored_folders.create_index([("user_id", ASCENDING)])
    # notifications
    await db.notifications.create_index([("user_id", ASCENDING), ("read", ASCENDING)])
    logger.info("Database indexes created")
