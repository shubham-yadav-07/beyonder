from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
import uuid

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: Literal["threat", "backup", "system", "ai"]
    severity: Literal["critical", "high", "medium", "low", "info"]
    title: str
    message: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[dict] = None
