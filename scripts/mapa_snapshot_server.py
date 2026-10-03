"""Local PostgREST-shaped recorder backed by an exported test DB snapshot.

Used only by Playwright's fully intercepted original-app capture. It never
forwards requests to the official host or writes to PostgreSQL.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, unquote, urlsplit


SNAPSHOT = Path(__file__).resolve().parents[1] / ".work-mapa-unificado" / "snapshot"
TABLES = {file.stem: [json.loads(line) for line in file.read_text(encoding="utf-8").splitlines()]
          for file in SNAPSHOT.glob("*.jsonl")}


def _value_match(value, expression: str) -> bool:
    text = "" if value is None else str(value)
    if expression.startswith("eq."):
        return text == expression[3:]
    if expression.startswith("gte."):
        return text >= expression[4:]
    if expression.startswith("lte."):
        return text <= expression[4:]
    if expression.startswith("gt."):
        return text > expression[3:]
    if expression.startswith("lt."):
        return text < expression[3:]
    if expression.startswith("in.(") and expression.endswith(")"):
        return text in {x.strip('"') for x in expression[4:-1].split(",")}
    if expression.startswith("is."):
        return (value is None) == (expression[3:] == "null")
    if expression.startswith(("like.", "ilike.")):
        casefold = expression.startswith("ilike.")
        pattern = expression.split(".", 1)[1]
        regex = "^" + re.escape(pattern).replace(r"\*", ".*").replace("%", ".*") + "$"
        return bool(re.match(regex, text, re.I if casefold else 0))
    return True  # unsupported filter is recorded but does not invent a result


def _select_rows(name: str, query: dict[str, list[str]], headers) -> tuple[list[dict], int]:
    rows = list(TABLES[name])
    special = {"select", "order", "limit", "offset", "on_conflict", "or", "and"}
    for column, expressions in query.items():
        if column in special:
            continue
        rows = [row for row in rows if all(_value_match(row.get(column), expr) for expr in expressions)]
    total = len(rows)
    for ordering in reversed(query.get("order", [])):
        for component in reversed(ordering.split(",")):
            parts = component.split(".")
            column = parts[0]
            reverse = "desc" in parts[1:]
            rows.sort(key=lambda row: (row.get(column) is None, str(row.get(column) or "")), reverse=reverse)
    start = int(query.get("offset", ["0"])[0] or 0)
    limit = int(query.get("limit", ["1000"])[0] or 1000)
    if headers.get("Range") and re.fullmatch(r"\d+-\d+", headers["Range"]):
        first, last = map(int, headers["Range"].split("-"))
        start, limit = first, last - first + 1
    rows = rows[start:start + limit]
    selection = query.get("select", ["*"])[0]
    if selection != "*" and all(re.fullmatch(r"[a-zA-Z_][a-zA-Z_0-9]*", col)
                                for col in selection.split(",")):
        fields = selection.split(",")
        rows = [{key: row.get(key) for key in fields} for row in rows]
    return rows, total


class SnapshotHandler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def _handle(self):
        parsed = urlsplit(self.path)
        parts = parsed.path.strip("/").split("/")
        if len(parts) != 3 or parts[:2] != ["rest", "v1"] or parts[2] not in TABLES:
            self._respond(404, {"code": "PGRST205", "message": "resource missing"})
            return
        name = parts[2]
        query = parse_qs(parsed.query, keep_blank_values=True)
        if self.command in {"GET", "HEAD"}:
            rows, total = _select_rows(name, query, self.headers)
            first = int(query.get("offset", ["0"])[0] or 0)
            if self.headers.get("Range") and re.fullmatch(r"\d+-\d+", self.headers["Range"]):
                first = int(self.headers["Range"].split("-")[0])
            range_header = f"{first}-{first + len(rows) - 1}/{total}" if rows else f"*/{total}"
            self._respond(200, rows, {"Content-Range": range_header, "Range-Unit": "items"})
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        try:
            payload = json.loads(raw or b"null")
        except json.JSONDecodeError:
            self._respond(400, {"code": "PGRST102", "message": "invalid JSON"})
            return
        if self.command in {"POST", "PUT", "PATCH"}:
            records = payload if isinstance(payload, list) else [payload]
            records = [record for record in records if isinstance(record, dict)]
            if self.command == "PATCH":
                matches, _ = _select_rows(name, query, self.headers)
                ids = {row.get("id") for row in matches}
                for row in TABLES[name]:
                    if row.get("id") in ids:
                        row.update(records[0] if records else {})
                records = matches
            else:
                TABLES[name].extend(records)
            if "return=representation" in self.headers.get("Prefer", ""):
                self._respond(201 if self.command == "POST" else 200, records)
            else:
                self._respond(201 if self.command == "POST" else 204, None)
            return
        if self.command == "DELETE":
            matches, _ = _select_rows(name, query, self.headers)
            ids = {row.get("id") for row in matches}
            TABLES[name] = [row for row in TABLES[name] if row.get("id") not in ids]
            self._respond(200 if "return=representation" in self.headers.get("Prefer", "") else 204,
                          matches if "return=representation" in self.headers.get("Prefer", "") else None)
            return
        self._respond(405, {"message": "method not allowed"})

    def _respond(self, status: int, payload, extra: dict | None = None):
        body = json.dumps(payload, ensure_ascii=False).encode() if payload is not None else b""
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for name, value in (extra or {}).items():
            self.send_header(name, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    do_GET = do_HEAD = do_POST = do_PUT = do_PATCH = do_DELETE = _handle


def serve() -> ThreadingHTTPServer:
    if not TABLES:
        raise RuntimeError("Run scripts/export_mapa_test_snapshot.py first")
    return ThreadingHTTPServer(("127.0.0.1", 0), SnapshotHandler)
