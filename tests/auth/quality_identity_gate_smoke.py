"""Exercise Quality default denial and linked PCP authorization with test accounts."""
from __future__ import annotations

import argparse
import json
import subprocess

from playwright.sync_api import sync_playwright


BASE = "https://concrefer.concretrack.com.br"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def account(path):
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", path], text=True, encoding="utf-8")
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def check(path, kind, linked):
    credentials = account(path)
    name = credentials["PCP_TEST_USER"] if kind == "pcp" else credentials["MAPA_TEST_USER"]
    password = credentials["PCP_TEST_PASSWORD"] if kind == "pcp" else credentials["MAPA_TEST_PASSWORD"]
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        page = context.new_page()
        response = page.request.post(BASE + "/unificado/mapa/api/unified/login",
                                     data={"username": name, "password": password})
        assert response.status == 200, response.status
        login = response.json()
        modules = login["modules"]
        assert "pcp" in modules if kind == "pcp" else "mapa" in modules
        result = page.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap").status
        assert result == (200 if linked else 403), (name, result)
        if linked:
            quality = page.request.get(BASE + "/unificado/qualidade/api/contexto")
            assert quality.status == 200, quality.status
            assert quality.json()["user"]["actions"] == []
            screens_response = page.request.get(BASE + "/unificado/mapa/api/unified/screen-access/me")
            assert screens_response.status == 200
            screens = set(screens_response.json()["screens"])
            assert "qualidadePainel" in screens
            assert all(not item.startswith("mapa") for item in screens), screens
            denied_write = page.request.post(BASE + "/unificado/qualidade/api/nc/rascunhos",
                                              data={"empresa_id": quality.json()["companies"][0]["id"],
                                                    "unidade_codigo": "pederneiras"})
            assert denied_write.status == 403, denied_write.status
            planning = page.request.get(BASE + "/unificado/mapa/api/unified/planning-screen-access/me",
                                        headers={"Authorization": "Bearer " + login["pcp"]["access_token"]})
            assert planning.status == 200 and len(planning.json()["screens"]) == 3
        else:
            quality = page.request.get(BASE + "/unificado/qualidade/api/contexto")
            assert quality.status in (401, 403), quality.status
        print(json.dumps({"account": name, "modules": modules,
                          "quality_bootstrap": result, "quality_api": quality.status,
                          "quality_write": denied_write.status if linked else "not_attempted"}))
        context.close()
        browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--credential-file", required=True)
    parser.add_argument("--kind", choices=("pcp", "mapa"), required=True)
    parser.add_argument("--linked", action="store_true")
    args = parser.parse_args()
    check(args.credential_file, args.kind, args.linked)
