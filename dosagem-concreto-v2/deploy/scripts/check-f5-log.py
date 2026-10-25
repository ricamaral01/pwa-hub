"""Validate the completed 10-minute read-only VPS resource sample."""
from datetime import datetime
from pathlib import Path
import re
import statistics
import sys

source = Path(sys.argv[1])
lines = source.read_text(encoding="utf-8").splitlines()
samples = [line for line in lines if line.startswith("SAMPLE ")]
assert len(samples) == 21, len(samples)
def field(line: str, key: str) -> str:
    match = re.search(rf"\b{key}=([^\s]+)", line)
    assert match, (key, line)
    return match.group(1)

times = [datetime.fromisoformat(field(line, "utc").replace("Z", "+00:00")) for line in samples]
assert (times[-1] - times[0]).total_seconds() >= 600
cpu = int(field(next(line for line in lines if line.startswith("BEGIN ")), "cpus"))
load15 = statistics.mean(float(field(line, "load15")) for line in samples)
minimum_ram = min(int(field(line, "memAvailableMB")) for line in samples)
minimum_disk = min(int(field(line, "diskFreeGB")) for line in samples)
swap = [int(field(line, "swapUsedMB")) / max(1, int(field(line, "swapTotalMB"))) for line in samples]
assert load15 <= 2 * cpu, load15
assert minimum_ram >= 400, minimum_ram
assert minimum_disk >= 3, minimum_disk
assert max(swap) <= .5, max(swap)
assert any("accepting connections" in line for line in lines)
expected = [200, 200, 301, 302, 302, 200, 200, 200, 200]
sites = [int(field(line, "code")) for line in lines if line.startswith("SITE ")]
assert sites == expected + expected, sites
assert any(line.startswith("END ") for line in lines)
print(f"F5 OK: 21 samples, {(times[-1]-times[0]).total_seconds():.0f}s, "
      f"mean load15={load15:.2f}, min RAM={minimum_ram}MB, min disk={minimum_disk}GB, "
      "PostgreSQL and 9 neighbor sites OK")
