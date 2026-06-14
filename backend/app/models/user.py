from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import datetime
import uuid

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["admin", "user"] = "user"

class UserDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    hashed_password: str
    role: Literal["admin", "user"] = "user"
    is_active: bool = True
    failed_logins: int = 0
    locked_until: Optional[datetime] = None
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
