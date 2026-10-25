"""Patch only the three authorized dashboards in a copied old-Mapping release."""
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = ROOT / ".codex-tmp"
target = ROOT / ".work-mapa-old-publish"
target.mkdir(exist_ok=True)
html = (source / "mapa-old-live-index.html").read_text(encoding="utf-8")
app = (source / "mapa-old-live-app.js").read_text(encoding="utf-8")


def one(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError(f"Expected one old-dashboard anchor: {old[:80]}")
    return text.replace(old, new, 1)


html = one(html, "</head>",
           '<link rel="stylesheet" href="montagem-taxa.css?v=20261007">'
           '<link rel="stylesheet" href="dashboard-reference-layout.css?v=20261007"></head>')
html = one(html, '<script src="app.js?v=20261001saque1"></script>',
           '<script src="app.js?v=20261007dashboards"></script>'
           '<script src="montagem-taxa.js?v=20261007"></script>'
           '<script src="dashboard-reference-layout.js?v=20261007"></script>')
html = one(html, '<div id="miSecaoProdutividade" class="mi-tab-section"><div class="mi-charts-row">',
           '<div id="miSecaoProdutividade" class="mi-tab-section">'
           '<div class="mi-chart-card mi-taxa-card"><div class="mi-chart-title">Indicadores diários da montagem</div>'
           '<p>Montadores: logins diários de contas MONTADOR.</p>'
           '<div class="mi-taxa-table-wrap"><table class="sheet-table" aria-label="Postes inspecionados e montadores por dia">'
           '<tbody id="miTaxaMontagemBody"><tr><td>Carregando indicadores...</td></tr></tbody></table></div></div>'
           '<div class="mi-charts-row">')
html = one(html, '<h2>Produtividade</h2>', '<h2>Concretagem</h2>')
html = one(html, '<span class="hub-icon-lbl">Produtividade</span>',
           '<span class="hub-icon-lbl">Concretagem</span>')
html = one(html, '<button type="button" data-hub-mode="PROD_ANALISE">Produtividade</button>',
           '<button type="button" data-hub-mode="PROD_ANALISE">Concretagem</button>')
app = one(app,
          '  const miFilteredDefeitosData = miFilteredMontagemData.filter(isLinhaDefeitoDashboard);',
          '  window.renderTaxaMontagem?.(miFilteredMontagemData);\n'
          '  const miFilteredDefeitosData = miFilteredMontagemData.filter(isLinhaDefeitoDashboard);')
app = one(app, 'PROD_ANALISE: ["navProdAnalise", "Produtividade"]',
          'PROD_ANALISE: ["navProdAnalise", "Concretagem"]')
(target / "index.html").write_text(html, encoding="utf-8", newline="\n")
(target / "app.js").write_text(app, encoding="utf-8", newline="\n")
for name in ("dashboard-reference-layout.css", "dashboard-reference-layout.js", "montagem-taxa.js", "montagem-taxa.css"):
    (target / name).write_bytes((ROOT / "mapa-concretagem" / name).read_bytes())
print(target)
