"""Safe, repeatable Unificado regression gate for Quality infrastructure changes.

The legacy directories contain destructive migration scripts. This gate runs the
authenticated navigation and read-only checks from each required directory.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
CASES = {
    "unificado.home_pcp_mapa": ["tests/unificado/home_smoke.py"],
    "unificado.laboratorio": ["tests/unificado/laboratorio_navigation_smoke.py"],
    "auth.pcp": ["tests/auth/test_pcp_only_browser.py"],
    "auth.mapa": ["tests/auth/test_mapa_one_screen_browser.py"],
    "mapa.photo_permissions": ["-m", "unittest", "tests/mapa/test_photo_proxy_access.py"],
    "pcp.admin_dashboard": ["tests/pcp/dashboard_navigation_smoke.py", "--role", "ADMIN"],
    "pcp.consulta_dashboard_denial": ["tests/pcp/dashboard_navigation_smoke.py", "--role", "CONSULTA"],
}


def run_case(item):
    name, args = item
    started = time.monotonic()
    try:
        done = subprocess.run([sys.executable, *args], cwd=ROOT,
                              capture_output=True, text=True, encoding="utf-8",
                              errors="replace", timeout=100)
        return {"case": name, "ok": done.returncode == 0,
                "exit_code": done.returncode, "seconds": round(time.monotonic() - started, 1),
                "failure": "\n".join((done.stderr or done.stdout).splitlines()[-5:])
                if done.returncode else None}
    except subprocess.TimeoutExpired:
        return {"case": name, "ok": False, "exit_code": None,
                "seconds": round(time.monotonic() - started, 1), "failure": "timeout 100s"}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True)
    args = parser.parse_args()
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(run_case, CASES.items()))
    report = {"label": args.label, "commands": len(results),
              "passed": sum(item["ok"] for item in results),
              "failed": sum(not item["ok"] for item in results), "results": results}
    print(json.dumps(report, ensure_ascii=False))
    if report["failed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
