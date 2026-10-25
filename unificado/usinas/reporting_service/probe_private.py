"""Smoke-check private GET reports without printing financial or row data."""

import json
import urllib.error
import urllib.request


PATHS = (
    "relatorios/custos?meses=12",
    "relatorios/cartas-traco?data_ini=2026-10-01&data_fim=2026-10-24",
    "relatorios/consumo?data_ini=2026-10-23&data_fim=2026-10-23",
    "relatorios/fechamento?ano=2026&mes=10",
    "relatorios/fechamento-diario?data=2026-10-23",
    "relatorios/producao-periodo?data_ini=2026-10-23&data_fim=2026-10-23",
    "relatorios/massadas?data_ini=2026-10-23&data_fim=2026-10-23",
)


def main():
    failed = False
    for path in PATHS:
        try:
            with urllib.request.urlopen("http://127.0.0.1:3087/api/" + path, timeout=45) as response:
                payload = json.load(response)
                print(path.split("?")[0], response.status,
                      sorted(payload) if isinstance(payload, dict) else type(payload).__name__)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError) as exc:
            print(path.split("?")[0], "FAILED", type(exc).__name__, getattr(exc, "code", ""))
            failed = True
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
