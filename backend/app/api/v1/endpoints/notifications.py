from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.core.database import get_db
from app.services.notification_service import get_user_notifications, mark_read, create_notification
from pydantic import BaseModel

router = APIRouter()

@router.get("/")
async def list_notifications(
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    return await get_user_notifications(db, current_user["id"], unread_only)

@router.get("/count")
async def unread_count(current_user: dict = Depends(get_current_user)):
    db = get_db()
    count = await db.notifications.count_documents({"user_id": current_user["id"], "read": False})
    return {"unread": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await mark_read(db, notification_id, current_user["id"])
    return {"id": notification_id, "read": True}

@router.put("/mark-all-read")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

@router.post("/test")
async def send_test(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await create_notification(
        db, current_user["id"], "system", "info",
        "Test Notification", "Notification system is working correctly."
    )
    return {"message": "Test notification sent"}
