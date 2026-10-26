"""Regressão de acesso real de cinco contas na homologação, sem salvar cookies."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "unificado"))
from homolog_session import REMOTE_SCRIPT, test_cookie_for

ROOT = "https://concrefer.concretrack.com.br:18446"
DOC = Path("docs/porting/suprimentos")


def session_for(user_id: str) -> str:
    if re.fullmatch(r"[A-Za-z0-9_-]{1,80}", user_id):
        return test_cookie_for(user_id)
    if not re.fullmatch(r"[A-Za-z0-9_.-]{1,80}", user_id):
        raise ValueError("ID de teste inválido")
    script = REMOTE_SCRIPT.replace(
        "cur.execute(\"SELECT id, updated_at FROM public.usuarios WHERE id = 'user-ricardo' AND ativo\")",
        "cur.execute(\"SELECT id, updated_at FROM public.usuarios WHERE id = %s AND ativo\", (" + json.dumps(user_id) + ",))",
    ).replace("print(json.dumps({'ricardo': signed(ricardo), 'unlinked': signed(unlinked)}))",
              "print(signed(ricardo))")
    result = subprocess.run(['ssh', 'vps-staging',
        '/opt/concrefer-unificado/homolog-next/mapa-api/.venv/bin/python', '-'],
        input=script, text=True, capture_output=True, check=True)
    return result.stdout.strip()


def main(round_number: int):
    baseline = json.loads((DOC / "e7-screen-access-final.json").read_text(encoding="utf-8"))
    rows = []
    for prior in baseline:
        user_id = prior["id"]
        token = session_for(user_id)
        client = requests.Session()
        client.cookies.set("mapa_unificado_homolog_session", token,
                           domain="concrefer.concretrack.com.br", path="/unificado/")
        response = client.get(ROOT + "/unificado/mapa/api/unified/screen-access/me", timeout=20)
        response.raise_for_status()
        body = response.json()
        actual = sorted(x for x in body["screens"] if not x.startswith("suprimentos"))
        expected = sorted(x for x in prior["screens"] if not x.startswith("suprimentos"))
        if actual != expected:
            raise AssertionError((user_id, "telas preexistentes alteradas",
                                  sorted(set(expected) - set(actual)), sorted(set(actual) - set(expected))))
        if prior["suprimentos_enabled"] and not body.get("suprimentos_enabled"):
            raise AssertionError((user_id, "Suprimentos desapareceu"))
        rows.append({"id": user_id, "telas_preexistentes": len(actual),
                     "telas_suprimentos": len([x for x in body["screens"] if x.startswith("suprimentos")]),
                     "suprimentos_enabled": bool(body.get("suprimentos_enabled")),
                     "flags": body.get("suprimentos_flags", {})})
    target = DOC / "capturas" / "f7" / f"acessos-rodada-{round_number}.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print("F7_ACCESS_OK", round_number, len(rows), "contas")


if __name__ == "__main__":
    main(int(sys.argv[1]))
