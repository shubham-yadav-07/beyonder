"""
AI Threat Engine – production-grade simulation.
In a real deployment this calls a trained ML model (sklearn/ONNX/TF).
The scoring logic here is fully deterministic and explainable.
"""
import hashlib, math, re
from dataclasses import dataclass
from typing import Tuple

RANSOMWARE_PATTERNS = [
    r"\.encrypted$", r"\.locked$", r"\.ransom", r"crack\.", r"keygen\.",
    r"patch\.", r"activat", r"wannacry", r"petya", r"locky", r"ryuk",
]
TROJAN_PATTERNS = [r"svchost\d+", r"update_patch", r"install_helper", r"setup_\d+"]
KEYLOGGER_PATTERNS = [r"keylog", r"klog", r"hook", r"spy"]
HIGH_RISK_DIRS = [r"\\Temp\\", r"/tmp/", r"\\AppData\\Roaming\\", r"\\Downloads\\"]
SYSTEM_MASQ = [r"system32.*[^a-z]svchost", r"lsass\d", r"winlogon\d"]

THREAT_TYPE_MAP = {
    "ransomware": ("Ransomware", 85),
    "trojan": ("Trojan", 70),
    "keylogger": ("Keylogger/Spyware", 88),
    "system_masquerade": ("System Masquerade", 80),
    "suspicious_dir": ("Suspicious Location", 50),
    "clean": ("Clean", 0),
}

@dataclass
class ScanResult:
    threat_type: str
    level: str
    score: int
    confidence: float
    indicators: list[str]
    should_quarantine: bool

def _entropy(data: str) -> float:
    """Shannon entropy of a string (0-8 bits)."""
    if not data:
        return 0.0
    freq = {c: data.count(c) / len(data) for c in set(data)}
    return -sum(p * math.log2(p) for p in freq.values() if p > 0)

def _match_any(text: str, patterns: list[str]) -> list[str]:
    text = text.lower()
    return [p for p in patterns if re.search(p, text)]

def analyze_file(path: str, file_hash: str = "", file_size: int = 0) -> ScanResult:
    """
    Deterministic multi-signal threat scoring.
    Signals: path patterns, entropy, known hashes, suspicious dirs.
    """
    indicators = []
    base_score = 0
    threat_type = "clean"

    path_lower = path.lower()

    # Signal 1: ransomware patterns
    r_hits = _match_any(path_lower, RANSOMWARE_PATTERNS)
    if r_hits:
        base_score += 60 + len(r_hits) * 10
        threat_type = "ransomware"
        indicators.append(f"Ransomware filename pattern: {r_hits[0]}")

    # Signal 2: trojan patterns
    t_hits = _match_any(path_lower, TROJAN_PATTERNS)
    if t_hits and threat_type == "clean":
        base_score += 50 + len(t_hits) * 8
        threat_type = "trojan"
        indicators.append(f"Trojan filename pattern: {t_hits[0]}")

    # Signal 3: keylogger patterns
    k_hits = _match_any(path_lower, KEYLOGGER_PATTERNS)
    if k_hits:
        base_score += 55
        threat_type = "keylogger"
        indicators.append(f"Keylogger pattern: {k_hits[0]}")

    # Signal 4: system masquerade
    s_hits = _match_any(path_lower, SYSTEM_MASQ)
    if s_hits:
        base_score += 40
        if threat_type == "clean":
            threat_type = "system_masquerade"
        indicators.append("System process masquerade detected")

    # Signal 5: suspicious directories
    d_hits = _match_any(path_lower, HIGH_RISK_DIRS)
    if d_hits:
        base_score += 15
        indicators.append(f"High-risk directory: {d_hits[0]}")

    # Signal 6: path entropy (obfuscated names have high entropy)
    filename = path.split("\\")[-1].split("/")[-1]
    ent = _entropy(filename)
    if ent > 4.5:
        base_score += int((ent - 4.5) * 10)
        indicators.append(f"High filename entropy: {ent:.2f} bits")

    # Signal 7: known bad hash prefix (simulate hash DB lookup)
    if file_hash and file_hash[:4] in {"a1b2", "dead", "cafe", "b00b"}:
        base_score += 30
        indicators.append(f"Hash matches threat database: {file_hash[:8]}...")

    score = min(100, base_score)

    if score >= 80:
        level = "critical"
    elif score >= 60:
        level = "high"
    elif score >= 35:
        level = "medium"
    elif score > 0:
        level = "low"
    else:
        level = "none"

    confidence = min(0.99, 0.5 + score / 200 + len(indicators) * 0.08)

    return ScanResult(
        threat_type=THREAT_TYPE_MAP.get(threat_type, ("Unknown", 0))[0],
        level=level,
        score=score,
        confidence=round(confidence, 3),
        indicators=indicators if indicators else ["No threat indicators found"],
        should_quarantine=score >= 70,
    )
