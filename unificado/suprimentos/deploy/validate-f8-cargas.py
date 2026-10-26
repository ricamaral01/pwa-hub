"""Valida os CSVs de carga de Campinas antes de qualquer importação.

Os arquivos distribuídos são modelos vazios; preencher cópias, validar e só
então carregar pelas APIs/cadastros. Este script nunca acessa banco ou rede.
"""
from __future__ import annotations

import csv
import re
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / "docs/porting/suprimentos/pacote-producao/cargas"
HEADERS = {
    "centros-custo-campinas.csv": "unidade_codigo codigo nome setor",
    "materiais-campinas.csv": "unidade_codigo codigo descricao categoria un_estoque_sigla controla_estoque dominio exige_ca patrimoniado ponto_pedido estoque_minimo lote_economico lead_time_dias seguranca_dias",
    "fornecedores-campinas.csv": "unidade_codigo cnpj razao categorias email_pedido condicao_pagamento prazo_padrao_dias",
    "colaboradores-campinas.csv": "unidade_codigo matricula nome setor",
    "papeis-campinas.csv": "unidade_codigo iam_user_id papel cc_codigo nivel",
    "alcadas-campinas.csv": "unidade_codigo cc_codigo categoria valor_ate nivel papel_aprovador a_confirmar",
    "parametros-campinas.csv": "unidade_codigo chave valor a_confirmar",
}
CATEGORIES = {"EPI", "ABRASIVO", "FERRAMENTA", "CONSUMIVEL_PRODUCAO", "MANUTENCAO",
              "LIMPEZA_ESCRITORIO", "INSUMO_USINA", "OUTROS"}
ROLES = {"SOLICITANTE", "APROVADOR", "ALMOXARIFE", "COMPRADOR", "QUALIDADE", "ADMIN"}


def required(row, *keys):
    for key in keys:
        if not row[key].strip():
            raise ValueError(f"{key} obrigatório")


def decimal(row, key, positive=False):
    value = Decimal(row[key].replace(",", "."))
    if value < 0 or positive and value <= 0:
        raise ValueError(f"{key} deve ser {'positivo' if positive else 'não negativo'}")
    return value


def integer(row, key, positive=False):
    value = int(row[key])
    if value < 0 or positive and value <= 0:
        raise ValueError(f"{key} inválido")


def boolean(row, key):
    if row[key].lower() not in {"true", "false"}:
        raise ValueError(f"{key} deve ser true/false")


def cnpj_valid(value):
    if not re.fullmatch(r"[0-9]{14}", value) or len(set(value)) == 1:
        return False
    digits = [int(x) for x in value]
    for count, weights in ((12, (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)),
                           (13, (6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2))):
        remainder = sum(a*b for a, b in zip(digits[:count], weights)) % 11
        if digits[count] != (0 if remainder < 2 else 11 - remainder):
            return False
    return True


def validate(name, row):
    if row["unidade_codigo"].strip().lower() != "campinas":
        raise ValueError("unidade_codigo deve ser campinas")
    for key, value in row.items():
        if value is None:
            raise ValueError("colunas a mais")
        if value.strip().startswith(("=", "+", "-", "@")):
            raise ValueError(f"{key}: início de fórmula proibido")
    if name.startswith("centros-custo"):
        required(row, "codigo", "nome")
    elif name.startswith("materiais"):
        required(row, "codigo", "descricao", "categoria", "un_estoque_sigla", "dominio")
        if row["categoria"] not in CATEGORIES or row["dominio"] not in {"almoxarifado", "insumo_usina"}:
            raise ValueError("categoria/domínio inválido")
        if (row["categoria"] == "INSUMO_USINA") != (row["dominio"] == "insumo_usina"):
            raise ValueError("categoria e domínio incompatíveis")
        for key in ("controla_estoque", "exige_ca", "patrimoniado"):
            boolean(row, key)
        for key in ("ponto_pedido", "estoque_minimo", "lote_economico"):
            decimal(row, key)
        for key in ("lead_time_dias", "seguranca_dias"):
            integer(row, key)
    elif name.startswith("fornecedores"):
        required(row, "cnpj", "razao")
        if not cnpj_valid(row["cnpj"]):
            raise ValueError("CNPJ inválido")
        if row["categorias"] and any(x not in CATEGORIES for x in row["categorias"].split("|")):
            raise ValueError("categorias inválidas")
        if row["prazo_padrao_dias"]:
            integer(row, "prazo_padrao_dias")
    elif name.startswith("colaboradores"):
        required(row, "matricula", "nome")
    elif name.startswith("papeis"):
        required(row, "iam_user_id", "papel")
        if row["papel"] not in ROLES:
            raise ValueError("papel inválido")
        if row["papel"] == "APROVADOR":
            integer(row, "nivel", positive=True)
        elif row["nivel"]:
            raise ValueError("nível só para APROVADOR")
    elif name.startswith("alcadas"):
        required(row, "nivel", "papel_aprovador", "a_confirmar")
        if row["categoria"] and row["categoria"] not in CATEGORIES:
            raise ValueError("categoria inválida")
        if row["valor_ate"]:
            decimal(row, "valor_ate", positive=True)
        integer(row, "nivel", positive=True)
        if row["papel_aprovador"] != "APROVADOR":
            raise ValueError("papel_aprovador deve ser APROVADOR")
        boolean(row, "a_confirmar")
    elif name.startswith("parametros"):
        required(row, "chave", "valor", "a_confirmar")
        decimal(row, "valor")
        boolean(row, "a_confirmar")


def main(base):
    counts = {}
    for name, header in HEADERS.items():
        path = base / name
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle, delimiter=";")
            if reader.fieldnames != header.split():
                raise ValueError(f"{name}: cabeçalho diferente do contrato")
            rows = list(reader)
        for number, row in enumerate(rows, 2):
            try:
                validate(name, row)
            except (ValueError, KeyError, InvalidOperation) as exc:
                raise ValueError(f"{name}:{number}: {exc}") from None
        counts[name] = len(rows)
    print("F8_CSV_TEMPLATE_OK", counts, "pronto_para_carga", any(counts.values()))


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else BASE)
