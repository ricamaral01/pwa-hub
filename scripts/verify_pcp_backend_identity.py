"""Compare the 47 copied PCP backend files byte for byte with both VPSes."""

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "unificado" / "pcp" / "backend"
FILES = sorted(str(path.relative_to(ROOT)).replace("\\", "/") for path in ROOT.rglob("*")
               if path.is_file() and "__pycache__" not in path.parts)


def remote(alias: str, root: str) -> dict[str, str]:
    script = (
        "import hashlib,json,pathlib\n"
        f"root=pathlib.Path({root!r})\n"
        f"files={FILES!r}\n"
        "print(json.dumps({p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in files},sort_keys=True))\n"
    )
    result = subprocess.run(["ssh", alias, "python3", "-"], input=script, text=True,
                            capture_output=True, check=True)
    return json.loads(result.stdout)


def main() -> None:
    local = {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in FILES}
    official = remote("vps-rh", "/opt/pcp-concrefer")
    test = remote("vps-staging", "/opt/pcp-unificado-test")
    mismatch = [p for p in FILES if not (local[p] == official[p] == test[p])]
    combined = hashlib.sha256(json.dumps(local, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    print(f"files={len(FILES)} identical={len(FILES)-len(mismatch)} manifest_sha256={combined}")
    if mismatch:
        print("mismatch=" + ",".join(mismatch))
        raise SystemExit(1)
    if len(FILES) != 47:
        raise SystemExit("Expected 47 source files")


if __name__ == "__main__":
    main()
