"""Upload, list, read and delete one synthetic photo in test storage only."""

from __future__ import annotations

import json
import os
from pathlib import Path
import secrets
import struct
import urllib.error
import urllib.request
import zlib


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


PHOTO = (
    b"\x89PNG\r\n\x1a\n"
    + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
    + png_chunk(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
    + png_chunk(b"IEND", b"")
)
BASE = "http://127.0.0.1:13052"


def main() -> None:
    for line in Path("/etc/mapa-unificado/auth.env").read_text(encoding="utf-8").splitlines():
        if line.strip() and not line.lstrip().startswith("#") and "=" in line:
            key, value = line.strip().split("=", 1)
            os.environ[key] = value.strip().strip('"').strip("'")
    os.chdir("/opt/mapa-unificado-api")
    import sys
    sys.path.insert(0, os.getcwd())
    from app import COOKIE_NAME, connect, signer

    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,updated_at FROM public.usuarios WHERE perfil='GERENCIA'
                          AND ativo AND NOT primeiro_acesso ORDER BY id LIMIT 1""")
        user = cursor.fetchone()
    assert user
    cookie = COOKIE_NAME + "=" + signer().dumps({
        "scope": "session", "id": user["id"], "updated_at": user["updated_at"].isoformat(),
    })
    poste = "captura-foto-" + secrets.token_hex(5)
    photo_id = None

    def call(method: str, path: str, data=None, content_type=None, authenticated=True):
        headers = {"Origin": "https://concrefer.concretrack.com.br"}
        if authenticated:
            headers["Cookie"] = cookie
        if content_type:
            headers["Content-Type"] = content_type
        request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return response.status, response.read(), response.headers
        except urllib.error.HTTPError as error:
            return error.code, error.read(), error.headers

    try:
        path = "/inspecoes/" + poste + "/fotos"
        unauth, _, _ = call("GET", path, authenticated=False)
        status, raw, _ = call("GET", path)
        assert unauth == 401 and status == 200 and json.loads(raw) == {"success": True, "data": []}
        boundary = "----codex-" + secrets.token_hex(8)
        multipart = (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"usuario\"\r\n\r\nCaptura\r\n"
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"foto\"; filename=\"captura.png\"\r\n"
            "Content-Type: image/png\r\n\r\n"
        ).encode() + PHOTO + f"\r\n--{boundary}--\r\n".encode()
        status, raw, _ = call("POST", path, multipart, "multipart/form-data; boundary=" + boundary)
        payload = json.loads(raw)
        assert status == 201 and payload["success"] and payload["data"]["url"].startswith(
            "/unificado/mapa/api/fotos/"
        ), (status, payload)
        photo_id = payload["data"]["id"]
        status, raw, _ = call("GET", path)
        listed = json.loads(raw)
        assert status == 200 and len(listed["data"]) == 1 and listed["data"][0]["id"] == photo_id
        file_path = "/fotos/" + photo_id + "/arquivo"
        status, image, headers = call("GET", file_path)
        assert status == 200 and image.startswith(b"\xff\xd8") and headers["Content-Type"].startswith("image/jpeg")
        status, _, headers = call("GET", file_path + "?download=1")
        assert status == 200 and "attachment" in headers.get("Content-Disposition", "")
        status, raw, _ = call("DELETE", "/fotos/" + photo_id + "?usuario=Captura")
        assert status == 200 and json.loads(raw) == {"success": True}
        photo_id = None
        status, raw, _ = call("GET", path)
        assert status == 200 and json.loads(raw)["data"] == []
        print("photo_contract=upload:201,list:200,file:200,download:200,delete:200,unauth:401")
    finally:
        if photo_id:
            call("DELETE", "/fotos/" + photo_id + "?usuario=Captura")
        index = json.loads(Path("/opt/mapa-unificado-photo-storage/fotos-inspecao.json").read_text())
        assert not any(row.get("poste_id") == poste for row in index)
        print("photo_cleanup=0")


if __name__ == "__main__":
    main()
