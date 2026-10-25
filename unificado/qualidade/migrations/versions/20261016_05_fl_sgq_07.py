"""FL-SGQ-07 fields, efficacy follow-up and randomly drawn public RNC numbers.

Revision ID: 20261016_05
Revises: 20261015_04
"""
from __future__ import annotations

import json
import secrets
from uuid import uuid4

from alembic import op
from sqlalchemy import text


revision = "20261016_05"
down_revision = "20261015_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # The migration and the API release are performed with the Quality service
    # stopped. This lock also prevents an accidental concurrent registration.
    conn.execute(text("LOCK TABLE qualidade.nc IN EXCLUSIVE MODE"))
    for name in ("local", "atividade"):
        conn.execute(text(f"""
            CREATE TABLE qualidade.{name} (
              id uuid PRIMARY KEY,
              empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id),
              unidade_codigo text REFERENCES qualidade.unidade(codigo),
              codigo text NOT NULL, nome text NOT NULL, codigo_legado text,
              ativo boolean NOT NULL DEFAULT true,
              criado_em timestamptz NOT NULL DEFAULT now(), criado_por text,
              atualizado_em timestamptz NOT NULL DEFAULT now(), atualizado_por text,
              UNIQUE (empresa_id, codigo)
            )
        """))
    conn.connection.cursor().execute("""
        ALTER TABLE qualidade.nc
          ADD COLUMN numero_ano integer,
          ADD COLUMN numero_ordem integer,
          ADD COLUMN local_id uuid REFERENCES qualidade.local(id),
          ADD COLUMN atividade_id uuid REFERENCES qualidade.atividade(id),
          ADD COLUMN emitente_nome text,
          ADD COLUMN data_emissao date,
          ADD COLUMN identificacao_texto text,
          ADD COLUMN numero_anterior_texto text,
          ADD COLUMN envolvidos_funcoes text,
          ADD COLUMN causas_provaveis text,
          ADD COLUMN equipe_texto text,
          ADD COLUMN sistematica_adequada boolean,
          ADD COLUMN sistematica_seguida boolean,
          ADD COLUMN poka_yoke_possivel boolean,
          ADD COLUMN alterar_documentos boolean,
          ADD COLUMN documentos_alterar_texto text,
          ADD COLUMN verificar_eficacia_a_partir date;
        ALTER TABLE qualidade.nc_contencao
          ADD COLUMN responsavel_texto text,
          ADD COLUMN prazo date;
        CREATE UNIQUE INDEX nc_numero_ordem_uk
          ON qualidade.nc(empresa_id, numero_ano, numero_ordem)
          WHERE numero_ordem IS NOT NULL;
        CREATE TABLE qualidade.nc_eficacia_acompanhamento (
          id uuid PRIMARY KEY,
          nc_id uuid NOT NULL REFERENCES qualidade.nc(id),
          empresa_id uuid NOT NULL REFERENCES qualidade.empresa(id),
          unidade_codigo text NOT NULL REFERENCES qualidade.unidade(codigo),
          data date NOT NULL, evidencia text NOT NULL,
          verificador_id text NOT NULL,
          criado_em timestamptz NOT NULL DEFAULT now(), criado_por text
        );
        CREATE INDEX nc_eficacia_acompanhamento_nc_data_idx
          ON qualidade.nc_eficacia_acompanhamento(nc_id, data, criado_em);
        ALTER TABLE qualidade.nc_vinculo DROP CONSTRAINT nc_vinculo_tipo_check;
        ALTER TABLE qualidade.nc_vinculo ADD CONSTRAINT nc_vinculo_tipo_check
          CHECK (tipo IN ('REINCIDENCIA', 'SEMELHANTE', 'INEFICACIA'));
    """)

    migrated = conn.execute(text("""
        SELECT id, empresa_id, unidade_codigo, numero, numero_legado,
               criado_por, titulo
          FROM qualidade.nc
         WHERE legado IS TRUE AND numero IS NOT NULL
         ORDER BY numero
         FOR UPDATE
    """)).mappings().all()
    expected = [f"NC-2026-{i:04d}" for i in range(1, 4)]
    if [item["numero"] for item in migrated] != expected:
        raise RuntimeError("As três RNCs migradas não correspondem a NC-2026-0001..0003; nenhuma renumeração aplicada")
    existing = set(conn.execute(text("SELECT numero FROM qualidade.nc WHERE numero IS NOT NULL")).scalars())
    for ordinal, item in enumerate(migrated, 1):
        for _ in range(64):
            candidate = f"RNC-2026-{100000 + secrets.randbelow(900000):06d}"
            if candidate not in existing:
                break
        else:
            raise RuntimeError("Não foi possível sortear número para as RNCs migradas")
        existing.add(candidate)
        conn.execute(text("""
            UPDATE qualidade.nc
               SET numero = :new_number, numero_ano = 2026, numero_ordem = :ordinal,
                   numero_anterior_texto = :old_number,
                   atualizado_em = now(), atualizado_por = 'migration:FL-SGQ-07'
             WHERE id = :id
        """), {"new_number": candidate, "ordinal": ordinal,
               "old_number": item["numero"], "id": item["id"]})
        conn.execute(text("""
            INSERT INTO qualidade.nc_evento
              (id, nc_id, empresa_id, unidade_codigo, tipo, descricao,
               payload, autor_id, autor_texto, criado_por)
            VALUES (:event_id, :nc_id, :company, :unit, 'NUMERO_RENOMEADO',
                    :description, CAST(:payload AS jsonb),
                    'migration:FL-SGQ-07', 'Migração FL-SGQ-07',
                    'migration:FL-SGQ-07')
        """), {"event_id": uuid4(), "nc_id": item["id"],
               "company": item["empresa_id"], "unit": item["unidade_codigo"],
               "description": f"Número anterior {item['numero']}; novo número {candidate}.",
               "payload": json.dumps({"numero_anterior": item["numero"],
                                      "numero_novo": candidate,
                                      "numero_ged": item["numero_legado"]})})
    conn.execute(text("""
        UPDATE qualidade.nc_numero_contador
           SET ultimo_numero = GREATEST(ultimo_numero, 3)
         WHERE ano = 2026 AND empresa_id = :company
    """), {"company": migrated[0]["empresa_id"]})


def downgrade() -> None:
    raise RuntimeError("Renumeração e histórico imutável exigem retorno pelo backup do banco")
