"""Read-only 24-hour acceptance check for the temporary Supabase mirror.

Run on vps-staging after the stable observation window. No cutover is made.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone


START = datetime(2026, 10, 23, 18, 30, tzinfo=timezone.utc)
MIRROR = "supabase-legacy-mirror.service"
HEALTH = "supabase-legacy-mirror-health.service"


def journal() -> list[dict]:
    result = subprocess.run(
        ["journalctl", "-u", MIRROR, "-u", HEALTH, "--since", START.isoformat(),
         "--no-pager", "-o", "json"],
        text=True, capture_output=True, check=True, timeout=60,
    )
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    rows = journal()
    messages = [row.get("MESSAGE", "") for row in rows]
    times = [datetime.fromtimestamp(int(row["__REALTIME_TIMESTAMP"]) / 1_000_000,
                                    timezone.utc) for row in rows]
    mirror_start = [time for time, message in zip(times, messages)
                    if message.startswith(f"Starting {MIRROR}")]
    mirror_finish = [time for time, message in zip(times, messages)
                     if message.startswith(f"Finished {MIRROR}")]
    health_start = [time for time, message in zip(times, messages)
                    if message.startswith(f"Starting {HEALTH}")]
    health_finish = [time for time, message in zip(times, messages)
                     if message.startswith(f"Finished {HEALTH}")]
    health_ages = [float(match.group(1)) for message in messages
                   if (match := re.search(r"mirror_success_age_seconds=([0-9.]+)", message))]
    failures = [message for message in messages
                if "Failed with result" in message or message.startswith("Failed to start")]
    gaps = [(later - earlier).total_seconds()
            for earlier, later in zip(mirror_finish, mirror_finish[1:])]
    now = datetime.now(timezone.utc)
    ready = bool(
        mirror_finish and health_finish and health_ages
        and mirror_finish[0] <= START + timedelta(minutes=2)
        and now - mirror_finish[0] >= timedelta(hours=24)
        and now - mirror_finish[-1] <= timedelta(minutes=2)
        and not failures
        and len(mirror_start) - len(mirror_finish) in (0, 1)
        and len(health_start) - len(health_finish) in (0, 1)
        and max(gaps, default=0) <= 120
        and max(health_ages) <= 120
        and any(message.startswith("INSERT 0 ") and message != "INSERT 0 0"
                for message in messages)
    )
    print(json.dumps({
        "ready_24h": ready,
        "window_start_utc": START.isoformat(),
        "checked_at_utc": now.isoformat(),
        "mirror_starts": len(mirror_start),
        "mirror_finishes": len(mirror_finish),
        "health_starts": len(health_start),
        "health_finishes": len(health_finish),
        "failures": len(failures),
        "max_mirror_gap_seconds": max(gaps, default=None),
        "max_health_age_seconds": max(health_ages, default=None),
        "source_writes_observed": any(
            message.startswith("INSERT 0 ") and message != "INSERT 0 0"
            for message in messages),
    }, sort_keys=True))
    return 0 if ready else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
        print(f"acceptance_check_failed={type(exc).__name__}", file=sys.stderr)
        sys.exit(1)
