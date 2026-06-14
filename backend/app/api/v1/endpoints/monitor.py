from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.security import get_current_user
from app.core.database import get_db
from app.services.blockchain_service import log_event
from app.services.fs_monitor import fs_monitor, count_files
from app.services.threat_engine import analyze_file

router = APIRouter()


class FolderCreate(BaseModel):
    path: str = Field(min_length=1, max_length=500)
    label: Optional[str] = None

    @field_validator("path")
    @classmethod
    def path_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("path cannot be empty or whitespace")
        return v


class FolderOut(BaseModel):
    id: str
    path: str
    label: Optional[str]
    status: str
    file_count: int
    threat_count: int
    last_scan: Optional[str]
    user_id: str
    created_at: str
    live_watch: bool = False


class FileEventOut(BaseModel):
    id: str
    folder_id: str
    event_type: str   # created | modified | deleted | renamed
    path: str
    dest_path: Optional[str] = None
    timestamp: str


# ── List folders ──────────────────────────────────────────────────────────────
@router.get("/", response_model=List[FolderOut])
async def list_folders(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.monitored_folders.find({"user_id": current_user["id"]})
    docs = await cursor.to_list(None)
    for d in docs:
        d.pop("_id", None)
        d["live_watch"] = d["id"] in fs_monitor._observers
    return docs


# ── Add folder ───────────────────────────────────────────────────────────────
@router.post("/", response_model=FolderOut, status_code=201)
async def add_folder(payload: FolderCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.monitored_folders.find_one({"path": payload.path, "user_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=409, detail="Folder already being monitored")

    file_count = count_files(payload.path)
    folder = {
        "id": str(uuid.uuid4()),
        "path": payload.path,
        "label": payload.label or payload.path.rstrip("/\\").split("/")[-1].split("\\")[-1],
        "status": "protected",
        "file_count": file_count,
        "threat_count": 0,
        "last_scan": datetime.utcnow().isoformat(),
        "user_id": current_user["id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.monitored_folders.insert_one(folder)

    # Attempt real OS-level watch (Phase 8) — gracefully no-ops on missing paths
    live = fs_monitor.watch(folder["id"], current_user["id"], payload.path)

    await log_event(db, "FOLDER_ADDED", "INFO", {
        "path": payload.path, "user": current_user["id"], "file_count": file_count, "live_watch": live
    })

    folder.pop("_id", None)
    folder["live_watch"] = live
    return folder


# ── Remove folder ────────────────────────────────────────────────────────────
@router.delete("/{folder_id}")
async def remove_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.monitored_folders.delete_one({"id": folder_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found or not yours")
    fs_monitor.unwatch(folder_id)
    await log_event(db, "FOLDER_REMOVED", "INFO", {"folder_id": folder_id, "user": current_user["id"]})
    return {"id": folder_id, "deleted": True}


# ── Manual scan ───────────────────────────────────────────────────────────────
@router.post("/{folder_id}/scan")
async def scan_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    folder = await db.monitored_folders.find_one({"id": folder_id, "user_id": current_user["id"]})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    file_count = count_files(folder["path"]) or folder.get("file_count", 0)

    # Re-analyze the folder path itself as a heuristic signal
    result = analyze_file(folder["path"])
    threat_count = 1 if result.score >= 35 else 0
    new_status = "warning" if threat_count > 0 else "protected"

    await db.monitored_folders.update_one(
        {"id": folder_id},
        {"$set": {
            "status": new_status,
            "threat_count": threat_count,
            "file_count": file_count,
            "last_scan": datetime.utcnow().isoformat(),
        }}
    )
    await log_event(db, "SCAN_INITIATED", "LOW", {
        "folder_id": folder_id, "path": folder["path"], "files_scanned": file_count
    })
    return {"folder_id": folder_id, "threat_count": threat_count, "file_count": file_count, "status": "complete"}


# ── Recent file events (Phase 8: create/modify/delete/rename) ──────────────────
@router.get("/events", response_model=List[FileEventOut])
async def list_file_events(
    limit: int = Query(50, le=200),
    folder_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {"user_id": current_user["id"]}
    if folder_id:
        query["folder_id"] = folder_id
    cursor = db.file_events.find(query).sort("timestamp", -1).limit(limit)
    docs = await cursor.to_list(None)
    for d in docs:
        d.pop("_id", None)
        d.pop("user_id", None)
    return docs


# ── Monitoring system status ────────────────────────────────────────────────
@router.get("/status")
async def monitor_status(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total = await db.monitored_folders.count_documents({"user_id": current_user["id"]})
    live = fs_monitor.active_count
    return {
        "total_folders": total,
        "live_watches": live,
        "watchdog_available": fs_monitor._event_callback is not None,
    }
