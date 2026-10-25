"""GED A5 synthetic lifecycle on destination through HTTPS and real password logins."""
from __future__ import annotations

import io
import json
import subprocess
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from reportlab.pdfgen import canvas

BASE = "https://concrefer.concretrack.com.br/unificado/ged"
API = BASE + "/api"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def credentials():
    raw = subprocess.check_output(["ssh", "vps-staging", "cat", "/etc/ged-a5-probe.env"], text=True)
    return dict(line.split("=", 1) for line in raw.splitlines() if "=" in line)


def pdf_bytes():
    out = io.BytesIO()
    pdf = canvas.Canvas(out)
    pdf.drawString(72, 720, "Evidencia sintetica GED A5")
    pdf.save()
    return out.getvalue()


def login(browser, creds, role):
    context = browser.new_context(service_workers="block")
    response = context.request.post(API + "/auth/login", data={
        "username": creds[role + "_USER"], "password": creds[role + "_PASSWORD"]})
    assert response.status == 200, (role, response.status)
    body = response.json()
    assert body["user"]["role"] == role
    context.set_extra_http_headers({"Authorization": "Bearer " + body["token"]})
    assert context.request.get(API + "/auth/me").status == 200
    return context, body


def call(ctx, method, path, payload=None, expected=200):
    response = getattr(ctx.request, method)(API + path, data=payload)
    assert response.status == expected, (method, path, response.status, response.text()[:450])
    return response.json() if response.headers.get("content-type", "").startswith("application/json") else response


def main():
    creds = credentials()
    results = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        admin, a = login(browser, creds, "ADMIN_MASTER")
        quality, q = login(browser, creds, "QUALIDADE")
        operator, o = login(browser, creds, "OPERACIONAL")
        results["logins"] = {k: v["user"]["role"] for k, v in (("admin", a), ("quality", q), ("operator", o))}
        # Root navigation is checked separately after the Nginx/Next slash fix.

        doc = call(admin, "post", "/documents", {
            "code": "E2E-A5-2026", "name": "Documento sintético de validação A5",
            "area": "SGQ", "doc_type": "IT", "description": "Preservar até a limpeza aprovada",
            "initial_revision": 0}, 201)
        did = doc["id"]
        results["document_id"] = did
        results["operator_create"] = operator.request.post(API + "/documents", data={
            "code": "E2E-A5-DENIED", "name": "Negado", "area": "SGQ", "doc_type": "IT"}).status
        assert results["operator_create"] == 403
        before = operator.request.get(API + "/documents/" + did)
        results["operator_unpublished"] = before.status
        assert before.status in (403, 404)

        upload = admin.request.post(API + f"/documents/{did}/upload", multipart={
            "file": {"name": "e2e-a5.pdf", "mimeType": "application/pdf", "buffer": pdf_bytes()},
            "change_summary": "Primeira revisão sintética"})
        assert upload.status == 201, (upload.status, upload.text()[:450])
        version = upload.json()
        vid = version["id"]
        results["version_id"] = vid
        assert version["drive_folder"] == "EM_REVISAO"
        versions = call(admin, "get", f"/documents/{did}/versions")
        assert len(versions) == 1
        approvals = call(admin, "get", "/approvals")
        chain = sorted((x for x in approvals if x["version_id"] == vid), key=lambda x: x["approval_level"])
        assert len(chain) == 2 and [x["approval_level"] for x in chain] == [1, 2]
        assert all(x["status"] == "PENDENTE" for x in chain)
        results["approval_chain"] = [x["approval_level"] for x in chain]
        results["operator_approve"] = operator.request.post(API + f"/approvals/{vid}/approve",
            data={"comments": "Negado"}).status
        assert results["operator_approve"] in (403, 404)
        call(admin, "post", f"/approvals/{vid}/approve", {"comments": "Aprovado SGQ - ensaio"})
        mid = call(admin, "get", f"/documents/{did}")
        assert mid["status"] == "EM_REVISAO"
        call(admin, "post", f"/approvals/{vid}/approve", {"comments": "Aprovado gestor - ensaio"})
        final = call(admin, "get", f"/documents/{did}")
        assert final["status"] == "APROVADO"
        current = call(admin, "get", f"/documents/{did}/versions")[0]
        assert current["drive_folder"] == "VIGENTES"
        results["published_path"] = current["drive_file_id"]

        read = call(quality, "post", "/read-logs", {"document_id": did, "version_id": vid}, 201)
        assert read["message"]
        results["read_ack"] = 201

        path = "/uploads/" + current["drive_file_id"]
        guest = browser.new_context()
        assert guest.request.get(BASE + path).status == 401
        authorized = admin.request.get(BASE + path)
        assert authorized.status == 200 and authorized.body().startswith(b"%PDF-")
        results["download"] = {"guest": 401, "admin": 200, "bytes": len(authorized.body())}
        guest.close()

        # Second version moves the old path to obsoletos and updates its DB reference.
        second = admin.request.post(API + f"/documents/{did}/upload", multipart={
            "file": {"name": "e2e-a5-rev1.pdf", "mimeType": "application/pdf", "buffer": pdf_bytes()},
            "change_summary": "Segunda revisão sintética"})
        assert second.status == 201, (second.status, second.text()[:450])
        old = next(x for x in call(admin, "get", f"/documents/{did}/versions") if x["id"] == vid)
        assert old["drive_folder"] == "OBSOLETOS" and old["drive_file_id"].startswith("obsoletos/")
        assert admin.request.get(BASE + "/uploads/" + old["drive_file_id"]).status == 200
        results["obsolete_path"] = old["drive_file_id"]

        print(json.dumps({"a5": "PASS", "results": results, "retained": True}, ensure_ascii=False))
        operator.close()
        quality.close()
        admin.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Playwright's exception trace can include Authorization headers.
        print(f"A5 failed: {type(error).__name__}; inspect the step checks in the script")
        raise SystemExit(1) from None
