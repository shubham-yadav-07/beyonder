import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from app.api.v1 import router as v1_router
from app.core.config import settings
from app.core.database import connect_db, close_db, get_db
from app.middleware.logging import log_requests
from app.services.fs_monitor import fs_monitor
from app.services.blockchain_service import log_event
from datetime import datetime
import uuid

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("beyonder")


async def _on_fs_event(folder_id: str, user_id: str, event_type: str, src_path: str, dest_path: str | None):
    """
    Callback invoked by FolderMonitorManager on real OS file events.
    Persists the event, updates folder stats, and runs threat analysis
    on created/modified files.
    """
    db = get_db()
    event_doc = {
        "id": str(uuid.uuid4()),
        "folder_id": folder_id,
        "user_id": user_id,
        "event_type": event_type,
        "path": src_path,
        "dest_path": dest_path,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.file_events.insert_one(event_doc)

    severity_map = {
        "created": "LOW", "modified": "LOW", "deleted": "INFO", "renamed": "INFO"
    }
    await log_event(db, f"FILE_{event_type.upper()}", severity_map.get(event_type, "LOW"), {
        "path": src_path, "dest_path": dest_path, "folder_id": folder_id,
    })

    # Run threat analysis on new/modified files
    if event_type in ("created", "modified"):
        from app.services.threat_engine import analyze_file
        result = analyze_file(src_path)
        if result.score >= 35:
            from app.models.threat import ThreatDB
            threat = ThreatDB(
                name=f"Detected.{result.threat_type.replace('/', '_')}",
                type=result.threat_type,
                level=result.level,
                score=result.score,
                path=src_path,
                hash=str(uuid.uuid4())[:24],
                details="; ".join(result.indicators),
                status="quarantined" if result.should_quarantine else "active",
            )
            await db.threats.insert_one(threat.model_dump())
            await log_event(db, "THREAT_DETECTED", result.level.upper(), {
                "threat_id": threat.id, "score": threat.score, "path": src_path,
            })
            await db.monitored_folders.update_one(
                {"id": folder_id},
                {"$inc": {"threat_count": 1}, "$set": {"status": "warning"}}
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    fs_monitor.set_callback(_on_fs_event)

    # Seed demo admin + baseline data — ensures the app is never empty on first run
    from app.services.seed_data import run_all_seeds
    db = get_db()
    await run_all_seeds(db)

    # Re-attach live watches for folders that exist on this host (after restart)
    folders = await db.monitored_folders.find({}).to_list(None)
    for f in folders:
        fs_monitor.watch(f["id"], f["user_id"], f["path"])

    logger.info(f"Beyonder API started — {fs_monitor.active_count} live folder watches active")
    yield
    fs_monitor.stop_all()
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Cybersecurity Platform — SIH 2025",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.middleware("http")(log_requests)

app.include_router(v1_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health():
    from app.core.database import db_instance
    db_status = "connected" if db_instance.db is not None else "disconnected"
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "database": db_status,
        "live_folder_watches": fs_monitor.active_count,
    }


@app.exception_handler(Exception)
async def global_error_handler(request, exc):
    logger.exception(f"Unhandled error: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
