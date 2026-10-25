"""UUIDv7 RFC 9562, independentemente da versão do Python na VPS."""
from __future__ import annotations
import secrets
import time
import uuid

def uuid7() -> uuid.UUID:
    milliseconds = time.time_ns() // 1_000_000
    random_a = secrets.randbits(12)
    random_b = secrets.randbits(62)
    return uuid.UUID(int=((milliseconds & ((1 << 48) - 1)) << 80)
                     | (7 << 76) | (random_a << 64) | (2 << 62) | random_b)
