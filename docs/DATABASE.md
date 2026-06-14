# Beyonder Database Schema (MongoDB)

## Collections

### users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "hashed_password": "string",
  "role": "admin | user",
  "created_at": "datetime",
  "last_login": "datetime"
}
```

### threats
```json
{
  "_id": "ObjectId",
  "name": "string",
  "type": "Ransomware | Trojan | Adware | Spyware | PUP",
  "level": "critical | high | medium | low",
  "score": "int (0-100)",
  "path": "string",
  "hash": "string (MD5/SHA256)",
  "detected_at": "datetime",
  "status": "active | quarantined | resolved",
  "details": "string",
  "ai_confidence": "float"
}
```

### backups
```json
{
  "_id": "ObjectId",
  "name": "string",
  "type": "full | incremental | selective | snapshot",
  "size_bytes": "int",
  "status": "running | complete | failed",
  "encrypted": "bool",
  "blockchain_hash": "string",
  "created_at": "datetime",
  "paths": ["string"]
}
```

### blockchain_logs
```json
{
  "_id": "ObjectId",
  "hash": "string",
  "event": "string",
  "severity": "CRITICAL | HIGH | INFO | LOW",
  "block_number": "int",
  "verified": "bool",
  "payload": "object",
  "timestamp": "datetime"
}
```

### monitored_folders
```json
{
  "_id": "ObjectId",
  "path": "string",
  "status": "protected | warning | scanning",
  "file_count": "int",
  "threat_count": "int",
  "last_scan": "datetime",
  "user_id": "ObjectId"
}
```

### notifications
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "type": "threat | backup | system",
  "severity": "critical | high | medium | low | info",
  "message": "string",
  "read": "bool",
  "created_at": "datetime"
}
```
