"""Notification service – creates and retrieves user notifications."""
from datetime import datetime
from app.models.notification import Notification
import uuid

async def create_notification(
    db,
    user_id: str,
    type: str,
    severity: str,
    title: str,
    message: str,
    metadata: dict = None,
) -> dict:
    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=type,
        severity=severity,
        title=title,
        message=message,
        metadata=metadata or {},
    )
    await db.notifications.insert_one(notif.model_dump())
    return notif.model_dump()

async def get_user_notifications(db, user_id: str, unread_only: bool = False) -> list:
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    cursor = db.notifications.find(query).sort("created_at", -1).limit(50)
    docs = await cursor.to_list(None)
    for d in docs:
        d.pop("_id", None)
    return docs

async def mark_read(db, notification_id: str, user_id: str):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"read": True}},
    )
