from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

ThreatLevel = Literal["critical", "high", "medium", "low"]
ThreatStatus = Literal["active", "quarantined", "resolved"]

class ThreatCreate(BaseModel):
    name: str
    type: str
    level: ThreatLevel
    score: int = Field(ge=0, le=100)
    path: str
    hash: str
    details: str

class ThreatDB(ThreatCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: ThreatStatus = "active"
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    quarantined_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class ThreatOut(ThreatDB):
    pass

class ThreatUpdate(BaseModel):
    status: Optional[ThreatStatus] = None
