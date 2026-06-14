"""
Blockchain audit log service.
Uses SHA-256 chaining to produce tamper-evident logs.
In production this would write to an actual blockchain (Ethereum/Hyperledger).
"""
import hashlib, json
from datetime import datetime, timezone
from typing import Optional

def _sha256(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()

def create_block(
    event: str,
    severity: str,
    payload: dict,
    previous_hash: str = "0" * 64,
    block_number: int = 1,
) -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    block_data = json.dumps({
        "block": block_number,
        "event": event,
        "severity": severity,
        "payload": payload,
        "timestamp": timestamp,
        "previous_hash": previous_hash,
    }, sort_keys=True)
    block_hash = _sha256(block_data)
    return {
        "block_number": block_number,
        "hash": f"0x{block_hash[:40]}",
        "previous_hash": f"0x{previous_hash[:40]}",
        "event": event,
        "severity": severity,
        "payload": payload,
        "timestamp": timestamp,
        "verified": True,
    }

async def log_event(db, event: str, severity: str, payload: dict) -> dict:
    """Append a new block to the chain stored in MongoDB."""
    last = await db.blockchain_logs.find_one(sort=[("block_number", -1)])
    prev_hash = last["hash"].replace("0x", "") if last else "0" * 64
    block_num = (last["block_number"] + 1) if last else 1
    block = create_block(event, severity, payload, prev_hash, block_num)
    await db.blockchain_logs.insert_one({**block})
    return block

async def verify_chain(db) -> dict:
    """
    Walk the chain and verify integrity by:
      1. Recomputing each block's hash from its stored content
         (event, severity, payload, timestamp, previous_hash, block_number)
         and comparing to the stored `hash` — catches tampering with
         payload/event/severity/timestamp.
      2. Confirming each block's `previous_hash` matches the prior
         block's actual `hash` — catches broken chain linkage / reordering.
    """
    logs = await db.blockchain_logs.find().sort("block_number", 1).to_list(None)
    broken_at = None
    reason = None

    for i, log in enumerate(logs):
        # Recompute this block's hash from its content.
        # NOTE: the genesis block (block_number == 1) is hashed using a
        # full 64-zero previous_hash (see log_event's default), even though
        # its stored `previous_hash` field is truncated to 40 chars + "0x".
        if log["block_number"] == 1:
            prev_hash_for_data = "0" * 64
        else:
            prev_hash_for_data = log.get("previous_hash", "0x" + "0" * 64).replace("0x", "")

        block_data = json.dumps({
            "block": log["block_number"],
            "event": log["event"],
            "severity": log["severity"],
            "payload": log["payload"],
            "timestamp": log["timestamp"],
            "previous_hash": prev_hash_for_data,
        }, sort_keys=True, default=str)
        recomputed = f"0x{_sha256(block_data)[:40]}"

        if recomputed != log.get("hash"):
            broken_at = log["block_number"]
            reason = "content_tampered"
            break

        # Verify linkage to the previous block
        if i > 0 and log.get("previous_hash") != logs[i - 1].get("hash"):
            broken_at = log["block_number"]
            reason = "chain_link_broken"
            break

    return {
        "total_blocks": len(logs),
        "integrity": "100%" if broken_at is None else f"BROKEN at block {broken_at}",
        "verified": broken_at is None,
        "broken_at": broken_at,
        "reason": reason,
    }
