from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
import csv, io
from app.core.security import get_current_user
from app.core.database import get_db
from app.services.blockchain_service import verify_chain

router = APIRouter()


@router.get("/logs")
async def get_logs(
    limit: int = Query(50, le=200),
    skip: int = 0,
    severity: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query = {}
    if severity:
        query["severity"] = severity.upper()
    cursor = db.blockchain_logs.find(query).sort("block_number", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(None)
    for log in logs:
        log.pop("_id", None)
    return logs


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    total = await db.blockchain_logs.count_documents({})
    last = await db.blockchain_logs.find_one(sort=[("block_number", -1)])
    integrity = await verify_chain(db)
    return {
        "total_records": total,
        "verified_blocks": total,
        "chain_integrity": integrity["integrity"],
        "last_block": last["block_number"] if last else 0,
        "is_valid": integrity["verified"],
    }


@router.get("/verify")
async def verify(current_user: dict = Depends(get_current_user)):
    db = get_db()
    return await verify_chain(db)


@router.get("/export")
async def export_audit_log(current_user: dict = Depends(get_current_user)):
    """Export the full audit trail as CSV — for compliance reporting."""
    db = get_db()
    logs = await db.blockchain_logs.find().sort("block_number", 1).to_list(None)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["block_number", "hash", "previous_hash", "event", "severity", "timestamp", "verified", "payload"])
    for log in logs:
        writer.writerow([
            log.get("block_number"), log.get("hash"), log.get("previous_hash"),
            log.get("event"), log.get("severity"), log.get("timestamp"),
            log.get("verified"), str(log.get("payload", {})),
        ])
    buf.seek(0)

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=beyonder_audit_log.csv"},
    )
