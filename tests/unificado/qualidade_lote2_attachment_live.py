"""Upload and read a retained synthetic Quality attachment before restore test."""
from __future__ import annotations

import hashlib
import json
from playwright.sync_api import sync_playwright

from qualidade_lote2_b5_live import API, BASE, CHROME, credentials

NC_ID = "b6e8ea38-f6e3-403d-be56-15343fa1e2f1"
DATA = b"Evidencia sintetica B5 em anexo.\n"


def main():
    account = credentials()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=CHROME)
        context = browser.new_context(service_workers="block")
        login = context.request.post(BASE + "/unificado/mapa/api/unified/login", data={
            "username": account["MAPA_TEST_USER"], "password": account["MAPA_TEST_PASSWORD"]})
        assert login.status == 200
        assert context.request.post(BASE + "/unificado/mapa/api/unified/qualidade-bootstrap").status == 200
        upload = context.request.post(API + f"/nc/{NC_ID}/anexos",
            multipart={"file": {"name": "b5-evidencia.txt", "mimeType": "text/plain", "buffer": DATA}})
        assert upload.status == 201, (upload.status, upload.text())
        aid = upload.json()["id"]
        assert upload.json()["sha256"] == hashlib.sha256(DATA).hexdigest()
        download = context.request.get(API + f"/nc/{NC_ID}/anexos/{aid}")
        assert download.status == 200 and download.body() == DATA
        anonymous = browser.new_context()
        denied = anonymous.request.get(API + f"/nc/{NC_ID}/anexos/{aid}")
        assert denied.status in (401, 403)
        print(json.dumps({"attachment": aid, "nc": NC_ID, "bytes": len(DATA),
                          "sha256": hashlib.sha256(DATA).hexdigest(),
                          "authenticated": 200, "anonymous": denied.status, "retained": True}))
        anonymous.close()
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
