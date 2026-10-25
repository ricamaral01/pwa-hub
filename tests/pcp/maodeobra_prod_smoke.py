"""Controlled production smoke. Run only inside the approved release window."""
from __future__ import annotations

import subprocess
import requests
from pathlib import Path

import maodeobra_stage2_homolog as desktop
import maodeobra_confirm_homolog as confirmation


BASE = "https://concrefer.concretrack.com.br"
DATABASE = "pcp_unificado_teste"
DATES = (desktop.DATE, *confirmation.DATES)


def query(sql: str) -> str:
    result = subprocess.run(
        ["ssh", "vps-staging", f"sudo -u postgres psql -X -v ON_ERROR_STOP=1 -A -t -d {DATABASE}"],
        input=sql, text=True, encoding="utf-8", capture_output=True, check=True,
    )
    return result.stdout.strip()


def fingerprint() -> str:
    return query("""
SELECT 'maodeobra|' || count(*) || '|' ||
  md5(coalesce(string_agg(row_to_json(m)::text, ',' ORDER BY id), '')) FROM maodeobra m;
SELECT 'maodeobra_dias|' || count(*) || '|' ||
  md5(coalesce(string_agg(row_to_json(d)::text, ',' ORDER BY id), '')) FROM maodeobra_dias d;
""")


def assert_dates_unused() -> None:
    dates = ",".join(f"'{date}'" for date in DATES)
    result = query(f"""SELECT
      (SELECT count(*) FROM maodeobra WHERE data IN ({dates})) +
      (SELECT count(*) FROM maodeobra_dias WHERE data IN ({dates}));""")
    if result != "0":
        raise RuntimeError(f"Smoke dates already contain {result} rows; no data changed")


def main() -> None:
    assert_dates_unused()
    before = fingerprint()
    desktop.BASE = BASE
    desktop.DATABASE = DATABASE
    desktop.CAPTURE = Path("docs/maodeobra-mobile/capturas-publicacao/desktop-smoke.png")
    confirmation.BASE = BASE
    confirmation.DATABASE = DATABASE
    confirmation.CAPTURES = Path("docs/maodeobra-mobile/capturas-publicacao")
    response = requests.get(
        BASE + "/unificado/pcp/api/maodeobra/dia?data=2099-10-17&grupo_setor=12",
        timeout=20, allow_redirects=False,
    )
    if response.status_code != 403:
        raise AssertionError(f"Anonymous PCP API: {response.status_code}, expected protected 403")
    try:
        desktop.main()
        confirmation.run()
        manifest = requests.get(BASE + "/unificado/m/maodeobra/manifest.webmanifest", timeout=20, allow_redirects=False)
        assert manifest.status_code == 200, f"Manifest: {manifest.status_code}"
        assert manifest.headers["Content-Type"].startswith("application/manifest+json")
        assert manifest.json()["scope"] == "/unificado/m/maodeobra/"
        installer = requests.get(BASE + "/unificado/m/maodeobra/", timeout=20, allow_redirects=False)
        assert installer.status_code == 200, f"Installer: {installer.status_code}"
        assert "Versão oficial · Concrefer" in installer.text
        worker = requests.get(BASE + "/unificado/m/maodeobra/sw.js", timeout=20)
        worker.raise_for_status()
        assert "maodeobra-shell-prod-20261017-v1" in worker.text
        assert "no-store" in worker.headers.get("Cache-Control", "")
    finally:
        desktop.cleanup()
        confirmation.cleanup()
    after = fingerprint()
    if after != before:
        raise AssertionError(f"Existing labour data changed:\nbefore={before}\nafter={after}")
    print("Production smoke passed; existing labour data unchanged:")
    print(after)


if __name__ == "__main__":
    main()
