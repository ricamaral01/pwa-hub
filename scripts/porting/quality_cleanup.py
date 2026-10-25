"""Preview and clean only the approved synthetic Quality NC set.

Run as the PostgreSQL maintenance account. Never pass a password or DSN here.
The final preview JSON must be shown to Ricardo and approved before `clean`.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from uuid import UUID

import psycopg


BASE_IDS = frozenset({
    "4f0f0e4d-76ff-4262-9bfe-d4d089cfd47b",
    "4b2c6f6f-34a4-4672-a88b-3ae8cddca71d",
    "1c454aaf-05ae-499c-90fc-b435f9197745",
    "fb810b2a-9c1f-4944-9b6e-b19a490e539f",
    "b6e8ea38-f6e3-403d-be56-15343fa1e2f1",
    "94b014b5-cf36-41ff-8e8b-3560c46c876e",
    "646069cb-f105-465d-aed3-f417432ff2b4",
    "88267077-41a3-4487-ab90-1c02f0123873",
    "795690de-1ed5-4d16-b403-1b774e59b164",  # NC-2026-0008 explicitly authorized for the final approval list.
})
DEPENDENTS = (
    "nc_contencao", "nc_causa", "nc_acao", "nc_eficacia",
    "nc_encerramento", "nc_documento_ref", "nc_anexo", "nc_evento",
    "nc_comentario", "notificacao_outbox",
)


def snapshot(conn: psycopg.Connection) -> dict:
    with conn.cursor() as cur:
        cur.execute("SELECT id,numero,titulo,criado_por,criado_em FROM qualidade.nc ORDER BY id")
        all_rows = cur.fetchall()
        selected = []
        for ident, number, title, author, created in all_rows:
            ident = str(ident)
            ricardo_test = (author == "user-ricardo" and created.date().isoformat() >= "2026-10-15"
                            and "TESTE" in (title or ""))
            if ident in BASE_IDS or ricardo_test:
                selected.append({"id": ident, "numero": number, "titulo": title,
                                 "criado_por": author, "criado_em": created.isoformat()})
        ids = [UUID(row["id"]) for row in selected]
        cur.execute("SELECT id,nc_id,storage_path,sha256 FROM qualidade.nc_anexo WHERE nc_id = ANY(%s) ORDER BY id", (ids,))
        attachments = [{"id": str(row[0]), "nc_id": str(row[1]), "storage_path": row[2],
                        "sha256": row[3].strip()} for row in cur.fetchall()]
    return {"nc": selected, "attachments": attachments,
            "other_nc_count": len(all_rows) - len(selected)}


def validate_files(root: Path, attachments: list[dict]) -> list[Path]:
    root = root.resolve()
    paths = []
    for attachment in attachments:
        target = (root / attachment["storage_path"]).resolve()
        if not target.is_relative_to(root) or not target.is_file():
            raise ValueError("Anexo aprovado ausente ou fora do diretório privado")
        if hashlib.sha256(target.read_bytes()).hexdigest() != attachment["sha256"]:
            raise ValueError("SHA-256 de anexo aprovado divergente")
        paths.append(target)
    return paths


def clean(conn: psycopg.Connection, approved: dict, root: Path) -> dict:
    current = snapshot(conn)
    if current != approved or current["other_nc_count"]:
        raise ValueError("Lista aprovada diverge do banco; nova conferência necessária")
    if set(BASE_IDS) - {row["id"] for row in current["nc"]}:
        raise ValueError("Falta NC sintética obrigatória na lista")
    files = validate_files(root, current["attachments"])
    ids = [UUID(row["id"]) for row in current["nc"]]
    counts = {}
    conn.commit()  # The preview SELECT must not make the delete block a savepoint.
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute("SET LOCAL lock_timeout = '5s'")
            cur.execute("SELECT enabled FROM qualidade.nc_numbering_control WHERE id=1 FOR UPDATE")
            state = cur.fetchone()
            if not state or state[0] is not True:
                raise ValueError("Bloqueio de numeração precisa estar ativo")
            cur.execute("SELECT id FROM qualidade.nc FOR UPDATE")
            cur.execute("SET LOCAL qualidade.synthetic_cleanup = 'on'")
            cur.execute("DELETE FROM qualidade.nc_porque WHERE nc_causa_id IN "
                        "(SELECT id FROM qualidade.nc_causa WHERE nc_id = ANY(%s))", (ids,))
            counts["nc_porque"] = cur.rowcount
            cur.execute("DELETE FROM qualidade.nc_vinculo WHERE nc_id = ANY(%s) OR nc_relacionada_id = ANY(%s)", (ids, ids))
            counts["nc_vinculo"] = cur.rowcount
            cur.execute("ALTER TABLE qualidade.nc_evento DISABLE TRIGGER nc_evento_imutavel")
            for name in DEPENDENTS:
                cur.execute(f"DELETE FROM qualidade.{name} WHERE nc_id = ANY(%s)", (ids,))
                counts[name] = cur.rowcount
            cur.execute("ALTER TABLE qualidade.nc_evento ENABLE TRIGGER nc_evento_imutavel")
            cur.execute("DELETE FROM qualidade.nc WHERE id = ANY(%s)", (ids,))
            counts["nc"] = cur.rowcount
            if counts["nc"] != len(ids):
                raise ValueError("Contagem de NCs removidas divergente")
            cur.execute("UPDATE qualidade.nc_numero_contador SET ultimo_numero=0")
            cur.execute("SELECT count(*) FROM qualidade.nc WHERE numero IS NOT NULL")
            if cur.fetchone()[0]:
                raise ValueError("Restou NC numerada; limpeza abortada")
            cur.execute("SELECT count(*) FROM qualidade.nc_numero_contador WHERE ultimo_numero<>0")
            if cur.fetchone()[0]:
                raise ValueError("Contador não ficou zerado; limpeza abortada")
    for target in files:
        target.unlink()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("preview", "clean", "verify", "purge-files"))
    parser.add_argument("--database")
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--attachments", type=Path)
    parser.add_argument("--commit-production", action="store_true")
    args = parser.parse_args()
    if args.database == "qualidade" and args.mode == "clean" and not args.commit_production:
        raise ValueError("Limpeza do banco oficial exige --commit-production após OK de Ricardo")
    if args.mode == "purge-files" and not args.commit_production:
        raise ValueError("Remoção de anexos exige --commit-production")
    if args.mode in ("clean", "verify", "purge-files") and not args.attachments:
        raise ValueError("Diretório de anexos obrigatório para limpeza")
    if args.mode == "purge-files":
        if not args.database:
            raise ValueError("Banco obrigatório")
        check = subprocess.run(
            ["sudo", "-u", "postgres", "psql", "-X", "-At", "-d", args.database,
             "-c", "SELECT (SELECT count(*) FROM qualidade.nc),"
                   "(SELECT count(*) FROM qualidade.nc_numero_contador WHERE ultimo_numero<>0),"
                   "(SELECT enabled FROM qualidade.nc_numbering_control WHERE id=1)"],
            capture_output=True, text=True, check=True,
        )
        if check.stdout.strip() != "0|0|t":
            raise ValueError("Banco ainda contem NC, contador ou bloqueio desativado")
        approved = json.loads(args.manifest.read_text(encoding="utf-8"))
        files = validate_files(args.attachments, approved["attachments"])
        for target in files:
            target.unlink()
        print(json.dumps({"attachments_removed": len(files)}))
        return
    if not args.database:
        raise ValueError("Banco obrigatório")
    with psycopg.connect(f"dbname={args.database} user=postgres host=/var/run/postgresql") as conn:
        if args.mode == "preview":
            result = snapshot(conn)
            args.manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(json.dumps({"nc": len(result["nc"]), "attachments": len(result["attachments"]),
                              "other_nc_count": result["other_nc_count"]}))
        elif args.mode == "verify":
            approved = json.loads(args.manifest.read_text(encoding="utf-8"))
            if snapshot(conn) != approved:
                raise ValueError("Restauracao difere do manifesto")
            files = validate_files(args.attachments, approved["attachments"])
            print(json.dumps({"nc": len(approved["nc"]), "attachments_verified": len(files)}))
        else:
            approved = json.loads(args.manifest.read_text(encoding="utf-8"))
            result = clean(conn, approved, args.attachments)
            print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"quality_cleanup failed: {type(error).__name__}")
        raise SystemExit(1) from None
