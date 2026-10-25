"""The original Mapa's Realtime subscription against the isolated test PostgreSQL.

Only the Phoenix 2.0.0 messages used by the unchanged app.js are implemented.
Credentials and database events are never logged. This service binds localhost.
"""

from __future__ import annotations

import asyncio
from http import HTTPStatus
import json
import os
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

import psycopg
from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed


ORIGIN = os.environ.get("MAPA_REALTIME_ORIGIN", "https://concrefer.concretrack.com.br")
TABLES = ("producao", "formas_manutencao")
CHANNEL = "unificado_mapa_changes"
DATABASE_URL = os.environ["MAPA_AUTH_DATABASE_URL"]
parsed_db = urlsplit(DATABASE_URL)
expected_database = os.environ.get("MAPA_EXPECTED_DATABASE", "mapa_unificado_teste")
if parsed_db.hostname not in {"127.0.0.1", "localhost"} or parsed_db.path != "/" + expected_database:
    raise RuntimeError("Realtime must use the configured Mapa database")

clients: dict[object, dict[str, dict[str, int]]] = {}
columns_by_table: dict[str, list[dict[str, str]]] = {}


def authorized(cookie: str) -> bool:
    if not cookie:
        return False
    request = Request(os.environ.get("MAPA_REALTIME_AUTH_URL", "http://127.0.0.1:13052/me"),
                      headers={"Cookie": cookie})
    try:
        with urlopen(request, timeout=4) as response:
            return response.status == 200
    except (OSError, TimeoutError):
        return False


async def handshake(connection, request):
    target = urlsplit(request.path)
    if target.path == "/health":
        return connection.respond(HTTPStatus.OK, "ok\n")
    query = parse_qs(target.query)
    if (target.path != "/realtime/v1/websocket" or query.get("vsn") != ["2.0.0"]
            or query.get("apikey") != ["unificado-test-only"]
            or request.headers.get("Origin") != ORIGIN):
        return connection.respond(HTTPStatus.FORBIDDEN, "Forbidden\n")
    if not await asyncio.to_thread(authorized, request.headers.get("Cookie", "")):
        return connection.respond(HTTPStatus.UNAUTHORIZED, "Unauthorized\n")
    return None


async def socket_handler(socket):
    clients[socket] = {}
    try:
        async for raw in socket:
            try:
                join_ref, ref, topic, event, payload = json.loads(raw)
                if not isinstance(topic, str) or not isinstance(payload, dict):
                    continue
            except (ValueError, TypeError):
                continue
            if event == "phx_join" and topic.startswith("realtime:"):
                filters = payload.get("config", {}).get("postgres_changes", [])
                accepted = []
                mapping = {}
                for index, filter_spec in enumerate(filters, start=1):
                    if not isinstance(filter_spec, dict):
                        continue
                    table = filter_spec.get("table")
                    if (filter_spec.get("schema") == "public" and table in TABLES
                            and filter_spec.get("event") == "*"):
                        mapping[table] = index
                        accepted.append({"id": index, "event": "*", "schema": "public",
                                         "table": table})
                clients[socket][topic] = mapping
                answer = [join_ref, ref, topic, "phx_reply",
                          {"status": "ok", "response": {"postgres_changes": accepted}}]
                await socket.send(json.dumps(answer, separators=(",", ":")))
            elif event == "heartbeat" and topic == "phoenix":
                await socket.send(json.dumps([join_ref, ref, topic, "phx_reply",
                                              {"status": "ok", "response": {}}], separators=(",", ":")))
            elif event == "phx_leave":
                clients[socket].pop(topic, None)
                await socket.send(json.dumps([join_ref, ref, topic, "phx_reply",
                                              {"status": "ok", "response": {}}], separators=(",", ":")))
    finally:
        clients.pop(socket, None)


async def load_columns(connection):
    for table in TABLES:
        cursor = await connection.execute("""
          SELECT a.attname, t.typname
          FROM pg_attribute AS a
          JOIN pg_type AS t ON t.oid = a.atttypid
          WHERE a.attrelid = %s::regclass AND a.attnum > 0 AND NOT a.attisdropped
          ORDER BY a.attnum
        """, ("public." + table,))
        columns_by_table[table] = [{"name": name, "type": type_name}
                                   for name, type_name in await cursor.fetchall()]


async def broadcast(change: dict):
    table = change.get("table")
    if table not in TABLES:
        return
    data = {"schema": "public", "table": table,
            "commit_timestamp": change.get("commit_timestamp"),
            "type": change.get("type"), "columns": columns_by_table.get(table, []),
            "record": change.get("record") or {},
            "old_record": change.get("old_record") or {}, "errors": None}
    for socket, channels in list(clients.items()):
        for topic, subscribed in channels.items():
            subscription_id = subscribed.get(table)
            if subscription_id is None:
                continue
            message = [None, None, topic, "postgres_changes",
                       {"ids": [subscription_id], "data": data}]
            try:
                await socket.send(json.dumps(message, separators=(",", ":")))
            except (OSError, ConnectionClosed):
                clients.pop(socket, None)


async def database_listener():
    while True:
        try:
            async with await psycopg.AsyncConnection.connect(DATABASE_URL, autocommit=True) as connection:
                await load_columns(connection)
                await connection.execute("LISTEN " + CHANNEL)
                async for notification in connection.notifies():
                    try:
                        await broadcast(json.loads(notification.payload))
                    except (ValueError, TypeError):
                        continue
        except (psycopg.Error, OSError):
            await asyncio.sleep(2)


async def main():
    async with serve(socket_handler, "127.0.0.1", int(os.environ.get("MAPA_REALTIME_PORT", "13060")),
                     process_request=handshake, ping_interval=25, ping_timeout=25):
        await database_listener()


if __name__ == "__main__":
    asyncio.run(main())
