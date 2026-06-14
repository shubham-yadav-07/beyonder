"""Simple in-memory rate limiter using a sliding window."""
from collections import defaultdict, deque
from time import time
from fastapi import HTTPException, Request
from app.core.config import settings

_windows: dict = defaultdict(deque)

def _check(key: str, limit: int, window: int = 60):
    now = time()
    q = _windows[key]
    while q and q[0] < now - window:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")
    q.append(now)

def rate_limit(limit: int = None):
    """Returns a FastAPI dependency for rate limiting."""
    def _dep(request: Request):
        ip = request.client.host if request.client else "unknown"
        _check(f"{ip}:{request.url.path}", limit or settings.RATE_LIMIT_PER_MINUTE)
    return _dep
