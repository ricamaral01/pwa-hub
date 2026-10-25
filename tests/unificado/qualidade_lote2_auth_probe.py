"""Check whether the existing synthetic admin can grant Quality test actions.

Secrets are read from root-only files on the destination and never printed.
"""
from __future__ import annotations

import subprocess
from playwright.sync_api import sync_playwright

BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def credential(path: str) -> dict[str, str]:
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", path], text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def main() -> None:
    admin = credential("/etc/mapa-unificado/auth-probe.env")
    quality = credential("/etc/mapa-unificado/quality-auth-probe.env")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        quality_id = None
        for label, account in (("quality", quality), ("admin", admin)):
            context = browser.new_context(service_workers="block")
            response = context.request.post(BASE + "/unificado/mapa/api/unified/login",
                data={"username": account["MAPA_TEST_USER"], "password": account["MAPA_TEST_PASSWORD"]})
            assert response.status == 200, (label, response.status)
            result = response.json()
            print(label, "id", result.get("user", {}).get("id"), "modules", result.get("modules"))
            if label == "admin":
                catalog = context.request.get(BASE + "/unificado/mapa/api/unified/quality-actions")
                print("admin catalog status", catalog.status)
                assert catalog.status == 200 and quality_id
                grant = context.request.get(BASE + f"/unificado/mapa/api/unified/users/{quality_id}/quality-actions")
                assert grant.status == 200, grant.status
                grants = grant.json()
                current = set(grants["granted"])
                wanted = current | {a["id"] for a in grants["actions"]}
                selected_areas = set(grants["granted_areas"]) | {"SGQ"}
                saved = context.request.put(
                    BASE + f"/unificado/mapa/api/unified/users/{quality_id}/quality-actions",
                    headers={"Origin": BASE},
                    data={"actions": sorted(wanted), "areas": sorted(selected_areas)})
                assert saved.status == 200, (saved.status, saved.text())
                print("quality actions", len(wanted), "areas", len(selected_areas), "added", len(wanted-current))
            else:
                ctx = context.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap")
                print("quality bootstrap", ctx.status)
                api_ctx = context.request.get(BASE + "/unificado/qualidade/api/contexto")
                assert api_ctx.status == 200, api_ctx.status
                quality_id = api_ctx.json()["user"]["id"]
            context.close()
        browser.close()


if __name__ == "__main__":
    main()
