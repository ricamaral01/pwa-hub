"""Bounded destination-only GED probe using the synthetic A5 admin account."""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from pathlib import Path
from time import monotonic, sleep
import json
import requests

BASE = "https://concrefer.concretrack.com.br/unificado/ged/api"
DOC = "13c37107-bff7-456f-8eb3-baf0276eec57"
HEALTH = "http://127.0.0.1:13071/health"


def main() -> None:
    account = dict(line.split("=", 1) for line in Path("/etc/ged-a5-probe.env").read_text().splitlines() if "=" in line)
    session = requests.Session()
    login = session.post(BASE + "/auth/login", json={
        "username": account["ADMIN_MASTER_USER"], "password": account["ADMIN_MASTER_PASSWORD"]}, timeout=15)
    assert login.status_code == 200, f"login status {login.status_code}"
    auth = {"Authorization": "Bearer " + login.json()["token"]}
    malformed = b"%PDF-1.4\n" + b"x" * (50 * 1024 * 1024 - len(b"%PDF-1.4\n"))

    def upload():
        return session.post(BASE + f"/documents/{DOC}/upload", headers=auth,
                            files={"file": ("a5-malformed-isolation.pdf", malformed, "application/pdf")},
                            timeout=48)

    samples = []
    with ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(upload)
        while not future.done():
            started = monotonic()
            try:
                health = requests.get(HEALTH, timeout=2)
                samples.append({"status": health.status_code, "seconds": round(monotonic() - started, 3)})
            except requests.RequestException:
                samples.append({"status": None, "seconds": round(monotonic() - started, 3)})
            sleep(1)
        response = future.result()
    assert response.status_code == 201, f"upload status {response.status_code}"
    version = response.json()
    assert version.get("processing_warning"), "version lacks fallback warning"
    assert samples and all(sample["status"] == 200 and sample["seconds"] < 2 for sample in samples), "API health stalled"
    download = session.get(BASE.removesuffix("/api") + "/uploads/" + version["drive_file_id"], headers=auth, timeout=30)
    assert download.status_code == 200, f"download status {download.status_code}"
    assert sha256(download.content).digest() == sha256(malformed).digest(), "fallback bytes changed"
    print(json.dumps({"status": response.status_code, "version_id": version["id"],
                      "warning": version["processing_warning"], "bytes": len(download.content),
                      "health_samples": len(samples), "max_health_seconds": max(item["seconds"] for item in samples),
                      "download_same_sha256": True}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"malformed PDF probe failed: {type(error).__name__}: {error if isinstance(error, AssertionError) else ''}")
        raise SystemExit(1) from None
