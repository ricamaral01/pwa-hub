"""C1: export restored GED RNCs, then import atomically into Quality.

Run export as root (Docker access), import as postgres (peer authentication).
The official target requires an explicit flag and a frozen numbering control.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import time
import uuid
from pathlib import Path

import psycopg
from psycopg.conninfo import conninfo_to_dict
from psycopg.types.json import Jsonb

TABLES = ("rnc_reports", "rnc_root_cause_analyses", "rnc_action_plans",
          "rnc_effectiveness_reviews", "rnc_history", "rnc_attachments", "users")
SEVERITY = {"CRITICA": "MAIOR", "ALTA": "MAIOR", "MEDIA": "MENOR", "BAIXA": "OBSERVACAO"}
STATUS = {"ABERTA": "REGISTRADA", "ENCERRADA": "ENCERRADA"}
GED_UPLOADS = Path("/opt/ged_concrefer/backend/uploads").resolve()


def uid() -> str:
    # RFC 9562 UUIDv7; PostgreSQL 16 has no native UUIDv7 generator.
    millis = int(time.time() * 1000) & ((1 << 48) - 1)
    value = millis << 80 | 7 << 76 | (uuid.uuid4().int & ((1 << 76) - 1))
    value = value & ~(3 << 62) | 2 << 62
    return str(uuid.UUID(int=value))


def attachment_paths(item: dict, root: Path) -> tuple[Path, Path, str]:
    raw = str(item["storage_path"])
    if not raw.startswith("/uploads/"):
        raise ValueError(f"Caminho de anexo GED inesperado: {item['id']}")
    source = (GED_UPLOADS / raw.removeprefix("/uploads/")).resolve()
    if not source.is_relative_to(GED_UPLOADS) or not source.is_file():
        raise ValueError(f"Anexo GED ausente ou fora de uploads: {item['id']}")
    relative = f"legacy/{item['rnc_id']}/{item['id']}"
    target = (root / relative).resolve()
    if not target.is_relative_to(root):
        raise ValueError(f"Destino de anexo inválido: {item['id']}")
    return source, target, relative


def stage_attachments(items: list[dict], root: Path, owner: str) -> None:
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    root = root.resolve()
    for item in items:
        source, target, _ = attachment_paths(item, root)
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if source.stat().st_size != item["file_size"]:
            raise ValueError(f"Tamanho divergente no anexo GED: {item['id']}")
        target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        if target.exists():
            if hashlib.sha256(target.read_bytes()).hexdigest() != digest:
                raise ValueError(f"Anexo já existe no destino com hash diferente: {item['id']}")
        else:
            shutil.copyfile(source, target)
        shutil.chown(target.parent, user=owner, group=owner)
        shutil.chown(target, user=owner, group=owner)
        target.chmod(0o600)


def export_source(folder: Path, attachments_root: Path, attachment_owner: str) -> None:
    folder.mkdir(mode=0o700, parents=True, exist_ok=True)
    for table in TABLES:
        sql = f"SELECT row_to_json(t)::text FROM public.{table} t ORDER BY t.id"
        result = subprocess.run(["docker", "exec", "ged_postgres", "psql", "-U", "ged_user",
                                 "-d", "ged_concrefer", "-qAt", "-c", sql],
                                capture_output=True, text=True, check=True)
        rows = [json.loads(line) for line in result.stdout.splitlines() if line]
        (folder / f"{table}.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        print(f"{table}: {len(rows)}")
        if table == "rnc_attachments":
            stage_attachments(rows, attachments_root, attachment_owner)


def read_source(folder: Path) -> dict[str, list[dict]]:
    return {table: json.loads((folder / f"{table}.json").read_text(encoding="utf-8")) for table in TABLES}


def ref(cur, table: str, company: str, code: str | None, *, legacy=False) -> str | None:
    if not code:
        return None
    col = "codigo_legado" if legacy else "codigo"
    cur.execute(f"SELECT id FROM qualidade.{table} WHERE empresa_id=%s AND {col}=%s", (company, code))
    row = cur.fetchone()
    if not row:
        raise ValueError(f"Catálogo ausente: {table}.{col}={code}")
    return str(row[0])


def mapped_user(value: str | None, mapping: dict[str, str]) -> str | None:
    return mapping.get(str(value)) if value else None


def import_target(folder: Path, target: str, mapping_file: Path, report: Path,
                  attachments_root: Path, commit_production: bool) -> None:
    if target == "qualidade":
        if not commit_production or attachments_root != Path("/var/lib/qualidade/anexos"):
            raise ValueError("Banco oficial exige --commit-production e diretório oficial de anexos")
    elif target not in {"qualidade_c1_ensaio", "qualidade_c1_campinas_ensaio"} or commit_production:
        raise ValueError("Alvo C1 inválido")
    src = read_source(folder)
    attachments_root = attachments_root.resolve()
    mapping = json.loads(mapping_file.read_text(encoding="utf-8"))
    units = mapping.get("units", {})
    users_map = mapping.get("users", {})
    responsible_users = mapping.get("responsible_users", {})
    reports = src["rnc_reports"]
    missing = [r["id"] for r in reports if r["id"] not in units]
    if missing:
        raise ValueError(f"Unidade não definida para IDs: {missing}")
    if target == "qualidade" and any(r["id"] not in responsible_users for r in reports):
        raise ValueError("Usuário de destino não definido para todas as RNCs")
    by_nc = {table: {} for table in TABLES if table not in ("rnc_reports", "users")}
    for table, grouped in by_nc.items():
        for row in src[table]:
            grouped.setdefault(row["rnc_id"], []).append(row)
    ged_users = {u["id"]: u for u in src["users"]}
    result = []
    dsn = os.getenv("QUALIDADE_C1_DSN", f"dbname={target} user=postgres")
    if conninfo_to_dict(dsn).get("dbname") != target:
        raise ValueError("QUALIDADE_C1_DSN aponta para banco diferente do alvo explícito")
    with psycopg.connect(dsn) as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                if target == "qualidade":
                    cur.execute("SELECT session_user")
                    if cur.fetchone()[0] != "postgres":
                        raise ValueError("C1 oficial exige a sessão de manutenção postgres")
                    cur.execute("SELECT enabled FROM qualidade.nc_numbering_control WHERE id=1 FOR UPDATE")
                    control = cur.fetchone()
                    if not control or control[0] is not True:
                        raise ValueError("Bloqueio de numeração precisa estar ativo antes da C1")
                    cur.execute("SELECT count(*) FROM qualidade.nc WHERE numero IS NOT NULL")
                    if cur.fetchone()[0] != 0:
                        raise ValueError("C1 interrompida: existem NCs numeradas")
                    cur.execute("SELECT count(*) FROM qualidade.nc_numero_contador WHERE ultimo_numero <> 0")
                    if cur.fetchone()[0] != 0:
                        raise ValueError("C1 interrompida: contador de NC não está zerado")
                    cur.execute("SET LOCAL qualidade.c1_import = 'on'")
                cur.execute("SELECT id FROM qualidade.empresa ORDER BY codigo LIMIT 1")
                company = str(cur.fetchone()[0])
                for r in sorted(reports, key=lambda x: x["number"]):
                    legacy_id = r["id"]
                    cur.execute("SELECT id,numero,status FROM qualidade.nc WHERE id_legado=%s", (legacy_id,))
                    existing = cur.fetchone()
                    if existing:
                        result.append({"ged_id": legacy_id, "ged_numero": r["number"], "nc_id": str(existing[0]), "nc_numero": existing[1], "nc_status": existing[2], "reused": True})
                        continue
                    if r["status"] not in STATUS:
                        raise ValueError(f"Estado legado sem decisão de mapeamento: {r['status']}")
                    if r["severity"] not in SEVERITY:
                        raise ValueError(f"Gravidade legada sem mapeamento: {r['severity']}")
                    unit = units[legacy_id]
                    cur.execute("SELECT 1 FROM qualidade.unidade WHERE codigo=%s AND empresa_id=%s", (unit, company))
                    if not cur.fetchone():
                        raise ValueError(f"Unidade inválida: {unit}")
                    year = int(r["created_at"][:4])
                    cur.execute("INSERT INTO qualidade.nc_numero_contador(empresa_id,ano,ultimo_numero) VALUES(%s,%s,1) "
                                "ON CONFLICT(empresa_id,ano) DO UPDATE SET ultimo_numero=qualidade.nc_numero_contador.ultimo_numero+1 RETURNING ultimo_numero", (company, year))
                    sequence = cur.fetchone()[0]
                    if sequence > 9999:
                        raise ValueError("Contador NC excede 9999")
                    number = f"NC-{year}-{sequence:04d}"
                    nc_id = uid()
                    origin = ref(cur, "origem", company, r["origin"], legacy=True)
                    kind = ref(cur, "tipo", company, r["rnc_type"], legacy=True)
                    severity = ref(cur, "gravidade", company, SEVERITY[r["severity"]])
                    emitter = ref(cur, "area", company, r["emitter_area"], legacy=True)
                    destination = ref(cur, "area", company, r["destination_area"], legacy=True)
                    author = mapped_user(r.get("created_by"), users_map)
                    fields = {
                        "id": nc_id, "empresa_id": company, "unidade_codigo": unit,
                        "numero": number, "numero_legado": r["number"], "id_legado": legacy_id,
                        "titulo": r["title"], "descricao": r["description"], "status": STATUS[r["status"]],
                        "status_legado": r["status"], "gravidade_legado": r["severity"],
                        "origem_legado": r["origin"], "tipo_legado": r["rnc_type"],
                        "origem_id": origin, "tipo_id": kind, "gravidade_id": severity,
                        "area_emissora_id": emitter, "area_responsavel_id": destination,
                        "data_ocorrencia": r.get("occurrence_at"), "data_deteccao": r.get("detected_at"),
                        "requisito_texto": r.get("requirement_reference"), "evidencias_texto": r.get("evidence_description"),
                        "impacto": r.get("impact_description"), "referencia_origem": r.get("source_reference"),
                        "produto_texto": r.get("product_reference"), "lote_texto": r.get("lot_reference"),
                        "processo_texto": r.get("process_reference"), "fornecedor_texto": r.get("supplier_reference"),
                        "cliente_texto": r.get("customer_reference"), "pedido_texto": r.get("order_reference"),
                        "responsavel_id": responsible_users.get(legacy_id) or mapped_user(r.get("responsible_sector_user_id"), users_map),
                        "atribuido_por": mapped_user(r.get("assigned_by"), users_map),
                        "observacoes_triagem": r.get("triage_notes"), "prazo_final": r.get("due_date"),
                        "encerrada_em": r.get("closed_at"), "encerrada_por": mapped_user(r.get("closed_by"), users_map),
                        "reaberta_em": r.get("reopened_at"), "reaberta_por": mapped_user(r.get("reopened_by"), users_map),
                        "legado": True, "legado_payload": Jsonb(r),
                        "criado_por": author, "atualizado_por": mapped_user(r.get("updated_by"), users_map),
                        "criado_em": r["created_at"], "atualizado_em": r["updated_at"],
                    }
                    cols = ",".join(fields)
                    placeholders = ",".join(["%s"] * len(fields))
                    cur.execute(f"INSERT INTO qualidade.nc({cols}) VALUES({placeholders})", tuple(fields.values()))
                    base = {"nc_id": nc_id, "empresa_id": company, "unidade_codigo": unit}
                    if r.get("containment_action"):
                        cur.execute("INSERT INTO qualidade.nc_contencao(id,nc_id,empresa_id,unidade_codigo,descricao,criado_por) VALUES(%s,%s,%s,%s,%s,%s)",
                                    (uid(), nc_id, company, unit, r["containment_action"], author))
                    if r.get("conclusion_summary"):
                        cur.execute("INSERT INTO qualidade.nc_encerramento(id,nc_id,empresa_id,unidade_codigo,conclusao,aprovado_por,aprovado_em,criado_por) VALUES(%s,%s,%s,%s,%s,%s,%s,%s)",
                                    (uid(), nc_id, company, unit, r["conclusion_summary"], mapped_user(r.get("closed_by"), users_map), r.get("closed_at"), author))
                    for c in by_nc["rnc_root_cause_analyses"].get(legacy_id, []):
                        cur.execute("INSERT INTO qualidade.nc_causa(id,nc_id,empresa_id,unidade_codigo,metodo,problema,causa_direta,causa_raiz,causas_contribuintes,metodo_payload,validado_por,id_legado,legado_payload,criado_por,criado_em,atualizado_em) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                                    (uid(), nc_id, company, unit, c["method"], c["problem_statement"], c.get("direct_cause"), c.get("root_cause"), c.get("contributing_causes"), Jsonb(c.get("method_payload") or {}), mapped_user(c.get("validated_by"), users_map), c["id"], Jsonb(c), mapped_user(c.get("created_by"), users_map), c["created_at"], c["updated_at"]))
                    for a in by_nc["rnc_action_plans"].get(legacy_id, []):
                        cur.execute("INSERT INTO qualidade.nc_acao(id,nc_id,empresa_id,unidade_codigo,tipo,status,status_legado,o_que,por_que,onde,quem_id,quando,como,quanto,evidencia,concluida_em,verificada_por,notas_verificacao,id_legado,legado_payload,criado_por,criado_em,atualizado_em) VALUES(" + ",".join(["%s"] * 23) + ")",
                                    (uid(), nc_id, company, unit, a["action_type"], "PENDENTE" if a["status"] == "ATRASADA" else a["status"], a["status"], a["action_description"], a.get("why"), a.get("where_action"), mapped_user(a.get("who_user_id"), users_map), a.get("when_due"), a.get("how"), a.get("how_much"), a.get("evidence"), a.get("completed_at"), mapped_user(a.get("verified_by"), users_map), a.get("verification_notes"), a["id"], Jsonb(a), mapped_user(a.get("created_by"), users_map), a["created_at"], a["updated_at"]))
                    for e in by_nc["rnc_effectiveness_reviews"].get(legacy_id, []):
                        cur.execute("INSERT INTO qualidade.nc_eficacia(id,nc_id,empresa_id,unidade_codigo,rodada,resultado,verificador_id,verificada_em,notas,requer_acompanhamento,id_legado,legado_payload,criado_por) VALUES(%s,%s,%s,%s,1,%s,%s,%s,%s,%s,%s,%s,%s)",
                                    (uid(), nc_id, company, unit, "EFICAZ" if e["effectiveness_result"] else "NAO_EFICAZ", mapped_user(e.get("reviewed_by"), users_map), e["reviewed_at"], e.get("notes"), e["follow_up_required"], e["id"], Jsonb(e), mapped_user(e.get("reviewed_by"), users_map)))
                    for h in by_nc["rnc_history"].get(legacy_id, []):
                        who = ged_users.get(h.get("created_by"), {})
                        cur.execute("INSERT INTO qualidade.nc_evento(id,nc_id,empresa_id,unidade_codigo,tipo,descricao,payload,autor_id,autor_texto,ocorrido_em,importado,id_legado,legado_payload,criado_por) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true,%s,%s,%s)",
                                    (uid(), nc_id, company, unit, h["event_type"], h["description"], Jsonb(h.get("metadata") or {}), mapped_user(h.get("created_by"), users_map), who.get("name") or who.get("email"), h["created_at"], h["id"], Jsonb(h), mapped_user(h.get("created_by"), users_map)))
                    for a in by_nc["rnc_attachments"].get(legacy_id, []):
                        source, staged, relative = attachment_paths(a, attachments_root)
                        digest = hashlib.sha256(source.read_bytes()).hexdigest()
                        if not staged.is_file() or hashlib.sha256(staged.read_bytes()).hexdigest() != digest:
                            raise ValueError(f"Anexo não preparado com hash correto: {a['id']}")
                        cur.execute("INSERT INTO qualidade.nc_anexo(id,nc_id,empresa_id,unidade_codigo,nome_original,nome_armazenado,mime,tamanho,sha256,etapa,storage_path,storage_path_legado,enviado_por,enviado_em,id_legado,legado_payload,criado_por) VALUES(" + ",".join(["%s"] * 17) + ")",
                                    (uid(), nc_id, company, unit, a["original_name"], a["file_name"], a["mime_type"], a["file_size"], digest, "LEGADO", relative, a["storage_path"], mapped_user(a.get("uploaded_by"), users_map), a["created_at"], a["id"], Jsonb(a), mapped_user(a.get("uploaded_by"), users_map)))
                    original = {table: ([r] if table == "rnc_reports" else by_nc[table].get(legacy_id, [])) for table in by_nc | {"rnc_reports": {}}}
                    who = ged_users.get(r.get("created_by"), {})
                    cur.execute("INSERT INTO qualidade.nc_evento(id,nc_id,empresa_id,unidade_codigo,tipo,descricao,payload,autor_id,autor_texto,ocorrido_em,importado,criado_por) VALUES(%s,%s,%s,%s,'IMPORTACAO',%s,%s,%s,%s,now(),true,%s)",
                                (uid(), nc_id, company, unit, f"Importação da {r['number']}", Jsonb(original), author, who.get("name") or who.get("email"), author))
                    result.append({"ged_id": legacy_id, "ged_numero": r["number"], "ged_titulo": r["title"], "ged_status": r["status"], "ged_gravidade": r["severity"], "nc_id": nc_id, "nc_numero": number, "nc_status": STATUS[r["status"]], "nc_gravidade": SEVERITY[r["severity"]], "unidade": unit, "reused": False})
    report.write_text(json.dumps({"source_counts": {t: len(src[t]) for t in TABLES if t != "users"}, "rows": result}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported/reused {len(result)} RNCs; report: {report}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=("export", "import"))
    parser.add_argument("--folder", type=Path, required=True)
    parser.add_argument("--target", default="qualidade_c1_ensaio")
    parser.add_argument("--mapping", type=Path)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--attachments-root", type=Path, default=Path("/var/lib/qualidade/c1-ensaio-anexos"))
    parser.add_argument("--attachment-owner", default="postgres")
    parser.add_argument("--commit-production", action="store_true")
    args = parser.parse_args()
    if args.phase == "export":
        export_source(args.folder, args.attachments_root, args.attachment_owner)
    else:
        if not args.mapping or not args.report:
            parser.error("import requires --mapping and --report")
        import_target(args.folder, args.target, args.mapping, args.report,
                      args.attachments_root, args.commit_production)
