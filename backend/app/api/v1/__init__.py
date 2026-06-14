from fastapi import APIRouter
from .endpoints import auth, threats, backup, blockchain, monitor, mother_ai, notifications

router = APIRouter()
router.include_router(auth.router,          prefix="/auth",          tags=["Authentication"])
router.include_router(threats.router,       prefix="/threats",       tags=["Threats"])
router.include_router(backup.router,        prefix="/backup",        tags=["Backup"])
router.include_router(blockchain.router,    prefix="/blockchain",    tags=["Blockchain"])
router.include_router(monitor.router,       prefix="/monitor",       tags=["Folder Monitor"])
router.include_router(mother_ai.router,     prefix="/mother-ai",     tags=["Mother AI"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
