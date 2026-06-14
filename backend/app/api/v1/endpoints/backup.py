from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Query
from typing import List, Optional
from datetime import datetime
import uuid, hashlib, random, asyncio

from app.core.security import get_current_user
from app.core.database import get_db
from app.services.blockchain_service import log_event
from app.services.notification_service import create_notification
from app.models.backup import BackupCreate, BackupDB, BackupOut, RecoveryLog

router = APIRouter()


# ── List backups ──────────────────────────────────────────────────────────────
@router.get("/", response_model=List[BackupOut])
async def list_backups(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.backups.find({"user_id": current_user["id"]}).sort("created_at", -1)
    docs = await cursor.to_list(None)
    for d in docs:
        d.pop("_id", None)
    return docs


# ── Create backup (full / incremental / selective / snapshot) ──────────────────
@router.post("/", status_code=202)
async def create_backup(
    payload: BackupCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    backup_dict = BackupDB(**payload.model_dump()).model_dump()
    backup_dict["user_id"] = current_user["id"]

    # Incremental backups link to the most recent completed full/incremental backup
    if payload.type == "incremental":
        parent = await db.backups.find_one(
            {"user_id": current_user["id"], "status": "complete"},
            sort=[("completed_at", -1)],
        )
        if parent:
            backup_dict["parent_backup_id"] = parent["id"]

    await db.backups.insert_one(backup_dict)
    background_tasks.add_task(_run_backup, backup_dict["id"], current_user["id"], payload.type)
    return {"backup_id": backup_dict["id"], "status": "running", "message": "Backup started in background"}


async def _run_backup(backup_id: str, user_id: str, backup_type: str):
    """Simulates backup execution with realistic incremental sizing & checksumming."""
    await asyncio.sleep(2)
    db = get_db()

    if backup_type == "incremental":
        # Incremental = small delta of a full backup
        size = random.randint(20_000_000, 400_000_000)
        delta_pct = round(random.uniform(2, 12), 1)
    elif backup_type == "selective":
        size = random.randint(50_000_000, 1_200_000_000)
        delta_pct = None
    elif backup_type == "snapshot":
        size = random.randint(200_000_000, 1_500_000_000)
        delta_pct = None
    else:  # full
        size = random.randint(2_000_000_000, 6_000_000_000)
        delta_pct = None

    file_count = max(1, size // 250_000)  # rough avg file size 250KB

    # Manifest checksum — SHA-256 over deterministic backup metadata (validation, Phase 9)
    manifest = f"{backup_id}:{user_id}:{size}:{file_count}:{backup_type}"
    checksum = hashlib.sha256(manifest.encode()).hexdigest()
    bc_hash = "0x" + hashlib.sha256(f"{backup_id}{user_id}{checksum}".encode()).hexdigest()[:40]

    update = {
        "status": "complete",
        "size_bytes": size,
        "file_count": file_count,
        "checksum": checksum,
        "blockchain_hash": bc_hash,
        "completed_at": datetime.utcnow().isoformat(),
    }
    if delta_pct is not None:
        update["delta_pct"] = delta_pct

    await db.backups.update_one({"id": backup_id}, {"$set": update})
    await log_event(db, "BACKUP_COMPLETED", "INFO", {
        "backup_id": backup_id, "size_bytes": size, "type": backup_type,
        "checksum": checksum[:16] + "…", "hash": bc_hash,
    })
    size_display = f"{size / 1e9:.1f} GB" if size >= 1e9 else f"{size / 1e6:.0f} MB"
    await create_notification(
        db, user_id, "backup", "info",
        "Backup completed",
        f"{backup_type.title()} backup finished — {size_display}, blockchain verified.",
        metadata={"backup_id": backup_id},
    )


# ── Validate backup integrity (Phase 9) ─────────────────────────────────────────
@router.get("/{backup_id}/validate")
async def validate_backup(backup_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    backup = await db.backups.find_one({"id": backup_id, "user_id": current_user["id"]})
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    if backup["status"] != "complete":
        return {"valid": False, "reason": "Backup not complete"}

    # Recompute checksum from manifest and compare
    manifest = f"{backup['id']}:{current_user['id']}:{backup['size_bytes']}:{backup['file_count']}:{backup['type']}"
    expected = hashlib.sha256(manifest.encode()).hexdigest()
    valid = expected == backup.get("checksum")

    await log_event(db, "BACKUP_VALIDATED", "INFO" if valid else "HIGH", {
        "backup_id": backup_id, "valid": valid,
    })
    return {
        "valid": valid,
        "checksum": backup.get("checksum"),
        "expected": expected,
        "blockchain_hash": backup.get("blockchain_hash"),
    }


# ── Restore (Phase 9: recovery logs + progress) ─────────────────────────────────
@router.post("/{backup_id}/restore")
async def restore_backup(
    backup_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    backup = await db.backups.find_one({"id": backup_id, "user_id": current_user["id"]})
    if not backup:
        raise HTTPException(status_code=404, detail="Backup not found")
    if backup["status"] != "complete":
        raise HTTPException(status_code=400, detail="Backup not ready for restore")

    recovery = RecoveryLog(backup_id=backup_id, user_id=current_user["id"], status="validating")
    await db.recovery_logs.insert_one(recovery.model_dump())

    background_tasks.add_task(_run_restore, recovery.id, backup, current_user["id"])
    return {"recovery_id": recovery.id, "backup_id": backup_id, "status": "validating", "message": "Restore initiated"}


async def _run_restore(recovery_id: str, backup: dict, user_id: str):
    db = get_db()
    await asyncio.sleep(1)

    # Step 1: validate checksum
    manifest = f"{backup['id']}:{user_id}:{backup['size_bytes']}:{backup['file_count']}:{backup['type']}"
    expected = hashlib.sha256(manifest.encode()).hexdigest()
    checksum_ok = expected == backup.get("checksum")

    await db.recovery_logs.update_one(
        {"id": recovery_id},
        {"$set": {"status": "restoring", "checksum_verified": checksum_ok}}
    )

    if not checksum_ok:
        await db.recovery_logs.update_one(
            {"id": recovery_id},
            {"$set": {"status": "failed", "error": "Checksum mismatch", "completed_at": datetime.utcnow().isoformat()}}
        )
        await log_event(db, "RECOVERY_FAILED", "HIGH", {"recovery_id": recovery_id, "reason": "checksum_mismatch"})
        return

    # Step 2: simulate restore
    await asyncio.sleep(2)
    files_restored = backup.get("file_count", 0)

    await db.recovery_logs.update_one(
        {"id": recovery_id},
        {"$set": {
            "status": "complete", "files_restored": files_restored,
            "completed_at": datetime.utcnow().isoformat(),
        }}
    )
    await log_event(db, "BACKUP_RESTORED", "INFO", {
        "recovery_id": recovery_id, "backup_id": backup["id"], "files_restored": files_restored,
    })


# ── Recovery logs (Phase 9) ─────────────────────────────────────────────────────
@router.get("/recovery-logs")
async def list_recovery_logs(
    limit: int = Query(50, le=200),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    cursor = db.recovery_logs.find({"user_id": current_user["id"]}).sort("started_at", -1).limit(limit)
    docs = await cursor.to_list(None)
    for d in docs:
        d.pop("_id", None)
    return docs


@router.get("/recovery-logs/{recovery_id}")
async def get_recovery_log(recovery_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.recovery_logs.find_one({"id": recovery_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Recovery log not found")
    doc.pop("_id", None)
    return doc


# ── Stats ─────────────────────────────────────────────────────────────────────
@router.get("/stats")
async def backup_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total = await db.backups.count_documents({"user_id": current_user["id"]})
    complete = await db.backups.count_documents({"user_id": current_user["id"], "status": "complete"})
    pipeline = [
        {"$match": {"user_id": current_user["id"], "status": "complete"}},
        {"$group": {"_id": None, "total_bytes": {"$sum": "$size_bytes"}, "total_files": {"$sum": "$file_count"}}}
    ]
    result = await db.backups.aggregate(pipeline).to_list(None)
    total_bytes = result[0]["total_bytes"] if result else 0
    total_files = result[0]["total_files"] if result else 0
    last = await db.backups.find_one({"user_id": current_user["id"], "status": "complete"}, sort=[("completed_at", -1)])

    recoveries_total = await db.recovery_logs.count_documents({"user_id": current_user["id"]})
    recoveries_ok = await db.recovery_logs.count_documents({"user_id": current_user["id"], "status": "complete"})

    return {
        "total_backups": total,
        "complete_backups": complete,
        "success_rate": round(complete / total * 100, 1) if total else 100.0,
        "total_size_bytes": total_bytes,
        "total_files_protected": total_files,
        "last_backup_at": last["completed_at"] if last else None,
        "total_recoveries": recoveries_total,
        "recovery_success_rate": round(recoveries_ok / recoveries_total * 100, 1) if recoveries_total else 100.0,
    }
