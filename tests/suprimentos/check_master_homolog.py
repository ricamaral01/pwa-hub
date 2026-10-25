"""Verifica acesso real dos masters à casca e API do Suprimentos em :18446.

Executar no host de homologação, com o ambiente do serviço Mapa carregado.
Não grava nem imprime sessão ou credenciais.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from http.cookiejar import Cookie, CookieJar
from urllib.request import HTTPCookieProcessor, Request, build_opener

ROOT = "https://concrefer.concretrack.com.br:18446"
MAPA_DIR = Path("/opt/concrefer-unificado/homolog-next/mapa-api")
sys.path.insert(0, str(MAPA_DIR))
from app import COOKIE_NAME, connect, signer  # noqa: E402
from screen_access import MASTER_USER_IDS  # noqa: E402


def main() -> None:
    output = Path(sys.argv[1]).resolve()
    masters = sorted(MASTER_USER_IDS)
    with connect() as conn, conn.cursor() as cursor:
        cursor.execute("""SELECT id,nome,updated_at FROM public.usuarios
                          WHERE id=ANY(%s) AND ativo AND NOT primeiro_acesso
                            AND deleted_at IS NULL""", (masters,))
        users = {row["id"]: row for row in cursor.fetchall()}
    assert set(users) == set(masters)
    checked = []
    for user_id in masters:
        user = users[user_id]
        token = signer().dumps({"scope": "session", "id": user_id,
                                "updated_at": user["updated_at"].isoformat()})
        jar = CookieJar()
        jar.set_cookie(Cookie(0, COOKIE_NAME, token, None, False,
                              "concrefer.concretrack.com.br", True, False,
                              "/unificado/", True, True, None, True,
                              None, None, {}, False))
        opener = build_opener(HTTPCookieProcessor(jar))

        def call(path: str, method: str = "GET") -> tuple[int, dict | str]:
            request = Request(ROOT + path, data=b"" if method == "POST" else None,
                              method=method)
            with opener.open(request, timeout=20) as response:
                payload = response.read().decode("utf-8")
                return response.status, json.loads(payload) if "application/json" in response.headers.get("Content-Type", "") else payload

        status, screen_body = call("/unificado/mapa/api/unified/screen-access/me")
        assert status == 200, (user_id, "screen", status)
        expected = {"suprimentosPainel", "suprimentosSolicitacoes", "suprimentosNova",
                    "suprimentosFornecedores", "suprimentosCadastros"}
        assert expected.issubset(set(screen_body["screens"])), user_id
        status, _ = call("/unificado/mapa/api/unified/suprimentos-bootstrap", "POST")
        assert status == 200, (user_id, "bootstrap", status)
        status, me = call("/api/suprimentos/me")
        assert status == 200, (user_id, "api", status)
        roles = {(row["papel"], row["nivel"], row["cc_id"]) for row in me["papeis"]}
        assert {("ADMIN", None, None), ("APROVADOR", 1, None),
                ("APROVADOR", 2, None)}.issubset(roles), user_id
        status, _ = call("/unificado/suprimentos/painel/")
        assert status == 200, (user_id, "page", status)
        checked.append({"id": user_id, "screens": len(expected),
                        "bootstrap": 200, "api": 200, "page": 200,
                        "roles": ["ADMIN", "APROVADOR N1", "APROVADOR N2"]})
    output.write_text(json.dumps(checked, ensure_ascii=False, indent=2), encoding="utf-8")
    output.chmod(0o600)
    print(f"MASTER_ACCESS_OK {len(checked)}/{len(masters)}")


if __name__ == "__main__":
    main()
