# Beyonder — System Architecture

## Overview
```
┌─────────────────────────────────────────┐
│           React Frontend (Vite)          │
│  Dashboard │ Threats │ AI │ Backup │ BC  │
└───────────────────┬─────────────────────┘
                    │ REST API + JWT
┌───────────────────▼─────────────────────┐
│            FastAPI Backend               │
│  /auth │ /threats │ /backup │ /monitor  │
│  /blockchain │ /mother-ai               │
└──────────┬──────────────┬───────────────┘
           │              │
    ┌──────▼──────┐  ┌────▼────────────────┐
    │   MongoDB   │  │   Mother AI Engine   │
    │  (Motor)    │  │  (Heuristic + ML)    │
    └─────────────┘  └─────────────────────┘
```

## Security Architecture
- JWT tokens with 24h expiry
- Bcrypt password hashing (cost factor 12)
- AES-256 encrypted backups
- Immutable blockchain audit logs
- Rate limiting on all API endpoints

## AI Pipeline
1. File hash check (signature DB)
2. Static analysis (entropy, strings, imports)
3. Behavioral heuristics (patterns)
4. Mother AI scoring (0-100)
5. Auto-action (quarantine if score > 70)

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Authenticate |
| GET | /api/v1/threats | List threats |
| POST | /api/v1/threats/scan | Trigger scan |
| PUT | /api/v1/threats/{id}/quarantine | Quarantine |
| GET | /api/v1/backup | List backups |
| POST | /api/v1/backup | Create backup |
| GET | /api/v1/blockchain/logs | Audit logs |
| GET | /api/v1/monitor | Folder list |
| POST | /api/v1/mother-ai/chat | AI chat |
