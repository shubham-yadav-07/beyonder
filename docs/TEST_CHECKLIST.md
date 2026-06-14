# Beyonder v1.2 — Final Test Checklist

## ✅ Automated Tests (run with: `python3 test_app.py` / `test_http.py`)

### Backend Smoke Tests (22 checks — all passing)
- [x] DB indexes created with mongomock
- [x] Seed data inserted (8 threats, 4 folders, 2 backups, 11 chain blocks)
- [x] Seed is idempotent (running twice doesn't duplicate data)
- [x] Password hashing != plaintext
- [x] Correct password verifies
- [x] Wrong password rejected
- [x] Access token decodes correctly
- [x] Refresh token decodes correctly
- [x] Access token rejected when used as refresh token (security)
- [x] Threat engine flags high-entropy ransomware-pattern file (score ≥ 70)
- [x] Threat engine clears benign .docx file (score < 35)
- [x] Pattern analysis returns real data from DB
- [x] Risk prediction returns trend direction
- [x] Historical summary returns correct threat count
- [x] Similarity search runs without error
- [x] Blockchain verifies as valid after seeding
- [x] Tampered block detected (content_tampered reason)
- [x] Chain valid again after restoring tampered block
- [x] Backup checksum matches recomputed manifest

### HTTP API Tests (47 checks — all passing)
- [x] GET /health → 200
- [x] POST /auth/login → 200 (form-encoded)
- [x] Login returns access_token + refresh_token + user object
- [x] Login with wrong password → 401
- [x] GET /threats without token → 401/403
- [x] GET /threats with token → 200, 8 results
- [x] GET /threats/summary/score → 200 with score field
- [x] GET /threats/summary/history → 200
- [x] POST /threats/scan → 200/202
- [x] PUT /threats/{id}/quarantine → 200
- [x] GET /monitor/ → 200, 4 folders
- [x] POST /monitor/ → 201 (new folder)
- [x] POST /monitor/ duplicate → 409
- [x] POST /monitor/ empty path → 422
- [x] POST /monitor/{id}/scan → 200
- [x] GET /monitor/status → 200
- [x] GET /monitor/events → 200
- [x] DELETE /monitor/{id} → 200
- [x] GET /backup/ → 200, 2 backups
- [x] GET /backup/stats → 200
- [x] GET /backup/{id}/validate → 200, valid=True
- [x] POST /backup/ → 202
- [x] GET /backup/recovery-logs → 200
- [x] GET /blockchain/logs → 200, non-empty
- [x] GET /blockchain/stats → 200
- [x] GET /blockchain/verify → 200, verified=True
- [x] GET /blockchain/export → 200, CSV content-type
- [x] POST /mother-ai/chat (status intent) → 200
- [x] POST /mother-ai/chat (patterns intent) → 200
- [x] POST /mother-ai/chat (analyze_path intent) → 200
- [x] GET /mother-ai/stats → 200
- [x] GET /mother-ai/patterns → 200
- [x] GET /mother-ai/predict → 200
- [x] GET /notifications/ → 200
- [x] Notification created from quarantine action
- [x] Unread count ≥ 1 after quarantine
- [x] PUT /notifications/{id}/read → 200
- [x] PUT /notifications/mark-all-read → 200
- [x] Unread count == 0 after mark-all-read
- [x] POST /auth/refresh → 200, new access_token
- [x] GET /auth/me → 200
- [x] GET /threats with bad token → 401

### Scan Stability Test
- [x] 3 repeated scans: threats go 8→9→9→9 (stable after first detection, no duplicates)

---

## 🔍 Manual Frontend Checklist

### Login
- [ ] Form shows pre-filled demo credentials
- [ ] Wrong password shows inline error (not page redirect)
- [ ] Network error shows "Cannot reach server…" (not "Invalid credentials")
- [ ] Loading spinner shown while authenticating
- [ ] Theme toggle works on login page

### Dashboard
- [ ] Stats load with skeleton placeholders (no layout shift)
- [ ] Threat score shows with correct color (green for low)
- [ ] Area chart renders 7-day history
- [ ] Radial risk score renders correctly
- [ ] "Run Scan" button shows spinner during scan
- [ ] Recent threats list populated (8 rows)
- [ ] Distribution bar chart shows 4 bars

### ThreatCenter
- [ ] All 8 seeded threats visible
- [ ] Severity filter buttons work
- [ ] Search filters by name and path
- [ ] Expanding a threat shows AI analysis + file hash
- [ ] "Quarantine" button appears on active threats
- [ ] After quarantine: status badge changes, notification bell increments
- [ ] Level cards show correct counts (2 critical, 1 high, 1 medium, 1 low)

### FolderMonitor
- [ ] 4 seeded folders visible
- [ ] Status badges correct (3 protected, 1 warning)
- [ ] Adding a folder with empty path shows no API call
- [ ] Adding a real folder creates a new row
- [ ] Duplicate path shows toast "already monitored"
- [ ] Live event feed panel visible (may be empty if no real folder added)
- [ ] Scan button appears on hover

### BackupRecovery
- [ ] 2 backups visible (1 full, 1 incremental)
- [ ] Incremental shows GitBranch icon + delta%
- [ ] New Backup form opens/closes correctly
- [ ] Incremental option disabled when no full backup exists (should be enabled here)
- [ ] Validate button shows on hover → success toast
- [ ] Restore button shows on hover → Recovery Logs panel updates
- [ ] Stats: 2 backups, correct storage, last backup time

### BlockchainLogs
- [ ] 11+ log entries visible
- [ ] Severity filter works
- [ ] Chain visualization shows blocks with links
- [ ] Verify Chain → success toast with block count
- [ ] Copy hash button appears on hover
- [ ] Export CSV triggers download

### MotherAI
- [ ] Initial message shows correctly formatted with markdown
- [ ] Quick prompt "System Status" sends and gets response
- [ ] Quick prompt "Show Patterns" works
- [ ] Quick prompt "Predict Risk" works
- [ ] Typing in chat input and pressing Enter sends message
- [ ] Typing indicator (3 bouncing dots) shows while waiting
- [ ] Clear button resets chat
- [ ] File path analysis: type "analyze C:/test.exe" → get score + indicators

### Analytics
- [ ] KPI cards load with real data
- [ ] Area chart shows 7-day threat trend
- [ ] Pie chart shows threat categories with labels
- [ ] Security score line chart shows 6-month history
- [ ] Response time bar chart shows detect vs quarantine
- [ ] Stats row shows correct file/threat counts

### Settings
- [ ] Theme toggle in profile card works
- [ ] All toggles respond immediately
- [ ] Save Changes shows ✓ Saved! then reverts
- [ ] Reload page → toggles retain their state (persistence check)
- [ ] Reset Defaults resets all toggles
- [ ] Password form validates empty fields
- [ ] Password mismatch shows toast error

### Responsive
- [ ] On mobile (< 768px): sidebar hidden, hamburger visible
- [ ] Hamburger opens mobile drawer
- [ ] Nav item click closes mobile drawer
- [ ] Grid layouts collapse correctly on mobile
- [ ] Charts render without overflow on mobile

### Dark/Light Theme
- [ ] Toggle switches theme instantly
- [ ] Theme persists across page refresh (no flash)
- [ ] All pages look correct in both themes
- [ ] Charts visible in both themes (axes, grid lines)

### Error States
- [ ] Disconnected backend: login shows "Cannot reach server"
- [ ] No data: empty state shows icon + message (not blank)
- [ ] Loading: skeleton loaders (not blank)

---

## 🗄 Database Checklist

- [ ] MongoDB running before starting the API
- [ ] `beyonder` database created automatically on first start
- [ ] Demo user exists: `db.users.findOne({email:"admin@beyonder.io"})`
- [ ] 8 threats exist: `db.threats.countDocuments({})` == 8
- [ ] 4 folders exist: `db.monitored_folders.countDocuments({})` == 4
- [ ] 2 backups exist: `db.backups.countDocuments({})` == 2
- [ ] 11+ blockchain blocks: `db.blockchain_logs.countDocuments({})` >= 11
- [ ] Blockchain chain valid: `verify_chain()` returns `verified: true`

---

## 🎭 SIH Demo Checklist (Run This Before Entering the Room)

### 30 Minutes Before
- [ ] `mongod` running (check: `mongo --eval "db.stats()"`)
- [ ] Backend running: `uvicorn app.main:app --port 8000` (NOT `--reload` during demo)
- [ ] Frontend running: `npm run dev`
- [ ] Open http://localhost:3000 → dashboard loads with data
- [ ] Login works: admin@beyonder.io / demo1234
- [ ] Notification bell shows 0 (clean slate)
- [ ] All 8 threats visible in ThreatCenter
- [ ] Blockchain verify → 100% integrity
- [ ] Mother AI responds to "system status"

### During Demo (5-minute flow)
1. Dashboard → show risk score + charts (30s)
2. ThreatCenter → Run AI Scan → quarantine Trojan (60s)
3. FolderMonitor → add a real local folder (30s)
4. MotherAI → "show patterns" → "predict risk" → "analyze C:/test/crack.exe" (90s)
5. BlockchainLogs → Verify Chain → Export CSV (30s)
6. Toggle to light mode (10s)

### Common Demo Killers (prevent these)
- [ ] Backend NOT started → login hangs then shows connection error
- [ ] MongoDB NOT running → backend crashes on start with clear error message (fixed)
- [ ] Token expired mid-demo → auto-refresh handles this transparently
- [ ] Clicking "Run Scan" 3x → now idempotent, shows same 1 new detection

