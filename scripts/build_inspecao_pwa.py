"""Keep the dedicated inspection PWA form in sync with the Mapa form."""
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'mapa-concretagem/index.html').read_text(encoding='utf-8')
start = source.index('<div id="insDefApp"')
end = source.index('      <div id="insDefProducao"', start)
form = source[start:end].rstrip()
form = form.replace('          <button type="button" data-ins-tab="producao">Produção</button>\n', '')
form = form.replace('<div id="insDefApp" class="ins-def-app">',
                    '<div id="insDefApp" class="ins-def-app">\n'
                    '        <div id="insDefProducao" hidden></div>', 1)
page = '''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0F2C4C">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Inspeção S3/4">
  <title>Inspeção S3/4 · Concrefer</title>
  <link rel="manifest" href="./manifest.webmanifest">
  <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
  <link rel="icon" href="./icons/icon-192.png">
  <link rel="stylesheet" href="/unificado/mapa/operacao/inspecao-defeitos.css?v=20261021d">
  <link rel="stylesheet" href="./app.css?v=20261021a">
</head>
<body>
  <header class="pwa-header">
    <div class="pwa-heading"><img src="./icons/icon-192.png" alt="" width="46" height="46"><div><span>Concrefer · Qualidade</span><h1>Inspeção S3/4</h1></div></div>
    <button id="pwa-logout" type="button" class="pwa-logout">Sair</button>
  </header>
  <main id="pwa-main" class="pwa-main">
    <div id="pwa-connection" class="pwa-connection" role="status" aria-live="polite">Conectando…</div>
    <div id="pwa-install" class="pwa-install" hidden><span>Instale a inspeção na tela inicial para abrir direto neste formulário.</span><button id="pwa-install-button" type="button" hidden>Instalar</button><span id="pwa-ios-help" hidden>No Safari, toque em Compartilhar → Adicionar à Tela de Início.</span><button id="pwa-install-dismiss" type="button" aria-label="Dispensar aviso">×</button></div>
''' + form + '''
  </main>
  <script src="./api.js?v=20261021a"></script>
  <script src="/unificado/mapa/operacao/inspecao-defeitos.js?v=20261021e"></script>
  <script src="./app.js?v=20261021a"></script>
</body>
</html>
'''
target = ROOT / 'unificado/m/inspecao/index.html'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(page, encoding='utf-8')
