from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

from app.core.security import get_current_user, require_admin
from app.core.database import get_db
from app.core.rate_limit import rate_limit
from app.models.threat import ThreatCreate, ThreatDB, ThreatOut, ThreatUpdate
from app.services.threat_engine import analyze_file, ScanResult
from app.services.blockchain_service import log_event
from app.services.notification_service import create_notification

router = APIRouter()

# ── List threats ──────────────────────────────────────────────────────────────
@router.get("/", response_model=List[ThreatOut])
async def list_threats(
    level: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {}
    if level:
        query["level"] = level
    if status:
        query["status"] = status
    cursor = db.threats.find(query).sort("detected_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(None)
    return [ThreatOut(**{**d, "id": d.get("id", str(d.get("_id", "")))}) for d in docs]

# ── Get single threat ─────────────────────────────────────────────────────────
@router.get("/{threat_id}", response_model=ThreatOut)
async def get_threat(threat_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.threats.find_one({"id": threat_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Threat not found")
    return ThreatOut(**doc)

# ── Trigger AI scan ───────────────────────────────────────────────────────────
@router.post("/scan")
async def trigger_scan(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    scan_id = str(uuid.uuid4())
    background_tasks.add_task(_run_scan, scan_id, current_user["id"])
    return {"status": "started", "scan_id": scan_id, "message": "AI scan initiated in background"}

async def _run_scan(scan_id: str, user_id: str):
    """
    Background scan task — analyzes monitored folders.
    In production this would os.walk(folder["path"]) and analyze each file;
    here it checks a representative file per Downloads-type folder.

    Idempotency: if an unresolved threat for the same path already exists,
    it is not duplicated — repeated scans (the primary demo action) must
    not flood the Threat Center with copies of the same finding.
    """
    db = get_db()
    folders = await db.monitored_folders.find({"user_id": user_id}).to_list(None)
    total_new = 0
    for folder in folders:
        if "download" in folder.get("path", "").lower():
            candidate_path = f"{folder['path']}/suspicious_file.exe"

            existing = await db.threats.find_one({
                "path": candidate_path,
                "status": {"$ne": "resolved"},
            })
            if existing:
                continue  # already detected and still open — don't duplicate

            result = analyze_file(candidate_path, "a1b2c3d4")
            if result.score > 0:
                threat = ThreatDB(
                    name=f"Detected.{result.threat_type.replace('/', '_')}",
                    type=result.threat_type,
                    level=result.level,
                    score=result.score,
                    path=candidate_path,
                    hash=str(uuid.uuid4())[:24],
                    details="; ".join(result.indicators),
                    status="quarantined" if result.should_quarantine else "active",
                )
                await db.threats.insert_one(threat.model_dump())
                total_new += 1
                await log_event(db, "THREAT_DETECTED", result.level.upper(), {
                    "threat_id": threat.id, "score": threat.score, "path": threat.path
                })
                await create_notification(
                    db, user_id, "threat", threat.level,
                    f"{threat.level.title()} threat detected",
                    f"{threat.name} found at {threat.path} (score {threat.score}/100)",
                    metadata={"threat_id": threat.id},
                )
    await db.scan_history.insert_one({
        "scan_id": scan_id, "user_id": user_id,
        "completed_at": datetime.utcnow().isoformat(),
        "threats_found": total_new,
    })

# ── Analyze a specific file path ──────────────────────────────────────────────
class AnalyzePayload(BaseModel):
    path: str
    file_hash: str = ""

@router.post("/analyze")
async def analyze_single(
    payload: AnalyzePayload,
    current_user: dict = Depends(get_current_user),
):
    result = analyze_file(payload.path, payload.file_hash)
    return {
        "path": payload.path,
        "threat_type": result.threat_type,
        "level": result.level,
        "score": result.score,
        "confidence": result.confidence,
        "indicators": result.indicators,
        "recommendation": "Quarantine immediately" if result.should_quarantine else "Monitor",
    }

# ── Quarantine ────────────────────────────────────────────────────────────────
@router.put("/{threat_id}/quarantine")
async def quarantine_threat(
    threat_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    doc = await db.threats.find_one({"id": threat_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Threat not found")
    if doc["status"] == "quarantined":
        raise HTTPException(status_code=409, detail="Already quarantined")
    await db.threats.update_one(
        {"id": threat_id},
        {"$set": {"status": "quarantined", "quarantined_at": datetime.utcnow().isoformat()}}
    )
    background_tasks.add_task(log_event, db, "FILE_QUARANTINED", "HIGH", {
        "threat_id": threat_id, "name": doc["name"], "by": current_user["id"]
    })
    background_tasks.add_task(
        create_notification, db, current_user["id"], "threat", "high",
        "Threat quarantined", f"{doc['name']} has been isolated and quarantined.",
        {"threat_id": threat_id},
    )
    return {"id": threat_id, "status": "quarantined", "message": "Threat quarantined successfully"}

# ── Resolve ───────────────────────────────────────────────────────────────────
@router.put("/{threat_id}/resolve")
async def resolve_threat(
    threat_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    doc = await db.threats.find_one({"id": threat_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Threat not found")
    await db.threats.update_one(
        {"id": threat_id},
        {"$set": {"status": "resolved", "resolved_at": datetime.utcnow().isoformat()}}
    )
    return {"id": threat_id, "status": "resolved"}

# ── Dashboard score ───────────────────────────────────────────────────────────
@router.get("/summary/score")
async def threat_score(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total = await db.threats.count_documents({})
    active = await db.threats.count_documents({"status": "active"})
    critical = await db.threats.count_documents({"level": "critical", "status": {"$ne": "resolved"}})
    high = await db.threats.count_documents({"level": "high", "status": {"$ne": "resolved"}})
    # Score algorithm: weighted sum of unresolved threats
    score = min(100, critical * 20 + high * 10 + active * 5)
    level = "critical" if score >= 80 else "high" if score >= 60 else "medium" if score >= 30 else "low"

    # Total files under active monitoring (sum across this user's folders)
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {"_id": None, "total": {"$sum": "$file_count"}}},
    ]
    agg = await db.monitored_folders.aggregate(pipeline).to_list(None)
    scanned_files = agg[0]["total"] if agg else 0

    return {
        "score": score,
        "level": level,
        "total_threats": total,
        "active_threats": active,
        "critical_threats": critical,
        "scanned_files": scanned_files,
    }

# ── 7-day history ─────────────────────────────────────────────────────────────
@router.get("/summary/history")
async def threat_history(current_user: dict = Depends(get_current_user)):
    from datetime import timedelta
    db = get_db()
    days = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_str = day.strftime("%a")
        start = day.replace(hour=0, minute=0, second=0).isoformat()
        end = day.replace(hour=23, minute=59, second=59).isoformat()
        counts = {}
        for lvl in ("critical", "high", "medium", "low"):
            counts[lvl] = await db.threats.count_documents({
                "level": lvl, "detected_at": {"$gte": start, "$lte": end}
            })
        days.append({"date": day_str, **counts})
    return days
