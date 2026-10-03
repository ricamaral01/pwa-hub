"""Prepara uma cópia local do Mapa atual para migração com paridade funcional.

A saída fica fora de unificado/ para impedir publicação acidental. Não substitui
o Mapa em produção e não habilita apontamentos no PostgreSQL de testes.
"""

from __future__ import annotations

from pathlib import Path
import re
import shutil


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mapa-concretagem"
TARGET = ROOT / ".work-mapa-unificado" / "tablet"


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise ValueError(f"Trecho de origem mudou: {old[:80]!r}")
    return text.replace(old, new, 1)


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    for name in (
        "styles.css", "dashboard-defeitos-v4.css", "chart.min.js",
        "chartjs-plugin-datalabels.min.js", "xlsx.full.min.js",
        "modelos-formas.js", "supabase.js", "manifest.json",
    ):
        shutil.copy2(SOURCE / name, TARGET / name)
    assets = TARGET / "assets"
    assets.mkdir(exist_ok=True)
    for name in ("msgbox.css", "msgbox.js"):
        shutil.copy2(ROOT / "assets" / name, assets / name)
    (assets / "img").mkdir(exist_ok=True)
    shutil.copy2(ROOT / "assets" / "img" / "icon.png", assets / "img" / "icon.png")
    shutil.copy2(ROOT / "unificado" / "mapa" / "consulta-guard.js", TARGET / "consulta-guard.js")

    html = (SOURCE / "index.html").read_text(encoding="utf-8")
    html = replace_once(html, '  <script defer src="supabase.js"></script>\n', "")
    html = replace_once(html, '  <script defer src="/auth/config.js?v=2"></script><script defer src="/auth/client.js"></script><script defer src="/auth/guard.js?v=2"></script>\n', "")
    html = html.replace('../assets/msgbox.', 'assets/msgbox.')
    html = replace_once(html, '</head>', '''  <style>
    #consulta-banner{position:sticky;top:0;z-index:100000;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 16px;background:#fff4dc;color:#513800;font:700 14px/1.4 system-ui,sans-serif;box-shadow:0 2px 7px #0002}
    #consulta-banner.is-alert{background:#ffe8e5;color:#8d2218}
    #consulta-banner a{color:inherit;text-decoration:underline;white-space:nowrap}
  </style>
  <script src="consulta-guard.js"></script>
</head>''')
    html = replace_once(html, '<body data-app-key="mapa-concretagem">',
        '<body data-app-key="mapa-concretagem"><div id="consulta-banner" role="status"><span>Prévia para consulta no tablet. Dados migrados até 02/10/2026; apontamentos desativados.</span><a href="../../index.html">Início unificado</a></div>')
    html = replace_once(html, '<script src="app.js?v=v5.31"></script>', '<script src="app.js?v=v5.31-unificado"></script>')
    (TARGET / "index.html").write_text(html, encoding="utf-8", newline="\n")

    manifest = (TARGET / "manifest.json").read_text(encoding="utf-8")
    manifest = manifest.replace('../assets/img/icon.png', 'assets/img/icon.png')
    (TARGET / "manifest.json").write_text(manifest, encoding="utf-8", newline="\n")

    app = (SOURCE / "app.js").read_text(encoding="utf-8")
    config = re.compile(r'const SUPABASE_CONFIG = \{\s*URL: "[^"]+",\s*KEY: "[^"]+"\s*\};')
    if len(config.findall(app)) != 1:
        raise ValueError("Configuração Supabase de origem mudou")
    app = config.sub('const SUPABASE_CONFIG = {\n  URL: new URL("../../unificado/mapa/api", location.origin).href,\n  KEY: "unificado-test-only"\n};', app)
    # O destino de trabalho é servido em /unificado/mapa/operacional/ no teste.
    app = app.replace('new URL("../../unificado/mapa/api", location.origin).href', 'new URL("../api", location.href).href')
    app = replace_once(app, 'const PCP_PROGRAMACAO_URL = "https://pcp.concretrack.com.br/api/programacao";',
                       'const PCP_PROGRAMACAO_URL = new URL("../api/pcp/programacao", location.href).href;')
    app = replace_once(app, 'const ACMP_MASSADAS_URL = "https://dautomacao.com/api/usina/massadas";',
                       'const ACMP_MASSADAS_URL = new URL("../api/usina/massadas", location.href).href;')
    qr_source = re.compile(r'const ACMP_LEITURAS_QR_CSV_URL = "https://docs\.google\.com/spreadsheets/[^"]+";')
    if len(qr_source.findall(app)) != 1:
        raise ValueError("Fonte QR CSV de origem mudou")
    app = qr_source.sub('const ACMP_LEITURAS_QR_CSV_URL = new URL("../api/usina/leituras-qr.csv", location.href).href;', app)
    app = replace_once(app, 'const SAQUE_MANDRIL_API = "https://pcp.concretrack.com.br/api/saques-mandril";',
                       'const SAQUE_MANDRIL_API = new URL("../api/pcp/saques-mandril", location.href).href;')
    app = replace_once(app, 'const host = "https://pcp.concretrack.com.br";',
                       'const host = new URL("../api/pcp", location.href).href;')
    app = replace_once(app, 'const fallbackHost = "https://usina.concretrack.com.br";',
                       'const fallbackHost = new URL("../api/pcp", location.href).href;')
    start = app.index('function getBackendUrl() {')
    end = app.index('\n}\n', start) + 2
    app = app[:start] + 'function getBackendUrl() {\n  return new URL("../api", location.href).href;\n}' + app[end:]
    app = replace_once(app, 'function init() {', 'async function init() {')
    app = replace_once(app, '  const now = todayYmd();\n  if (el.libData) el.libData.value = now;',
                       '  const now = "2026-10-02"; // Última data da fotografia de testes.\n  if (el.libData) el.libData.value = now;')
    app = replace_once(app, '  const session = readAuthSession();\n  if (session) {', '  const session = await fetchUnifiedAuthSession();\n  if (session) {')
    app = replace_once(app, '    ensurePostLoginBootstrap();\n    setMode("HUB");\n  } else {\n    lockAppForLogin();\n    applyRoleVisibility();\n    if (el.loginNome) el.loginNome.focus();\n  }\n}',
        '    ensurePostLoginBootstrap();\n    const requestedMode = new URLSearchParams(location.search).get("tela");\n    setMode(requestedMode && isModeAllowed(requestedMode) ? requestedMode : "HUB");\n    document.documentElement.classList.remove("auth-checking");\n  } else {\n    location.replace(new URL("../../login.html?next=mapa/consulta/", location.href));\n  }\n}')
    marker = 'async function init() {'
    bootstrap = '''async function fetchUnifiedAuthSession() {
  try {
    const response = await fetch(new URL("../api/me", location.href), {
      credentials: "same-origin", cache: "no-store"
    });
    if (!response.ok) return null;
    const data = await response.json();
    const user = data.user;
    if (!user || !ROLE_PERMISSIONS[user.role]) return null;
    return {
      id: user.id, name: user.name, role: user.role,
      roleLabel: getRoleConfig(user.role).label,
      setor: user.setor || "Todos"
    };
  } catch {
    return null;
  }
}

'''
    app = replace_once(app, marker, bootstrap + marker)
    # Service worker da origem aponta para o domínio antigo e não pertence à cópia.
    app = replace_once(app, '  if ("serviceWorker" in navigator) {', '  if (false && "serviceWorker" in navigator) {')
    logout_start = app.index('function logoutUser() {')
    logout_end = app.index('\n}\n', logout_start) + 2
    app = app[:logout_start] + '''async function logoutUser() {
  await fetch(new URL("../api/logout", location.href), {
    method: "POST", credentials: "same-origin"
  });
  clearAuthSession();
  location.assign(new URL("../../login.html", location.href));
}''' + app[logout_end:]
    (TARGET / "app.js").write_text(app, encoding="utf-8", newline="\n")

    assert "fbvvdyirhtgvycullsqy.supabase.co" not in app
    assert "dautomacao.com/api" not in app
    assert "pcp.concretrack.com.br" not in app
    assert "https://usina.concretrack.com.br" not in app
    assert "https://docs.google.com/spreadsheets/" not in app
    print(f"Cópia de trabalho preparada em {TARGET}; não publicada.")


if __name__ == "__main__":
    main()
