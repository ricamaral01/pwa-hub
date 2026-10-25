"""Read-only catalog for the existing PCP Formas por Setor page."""

from collections import defaultdict
from decimal import Decimal
import re
import unicodedata


def _norm(value):
    text = unicodedata.normalize("NFKD", str(value or "").strip().casefold())
    return re.sub(r"[^a-z0-9]+", "", text.encode("ascii", "ignore").decode())


def _code(value):
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def _number(value):
    return float(value) if isinstance(value, Decimal) else value


def load_catalog(pcp_connection, mapa_connection):
    """Return each current PCP mapping row/group with its existing status sources."""
    with pcp_connection.cursor() as cursor:
        cursor.execute("""SELECT id, nome FROM public.setores WHERE id BETWEEN 1 AND 4""")
        sectors = {row["id"]: row["nome"] for row in cursor.fetchall()}
        cursor.execute("""SELECT setor_id, nome, codigo FROM public.produtos""")
        products = {}
        for row in cursor.fetchall():
            products.setdefault((row["setor_id"], _norm(row["nome"])), row["codigo"])
        cursor.execute("""SELECT setor_id, codigo_forma, tipo_forma, codigo_tipo_forma,
                                 codigo_modelo_mega, poste, volume_m3, ativo
                          FROM public.mapeamento_formas WHERE setor_id BETWEEN 1 AND 4""")
        standard = cursor.fetchall()
        cursor.execute("""SELECT setor_id, codigo_forma, poste_circular, volume_m3, ativo
                          FROM public.mapeamento_forma_postes WHERE setor_id BETWEEN 1 AND 4""")
        circular = cursor.fetchall()
        cursor.execute("""SELECT setor_id, codigo_forma, acessorio, ativo
                          FROM public.mapeamento_forma_acessorios WHERE setor_id BETWEEN 1 AND 4""")
        accessories = cursor.fetchall()

    with mapa_connection.cursor() as cursor:
        cursor.execute("""SELECT setor, forma_numero, status
                          FROM public.formas_manutencao""")
        maintenance = {(_norm(row["setor"]), _code(row["forma_numero"])): row["status"]
                       for row in cursor.fetchall()}

    result = []

    def add(*, sector_id, code, kind, produced, product_codes, volumes,
            pcp_active, source, compatible_active=None, compatible_total=None,
            form_type_code=None, mega_model_code=None):
        sector = sectors.get(sector_id, f"Setor {sector_id}")
        maintenance_status = maintenance.get((_norm(sector), _code(code)))
        inactive = not pcp_active or maintenance_status == "PARADA"
        reasons = [f"PCP/{source}: {'ativa' if pcp_active else 'inativa'}"]
        if maintenance_status:
            reasons.append(f"Mapa/manutenção: {maintenance_status.lower()}")
        result.append({
            "setor": sector,
            "setor_id": sector_id,
            "codigo_forma": code,
            "tipo_forma": kind,
            "codigo_tipo_forma": form_type_code,
            "codigo_modelo_mega": mega_model_code,
            "produtos": produced,
            "codigos_produto": sorted({str(value) for value in product_codes if value}),
            "volumes_m3": sorted({_number(value) for value in volumes if value is not None}),
            "ativo_pcp": bool(pcp_active),
            "status_manutencao": maintenance_status,
            "situacao": "Inativa" if inactive else "Ativa",
            "fonte_situacao": "; ".join(reasons),
            "fonte_cadastro": source,
            "compat_ativas": compatible_active,
            "compat_total": compatible_total,
        })

    for row in standard:
        add(sector_id=row["setor_id"], code=row["codigo_forma"],
            kind=row["tipo_forma"], produced=[row["poste"]],
            form_type_code=row["codigo_tipo_forma"],
            mega_model_code=row["codigo_modelo_mega"],
            product_codes=[products.get((row["setor_id"], _norm(row["poste"])))],
            volumes=[row["volume_m3"]], pcp_active=row["ativo"],
            source="mapeamento_formas")

    groups = defaultdict(list)
    for row in circular:
        groups[(row["setor_id"], row["codigo_forma"])].append(row)
    for (sector_id, code), rows in groups.items():
        produced = sorted({row["poste_circular"] for row in rows if row["poste_circular"]})
        add(sector_id=sector_id, code=code, kind=None, produced=produced,
            product_codes=[products.get((sector_id, _norm(name))) for name in produced],
            volumes=[row["volume_m3"] for row in rows],
            pcp_active=any(row["ativo"] for row in rows),
            source="mapeamento_forma_postes",
            compatible_active=sum(bool(row["ativo"]) for row in rows),
            compatible_total=len(rows))

    for row in accessories:
        add(sector_id=row["setor_id"], code=row["codigo_forma"],
            kind=None, produced=[row["acessorio"]],
            product_codes=[products.get((row["setor_id"], _norm(row["acessorio"])))],
            volumes=[], pcp_active=row["ativo"],
            source="mapeamento_forma_acessorios")

    return result
