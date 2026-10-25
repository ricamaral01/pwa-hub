"""Compare legacy and mirror reports using only SHA-256 digests and row counts.

Run --origin from the ERP working directory, and --mirror on the new VPS.
"""

import argparse
import hashlib
import json
import urllib.request


CASES = {
    "custos": "relatorios/custos?meses=12",
    "cartas": "relatorios/cartas-traco?data_ini=2026-10-01&data_fim=2026-10-24",
    "consumo": "relatorios/consumo?data_ini=2026-10-23&data_fim=2026-10-23",
    "fechamento": "relatorios/fechamento?ano=2026&mes=10",
    "diario": "relatorios/fechamento-diario?data=2026-10-23",
    "producao": "relatorios/producao-periodo?data_ini=2026-10-23&data_fim=2026-10-23",
    "massadas": "relatorios/massadas?data_ini=2026-10-23&data_fim=2026-10-23",
}


def normalize(value):
    if isinstance(value, dict):
        return {key: normalize(item) for key, item in value.items()
                if key not in {"atualizado_em", "erro", "fallback_publico", "auth_error"}}
    if isinstance(value, list):
        return [normalize(item) for item in value]
    return value


def origin_payload(name):
    from api.routers import custos, massadas, relatorios
    if name == "custos":
        return custos.relatorio_custos(12)
    if name == "cartas":
        return relatorios.cartas_traco("2026-10-01", "2026-10-24", None, True)
    if name == "consumo":
        return relatorios.consumo_materiais("2026-10-23", "2026-10-23", None, None)
    if name == "fechamento":
        return relatorios.fechamento(2026, 10)
    if name == "diario":
        return relatorios.fechamento_diario("2026-10-23")
    if name == "massadas":
        return massadas.listar_massadas("2026-10-23", "2026-10-23")
    return relatorios.producao_periodo("2026-10-23", "2026-10-23", None)


def mirror_payload(name):
    with urllib.request.urlopen("http://127.0.0.1:3087/api/" + CASES[name], timeout=45) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", action="store_true")
    parser.add_argument("--mirror", action="store_true")
    args = parser.parse_args()
    if args.origin == args.mirror:
        parser.error("Choose exactly one side")
    for name in CASES:
        payload = normalize(origin_payload(name) if args.origin else mirror_payload(name))
        data = json.dumps(payload, sort_keys=True, separators=(",", ":"),
                          ensure_ascii=False, default=str).encode("utf-8")
        print(name, len(data), hashlib.sha256(data).hexdigest())
        if name == "diario":
            for key, value in sorted(payload.items()):
                part = json.dumps(value, sort_keys=True, separators=(",", ":"),
                                  ensure_ascii=False, default=str).encode("utf-8")
                print("  ", key, len(part), hashlib.sha256(part).hexdigest()[:12])
            for key, value in sorted(payload["fontes"].items()):
                part = json.dumps(value, sort_keys=True, separators=(",", ":"),
                                  ensure_ascii=False, default=str).encode("utf-8")
                print("    fonte", key, len(part), hashlib.sha256(part).hexdigest()[:12],
                      value.get("status") if isinstance(value, dict) else "")
                if key == "armacoes":
                    print("      ", {k: v for k, v in value.items()
                                    if k in {"fonte", "status", "auth", "linha_datas", "coluna_inicial"}})


if __name__ == "__main__":
    main()
