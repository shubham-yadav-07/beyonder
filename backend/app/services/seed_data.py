"""
Seed Data Service
Ensures a demo admin account and baseline data exist on first run,
so the dashboard is never empty during a live demo (Phase 16 fix:
"Demo Risk — empty state on fresh database").

Idempotent: safe to call on every startup.
"""
import logging
from datetime import datetime, timedelta
import uuid

from app.core.security import hash_password
from app.services.blockchain_service import log_event

logger = logging.getLogger("beyonder.seed")

DEMO_EMAIL = "admin@beyonder.io"
DEMO_PASSWORD = "demo1234"


async def seed_demo_user(db) -> str:
    """Create the default demo admin user if no users exist. Returns user_id."""
    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if existing:
        return existing["id"]

    user_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": user_id,
        "name": "Techvision Admin",
        "email": DEMO_EMAIL,
        "hashed_password": hash_password(DEMO_PASSWORD),
        "role": "admin",
        "is_active": True,
        "failed_logins": 0,
        "locked_until": None,
        "last_login": None,
        "created_at": datetime.utcnow().isoformat(),
    })
    logger.info(f"Seeded demo admin user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    return user_id


async def seed_demo_threats(db, user_id: str):
    """Seed a realistic set of threats spanning the last 7 days, if none exist."""
    if await db.threats.count_documents({}) > 0:
        return

    now = datetime.utcnow()
    threats = [
        {
            "id": str(uuid.uuid4()), "name": "WannaCry.v3.ransomware", "type": "Ransomware",
            "level": "critical", "score": 97, "path": "C:/Users/Admin/Downloads/crack.exe",
            "hash": "a1b2c3d4e5f6789012345678", "status": "quarantined",
            "details": "Ransomware filename pattern: crack.; High-risk directory: \\Downloads\\; High filename entropy: 4.8 bits",
            "detected_at": (now - timedelta(minutes=12)).isoformat(),
            "quarantined_at": (now - timedelta(minutes=11)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "Keylogger.Agent.XZ", "type": "Keylogger/Spyware",
            "level": "critical", "score": 94, "path": "C:/Windows/System32/svchost32.exe",
            "hash": "b2c3d4e5f67890123456789a", "status": "quarantined",
            "details": "System process masquerade detected; Keylogger pattern: spy",
            "detected_at": (now - timedelta(hours=2)).isoformat(),
            "quarantined_at": (now - timedelta(hours=2) + timedelta(minutes=1)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "Trojan.GenericKD.47", "type": "Trojan",
            "level": "high", "score": 81, "path": "C:/Temp/update_patch.dll",
            "hash": "c3d4e5f67890123456789abc", "status": "active",
            "details": "Trojan filename pattern: update_patch; High-risk directory: /tmp/",
            "detected_at": (now - timedelta(minutes=18)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "Adware.Bundlore", "type": "Adware/PUP",
            "level": "medium", "score": 54, "path": "C:/Users/Admin/AppData/free_tool.exe",
            "hash": "d4e5f67890123456789abcde", "status": "resolved",
            "details": "High-risk directory: \\AppData\\Roaming\\",
            "detected_at": (now - timedelta(days=1, hours=3)).isoformat(),
            "resolved_at": (now - timedelta(days=1, hours=2)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "PUP.Optional.Toolbar", "type": "Adware/PUP",
            "level": "low", "score": 22, "path": "C:/Program Files/browser_ext.dll",
            "hash": "e5f67890123456789abcdef0", "status": "resolved",
            "details": "Minor entropy deviation in filename",
            "detected_at": (now - timedelta(days=2)).isoformat(),
            "resolved_at": (now - timedelta(days=2) + timedelta(hours=1)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "Trojan.Downloader.Gen", "type": "Trojan",
            "level": "high", "score": 76, "path": "C:/Users/Admin/Downloads/setup_142.exe",
            "hash": "f6789012345abcdef0123456", "status": "resolved",
            "details": "Trojan filename pattern: setup_142; High-risk directory: \\Downloads\\",
            "detected_at": (now - timedelta(days=3, hours=5)).isoformat(),
            "resolved_at": (now - timedelta(days=3, hours=4)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "Ransom.Locky.Variant", "type": "Ransomware",
            "level": "critical", "score": 91, "path": "C:/Users/Admin/Documents/invoice.locked",
            "hash": "0123456789abcdef0123456a", "status": "resolved",
            "details": "Ransomware filename pattern: .locked$",
            "detected_at": (now - timedelta(days=4, hours=8)).isoformat(),
            "resolved_at": (now - timedelta(days=4, hours=7)).isoformat(),
        },
        {
            "id": str(uuid.uuid4()), "name": "Spyware.KeyHook.B", "type": "Keylogger/Spyware",
            "level": "high", "score": 73, "path": "C:/Users/Admin/AppData/Roaming/hook32.dll",
            "hash": "123456789abcdef0123456ab", "status": "resolved",
            "details": "Keylogger pattern: hook; High-risk directory: \\AppData\\Roaming\\",
            "detected_at": (now - timedelta(days=5, hours=2)).isoformat(),
            "resolved_at": (now - timedelta(days=5, hours=1)).isoformat(),
        },
    ]
    await db.threats.insert_many(threats)
    logger.info(f"Seeded {len(threats)} demo threats")


async def seed_demo_folders(db, user_id: str):
    if await db.monitored_folders.count_documents({"user_id": user_id}) > 0:
        return
    now = datetime.utcnow()
    folders = [
        {"id": str(uuid.uuid4()), "path": "C:/Users/Admin/Documents", "label": "Documents",
         "status": "protected", "file_count": 1247, "threat_count": 0,
         "last_scan": (now - timedelta(minutes=2)).isoformat(), "user_id": user_id,
         "created_at": (now - timedelta(days=10)).isoformat()},
        {"id": str(uuid.uuid4()), "path": "C:/Users/Admin/Downloads", "label": "Downloads",
         "status": "warning", "file_count": 89, "threat_count": 2,
         "last_scan": (now - timedelta(minutes=5)).isoformat(), "user_id": user_id,
         "created_at": (now - timedelta(days=10)).isoformat()},
        {"id": str(uuid.uuid4()), "path": "C:/Program Files", "label": "Program Files",
         "status": "protected", "file_count": 8341, "threat_count": 0,
         "last_scan": (now - timedelta(minutes=12)).isoformat(), "user_id": user_id,
         "created_at": (now - timedelta(days=10)).isoformat()},
        {"id": str(uuid.uuid4()), "path": "C:/Windows/System32", "label": "System32",
         "status": "protected", "file_count": 4129, "threat_count": 0,
         "last_scan": (now - timedelta(hours=1)).isoformat(), "user_id": user_id,
         "created_at": (now - timedelta(days=10)).isoformat()},
    ]
    await db.monitored_folders.insert_many(folders)
    logger.info(f"Seeded {len(folders)} demo folders")


async def seed_demo_backups(db, user_id: str):
    if await db.backups.count_documents({"user_id": user_id}) > 0:
        return
    import hashlib
    now = datetime.utcnow()

    full_id = str(uuid.uuid4())
    full_manifest = f"{full_id}:{user_id}:5700000000:22800:full"
    full_checksum = hashlib.sha256(full_manifest.encode()).hexdigest()

    inc_id = str(uuid.uuid4())
    inc_manifest = f"{inc_id}:{user_id}:340000000:1360:incremental"
    inc_checksum = hashlib.sha256(inc_manifest.encode()).hexdigest()

    backups = [
        {
            "id": full_id, "name": "Weekly Full Backup", "type": "full", "paths": [],
            "status": "complete", "size_bytes": 5_700_000_000, "file_count": 22800,
            "encrypted": True, "checksum": full_checksum,
            "blockchain_hash": "0x" + hashlib.sha256(f"{full_id}{user_id}{full_checksum}".encode()).hexdigest()[:40],
            "parent_backup_id": None, "delta_pct": None,
            "created_at": (now - timedelta(days=2)).isoformat(),
            "completed_at": (now - timedelta(days=2) + timedelta(minutes=18)).isoformat(),
            "user_id": user_id,
        },
        {
            "id": inc_id, "name": "Incremental Backup", "type": "incremental", "paths": [],
            "status": "complete", "size_bytes": 340_000_000, "file_count": 1360,
            "encrypted": True, "checksum": inc_checksum,
            "blockchain_hash": "0x" + hashlib.sha256(f"{inc_id}{user_id}{inc_checksum}".encode()).hexdigest()[:40],
            "parent_backup_id": full_id, "delta_pct": 6.0,
            "created_at": (now - timedelta(minutes=12)).isoformat(),
            "completed_at": (now - timedelta(minutes=10)).isoformat(),
            "user_id": user_id,
        },
    ]
    await db.backups.insert_many(backups)
    logger.info(f"Seeded {len(backups)} demo backups")


async def seed_blockchain_genesis(db):
    """Seed initial blockchain blocks if the chain is empty."""
    if await db.blockchain_logs.count_documents({}) > 0:
        return
    events = [
        ("SYSTEM_INITIALIZED", "INFO", {"version": "1.1.0"}),
        ("AI_MODEL_LOADED", "INFO", {"model": "mother-ai-v3.1.7", "signatures": 2300000}),
        ("FOLDER_ADDED", "INFO", {"path": "C:/Users/Admin/Documents"}),
        ("FOLDER_ADDED", "INFO", {"path": "C:/Users/Admin/Downloads"}),
        ("SCAN_INITIATED", "LOW", {"triggered_by": "schedule"}),
        ("THREAT_DETECTED", "CRITICAL", {"name": "WannaCry.v3.ransomware", "score": 97}),
        ("FILE_QUARANTINED", "HIGH", {"path": "C:/Users/Admin/Downloads/crack.exe"}),
        ("THREAT_DETECTED", "CRITICAL", {"name": "Keylogger.Agent.XZ", "score": 94}),
        ("FILE_QUARANTINED", "HIGH", {"path": "C:/Windows/System32/svchost32.exe"}),
        ("BACKUP_COMPLETED", "INFO", {"type": "full", "size_bytes": 5_700_000_000}),
        ("BACKUP_COMPLETED", "INFO", {"type": "incremental", "size_bytes": 340_000_000}),
    ]
    for event, severity, payload in events:
        await log_event(db, event, severity, payload)
    logger.info(f"Seeded {len(events)} genesis blockchain blocks")


async def run_all_seeds(db):
    """Run all idempotent seed routines. Call once at startup."""
    user_id = await seed_demo_user(db)
    await seed_demo_threats(db, user_id)
    await seed_demo_folders(db, user_id)
    await seed_demo_backups(db, user_id)
    await seed_blockchain_genesis(db)
    return user_id
