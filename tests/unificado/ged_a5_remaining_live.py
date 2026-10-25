"""Remaining A5 browser, calibration, task, download and size-boundary checks.

All writes target only the GED copy on the Unificado destination. Synthetic
credentials live in /etc/ged-a5-probe.env there and are never printed.
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from playwright.sync_api import sync_playwright
from reportlab.pdfgen import canvas

from ged_a5_live import API, BASE, CHROME, credentials, login

DOCUMENT_ID = "13c37107-bff7-456f-8eb3-baf0276eec57"


def browser_login(browser, creds, role):
    context = browser.new_context(service_workers="block")
    page = context.new_page()
    page.goto(BASE + "/login", wait_until="networkidle", timeout=30000)
    # Browser safety net: prevent native GET fallback while React hydrates.
    # React's own submit handler still runs and calls the authenticated API.
    page.evaluate("document.addEventListener('submit', e => e.preventDefault(), true)")
    page.locator('input[type="email"]').fill(creds[role + "_USER"] + "@local.invalid")
    page.locator('input[type="password"]').fill(creds[role + "_PASSWORD"])
    page.get_by_role("button", name="Entrar").click()
    try:
        page.wait_for_url("**/dashboard", timeout=20000)
    except Exception:
        print("browser_login did not reach dashboard", role,
              "login_page" if "/login" in page.url else "other_page")
        raise
    assert page.locator("body").count() == 1
    return context


def attachment(ctx, task_id, data):
    return ctx.request.post(API + f"/tasks/{task_id}/attachments", multipart={
        "file": {"name": "e2e-a5-anexo.txt", "mimeType": "text/plain", "buffer": data}})


def main():
    creds = credentials()
    result = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        # Browser UI login (as opposed to APIRequestContext login) for each role.
        for role in ("ADMIN_MASTER", "QUALIDADE", "OPERACIONAL"):
            print("browser login", role)
            ui = browser_login(browser, creds, role)
            result["ui_" + role] = "dashboard"
            ui.close()
        if "--login-only" in sys.argv:
            print(json.dumps({"a5_browser_login": "PASS", "roles": list(result)}, ensure_ascii=False))
            browser.close()
            return

        admin, _ = login(browser, creds, "ADMIN_MASTER")
        operator, _ = login(browser, creds, "OPERACIONAL")
        anonymous = browser.new_context()
        print("task creation")

        task_response = admin.request.post(API + "/tasks", data={
            "title": "Tarefa sintética GED A5", "description": "Preservar até limpeza autorizada",
            "responsible_id": creds["ADMIN_MASTER_ID"], "department": "SGQ",
            "priority": "MEDIA", "status": "ABERTA"})
        assert task_response.status == 201, (task_response.status, task_response.text()[:300])
        task_id = task_response.json()["id"]
        result["task_id"] = task_id
        upload = attachment(admin, task_id, b"Anexo sintetico da tarefa A5\n")
        assert upload.status == 201, (upload.status, upload.text()[:300])
        storage = upload.json()["storage_path"]
        result["task_attachment_id"] = upload.json()["id"]
        assert anonymous.request.get("https://concrefer.concretrack.com.br" + storage).status == 401
        assert admin.request.get("https://concrefer.concretrack.com.br" + storage).status == 200
        result["task_download"] = "401/200"

        # Access is denied before Multer disk storage runs (patch under test).
        denied = attachment(operator, task_id, b"No orphan may be written\n")
        assert denied.status == 403, (denied.status, denied.text()[:300])
        result["task_denied"] = 403

        # Exact upload ceilings are enforced by the service or Nginx; one byte
        # above each file limit must be refused without creating a record.
        too_large_25 = attachment(admin, task_id, b"x" * (25 * 1024 * 1024 + 1))
        assert too_large_25.status in (400, 413), too_large_25.status
        result["25mb_plus_one"] = too_large_25.status

        calibration_fields = {
            "equipment_code": "E2E-A5-2026",
            "equipment_name": "Calibrador sintético A5",
            "laboratory": "Laboratório sintético",
            "certificate_number": "E2E-A5-CAL-2026",
            "calibration_date": "2026-10-15",
            "due_date": "2027-10-15",
        }
        cal = admin.request.post(API + "/calibrations", multipart={
            **calibration_fields,
            "file": {"name": "certificado-a5.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4\n%%EOF\n"}})
        assert cal.status == 201, (cal.status, cal.text()[:300])
        cert = cal.json()
        print("calibration created")
        result["calibration_id"] = cert["id"]
        qr = anonymous.request.get("https://concrefer.concretrack.com.br" + cert["qr_code_url"])
        assert qr.status == 200
        image = cv2.imdecode(np.frombuffer(qr.body(), dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
        decoded, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
        assert decoded.endswith("/calibrations/verify/" + cert["id"]), decoded
        verify = anonymous.request.get(decoded)
        assert verify.status == 200, verify.status
        result["qr_virtual"] = decoded

        oversize_cal = admin.request.post(API + "/calibrations", multipart={
            **(calibration_fields | {"certificate_number": "E2E-A5-CAL-OVERLIMIT"}),
            "file": {"name": "over-20.pdf", "mimeType": "application/pdf", "buffer": b"x" * (20 * 1024 * 1024 + 1)}})
        assert oversize_cal.status in (400, 413), oversize_cal.status
        result["20mb_plus_one"] = oversize_cal.status

        oversize_doc = admin.request.post(API + f"/documents/{DOCUMENT_ID}/upload", multipart={
            "file": {"name": "over-50.pdf", "mimeType": "application/pdf", "buffer": b"x" * (50 * 1024 * 1024 + 1)}})
        assert oversize_doc.status in (400, 413), oversize_doc.status
        result["50mb_plus_one"] = oversize_doc.status

        print(json.dumps({"a5_remaining": "PASS", "result": result, "retained": True}, ensure_ascii=False))
        anonymous.close()
        operator.close()
        admin.close()
        browser.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Playwright traces can include Authorization headers; do not emit them.
        print(f"A5 remaining failed: {type(error).__name__}; inspect step checks")
        raise SystemExit(1) from None
