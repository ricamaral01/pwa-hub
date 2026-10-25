"""Authorization of photo files loaded by an image element."""

import ast
import json
from pathlib import Path
import re
from types import SimpleNamespace
import unittest
import urllib.error
import urllib.request


SOURCE = Path(__file__).resolve().parents[2] / "unificado/mapa/api/app.py"
TREE = ast.parse(SOURCE.read_text(encoding="utf-8"))
PHOTO_PROXY = next(node for node in TREE.body if isinstance(node, ast.FunctionDef)
                   and node.name == "photo_proxy")
CODE = compile(ast.Module(body=[PHOTO_PROXY], type_ignores=[]), str(SOURCE), "exec")


class Upstream:
    status = 200
    headers = {"Content-Type": "image/jpeg"}

    def read(self):
        return b"jpeg"

    def close(self):
        pass


class PhotoProxyAccessTest(unittest.TestCase):
    def call(self, path, allowed):
        request = SimpleNamespace(method="GET", path="/fotos/123/arquivo",
                                  headers={}, query_string=b"")
        namespace = {
            "authenticated_user": lambda: {"id": "tester"},
            "screen_access_state": lambda user: (allowed, None),
            "guest_action_allowed": lambda *args: True,
            "screen_data_allowed": lambda *args: False,
            "request": request,
            "jsonify": lambda **value: value,
            "Response": lambda body, status, headers: (status, body, headers),
            "re": re, "urllib": urllib, "json": json,
        }
        original = urllib.request.urlopen
        urllib.request.urlopen = lambda *args, **kwargs: Upstream()
        try:
            exec(CODE, namespace)
            return namespace["photo_proxy"](path)
        finally:
            urllib.request.urlopen = original

    def test_image_reads_require_photo_screen_permission(self):
        self.assertEqual(self.call("fotos/123/arquivo", {"inspecao"})[0], 200)
        self.assertEqual(self.call("fotos/123/arquivo", {"dashboard"})[1], 403)

    def test_photo_list_still_requires_screen_header(self):
        self.assertEqual(self.call("inspecoes/poste-123/fotos", {"inspecao"})[1], 403)


if __name__ == "__main__":
    unittest.main()
