from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_refresh_token, get_current_user,
)
from app.core.database import get_db
from app.core.rate_limit import rate_limit
from app.models.user import UserCreate, UserOut, UserDB
from app.services.notification_service import create_notification
import uuid

router = APIRouter()

MAX_FAILED_LOGINS = 5  # lock after 5 failed attempts

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 1800   # 30 min in seconds
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=UserOut, status_code=201,
             dependencies=[Depends(rate_limit(10))])
async def register(payload: UserCreate):
    db = get_db()
    if await db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = UserDB(
        id=str(uuid.uuid4()),
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    await db.users.insert_one(user.model_dump())
    return UserOut(**user.model_dump())

# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse,
             dependencies=[Depends(rate_limit(10))])
async def login(form: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user_doc = await db.users.find_one({"email": form.username})

    # Account lockout check
    if user_doc:
        locked_until = user_doc.get("locked_until")
        if locked_until and datetime.fromisoformat(str(locked_until)) > datetime.now(timezone.utc):
            raise HTTPException(status_code=423, detail="Account temporarily locked. Try again later.")

    if not user_doc or not verify_password(form.password, user_doc["hashed_password"]):
        if user_doc:
            fails = user_doc.get("failed_logins", 0) + 1
            update = {"failed_logins": fails}
            if fails >= MAX_FAILED_LOGINS:
                from datetime import timedelta
                update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
                await create_notification(
                    db, user_doc["id"], "system", "high",
                    "Account temporarily locked",
                    f"{MAX_FAILED_LOGINS} failed login attempts detected. "
                    f"Account locked for 15 minutes as a security precaution.",
                )
            await db.users.update_one({"email": form.username}, {"$set": update})
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Reset failed logins on success
    await db.users.update_one(
        {"email": form.username},
        {"$set": {"failed_logins": 0, "locked_until": None, "last_login": datetime.utcnow().isoformat()}}
    )

    token_data = {"sub": user_doc["id"], "role": user_doc["role"]}
    access = create_access_token(token_data)
    refresh = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user={k: v for k, v in user_doc.items() if k not in ("hashed_password", "failed_logins", "locked_until", "_id")}
    )

# ── Refresh ───────────────────────────────────────────────────────────────────
@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    payload = decode_refresh_token(body.refresh_token)
    new_access = create_access_token({"sub": payload["sub"], "role": payload.get("role", "user")})
    return {"access_token": new_access, "token_type": "bearer", "expires_in": 1800}

# ── Me ────────────────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_doc = await db.users.find_one({"id": current_user["id"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**user_doc)

# ── Change password ───────────────────────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_doc = await db.users.find_one({"id": current_user["id"]})
    if not verify_password(body.current_password, user_doc["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"hashed_password": hash_password(body.new_password)}}
    )
    return {"message": "Password updated successfully"}
