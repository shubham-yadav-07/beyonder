from pydantic import BaseModel, Field
from typing import Literal, Optional, List
from datetime import datetime
import uuid


class BackupCreate(BaseModel):
    name: str
    type: Literal["full", "incremental", "selective", "snapshot"]
    paths: List[str] = []


class BackupDB(BackupCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["running", "complete", "failed"] = "running"
    size_bytes: Optional[int] = None
    file_count: Optional[int] = None
    encrypted: bool = True
    blockchain_hash: Optional[str] = None
    checksum: Optional[str] = None             # SHA-256 of the manifest — for validation
    parent_backup_id: Optional[str] = None      # set for incremental backups
    delta_pct: Optional[float] = None           # % of full size, for incremental
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class BackupOut(BackupDB):
    pass


class RecoveryLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    backup_id: str
    user_id: str
    status: Literal["validating", "restoring", "complete", "failed"] = "validating"
    files_restored: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    checksum_verified: bool = False
    error: Optional[str] = None
