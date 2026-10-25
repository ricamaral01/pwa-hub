"""Cria ou remove somente o conjunto DEMO do manual em :18446.

Executar no host de homologação com o wrapper de ambiente protegido:
  bash /tmp/suprimentos-env-run-homolog.sh manual-demo-homolog.py seed <manifest.json> [foto.png]
  bash /tmp/suprimentos-env-run-homolog.sh manual-demo-homolog.py cleanup <manifest.json>

O manifesto deve ficar fora do webroot, em diretório 0700. A limpeza confere IDs,
CC e prefixos antes de apagar. Nenhum registro de produção é acessado.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row

sys.path.insert(0, "/opt/concrefer-unificado/homolog-next/suprimentos/service")
from suprimentos.auth import sign_assertion  # noqa: E402

ROOT = "http://127.0.0.1:13167/api/suprimentos"
ACTORS = {
    "sol": ("e2e-suprimentos-sol", "Solicitante Demo"),
    "apr1": ("e2e-suprimentos-aprov1", "Aprovador N1 Demo"),
    "apr2": ("e2e-suprimentos-aprov2", "Aprovador N2 Demo"),
    "almox": ("e2e-suprimentos-almox", "Almoxarife Demo"),
    "buyer": ("e2e-suprimentos-compras", "Comprador Demo"),
    "admin": ("user-ricardo", "Ricardo"),
}
STATES = (
    ("rascunho", "RASCUNHO", "NORMAL", "Luva de raspa tamanho G", 8),
    ("aprovacao-n1", "EM_APROVACAO", "URGENTE", 'Disco de corte 7"', 12),
    ("aprovacao-n2", "EM_APROVACAO", "PAROU_PRODUCAO", "Rolamento 6205 para manutenção", 2),
    ("devolvida", "DEVOLVIDA", "NORMAL", "Desmoldante para formas", 4),
    ("aprovada", "APROVADA", "URGENTE", "Espaçador plástico", 30),
    ("parcial", "EM_ATENDIMENTO", "NORMAL", "Luva de raspa tamanho G", 10),
    ("entregue", "ENTREGUE", "NORMAL", 'Disco de corte 7"', 4),
    ("concluida", "CONCLUIDA", "NORMAL", "Desmoldante para formas", 2),
    ("reprovada", "REPROVADA", "URGENTE", "Item livre: chave especial para ajuste", 1),
)


def api(actor: str, method: str, path: str, payload=None, photo: bytes | None = None):
    ident, name = ACTORS[actor]
    assertion = sign_assertion(ident, name, os.environ["SUPRIMENTOS_GATEWAY_SIGNING_KEY"])
    headers = {"X-Suprimentos-Assertion": assertion}
    if photo is not None:
        boundary = "demo-" + uuid4().hex
        mime = "image/jpeg" if photo.startswith(b"\xff\xd8\xff") else "image/png"
        suffix = "jpg" if mime == "image/jpeg" else "png"
        body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"arquivo\"; filename=\"foto-demo.{suffix}\"\r\n"
                f"Content-Type: {mime}\r\n\r\n").encode() + photo + f"\r\n--{boundary}--\r\n".encode()
        headers["Content-Type"] = "multipart/form-data; boundary=" + boundary
    elif payload is not None:
        body = json.dumps(payload, ensure_ascii=False).encode()
        headers["Content-Type"] = "application/json"
    else:
        body = None
    request = Request(ROOT + path, data=body, headers=headers, method=method)
    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode())
    except HTTPError as exc:
        raise RuntimeError(f"{method} {path}: HTTP {exc.code} {exc.read().decode()[:300]}") from None


def check_stage(manifest: Path):
    if os.getenv("SUPRIMENTOS_ENVIRONMENT") != "homolog":
        raise RuntimeError("Somente homologação")
    dsn = os.environ["SUPRIMENTOS_DATABASE_URL"].replace("postgresql+psycopg://", "postgresql://", 1)
    if "suprimentos_homolog_20261025" not in dsn:
        raise RuntimeError("Banco não é o de homologação")
    backup_root = Path("/opt/concrefer-unificado/homolog-next/backups").resolve()
    if backup_root not in manifest.resolve().parents:
        raise RuntimeError("Manifesto precisa estar em backup protegido")
    if manifest.parent.stat().st_mode & 0o077:
        raise RuntimeError("Diretório do manifesto precisa ser 0700")
    return dsn


def write_manifest(path: Path, content: dict):
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
    path.chmod(0o600)


def seed(manifest: Path, photo_path: Path | None):
    check_stage(manifest)
    if manifest.exists():
        raise RuntimeError("Conjunto DEMO já criado; use o manifesto existente")
    state = {"cc": None, "roles": [], "requests": {}, "photos": [], "prefix": "DEMO-MANUAL-20261025"}
    cc = api("admin", "POST", "/cadastros/centros-custo", {
        "codigo": "DEMO-MANUAL-20261025", "nome": "DEMO · treinamento Campinas",
        "setor": "DEMO · Almoxarifado geral",
    })
    state["cc"] = cc["id"]
    write_manifest(manifest, state)
    for actor, role, level in (("sol", "SOLICITANTE", None), ("apr1", "APROVADOR", 1),
                               ("apr2", "APROVADOR", 2), ("almox", "ALMOXARIFE", None),
                               ("buyer", "COMPRADOR", None)):
        role_payload = {"iam_user_id": ACTORS[actor][0], "papel": role, "cc_id": cc["id"]}
        if level is not None:
            role_payload["nivel"] = level
        grant = api("admin", "POST", "/cadastros/usuarios-papeis", role_payload)
        state["roles"].append(grant["id"])
        write_manifest(manifest, state)
    measures = api("admin", "GET", "/cadastros/unidades-medida?size=100")["items"]
    measure = next(row["id"] for row in measures if row["sigla"] == "un")
    for key, desired, urgency, item_name, quantity in STATES:
        payload = {"client_uuid": str(uuid4()), "cc_id": cc["id"], "urgencia": urgency,
                   "justificativa": f"DEMO — cenário {key}: {item_name}. Treinamento do fluxo de Campinas.",
                   "itens": [{"descricao_livre": item_name, "qtd": quantity, "un": measure}]}
        created = api("sol", "POST", "/pwa/solicitacoes", payload)
        rid, iid = created["id"], created["itens"][0]["id"]
        state["requests"][key] = {"id": rid, "numero": created["numero"], "item": iid,
                                   "esperado": desired, "urgencia": urgency}
        write_manifest(manifest, state)
        if key == "aprovacao-n2":
            api("buyer", "POST", f"/itens/{iid}/preco", {"preco": "2500.01"})
        if key == "aprovada" and photo_path:
            photo = api("sol", "POST", f"/solicitacoes/{rid}/fotos", photo=photo_path.read_bytes())
            state["photos"].append(photo["id"])
            write_manifest(manifest, state)
        if desired == "RASCUNHO":
            continue
        sent = api("sol", "POST", f"/solicitacoes/{rid}/enviar", {})
        if key == "aprovacao-n2":
            if sent["niveis_total"] != 2:
                raise RuntimeError("N2 não foi configurado")
            api("apr1", "POST", f"/solicitacoes/{rid}/aprovar", {})
            continue
        if desired == "EM_APROVACAO":
            continue
        if desired == "DEVOLVIDA":
            api("apr1", "POST", f"/solicitacoes/{rid}/devolver", {"comentario": "DEMO — informar especificação do material."})
            continue
        if desired == "REPROVADA":
            api("apr1", "POST", f"/solicitacoes/{rid}/reprovar", {"comentario": "DEMO — necessidade não autorizada."})
            continue
        api("apr1", "POST", f"/solicitacoes/{rid}/aprovar", {})
        if desired == "APROVADA":
            continue
        api("almox", "POST", f"/itens/{iid}/separar", {})
        if desired == "EM_ATENDIMENTO":
            api("almox", "POST", f"/itens/{iid}/entregar", {"qtd": 4})
            continue
        api("almox", "POST", f"/itens/{iid}/entregar", {"qtd": quantity})
        if desired == "CONCLUIDA":
            api("sol", "POST", f"/solicitacoes/{rid}/confirmar-recebimento", {})
    for key, entry in state["requests"].items():
        detail = api("admin", "GET", f"/solicitacoes/{entry['id']}")
        if detail["status"] != entry["esperado"]:
            raise RuntimeError(f"{key}: estado {detail['status']} em vez de {entry['esperado']}")
    print("DEMO_SEED_OK pedidos=" + str(len(state["requests"])) + " cc=" + cc["codigo"])
    for key, entry in state["requests"].items():
        print(key + "=" + entry["numero"] + ":" + entry["esperado"])


def cleanup(manifest: Path):
    dsn = check_stage(manifest)
    state = json.loads(manifest.read_text(encoding="utf-8"))
    if state.get("prefix") != "DEMO-MANUAL-20261025" or not state.get("cc"):
        raise RuntimeError("Manifesto inválido")
    ids = [entry["id"] for entry in state["requests"].values()]
    paths = []
    with psycopg.connect(dsn, row_factory=dict_row) as db, db.cursor() as cursor:
        cursor.execute("SELECT codigo FROM suprimentos.sup_centro_custo WHERE id=%s FOR UPDATE", (state["cc"],))
        row = cursor.fetchone()
        if not row or row["codigo"] != state["prefix"]:
            raise RuntimeError("CC DEMO não confere")
        cursor.execute("SELECT id FROM suprimentos.sup_solicitacao WHERE cc_id=%s", (state["cc"],))
        actual = {str(r["id"]) for r in cursor.fetchall()}
        if actual != set(ids):
            raise RuntimeError("Solicitações divergentes; limpeza interrompida")
        cursor.execute("SELECT storage_path FROM suprimentos.sup_solicitacao_foto WHERE solicitacao_id=ANY(%s::uuid[])", (ids,))
        paths = [Path(r["storage_path"]) for r in cursor.fetchall()]
        cursor.execute("DELETE FROM suprimentos.sup_evento WHERE alvo_id=ANY(%s::uuid[]) OR alvo_id IN (SELECT id FROM suprimentos.sup_solicitacao_item WHERE solicitacao_id=ANY(%s::uuid[]))", (ids, ids))
        for table in ("sup_aprovacao", "sup_solicitacao_foto", "sup_reserva", "sup_sugestao_ressuprimento", "sup_solicitacao_item", "sup_solicitacao"):
            column = "id" if table == "sup_solicitacao" else "solicitacao_id"
            if table == "sup_reserva":
                cursor.execute("DELETE FROM suprimentos.sup_reserva WHERE solicitacao_item_id IN (SELECT id FROM suprimentos.sup_solicitacao_item WHERE solicitacao_id=ANY(%s::uuid[]))", (ids,))
            else:
                cursor.execute(f"DELETE FROM suprimentos.{table} WHERE {column}=ANY(%s::uuid[])", (ids,))
        cursor.execute("DELETE FROM suprimentos.sup_usuario_papel WHERE id=ANY(%s::uuid[])", (state["roles"],))
        cursor.execute("DELETE FROM suprimentos.sup_centro_custo WHERE id=%s", (state["cc"],))
        db.commit()
    for path in paths:
        if "homolog-next/suprimentos/data" in str(path):
            path.unlink(missing_ok=True)
    manifest.unlink()
    print("DEMO_CLEANUP_OK pedidos=" + str(len(ids)))


if __name__ == "__main__":
    if len(sys.argv) not in (3, 4) or sys.argv[1] not in {"seed", "cleanup"}:
        raise SystemExit("Uso: manual-demo-homolog.py seed|cleanup <manifest> [foto]")
    action, path = sys.argv[1], Path(sys.argv[2])
    if action == "seed":
        seed(path, Path(sys.argv[3]) if len(sys.argv) == 4 else None)
    else:
        cleanup(path)
