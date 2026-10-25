# Classificação das pendências da árvore principal — 25/10/2026

Base: `alteracoes-nao-commitadas-raiz-20261025.txt` e expansão do estado Git para cada arquivo (5.899 entradas), antes do ajuste de `.gitignore`. Backup externo verificado: `C:\Users\Admin\Documents\pwa-hub-fase1-active-worktree-20261025T134247Z.tar.gz` (16.824 arquivos e histórico Git).

Hash: SHA-256 do conteúdo com CRLF normalizado para LF; binários sem transformação. Escopo ativo da VPS: `/opt/concrefer-unificado` (sem backups, caches e ambientes virtuais) e as unidades em `/etc/systemd/system`. A migração SQL foi conferida com a estrutura PostgreSQL.

Totais: **A 156**, **B 1283**, **C 4460**. A = igual ao publicado; B = divergente ou sem equivalente ativo; C = gerado/cópia temporária. C continua preservado no backup e na árvore principal.

| Frente | A | B | C |
|---|---:|---:|---:|
| deploy | 0 | 83 | 0 |
| documentacao | 0 | 108 | 106 |
| dosagem-v2 | 31 | 224 | 227 |
| ged | 0 | 232 | 1353 |
| geral | 15 | 143 | 1853 |
| laboratorio | 42 | 89 | 59 |
| mapa | 19 | 40 | 135 |
| pcp | 22 | 152 | 290 |
| qualidade | 0 | 91 | 84 |
| shell | 8 | 29 | 58 |
| usinas | 19 | 92 | 295 |

| Caminho | Frente | Classe | Evidência |
|---|---|:---:|---|
| `.gitignore` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 1082d9fed56f) |
| `deploy/README.md` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 5c0ff2301bdd) |
| `deploy/scripts/deploy.ps1` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 39b01993a5b4) |
| `deploy/scripts/deploy.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 3ba44620ba58) |
| `deploy/scripts/provisionar.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 91b5b512421d) |
| `deploy/scripts/remote-release.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 87455305f013) |
| `docs/correcoes-intencionais.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b18095a7045c) |
| `docs/dosagem-v2/API.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 1af36b5df9a2) |
| `docs/dosagem-v2/RELATORIO-EXECUCAO.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 41b63bcd4a0b) |
| `docs/dosagem-v2/VPS-RECONHECIMENTO.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local eb78b4852fac) |
| `dosagem-concreto-v2/.env.example` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5afb5ce716e1) |
| `dosagem-concreto-v2/.env.production` | dosagem-v2 | B | arquivo de ambiente rastreado anteriormente; excluído do índice por segurança |
| `dosagem-concreto-v2/README.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 761bff0ecaed) |
| `dosagem-concreto-v2/api/README.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local eabf9061389f) |
| `dosagem-concreto-v2/api/app/acoes/documentos.py` | dosagem-v2 | A | igual a dosagem-native/api/app/acoes/documentos.py (SHA256 normalizado 708a4e0cbdac) |
| `dosagem-concreto-v2/api/app/auth.py` | dosagem-v2 | A | igual a dosagem-native/api/app/auth.py (SHA256 normalizado d9e18411594c) |
| `dosagem-concreto-v2/api/app/config.py` | dosagem-v2 | A | igual a dosagem-native/api/app/config.py (SHA256 normalizado e8b6ca657e71) |
| `dosagem-concreto-v2/api/app/db.py` | dosagem-v2 | A | igual a dosagem-native/api/app/db.py (SHA256 normalizado c38f17a34cce) |
| `dosagem-concreto-v2/api/app/main.py` | dosagem-v2 | A | igual a dosagem-native/api/app/main.py (SHA256 normalizado 2e062ba001a8) |
| `dosagem-concreto-v2/api/app/modelos.py` | dosagem-v2 | A | igual a dosagem-native/api/app/modelos.py (SHA256 normalizado a6db8f6c12a4) |
| `dosagem-concreto-v2/api/app/rpc.py` | dosagem-v2 | A | igual a dosagem-native/api/app/rpc.py (SHA256 normalizado 721bada75422) |
| `dosagem-concreto-v2/api/app/validacao.py` | dosagem-v2 | A | igual a dosagem-native/api/app/validacao.py (SHA256 normalizado c3b4f14d7aeb) |
| `dosagem-concreto-v2/api/migrations/env.py` | dosagem-v2 | A | igual a dosagem-native/api/migrations/env.py (SHA256 normalizado 338ba890f5e9) |
| `dosagem-concreto-v2/api/migrations/versions/20261017_01_inicial.py` | dosagem-v2 | A | igual a dosagem-native/api/migrations/versions/20261017_01_inicial.py (SHA256 normalizado 214558d8e2eb) |
| `dosagem-concreto-v2/api/pyproject.toml` | dosagem-v2 | A | igual a dosagem-native/api/pyproject.toml (SHA256 normalizado ddabed96a580) |
| `dosagem-concreto-v2/api/tests/conftest.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 61d0bc88f259) |
| `dosagem-concreto-v2/api/tests/test_rpc.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d374bd6ed310) |
| `dosagem-concreto-v2/index.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 32549cf2e58d) |
| `dosagem-concreto-v2/package.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a08149fcbd4c) |
| `dosagem-concreto-v2/playwright.config.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 023d25a33825) |
| `dosagem-concreto-v2/src/app/App.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 4d55c4ef60c9) |
| `dosagem-concreto-v2/src/app/Editor.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 4d02025bdde0) |
| `dosagem-concreto-v2/src/app/editor.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 51b831709684) |
| `dosagem-concreto-v2/src/app/layout.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local b186afa114d8) |
| `dosagem-concreto-v2/src/app/layout.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8540a1974849) |
| `dosagem-concreto-v2/src/core/model.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local dc25302631cb) |
| `dosagem-concreto-v2/src/data/api.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f4d34a5f3d14) |
| `dosagem-concreto-v2/src/data/authAdapter.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 0eb5db0e1a87) |
| `dosagem-concreto-v2/src/data/db.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 9d6b26c18448) |
| `dosagem-concreto-v2/src/data/sync.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e3093ab76e85) |
| `dosagem-concreto-v2/src/features/catalogos.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 7bc614e86d2e) |
| `dosagem-concreto-v2/src/features/ensaios.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 08e39f23b707) |
| `dosagem-concreto-v2/src/features/ferramentas.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5bf5b41a9bc1) |
| `dosagem-concreto-v2/src/main.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local dddc9dad3cc8) |
| `dosagem-concreto-v2/src/print/CartaTraco.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 1c918d740ef5) |
| `dosagem-concreto-v2/src/print/carta.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f659285c6d6d) |
| `dosagem-concreto-v2/src/sw.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 326dea41a73a) |
| `dosagem-concreto-v2/src/ui/components.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f245d1677c81) |
| `dosagem-concreto-v2/src/ui/icons.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local eb0a055dc74d) |
| `dosagem-concreto-v2/src/ui/tokens.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 0e64dbb82d61) |
| `dosagem-concreto-v2/src/vite-env.d.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6bacd7ddc3ae) |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/editor-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/editor-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/editor-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/editor-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/app.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 000b13fa06ac) |
| `dosagem-concreto-v2/tests/golden/c40.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 735d136440d1) |
| `dosagem-concreto-v2/vite.config.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6ba496369cc2) |
| `mapa-concretagem/app.js` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local ad7c56e4b73c) |
| `mapa-concretagem/index.html` | mapa | B | difere de public/unificado/mapa/index.html (local 79045942ee6b, VPS c1d50b0c8997) |
| `mapa-concretagem/sw.js` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 75de48ffdc71) |
| `package.json` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 4ce93f044a76) |
| `pcp_producao_agent/__pycache__/comparator.cpython-314.pyc` | pcp | C | cache/build/captura gerada |
| `pcp_producao_agent/__pycache__/concretrack_client.cpython-314.pyc` | pcp | C | cache/build/captura gerada |
| `pcp_producao_agent/__pycache__/config.cpython-314.pyc` | pcp | C | cache/build/captura gerada |
| `pcp_producao_agent/__pycache__/google_sheets_client.cpython-314.pyc` | pcp | C | cache/build/captura gerada |
| `pcp_producao_agent/__pycache__/html_report.cpython-314.pyc` | pcp | C | cache/build/captura gerada |
| `pcp_producao_agent/__pycache__/whatsapp_sender.cpython-314.pyc` | pcp | C | cache/build/captura gerada |
| `pcp_producao_agent/agent_execution.log` | pcp | C | artefato gerado |
| `relatorios/pcp-producao/relatorio_pcp_producao_2026-07-07.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e1907a5549a5) |
| `scripts/build_unificado_mapa_operacao.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 4eee4dd3d26b) |
| `scripts/build_unificado_pcp_frontend.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 9861810d503a) |
| `tests/auth/test_mapa_one_screen_browser.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 513d30c998d1) |
| `tests/auth/test_pcp_only_browser.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 656b4a765367) |
| `tests/mapa/contract_photos.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local feb636f03c85) |
| `tests/pcp/pages_smoke.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e11b62055a67) |
| `tests/porting/cronoanalise_production_cache_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2b3304fb5bd3) |
| `tests/test_dashboard_kg_homem.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 60dbdc35a4da) |
| `tests/unificado/blocker_matrix_published.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local f609d963d320) |
| `tests/unificado/blocker_pcp_published.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1252f724c218) |
| `tests/unificado/home_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 0016a6d6b853) |
| `unificado/VERSION` | shell | B | difere de public/unificado/VERSION (local ba720eec767d, VPS 2b4d4ed3c00a) |
| `unificado/index.html` | shell | B | difere de public/unificado/index.html (local 9f380572935a, VPS ab8902d6a32d) |
| `unificado/laboratorio/frontend/src/novo/Shell.tsx` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local b00208497a43) |
| `unificado/laboratorio/service/server/static/novo/postes/assets/novo-C5mW1pBl.js` | laboratorio | B | arquivo removido localmente; produção requer conferência |
| `unificado/laboratorio/service/server/static/novo/postes/novo.html` | laboratorio | A | igual a laboratorio/service/server/static/novo/postes/novo.html (SHA256 normalizado dca30619e37f) |
| `unificado/login.html` | shell | A | igual a public/unificado/login.html (SHA256 normalizado f56e30a06b87) |
| `unificado/mapa/api/app.py` | mapa | B | difere de mapa-api/app.py (local a61bc0568696, VPS e2f27bb67d67) |
| `unificado/mapa/api/formas_por_setor.py` | mapa | A | igual a mapa-api/formas_por_setor.py (SHA256 normalizado 184ab82257da) |
| `unificado/mapa/api/realtime_bridge.py` | mapa | B | difere de mapa-api/realtime_bridge.py (local c95f221f6eac, VPS 712a2346c786) |
| `unificado/mapa/api/screen_access.py` | mapa | B | difere de mapa-api/screen_access.py (local 0de22ea5bb78, VPS e695844946ad) |
| `unificado/mapa/api/screen_catalog.json` | mapa | B | difere de mapa-api/screen_catalog.json (local d9cd9353976c, VPS 256c782f4b99) |
| `unificado/mapa/api/unified_auth.py` | mapa | A | igual a mapa-api/unified_auth.py (SHA256 normalizado a07d21f81a89) |
| `unificado/mapa/operacao/bridge.js` | mapa | A | igual a public/unificado/mapa/operacao/bridge.js (SHA256 normalizado 8199f78f0685) |
| `unificado/mapa/operacao/sw.js` | mapa | B | difere de public/unificado/mapa/operacao/sw.js (local d969ec84a4bb, VPS 93ac5edf0845) |
| `unificado/mapa/operacao/unificado-bridge.js` | mapa | A | igual a public/unificado/mapa/operacao/unificado-bridge.js (SHA256 normalizado 2b707795b246) |
| `unificado/pcp/backend/app/api/routers/pcp.py` | pcp | B | difere de pcp-api/app/api/routers/pcp.py (local 41d2101d785b, VPS fa8c693ada64) |
| `unificado/pcp/backend/app/api/routers/usuarios.py` | pcp | A | igual a pcp-api/app/api/routers/usuarios.py (SHA256 normalizado b204c5cf7662) |
| `unificado/pcp/backend/app/core/config.py` | pcp | B | contém credencial local embutida já presente no histórico Git; retenção por segurança, requer remoção/rotação |
| `unificado/pcp/backend/app/core/security.py` | pcp | A | igual a pcp-api/app/core/security.py (SHA256 normalizado 4acc16dd0995) |
| `unificado/pcp/backend/app/main.py` | pcp | B | difere de pcp-api/app/main.py (local ec7ed02e4bab, VPS 55a50202c9f0) |
| `unificado/pcp/backend/app/models/__init__.py` | pcp | A | igual a pcp-api/app/models/__init__.py (SHA256 normalizado 19520d30dc8b) |
| `unificado/pcp/backend/app/models/mapeamento_forma.py` | pcp | A | igual a pcp-api/app/models/mapeamento_forma.py (SHA256 normalizado 37e6f1bf44a8) |
| `unificado/pcp/backend/app/models/producao.py` | pcp | A | igual a pcp-api/app/models/producao.py (SHA256 normalizado 61f1dbd55154) |
| `unificado/pcp/backend/app/models/usuario.py` | pcp | A | igual a pcp-api/app/models/usuario.py (SHA256 normalizado f2a22fc8aa95) |
| `unificado/pcp/backend/app/repositories/google_sheets_repository.py` | pcp | A | igual a pcp-api/app/repositories/google_sheets_repository.py (SHA256 normalizado eb4625271d49) |
| `unificado/pcp/backend/app/schemas/dashboard.py` | pcp | A | igual a pcp-api/app/schemas/dashboard.py (SHA256 normalizado 77c0dadbd5cf) |
| `unificado/pcp/backend/app/schemas/producao.py` | pcp | A | igual a pcp-api/app/schemas/producao.py (SHA256 normalizado 1fa39e3b1528) |
| `unificado/pcp/backend/app/services/dashboard_service.py` | pcp | B | difere de pcp-api/app/services/dashboard_service.py (local c185fa4ddd9b, VPS 959dcf1e79b6) |
| `unificado/pcp/backend/requirements.txt` | pcp | B | difere de pcp-api/requirements.txt (local dcb61f3263ed, VPS 1ef55ce1939b) |
| `unificado/pcp/maodeobra/index.html` | pcp | B | difere de public/unificado/pcp/maodeobra/index.html (local cf9814b2492a, VPS dd0d52d1c6fc) |
| `unificado/pcp/primeiro-acesso/index.html` | pcp | B | difere de public/unificado/pcp/primeiro-acesso/index.html (local 03d0cd7d9697, VPS 645b1ad5ca6a) |
| `unificado/pcp/programacao-alex/index.html` | pcp | B | difere de public/unificado/pcp/programacao-alex/index.html (local 820592c8bce1, VPS 2f188b5cf33a) |
| `unificado/pcp/programacao/index.html` | pcp | B | difere de public/unificado/pcp/programacao/index.html (local ecc131bd0b03, VPS 1757e935eca2) |
| `unificado/pcp/static/js/app.js` | pcp | B | difere de public/unificado/pcp/static/js/app.js (local f02bfacd6eb9, VPS 22c7e46e11b8) |
| `unificado/pcp/static/js/formas-por-setor.js` | pcp | A | igual a public/unificado/pcp/static/js/formas-por-setor.js (SHA256 normalizado 5d178b3dd9eb) |
| `unificado/pcp/teste-programacao/index.html` | pcp | A | igual a public/unificado/pcp/teste-programacao/index.html (SHA256 normalizado 854bfa31de15) |
| `unificado/pcp/unificado-bridge.js` | pcp | A | igual a public/unificado/pcp/unificado-bridge.js (SHA256 normalizado cd258ab51fd4) |
| `unificado/pcp/usuarios/index.html` | pcp | B | difere de public/unificado/pcp/usuarios/index.html (local 36317e721f46, VPS cc4052539312) |
| `unificado/shell/auth.js` | shell | A | igual a public/unificado/shell/auth.js (SHA256 normalizado fd709795e89e) |
| `unificado/shell/menu.config.js` | shell | B | difere de public/unificado/shell/menu.config.js (local aed35cb724e7, VPS 98f35326b86d) |
| `unificado/shell/modelo-a-host.css` | shell | A | igual a public/unificado/shell/modelo-a-host.css (SHA256 normalizado 7d795aad54ca) |
| `unificado/shell/modelo-a-loader.js` | shell | B | difere de public/unificado/shell/modelo-a-loader.js (local 083be818e0c6, VPS dda3cf526024) |
| `unificado/shell/modelo-a/menu.js` | shell | B | difere de public/unificado/shell/modelo-a/menu.js (local 426431bf11d3, VPS e85fa8584e6f) |
| `unificado/shell/module-pages.js` | shell | A | igual a public/unificado/shell/module-pages.js (SHA256 normalizado c9abf44b8cb0) |
| `unificado/shell/router.js` | shell | B | difere de public/unificado/shell/router.js (local 0deb00261f11, VPS ff2b669859d0) |
| `unificado/shell/shared-menu.css` | shell | A | igual a public/unificado/shell/shared-menu.css (SHA256 normalizado d2367ae6765f) |
| `unificado/shell/shell.css` | shell | A | igual a public/unificado/shell/shell.css (SHA256 normalizado 71b3e214900a) |
| `unificado/shell/shell.js` | shell | B | difere de public/unificado/shell/shell.js (local e688a3ae22ba, VPS ff318968c901) |
| `unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c85f2a0415a) |
| `unificado/sw.js` | shell | B | difere de public/unificado/sw.js (local a49d3484c3b8, VPS cd5a08063647) |
| `unificado/usinas/README.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local be7030a37730) |
| `unificado/usinas/index.html` | usinas | A | igual a public/unificado/usinas/index.html (SHA256 normalizado 45d11e73681a) |
| `unificado/usinas/native-areas.js` | usinas | A | igual a public/unificado/usinas/native-areas.js (SHA256 normalizado be2e108efd5c) |
| `.codex-tmp-concretagem-deploy/candidate/app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/dashboard_schema.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/dashboard_service.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/dashboards-v6.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/menu.config.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/modelo-menu.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/screen_catalog.json` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/candidate/unificado-bridge.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/concretagem-matriz-v7-20261023.tar.gz` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/concretagem-matriz-v7a-20261023.tar.gz` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/deploy.sh` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-dashboard_schema.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-dashboard_service.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-menu.config.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-modelo-menu.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/homolog-unificado-bridge.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/package.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prepare.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-dashboard_schema.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-dashboard_service.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-dashboards-v6.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-menu.config.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-modelo-menu.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-screen_catalog.json` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/prod-unificado-bridge.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-concretagem-deploy/verify_metric.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-cq-production/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-cq/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/build.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/dashboards-v7.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/deploy.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/mapa-index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/mapa-sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/prod-mapa-index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/prod-mapa-sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/prod-root-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/prod-root-sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/root-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dashboards-v7/root-sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/build-shell-candidates.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/amostras-100ms.json` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/approvals-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/approvals-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/calibrations-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/calibrations-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/dashboard-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/dashboard-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/documents-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/documents-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/page@d8341cbaa2850b80d434f30ad82e4e9b.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/tasks-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/celular/tasks-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/approvals-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/approvals-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/calibrations-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/calibrations-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/dashboard-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/dashboard-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/documents-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/documents-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/page@34f16bcc4d2b0e75cfbcbf4fafad38df.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/tasks-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-homolog-captures/desktop/tasks-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/amostras-100ms.json` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/approvals-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/approvals-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/calibrations-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/calibrations-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/dashboard-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/dashboard-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/documents-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/documents-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/page@9e69468a3c429d7cc7787fba15ba3fc2.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/tasks-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/celular/tasks-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/approvals-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/approvals-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/calibrations-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/calibrations-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/dashboard-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/dashboard-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/documents-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/documents-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/page@7f3740589aa4bf50b004248f0291b615.webm` | ged | C | build ou captura de vídeo gerada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/tasks-open.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/ged14-prod-captures/desktop/tasks-reload.png` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/index-homolog-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/index-homolog.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/index-prod-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/index-prod.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/maodeobra-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/maodeobra-prod.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/model-prod.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/models-init-prod.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/operacao-homolog-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/operacao-homolog.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/operacao-prod-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/operacao-prod.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-candidate.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-captures/cadastro-desktop.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-captures/s12-desktop.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-captures/s34-celular-topo.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-captures/s34-celular-total.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-captures/s34-desktop.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/pcp-prod.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/publish-pcp.sh` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/publish-shell-homolog.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/publish-shell-prod.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/quality_editor_check.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/rollback-pcp.sh` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/rollback-shell-prod.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/router-homolog.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/router-prod.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/schema-prod.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/shell-homolog.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/shell-homolog.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/shell-prod.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/shell-prod.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/sw-homolog.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/sw-prod.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/users-homolog.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/users-homolog.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/users-prod.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-deploy-20261016/users-prod.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/index-current.html` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/index-production.html` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release-1031.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release-1032.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release-1033.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release-1034.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release-1035.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/VERSION` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/index.html` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/shell/menu.config.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/shell/modelo-a-loader.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/shell/modelo-a/menu.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/shell/router.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/shell/shell.css` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/shell/shell.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/release/sw.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/VERSION` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/index.html` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/menu.config.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/menu.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/modelo-a-loader.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/router.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/shell.css` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-dosagem-native/remote-shell/shell.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source.tar` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/Dockerfile` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/next.config.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/package-lock.json` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/package.json` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/approvals/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/calibrations/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/dashboard/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/documents/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/documents/[id]/page.tsx.bak-20260727-version-history-log` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/documents/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/layout.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/rnc/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/rnc/new/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/rnc/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/tasks/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/tasks/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/(app)/users/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/calibrations/label/[id]/PrintButton.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/calibrations/label/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/calibrations/verify/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/change-password/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/change-password/page.tsx.bak-20260727-password-focus` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/globals.css` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/layout.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/login/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/app/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/ApprovalModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/DocumentTable.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/EditDocumentModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/FilterBar.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/Header.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/Sidebar.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/StatsCard.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/TaskBoard.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/TaskFilters.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/TaskModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/components/UploadModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/constants/documentMeta.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/constants/rncMeta.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/constants/taskMeta.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/contexts/AuthContext.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/hooks/useRequireAuth.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-frontend-source/src/services/api.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-homolog-source.tar.gz` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-layout-20261015.tar` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-shell-20261015.tar` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-sso-20261016.tar` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-sso-app.live.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-sso-users.live.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-ged-users-20261015.tar` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/build.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/candidate/faleaqui-icon.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/candidate/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/candidate/pederh-icon.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/candidate/shell.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/candidate/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/deploy.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/faleaqui-icon-3d-v5.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/faleaqui-icon-v5-192.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/home-app-cards-20261023.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/prod-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/prod-shell.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-app-cards/prod-shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-home-header-deploy/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/api.candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/api.live.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/app.candidate.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/app.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/cleanup_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/index.candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/index.current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/index.drawings.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/index.live.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/live-diagnostic.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/live_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/prepare.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/prepare_git.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/sw.candidate.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/sw.current.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/sw.drawings.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-publish/sw.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/auth.candidate.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/auth.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/cleanup_debug.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/deploy.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/inspecao-pwa.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/live_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/nginx.live.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/package.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/prepare.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/query_producao.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/screen-access.candidate.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/screen-access.live.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/screen_access.candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/screen_access.live.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/screen_catalog.live.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-pwa/stage_git.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/app.candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/app.live.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/build_live_code_only.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/build_live_labels.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/build_live_text_labels.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/code_only_labels.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/deploy.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/deploy_menu.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/fix_text_controls.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/index.candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/index.live.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/inspecao-turno.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/inspecao.head.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/inspecao.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/labels_candidate_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/labels_offline_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/etiquetas.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/sc.candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/sc.code-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/sc.code-current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/sc.current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/sc.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/sc.text-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/standard.candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/standard.code-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/standard.code-current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/standard.current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/standard.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-labels/standard.text-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live-menu-tablet.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live_menu_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/live_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/package.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/prepare.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/probe-navigation.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/probe_navigation.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/publish_labels.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/pwa-app.live.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/pwa-app.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/pwa-index.head.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/pwa-index.live.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/pwa-menu.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/pwa-sw.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/query_labels.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/rebuild_text_html.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/stage_git.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/stage_label_backend.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/sw.candidate.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-inspecao-turno/sw.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-integracao/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/active_db.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/check_logo.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/check_process_env.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/compare_release.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/debug_sw.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/debug_sw_prod.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/env_info.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/postes_api.remote.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/postes_rules.remote.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before.tar` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/VERSION` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/login.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/shell/router.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/shell/shared-menu.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/shell/shell.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/shell/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/prod-before/unificado/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/test_collapsed.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/test_shell.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/test_shell_prod.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/unificado-shell-1.0.tar` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/url_path.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/verify_live.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-lab-dimensions/verify_sw.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/android-video-contact.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/app.homolog.stage2.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-before/app.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-before/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-before/maodeobra-grupos.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-before/pcp.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-before/producao.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-before/schema-producao.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-deploy/app.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/confirm-deploy/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/home_debug.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/index-homolog-before.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/index-homolog-candidate.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/index-shell.homolog.before-stage3.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/index.homolog.before.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/index.homolog.stage2.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/index.homolog.stepper.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/pcp-baseline.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/pcp-candidate.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/pcp.homolog.before.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/producao-model.homolog.before.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/producao-schema.homolog.before.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-maodeobra/shell.homolog.before-stage3.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/Dockerfile` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/app-candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/app-homolog-before.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/app-homolog-candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/app-local-candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/app-published.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/ged-auth-before.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/ged-authController-before.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/ged-unifiedRoutes-before.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-marcelo/screen_access-published.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/VERSION` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/auth.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/menu.config.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/modelo-a-host.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/modelo-a-loader.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/modelo-a/menu.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/modelo-a/menu.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/router.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/shared-menu.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/shell.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/shell/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/candidate/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/check_old_erp_accounts.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/homolog-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/modelo-a-overlay.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/modelo-a-prod-files.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/old-auth.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/old-concretrack-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/old-login-response.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/old-login.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/VERSION` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/shell/auth.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/shell/menu.config.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/shell/router.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/shell/shared-menu.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/shell/shell.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/shell/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/prod/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-menu-publish-20261016/reset_old_erp_ricardo.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/deploy.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/index-v2.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/index-v3.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/index-v4.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/mobile-cards-20261024.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/mobile-cards-v2-20261024.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/mobile-cards-v3-20261024.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/mobile-cards-v4-20261024.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/prod-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/prod-sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/sw-v2.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/sw-v3.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/sw-v4.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-cards/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-mobile-push/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/build.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/candidate/app.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/candidate/dashboards-v6.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/candidate/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/candidate/montagem-taxa.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/candidate/montagem-taxa.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/candidate/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/deploy.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/montagem-defeitos-v8a.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/montagem-defeitos-v8b.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-app.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-dashboard-defeitos-v5.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-dashboards-v6.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-montagem-taxa.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-montagem-taxa.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/prod-sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/update_mockup.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-montagem-defeitos-deploy/verify_timeline.cjs` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-navegacao/` | shell | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-noro-label-print/check.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-noro-label-print/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-homolog-payload.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/app.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/candidate/app.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/candidate/menu.config.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/candidate/modelo-a-menu.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/candidate/screen_access.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/candidate/screen_catalog.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/candidate/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/menu.config.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/modelo-a-menu.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/payload.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/screen_access.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/screen_catalog.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-prod/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/2026-10-14-v2.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/2026-10-14-v4.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/2026-10-14.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/2026-10-15-v2.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/2026-10-15.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/app-candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/app.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/menu.config.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/modelo-a-menu.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/screen_access.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/screen_catalog.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-painel-tv-server/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-index-20261016.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-menu-20261016.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-router-20261016.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-shared-menu-20261016.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-shell-20261016.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-shell-20261016.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-sw-20261016.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-users-20261016.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-prod-users-20261016.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-qrcp-noro/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-qrcp-noro/qrcp.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-qrcp-noro/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-qrcp-offline/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-qrcp-offline/security.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-qrcp-offline/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/build_published_shell.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/index.live.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/live_opening_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/opening-1440.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/opening-820.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/opening-live-tablet.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/opening_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/publish_opening.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/shell.live.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/shell.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/shell.publish.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp-unificado-opening/sw.live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/DashConcretagem.png` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/DashDefeitos.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/DashMontagem.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/PedeRH-clean.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/a6-nginx-test/nginx.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/a6-nginx-test/vhost.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/add_dt_criteria_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-live-035.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-live-037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-live-before-reset.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-live-now.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-pre-master-live.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/VERSION` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/mapa/operacao/app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/mapa/operacao/index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/mapa/operacao/sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/shell/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/app-update-1.0.7/unificado/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/audit_lab_criteria_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/audit_mapa_cutover_ids.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/audit_mapa_new_only.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/audit_mapa_users_20261007.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/audit_permissions_035.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/auth-concretrack-new.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/auth-concretrack-source.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/b5-concession/api.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/b5-concession/count.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/b5-concession/install.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/b5-concession/rules.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/acompanhamento-mensal-setor-34/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/acompanhamento-mensal/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/apontamento-mega/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/comparacao/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/dashboard/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/etiquetas-armaduras/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/etiquetas-sc/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/etiquetas/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/formas-por-setor/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/maodeobra-rateio/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/maodeobra/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/pcp-diario/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/primeiro-acesso/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/producao/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/programacao-alex/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/programacao-circular-s3/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/programacao-circular-s4/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/programacao-final/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/programacao/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/relatorio-producao/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/relatorio-programacao-s3/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/relatorio-programacao-s4/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/css/app.css` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/css/formas-por-setor.css` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/css/inter-original.css` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7SUc.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7SUc.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7SUc.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7SUc.woff2` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/img/concrefer-logo-alt.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/img/concrefer-logo.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/img/logo-concrefer-relatorio.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/_sidebar.html.txt` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/app.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/etiquetas-armaduras.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/etiquetas.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/formas-por-setor.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/programacao-circular-s3.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/programacao-formas.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/static/js/relatorio-producao.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/teste-programacao/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/unificado-bridge.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/unificado-screen-context.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/unificado-shell.css` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/unificado-shell.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/users-unificado-planning.css` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/users-unificado-planning.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-label-pcp/usuarios/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/app.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/assets/img/icon.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/assets/msgbox.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/assets/msgbox.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/bridge.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/chart.min.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/chartjs-plugin-datalabels.min.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/dashboard-defeitos-v4.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/dashboard-defeitos-v5.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/dashboard-defeitos-v5.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/dashboard-reference-layout.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/dashboard-reference-layout.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/data/produto-volumes.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/fonts/Geist-Medium.woff2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/fonts/Geist-Regular.woff2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/fonts/Geist-SemiBold.woff2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/fonts/GeistMono-Medium.woff2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/fonts/GeistMono-SemiBold.woff2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/fonts/OFL.txt` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/mandril-report.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/modelos-formas.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/montagem-taxa.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/montagem-taxa.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/screen-context.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/styles.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/supabase.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/unificado-bridge.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/unificado-bridge.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/unificado-icon.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/users-unificado.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/users-unificado.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build-users-reset/xlsx.full.min.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/build_lab_dimensions_review_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/c2-baseline/frontend/api.ts` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/capture_first_access.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/capture_menu_before.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_068.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_lab_db.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_lab_shared.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_map_auth_local.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_map_runtime_env.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_mapa_db_user.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_old_jcarlos.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_one_module_028.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_ricardo_accounts.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_ricardo_teste_027.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_screens_069.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_shell.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/check_unified_identity_schema.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Crashpad/metadata` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Crashpad/settings.dat` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Account Web Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Account Web Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Affiliation Database` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Affiliation Database-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/BookmarkMergedSurfaceOrdering` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/Cache_Data/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/Cache_Data/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/Cache_Data/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/Cache_Data/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/Cache_Data/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/No_Vary_Search/journal.baj` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Cache/No_Vary_Search/snapshot.baf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/ClientCertificates/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/ClientCertificates/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Code Cache/js/ba678a2fbd8c358c_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Code Cache/js/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Code Cache/js/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Code Cache/wasm/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Code Cache/wasm/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnGraphiteCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnGraphiteCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnGraphiteCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnGraphiteCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnGraphiteCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnWebGPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnWebGPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnWebGPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnWebGPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/DawnWebGPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Rules/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Rules/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Rules/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Rules/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Scripts/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Scripts/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Scripts/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension Scripts/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension State/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension State/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension State/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Extension State/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Favicons` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Favicons-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/GPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/GPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/GPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/GPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/GPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/History` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/History-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Local Storage/leveldb/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Local Storage/leveldb/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Local Storage/leveldb/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Local Storage/leveldb/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Login Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Login Data For Account` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Login Data For Account-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Login Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Cookies` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Cookies-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Device Bound Sessions` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Device Bound Sessions-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Network Persistent State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/NetworkDataMigrated` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Reporting and NEL` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Reporting and NEL-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Trust Tokens` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Network/Trust Tokens-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/PersistentOriginTrials/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/PersistentOriginTrials/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Preferences` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/README` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Safe Browsing Network/NetworkDataMigrated` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Secure Preferences` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Segmentation Platform/SegmentInfoDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Segmentation Platform/SegmentInfoDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Segmentation Platform/SignalDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Segmentation Platform/SignalDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Segmentation Platform/SignalStorageConfigDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Segmentation Platform/SignalStorageConfigDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/ServerCertificate` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/ServerCertificate-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/Database/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/Database/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/Database/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/Database/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/ScriptCache/2cc80dabc69f58b6_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/ScriptCache/4cb013792b196a35_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/ScriptCache/4cb013792b196a35_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/ScriptCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Service Worker/ScriptCache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Session Storage/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Session Storage/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Session Storage/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Session Storage/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Sessions/Session_13435281507319164` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Sessions/Tabs_13435281507323409` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Shared Dictionary/cache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Shared Dictionary/cache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Shared Dictionary/db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Shared Dictionary/db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Site Characteristics Database/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Site Characteristics Database/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Site Characteristics Database/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Site Characteristics Database/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Sync Data/LevelDB/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Sync Data/LevelDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Sync Data/LevelDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Sync Data/LevelDB/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Top Sites` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Top Sites-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Web Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/Web Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/WebStorage/QuotaManager` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/WebStorage/QuotaManager-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/chrome_cart_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/chrome_cart_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/commerce_subscription_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/commerce_subscription_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/declarative_performance_observer.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/declarative_performance_observer.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/discount_infos_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/discount_infos_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/discounts_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/discounts_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/engine_allowlist.bf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/parcel_tracking_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/parcel_tracking_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/metadata/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/metadata/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/metadata/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Default/shared_proto_db/metadata/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GPUPersistentCache/DawnGraphiteCache/ZBRSUVJ7IMDXK2RUP4UNAHPCKJL4BWQB/cache.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GPUPersistentCache/DawnGraphiteCache/ZBRSUVJ7IMDXK2RUP4UNAHPCKJL4BWQB/cache.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GPUPersistentCache/DawnGraphiteCache/ZBRSUVJ7IMDXK2RUP4UNAHPCKJL4BWQB/cache.journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GrShaderCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GrShaderCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GrShaderCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GrShaderCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/GrShaderCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Last Version` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Local State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/ShaderCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/ShaderCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/ShaderCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/ShaderCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/ShaderCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/Variations` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/VariationsSafeSeedV2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/VariationsSeedV2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/extensions_crx_cache/metadata.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chrome-preview/segmentation_platform/ukm_db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/BrowserMetrics-spare.pma` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10800/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10800/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10800/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10800/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10801/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10801/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10801/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10801/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10802/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10802/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10802/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10802/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10803/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10803/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10803/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10803/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10804/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10804/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10804/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10804/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10805/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10805/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10805/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10805/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10808/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10808/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10808/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10808/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10810/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10810/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10810/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10810/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10811/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10811/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10811/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10811/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10812/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10812/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10812/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10812/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10813/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10813/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10813/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10813/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10814/LICENSE` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10814/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10814/crl-set` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/CertificateRevocation/10814/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Crashpad/metadata` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Crashpad/settings.dat` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Account Web Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Account Web Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Affiliation Database` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Affiliation Database-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/AutofillAiModelCache/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/AutofillAiModelCache/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/AutofillStrikeDatabase/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/AutofillStrikeDatabase/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/BookmarkMergedSurfaceOrdering` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/BrowsingTopicsSiteData` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/BrowsingTopicsSiteData-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/BrowsingTopicsState` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/BudgetDatabase/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/BudgetDatabase/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/sqldb0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/sqldb0-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/sqldb1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/sqldb1-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/sqldb2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/Cache_Data/sqldb2-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/No_Vary_Search/journal.baj` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Cache/No_Vary_Search/snapshot.baf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/ClientCertificates/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/ClientCertificates/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Code Cache/pc/05_@;2t2fb2=a6@=`6`2`2-1;0078;@083139@04447341-01@1813`2.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Code Cache/pc/05_@;2t2fb2=a6@=`6`2`2-1;0078;@083139@04447341-01@1813`2.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Code Cache/pc/05_@;2t2fb2=a6@=`6`2`2-1;0078;@083139@04447341-01@1813`2.journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Code Cache/pc/05_@;2t2fb2=a6@=`6`2`2=826;5@471[=[00@@3[966;--5;--@;2`2.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Code Cache/pc/05_@;2t2fb2=a6@=`6`2`2=826;5@471[=[00@@3[966;--5;--@;2`2.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Code Cache/pc/05_@;2t2fb2=a6@=`6`2`2=826;5@471[=[00@@3[966;--5;--@;2`2.journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Collaboration/MessageDB` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Collaboration/MessageDB-journal` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DIPS` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DIPS-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DataSharing/DataSharingDB` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DataSharing/DataSharingDB-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnGraphiteCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnGraphiteCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnGraphiteCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnGraphiteCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnGraphiteCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnWebGPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnWebGPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnWebGPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnWebGPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/DawnWebGPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Rules/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Rules/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Rules/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Rules/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Scripts/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Scripts/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Scripts/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension Scripts/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension State/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension State/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension State/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extension State/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/af/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/am/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ar/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/az/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/be/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/bg/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/bn/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ca/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/cs/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/cy/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/da/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/de/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/el/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/en/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/en_CA/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/en_GB/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/en_US/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/es/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/es_419/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/et/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/eu/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/fa/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/fi/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/fil/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/fr/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/fr_CA/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/gl/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/gu/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/hi/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/hr/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/hu/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/hy/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/id/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/is/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/it/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/iw/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ja/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ka/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/kk/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/km/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/kn/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ko/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/lo/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/lt/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/lv/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ml/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/mn/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/mr/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ms/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/my/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ne/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/nl/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/no/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/pa/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/pl/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/pt_BR/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/pt_PT/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ro/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ru/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/si/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/sk/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/sl/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/sr/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/sv/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/sw/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ta/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/te/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/th/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/tr/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/uk/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/ur/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/vi/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/zh_CN/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/zh_HK/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/zh_TW/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_locales/zu/messages.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/background_compiled.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/images/drive-sync128.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/images/drive-sync16.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/images/drive-sync256.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/images/drive-sync64.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/offscreen.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Extensions/lmjegmlicamnimmfhcmpkclmigmmcbeh/3.10_0/offscreen_compiled.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Favicons` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Favicons-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/Encryption/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/Encryption/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/Encryption/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/Encryption/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GCM Store/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/GPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/History` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/History-shm` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/History-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/LocalStorage` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/LocalStorage-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Login Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Login Data For Account` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Login Data For Account-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Login Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network Action Predictor` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network Action Predictor-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Cookies` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Cookies-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Device Bound Sessions` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Device Bound Sessions-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Network Persistent State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/NetworkDataMigrated` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Reporting and NEL` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Reporting and NEL-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/SCT Auditing Pending Reports` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/TransportSecurity` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Trust Tokens` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Network/Trust Tokens-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/PersistentOriginTrials/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/PersistentOriginTrials/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Preferences` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/PreferredApps` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Profile.dirty` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/README` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Secure Preferences` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Segmentation Platform/SegmentInfoDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Segmentation Platform/SegmentInfoDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Segmentation Platform/SignalDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Segmentation Platform/SignalDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Segmentation Platform/SignalStorageConfigDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Segmentation Platform/SignalStorageConfigDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/ServerCertificate` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/ServerCertificate-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/Database/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/Database/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/Database/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/Database/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/ScriptCache/2cc80dabc69f58b6_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/ScriptCache/2cc80dabc69f58b6_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/ScriptCache/4cb013792b196a35_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/ScriptCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Service Worker/ScriptCache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/SessionStorage` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/SessionStorage-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Sessions/Session_13434913149903249` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Shared Dictionary/cache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Shared Dictionary/cache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Shared Dictionary/db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Shared Dictionary/db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/SharedStorage` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/SharedStorage-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Shortcuts` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Shortcuts-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Site Characteristics Database/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Site Characteristics Database/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Site Characteristics Database/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Site Characteristics Database/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Sync Data/LevelDB/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Sync Data/LevelDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Sync Data/LevelDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Sync Data/LevelDB/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Top Sites` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Top Sites-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Web Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/Web Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/WebStorage/QuotaManager` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/WebStorage/QuotaManager-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/chrome_cart_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/chrome_cart_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/commerce_subscription_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/commerce_subscription_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/declarative_performance_observer.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/declarative_performance_observer.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/discount_infos_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/discount_infos_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/discounts_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/discounts_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/engine_allowlist.bf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/heavy_ad_intervention_opt_out.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/heavy_ad_intervention_opt_out.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/optimization_guide_hint_cache_store/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/optimization_guide_hint_cache_store/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/parcel_tracking_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/parcel_tracking_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/metadata/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/metadata/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/metadata/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/shared_proto_db/metadata/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Default/trusted_vault.pb` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/GPUPersistentCache/DawnGraphiteCache/EQUJQYVHB4EV7G3LMS7TSLJPIUQOJZ5E/cache.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/GPUPersistentCache/DawnGraphiteCache/EQUJQYVHB4EV7G3LMS7TSLJPIUQOJZ5E/cache.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/GPUPersistentCache/DawnGraphiteCache/EQUJQYVHB4EV7G3LMS7TSLJPIUQOJZ5E/cache.journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/GPUPersistentCache/GPUCache/74YTS4RRWWOYPEOQLI7OY4AWHR2XL643/cache.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/GPUPersistentCache/GPUCache/74YTS4RRWWOYPEOQLI7OY4AWHR2XL643/cache.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/GPUPersistentCache/GPUCache/74YTS4RRWWOYPEOQLI7OY4AWHR2XL643/cache.journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Last Browser` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Last Version` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Local State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/ChromeExtMalware.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/ChromeExtMalware.store.32_13435148747394781` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/ChromeExtMalware.store.32_13435406610592928` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlBilling.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlBilling.store.4_13435375581565680` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlBilling.store.4_13435406610775167` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlCsdDownloadAllowlist.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlCsdDownloadAllowlist.store.32_13434913289464747` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlMalBin.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlMalBin.store.4_13435375581543711` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlMalBin.store.4_13435406610541057` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlMalware.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlMalware.store.4_13435375581500959` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlMalware.store.4_13435406610338157` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlSoceng.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlSoceng.store.4_13435375581289843` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlSoceng.store.4_13435406609811797` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlUws.store` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlUws.store.4_13435375581520441` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Safe Browsing/UrlUws.store.4_13435406610489555` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Subresource Filter/Indexed Rules/38/9.72.0/Ruleset Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Subresource Filter/Unindexed Rules/9.72.0/Filtering Rules` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Subresource Filter/Unindexed Rules/9.72.0/LICENSE.txt` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Subresource Filter/Unindexed Rules/9.72.0/_metadata/verified_contents.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Subresource Filter/Unindexed Rules/9.72.0/manifest.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/Variations` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/component_crx_cache/34ce4871804d747cf5cdafaec2f4befe25ff7333137f72394b0ff5a4e60f6160` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/component_crx_cache/ca1c9e97ad3711d4cd11be758fec6fce5bd71cff4d6625a8813315f1389bc366` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/component_crx_cache/metadata.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/extensions_crx_cache/metadata.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/first_party_sets.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/first_party_sets.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/segmentation_platform/ukm_db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/chromium-concretrack-pdf/segmentation_platform/ukm_db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/cleanup-preview-pre-go.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/cleanup_master_grant_probe.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/cleanup_master_test.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/cleanup_pcp_origin_probe.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/click_auto_pcp_grant_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/click_master_grants_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/click_pcp_origin_grant_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/click_ricardo_users_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/comparacao-2026-10-01.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/compare_labels_data.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/compare_mapa_build.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/compare_mapa_types.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/compare_model_a_030.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/compare_pdf_069.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/concrefer-live.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/concrefer-nginx-before-permissions.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/concrefer-nginx-current2.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/concrefer-nginx-permissions.conf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/create_master_grant_probe.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/create_pcp_origin_probe.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/auth.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/custo-carta-traco.integrado.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/custos.current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/custos.preview-4x3.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/index.4x3.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/index.current.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/index.labels.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/index.material-colors.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/index.remote.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/index.soft-rows.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/relatorios.current.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/custo-fechamento/slide.preview-4x3.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-defeitos-v4.spec.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-old-concretagem.png` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-usina-concretrack-new.conf` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-usina-concretrack-source.conf` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-usina.live.conf` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-usina/routes_usina.py` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-usina/usina.html` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dashboard-usina/usina_dashv2.html` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_alex_lab_038.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_alex_menu_039.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_cookie_036.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_dt_037.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_lab_access_027.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_menu_model_a_030.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_menu_model_a_031.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_permissions_033.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_permissions_035.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_ricardo_grants.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_ricardo_grants_2.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_ricardo_master.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_ricardo_teste_lab_032.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_shared_menu_028.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_shared_menu_029.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_shell_034.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_standard_labels_20261015.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_ui_037.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_unificado_master_20261013.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_unificado_master_links_20261013.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_unificado_password_v2_20261013.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/deploy_users_reset_20261014.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-deploy-20261022.sh` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022.tar.gz` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/mapa-api/screen_catalog.json` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/VERSION` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/index.html` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/shell/menu.config.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/shell/modelo-a-loader.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/shell/modelo-a/menu.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/shell/router.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/shell/shell.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem-unificado-release-20261022/public/unificado/sw.js` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/dosagem_unificado_candidate_smoke.py` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Crashpad/metadata` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Crashpad/settings.dat` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Crashpad/throttle_store.dat` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Affiliation Database` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Affiliation Database-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/BookmarkMergedSurfaceOrdering` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Bookmarks` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Cache/Cache_Data/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Cache/Cache_Data/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Cache/Cache_Data/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Cache/Cache_Data/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Cache/Cache_Data/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/ClientCertificates/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/ClientCertificates/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/2a8a6f695a3ff316_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/2cca9bc741a6516d_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/5cce1706364839f1_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/5fbb54f36261c413_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/7de0dc67a2b3a69c_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/8020acacb3d13763_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/8bb1867be67136eb_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/945cb8fb56d09a8e_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/b21fb45197b9c728_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/ba678a2fbd8c358c_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/baded5730168391f_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/e94999eac39dfd99_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/e9a142a21b9ad9ef_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/ebce9e52a869b921_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/js/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/wasm/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Code Cache/wasm/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnGraphiteCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnGraphiteCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnGraphiteCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnGraphiteCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnGraphiteCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnWebGPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnWebGPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnWebGPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnWebGPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DawnWebGPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DualEngine/SiteList-Consumer.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/DualEngine/SiteList-Enterprise.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/EdgeHubAppUsage/EdgeHubAppUsageSQLite.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/EdgeHubAppUsage/EdgeHubAppUsageSQLite.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/EdgePushStorageWithConnectTokenAndKey/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/EdgePushStorageWithConnectTokenAndKey/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Rules/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Rules/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Rules/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Rules/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Scripts/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Scripts/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Scripts/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension Scripts/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension State/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension State/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension State/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Extension State/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Favicons` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Favicons-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/GPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/GPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/GPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/GPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/GPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/History` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/History-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/HubApps Icons` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/HubApps Icons-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Extension Settings/jdiccldimpdaibmpdkjnbmckianbfold/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Extension Settings/jdiccldimpdaibmpdkjnbmckianbfold/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Extension Settings/jdiccldimpdaibmpdkjnbmckianbfold/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Extension Settings/jdiccldimpdaibmpdkjnbmckianbfold/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Storage/leveldb/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Storage/leveldb/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Storage/leveldb/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Local Storage/leveldb/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Login Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Login Data For Account` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Login Data For Account-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Login Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Cookies` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Cookies-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Device Bound Sessions` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Device Bound Sessions-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Network Persistent State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/NetworkDataMigrated` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Reporting and NEL` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Reporting and NEL-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/SCT Auditing Pending Reports` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Trust Tokens` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Network/Trust Tokens-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Nurturing/campaign_history` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Nurturing/campaign_history-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/PersistentOriginTrials/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/PersistentOriginTrials/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Preferences` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/README` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Secure Preferences` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/ServerCertificate` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/ServerCertificate-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/Database/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/Database/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/Database/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/Database/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/ScriptCache/2cc80dabc69f58b6_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/ScriptCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Service Worker/ScriptCache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Session Storage/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Session Storage/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Session Storage/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Session Storage/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Sessions/Session_13435281516838028` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Sessions/Tabs_13435281516922496` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Shared Dictionary/cache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Shared Dictionary/cache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Shared Dictionary/db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Shared Dictionary/db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Site Characteristics Database/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Site Characteristics Database/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Site Characteristics Database/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Site Characteristics Database/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Code Cache/js/6f3a0dc5e6916f1e_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Code Cache/js/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Code Cache/js/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Code Cache/wasm/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Code Cache/wasm/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnGraphiteCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnGraphiteCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnGraphiteCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnGraphiteCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnGraphiteCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnWebGPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnWebGPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnWebGPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnWebGPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/DawnWebGPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/GPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/GPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/GPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/GPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/GPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Local Storage/leveldb/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Local Storage/leveldb/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Local Storage/leveldb/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Local Storage/leveldb/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/Device Bound Sessions` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/Device Bound Sessions-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/Network Persistent State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/NetworkDataMigrated` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/SCT Auditing Pending Reports` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/Trust Tokens` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Network/Trust Tokens-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Session Storage/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Session Storage/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Session Storage/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Session Storage/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Shared Dictionary/cache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Shared Dictionary/cache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Shared Dictionary/db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/Shared Dictionary/db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/declarative_performance_observer.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Storage/ext/ihmafllikibpmigkcoadcmckbfhibefp/def/declarative_performance_observer.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Sync Data/LevelDB/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Sync Data/LevelDB/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Sync Data/LevelDB/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Sync Data/LevelDB/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Top Sites` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Top Sites-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Vpn Tokens` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Vpn Tokens-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Web Data` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/Web Data-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/WebStorage/QuotaManager` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/WebStorage/QuotaManager-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/arbitration_service_config.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/commerce_subscription_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/commerce_subscription_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/declarative_performance_observer.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/declarative_performance_observer.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/discount_infos_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/discount_infos_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/discounts_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/discounts_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/load_statistics.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/load_statistics.db-shm` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/load_statistics.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/parcel_tracking_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/parcel_tracking_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/metadata/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/metadata/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/metadata/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Default/shared_proto_db/metadata/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/FirstLaunchAfterInstallation` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GPUPersistentCache/DawnGraphiteCache/TLVJWQT6NJWKNBUVMWJ4BCR6DK7MJALX/cache.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GPUPersistentCache/DawnGraphiteCache/TLVJWQT6NJWKNBUVMWJ4BCR6DK7MJALX/cache.db-wal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GPUPersistentCache/DawnGraphiteCache/TLVJWQT6NJWKNBUVMWJ4BCR6DK7MJALX/cache.journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GrShaderCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GrShaderCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GrShaderCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GrShaderCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/GrShaderCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Last Version` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Local State` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Nurturing/campaign_history` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Nurturing/campaign_history-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/ShaderCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/ShaderCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/ShaderCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/ShaderCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/ShaderCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/SmartScreen/RemoteData/customSettings` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/SmartScreen/RemoteData/customSettings_F95BA787499AB4FA9EFFF472CE383A14` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/SmartScreen/RemoteData/edgeSettings` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/SmartScreen/RemoteData/edgeSettings_2.0-0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/Variations` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/VariationsRuntimeSeedV2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/VariationsSafeSeedV2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/VariationsSeedV2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/edge-preview/extensions_crx_cache/metadata.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/etiquetas-circulares-deploy/etiquetas.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/etiquetas-circulares-deploy/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/etiquetas-circulares-deploy/publicar.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/etiquetas-circulares-release/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/find_diego_elen_pcp.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/find_one_module_account.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-a3-build.tgz` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/RBAC_IMPLEMENTACAO.md` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/README.md` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/Dockerfile` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/package.json` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/server.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/config/database.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/config/googleDrive.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/config/jwt.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/approvalController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/approvalController.js.bak-20260727-approval-chain` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/authController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/calibrationController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/documentController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/documentController.js.bak-20260727-document-scope` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/documentController.js.bak-20260727-version-history` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/readLogController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/readLogController.js.bak-20260727-version-readers` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/rncController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/taskController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/controllers/userController.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/middlewares/auth.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/middlewares/auth.js.bak-20260727-document-scope` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/middlewares/roles.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/approvalRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/authRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/calibrationRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/documentRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/readLogRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/rncRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/taskRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/routes/userRoutes.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/alertService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/auditService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/documentService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/documentService.js.bak-20260727-approval-chain` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/driveService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/emailService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/passwordPolicy.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/pdfService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/rbacService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/server.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/backend/src/services/storageService.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/check_rnc_doc.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/docker-compose.prod.yml` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/docker-compose.yml` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/Dockerfile` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/next.config.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/package.json` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/approvals/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/calibrations/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/dashboard/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/documents/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/documents/[id]/page.tsx.bak-20260727-version-history-log` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/documents/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/layout.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/rnc/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/rnc/new/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/rnc/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/tasks/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/tasks/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/(app)/users/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/calibrations/label/[id]/PrintButton.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/calibrations/label/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/calibrations/verify/[id]/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/change-password/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/change-password/page.tsx.bak-20260727-password-focus` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/globals.css` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/layout.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/login/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/app/page.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/ApprovalModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/DocumentTable.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/EditDocumentModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/FilterBar.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/Header.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/Sidebar.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/StatsCard.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/TaskBoard.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/TaskFilters.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/TaskModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/components/UploadModal.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/constants/documentMeta.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/constants/rncMeta.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/constants/taskMeta.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/contexts/AuthContext.tsx` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/hooks/useRequireAuth.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/frontend/src/services/api.ts` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/live_inventory.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/plan_a0_probe.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/plan_extra_probe.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/rnc_schema_dump.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-audit-20261015/source.tgz` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-menu-baseline/VERSION` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-menu-baseline/index.html` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-menu-baseline/menu.config.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-menu-baseline/router.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-menu-baseline/shell.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-menu-baseline/sw.js` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-old-vhost-before-cut.conf` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged-old-vhost-current.conf` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged_db_inventory.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ged_docker_inventory.py` | ged | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/github-old-backup-20261007/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/github-old-backup-20261007/montagem-taxa.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/guest-release-1.0.6.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/handoff-pcp-concretrack-new.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/handoff-pcp-concretrack-source.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/f_000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/f_000002` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/f_000003` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/f_000004` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/Cache_Data/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/No_Vary_Search/journal.baj` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Cache/No_Vary_Search/snapshot.baf` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Code Cache/js/b489f0ee3fe3c0af_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Code Cache/js/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Code Cache/js/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Code Cache/wasm/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Code Cache/wasm/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DIPS` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnGraphiteCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnGraphiteCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnGraphiteCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnGraphiteCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnGraphiteCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnWebGPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnWebGPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnWebGPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnWebGPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/DawnWebGPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/GPUCache/data_0` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/GPUCache/data_1` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/GPUCache/data_2` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/GPUCache/data_3` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/GPUCache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Local Storage/leveldb/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Local Storage/leveldb/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Local Storage/leveldb/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Local Storage/leveldb/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Network/Cookies` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Network/Cookies-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Network/NetworkDataMigrated` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/PersistentOriginTrials/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/PersistentOriginTrials/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Session Storage/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Session Storage/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Session Storage/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Session Storage/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Shared Dictionary/cache/index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Shared Dictionary/cache/index-dir/the-real-index` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Shared Dictionary/db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/Shared Dictionary/db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/declarative_performance_observer.db` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/declarative_performance_observer.db-journal` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/metadata/CURRENT` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/metadata/LOCK` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/metadata/LOG` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/headless-concretrack-pdf/Default/shared_proto_db/metadata/MANIFEST-000001` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/hub-ponte-dosagem-publish-20261022/` | dosagem-v2 | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/index-live-before-reset.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/index.html.payload.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/inspect-live.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/inspect_alex.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/inspect_form_catalog.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/inspect_ricardo_accounts.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/issue-20261007-menu.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/issue-20261007-pcp-flow.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/issue-20261007-probe.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/issue-20261007-session.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/issue_test_cookie_033.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-absorcao.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-access-027.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-hotfix-037.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-live-postes_rules.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-monitor.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-postes.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab-r-037.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_browser_check.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_catalog_20261008.jsonl` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_criterion_v3_20261008.jsonl` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_final_check.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_live_check.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_migrate_nominals_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/lab_write_check.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/labels-data.txt` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/laboratorio-0.6.26.tar.gz` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/list_lab_users.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/list_master_test_candidates.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/list_sector_users_033.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/live-lab-037.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/live-users-037.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/main-acmp-deploy-20260828094103/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/main-mapa-v59/` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/main-publish/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mandril-tablet-820.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mandril-tablet-final-820.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-antigo-pre-modelo-s34-20261008/app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-antigo-pre-modelo-s34-20261008/index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-antigo-pre-modelo-s34-20261008/montagem-taxa.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-antigo-pre-modelo-s34-20261008/sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-api-live-app.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-app-live-before-s4.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-correction-publish/` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-dest-catalog.txt` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-index-live-before-s4.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-old-live-app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-old-live-index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-old-live-styles.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-permissions-stage.service` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/dashboard-defeitos-v4.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/manifest.json` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/reset-cache.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/styles.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-prod-before-test-sync-20260930/sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-release-20260930/` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-release-20261002.patch` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-release-20261002/` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-source-public-schema.json` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa-sw-v0.6.43.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/mapa_source_counts.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/desktop-before.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/desktop-before30.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/mobile-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/mobile-before.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/mobile-before30.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/mobile-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/modelo-a-1366.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/modelo-a-1920.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Laboratório-open-after.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Laboratório-open-preview.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Laboratório-open.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Laboratório-rail-after.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Laboratório-rail-preview.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Laboratório-rail.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Planejamento-open-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Planejamento-open-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Planejamento-open.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Planejamento-rail-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Planejamento-rail-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Planejamento-rail.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Produção-open-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Produção-open-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Produção-open.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Produção-rail-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Produção-rail-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-Produção-rail.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1366-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Laboratório-open-after.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Laboratório-open-preview.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Laboratório-open.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Laboratório-rail-after.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Laboratório-rail-preview.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Laboratório-rail.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Planejamento-open-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Planejamento-open-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Planejamento-open.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Planejamento-rail-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Planejamento-rail-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Planejamento-rail.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Produção-open-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Produção-open-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Produção-open.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Produção-rail-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Produção-rail-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-Produção-rail.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pc1920-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pwa-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pwa-before.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pwa-before30.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/pwa-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet-before.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet-before30.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-Laboratório-overlay-after.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-Laboratório-overlay-preview.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-Planejamento-overlay-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-Planejamento-overlay-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-Produção-overlay-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-Produção-overlay-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet1280-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Laboratório-overlay-after.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Laboratório-overlay-preview.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Laboratório-overlay.png` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Planejamento-overlay-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Planejamento-overlay-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Planejamento-overlay.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Produção-overlay-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Produção-overlay-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-Produção-overlay.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-after.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-captures/tablet800-preview.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-model-a-030.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/menu-model-a-031.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/monitor_ricardo_access.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/montagem-taxa-before-20261008.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/new_behavior_section.md` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/patch_lab_frontend_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/patch_unificado_lab_password_20261013.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/patch_unificado_lab_source_20261013.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-active/app.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-active/bump_appjs.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-active/etiquetas-inline.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-active/pages/etiquetas/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-active/programacao-index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-dest-objects.txt` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-env-audit.sh` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-env-classify.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-label-index-live.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-label-js-live.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-live-before-label.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-live-before-sector.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-old-live-20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-origin-objects.txt` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-unificado-dashboard.png` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp-usuarios-pre-master-live.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_admin_audit.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_circular_check.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_cleanup_test_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_compare_mega_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_compare_old.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_file_aggregate.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_new_mega_20261008.csv` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_new_products_20261008.csv` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_old_mega_20261008.csv` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_old_products_20261008.csv` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_pages_labels.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_products.json` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_products_read.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_real_mega_check.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_real_mega_check_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_reimport_live_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_s34_final_check.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcp_same_file_parity_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/assets/css/pcp.css` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/assets/js/api.js` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/comparacao.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/dashboard.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/etiquetas.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/login.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/mao_de_obra.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/producao.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/programacao.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/pcpconcrefer/frontend/usuarios.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/diego-denied.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/diegobat-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/ricardo-lab.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/ricardo-users.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/setor3-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/setor4-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-captures/user-ricardo-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-code.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/diego-denied.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/diegobat-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/ricardo-lab.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/ricardo-users-failure.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/ricardo-users.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/setor3-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/setor4-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-live-captures/user-ricardo-home.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-033-static.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-034-shell.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/permissions-035-static.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/postes-api-pre-master-live.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/postes_api-live-037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/postes_db_live_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/postes_report_v2_live_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/postes_rules_live_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_nginx_permissions_test.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_nginx_stage.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_permissions_stage_assets.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_release_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_release_038.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_release_039.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prepare_remove_public_report.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/preview_shared_menu.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/probe_ricardo_access_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prod-app-1.0.6.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prod-index-1.0.6.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/prod-publish/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/producao-SC17-2026-09-29-before.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/publish-main-sw-fix-20260820/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/published-shell-utf8.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-apply-hba.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-backup-mapa.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-browser-diagnostic.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-create-lab-probe.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-create-paired-probe.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-create-pcp-admin-probe.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-create-pcp-link-probe.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-create-quality-probe.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-db-env-keys.sh` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-db-smoke.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-grant-triage-probe.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-link-pcp-probe.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-probe-inspect.sh` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-provision.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-remote-inspect.sh` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-service-inventory.sh` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-stage-hba.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-verify-db.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-verify-hba.py` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/qualidade-infra-verify-mapa-grants.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/quality_api_db_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/quality_outbox_smoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/quality_rotate_db_password.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/quality_screenshots.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/real-ricardo-users-failure.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-0.6.7.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/laboratorio/service/server/static/novo/postes/assets/novo-CSD8qSbR.js` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/laboratorio/service/server/static/novo/postes/assets/novo-Cojb7huJ.css` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/laboratorio/service/server/static/novo/postes/novo.html` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/VERSION` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/login.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/mapa/operacao/app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/mapa/operacao/index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/mapa/operacao/montagem-taxa.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/mapa/operacao/montagem-taxa.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/mapa/operacao/users-unificado.css` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/mapa/operacao/users-unificado.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/shell/router.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-037/public/unificado/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public/unificado/VERSION` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public/unificado/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public/unificado/login.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public/unificado/shell/router.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public/unificado/shell/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/release-039-public/unificado/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/remote-menu.config.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/repair_lab_labels.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/reset_alex_unified.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/reset_old_jcarlos.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/reset_ricardo_unified.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ricardo-teste-lab-032.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/runtime-audit.sh` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/screen_catalog_remote_20261022.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/service-worker.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/session_cookie_check.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/set_lab_db.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/setor3_sync_20261014.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/share-hosts.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/shared-menu-028.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/shared-menu-029.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/snapshot_master_test.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/styles.css.payload.json` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/support_r.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/sw-register.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test-dashboard-defeitos/` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_create_user_live_036.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_dt_table_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_lab_revoke.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_live_field_menus_034.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_live_grants_034.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_live_lab_users_035.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_live_user_actions_034.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_real_ricardo_create_036.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_reset_candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_ricardo_teste_admin_032.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_second_inspection_local_build.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_stage_browser_033.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_stage_nginx_guard_033.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_stage_pcp_guard_033.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_stage_pcp_user_lifecycle_033.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_stage_permissions_033.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_stage_user_lifecycle_033.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/test_standard_labels_candidate.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/ui-hotfix-037.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.1.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.2.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.3.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.4.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.5.tgz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.6-stage.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.8.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-0.6.9.tar.gz` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-index-prod-before-20261022.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unificado-index-prod-candidate-20261022.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unified-auth-before-pcporigin-live.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unified-live-app.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/unified-live-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/users-live-before-reset.css` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/users-live-before-reset.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/usina-github-index.html` | usinas | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/usuarios.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_alex_lab_038.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_final_database_034.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_formas_published.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_lab_nominals_live_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_live_037.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_live_final_034.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_mapa_montagem_20261007_live.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_mapa_published.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_mapa_s34_live.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_mapa_touch_write.py` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_master_grant_revoke_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_master_modules_20261008.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_mega_published.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_old_jcarlos_click.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_pcp_to_lab_only_20261008.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_s4_program_highlight.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/verify_unificado_master_20261013.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.codex-tmp/xlsx-hosts.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `.md` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local d2a9582b6281) |
| `.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local a0de88ff2a39) |
| `.tmp-concretrack/fechamento-index.html` | geral | C | árvore temporária |
| `.tmp-concretrack/relatorios.py` | geral | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-server.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/config/database.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/config/googleDrive.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/config/jwt.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/approvalController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/approvalController.js.bak-20260727-approval-chain` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/authController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/calibrationController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/documentController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/documentController.js.bak-20260727-document-scope` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/documentController.js.bak-20260727-version-history` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/readLogController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/readLogController.js.bak-20260727-version-readers` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/rncController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/taskController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/controllers/userController.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/middlewares/auth.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/middlewares/auth.js.bak-20260727-document-scope` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/middlewares/roles.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/approvalRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/authRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/calibrationRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/documentRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/readLogRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/rncRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/taskRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/routes/userRoutes.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/alertService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/auditService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/documentService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/documentService.js.bak-20260727-approval-chain` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/driveService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/emailService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/passwordPolicy.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/pdfService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/rbacService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/server.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/backend-src/services/storageService.js` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/docker-compose.yml` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/approvals/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/calibrations/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/dashboard/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/documents/[id]/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/documents/[id]/page.tsx.bak-20260727-version-history-log` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/documents/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/layout.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/rnc/[id]/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/rnc/new/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/rnc/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/tasks/[id]/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/tasks/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/(app)/users/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/calibrations/label/[id]/PrintButton.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/calibrations/label/[id]/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/calibrations/verify/[id]/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/change-password/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/change-password/page.tsx.bak-20260727-password-focus` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/globals.css` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/layout.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/login/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/app/page.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/ApprovalModal.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/DocumentTable.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/EditDocumentModal.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/FilterBar.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/Header.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/Sidebar.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/StatsCard.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/TaskBoard.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/TaskFilters.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/TaskModal.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/components/UploadModal.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/constants/documentMeta.ts` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/constants/rncMeta.ts` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/constants/taskMeta.ts` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/contexts/AuthContext.tsx` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/hooks/useRequireAuth.ts` | ged | C | árvore temporária |
| `.tmp_ged_fix_20260908/frontend-src/services/api.ts` | ged | C | árvore temporária |
| `.work-cec-migration/api-client.js` | qualidade | C | árvore temporária |
| `.work-cec-migration/cec-leitura-index.html` | qualidade | C | árvore temporária |
| `.work-cec-migration/legacy.js` | qualidade | C | árvore temporária |
| `.work-cec-migration/migrate_tbl_qrcp.py` | qualidade | C | árvore temporária |
| `.work-cec-migration/nginx-controle-est-concre.conf` | qualidade | C | árvore temporária |
| `.work-cec-migration/nginx-dashboard-usina.conf` | usinas | C | árvore temporária |
| `.work-cec-migration/qr-concreto-redirect.html` | qualidade | C | árvore temporária |
| `.work-cec-migration/qrcp.py` | qualidade | C | árvore temporária |
| `.work-cec-migration/rompimentos_repository.js` | qualidade | C | árvore temporária |
| `.work-consumo-cimento/consumo-agregados.html` | geral | C | árvore temporária |
| `.work-consumo-cimento/consumo-cimento-index.html` | geral | C | árvore temporária |
| `.work-consumo-cimento/entrada-index.html` | geral | C | árvore temporária |
| `.work-consumo-cimento/erp-index.html` | geral | C | árvore temporária |
| `.work-consumo-cimento/estoque-index.html` | geral | C | árvore temporária |
| `.work-consumo-cimento/estoque.py` | geral | C | árvore temporária |
| `.work-consumo-cimento/manifest.json` | geral | C | árvore temporária |
| `.work-consumo-cimento/manifest.webmanifest` | geral | C | árvore temporária |
| `.work-consumo-cimento/sw.js` | geral | C | árvore temporária |
| `.work-custos-replica/deploy-20260917-clean.tgz` | geral | C | árvore temporária |
| `.work-custos-replica/deploy-20260917.tgz` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/common/api/routers/custos.py` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/common/public/relatorios/custos/carta-slide/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/common/public/relatorios/custos/comparar/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/common/public/relatorios/custos/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/common/public/relatorios/custos/unidade-branding.js` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/concretrack-pederneiras/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/concretrack-pederneiras/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/concretrack-pederneiras/public-relatorios-index.html` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/supervisorio_noro/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/supervisorio_noro/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/supervisorio_ribe/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/deploy/supervisorio_ribe/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/source.tgz` | geral | C | árvore temporária |
| `.work-custos-replica/source/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/source/api/routers/custos.py` | geral | C | árvore temporária |
| `.work-custos-replica/source/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/source/public/relatorios/custos/carta-slide/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/source/public/relatorios/custos/comparar/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/source/public/relatorios/custos/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target.tgz` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/public/relatorios/custos/comparar/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/public/relatorios/custos/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/generate_db_map.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/install.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/status.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/concretrack-pederneiras/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/api/routers/custos.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/public/relatorios/custos/comparar/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/public/relatorios/custos/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/install.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/status.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_noro/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/api/main.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/api/routers/custos.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/api/routers/relatorios.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/public/relatorios/custos/comparar/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/public/relatorios/custos/index.html` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/install.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/status.sh` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-custos-replica/target/supervisorio_ribe/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-dashv2-volume/routes_usina.original.py` | usinas | C | árvore temporária |
| `.work-dashv2-volume/routes_usina.py` | usinas | C | árvore temporária |
| `.work-estoque-replica/deploy-20260917.tgz` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/acerto/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/consumo-cimento/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/consumo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/entrada/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/mapeamento-agregados/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/relatorio/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/saldo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/common/public/estoque/unidade-branding.js` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/noro/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/pederneiras/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/deploy/ribeirao/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source.tgz` | geral | C | árvore temporária |
| `.work-estoque-replica/source/api/ai_providers.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/api/main.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/api/security.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/api/settings.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/acerto/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/consumo-cimento/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/consumo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/entrada/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/mapeamento-agregados/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/relatorio/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/public/estoque/saldo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/install.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/status.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-estoque-replica/source/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target.tgz` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/api/ai_providers.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/api/main.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/api/security.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/api/settings.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/public/estoque/acerto/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/public/estoque/entrada/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/public/estoque/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/public/estoque/relatorio/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/public/estoque/saldo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/generate_db_map.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/install.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/status.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/concretrack-pederneiras/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/api/ai_providers.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/api/main.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/api/security.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/api/settings.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/public/estoque/acerto/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/public/estoque/entrada/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/public/estoque/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/public/estoque/relatorio/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/public/estoque/saldo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/install.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/status.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_noro/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/api/ai_providers.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/api/main.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/api/routers/estoque.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/api/security.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/api/settings.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/public/estoque/acerto/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/public/estoque/entrada/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/public/estoque/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/public/estoque/relatorio/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/public/estoque/saldo/index.html` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/deploy.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/install.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/match_massadas_setor.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/relatorio_massadas_supervisorio.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/status.sh` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/sync_consumo_producao.py` | geral | C | árvore temporária |
| `.work-estoque-replica/target/supervisorio_ribe/scripts/sync_gsheets_leiturasetor.py` | geral | C | árvore temporária |
| `.work-evolution/compose.yml` | geral | C | árvore temporária |
| `.work-evolution/concretrack-qr.png` | geral | C | árvore temporária |
| `.work-evolution/dashboard-usina` | usinas | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/app.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/assets/img/icon.png` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/assets/msgbox.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/assets/msgbox.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/bridge.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/chart.min.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/chartjs-plugin-datalabels.min.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/dashboard-defeitos-v4.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/dashboard-defeitos-v5.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/dashboard-defeitos-v5.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/data/produto-volumes.json` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/fonts/Geist-Medium.woff2` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/fonts/Geist-Regular.woff2` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/fonts/Geist-SemiBold.woff2` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/fonts/GeistMono-Medium.woff2` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/fonts/GeistMono-SemiBold.woff2` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/fonts/OFL.txt` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/index.html` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/manifest.json` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/modelos-formas.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/montagem-taxa.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/montagem-taxa.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/screen-context.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/styles.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/supabase.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/sw.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/unificado-bridge.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/unificado-bridge.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/unificado-icon.png` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/users-unificado.css` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/users-unificado.js` | mapa | C | árvore temporária |
| `.work-mapa-old-buildcheck/operacao/xlsx.full.min.js` | mapa | C | árvore temporária |
| `.work-mapa-old-github/` | mapa | C | árvore temporária |
| `.work-mapa-old-publish/` | mapa | C | árvore temporária |
| `.work-pcp-agent/agent_pcp_producao.py` | pcp | C | árvore temporária |
| `.work-pcp-agent/comparator.py` | pcp | C | árvore temporária |
| `.work-pcp-agent/concretrack_client.py` | pcp | C | árvore temporária |
| `.work-pcp-agent/config.py` | pcp | C | árvore temporária |
| `.work-pcp-agent/google_sheets_client.py` | pcp | C | árvore temporária |
| `.work-pcp-agent/html_report.py` | pcp | C | árvore temporária |
| `.work-pcp-agent/requirements.txt` | pcp | C | árvore temporária |
| `.work-pcp-agent/whatsapp_sender.py` | pcp | C | árvore temporária |
| `.work-pcp-report/alocacao_formas.py` | pcp | C | árvore temporária |
| `.work-pcp-report/alocacao_formas_model.py` | pcp | C | árvore temporária |
| `.work-pcp-report/alocacao_formas_service.py` | pcp | C | árvore temporária |
| `.work-pcp-report/app-remote.js` | pcp | C | árvore temporária |
| `.work-pcp-report/app.css` | pcp | C | árvore temporária |
| `.work-pcp-report/app.js` | pcp | C | árvore temporária |
| `.work-pcp-report/audit-postes.jsonl` | pcp | C | árvore temporária |
| `.work-pcp-report/audit_layout_models.py` | pcp | C | árvore temporária |
| `.work-pcp-report/audit_model_case.py` | pcp | C | árvore temporária |
| `.work-pcp-report/audit_model_upper.py` | pcp | C | árvore temporária |
| `.work-pcp-report/audit_postes.py` | pcp | C | árvore temporária |
| `.work-pcp-report/build_layout.py` | pcp | C | árvore temporária |
| `.work-pcp-report/build_layout_s4.py` | pcp | C | árvore temporária |
| `.work-pcp-report/bump_assets.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_data.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_forms.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_live_browser.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_live_circular.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_live_sector4.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_s4_volumes.py` | pcp | C | árvore temporária |
| `.work-pcp-report/check_sector4.py` | pcp | C | árvore temporária |
| `.work-pcp-report/concrefer-logo-alt.png` | pcp | C | árvore temporária |
| `.work-pcp-report/concrefer-logo.png` | pcp | C | árvore temporária |
| `.work-pcp-report/database.py` | pcp | C | árvore temporária |
| `.work-pcp-report/db-forms.json` | pcp | C | árvore temporária |
| `.work-pcp-report/deploy_armaduras_saque.sh` | pcp | C | árvore temporária |
| `.work-pcp-report/deploy_uppercase_models.sh` | pcp | C | árvore temporária |
| `.work-pcp-report/discover_weight_tables.py` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas-armaduras-modelos.json` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas-armaduras.html` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas-armaduras.js` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas-sc.html` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas.html` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas.js` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas_armaduras_model.py` | pcp | C | árvore temporária |
| `.work-pcp-report/etiquetas_armaduras_router.py` | pcp | C | árvore temporária |
| `.work-pcp-report/export_db_forms.py` | pcp | C | árvore temporária |
| `.work-pcp-report/export_products.py` | pcp | C | árvore temporária |
| `.work-pcp-report/export_sector4.py` | pcp | C | árvore temporária |
| `.work-pcp-report/extract_labels.py` | pcp | C | árvore temporária |
| `.work-pcp-report/finish_armaduras_saque.sh` | pcp | C | árvore temporária |
| `.work-pcp-report/import_armadura_templates.py` | pcp | C | árvore temporária |
| `.work-pcp-report/inspect_docx.py` | pcp | C | árvore temporária |
| `.work-pcp-report/inspect_docx_style.py` | pcp | C | árvore temporária |
| `.work-pcp-report/inspect_production_tables.py` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-formas-s4.json` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-formas.json` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-formas.png` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-live-s3.json` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-live-s4.json` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-uppercase-s3.json` | pcp | C | árvore temporária |
| `.work-pcp-report/layout-uppercase-s4.json` | pcp | C | árvore temporária |
| `.work-pcp-report/logo-concrefer-relatorio.png` | pcp | C | árvore temporária |
| `.work-pcp-report/main-live.py` | pcp | C | árvore temporária |
| `.work-pcp-report/main.py` | pcp | C | árvore temporária |
| `.work-pcp-report/make_s4_code.py` | pcp | C | árvore temporária |
| `.work-pcp-report/make_s4_html.py` | pcp | C | árvore temporária |
| `.work-pcp-report/make_sc_labels.py` | pcp | C | árvore temporária |
| `.work-pcp-report/make_separate_reports.py` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-live-index.html` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-live-sw.js` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-live.js` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-origin.js` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-pages-worktree/` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-publisher-index.html` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-publisher.js` | pcp | C | árvore temporária |
| `.work-pcp-report/mapa-teste-worktree/` | pcp | C | árvore temporária |
| `.work-pcp-report/mapeamento_forma_poste.py` | pcp | C | árvore temporária |
| `.work-pcp-report/migrate_circular.py` | pcp | C | árvore temporária |
| `.work-pcp-report/models-init-live.py` | pcp | C | árvore temporária |
| `.work-pcp-report/models_init.py` | pcp | C | árvore temporária |
| `.work-pcp-report/nginx-usina.conf` | usinas | C | árvore temporária |
| `.work-pcp-report/parse_armadura_docx.py` | pcp | C | árvore temporária |
| `.work-pcp-report/pcp-diario.html` | pcp | C | árvore temporária |
| `.work-pcp-report/pcp-live.py` | pcp | C | árvore temporária |
| `.work-pcp-report/pcp.py` | pcp | C | árvore temporária |
| `.work-pcp-report/prepare_report_assets.py` | pcp | C | árvore temporária |
| `.work-pcp-report/prepare_uppercase_models.py` | pcp | C | árvore temporária |
| `.work-pcp-report/preview-circular.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview-etiquetas-armaduras.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview-etiquetas-sc.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview-formas-s3.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview-formas-s4.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview-report-v2.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview.png` | pcp | C | árvore temporária |
| `.work-pcp-report/preview.py` | pcp | C | árvore temporária |
| `.work-pcp-report/preview_circular.py` | pcp | C | árvore temporária |
| `.work-pcp-report/preview_formas_v2.py` | pcp | C | árvore temporária |
| `.work-pcp-report/preview_report_v2.py` | pcp | C | árvore temporária |
| `.work-pcp-report/producao-live.py` | pcp | C | árvore temporária |
| `.work-pcp-report/producao.py` | pcp | C | árvore temporária |
| `.work-pcp-report/products-s3.json` | pcp | C | árvore temporária |
| `.work-pcp-report/produto.py` | pcp | C | árvore temporária |
| `.work-pcp-report/produtos.py` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao-alex.html` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao-circular-s3.html` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao-circular-s3.js` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao-circular-s4.html` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao-current.html` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao-formas.js` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao.html` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao_circular_s3_model.py` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao_circular_s3_router.py` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao_circular_s4_model.py` | pcp | C | árvore temporária |
| `.work-pcp-report/programacao_circular_s4_router.py` | pcp | C | árvore temporária |
| `.work-pcp-report/relatorio-current.html` | pcp | C | árvore temporária |
| `.work-pcp-report/relatorio-current.js` | pcp | C | árvore temporária |
| `.work-pcp-report/relatorio-producao.html` | pcp | C | árvore temporária |
| `.work-pcp-report/relatorio-producao.js` | pcp | C | árvore temporária |
| `.work-pcp-report/relatorio-programacao-s3.html` | pcp | C | árvore temporária |
| `.work-pcp-report/relatorio-programacao-s4.html` | pcp | C | árvore temporária |
| `.work-pcp-report/sector4-db.json` | pcp | C | árvore temporária |
| `.work-pcp-report/sheets_service.py` | pcp | C | árvore temporária |
| `.work-pcp-report/sync_layout_production.py` | pcp | C | árvore temporária |
| `.work-pcp-report/sync_mapa_publisher.py` | pcp | C | árvore temporária |
| `.work-pcp-report/sync_mapa_workspace.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_armaduras_labels.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_circular_backend.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_labels.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_live_armaduras.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_live_labels.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_live_reports.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_saque_api.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_sector4_backend.py` | pcp | C | árvore temporária |
| `.work-pcp-report/test_separate_reports.py` | pcp | C | árvore temporária |
| `.work-pcp-report/validate_uppercase_catalog.py` | pcp | C | árvore temporária |
| `.work-usinas-migration/build_lab_cec.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/carta-legado.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/cec_api.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/api-client.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/assets/img/concre.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/manifest.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/relatorio-icon.svg` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/relatorio.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/resultado-cp.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/analise/sw.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/assets/img/PRINCIPAL@2x.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/assets/img/icon-192.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/assets/img/icon-512.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/assets/img/logo.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/etiquetas/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/leitura/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/leitura/manifest.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/leitura/sw.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/relatorio/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/laboratorio/service/server/static/cec/resultados/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/mapa-api/app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/mapa-api/screen_access.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/mapa-api/screen_catalog.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/nginx/laboratorio-unificado.conf` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/public/unificado/shell/menu.config.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-deploy-tree/public/unificado/shell/router.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-git.patch` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-before/lab_app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-before/mapa_app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-before/menu.config.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-before/router.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-before/screen_access.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-before/screen_catalog.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-stage/lab_app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-stage/mapa_app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-stage/menu.config.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-stage/router.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-stage/screen_access.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-remote-stage/screen_catalog.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/package-lock.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/package.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/api/controle_estatistico.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/api/controle_estatistico_v2.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/api/legacy.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/app.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/core/analytics_cache.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/core/cache.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/core/config.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/core/database.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/core/logger.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/core/security.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/jobs/backfill.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/repositories/analytics_repository.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/repositories/rompimentos_repository.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/schemas/controle_estatistico.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/server.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/services/analytics_service.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/services/controle_estatistico_service.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/services/google_sheets_service.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/services/sheet_reconciliation_service.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/workers/analytics_worker.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec-source/src/workers/sheet_reconciliation_worker.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec_analysis.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec_db_progress.sh` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec_erp_source_20261023.tar.gz` | usinas | C | árvore temporária |
| `.work-usinas-migration/cec_source_20261023.tar.gz` | usinas | C | árvore temporária |
| `.work-usinas-migration/deploy_lab_cec.sh` | usinas | C | árvore temporária |
| `.work-usinas-migration/deploy_version.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/__init__.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/ai_providers.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/main.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/__init__.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/agregados.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/auth.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/custos.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/estoque.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/health.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/massadas.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/pcp.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/produtos.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/qrcp.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/relatorios.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/routers/tracos.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/security.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/api/settings.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cad_agregados.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cad_cartas_traco.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cadastros_home.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cec_dashboard.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cec_etiquetas.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cec_home.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cec_leitura.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cec_relatorio.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/cimento.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/est_acerto.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/est_entrada.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/est_relatorio.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/est_saldo.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/gerenciador.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/index.html.bak` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/pages/login.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/shared/footer.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/frontend/shared/header.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/img/PRINCIPAL@2x.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/img/PRINCIPALDARK@2x.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/img/icon-192.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/img/icon-512.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/img/logo-concrefer.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/img/logo.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/js/auth.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/js/auth.js.save` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/assets/js/config.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/agregados-config/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/agregados-config/manifest.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/agregados-config/sw.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/agregados/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/cartas-traco/consulta.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/cartas-traco/consulta.html.bak-20260820-080130` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/cartas-traco/detalhe.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/cartas-traco/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/cartas-traco/mapeamento/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/mapeamento-misturador/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/pcp/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/pcp/ordens/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/pcp/programacao/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cadastros/produto/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/analise/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/etiquetas/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/etiquetas/index.html.bak-20260730-094540` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/etiquetas/index.html.bak-20261008-qr-quality` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/leitura/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/leitura/manifest.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/leitura/sw.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/relatorio/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/cec/resultados/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/acerto/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/consumo-cimento/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/consumo/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/entrada/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/mapeamento-agregados/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/relatorio/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/estoque/saldo/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/handoff-pcp.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/login.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/manifest.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/mapa-aplicacao.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/cartas-traco/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/consumo/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/custos/carta-slide/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/custos/comparar/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/custos/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/exportar/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/fechamento-diario/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/fechamento-diario/index.html.bak-20261016-2118` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/fechamento/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/producao-periodo/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-08-20.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-08-21.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-08-23.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-09-08.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-09-15.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-09-18.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-09-21.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-09-23.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-09-30.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-10-01.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-10-02.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-10-12.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/generated/pcp-producao/relatorio_pcp_producao_2026-10-19.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/reports-diarios/manifest.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/relatorios/resistencias-tracos.csv` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/sw.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/test-auth.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/trocar-senha/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/public/usuarios/index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/css/theme.css` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/fonts/Gotham-Bold.woff2` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/fonts/Gotham-Book.woff2` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/img/logo-128.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/img/logo-256.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/img/logo.svg` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/js/app.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/js/auth.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/js/clock.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/css/theme.css` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/fonts/Gotham-Bold.woff2` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/fonts/Gotham-Book.woff2` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/img/logo-128.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/img/logo-256.png` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/img/logo.svg` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/js/app.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/erp-source/static/static/js/clock.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/head-usinas-index-20261023.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/http-1129394924.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/http-1685976498.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/http-527183586.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/http-71099808.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/http-992376353.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/init_cec_db.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/inspect_cec_rows.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/inspect_massadas.sh` | usinas | C | árvore temporária |
| `.work-usinas-migration/inspect_massadas_roles.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/lab-cec-release-20261023.tar.gz` | usinas | C | árvore temporária |
| `.work-usinas-migration/lab-cec-static-vendor-20261023.tar.gz` | usinas | C | árvore temporária |
| `.work-usinas-migration/legacy-api/main.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/legacy-api/routers/auth.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/legacy-api/routers/tracos.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/legacy-api/security.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/legacy-api/settings.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-VERSION-20261023` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-index-20261023.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-index.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-shell-20261023.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-shell-menu.config.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-shell-modelo-a-loader.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-shell-modelo-a-menu.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-sw-20261023.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/live-sw.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/massadas-public-shape.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/menu.live.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/new-VERSION-20261023` | usinas | C | árvore temporária |
| `.work-usinas-migration/new-index-20261023.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/new-shell-20261023.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/new-sw-20261023.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/package_lab_cec.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/patch_new_nginx_cec.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/patch_prod_bridge.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/patch_remote_cec_app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/prepare_prod_version.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/probe_massadas_access.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/prod-index-1.0.38.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/prod-index-82767632.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/prod-usinas-index-20261023.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/screen_catalog.after-20261023.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/screen_catalog.before-20261023.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/screen_catalog.live.json` | usinas | C | árvore temporária |
| `.work-usinas-migration/serve_cec_pwa.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/stage_bridge.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/stage_cec_app.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/stage_lab_cec.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/stage_version.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/stage_visibility.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/usinas-index.live.html` | usinas | C | árvore temporária |
| `.work-usinas-migration/usinas-inline-check.js` | usinas | C | árvore temporária |
| `.work-usinas-migration/validate_cec_new.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/validate_massadas_sync.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/vendorize_lab_cec.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify-1129394924.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify-1685976498.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify-845837796.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify-992376353.txt` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify_lab_cec_live.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify_label_browser.cjs` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify_massadas_new.py` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify_pwa_install.cjs` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify_reader_browser.cjs` | usinas | C | árvore temporária |
| `.work-usinas-migration/verify_visibility.cjs` | usinas | C | árvore temporária |
| `MCC_reajuste_cimento_outubro_2026.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ff77818c76e3) |
| `PedeRH/` | geral | B | arquivo removido localmente; produção requer conferência |
| `auth/ponte-dosagem.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 88990d19373e) |
| `carta-traco/docs/CARTA_TRACO_ANALISE.md` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 74a315db59c0) |
| `carta-traco/docs/carta-traco-analise.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 8207136843e3) |
| `concrejet/legacy-reference/erp-concretrack/BRAND_NOTES.md` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local de72b87a7d4f) |
| `concrejet/legacy-reference/erp-concretrack/README.md` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 5fad370b6721) |
| `concrejet/legacy-reference/erp-concretrack/apps/dashboard/dash.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 84fa8cf45f46) |
| `concrejet/legacy-reference/erp-concretrack/apps/dashboard/index.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 1f61320e8403) |
| `concrejet/legacy-reference/erp-concretrack/assets/concretrack.pdf` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2f18f9248606) |
| `concrejet/legacy-reference/erp-concretrack/assets/logo.png` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 8be0f0920e3b) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cad_agregados.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ceb3e630e710) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cad_cartas_traco.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local d68fe83958ce) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cadastros_home.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 958c0c5df980) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cec_dashboard.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local f9a0514dc9b4) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cec_etiquetas.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local dfad47eaa3ea) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cec_home.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 8cc8ffcd2c2a) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cec_leitura.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c8918193183d) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cec_relatorio.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 6116b5bb904f) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/cimento.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local f73532b32616) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/gerenciador.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 5d1eb155444b) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/index.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 9fd88855773d) |
| `concrejet/legacy-reference/erp-concretrack/frontend/pages/login.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local cae3187fc304) |
| `concrejet/legacy-reference/erp-concretrack/frontend/shared/footer.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 0fd9f439b5b5) |
| `concrejet/legacy-reference/erp-concretrack/frontend/shared/header.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 8c8cee2533ee) |
| `concrejet/legacy-reference/erp-concretrack/static/css/dashboard.css` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local b5d8c80c21ec) |
| `concrejet/legacy-reference/erp-concretrack/static/css/theme.css` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ca8f360cce64) |
| `concrejet/legacy-reference/erp-concretrack/static/fonts/Gotham-Bold.woff2` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e3b0c44298fc) |
| `concrejet/legacy-reference/erp-concretrack/static/fonts/Gotham-Book.woff2` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e3b0c44298fc) |
| `concrejet/legacy-reference/erp-concretrack/static/img/logo-128.png` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 498f3bdb891e) |
| `concrejet/legacy-reference/erp-concretrack/static/img/logo-256.png` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 8be0f0920e3b) |
| `concrejet/legacy-reference/erp-concretrack/static/img/logo.svg` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 7a2389b821da) |
| `concrejet/legacy-reference/erp-concretrack/static/js/app.js` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 1bb6b4c96865) |
| `concrejet/legacy-reference/erp-concretrack/static/js/clock.js` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 594ab45f6513) |
| `concretrack-erp.nginx.conf` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local cf943eee9cd1) |
| `current-mapa/app.js` | mapa | C | árvore temporária |
| `current-mapa/index.html` | mapa | C | árvore temporária |
| `current-mapa/sw.js` | mapa | C | árvore temporária |
| `dashboard-defeitos-v4.patch` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 261fca81ef83) |
| `dashboard-usina.nginx.conf` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 02f2aa122a43) |
| `deploy/nginx/mapa-legacy-handoff-sw.js` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 3e49deff2363) |
| `deploy/scripts/preparar_env.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 4bc36f71cac3) |
| `deploy/systemd/concretrack-dosagem-password-reset.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 39b20cdc3895) |
| `deploy/systemd/supabase-legacy-mirror-acceptance.service` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local b0dcb18ce6a8) |
| `deploy/systemd/supabase-legacy-mirror-acceptance.timer` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 51d049dcbe2f) |
| `deploy/systemd/supabase-legacy-mirror-health.service` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 75edbc9c44f9) |
| `deploy/systemd/supabase-legacy-mirror-health.timer` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 197954c9010b) |
| `deploy/systemd/supabase-legacy-mirror.service` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local d5656b8ed142) |
| `deploy/systemd/supabase-legacy-mirror.timer` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 57fe219f90b0) |
| `docs/5s/fase2-item1-permissoes.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local f597c5e72748) |
| `docs/5s/relatorio-5s.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b38cdaab96fc) |
| `docs/ambiente-homologacao-unificado.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local bd600ff5e4c4) |
| `docs/capturas-ged-pisca-teste-20261016/amostras-100ms.json` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/approvals-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/approvals-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/calibrations-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/calibrations-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/dashboard-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/dashboard-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/documents-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/documents-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-20261016/celular/page@fe880fe31e9e34c607789f36c07d67fa.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-20261016/celular/tasks-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/celular/tasks-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/approvals-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/approvals-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/calibrations-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/calibrations-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/dashboard-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/dashboard-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/documents-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/documents-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-20261016/desktop/page@e296d05a513be1491b4aa47578ed7af3.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-20261016/desktop/tasks-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-20261016/desktop/tasks-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/amostras-100ms.json` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/approvals-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/approvals-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/calibrations-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/calibrations-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/dashboard-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/dashboard-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/documents-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/documents-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/page@a7877aadec8449873c936a743b52fe5b.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/tasks-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/celular/tasks-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/approvals-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/approvals-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/calibrations-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/calibrations-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/dashboard-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/dashboard-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/documents-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/documents-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/page@3716798291f03590e6238ddf8eb45710.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/tasks-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-final-20261016/desktop/tasks-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/amostras-100ms.json` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/approvals-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/approvals-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/calibrations-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/calibrations-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/dashboard-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/dashboard-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/documents-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/documents-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/page@254a747999428ad2e62a09cb08c06c7a.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/tasks-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/celular/tasks-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/approvals-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/approvals-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/calibrations-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/calibrations-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/dashboard-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/dashboard-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/documents-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/documents-reload.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/page@8c205866060ade89ed27579062fd2f51.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/page@8cb96a02ad4786aede3be9af49bc2428.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/tasks-open.png` | ged | C | captura temporária |
| `docs/capturas-ged-pisca-teste-shell-1012-20261016/desktop/tasks-reload.png` | ged | C | captura temporária |
| `docs/capturas-inspecao-mockup-20261021/celular.png` | documentacao | C | captura temporária |
| `docs/capturas-inspecao-mockup-20261021/tablet.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/pc1366-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/pc1366-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/pc1920-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/pc1920-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/tablet1280-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/tablet1280-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/tablet800-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.30/tablet800-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/pc1366-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/pc1366-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/pc1920-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/pc1920-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/tablet1280-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/tablet1280-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/tablet800-open-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-modelo-a-0.6.31/tablet800-rail-lado-a-lado.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/mobile-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/mobile-before.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pc1366-Laboratório-open-after.png` | laboratorio | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pc1366-Laboratório-rail-after.png` | laboratorio | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pc1366-Planejamento-open-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pc1366-Planejamento-rail-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pc1920-Produção-open-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pc1920-Produção-rail-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pwa-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/pwa-before.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/tablet1280-Planejamento-overlay-after.png` | documentacao | C | captura temporária |
| `docs/capturas-menu-unificado-0.6.29/tablet800-Laboratório-overlay-after.png` | laboratorio | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-all-bottom.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-all-top.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-edit-bottom.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-edit-top.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-qualidade-editar-completa.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-qualidade-secao.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-qualidade-todas-completa.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/celular-tela-usuarios.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-all-bottom.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-all-top.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-edit-bottom.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-edit-top.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-qualidade-editar-completa.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-qualidade-secao.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-qualidade-todas-completa.png` | qualidade | C | captura temporária |
| `docs/capturas-qualidade-usuarios-teste-20261016/desktop-tela-usuarios.png` | qualidade | C | captura temporária |
| `docs/capturas-retorno-ricardo-v0510/mapa-inicio-1366x768-v0510.png` | mapa | C | captura temporária |
| `docs/capturas-retorno-ricardo-v0510/mapa-inicio-1920x1080-v0510.png` | mapa | C | captura temporária |
| `docs/capturas-ricardo-20261004/ipad-webkit-ipad-gen-7-landscape.png` | documentacao | C | captura temporária |
| `docs/capturas-ricardo-20261004/ipad-webkit-ipad-gen-7.png` | documentacao | C | captura temporária |
| `docs/capturas-ricardo-20261004/nav-fail-debug.png` | documentacao | C | captura temporária |
| `docs/certificado-qualidade/MAPEAMENTO_SISTEMA.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local ed87fd68c4ec) |
| `docs/certificado-qualidade/PROMPT_CODEX.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local ecc6f38b59fa) |
| `docs/certificado-qualidade/PROMPT_CODEX_FASE2_FONTE_NOVA.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 2caf0ff93477) |
| `docs/certificado-qualidade/README.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 017e45f2ad23) |
| `docs/certificado-qualidade/certificado-qualidade-laboratorio.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local cd4dea42d5a3) |
| `docs/certificado-qualidade/mockups/fonte/01-emitir.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 6a9d5a49e62c) |
| `docs/certificado-qualidade/mockups/fonte/02-historico.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c51ec01859cd) |
| `docs/certificado-qualidade/mockups/fonte/03-certificado-a4.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 98a8f888a6d8) |
| `docs/certificado-qualidade/mockups/png/01-emitir.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 43f7e77d1439) |
| `docs/certificado-qualidade/mockups/png/02-historico.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 33e7564b64d8) |
| `docs/certificado-qualidade/mockups/png/03-certificado-a4.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 3632c3bdf91e) |
| `docs/certificado-qualidade/mockups/png/03b-certificado-a4-poucas-linhas.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 6ebfefffe056) |
| `docs/dashboard-mockups.css` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local e520a082a26e) |
| `docs/dosagem-v2/ADENDO-4.2-RELEASE1.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f2a6c4758190) |
| `docs/dosagem-v2/ADENDO-4.3-PILOTO.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local bbc693c406f7) |
| `docs/dosagem-v2/CODEX_DOSAGEM_V2_DEFINITIVA.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d0777c692f62) |
| `docs/dosagem-v2/GATES-PILOTO.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 4fa48a1c2506) |
| `docs/dosagem-v2/GATES.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 35c71ce767f7) |
| `docs/dosagem-v2/PROJETO-COMPLETO-CODIGO-HTML-20261021.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8f4f60b41251) |
| `docs/dosagem-v2/RELATORIO-AVANCO-R1-20261021.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5f4e1be978a1) |
| `docs/dosagem-v2/RELATORIO-IMPLANTACAO-ABRAMS-20261021.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 24fbb1eb674a) |
| `docs/dosagem-v2/RELATORIO-IMPLANTACAO-R1-PARCIAL-20261021.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c237843bcef7) |
| `docs/dosagem-v2/RELATORIO-INTEGRACAO-NATIVA-20261022.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d1c01070e6fa) |
| `docs/dosagem-v2/RELATORIO-INTEGRACAO-UNIFICADO-20261022.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 31b9d4211765) |
| `docs/dosagem-v2/RELATORIO-LAYOUT-20261021.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f9238b0738e2) |
| `docs/dosagem-v2/RELATORIO-MODULOS-20261021.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 7b640558846a) |
| `docs/dosagem-v2/RELATORIO-RELEASE1-20261022.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e7d8943ede2e) |
| `docs/dosagem-v2/STATUS-PAUSA-2026-10-19.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 47af2f6badff) |
| `docs/dosagem-v2/VPS-PREPARACAO.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 48258b7321ed) |
| `docs/dosagem-v2/arquivado/CODEX_DOSAGEM_V2.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f95c235e6548) |
| `docs/dosagem-v2/arquivado/README-4.1.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 89e5cf09b190) |
| `docs/dosagem-v2/capturas/layout-publico-celular.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/layout-publico-desktop.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/login-oficial-20261022.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/nativo-unificado-20261022/empacotamento.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/nativo-unificado-20261022/visao-geral.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/nativo-unificado-20261022/volume-celular.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/nativo-unificado-20261022/volume.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/unificado-dosagem-candidate-20261022.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/capturas/unificado-dosagem-published-20261022.png` | dosagem-v2 | C | captura temporária |
| `docs/dosagem-v2/deploy/preparar-vps.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8b679886850e) |
| `docs/dosagem-v2/mockups/01-inicio-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c46b166965b5) |
| `docs/dosagem-v2/mockups/02-resultado-experimental-celular.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c52569f3a5d) |
| `docs/dosagem-v2/mockups/03-dosagem-etapa3-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 87e4daaed9a2) |
| `docs/dosagem-v2/mockups/04-granulometria-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e1efeabb3658) |
| `docs/dosagem-v2/mockups/05-carta-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8936560ddc01) |
| `docs/dosagem-v2/referencia/1.Dosagem-Udemy.xlsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local bd1bde17b589) |
| `docs/dosagem-v2/referencia/Dosagem_Concreto_Rica_v4.xlsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 1275adb7e463) |
| `docs/dosagem-v2/referencia/RECURSOS-CURVADEABRAMS-UDEMY.xlsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 696519ecef51) |
| `docs/esquema-rnc-ged-2026-10-15.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 336e43f1b31f) |
| `docs/ged-nativo/capturas/documentos-ciencia-leituras-celular.png` | ged | C | captura temporária |
| `docs/ged-nativo/capturas/documentos-ciencia-leituras-desktop.png` | ged | C | captura temporária |
| `docs/ged-nativo/capturas/documentos-detalhe-celular.png` | ged | C | captura temporária |
| `docs/ged-nativo/capturas/documentos-detalhe-desktop.png` | ged | C | captura temporária |
| `docs/ged-nativo/capturas/documentos-lista-celular.png` | ged | C | captura temporária |
| `docs/ged-nativo/capturas/documentos-lista-desktop.png` | ged | C | captura temporária |
| `docs/ged-nativo/paridade.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9936c96418b6) |
| `docs/guia-completo-dashboards-2026-10-07.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 6df950dd762e) |
| `docs/laboratorio-unificado-implantacao.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 31d2cd1841a5) |
| `docs/laboratorio/medidas-modelos-para-revisao.xlsx` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c0541aab392) |
| `docs/levantamento-montagem-defeitos-2026-10-23.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 3e1a28a0bc56) |
| `docs/maodeobra-mobile/PROMPT_CODEX.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 807246147a77) |
| `docs/maodeobra-mobile/README.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 2fbf608f0781) |
| `docs/maodeobra-mobile/capturar-etapa1.py` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local add9a355ca51) |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/desktop-aguardando.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/iphone-confirmar.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/iphone-historico-confirmado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/mobile-aguardando.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/mobile-confirmado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/mobile-confirmar.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/mobile-conflito.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-confirmacao-teste/mobile-diferencas.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/00-install-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/00-install-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/00-install-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/01-launch-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/01-launch-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/01-launch-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/02-review-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/02-review-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/02-review-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/03-sent-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/03-sent-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/03-sent-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/04-error-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/04-error-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/04-error-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/05-no-production-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/05-no-production-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/05-no-production-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/06-history-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/06-history-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1-teste/06-history-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/00-install-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/00-install-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/00-install-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/01-launch-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/01-launch-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/01-launch-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/02-review-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/02-review-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/02-review-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/03-sent-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/03-sent-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/03-sent-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/04-error-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/04-error-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/04-error-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/05-no-production-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/05-no-production-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/05-no-production-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/06-history-360.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/06-history-390.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa1/06-history-430.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/01-lancamento-android-360-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/01-lancamento-android-430-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/01-lancamento-android-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/01-lancamento-iphone-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/02-conferencia-android-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/02-conferencia-iphone-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/03-enviado-android-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/03-enviado-iphone-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/04-erro-android-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/05-sem-producao-android-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/06-historico-android-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/06-historico-iphone-emulado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-etapa3-teste/fluxo-iphone-emulado.webm` | documentacao | C | build ou captura de vídeo gerada |
| `docs/maodeobra-mobile/capturas-instalador-teste/android-aberto.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-instalador-teste/android-instalar.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-instalador-teste/iphone-aberto.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-instalador-teste/iphone-instalar.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/desktop-aguardando.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/desktop-smoke.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/mobile-aguardando.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/mobile-confirmado.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/mobile-confirmar.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/mobile-conflito.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/capturas-publicacao/mobile-diferencas.png` | documentacao | C | captura temporária |
| `docs/maodeobra-mobile/ensaio-publicacao-2026-10-17.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local ee280e55b459) |
| `docs/maodeobra-mobile/etapa-1-prototipo.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 9d03c8b30215) |
| `docs/maodeobra-mobile/etapa-2-desktop-homolog.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local bf9b49de43e9) |
| `docs/maodeobra-mobile/etapa-2-logica-comum.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 4ce0c80360dc) |
| `docs/maodeobra-mobile/etapa-3-confirmacao.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 9488a9e2dac5) |
| `docs/maodeobra-mobile/etapa-3-vista-funcional.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local fe3c8d2b4b09) |
| `docs/maodeobra-mobile/etapa-5-instalador.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 79acd74b5bb3) |
| `docs/maodeobra-mobile/maodeobra-mobile-pwa.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local af6640d28cfe) |
| `docs/maodeobra-mobile/mapeamento-api.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b97c13939825) |
| `docs/maodeobra-mobile/mockups/fonte/00-instalar.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 04a893ded46e) |
| `docs/maodeobra-mobile/mockups/fonte/01-lancamento.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b2b362d41d70) |
| `docs/maodeobra-mobile/mockups/fonte/02-conferencia.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 47dcd5b02b6b) |
| `docs/maodeobra-mobile/mockups/fonte/03-enviado.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 5a49cb92877a) |
| `docs/maodeobra-mobile/mockups/fonte/04-erro.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local c1bbbd359e54) |
| `docs/maodeobra-mobile/mockups/fonte/05-sem-producao.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 1b8819af6e81) |
| `docs/maodeobra-mobile/mockups/fonte/06-historico.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 276d4b97cb21) |
| `docs/maodeobra-mobile/mockups/png/00-instalar.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local c91877148466) |
| `docs/maodeobra-mobile/mockups/png/01-lancamento.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 8520af3875e5) |
| `docs/maodeobra-mobile/mockups/png/02-conferencia.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 27a78207d89d) |
| `docs/maodeobra-mobile/mockups/png/03-enviado.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 7b58ea29fb93) |
| `docs/maodeobra-mobile/mockups/png/04-erro.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 7e0ff4ab1e15) |
| `docs/maodeobra-mobile/mockups/png/05-sem-producao.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 77832331c5d8) |
| `docs/maodeobra-mobile/mockups/png/06-historico.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local cf4115f32883) |
| `docs/maodeobra-mobile/plano-publicacao-producao.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 120ac79bae5f) |
| `docs/mapa-ged-concretrack-2026-10-15.md` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local a9451c444430) |
| `docs/mapeamento-completo-pwa-hub-v2.pdf` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local cc76024e8865) |
| `docs/mapeamento-completo-pwa-hub.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 2be97d580000) |
| `docs/mapeamento-completo-pwa-hub.pdf` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 5588a007e5cc) |
| `docs/menu-unificado-0.6.29.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local cf3134aee0f0) |
| `docs/mockup-dashboard-concretagem-matriz.html` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 8fc2569af8e8) |
| `docs/mockup-dashboard-defeitos.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 5edc88e545bb) |
| `docs/mockup-dashboard-montagem.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 6e957f8c89c2) |
| `docs/navegacao/PROMPT_CODEX_MENU_AJUSTES.md` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local aacef286489e) |
| `docs/navegacao/PROMPT_CODEX_NAVEGACAO.md` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 8dd30adabfc6) |
| `docs/navegacao/alteracoes-nao-commitadas-raiz-20261025.txt` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 45ef3e6df9fb) |
| `docs/navegacao/capturas/celular-before-1.0.57-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-before-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-homolog-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-pederneiras.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/celular-production-after-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/celular-production-before-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/celular-production-before-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/celular-production-before-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-before-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-before-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/celular-production-before-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/celular-production-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/celular-production-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/compact-acceptance-homolog-1.0.57.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/compact-acceptance-homolog-1.0.58.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/compact-acceptance-production-1.0.57.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/compact-acceptance-production-1.0.58.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-atualizacao-sucesso-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-before-1.0.57-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-before-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-homolog-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-after-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-before-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-before-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-before-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-before-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-before-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-before-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/desktop-production-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/matrix-homolog-after.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/matrix-production-after.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/matrix-production-before.json` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-before-1.0.57-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-before-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-homolog-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-after-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-before-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-before-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-before-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-before-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-before-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-before-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-paisagem-production-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-before-1.0.57-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-before-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-homolog-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-after-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-after-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-after-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-after-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-after-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-after-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-before-ged.png` | ged | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-before-laboratorio.png` | laboratorio | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-before-planejamento.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-before-producao.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-before-qualidade.png` | qualidade | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-before-usinas.png` | usinas | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-compact-1.0.57.png` | shell | C | captura temporária |
| `docs/navegacao/capturas/tablet-retrato-production-compact-1.0.58.png` | shell | C | captura temporária |
| `docs/navegacao/causa-botao-atualizacao.md` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local f03d2b567cf8) |
| `docs/navegacao/consolidacao-branches.md` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local f65bafe594fd) |
| `docs/navegacao/estrutura-menu.md` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local f83275c822cf) |
| `docs/navegacao/menu-tree.json` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 15cded8f71bb) |
| `docs/navegacao/mockups/fonte/Atualizacao.html` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 8030f304f2f8) |
| `docs/navegacao/mockups/fonte/Main.html` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 613fb3dba976) |
| `docs/navegacao/mockups/fonte/Menu.html` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 62b9193616db) |
| `docs/navegacao/mockups/fonte/Mobile.html` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 7f6aea7a1caf) |
| `docs/navegacao/mockups/fonte/MobileMenu.html` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 0982afcfbc04) |
| `docs/navegacao/mockups/fonte/Tablet.html` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local ffbf0329d87d) |
| `docs/navegacao/mockups/png/01-desktop.png` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local df33d6f16a84) |
| `docs/navegacao/mockups/png/02-tablet.png` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 70d8efdd32fa) |
| `docs/navegacao/mockups/png/03-celular.png` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local c81cc33634d8) |
| `docs/navegacao/mockups/png/04-celular-menu.png` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local a4f44669b9a2) |
| `docs/navegacao/mockups/png/05-atualizacao-estados.png` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local b7772c9a2d24) |
| `docs/navegacao/relatorio-execucao.md` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 356b727f43bf) |
| `docs/painel-tv/analisar-codigos.py` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local fac19646d9a2) |
| `docs/painel-tv/catalogo-homologacao.csv` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 0c9e7670babb) |
| `docs/painel-tv/conferencia-homologacao.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a4b69a96f80) |
| `docs/painel-tv/descoberta.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b2c1038ec968) |
| `docs/painel-tv/diagnostico-campinas-2026-10-16.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local ba85140fd9b3) |
| `docs/painel-tv/evidencias/campinas-16-10-setor4-producao.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 8c5665771455) |
| `docs/painel-tv/evidencias/campinas-16-10-setor4-teste.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local a9eace3aaa18) |
| `docs/painel-tv/evidencias/campinas-16-10-visao-geral-producao.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 557048d9be46) |
| `docs/painel-tv/evidencias/campinas-16-10-visao-geral-teste.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 5b1a793d56cb) |
| `docs/painel-tv/evidencias/setor-1-1920x1080.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 1c81bf0e5810) |
| `docs/painel-tv/evidencias/visao-geral-1920x1080.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 344974d737a9) |
| `docs/painel-tv/mockup-painel-formas.html` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local ea0261054661) |
| `docs/painel-tv/publicacao-2026-10-16.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local fed1911ae9aa) |
| `docs/plano-dashboard-concretagem-matriz-2026-10-23.md` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 2e70226a304b) |
| `docs/plano-remocao-supabase-unificado.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local be97c24e3e84) |
| `docs/porting/capturas-ged-layout-20261015/ged-calibracoes-celular.png` | ged | C | captura temporária |
| `docs/porting/capturas-ged-layout-20261015/ged-calibracoes-desktop.png` | ged | C | captura temporária |
| `docs/porting/capturas-ged-layout-20261015/ged-documentos-celular.png` | ged | C | captura temporária |
| `docs/porting/capturas-ged-layout-20261015/ged-documentos-desktop.png` | ged | C | captura temporária |
| `docs/porting/capturas-ged-layout-20261015/ged-painel-celular.png` | ged | C | captura temporária |
| `docs/porting/capturas-ged-layout-20261015/ged-painel-desktop.png` | ged | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/README.md` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-abertura-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-abertura-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-abertura-rapida-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-abertura-rapida-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-cadastros-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-cadastros-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-painel-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-painel-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-tratativa-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/after-tratativa-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-abertura-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-abertura-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-cadastros-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-cadastros-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-painel-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-painel-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-tratativa-celular.png` | qualidade | C | captura temporária |
| `docs/porting/capturas-qualidade-20261015/before-tratativa-desktop.png` | qualidade | C | captura temporária |
| `docs/porting/cronoanalise/capturas-T6b/joaog-menu-diagnostico.png` | documentacao | C | captura temporária |
| `docs/porting/cronoanalise/capturas-T6b/users-editor-joaog-diagnostico.png` | documentacao | C | captura temporária |
| `docs/porting/cronoanalise/integracao/confere-usuario-producao.py` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 112b7c9ea226) |
| `docs/porting/ged-sem-pisca-prod-20261016/amostras-100ms.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9c070967061a) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/approvals-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 3604cec37db6) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/approvals-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a9d7d8d1f289) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/calibrations-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 87dc04860008) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/calibrations-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 01a401f843bc) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/dashboard-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 465bd8a6b149) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/dashboard-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7ee721624d33) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/documents-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d44849e4ad2e) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/documents-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local f6d073322e5e) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/tasks-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 1626756d2fc0) |
| `docs/porting/ged-sem-pisca-prod-20261016/celular/tasks-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fd898c9b048f) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/approvals-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ef1a0df812f6) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/approvals-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ef1a0df812f6) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/calibrations-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5cc14963e4c9) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/calibrations-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5cc14963e4c9) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/dashboard-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 095bc02ac2f9) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/dashboard-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 095bc02ac2f9) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/documents-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ca52b14bf544) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/documents-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ca52b14bf544) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/ged-abertura-e-reload.webm` | ged | C | build ou captura de vídeo gerada |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/tasks-open.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d299e316ba78) |
| `docs/porting/ged-sem-pisca-prod-20261016/desktop/tasks-reload.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d299e316ba78) |
| `docs/porting/ged/00-esquema-rnc-ged.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 336e43f1b31f) |
| `docs/porting/ged/00-mapa-tecnico-ged.md` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local a9451c444430) |
| `docs/porting/ged/A0-revalidacao.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7dfd12fdc360) |
| `docs/porting/ged/A1-backup.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 8d107212ed4e) |
| `docs/porting/ged/A1-segunda-protecao-preparo.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a5daa48ef282) |
| `docs/porting/ged/A2-ambiente-isolado.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 1e1b0c1bc94c) |
| `docs/porting/ged/A3-prefixo.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 72265d7a48e8) |
| `docs/porting/ged/A4-seguranca.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 3ac36abfc0ef) |
| `docs/porting/ged/A5-ensaio.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local adb4195ec6e6) |
| `docs/porting/ged/A6-execucao-2026-10-15.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 56edb8a2bb78) |
| `docs/porting/ged/A6-ged-2026-10-15.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a28b7f7cf712) |
| `docs/porting/ged/A6-runbook-preparado.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ea0e95d25df) |
| `docs/porting/ged/A7-backup-diario.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e869f46a47c7) |
| `docs/porting/ged/C1-campinas-ensaio-result.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c0e2cfec2f1d) |
| `docs/porting/ged/C1-ensaio.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local eef67f9f070c) |
| `docs/porting/ged/C1-mapa-confirmado.json` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 429a8215111c) |
| `docs/porting/ged/C1-mapa-ensaio-provisorio.json` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 3b49e47c5a15) |
| `docs/porting/ged/C1-oficial-2026-10-15.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9d0be461cce4) |
| `docs/porting/ged/C2-preparo.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 51b79180f27d) |
| `docs/porting/ged/a5-warning-diagnostic-redacted.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ea113c22059a) |
| `docs/porting/ged/a5-warning-timeout-redacted.png` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ea113c22059a) |
| `docs/porting/ged/lote3-pacote-preparado.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a9f96a944520) |
| `docs/porting/ged/menu-shell-window.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 00e011e060fa) |
| `docs/porting/ged/paridade.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 13fd11902d67) |
| `docs/porting/laboratorio/insumos.zip` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local a4ce2d9c447f) |
| `docs/porting/laboratorio/insumos/ESCOPO.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local baf929f235c8) |
| `docs/porting/laboratorio/insumos/EVIDENCIA_TESTES.txt` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 50a521ece8ed) |
| `docs/porting/laboratorio/insumos/PROMPT_CODEX.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local bcf3a104cfd6) |
| `docs/porting/laboratorio/insumos/README.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 41eb313dfea9) |
| `docs/porting/laboratorio/insumos/REVISAO_CALCULOS.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 42e45da66670) |
| `docs/porting/laboratorio/insumos/mockups/Consulta.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local ee959fa5a59a) |
| `docs/porting/laboratorio/insumos/mockups/Editor.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 5cc159b73dfe) |
| `docs/porting/laboratorio/insumos/mockups/EntradaNF.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local f110206f3444) |
| `docs/porting/laboratorio/insumos/mockups/LEIA-ME.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 23af03c2942d) |
| `docs/porting/laboratorio/insumos/mockups/Main.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 10a3d5138a32) |
| `docs/porting/laboratorio/insumos/mockups/Materiais.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local c07503ff1a72) |
| `docs/porting/laboratorio/insumos/mockups/Resumo.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 1784839922b1) |
| `docs/porting/laboratorio/insumos/mockups/Saldo.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local bc206b031fc2) |
| `docs/porting/laboratorio/insumos/mockups/TeoricoReal.dc.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 611e3e1b7529) |
| `docs/porting/laboratorio/insumos/pacote/api/__init__.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local e3b0c44298fc) |
| `docs/porting/laboratorio/insumos/pacote/api/carta_traco_api.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local d231a6324896) |
| `docs/porting/laboratorio/insumos/pacote/api/deps.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 1fc93ed36e4d) |
| `docs/porting/laboratorio/insumos/pacote/api/estoque_api.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local cb656cc691e1) |
| `docs/porting/laboratorio/insumos/pacote/api/estoque_calculos.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local a579fed001ca) |
| `docs/porting/laboratorio/insumos/pacote/api/nf_leitura.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 9904349c9812) |
| `docs/porting/laboratorio/insumos/pacote/carga/baixar_planilha.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 899c6e125b20) |
| `docs/porting/laboratorio/insumos/pacote/carga/importar_sheets.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 43bf4aa5d88d) |
| `docs/porting/laboratorio/insumos/pacote/carga/mapa_materiais.exemplo.csv` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 7cadfa731a09) |
| `docs/porting/laboratorio/insumos/pacote/infra/insumos.env.exemplo` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local cf082137e633) |
| `docs/porting/laboratorio/insumos/pacote/infra/lab-estoque-consumo.service` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local dc6b389dc9dc) |
| `docs/porting/laboratorio/insumos/pacote/infra/lab-estoque-consumo.timer` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 42ecfae14208) |
| `docs/porting/laboratorio/insumos/pacote/infra/lab-insumos-espelho.service` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local d8e64635dd26) |
| `docs/porting/laboratorio/insumos/pacote/infra/lab-insumos-espelho.timer` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 50a78863951d) |
| `docs/porting/laboratorio/insumos/pacote/requirements.txt` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 0c37abc7295e) |
| `docs/porting/laboratorio/insumos/pacote/tests/README.md` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local d95f0e7f19a8) |
| `docs/porting/laboratorio/insumos/pacote/tests/conftest.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 832744cb9441) |
| `docs/porting/laboratorio/insumos/pacote/tests/gerar_planilha_exemplo.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 817bb427d599) |
| `docs/porting/laboratorio/insumos/pacote/tests/test_calculos.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 11b32c94bcfa) |
| `docs/porting/laboratorio/insumos/pacote/tests/test_carta_traco.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local f9ee8103826f) |
| `docs/porting/laboratorio/insumos/pacote/tests/test_estoque.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 0f9d02bd397e) |
| `docs/porting/maodeobra-grupos/cadastro-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 4e2d21cb830d) |
| `docs/porting/maodeobra-grupos/s12-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 9e057ca47582) |
| `docs/porting/maodeobra-grupos/s34-celular-topo.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ff121829197) |
| `docs/porting/maodeobra-grupos/s34-celular-total.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 326423de8a56) |
| `docs/porting/maodeobra-grupos/s34-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 8fb6585bc8f5) |
| `docs/porting/menu-lateral-modelo-a-evidencias/celular-antes.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 83e05ff99b49) |
| `docs/porting/menu-lateral-modelo-a-evidencias/celular-depois.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local e50296c066ad) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pc-aberto-laboratorio.png` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 103c7ee73c19) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pc-planejamento-para-producao.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local a4f8219ad3be) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pc-recolhido-dica.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 04277d71aad0) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pc-recolhido.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local f4c92f9655de) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pc-rolagem.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 3afce834b3d9) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pc-seletor.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local f42cdd6ab086) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pwa-antes.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 83e05ff99b49) |
| `docs/porting/menu-lateral-modelo-a-evidencias/pwa-depois.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local e50296c066ad) |
| `docs/porting/menu-lateral-modelo-a-evidencias/resultado.json` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 2ff97547ac80) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-paisagem-aberto-laboratorio.png` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local c368a030fff6) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-paisagem-planejamento-para-producao.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local fb5bf55c0aee) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-paisagem-recolhido.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local f884598678b0) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-paisagem-rolagem.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 37dd11033de5) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-paisagem-seletor.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 12f5a60b6da6) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-retrato-aberto-laboratorio.png` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local f0f5fdb1b62b) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-retrato-planejamento-para-producao.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 330df7d7d9e3) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-retrato-recolhido.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 0eddbb5c2112) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-retrato-rolagem.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 04f3a5ca0410) |
| `docs/porting/menu-lateral-modelo-a-evidencias/tablet-retrato-seletor.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 1b84b1a26b98) |
| `docs/porting/producao-pederneiras/00-mapeamento.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 4fb745bcdacb) |
| `docs/porting/producao-pederneiras/01-menu.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 87b4ff4e5f69) |
| `docs/porting/producao-pederneiras/02-migrations.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 713a73893c61) |
| `docs/porting/producao-pederneiras/03-seed.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 607b9b072642) |
| `docs/porting/producao-pederneiras/04-api.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b8d4f068dc56) |
| `docs/porting/producao-pederneiras/05-cadastro.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 64eb3eedf092) |
| `docs/porting/producao-pederneiras/06-apontamento-desktop.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local abfa0cfab2a5) |
| `docs/porting/producao-pederneiras/07-mao-de-obra-desktop.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 49d9266da5cc) |
| `docs/porting/producao-pederneiras/08-mensal.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 52c7eb9c8d27) |
| `docs/porting/producao-pederneiras/09-pwa-producao.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 8cd44d9f71e1) |
| `docs/porting/producao-pederneiras/10-pwa-mao-de-obra.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 98e99039ad30) |
| `docs/porting/producao-pederneiras/11-paridade.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 24fc2342f492) |
| `docs/porting/producao-pederneiras/12-e2e-deploy.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 3948e29a241e) |
| `docs/porting/producao-pederneiras/PROMPT_CODEX_Producao_Pederneiras.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b90fd2d1135b) |
| `docs/porting/producao-pederneiras/prints/05-cadastro-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b0705153ca33) |
| `docs/porting/producao-pederneiras/prints/06-apontamento-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local e02efbf41c9e) |
| `docs/porting/producao-pederneiras/prints/07-mao-de-obra-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 3c253a54fb5d) |
| `docs/porting/producao-pederneiras/prints/08-lt-pro-04-exemplo.pdf` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 9e1c701d422d) |
| `docs/porting/producao-pederneiras/prints/08-mensal-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 26c69b6fcb56) |
| `docs/porting/producao-pederneiras/prints/09-pwa-producao-mobile.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local ab0cb6e81603) |
| `docs/porting/producao-pederneiras/prints/10-pwa-mao-de-obra-mobile.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b46aa00db325) |
| `docs/porting/producao-pederneiras/prints/menu-desktop.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 21d8103e9839) |
| `docs/porting/producao-pederneiras/prints/menu-tablet.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b075f3349174) |
| `docs/porting/producao-pederneiras/seed/paridade_pdf_outubro_2026.csv` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b2d96adaa137) |
| `docs/porting/producao-pederneiras/seed/seed_produtos_pederneiras.csv` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local f0b738f79a09) |
| `docs/porting/supabase/00-inventario.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local b471df722984) |
| `docs/porting/supabase/01-sync-continuo.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 83426ab2ad7c) |
| `docs/porting/supabase/02-preparacao-reconciliacao.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local e01281f5074f) |
| `docs/porting/supabase/03-corte-mapa-legado.md` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 5b8534dc0820) |
| `docs/porting/usinas/00-resumo-executivo.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local cc7a1b123871) |
| `docs/porting/usinas/01-infraestrutura.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local fd328ea771b9) |
| `docs/porting/usinas/02-backend-rotas.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local cde300be2ad2) |
| `docs/porting/usinas/03-frontend-telas.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c3ecdab5c23) |
| `docs/porting/usinas/04-banco-de-dados.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6a2ed8c4b0e0) |
| `docs/porting/usinas/05-integracoes.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 587bfea6de51) |
| `docs/porting/usinas/06-matriz-paridade.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 1b8400430b5b) |
| `docs/porting/usinas/07-plano-migracao.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local fcc8b65dd85c) |
| `docs/porting/usinas/estoque/CONTROLE-DE-ESTOQUE.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local df22bbffd796) |
| `docs/porting/usinas/estoque/capturas/acerto.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/consumo-agregados.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/consumo-cimento.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/entrada.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/inicio.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/mapeamento-caixas.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/relatorio.png` | usinas | C | captura temporária |
| `docs/porting/usinas/estoque/capturas/saldo.png` | usinas | C | captura temporária |
| `docs/porting/usinas/execucao/API-LEGADA-TRACOS-CAMPINAS-20261022.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6bd460bf21e1) |
| `docs/porting/usinas/execucao/DEPLOY-LEITURA-20261022.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 1a2bf25e7c7b) |
| `docs/porting/usinas/execucao/RELATORIOS-CUSTOS-20261025.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 596343cc8a94) |
| `docs/porting/usinas/execucao/fases/00-indice.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6bb17e839d64) |
| `docs/porting/usinas/execucao/fases/U01-escritores.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local c4580f99ad26) |
| `docs/porting/usinas/execucao/fases/U02-mapeamento.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6fa4fb18b8aa) |
| `docs/porting/usinas/execucao/fases/U03-esquema.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 8f663a386c92) |
| `docs/porting/usinas/execucao/fases/U04-sincronizacao.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 9bc17b1bf97e) |
| `docs/porting/usinas/execucao/fases/U05-reconciliacao.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local b618294b19b8) |
| `docs/porting/usinas/execucao/fases/U06-interface.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local e59b54fae93c) |
| `docs/porting/usinas/execucao/fases/U07-aprovacao-edicao.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 1dce0d4b5fcf) |
| `docs/porting/usinas/execucao/fases/U08-outbox.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local b5833e7c6d24) |
| `docs/porting/usinas/execucao/fases/U09-autenticacao-conflito.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 0622122000f1) |
| `docs/porting/usinas/execucao/fases/U10-testes-escrita.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local e3a97ecc62df) |
| `docs/porting/usinas/execucao/fases/U11-ativacao.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local d921bcf07e60) |
| `docs/porting/usinas/execucao/fases/U12-expansao.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 1d5329a78c89) |
| `docs/porting/usinas/execucao/fases/captura-U06-impressao-sintetica.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 1b0e4eaf26a6) |
| `docs/porting/usinas/execucao/fases/captura-U06-sintetica.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local ec65afa8cd3c) |
| `docs/porting/usinas/execucao/write-through-evidencia.md` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 645868b668f1) |
| `docs/porting/usinas/integracoes-inventario.json` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local c74d29498ebf) |
| `docs/porting/usinas/mapeamento-usinas.html` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 5dc0a8c21e9c) |
| `docs/porting/usinas/rotas-inventario.json` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 04789fccda16) |
| `docs/porting/usinas/rotas-pederneiras.json` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 80ef0a48b7bd) |
| `docs/porting/usinas/schemas/concrefer_db-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local b43612c00ced) |
| `docs/porting/usinas/schemas/concrefer_db-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local b43612c00ced) |
| `docs/porting/usinas/schemas/concrefer_db-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local b43612c00ced) |
| `docs/porting/usinas/schemas/controle_est_concre_db-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 21bdb9d8a132) |
| `docs/porting/usinas/schemas/controle_est_concre_db-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 0d4836385177) |
| `docs/porting/usinas/schemas/controle_est_concre_db-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 3f0b54d93e7a) |
| `docs/porting/usinas/schemas/pcp_armaduras-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 9ea07c2d7776) |
| `docs/porting/usinas/schemas/pcp_armaduras-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local f823eb1c5735) |
| `docs/porting/usinas/schemas/pcp_armaduras-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 9cf7ddc95ae0) |
| `docs/porting/usinas/schemas/pcp_concrefer-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 9b020652b546) |
| `docs/porting/usinas/schemas/pcp_concrefer-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 8e23ec54b409) |
| `docs/porting/usinas/schemas/pcp_concrefer-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local cedaff47654e) |
| `docs/porting/usinas/schemas/pcpconcrefer_db-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local ac8243ef6064) |
| `docs/porting/usinas/schemas/pcpconcrefer_db-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local c975e62a1359) |
| `docs/porting/usinas/schemas/pcpconcrefer_db-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local e78b01ab83fd) |
| `docs/porting/usinas/schemas/supervisorio_db-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local f98f244d90d7) |
| `docs/porting/usinas/schemas/supervisorio_db-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 8b0637e1bc01) |
| `docs/porting/usinas/schemas/supervisorio_db-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 89d6fbc46cd6) |
| `docs/porting/usinas/schemas/supervisorio_db_pede-contagens.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local f4c5a4af706c) |
| `docs/porting/usinas/schemas/supervisorio_db_pede-datas.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 88b8a553333e) |
| `docs/porting/usinas/schemas/supervisorio_db_pede-volumes.txt` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 648bb4d56b4f) |
| `docs/porting/usinas/tabelas-uso.json` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 17fbb8146f4e) |
| `docs/porting/usinas/telas-inventario.json` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local a919aa2c47f3) |
| `docs/porting/usinas/telas/cartas-traco-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6077ea381308) |
| `docs/porting/usinas/telas/cartas-traco-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 1b41e485e2a9) |
| `docs/porting/usinas/telas/cec-analise-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 44f7000a7bd7) |
| `docs/porting/usinas/telas/cec-analise-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 58a17005c610) |
| `docs/porting/usinas/telas/cec-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 758fcf289898) |
| `docs/porting/usinas/telas/cec-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 69fc8ef4932c) |
| `docs/porting/usinas/telas/dashboard-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local d29e229e406d) |
| `docs/porting/usinas/telas/dashboard-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 075cdb1fe0cc) |
| `docs/porting/usinas/telas/entrada-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 2241e3031ff8) |
| `docs/porting/usinas/telas/entrada-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 4715f82e723a) |
| `docs/porting/usinas/telas/estoque-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local eb0002308971) |
| `docs/porting/usinas/telas/estoque-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local d47829f3a163) |
| `docs/porting/usinas/telas/fechamento-diario-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local a9ba55f5dbfc) |
| `docs/porting/usinas/telas/fechamento-diario-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 8548e3a2c031) |
| `docs/porting/usinas/telas/login-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local de7c4c6128f5) |
| `docs/porting/usinas/telas/login-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local a5e0bdc4f9ce) |
| `docs/porting/usinas/telas/painel-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 685ba93d0a42) |
| `docs/porting/usinas/telas/painel-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 965e9cae50d0) |
| `docs/porting/usinas/telas/pcp-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local ba6881af9a32) |
| `docs/porting/usinas/telas/pcp-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 2884c94bd38a) |
| `docs/porting/usinas/telas/producao-periodo-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 752c70b5cf63) |
| `docs/porting/usinas/telas/producao-periodo-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 936edaf5473f) |
| `docs/porting/usinas/telas/relatorios-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 7ff7483f8c79) |
| `docs/porting/usinas/telas/relatorios-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local ef6183901e9d) |
| `docs/porting/usinas/telas/usuarios-desktop.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 94c0b3f19702) |
| `docs/porting/usinas/telas/usuarios-tablet.png` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local a9bccfd314f8) |
| `docs/qualidade/B0-stack.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 5fdee392966d) |
| `docs/qualidade/B1-action-catalog-proposto.json` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local a477ead36eba) |
| `docs/qualidade/B1-cobertura-rnc.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c4275195450d) |
| `docs/qualidade/B1-ddl-acoes-proposto.sql` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local aeed0b94f8a0) |
| `docs/qualidade/B1-ddl-proposto.sql` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 2a6a65fe937e) |
| `docs/qualidade/B1-modelo.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local a8e7e1230318) |
| `docs/qualidade/B1-provisionamento-proposto.sql` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 759bdeb39ceb) |
| `docs/qualidade/B2-api.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 757dee2a9364) |
| `docs/qualidade/B2-openapi.json` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 86ac6ce7d137) |
| `docs/qualidade/B3-telas.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local a34ea8fd3c95) |
| `docs/qualidade/B4-integracoes.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 83c7b35c27eb) |
| `docs/qualidade/B5-ensaio.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local f41b969c2e32) |
| `docs/qualidade/capturas-b3/abertura-mobile.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-b3/abertura.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-b3/painel.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-b3/tratativa.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-b4/abertura-apos-rollback.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-b4/diagnostico-api-login-apos-rollback.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-fl-sgq-07-20261016/celular-abertura.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-fl-sgq-07-20261016/celular-tratativa.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-fl-sgq-07-20261016/desktop-abertura.png` | qualidade | C | captura temporária |
| `docs/qualidade/capturas-fl-sgq-07-20261016/desktop-tratativa.png` | qualidade | C | captura temporária |
| `docs/qualidade/home-cabecalho-compacto.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local cc05a417d656) |
| `docs/qualidade/home-cabecalho-compacto/antes-1024.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local b145b2a35f8f) |
| `docs/qualidade/home-cabecalho-compacto/antes-1366-fallback.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c65f884f2da8) |
| `docs/qualidade/home-cabecalho-compacto/antes-1366.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c65f884f2da8) |
| `docs/qualidade/home-cabecalho-compacto/antes-1920.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 04c3abb753d0) |
| `docs/qualidade/home-cabecalho-compacto/depois-1024.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local ccff79fa0492) |
| `docs/qualidade/home-cabecalho-compacto/depois-1366-fallback.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local fff374d6dc9b) |
| `docs/qualidade/home-cabecalho-compacto/depois-1366.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 6ac6a4f3d4ac) |
| `docs/qualidade/home-cabecalho-compacto/depois-1920.png` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 71ac5ff1c423) |
| `docs/qualidade/homologacao-fl-sgq-07-2026-10-16.md` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 695678c5c5b5) |
| `docs/qualidade/mockups/Abertura.dc.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 4fd25105d859) |
| `docs/qualidade/mockups/Main.dc.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 597b724b48d7) |
| `docs/qualidade/mockups/Mobile.dc.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 09da2457a0d9) |
| `docs/qualidade/mockups/Tratativa.dc.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local a2785e851c87) |
| `docs/qualidade/modelos/FL-SGQ-07_RNC-Formulario_referencia.pdf` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local e960bd3afb73) |
| `docs/qualidade/porting/ged/00-esquema-rnc-ged.md` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 336e43f1b31f) |
| `docs/qualidade/porting/ged/00-mapa-tecnico-ged.md` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local a9451c444430) |
| `docs/quality-editor-test-preview.png` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local ff4a322b274c) |
| `docs/refatoracao-indicadores-concretagem.md` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local e1cbcbb298bb) |
| `docs/referencia-laboratorio/DashConcretagem (1).html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 3e4f2fbcda07) |
| `docs/referencia-laboratorio/DashDefeitos (1).html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 132d888adf26) |
| `docs/referencia-laboratorio/DashMontagem (1).html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 06e23b00f735) |
| `docs/referencia-laboratorio/LabAbsorcao.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local bb79da79bb5d) |
| `docs/referencia-laboratorio/LabEnsaio.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a68ec98cfe9) |
| `docs/referencia-laboratorio/LabMonitoramento.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 1e8e2dbb548f) |
| `docs/referencia-laboratorio/MenuModeloA.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 0524c37e5c78) |
| `docs/validacao-pcp/Gd_FUP (79).xls` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7eefda1ca2f8) |
| `docs/virada-unificado-2026-10-08.md` | documentacao | B | sem equivalente no escopo vivo da VPS (SHA256 local 9fefd4eb7e88) |
| `dosagem-concreto-v2/api/Dockerfile.hml` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 1119547cdd6f) |
| `dosagem-concreto-v2/api/app/auth_session.py` | dosagem-v2 | A | igual a dosagem-native/api/app/auth_session.py (SHA256 normalizado c638cc7d986f) |
| `dosagem-concreto-v2/api/app/bootstrap_admin.py` | dosagem-v2 | A | igual a dosagem-native/api/app/bootstrap_admin.py (SHA256 normalizado 673f53fd12da) |
| `dosagem-concreto-v2/api/app/calc/__init__.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/__init__.py (SHA256 normalizado bf64a710bc00) |
| `dosagem-concreto-v2/api/app/calc/adjustment41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/adjustment41.py (SHA256 normalizado f67e78952d26) |
| `dosagem-concreto-v2/api/app/calc/alternative41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/alternative41.py (SHA256 normalizado 11832c4a73e9) |
| `dosagem-concreto-v2/api/app/calc/curves41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/curves41.py (SHA256 normalizado 66a88578247d) |
| `dosagem-concreto-v2/api/app/calc/moisture41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/moisture41.py (SHA256 normalizado 70bc085926f2) |
| `dosagem-concreto-v2/api/app/calc/norms41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/norms41.py (SHA256 normalizado 55f75d77d69f) |
| `dosagem-concreto-v2/api/app/calc/optimization41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/optimization41.py (SHA256 normalizado b12c767775d3) |
| `dosagem-concreto-v2/api/app/calc/parity41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/parity41.py (SHA256 normalizado 79a05947a962) |
| `dosagem-concreto-v2/api/app/calc/principal41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/principal41.py (SHA256 normalizado 7938092b8f66) |
| `dosagem-concreto-v2/api/app/calc/regression41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/regression41.py (SHA256 normalizado 2b1cb60fd7be) |
| `dosagem-concreto-v2/api/app/calc/traco41.py` | dosagem-v2 | A | igual a dosagem-native/api/app/calc/traco41.py (SHA256 normalizado c560be923140) |
| `dosagem-concreto-v2/api/app/hml_seed.py` | dosagem-v2 | A | igual a dosagem-native/api/app/hml_seed.py (SHA256 normalizado 3c8ff02fe446) |
| `dosagem-concreto-v2/api/app/provision_local_admin.py` | dosagem-v2 | A | igual a dosagem-native/api/app/provision_local_admin.py (SHA256 normalizado 97f5fb54a475) |
| `dosagem-concreto-v2/api/app/reset_local_password.py` | dosagem-v2 | A | igual a dosagem-native/api/app/reset_local_password.py (SHA256 normalizado 19b6772827d4) |
| `dosagem-concreto-v2/api/app/unified_gateway.py` | dosagem-v2 | A | igual a dosagem-native/api/app/unified_gateway.py (SHA256 normalizado d94108ee2305) |
| `dosagem-concreto-v2/api/migrations/versions/20261018_02_snapshot.py` | dosagem-v2 | A | igual a dosagem-native/api/migrations/versions/20261018_02_snapshot.py (SHA256 normalizado c7ffbaf85f21) |
| `dosagem-concreto-v2/api/migrations/versions/20261018_03_auth.py` | dosagem-v2 | A | igual a dosagem-native/api/migrations/versions/20261018_03_auth.py (SHA256 normalizado ac4071ad0e60) |
| `dosagem-concreto-v2/api/migrations/versions/20261018_04_piloto.py` | dosagem-v2 | A | igual a dosagem-native/api/migrations/versions/20261018_04_piloto.py (SHA256 normalizado 2d11cf571d6e) |
| `dosagem-concreto-v2/api/tests/core/test_core_cases.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c5b077325657) |
| `dosagem-concreto-v2/api/tests/test_adjustment41_golden.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 58d4c4b039d1) |
| `dosagem-concreto-v2/api/tests/test_alternative41_golden.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local ac5757611bed) |
| `dosagem-concreto-v2/api/tests/test_approval41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d55aacaf9c08) |
| `dosagem-concreto-v2/api/tests/test_auth_session41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ebbda74f838) |
| `dosagem-concreto-v2/api/tests/test_batch41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e036b1e69162) |
| `dosagem-concreto-v2/api/tests/test_caa41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8520e340302d) |
| `dosagem-concreto-v2/api/tests/test_curves41_golden.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c6439ec7645b) |
| `dosagem-concreto-v2/api/tests/test_importacao_release1.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8819d2e79644) |
| `dosagem-concreto-v2/api/tests/test_migration_guard41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8e154874fbdc) |
| `dosagem-concreto-v2/api/tests/test_moisture41_golden.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 33d765591a92) |
| `dosagem-concreto-v2/api/tests/test_n_minus_one41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local efbe1c07d7ae) |
| `dosagem-concreto-v2/api/tests/test_pilot43.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a4376315dbf5) |
| `dosagem-concreto-v2/api/tests/test_plan41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a8a034daeacb) |
| `dosagem-concreto-v2/api/tests/test_principal41_golden.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 13f9e451e3ac) |
| `dosagem-concreto-v2/api/tests/test_rollback41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local ebdb176d7af2) |
| `dosagem-concreto-v2/api/tests/test_rules41_golden.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c94b825d0d89) |
| `dosagem-concreto-v2/api/tests/test_s1_impact41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c69ab7073b86) |
| `dosagem-concreto-v2/api/tests/test_summary41.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local beca070fd82a) |
| `dosagem-concreto-v2/api/tests/test_unified_gateway.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 95b6d203c73e) |
| `dosagem-concreto-v2/api/vendor/_argon2_cffi_bindings/__init__.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/_argon2_cffi_bindings/_ffi.abi3.so` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/_cffi_backend.cpython-312-x86_64-linux-gnu.so` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/__init__.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/__main__.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/_legacy.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/_password_hasher.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/_utils.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/exceptions.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/low_level.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/profiles.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/argon2/py.typed` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/__init__.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/_cffi_errors.h` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/_cffi_gen_src.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/_cffi_include.h` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/_embedding.h` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/_imp_emulation.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/_shimmed_dist_utils.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/api.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/backend_ctypes.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/cffi_opcode.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/commontypes.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/cparser.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/error.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/ffiplatform.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/gen_src.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/lock.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/model.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/parse_c_type.h` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/pkgconfig.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/recompiler.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/setuptools_ext.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/vengine_cpy.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/vengine_gen.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/cffi/verifier.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/__init__.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/_ast_gen.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/_c_ast.cfg` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/ast_transforms.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/c_ast.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/c_generator.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/c_lexer.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/api/vendor/pycparser/c_parser.py` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/deploy/hml/Dockerfile.nginx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 64453420dfe7) |
| `dosagem-concreto-v2/deploy/hml/nginx.conf` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 3d5bb5202e14) |
| `dosagem-concreto-v2/deploy/hml/supabase_mock.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 28797dafc671) |
| `dosagem-concreto-v2/deploy/nginx/dosagem.concretrack.com.br.conf` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 50cd9ea17878) |
| `dosagem-concreto-v2/deploy/nginx/laboratorio-dosagem-native.conf` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 28bee7007a1a) |
| `dosagem-concreto-v2/deploy/scripts/activate-frontend-abrams.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5eb31599ffac) |
| `dosagem-concreto-v2/deploy/scripts/activate-frontend-layout.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 17269360610e) |
| `dosagem-concreto-v2/deploy/scripts/activate-frontend-packing.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c6625a4b1368) |
| `dosagem-concreto-v2/deploy/scripts/activate-login-hotfix.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5581c252e7e9) |
| `dosagem-concreto-v2/deploy/scripts/activate-pilot-release.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 95dfc60feea5) |
| `dosagem-concreto-v2/deploy/scripts/activate-release1-20261022.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 66fc05614b40) |
| `dosagem-concreto-v2/deploy/scripts/backup.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c3672b750d3e) |
| `dosagem-concreto-v2/deploy/scripts/build-pilot-archive.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f60fafcc4805) |
| `dosagem-concreto-v2/deploy/scripts/build-release1-archive.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 7128b440d42c) |
| `dosagem-concreto-v2/deploy/scripts/check-f5-log.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6933ac6ea765) |
| `dosagem-concreto-v2/deploy/scripts/check-neighbors.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 9450b4733db1) |
| `dosagem-concreto-v2/deploy/scripts/ensure-pilot-env.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 45ade6e9e6bf) |
| `dosagem-concreto-v2/deploy/scripts/medir-f5.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8494198654d6) |
| `dosagem-concreto-v2/deploy/scripts/patch-unificado-dosagem-gateway.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 08fe82eaf090) |
| `dosagem-concreto-v2/deploy/scripts/patch-unificado-dosagem-role.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local b58a258af34a) |
| `dosagem-concreto-v2/deploy/scripts/pilot-activate-prepared-20261021.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e87c88359da0) |
| `dosagem-concreto-v2/deploy/scripts/pilot-release-20261021.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a60d3229da1a) |
| `dosagem-concreto-v2/deploy/scripts/post-deploy-login.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 710f8f387b2c) |
| `dosagem-concreto-v2/deploy/scripts/post-deploy-smoke.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e73f022d1b7a) |
| `dosagem-concreto-v2/deploy/scripts/prepare-db.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 23fbae0ac6e7) |
| `dosagem-concreto-v2/deploy/scripts/prepare-native-browser-smoke.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d89fd7d5723b) |
| `dosagem-concreto-v2/deploy/scripts/provision-unificado-native.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a6bac12b14ed) |
| `dosagem-concreto-v2/deploy/scripts/public-official-smoke.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6ad243408835) |
| `dosagem-concreto-v2/deploy/scripts/public-pilot-check.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 4e9d855bfa2e) |
| `dosagem-concreto-v2/deploy/scripts/publish-unificado-native.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f9d6ead9453d) |
| `dosagem-concreto-v2/deploy/scripts/restore-unificado-native.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 003dfbd7416c) |
| `dosagem-concreto-v2/deploy/scripts/rollback-code.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 16ae7d12843b) |
| `dosagem-concreto-v2/deploy/scripts/run-pilot-smoke.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 27dce86ef241) |
| `dosagem-concreto-v2/deploy/scripts/smoke-calc-official.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a1129cf6055e) |
| `dosagem-concreto-v2/deploy/scripts/smoke-unificado-native-api.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8170a3690a54) |
| `dosagem-concreto-v2/deploy/scripts/stage-pilot-release.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 78ab5157c2be) |
| `dosagem-concreto-v2/deploy/scripts/stage-release1-20261022.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 337a3da78a98) |
| `dosagem-concreto-v2/deploy/scripts/start-api-official.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 687d84c5b7b8) |
| `dosagem-concreto-v2/deploy/scripts/verificar-migracoes.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f3eb4e213ae9) |
| `dosagem-concreto-v2/deploy/scripts/verify-vendor.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local dd7228b589d5) |
| `dosagem-concreto-v2/deploy/systemd-official/concretrack-dosagem-api.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d670987a50bd) |
| `dosagem-concreto-v2/deploy/systemd/concrefer-dosagem-native.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 7561210ea64f) |
| `dosagem-concreto-v2/deploy/systemd/concretrack-dosagem-api.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5520aaeff771) |
| `dosagem-concreto-v2/deploy/systemd/concretrack-dosagem-backup.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 84b88edbda0d) |
| `dosagem-concreto-v2/deploy/systemd/concretrack-dosagem-backup.timer` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 16221a7c3466) |
| `dosagem-concreto-v2/deploy/systemd/concretrack-dosagem-smoke.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 682ac6ab6a54) |
| `dosagem-concreto-v2/deploy/systemd/concretrack-dosagem-user-ricardo.service` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 84af5731b23e) |
| `dosagem-concreto-v2/dist-native/auth/login/index.html` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist-native/auth/pilot-banner.js` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist-native/auth/retorno/index.html` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist-native/auth/trocar-senha/index.html` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist-native/dosagem-native.css` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist-native/dosagem-native.js` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist-native/xlsx-CpN2fY5t.js` | dosagem-v2 | C | build ou captura de vídeo gerada |
| `dosagem-concreto-v2/dist/assets/index-B2NmHM4g.js` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/assets/index-DHTx2XPi.css` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/assets/workbox-window.prod.es5-BBnX5xw4.js` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/assets/xlsx-YQ4lDkt_.js` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/auth/login/index.html` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/auth/pilot-banner.js` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/auth/retorno/index.html` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/auth/trocar-senha/index.html` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/index.html` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/manifest.webmanifest` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/dist/sw.js` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/docker-compose.hml.yml` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 3bbc2f4de2b5) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout.patch` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local b6fcdafe74e3) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout.zip` | dosagem-v2 | C | pacote temporário |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/app/App.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6fd5562c49cb) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/app/editor.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 51b831709684) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/app/home.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 821f74eef1b3) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/app/layout.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local bb276fdbbaa8) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/app/layout.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 9379fdf2f658) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/features/PackingPanel.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a513d5306fb9) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/features/Recipe41Page.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f2a3c37cec36) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/features/recipe41.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 3169f05f8e08) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/ui/components.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f245d1677c81) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/ui/icons.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local eb0a055dc74d) |
| `dosagem-concreto-v2/dosagem-v2-novo-layout/dosagem-concreto-v2/srcv2/ui/tokens.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local bdf233f26ec8) |
| `dosagem-concreto-v2/pilot-release.tar.gz` | dosagem-v2 | C | pacote temporário |
| `dosagem-concreto-v2/pilot-web-layout-20261021.tar.gz` | dosagem-v2 | C | pacote temporário |
| `dosagem-concreto-v2/pilot-web-packing-20261021.tar.gz` | dosagem-v2 | C | pacote temporário |
| `dosagem-concreto-v2/pilot-web-update.tar.gz` | dosagem-v2 | C | pacote temporário |
| `dosagem-concreto-v2/playwright.hml.config.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 28029f07e0dd) |
| `dosagem-concreto-v2/playwright.pilot.config.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5e0dbd8fc57c) |
| `dosagem-concreto-v2/public/auth/login/index.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 4871deacac1c) |
| `dosagem-concreto-v2/public/auth/pilot-banner.js` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local accd54f8b8e1) |
| `dosagem-concreto-v2/public/auth/retorno/index.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local dd2521dad51e) |
| `dosagem-concreto-v2/public/auth/trocar-senha/index.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a8e77486ac91) |
| `dosagem-concreto-v2/release1-20261022.tar.gz` | dosagem-v2 | C | pacote temporário |
| `dosagem-concreto-v2/scripts/check-core-ids.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 31ee3d8d5130) |
| `dosagem-concreto-v2/scripts/export-project-md.py` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 761ab87b9772) |
| `dosagem-concreto-v2/scripts/gates.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 3ddedd50d1e6) |
| `dosagem-concreto-v2/scripts/hml-backup-restore.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d758e776576e) |
| `dosagem-concreto-v2/scripts/release1-audit.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 2ca6e33edbc2) |
| `dosagem-concreto-v2/scripts/teste-backup-restauracao.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local ce4bda9b55ce) |
| `dosagem-concreto-v2/scripts/teste-compat-n-1.sh` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a0f005bdf71f) |
| `dosagem-concreto-v2/shared/golden/adjustment-4.1.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local aaf4d86e033d) |
| `dosagem-concreto-v2/shared/golden/alternative-4.1.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 9b48ef844490) |
| `dosagem-concreto-v2/shared/golden/curves-4.1.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 731aec701641) |
| `dosagem-concreto-v2/shared/golden/moisture-4.1.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 35327a80c04a) |
| `dosagem-concreto-v2/shared/golden/principal-4.1.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 0e3ac4c33f32) |
| `dosagem-concreto-v2/shared/golden/rules-4.1.json` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 335cac9f4dff) |
| `dosagem-concreto-v2/src.bak-layout-20261021/app/App.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/app/Editor.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/app/editor.css` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/app/layout.css` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/app/layout.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/abrams.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/adjustment41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/alternative41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/argamassaLegada.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/calculoInverso.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/curves41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/custo.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/custoMcc.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/empacotamento.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/granulometria.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/indicadores.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/limites.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/massaEspecifica.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/metodoCientifica.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/metodoManual.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/metodoTeorArgamassa.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/moisture41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/norms41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/optimization41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/principal41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/regression41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/umidade.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/view41.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/calc/volumes.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/config/indicadores.config.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/config/nbr12655.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/config/nbr7211.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/model.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/units.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/core/validate.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/data/api.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/data/authAdapter.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/data/db.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/data/legacyConverter.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/data/release1Importer.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/data/sync.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/Importacao.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/ImportacaoRelease1.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/PackingPanel.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/ProducaoRelease1.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/Recipe41Page.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/catalogos.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/custos.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/ensaios.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/ferramentas.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/pages.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/recipe41.css` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/features/referencia-config.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/main.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/print/CartaTraco.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/print/carta.css` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/sw.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/ui/components.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/ui/icons.tsx` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/ui/tokens.css` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src.bak-layout-20261021/vite-env.d.ts` | dosagem-v2 | C | backup local |
| `dosagem-concreto-v2/src/app/home.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 821f74eef1b3) |
| `dosagem-concreto-v2/src/core/calc/adjustment41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local ea286c8dcaa0) |
| `dosagem-concreto-v2/src/core/calc/alternative41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a926307422be) |
| `dosagem-concreto-v2/src/core/calc/batch41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 23f77290276a) |
| `dosagem-concreto-v2/src/core/calc/curves41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 748d3adc22dd) |
| `dosagem-concreto-v2/src/core/calc/moisture41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local bea49f87dff3) |
| `dosagem-concreto-v2/src/core/calc/norms41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 22d104ad6db8) |
| `dosagem-concreto-v2/src/core/calc/optimization41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local b841bd31971d) |
| `dosagem-concreto-v2/src/core/calc/principal41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 966f425b2306) |
| `dosagem-concreto-v2/src/core/calc/regression41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a91b159d1d4e) |
| `dosagem-concreto-v2/src/core/calc/view41.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6f24d311876a) |
| `dosagem-concreto-v2/src/data/release1Importer.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 3e370e20dc91) |
| `dosagem-concreto-v2/src/features/AbramsRelease1.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 15185c715d9a) |
| `dosagem-concreto-v2/src/features/AgeCurvePanel.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 01f826735e33) |
| `dosagem-concreto-v2/src/features/ImportacaoRelease1.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6e1fa366783f) |
| `dosagem-concreto-v2/src/features/PackingPanel.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local a513d5306fb9) |
| `dosagem-concreto-v2/src/features/ProducaoRelease1.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 541ac09da6f1) |
| `dosagem-concreto-v2/src/features/Recipe41Page.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local dbba66288e8a) |
| `dosagem-concreto-v2/src/features/recipe41.css` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e7ee4a53cb2e) |
| `dosagem-concreto-v2/src/native.tsx` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 399e9bbd45eb) |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/age-mobile-debug.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/betonada-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/betonada-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/betonada-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/betonada-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/caa-r1-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/caa-r1-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/caa-r1-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/caa-r1-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/curva-i1-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/curva-i1-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/curva-i1-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/curva-i1-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/impacto-s1-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/impacto-s1-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/impacto-s1-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/impacto-s1-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/offline-r1-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/offline-r1-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/offline-r1-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/offline-r1-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/plano-experimental-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/plano-experimental-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/plano-experimental-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/plano-experimental-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/producao-r1-celular.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/producao-r1-desktop.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/producao-r1-tablet-paisagem.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/__screenshots__/producao-r1-tablet-retrato.png` | dosagem-v2 | C | cache/build/captura gerada |
| `dosagem-concreto-v2/tests/e2e/native-unificado-smoke.mjs` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 51866f9b6319) |
| `dosagem-concreto-v2/tests/golden/adjustment41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 75e6e4af0e75) |
| `dosagem-concreto-v2/tests/golden/alternative41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 28a073d1ef52) |
| `dosagem-concreto-v2/tests/golden/batch41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f538e4b70645) |
| `dosagem-concreto-v2/tests/golden/curves41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e3ce30af96cb) |
| `dosagem-concreto-v2/tests/golden/moisture41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5163c152d50e) |
| `dosagem-concreto-v2/tests/golden/parity41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c16f24542765) |
| `dosagem-concreto-v2/tests/golden/principal41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 75d89933ff5b) |
| `dosagem-concreto-v2/tests/golden/rules41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e696f582bcdd) |
| `dosagem-concreto-v2/tests/golden/view41.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 958ddfe1127e) |
| `dosagem-concreto-v2/tests/hml-e2e/age-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local cd484a06ec1e) |
| `dosagem-concreto-v2/tests/hml-e2e/approval-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local ef3c9213ca98) |
| `dosagem-concreto-v2/tests/hml-e2e/auth-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local df330e9cd4f7) |
| `dosagem-concreto-v2/tests/hml-e2e/caa-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local eebfe96bda01) |
| `dosagem-concreto-v2/tests/hml-e2e/catalogos-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 520b9d7c5e99) |
| `dosagem-concreto-v2/tests/hml-e2e/impact-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 7d5cdc5eb4b3) |
| `dosagem-concreto-v2/tests/hml-e2e/offline-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 6bf938681a07) |
| `dosagem-concreto-v2/tests/hml-e2e/production-r1.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d6779807d1fe) |
| `dosagem-concreto-v2/tests/hml-e2e/recipe41.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local d4b7e03f1cb0) |
| `dosagem-concreto-v2/tests/pilot-e2e/local-login-smoke.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 41fecda83a98) |
| `dosagem-concreto-v2/tests/pilot-e2e/session-reload.spec.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local adfd64b5cfac) |
| `dosagem-concreto-v2/tests/unit/release1-import.test.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 83317311cdf5) |
| `dosagem-concreto-v2/vite.native.config.ts` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 49c85014ba05) |
| `dosagem-concreto/PLANO_MODERNIZACAO.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 13fe619240f7) |
| `dosagem-concreto/docs/buycompras/LEITURA-COMPLETA-VPS-ANTIGA.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 922f3c4c9c6e) |
| `dosagem-concreto/docs/buycompras/capturas/01-login.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/02-guia.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/03-dashboard.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/04-pedidos.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/05-nova-solicitacao.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/06-detalhe.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/07-relatorios.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/08-usuarios.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/09-centros-custo.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/10-categorias.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/11-fornecedores.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/12-perfil.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/13-dashboard-mobile.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/buycompras/capturas/14-nova-solicitacao-mobile.png` | dosagem-v2 | C | captura temporária |
| `dosagem-concreto/docs/dosagem-v2/CODEX_DOSAGEM_V2.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local f95c235e6548) |
| `dosagem-concreto/docs/dosagem-v2/mockups/01-inicio-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local c46b166965b5) |
| `dosagem-concreto/docs/dosagem-v2/mockups/02-resultado-experimental-celular.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c52569f3a5d) |
| `dosagem-concreto/docs/dosagem-v2/mockups/03-dosagem-etapa3-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 87e4daaed9a2) |
| `dosagem-concreto/docs/dosagem-v2/mockups/04-granulometria-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e1efeabb3658) |
| `dosagem-concreto/docs/dosagem-v2/mockups/05-carta-desktop.html` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8936560ddc01) |
| `dosagem-concreto/docs/redesign/REDESIGN.md` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a7d820c9952) |
| `dosagem-concreto/docs/redesign/telas/01-home.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local e04eabb13b32) |
| `dosagem-concreto/docs/redesign/telas/02-cadastro-materiais.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8e8b6211b689) |
| `dosagem-concreto/docs/redesign/telas/03-cadastro-fornecedor.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 8b0e33058ea7) |
| `dosagem-concreto/docs/redesign/telas/04-laboratorio.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 94a7e3532bec) |
| `dosagem-concreto/docs/redesign/telas/05-granulometria-miudo.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 397a6bfb4747) |
| `dosagem-concreto/docs/redesign/telas/06-dosagem-1m3.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5de3a147576c) |
| `dosagem-concreto/docs/redesign/telas/07-mobile.jpg` | dosagem-v2 | B | sem equivalente no escopo vivo da VPS (SHA256 local 5bb361b5b72e) |
| `export-estrutura-mapa/LEIA-ME.md` | mapa | C | árvore temporária |
| `export-estrutura-mapa/catalogo-supabase-ao-vivo.json` | mapa | C | árvore temporária |
| `export-estrutura-mapa/estrutura-atual.json` | mapa | C | árvore temporária |
| `infra/ged/Dockerfile.three-masters` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local af94145ba457) |
| `infra/ged/a3-download-smoke.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7c1203bd4b72) |
| `infra/ged/a3-https-cookie-smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b5fed8202ff0) |
| `infra/ged/a3-token-for-smoke.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 778d37da2bba) |
| `infra/ged/a5-admin-token.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local cc0f825f461d) |
| `infra/ged/a5-create-probes.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fb78da899339) |
| `infra/ged/a5-isolated-pdf-probe.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 96d9c1b1bd66) |
| `infra/ged/a5-isolated-valid-pdf.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local cd84f982ee17) |
| `infra/ged/a5-malformed-http-probe.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7cc52c3e2245) |
| `infra/ged/a5-nginx-51m.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a96bffd902a) |
| `infra/ged/a5-pdf-apply-ddl.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ff5c03cfbfb6) |
| `infra/ged/a5-pdf-audit-check.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fbff4e2aa225) |
| `infra/ged/a5-pdf-backup-retry.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fb15e61d1fd5) |
| `infra/ged/a5-pdf-backup-retry3.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a7d1ad40937b) |
| `infra/ged/a5-pdf-backup-retry4.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ef840b87315) |
| `infra/ged/a5-pdf-backup.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b038d212154b) |
| `infra/ged/a5-pdf-switch-retry.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 45a143fea5b2) |
| `infra/ged/a5-pdf-switch-retry4.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 975b71656545) |
| `infra/ged/a5-pdf-switch.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9fa96ae4358e) |
| `infra/ged/a5-revoke-exposed-token.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a9fce3ee89be) |
| `infra/ged/a5-rollback-backend.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9414ec580aea) |
| `infra/ged/a5-rotate-admin-probe.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e9af001aac62) |
| `infra/ged/a5-switch-image.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d904bbda7050) |
| `infra/ged/a5-switch-limits-login.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b586435fcdc7) |
| `infra/ged/a5-valid-50-http.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e69106e8507e) |
| `infra/ged/a5-valid-50-switch.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b1319a02b815) |
| `infra/ged/app/backend/Dockerfile` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 2de3a8d4c0bd) |
| `infra/ged/app/backend/package-lock.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c4c00d661893) |
| `infra/ged/app/backend/package.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 8f0af2e06ed6) |
| `infra/ged/app/backend/server.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 6abfc2194d83) |
| `infra/ged/app/backend/src/config/database.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5fd26c8a80e3) |
| `infra/ged/app/backend/src/config/googleDrive.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a40544896e5d) |
| `infra/ged/app/backend/src/config/jwt.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local efe415e04e72) |
| `infra/ged/app/backend/src/controllers/approvalController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 2cd16e51f3d8) |
| `infra/ged/app/backend/src/controllers/approvalController.js.bak-20260727-approval-chain` | ged | C | backup local |
| `infra/ged/app/backend/src/controllers/authController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 215fc3c0dc37) |
| `infra/ged/app/backend/src/controllers/calibrationController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9931adaee162) |
| `infra/ged/app/backend/src/controllers/documentController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 80c36b06fe76) |
| `infra/ged/app/backend/src/controllers/documentController.js.bak-20260727-document-scope` | ged | C | backup local |
| `infra/ged/app/backend/src/controllers/documentController.js.bak-20260727-version-history` | ged | C | backup local |
| `infra/ged/app/backend/src/controllers/previewController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 837d4de56e6d) |
| `infra/ged/app/backend/src/controllers/readLogController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7a8da6e1108e) |
| `infra/ged/app/backend/src/controllers/readLogController.js.bak-20260727-version-readers` | ged | C | backup local |
| `infra/ged/app/backend/src/controllers/rncController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 10568de35358) |
| `infra/ged/app/backend/src/controllers/taskController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local cca5aabdbe91) |
| `infra/ged/app/backend/src/controllers/uploadController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 23f59742e0bb) |
| `infra/ged/app/backend/src/controllers/userController.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9a6ac4a060cd) |
| `infra/ged/app/backend/src/middlewares/auth.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 10ba5482e5a5) |
| `infra/ged/app/backend/src/middlewares/auth.js.bak-20260727-document-scope` | ged | C | backup local |
| `infra/ged/app/backend/src/middlewares/rncReadonly.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 59d188476eeb) |
| `infra/ged/app/backend/src/middlewares/roles.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5cab4954d3b2) |
| `infra/ged/app/backend/src/middlewares/unifiedGateway.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d5c67c10534a) |
| `infra/ged/app/backend/src/routes/approvalRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a6ff1dfc4951) |
| `infra/ged/app/backend/src/routes/authRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 955bdca02e98) |
| `infra/ged/app/backend/src/routes/calibrationRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c0b2391b5ffa) |
| `infra/ged/app/backend/src/routes/documentRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 316625b08717) |
| `infra/ged/app/backend/src/routes/readLogRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 07b5d7aa9845) |
| `infra/ged/app/backend/src/routes/rncRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local beca8e7a4d67) |
| `infra/ged/app/backend/src/routes/taskRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 72654a917e6c) |
| `infra/ged/app/backend/src/routes/unifiedRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b84af2ef77be) |
| `infra/ged/app/backend/src/routes/userRoutes.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ca1d5e959b54) |
| `infra/ged/app/backend/src/services/alertService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 197c45e17f5d) |
| `infra/ged/app/backend/src/services/auditService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 3f771095ce5d) |
| `infra/ged/app/backend/src/services/documentService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 826b936f7bce) |
| `infra/ged/app/backend/src/services/documentService.js.bak-20260727-approval-chain` | ged | C | backup local |
| `infra/ged/app/backend/src/services/driveService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7917b54de66e) |
| `infra/ged/app/backend/src/services/emailService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c86ca831c342) |
| `infra/ged/app/backend/src/services/passwordPolicy.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 4812c487d357) |
| `infra/ged/app/backend/src/services/pdfService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local bc02655c64df) |
| `infra/ged/app/backend/src/services/pdfStampService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b9588df28dcd) |
| `infra/ged/app/backend/src/services/pdfStampWorker.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d97b750e7870) |
| `infra/ged/app/backend/src/services/rbacService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 59fd44667607) |
| `infra/ged/app/backend/src/services/server.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 438ab342d8c9) |
| `infra/ged/app/backend/src/services/storageService.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 6603e95deec6) |
| `infra/ged/app/backend/tests/pdf-stamp-audit.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fa8ca3858af7) |
| `infra/ged/app/backend/tests/pdf-stamp-isolation.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d0437c6df40c) |
| `infra/ged/app/backend/tests/pdf-stamp-large.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0d0896268254) |
| `infra/ged/app/backend/tests/preview-link.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b8a1d071cc02) |
| `infra/ged/app/backend/tests/rbac-smoke.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a07691b72fdd) |
| `infra/ged/app/backend/tests/rnc-readonly.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 879c1ceaf2aa) |
| `infra/ged/app/backend/tests/storage-obsolescence.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5893320b2ef3) |
| `infra/ged/app/backend/tests/unified-gateway.test.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 1fc8273a6c44) |
| `infra/ged/app/frontend/.next/BUILD_ID` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/app-path-routes-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/0gw4_11ss215._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/0gw4_11ss215._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[root-of-the-server]__079soh2._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[root-of-the-server]__079soh2._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[root-of-the-server]__0~sbv_u._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[root-of-the-server]__0~sbv_u._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[turbopack-node]_transforms_postcss_ts_081f7in._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[turbopack-node]_transforms_postcss_ts_081f7in._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[turbopack]_runtime.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/chunks/[turbopack]_runtime.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/package.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/postcss.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/build/postcss.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/cache/.previewinfo` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/cache/.rscinfo` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/cache/.tsbuildinfo` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/diagnostics/build-diagnostics.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/diagnostics/framework.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/diagnostics/route-bundle-stats.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/export-marker.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/fallback-build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/images-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/next-minimal-server.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/next-server.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/package.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/prerender-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/required-server-files.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/required-server-files.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/routes-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/approvals/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/calibrations/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/dashboard/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/documents/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/rnc/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/tasks/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/(app)/users/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.segments/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_global-error/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.segments/_not-found.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.segments/_not-found/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/_not-found/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/!KGFwcCk/approvals.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/!KGFwcCk/approvals/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/approvals.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/!KGFwcCk/calibrations.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/!KGFwcCk/calibrations/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.segments/change-password.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password.segments/change-password/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/change-password/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/!KGFwcCk/dashboard.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/!KGFwcCk/dashboard/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/dashboard.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/!KGFwcCk/documents.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/!KGFwcCk/documents/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/documents.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.segments/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/index.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.segments/login.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login.segments/login/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/login/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/!KGFwcCk/rnc.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/!KGFwcCk/rnc/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk/rnc.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk/rnc/new.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk/rnc/new/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/rnc/new.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/!KGFwcCk/tasks.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/!KGFwcCk/tasks/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/tasks.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/!KGFwcCk/users.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/!KGFwcCk/users/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/app/users.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0ayo_frontend__next-internal_server_app_(app)_documents_[id]_page_actions_0jnw28u.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0ayo_frontend__next-internal_server_app_(app)_documents_[id]_page_actions_0jnw28u.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0ayo_frontend__next-internal_server_app_calibrations_label_[id]_page_actions_0~mt_78.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0ayo_frontend__next-internal_server_app_calibrations_label_[id]_page_actions_0~mt_78.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0cr~_app_frontend__next-internal_server_app_(app)_calibrations_page_actions_0tn8ds6.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0cr~_app_frontend__next-internal_server_app_(app)_calibrations_page_actions_0tn8ds6.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0cr~_app_frontend__next-internal_server_app_(app)_tasks_[id]_page_actions_0sv~76-.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0cr~_app_frontend__next-internal_server_app_(app)_tasks_[id]_page_actions_0sv~76-.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_0ulvkv.._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_0ulvkv.._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_10hry6~._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_10hry6~._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_date-fns_format_mjs_0h4~jai._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_date-fns_format_mjs_0h4~jai._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_08nh89p._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_08nh89p._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_0q6i0v.._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_0q6i0v.._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_0fs6t4a._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_0fs6t4a._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_forbidden_101oabr.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_forbidden_101oabr.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_global-error_09-y1zj.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_global-error_09-y1zj.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_unauthorized_0~6fj_f.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_unauthorized_0~6fj_f.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_00eqaqz.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_00eqaqz.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_044lno_.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_044lno_.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_09~n2.c.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_09~n2.c.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0c~l71~.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0c~l71~.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0e0uayl.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0e0uayl.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0j98l67.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0j98l67.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0l7hfzn.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0l7hfzn.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0ngr4ks.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0ngr4ks.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0pdfai4.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0pdfai4.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0piubdk.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0piubdk.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0rv.bwb.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0rv.bwb.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0u_kc~c.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0u_kc~c.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0v1wggl.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0v1wggl.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0vj0iod.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0vj0iod.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0x9_h78.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0x9_h78.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0xh81xc.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0xh81xc.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_10~h1df.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_10~h1df.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_12-aoqa.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_12-aoqa.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_react-hook-form_dist_index_esm_mjs_09fqr1q._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_react-hook-form_dist_index_esm_mjs_09fqr1q._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0kv8__next-internal_server_app_calibrations_verify_[id]_page_actions_0u_yv_x.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0kv8__next-internal_server_app_calibrations_verify_[id]_page_actions_0u_yv_x.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_(app)_rnc_page_actions_0vtyghf.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_(app)_rnc_page_actions_0vtyghf.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_login_page_actions_03mnq.r.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_login_page_actions_03mnq.r.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_page_actions_0d99e5y.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_page_actions_0d99e5y.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend_src_app_(app)_documents_[id]_page_tsx_0u140n6._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend_src_app_(app)_documents_[id]_page_tsx_0u140n6._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0m4n_pwa-hub-fase1_infra_ged_app_frontend_src_app_(app)_users_page_tsx_051jt5j._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0m4n_pwa-hub-fase1_infra_ged_app_frontend_src_app_(app)_users_page_tsx_051jt5j._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_approvals_page_actions_0vsjh~w.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_approvals_page_actions_0vsjh~w.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_dashboard_page_actions_0e7r98h.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_dashboard_page_actions_0e7r98h.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_documents_page_actions_0ow2sj1.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_documents_page_actions_0ow2sj1.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_rnc_[id]_page_actions_13_0d_i.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_rnc_[id]_page_actions_13_0d_i.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_rnc_new_page_actions_04p0b78.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_rnc_new_page_actions_04p0b78.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_tasks_page_actions_0f4r2tb.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_tasks_page_actions_0f4r2tb.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_users_page_actions_0je5drl.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_users_page_actions_0je5drl.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app__global-error_page_actions_11v1ny..js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app__global-error_page_actions_11v1ny..js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app__not-found_page_actions_084ugk0.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app__not-found_page_actions_084ugk0.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_change-password_page_actions_04983x..js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_change-password_page_actions_04983x..js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0-iza66._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0-iza66._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_03k2dds._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_03k2dds._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_04u3ofz._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_04u3ofz._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_06wv47m._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_06wv47m._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0etdutx._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0etdutx._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0fq-z1c._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0fq-z1c._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0km5uz4._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0km5uz4._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0n5bp88._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0n5bp88._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0n8dcbd._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0n8dcbd._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0ncmqr0._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0ncmqr0._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0q_1a6a._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0q_1a6a._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0qh0d_8._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0qh0d_8._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_105oa_p._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_105oa_p._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_10b_rpb._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_10b_rpb._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_13fc433._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_13fc433._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_02qxgsy._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_02qxgsy._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_06v~4~s._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_06v~4~s._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_app_(app)_layout_tsx_0h~uzm~._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_app_(app)_layout_tsx_0h~uzm~._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_app_page_tsx_0f.lz2e._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_app_page_tsx_0f.lz2e._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0._dv47._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0._dv47._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0.jo3ff._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0.jo3ff._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__00w2a6~._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__00w2a6~._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__01q5nbj._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__01q5nbj._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__02w40up._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__02w40up._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__04o5nft._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__04o5nft._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__04t~hbu._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__04t~hbu._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__07ul4h9._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__07ul4h9._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__095y184._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__095y184._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0_gb44g._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0_gb44g._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0eli.2r._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0eli.2r._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0fv_6vi._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0fv_6vi._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0hohf~p._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0hohf~p._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0if5_c2._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0if5_c2._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0k7zpx6._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0k7zpx6._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0mdib92._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0mdib92._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0n80hv9._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0n80hv9._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0pk5cwp._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0pk5cwp._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0qj.2wv._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0qj.2wv._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0sfyvb5._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0sfyvb5._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0wx2~.9._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0wx2~.9._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0xhilhw._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0xhilhw._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0zy21t-._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0zy21t-._.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[turbopack]_runtime.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/chunks/ssr/[turbopack]_runtime.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/functions-config-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/interception-route-rewrite-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/middleware-build-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/middleware-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/next-font-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/pages-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/pages/404.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/pages/500.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/prefetch-hints.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/server-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/server/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/BUILD_ID` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/app-path-routes-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/package.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/prerender-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/required-server-files.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/routes-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/approvals/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/calibrations/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/dashboard/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/documents/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/new/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/rnc/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/tasks/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/(app)/users/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.segments/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_global-error/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.segments/_not-found.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.segments/_not-found/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/_not-found/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/!KGFwcCk/approvals.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/!KGFwcCk/approvals/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/approvals.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/!KGFwcCk/calibrations.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/!KGFwcCk/calibrations/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/label/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/calibrations/verify/[id]/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.segments/change-password.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password.segments/change-password/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/change-password/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/!KGFwcCk/dashboard.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/!KGFwcCk/dashboard/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/dashboard.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/!KGFwcCk/documents.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/!KGFwcCk/documents/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/documents.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.segments/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/index.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.segments/login.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login.segments/login/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/login/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page.js.map` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page.js.nft.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page/app-paths-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page/build-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page/react-loadable-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/page_client-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/!KGFwcCk/rnc.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/!KGFwcCk/rnc/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk/rnc.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk/rnc/new.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/!KGFwcCk/rnc/new/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/rnc/new.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/!KGFwcCk/tasks.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/!KGFwcCk/tasks/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/tasks.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.meta` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/!KGFwcCk.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/!KGFwcCk/users.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/!KGFwcCk/users/__PAGE__.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/_full.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/_head.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/_index.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/app/users.segments/_tree.segment.rsc` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0ayo_frontend__next-internal_server_app_(app)_documents_[id]_page_actions_0jnw28u.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0ayo_frontend__next-internal_server_app_calibrations_label_[id]_page_actions_0~mt_78.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0cr~_app_frontend__next-internal_server_app_(app)_calibrations_page_actions_0tn8ds6.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0cr~_app_frontend__next-internal_server_app_(app)_tasks_[id]_page_actions_0sv~76-.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_0ulvkv.._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_10hry6~._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_date-fns_format_mjs_0h4~jai._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_08nh89p._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_0q6i0v.._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_0fs6t4a._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_forbidden_101oabr.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_global-error_09-y1zj.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_client_components_builtin_unauthorized_0~6fj_f.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_00eqaqz.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_044lno_.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_09~n2.c.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0c~l71~.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0e0uayl.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0j98l67.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0l7hfzn.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0ngr4ks.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0pdfai4.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0piubdk.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0rv.bwb.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0u_kc~c.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0v1wggl.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0vj0iod.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0x9_h78.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_0xh81xc.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_10~h1df.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_next_dist_esm_build_templates_app-page_12-aoqa.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0gw4_react-hook-form_dist_index_esm_mjs_09fqr1q._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0kv8__next-internal_server_app_calibrations_verify_[id]_page_actions_0u_yv_x.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_(app)_rnc_page_actions_0vtyghf.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_login_page_actions_03mnq.r.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend__next-internal_server_app_page_actions_0d99e5y.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0lxb_infra_ged_app_frontend_src_app_(app)_documents_[id]_page_tsx_0u140n6._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0m4n_pwa-hub-fase1_infra_ged_app_frontend_src_app_(app)_users_page_tsx_051jt5j._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_approvals_page_actions_0vsjh~w.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_dashboard_page_actions_0e7r98h.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_documents_page_actions_0ow2sj1.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_rnc_[id]_page_actions_13_0d_i.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_rnc_new_page_actions_04p0b78.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_tasks_page_actions_0f4r2tb.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_(app)_users_page_actions_0je5drl.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app__global-error_page_actions_11v1ny..js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app__not-found_page_actions_084ugk0.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/0z9k_ged_app_frontend__next-internal_server_app_change-password_page_actions_04983x..js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0-iza66._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_03k2dds._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_04u3ofz._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_06wv47m._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0etdutx._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0fq-z1c._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0km5uz4._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0n5bp88._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0n8dcbd._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0ncmqr0._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0q_1a6a._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_0qh0d_8._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_105oa_p._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_10b_rpb._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_13fc433._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_02qxgsy._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_06v~4~s._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_app_(app)_layout_tsx_0h~uzm~._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/Documents_pwa-hub-fase1_infra_ged_app_frontend_src_app_page_tsx_0f.lz2e._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0._dv47._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0.jo3ff._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__00w2a6~._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__01q5nbj._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__02w40up._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__04o5nft._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__04t~hbu._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__07ul4h9._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__095y184._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0_gb44g._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0eli.2r._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0fv_6vi._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0hohf~p._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0if5_c2._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0k7zpx6._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0mdib92._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0n80hv9._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0pk5cwp._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0qj.2wv._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0sfyvb5._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0wx2~.9._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0xhilhw._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[root-of-the-server]__0zy21t-._.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/chunks/ssr/[turbopack]_runtime.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/functions-config-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/middleware-build-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/middleware-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/next-font-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/next-font-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/pages-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/pages/404.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/pages/500.html` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/prefetch-hints.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/server-reference-manifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/.next/server/server-reference-manifest.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/package.json` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/standalone/Documents/pwa-hub-fase1/infra/ged/app/frontend/server.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0.nzjjgtm4.1t.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0081gpxalmxa0.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/03~yq9q893hmn.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/08n83y908yf3h.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/093z5y43x6r0-.css` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0_08hwsjenmum.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0a41xpr0cnosg.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0c7oz_9rl_1mk.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0cbhel6po2jzp.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0eqyom_m.fc8y.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0gb14ms4qatu-.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0imzp4gfl52v1.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0iucnq.odxm3b.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0jc3nnevtedt..js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0jd9r_kzt8epp.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0lmf~vjjr5~u4.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0mht0qea86-0u.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0ow4j9rin6u9x.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0tf4z5lj76ddf.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0wpz5sykp4dga.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0xx3_wpc~h.8r.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0zdk-u225_4bc.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/0z~5yaxtgkroc.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/13lerjlcpmkp..js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/14pq1tkceyxp9.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/14w0g.kw8i04t.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/15.wkmzu~q9n0.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/16-_lxt_x-nre.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/17nvf__aobls0.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/chunks/turbopack-0i8qmyc889qu2.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/yatqk9Gd3-jBULr5EdQ0e/_buildManifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/yatqk9Gd3-jBULr5EdQ0e/_clientMiddlewareManifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/static/yatqk9Gd3-jBULr5EdQ0e/_ssgManifest.js` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/trace` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/trace-build` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/turbopack` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/types/cache-life.d.ts` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/types/routes.d.ts` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/.next/types/validator.ts` | ged | C | cache/build/captura gerada |
| `infra/ged/app/frontend/Dockerfile` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d501913a5284) |
| `infra/ged/app/frontend/next-env.d.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7b550dda9686) |
| `infra/ged/app/frontend/next.config.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local df3b18c18bd8) |
| `infra/ged/app/frontend/package-lock.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9eebb696f905) |
| `infra/ged/app/frontend/package.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 8f050b2d4a5b) |
| `infra/ged/app/frontend/postcss.config.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fa650b380adf) |
| `infra/ged/app/frontend/public/.gitkeep` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 01ba4719c80b) |
| `infra/ged/app/frontend/src/app/(app)/approvals/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9ed8980f9471) |
| `infra/ged/app/frontend/src/app/(app)/calibrations/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local cb003902e080) |
| `infra/ged/app/frontend/src/app/(app)/dashboard/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 36a5ee7a2e2a) |
| `infra/ged/app/frontend/src/app/(app)/documents/[id]/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0aafd86b6f88) |
| `infra/ged/app/frontend/src/app/(app)/documents/[id]/page.tsx.bak-20260727-version-history-log` | ged | C | backup local |
| `infra/ged/app/frontend/src/app/(app)/documents/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b54984b4390f) |
| `infra/ged/app/frontend/src/app/(app)/layout.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 1768de3509a5) |
| `infra/ged/app/frontend/src/app/(app)/rnc/[id]/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b7f8845b960f) |
| `infra/ged/app/frontend/src/app/(app)/rnc/new/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0e79ace0bad5) |
| `infra/ged/app/frontend/src/app/(app)/rnc/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9deef822862a) |
| `infra/ged/app/frontend/src/app/(app)/tasks/[id]/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5dac5911086e) |
| `infra/ged/app/frontend/src/app/(app)/tasks/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 131b7508b1bc) |
| `infra/ged/app/frontend/src/app/(app)/users/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b70033c8e081) |
| `infra/ged/app/frontend/src/app/calibrations/label/[id]/PrintButton.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ed8765c83f7) |
| `infra/ged/app/frontend/src/app/calibrations/label/[id]/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 0518b641302b) |
| `infra/ged/app/frontend/src/app/calibrations/verify/[id]/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local f15491c1274d) |
| `infra/ged/app/frontend/src/app/change-password/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5be9894015cb) |
| `infra/ged/app/frontend/src/app/change-password/page.tsx.bak-20260727-password-focus` | ged | C | backup local |
| `infra/ged/app/frontend/src/app/globals.css` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 08b2e7cc3c79) |
| `infra/ged/app/frontend/src/app/layout.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 2b89040faaf9) |
| `infra/ged/app/frontend/src/app/login/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 2483989fb36b) |
| `infra/ged/app/frontend/src/app/page.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ec2322c854da) |
| `infra/ged/app/frontend/src/components/ApprovalModal.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ff241d9135bf) |
| `infra/ged/app/frontend/src/components/DocumentTable.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b98807978a38) |
| `infra/ged/app/frontend/src/components/EditDocumentModal.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 133c4cb11cd5) |
| `infra/ged/app/frontend/src/components/FilterBar.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ae2c810006aa) |
| `infra/ged/app/frontend/src/components/Header.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local f0ae42e847cd) |
| `infra/ged/app/frontend/src/components/Sidebar.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a26053c0c49d) |
| `infra/ged/app/frontend/src/components/StatsCard.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 64952d8780ea) |
| `infra/ged/app/frontend/src/components/TaskBoard.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 734c16cbb526) |
| `infra/ged/app/frontend/src/components/TaskFilters.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e8ed938be784) |
| `infra/ged/app/frontend/src/components/TaskModal.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 35d4667c48fa) |
| `infra/ged/app/frontend/src/components/UploadModal.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e167276cfdc3) |
| `infra/ged/app/frontend/src/constants/documentMeta.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 51e2a89354ef) |
| `infra/ged/app/frontend/src/constants/rncMeta.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 8b8b30f13b3d) |
| `infra/ged/app/frontend/src/constants/taskMeta.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 63507c806f6c) |
| `infra/ged/app/frontend/src/contexts/AuthContext.tsx` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 1c0818836e9f) |
| `infra/ged/app/frontend/src/hooks/useEmbeddedReady.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e64c50423a47) |
| `infra/ged/app/frontend/src/hooks/useRequireAuth.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 6323b569d31a) |
| `infra/ged/app/frontend/src/services/api.ts` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 67350912083e) |
| `infra/ged/app/frontend/tailwind.config.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d8b24d2ee306) |
| `infra/ged/app/frontend/tsconfig.json` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local fb8dab2900d0) |
| `infra/ged/app/frontend/tsconfig.tsbuildinfo` | ged | C | artefato gerado |
| `infra/ged/docker-compose.homolog.yml` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e01b8a3d7425) |
| `infra/ged/docker-compose.yml` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local da03d986165a) |
| `infra/ged/nginx-ged-unificado.conf` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 3d9d209787d9) |
| `infra/ged/nginx-old-domain-a6-302.conf` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 47162435b162) |
| `infra/ged/nginx-old-domain-a6-candidate.conf` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 109accbf2ca2) |
| `infra/ged/server.a2-isolated.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 45c4e3f17ba4) |
| `infra/ged/userRoutes.three-masters.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9e7b38574e0f) |
| `infra/nginx/qualidade-unificado.conf` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 2d943f3676dd) |
| `infra/nginx/unificado-homolog.conf` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 76d1a506a2e3) |
| `infra/qualidade/b5-restore-smoke.sh` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local bde45c64fbe2) |
| `infra/systemd/backup-ged-qualidade-restore.service` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 70abb5dde140) |
| `infra/systemd/backup-ged-qualidade-restore.timer` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local f78416218a55) |
| `infra/systemd/backup-ged-qualidade.service` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 6a51d8857910) |
| `infra/systemd/backup-ged-qualidade.timer` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a1e959eaa40b) |
| `infra/systemd/laboratorio-homolog.service` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local d1b6f45dbd61) |
| `mapa-concretagem/dashboard-reference-layout.css` | mapa | A | conteúdo igual a public/unificado/mapa/operacao/dashboard-reference-layout.css (SHA256 normalizado 660a6eaa0015) |
| `mapa-concretagem/dashboard-reference-layout.js` | mapa | A | conteúdo igual a public/unificado/mapa/operacao/dashboard-reference-layout.js (SHA256 normalizado d27757e4cf17) |
| `mapa-concretagem/montagem-taxa.css` | mapa | A | conteúdo igual a public/unificado/mapa/operacao/montagem-taxa.css (SHA256 normalizado ddecb0a25e0e) |
| `mapa-concretagem/montagem-taxa.js` | mapa | B | igual apenas a backup da VPS, difere da árvore ativa |
| `mapa-concretagem/pendencias-migracao.html` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local b5cda9022b41) |
| `menu-lateral-modeloA/PROMPT_CODEX.md` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2683c00a8b34) |
| `menu-lateral-modeloA/preview-aberto-recolhido.png` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local b553acc59dbd) |
| `menu-lateral-modeloA/src/components/sidebar/Sidebar.tsx` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ee25efc8ee99) |
| `menu-lateral-modeloA/src/components/sidebar/icons.tsx` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 77a68ec92a25) |
| `menu-lateral-modeloA/src/components/sidebar/navConfig.ts` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e6ba744cc648) |
| `menu-lateral-modeloA/src/components/sidebar/sidebar.css` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local c31dc7b758e6) |
| `mockups/dashboard-defeitos-v4.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2f327f6b5021) |
| `output/controle-estatistico/agosto-2026-analise-rompimentos-sinteticos.md` | geral | C | árvore temporária |
| `output/controle-estatistico/agosto-2026-rompimentos-sinteticos.json` | geral | C | árvore temporária |
| `output/custo-carta-traco.html` | geral | C | árvore temporária |
| `output/diffs/0001-Adiciona-grafico-percentual-de-defeitos-v1.78.patch` | geral | C | árvore temporária |
| `output/diffs/0001-Corrige-resumo-da-exportacao-v1.77.patch` | geral | C | árvore temporária |
| `output/diffs/0001-Garante-exportacao-completa-da-montagem-v1.77.patch` | geral | C | árvore temporária |
| `output/diffs/0001-Preserva-checklists-longos-no-XLSX-v1.77.patch` | geral | C | árvore temporária |
| `output/diffs/0001-dashboard-defeitos-apresentacao-4x3-v1.79.patch` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_RNC_EMBU_aprovacao.pdf` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_RNC_EMBU_final.pdf` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_RNC_EMBU_homologacao.pdf` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_RNC_EMBU_revisado.pdf` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_RNC_EMBU_teste.pdf` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_comparacao_final.png` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_comparacao_lado_a_lado.pdf` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_comparacao_revisada.png` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_comparativo_EMBU.png` | geral | C | árvore temporária |
| `output/pdf/FL-SGQ-07_comparativo_EMBU_validado.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_aprovacao-p1.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_aprovacao-p2.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_aprovacao.pdf` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_final-p1.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_final-p2.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_final.pdf` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_homolog-p1.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_homolog-p2.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_EMBU_moderno_homolog.pdf` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_eficacia_homolog-p1.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_eficacia_homolog-p2.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_eficacia_homolog.pdf` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_moderno_rascunho-local-p1.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_moderno_rascunho-local-p2.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_moderno_rascunho-local-p3.png` | geral | C | árvore temporária |
| `output/pdf/RNC-FL-SGQ-07_moderno_rascunho-local.pdf` | geral | C | árvore temporária |
| `output/pdf/guia-pwa-producao-pederneiras-gestores.pdf` | geral | C | árvore temporária |
| `output/pdf/logica-exportacao-montagem-xlsx.pdf` | geral | C | árvore temporária |
| `output/pdf/modern-local-v2-p1.png` | geral | C | árvore temporária |
| `output/pdf/modern-local-v2-p2.png` | geral | C | árvore temporária |
| `output/pdf/modern-local-v3-p1.png` | geral | C | árvore temporária |
| `output/pdf/modern-local-v3-p2.png` | geral | C | árvore temporária |
| `output/pdf/relatorio-auditoria-persistencia-cps-qr-concreto-erp-concretrack.pdf` | geral | C | árvore temporária |
| `output/pdf/relatorio-cutover-cec-concretrack-2026-09-17.pdf` | qualidade | C | árvore temporária |
| `output/pdf/relatorio-planejamento-montagem-postes-teste-v2.pdf` | geral | C | árvore temporária |
| `output/pdf/relatorio-planejamento-montagem-postes-teste.pdf` | geral | C | árvore temporária |
| `output/pdf/relatorio-sistema-concretrack-2026-09-26.pdf` | geral | C | árvore temporária |
| `output/pdf/write-check.txt` | geral | C | árvore temporária |
| `pcp_producao_agent/output/pdf/manual_entrada_materiais_frete_unitario_concretrack.pdf` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 758b87c77818) |
| `pcp_producao_agent/output/pdf/plano_implantacao_icms_frete_estoque_concretrack.pdf` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b1a585ea4aa3) |
| `pcp_producao_agent/output/pdf/plano_implantacao_icms_frete_unitario_estoque_concretrack.pdf` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e4956c61c160) |
| `pcp_producao_agent/tmp/add_ped_patch_endpoint.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e0d7f737d260) |
| `pcp_producao_agent/tmp/backup_main.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ed9b55c85ae) |
| `pcp_producao_agent/tmp/backup_units.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local d11585a899ca) |
| `pcp_producao_agent/tmp/check_main.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 91eeefd9ebf3) |
| `pcp_producao_agent/tmp/check_main_content.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 50ddafba178b) |
| `pcp_producao_agent/tmp/check_main_provider_calc.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local bf64d1248ade) |
| `pcp_producao_agent/tmp/check_main_provider_loaded.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 31cc6b83167e) |
| `pcp_producao_agent/tmp/check_main_provider_py.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local d3fcd40611d6) |
| `pcp_producao_agent/tmp/check_ped_provider_loaded.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a440b94fbe18) |
| `pcp_producao_agent/tmp/check_ped_provider_py.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 709fd0835cba) |
| `pcp_producao_agent/tmp/check_units.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 72f341ff98a9) |
| `pcp_producao_agent/tmp/check_units_content.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local c06f464e6f59) |
| `pcp_producao_agent/tmp/check_units_provider_calc.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b144ef65c3e9) |
| `pcp_producao_agent/tmp/configure_ped_ai.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a48050a9a166) |
| `pcp_producao_agent/tmp/env_main.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 5e318731747e) |
| `pcp_producao_agent/tmp/env_units.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 680dd5a0b5aa) |
| `pcp_producao_agent/tmp/patch_estoque_apps.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 275280b5f676) |
| `pcp_producao_agent/tmp/pdfs/build_icms_frete_plan.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 51c2c0c8fd3e) |
| `pcp_producao_agent/tmp/pdfs/build_icms_frete_unitario_plan.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 608eb400e6d6) |
| `pcp_producao_agent/tmp/pdfs/build_manual_entrada_materiais.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1fe7eb74d22f) |
| `pcp_producao_agent/tmp/pdfs/patch_pdf_builder.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local f784ac38f694) |
| `pcp_producao_agent/tmp/pdfs/render_manual_entrada.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 744cf65b697e) |
| `pcp_producao_agent/tmp/pdfs/render_pdf.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4bf51c7df62b) |
| `pcp_producao_agent/tmp/pdfs/render_pdf_unitario.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local f8ceb938dbca) |
| `pcp_producao_agent/tmp/pdfs/rendered/icms_frete_plan_page_1.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 37983813af45) |
| `pcp_producao_agent/tmp/pdfs/rendered/icms_frete_plan_page_2.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 2220e3f6b316) |
| `pcp_producao_agent/tmp/pdfs/rendered/icms_frete_plan_page_3.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e88445a93111) |
| `pcp_producao_agent/tmp/pdfs/rendered/icms_frete_plan_page_4.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 9097c14b162c) |
| `pcp_producao_agent/tmp/pdfs/rendered_manual_entrada/manual_entrada_page_1.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 59ad83b2abed) |
| `pcp_producao_agent/tmp/pdfs/rendered_manual_entrada/manual_entrada_page_2.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 8eaba4b41856) |
| `pcp_producao_agent/tmp/pdfs/rendered_unitario/icms_frete_unitario_plan_page_1.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local aa95acdf8ab4) |
| `pcp_producao_agent/tmp/pdfs/rendered_unitario/icms_frete_unitario_plan_page_2.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 31ae5b3e89c8) |
| `pcp_producao_agent/tmp/pdfs/rendered_unitario/icms_frete_unitario_plan_page_3.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 92584800a8b3) |
| `pcp_producao_agent/tmp/pdfs/rendered_unitario/icms_frete_unitario_plan_page_4.png` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local bfe332718709) |
| `pcp_producao_agent/tmp/pdfs/update_pdf_frete_unitario.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local f62893263315) |
| `pcp_producao_agent/tmp/remote/main/ai_providers.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a7d03740574d) |
| `pcp_producao_agent/tmp/remote/main/entrada.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local ff3a43be55b9) |
| `pcp_producao_agent/tmp/remote/main/estoque.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 829bd37d3cfe) |
| `pcp_producao_agent/tmp/remote/main/settings.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7535c22ca84d) |
| `pcp_producao_agent/tmp/remote/noro/entrada.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local ad54e752fbd6) |
| `pcp_producao_agent/tmp/remote/noro/estoque.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1ef513ef40a0) |
| `pcp_producao_agent/tmp/remote/ped/ai_providers.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a7d03740574d) |
| `pcp_producao_agent/tmp/remote/ped/entrada.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4c7b3278c6cf) |
| `pcp_producao_agent/tmp/remote/ped/estoque.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 91de0ea136fa) |
| `pcp_producao_agent/tmp/remote/ped/settings.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7535c22ca84d) |
| `pcp_producao_agent/tmp/remote/ribe/ai_providers.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a7d03740574d) |
| `pcp_producao_agent/tmp/remote/ribe/entrada.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local c67608907bdd) |
| `pcp_producao_agent/tmp/remote/ribe/estoque.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1ef513ef40a0) |
| `pcp_producao_agent/tmp/remote/ribe/settings.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7535c22ca84d) |
| `pcp_producao_agent/tmp/remote_exec.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 97e0d77de724) |
| `pcp_producao_agent/tmp/remote_file.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 9f7c08f7c231) |
| `pcp_producao_agent/tmp/remote_script.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local defa8e88062b) |
| `pcp_producao_agent/tmp/restart_main.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 94dc332c41a9) |
| `pcp_producao_agent/tmp/restart_units.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 28ebe467b6c6) |
| `pcp_producao_agent/tmp/status_main.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 78dc05632f22) |
| `pcp_producao_agent/tmp/status_units.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 5de6ad8a9673) |
| `pcp_producao_agent/tmp/test_remote.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4726de74e6ad) |
| `pcp_producao_agent/tmp/validate_main.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 85a9d9c583a2) |
| `pcp_producao_agent/tmp/validate_units.sh` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 217aa22c5928) |
| `pilot-web-abrams-20261021.tar.gz` | geral | C | pacote temporário |
| `preview-unificado/Untitled-1.txt` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local fc683e2f376c) |
| `quality-layout-20261015-v2.tar` | geral | C | pacote temporário |
| `quality-layout-20261015-v3.tar` | geral | C | pacote temporário |
| `quality-layout-20261015.tar` | geral | C | pacote temporário |
| `relatorios/dashboard-refatoracao-plano-teste.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ff41ca3a1de0) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-07.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 39f0f7c432aa) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-10.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 19e552a1d5c5) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-11.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 33cc9c4875ec) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-12.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ef1cafb9249f) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-14.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local fb48f3a8f777) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-17.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 56ac29dfea80) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-18.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 09fd540dfe80) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_2026-08-19.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 5e54d6f290a9) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-04.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 5381c6ebf8a6) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-05.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local c7602694952e) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-07.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c2e7f1c1914) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-09.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 795a24f98e2e) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-10.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local c78aae0dca28) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-12.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local c0f4964f2650) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-13.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 56868ffada8d) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-16.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 97598569e971) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-17.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 6bf5974baa2a) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-18.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local cdb0d30b63e1) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-19.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local afc6e782930f) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-20.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ea36966ef04a) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-23.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 6d4e1538e8a4) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-24.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local ef01db5bc983) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-25.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e01b889b9a5e) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-26.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 784ab6c7b7f4) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-27.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local cee157843ffb) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-28.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local bcb4d60ce633) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-08-29.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local c2cf002ceaa2) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-09-01.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local fb4bf3ced161) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-09-02.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 5caf5508dfe2) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-09-03.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e12289248f8c) |
| `relatorios/defeitos-concreto/diario/relatorio_consolidado_defeitos_concreto_d1_2026-09-07.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local d6df9e00439f) |
| `relatorios/defeitos-concreto/diario/relatorio_defeitos_concreto_d1_2026-08-03.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2a050637d93b) |
| `relatorios/defeitos-concreto/diario/relatorio_defeitos_concreto_d1_2026-08-04.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 66dc3297e050) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-08-18.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local fbd0b68914b3) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-08-19.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1b4f9f537a7c) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-08-26.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 2c3923f3318d) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-08-27.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4687f427b1d9) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-02.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4fb93c484cef) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-03.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7e0e4dd6a38c) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-07.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 0301c6159e54) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-08.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 9b6aa6ebf4ea) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-15.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4c028740f456) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-16.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 70ad559fd5f7) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-21.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 707e82291db4) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-09-28.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 803db9fa9d5b) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-10-01.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b25adcc474a4) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-10-05.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 22024adad775) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-10-12.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e710eff7e84e) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-10-13.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local aff10afe7942) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-10-14.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 3a2460ec5f45) |
| `relatorios/defeitos-concreto/diario/relatorio_pcp_producao_2026-10-15.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7b3bc4177bfd) |
| `relatorios/defeitos-concreto/indicadores-dashboard-defeitos-teste.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local d102d6719570) |
| `relatorios/defeitos-concreto/indicadores-dashboard-defeitos-teste.pdf` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 0051fc7562cd) |
| `relatorios/defeitos-concreto/relatorio_defeitos_concreto_agosto_2026.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 097529bc894a) |
| `relatorios/defeitos-concreto/relatorio_defeitos_concreto_junho_julho_2026.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 1de9577c4db2) |
| `relatorios/defeitos-concreto/relatorio_defeitos_concreto_junho_julho_agosto_2026.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 09b5a62e6b39) |
| `relatorios/defeitos-postes/postes_falha_preenchimento_setores_1_2_setembro_2026.xlsx` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e56bec1c03c2) |
| `relatorios/defeitos-postes/relatorio_defeitos_setores_1_2_setembro_2026.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 576aeea84aff) |
| `relatorios/defeitos-postes/relatorio_defeitos_setores_1_2_setembro_2026.xlsx` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 82dfad088039) |
| `relatorios/pcp-producao/relatorio_pcp_producao_2026-08-03.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local ba0690856c43) |
| `relatorios/pcp-producao/relatorio_pcp_producao_2026-08-10.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 39062f877378) |
| `relatorios/pcp-producao/relatorio_pcp_producao_2026-08-11.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b84aab9c8a62) |
| `relatorios/pcp-producao/relatorio_pcp_producao_2026-08-12.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 46c0ff860df1) |
| `relatorios/pcp-producao/relatorio_pcp_producao_2026-08-18.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local f51e4d256ff0) |
| `relatorios/scripts/defeitos_postes/analise_comparativa_app_vs_planilha_setores_1_2_20260803_20260807_20260817_083940.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 7db788410b1c) |
| `relatorios/scripts/defeitos_postes/analise_comparativa_app_vs_planilha_setores_1_2_20260803_20260814_20260817_101216.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local c762cdfeb4de) |
| `relatorios/scripts/defeitos_postes/analise_comparativa_defeitos_LT-PRO_2026.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 07a7c74aa497) |
| `relatorios/scripts/defeitos_postes/relatorio_comparativo_ago26_ago26_20260803_20260807_20260817_081520.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local f984d97c2121) |
| `relatorios/scripts/defeitos_postes/relatorio_comparativo_ago26_ago26_20260803_20260807_20260817_083717.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 11a07d24d484) |
| `relatorios/scripts/defeitos_postes/relatorio_comparativo_ago26_ago26_20260803_20260814_20260817_101054.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 8e9beba07f0a) |
| `relatorios/scripts/defeitos_postes/relatorio_comparativo_ago26_ago26_20260817_081415.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 9cc0eaaf47cb) |
| `relatorios/scripts/defeitos_postes/relatorio_comparativo_jan26_ago26_20260817_081029.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 3b6d92e29734) |
| `relatorios/scripts/gerar_defeitos_setores_1_2_setembro_2026.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e03b8a6b6f7a) |
| `relatorios/scripts/pcp_producao_agent/.env.example` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 40aac321de50) |
| `relatorios/scripts/pcp_producao_agent/README.md` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 30159090586b) |
| `relatorios/scripts/pcp_producao_agent/agent_pcp_producao.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1910a264434f) |
| `relatorios/scripts/pcp_producao_agent/comparator.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local d0807bedc918) |
| `relatorios/scripts/pcp_producao_agent/concretrack_client.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local e2c256a27f35) |
| `relatorios/scripts/pcp_producao_agent/config.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 783d6603f7d2) |
| `relatorios/scripts/pcp_producao_agent/google_sheets_client.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local ce1863505391) |
| `relatorios/scripts/pcp_producao_agent/html_report.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b257ae26bbb0) |
| `relatorios/scripts/pcp_producao_agent/requirements.txt` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local cf8318d09ad7) |
| `relatorios/scripts/pcp_producao_agent/whatsapp_sender.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local f93ea95c4122) |
| `relatorios/scripts/relatorio_defeitos_concreto_mtd_v4.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a70ed400528) |
| `relatorios/scripts/relatorios/pcp-producao/relatorio_pcp_producao_2026-08-14.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local ce93241ecaaa) |
| `relatorios/scripts/relatorios/pcp-producao/relatorio_pcp_producao_2026-08-17.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local d5f8620ac356) |
| `relatorios/scripts/relatorios/pcp-producao/relatorio_pcp_producao_2026-08-19.html` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 4bb7812e48ee) |
| `remote-erp/api/routers/estoque.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/api/routers/relatorios.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/list_tables.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/assets/img/logo-concrefer.png` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/estoque/acerto/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/estoque/consumo/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/estoque/entrada/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/estoque/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/estoque/mapeamento-agregados/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/estoque/saldo/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/relatorios/fechamento-diario/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/public/relatorios/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-erp/requirements.txt` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-mapa/app.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-mapa/index.html` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-mapa/sw.js` | mapa | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-pcp/alocacao_formas_service.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-pcp/config.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-pcp/etiquetas.index.html` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-pcp/google_sheets_repository.py` | pcp | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-ribeirao/auth.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-ribeirao/cec-etiquetas.index.html` | qualidade | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-ribeirao/main.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-ribeirao/trocar-senha.index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `remote-ribeirao/usuarios.index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `scripts/audit_supabase_legacy_mirror.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local fc8883847715) |
| `scripts/build_painel_tv_catalog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local abaf8e6f93fe) |
| `scripts/build_painel_tv_frontend.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 3c43b9db97cd) |
| `scripts/build_unificado_screen_catalog.js` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local de9f6ec05173) |
| `scripts/check_supabase_legacy_mirror.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 8a219938b4de) |
| `scripts/check_supabase_mirror_acceptance.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 4773e6ffcbdd) |
| `scripts/create_laboratorio_homolog_env.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 693f4eae2590) |
| `scripts/export_supabase_rest_snapshot.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 1d206f0d631d) |
| `scripts/extract_pederneiras_pdf.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 62250a834ff0) |
| `scripts/generate_maodeobra_pwa_icons.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local c8a819cc5cba) |
| `scripts/import_formas_catalog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 02a76f1d796e) |
| `scripts/mark_unificado_homolog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local f5a302a77119) |
| `scripts/painel-tv/compare_s4_product_codes_readonly.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 5afe8d408dc3) |
| `scripts/painel-tv/compare_sheet_allocation_readonly.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local d28b25b939ce) |
| `scripts/painel-tv/deactivate_rolled_back_account.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 5f5690a74475) |
| `scripts/painel-tv/deploy-homolog.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 628309cabe24) |
| `scripts/painel-tv/deploy-prod.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local cd06dd87877c) |
| `scripts/painel-tv/dryrun_october_import_homolog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 1847846e9b21) |
| `scripts/painel-tv/enable_tv_login_session.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 15d426ca3e82) |
| `scripts/painel-tv/import_october_20261016_production.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 4ae0dac61b48) |
| `scripts/painel-tv/import_october_homolog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 7ee3ead731ef) |
| `scripts/painel-tv/inspect_homolog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 2731d4bb3aa2) |
| `scripts/painel-tv/inspect_padrao_monthly_readonly.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local fe9c48264e15) |
| `scripts/painel-tv/inspect_prod_environment.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 1d93c53e145b) |
| `scripts/painel-tv/inspect_prod_indexes.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local d9c7c1ac87bf) |
| `scripts/painel-tv/inspect_prod_s34_rows_readonly.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 8940a3138ff4) |
| `scripts/painel-tv/inspect_sheet_readonly.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local f098f41a3496) |
| `scripts/painel-tv/mapa_s4_codes_readonly.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 84b06b93c651) |
| `scripts/painel-tv/mapa_status_s34_readonly.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local d58cfda6afdb) |
| `scripts/painel-tv/package-prod-candidate.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 8bd503f61fcc) |
| `scripts/painel-tv/patch_homolog_mapa_app.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 93a73af9be24) |
| `scripts/painel-tv/prepare_prod_candidate.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 1fb83a8f0d00) |
| `scripts/painel-tv/provision_tv_login.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 3d3145efc539) |
| `scripts/painel-tv/refresh_oct16_mapa_homolog.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local c2df7f075744) |
| `scripts/painel-tv/rollback-prod.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 625644f68770) |
| `scripts/painel-tv/rollback_october_20261016_production.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 5f8c164bb166) |
| `scripts/painel-tv/scan_entrada_sheet_readonly.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local b60489d1d6c9) |
| `scripts/painel-tv/setup-homolog-reader.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 87ad643b51fa) |
| `scripts/painel-tv/setup-prod-reader.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local beb35861dc78) |
| `scripts/painel-tv/snapshot_october_sheet.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 4ed88432f797) |
| `scripts/painel-tv/verify_prod_tv_account.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local e2b6145ded03) |
| `scripts/patch_old_mapa_dashboards.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local db6268bc4359) |
| `scripts/patch_unificado_producao.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local d1b1f4ef7904) |
| `scripts/patch_unificado_screen_access_nginx.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local cefe4ecccabc) |
| `scripts/porting/a1_password_recovery.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 629191a1eeb8) |
| `scripts/porting/a6_ged_destination.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local bc227b088812) |
| `scripts/porting/a6_ged_qr_frontend_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ad7ce39ced46) |
| `scripts/porting/a6_ged_qr_smoke.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local efebc22b77b4) |
| `scripts/porting/a6_old_export.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local ce6449654e12) |
| `scripts/porting/a6_old_redirect.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local a27a7c17cbbc) |
| `scripts/porting/append_a5_evidence.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 6265cfdcca04) |
| `scripts/porting/append_a5_inventory.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 99095c378709) |
| `scripts/porting/apply_alex_files.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local ec805f22d47f) |
| `scripts/porting/apply_campinas_migration.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 8b54fa078c75) |
| `scripts/porting/backup_ged_qualidade.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 9ebdef882a64) |
| `scripts/porting/backup_maodeobra_mobile_prod.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 05d42819a444) |
| `scripts/porting/build_maodeobra_overlay.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 5bea6ba76168) |
| `scripts/porting/c1_migrate_rnc.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local e83a4967c569) |
| `scripts/porting/c1_prepare_ensayo.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local bc288da724ed) |
| `scripts/porting/c2_switch_readonly.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 2d728aa75560) |
| `scripts/porting/capture_estoque_layout.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 61f9f976656b) |
| `scripts/porting/check_ged_frontend_env.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e07f5daadbff) |
| `scripts/porting/check_ged_verify_bundle.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local a7c00e169df8) |
| `scripts/porting/clone_alex_homolog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local e0e4a2eafe32) |
| `scripts/porting/create_ged_homolog_env.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 14ad05c924ea) |
| `scripts/porting/deploy_maodeobra_mobile_prod.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 7b3e8958a562) |
| `scripts/porting/finalize_lab_usinas_menu.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local c36318f133be) |
| `scripts/porting/fix_homolog_pcp_auth_status.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local d337a7931b4c) |
| `scripts/porting/fix_homolog_pcp_missing_token.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 62e873608175) |
| `scripts/porting/ged-preview-nginx-test.conf` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local dc9d0de2fb99) |
| `scripts/porting/ged-unificado-preview.conf` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 3cb8995cbd96) |
| `scripts/porting/ged_layout_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d439d97f508e) |
| `scripts/porting/ged_link_alex.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ac293bff9129) |
| `scripts/porting/ged_menu_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 3355ad32cfdf) |
| `scripts/porting/ged_preview_logfix_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d603032874f2) |
| `scripts/porting/ged_preview_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 308acbcef28f) |
| `scripts/porting/ged_users_guard_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local e3b42ddbf3a4) |
| `scripts/porting/ged_users_page_switch.sh` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local f2cfda9d1ae2) |
| `scripts/porting/install_maodeobra_public.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 7bb857fd32dd) |
| `scripts/porting/marcelo_master_ged.psql` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 146bbb3c91d2) |
| `scripts/porting/menu_modelo_a_overlay.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 72e232164a90) |
| `scripts/porting/menu_modelo_a_publish.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 840e49e8d7bc) |
| `scripts/porting/patch_lab_usinas_permissions.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 3c323fcfd1c6) |
| `scripts/porting/patch_lab_usinas_reports.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 981aae9db23a) |
| `scripts/porting/prepare_a6_nginx_syntax_test.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 8fb15c2272b1) |
| `scripts/porting/prepare_c2_compose.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local e12d1b226466) |
| `scripts/porting/prepare_ged_redirect.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 50e2a32af37e) |
| `scripts/porting/prepare_maodeobra_homolog_rehearsal.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local bbb40144409c) |
| `scripts/porting/prepare_maodeobra_mobile_nginx.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local c96312830775) |
| `scripts/porting/prepare_maodeobra_mobile_prod.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local a9ac75581c1a) |
| `scripts/porting/promote_second_master.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 1fa31109fa37) |
| `scripts/porting/quality_cleanup.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 16e4d94f3604) |
| `scripts/porting/rehearse_maodeobra_homolog.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local ed73653a1493) |
| `scripts/porting/rehearse_maodeobra_nginx_homolog.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 73d60cf037fb) |
| `scripts/porting/restore_maodeobra_public_permissions.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 1f40c66e05e6) |
| `scripts/porting/rollback_maodeobra_mobile_prod.sh` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 685294d9f49e) |
| `scripts/porting/sanitize_ged_next_logs.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 094a59b4fd21) |
| `scripts/porting/snapshot_maodeobra_public_permissions.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 5c27044e4797) |
| `scripts/porting/switch_ged_three_masters.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 316784533fde) |
| `scripts/porting/verify_maodeobra_public_access.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local b39ae2066dc2) |
| `scripts/qualidade_regression_gate.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 68faca454334) |
| `scripts/refresh_mapa_cutover_ops.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 1f0775661cf3) |
| `scripts/rollback_mapa_dashboards_20261007.ps1` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a0af6d6eb72) |
| `scripts/seed_pederneiras_produtos.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 58f921b3d75f) |
| `scripts/sync_supabase_legacy_tables.py` | deploy | B | sem equivalente no escopo vivo da VPS (SHA256 local 3d79e065de2f) |
| `scripts/version_laboratorio_dimensions.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 271ba078cb65) |
| `test-results/.last-run.json` | geral | C | árvore temporária |
| `test-results/blocker-065/matrix-0.6.7-final.json` | geral | C | árvore temporária |
| `test-results/blocker-065/matrix-consolidated.json` | geral | C | árvore temporária |
| `test-results/blocker-065/matrix-first-pass.json` | geral | C | árvore temporária |
| `test-results/blocker-065/matrix.json` | geral | C | árvore temporária |
| `test-results/blocker-065/pcp-pair.json` | pcp | C | árvore temporária |
| `test-results/blocker-065/rerun-apontador-s4-tablet-deitado.json` | geral | C | árvore temporária |
| `test-results/blocker-065/rerun-gerencia-s4-tablet-deitado.json` | geral | C | árvore temporária |
| `test-results/blocker-065/rerun-gestor-s4-desktop.json` | geral | C | árvore temporária |
| `test-results/blocker-065/rerun-gestor-s4-tablet-em-pe.json` | geral | C | árvore temporária |
| `test-results/issue-20261007-menu.json` | geral | C | árvore temporária |
| `test-results/porting/office-viewer-FL-SGQ-01.png` | geral | C | árvore temporária |
| `test-results/porting/office-viewer-IT-CQC-03.png` | geral | C | árvore temporária |
| `test-results/porting/office-viewer-after.png` | geral | C | árvore temporária |
| `tests/auth/quality_identity_gate_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e0379e8852d5) |
| `tests/auth/test_lab_usinas_reporting_access.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 87ceba393be5) |
| `tests/auth/test_quality_adopt_pcp_preserves_hash_db.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 816ac8e4da7e) |
| `tests/auth/test_quality_pcp_link_live_e2e.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 2a7dbf80a5f5) |
| `tests/auth/test_quality_screen_access.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local d2b25735c810) |
| `tests/mapa-inspection-save-timeout.test.js` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 551ad737d45b) |
| `tests/mapa/test_photo_proxy_access.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 4bec33746db8) |
| `tests/pcp-standard-labels.test.js` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 0017bd064d27) |
| `tests/pcp/additive_save_smoke.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local c74bac7d5380) |
| `tests/pcp/dashboard_navigation_smoke.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local f6241b448c4c) |
| `tests/pcp/maodeobra-core.test.cjs` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 6259817f8188) |
| `tests/pcp/maodeobra_confirm_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local dfb1b0d59086) |
| `tests/pcp/maodeobra_confirm_ios_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 3694f4789a40) |
| `tests/pcp/maodeobra_grupos_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 013f8de52505) |
| `tests/pcp/maodeobra_installer_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 68d815f056f6) |
| `tests/pcp/maodeobra_prod_smoke.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 7824b7e02ba8) |
| `tests/pcp/maodeobra_prototype_stepper.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 18c68070a6b8) |
| `tests/pcp/maodeobra_stage2_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 6603edbd7327) |
| `tests/pcp/maodeobra_stage3_access_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 383a8fa12d61) |
| `tests/pcp/maodeobra_stage3_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 934811ab16ff) |
| `tests/pcp/maodeobra_stage3_ios_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 594b8d6e6546) |
| `tests/pcp/maodeobra_stage3_stepper_homolog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 6b602b050889) |
| `tests/pcp/test_google_sheet_month_routing.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 83327b0c432a) |
| `tests/pederneiras/test_catalog.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 0dd1a74de58a) |
| `tests/pederneiras/test_exports.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local b32c18c94975) |
| `tests/pederneiras/test_rules.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 0dec82bc0943) |
| `tests/porting/joaog_menu_diagnostic.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 2f0df8d20ca3) |
| `tests/porting/production_users_editor_diagnostic.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local cd4adc7788fd) |
| `tests/porting/quality_catalog_patch_isolated.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 02a1873f8c1c) |
| `tests/porting/test_a1_password_recovery.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local eb5715d64f67) |
| `tests/unificado-inspection-photo-routing.test.js` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local f08493dfdd00) |
| `tests/unificado-producao-operacao.test.js` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e2ae3eecbace) |
| `tests/unificado/alex_ged_browser_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 44c10471a3c4) |
| `tests/unificado/ged_a5_20_25_boundaries.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 978133679a74) |
| `tests/unificado/ged_a5_20_exact_final.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 93f8ca1efed3) |
| `tests/unificado/ged_a5_50m_boundary.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 14af8d6a7463) |
| `tests/unificado/ged_a5_assets_readonly.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 1d0acd34686c) |
| `tests/unificado/ged_a5_live.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local eb2b232af9a8) |
| `tests/unificado/ged_a5_login_nojs.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 6a73706ab4a5) |
| `tests/unificado/ged_a5_remaining_live.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 04588b5740a0) |
| `tests/unificado/ged_a5_warning_diagnostic.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c87428903557) |
| `tests/unificado/ged_a5_warning_local_realdata.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 31a20f471c92) |
| `tests/unificado/ged_a5_warning_local_render.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 37ad709c4006) |
| `tests/unificado/ged_a5_warning_selector_check.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local d6fb50535f42) |
| `tests/unificado/ged_a5_warning_ui.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b7ce3dcd9a00) |
| `tests/unificado/ged_admin_guard_unlinked.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a8360567f8e) |
| `tests/unificado/ged_embed_isolated.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local eccfcce2d77c) |
| `tests/unificado/ged_homolog_blink_capture.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c3d9bbd778eb) |
| `tests/unificado/ged_homolog_session_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 61d31be579cb) |
| `tests/unificado/ged_layout_captures.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local aeb434006e61) |
| `tests/unificado/ged_layout_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ac1b659f12f6) |
| `tests/unificado/ged_menu_candidate_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 7f291040de9f) |
| `tests/unificado/ged_menu_diagnostic.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 754fa5c87128) |
| `tests/unificado/ged_nativo_visual_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 161851c88924) |
| `tests/unificado/ged_office_browser_probe.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b9ff620588d0) |
| `tests/unificado/ged_office_viewer_probe.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 229f327a2104) |
| `tests/unificado/ged_session_shell_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local c1c9c492773a) |
| `tests/unificado/ged_signed_preview_probe.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 935aa71f45a2) |
| `tests/unificado/ged_sso_isolated_contract.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 18f5ab1e8a97) |
| `tests/unificado/ged_sso_office_qr_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b665b6edf64c) |
| `tests/unificado/ged_sso_published_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ac67b28b7901) |
| `tests/unificado/homolog_session.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local b734a6ed41a2) |
| `tests/unificado/laboratorio_navigation_smoke.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 178a83218742) |
| `tests/unificado/marcelo_ged_browser_smoke.py` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local ff4b092f7df3) |
| `tests/unificado/marcelo_master_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 83aa1246330e) |
| `tests/unificado/modelo_a_capture.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local a604dd0a317d) |
| `tests/unificado/modelo_a_gate.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local eef6eeb73c7d) |
| `tests/unificado/modelo_a_prod_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local dc8c753a7076) |
| `tests/unificado/modelo_a_routes.mjs` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 1bb9a76c0040) |
| `tests/unificado/painel_tv_campinas_diagnostic_capture.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 359b972e41fa) |
| `tests/unificado/painel_tv_homolog_capture.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local de8563e7cc02) |
| `tests/unificado/painel_tv_homolog_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 0bed8def2287) |
| `tests/unificado/painel_tv_mapa_prod_capture.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 96b4d009bf13) |
| `tests/unificado/painel_tv_menu_prod_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 6d923b048326) |
| `tests/unificado/painel_tv_prod_account.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local d2b63581376d) |
| `tests/unificado/painel_tv_prod_account_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e6e05ba77db1) |
| `tests/unificado/painel_tv_prod_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 96cabb56a682) |
| `tests/unificado/painel_tv_service_account.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 73cf08c05548) |
| `tests/unificado/painel_tv_short_login_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 45ed02830b91) |
| `tests/unificado/qualidade_additive_nc_smoke.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 4542e0bc72fc) |
| `tests/unificado/qualidade_additive_triage_smoke.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local afd7f666dc71) |
| `tests/unificado/qualidade_lote2_attachment_live.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local aa9ccb3fb57c) |
| `tests/unificado/qualidade_lote2_auth_probe.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local db04cae1e18a) |
| `tests/unificado/qualidade_lote2_b5_live.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local a5151b6477d0) |
| `tests/unificado/qualidade_lote2_concession_live.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 2671cdcfd3cc) |
| `tests/unificado/qualidade_lote2_negative_live.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local d3a4fa202abc) |
| `tests/unificado/qualidade_lote2_pcp_menu_live.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b010464c39f7) |
| `tests/unificado/qualidade_lote2_ricardo_context_remote.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local d04c1447c39d) |
| `tests/unificado/qualidade_navigation_smoke.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 5da5cb21a2c9) |
| `tests/unificado/quality_editor_presets_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e27b4ecaf7ef) |
| `tests/unificado/quality_flsgq07_capture.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local e4a90077747c) |
| `tests/unificado/quality_flsgq07_homolog_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local f23b9cd64853) |
| `tests/unificado/quality_flsgq07_prod_browser.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 89ef43171238) |
| `tests/unificado/quality_flsgq07_prod_smoke.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local bc0c80dcf3a7) |
| `tests/unificado/quality_layout_capture.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 42ab6f30cba3) |
| `tests/unificado_mandril_report_ui.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 9cc4f1ed223e) |
| `tmp/a5-calibrationController.remote.js` | geral | C | árvore temporária |
| `tmp/a5-documentController.remote.js` | geral | C | árvore temporária |
| `tmp/a5-login.remote.tsx` | geral | C | árvore temporária |
| `tmp/a5-taskController.before-limit.js` | geral | C | árvore temporária |
| `tmp/a5-taskController.remote.js` | geral | C | árvore temporária |
| `tmp/c1-ensaio-report.json` | geral | C | árvore temporária |
| `tmp/dashboard-kpi-inline-check.js` | geral | C | árvore temporária |
| `tmp/kpi-deploy-dashboard-check.js` | geral | C | árvore temporária |
| `tmp/kpi-deploy-dashboard.html` | geral | C | árvore temporária |
| `tmp/kpi-deploy-map-index.html` | geral | C | árvore temporária |
| `tmp/kpi-remote-dashboard-schema.py` | geral | C | árvore temporária |
| `tmp/kpi-remote-dashboard-service.py` | geral | C | árvore temporária |
| `tmp/kpi-remote-dashboard.html` | geral | C | árvore temporária |
| `tmp/kpi-remote-map-bridge.css` | geral | C | árvore temporária |
| `tmp/kpi-remote-map-bridge.js` | geral | C | árvore temporária |
| `tmp/kpi-remote-map-index.html` | geral | C | árvore temporária |
| `tmp/lote1-pcp-fix/app.py` | pcp | C | árvore temporária |
| `tmp/lote1-pcp-fix/auth.remote-before-quality.js` | pcp | C | árvore temporária |
| `tmp/lote1-pcp-fix/install_ged_nginx.py` | pcp | C | árvore temporária |
| `tmp/lote1-pcp-fix/install_quality_adoption.py` | pcp | C | árvore temporária |
| `tmp/lote1-pcp-fix/install_quality_gateway.py` | pcp | C | árvore temporária |
| `tmp/lote1-pcp-fix/install_quality_nginx.py` | pcp | C | árvore temporária |
| `tmp/lote1-pcp-fix/unified_auth.remote-before-adoption.py` | pcp | C | árvore temporária |
| `tmp/lote1-remote-before/app.after-pcp.py` | pcp | C | árvore temporária |
| `tmp/lote1-remote-before/app.py` | geral | C | árvore temporária |
| `tmp/lote1-remote-before/menu.config.js` | geral | C | árvore temporária |
| `tmp/lote1-remote-before/router.js` | geral | C | árvore temporária |
| `tmp/lote1-remote-before/screen_access.py` | geral | C | árvore temporária |
| `tmp/lote1-remote-before/screen_catalog.json` | geral | C | árvore temporária |
| `tmp/lote1-remote-before/shell.js` | geral | C | árvore temporária |
| `tmp/lote1-remote-before/users-unificado.js` | geral | C | árvore temporária |
| `tmp/lote2-app.remote-before-menu.py` | geral | C | árvore temporária |
| `tmp/lote2-b4-remote/pcp-main.py` | pcp | C | árvore temporária |
| `tmp/lote2-b4-remote/quality-api.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/append_doc.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/candidate/lab-novo-postes/assets/novo-BgF__gOR.js` | geral | C | árvore temporária |
| `tmp/lote2-b4/candidate/lab-novo-postes/assets/novo-CZ3HwR52.css` | geral | C | árvore temporária |
| `tmp/lote2-b4/candidate/lab-novo-postes/novo.html` | geral | C | árvore temporária |
| `tmp/lote2-b4/candidate/pcp-main.py` | pcp | C | árvore temporária |
| `tmp/lote2-b4/candidate/pcp_catalog.py` | pcp | C | árvore temporária |
| `tmp/lote2-b4/candidate/qualidade_catalogo.py` | qualidade | C | árvore temporária |
| `tmp/lote2-b4/candidate/quality-api.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/candidate/quality-migration.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/candidate/quality-models.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/check_admin_probes.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/deploy.sh` | geral | C | árvore temporária |
| `tmp/lote2-b4/diag_home.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/diag_lab_access.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/diag_quality.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/grant_lab_probe.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/lab-probe-screens-before.json` | geral | C | árvore temporária |
| `tmp/lote2-b4/patch_lab_novo.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/quality-api.active.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/quality-nav-subset.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/quality-rules.active.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/quality-timeout-diagnostic.png` | geral | C | árvore temporária |
| `tmp/lote2-b4/rollback.sh` | geral | C | árvore temporária |
| `tmp/lote2-b4/smoke_https.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/stage.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/update_doc_final.py` | geral | C | árvore temporária |
| `tmp/lote2-b4/verify_contract.py` | geral | C | árvore temporária |
| `tmp/lote2-ged-nginx.before.conf` | ged | C | árvore temporária |
| `tmp/lote2-index.remote-before-menu.html` | geral | C | árvore temporária |
| `tmp/lote2-install-ged-nginx.py` | ged | C | árvore temporária |
| `tmp/lote2-install-menu.py` | geral | C | árvore temporária |
| `tmp/lote2-mapa-index.menu.html` | mapa | C | árvore temporária |
| `tmp/lote2-mapa-index.remote-before-menu.html` | mapa | C | árvore temporária |
| `tmp/lote2-reinstall-menu.py` | geral | C | árvore temporária |
| `tmp/lote2-rollback-menu.py` | geral | C | árvore temporária |
| `tmp/lote2-shell.remote-before-menu.js` | geral | C | árvore temporária |
| `tmp/lote2-sw.remote-before-menu.js` | geral | C | árvore temporária |
| `tmp/lote2-users.remote-before-menu.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-app.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-auth.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-grupos.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-model.py` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-nginx-before.conf` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-page.html` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-pcp.py` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/backend/app/api/routers/pcp.py` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/backend/app/models/producao.py` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/backend/app/schemas/producao.py` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/migrations/20261017_maodeobra_confirmacao.psql` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/migrations/20261017_maodeobra_confirmacao_rollback.psql` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/migrations/20261017_maodeobra_mobile_metadata.psql` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/migrations/20261017_maodeobra_mobile_metadata_rollback.psql` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/nginx/concrefer.concretrack.com.br` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/entry.css` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/entry.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/icons/apple-touch-icon.png` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/icons/icon-192.png` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/icons/icon-512.png` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/icons/icon-maskable-512.png` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/index.html` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/login.html` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/manifest.webmanifest` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/m/maodeobra/sw.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/pcp/maodeobra/index.html` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/pcp/static/css/maodeobra-mobile.css` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/pcp/static/js/app.js` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/pcp/static/js/maodeobra-core.js` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/pcp/static/js/maodeobra-grupos.js` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/pcp/static/js/maodeobra-mobile.js` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-release/public/unificado/shell/auth.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-schema.py` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-snapshot/app.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-snapshot/auth.js` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-snapshot/model.py` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-snapshot/page.html` | geral | C | árvore temporária |
| `tmp/maodeobra-prod-snapshot/pcp.py` | pcp | C | árvore temporária |
| `tmp/maodeobra-prod-snapshot/schema.py` | geral | C | árvore temporária |
| `tmp/maodeobra-staging-index.html` | geral | C | árvore temporária |
| `tmp/maodeobra-test-grupos.js` | geral | C | árvore temporária |
| `tmp/maodeobra-test-page.html` | geral | C | árvore temporária |
| `tmp/pdfs/build_guia_pwa_pederneiras.py` | geral | C | árvore temporária |
| `tmp/pdfs/build_relatorio_auditoria_cps.py` | geral | C | árvore temporária |
| `tmp/pdfs/contact-sheet.png` | geral | C | árvore temporária |
| `tmp/pdfs/flsgq07/referencia-00.png` | geral | C | árvore temporária |
| `tmp/pdfs/flsgq07/referencia-atual.png` | geral | C | árvore temporária |
| `tmp/pdfs/flsgq07/rnc-teste.png` | geral | C | árvore temporária |
| `tmp/pdfs/generate_cec_cutover_report.py` | qualidade | C | árvore temporária |
| `tmp/pdfs/gerar_relatorio_montagem_postes.py` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/contact.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-1-final.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-1.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-2.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-3.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-4.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-5.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-6.png` | geral | C | árvore temporária |
| `tmp/pdfs/guia-preview/page-7.png` | geral | C | árvore temporária |
| `tmp/pdfs/login-producao-mobile.png` | geral | C | árvore temporária |
| `tmp/pdfs/pederneiras-export-layout.pdf` | geral | C | árvore temporária |
| `tmp/pdfs/pederneiras-export-layout.png` | geral | C | árvore temporária |
| `tmp/pdfs/pederneiras-export-layout.xlsx` | geral | C | árvore temporária |
| `tmp/pdfs/pederneiras-rodape.png` | geral | C | árvore temporária |
| `tmp/pdfs/preview-page-1.png` | geral | C | árvore temporária |
| `tmp/pdfs/preview-page-2.png` | geral | C | árvore temporária |
| `tmp/pdfs/preview-page-3.png` | geral | C | árvore temporária |
| `tmp/pdfs/preview-page-4.png` | geral | C | árvore temporária |
| `tmp/pdfs/preview-page-5.png` | geral | C | árvore temporária |
| `tmp/pdfs/render_pederneiras_preview.py` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/contact-sheet.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-01.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-02.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-03.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-04.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-05.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-06.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-07.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-08.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-09.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-10.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-11.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-12.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-auditoria-cps/page-13.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/contact-sheet.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/page-01.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/page-02.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/page-03.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/page-04.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/page-05.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered-exportacao/page-06.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-01.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-02.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-03.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-04.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-05.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-06.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-07.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-08.png` | geral | C | árvore temporária |
| `tmp/pdfs/rendered/page-09.png` | geral | C | árvore temporária |
| `tmp/rehearse_maodeobra_homolog_final.sh` | geral | C | árvore temporária |
| `tmp/remote_sheets_service.py` | geral | C | árvore temporária |
| `tmp/unificado-homolog-installer.conf` | geral | C | árvore temporária |
| `unificado/.codex-tmp-maodeobra-refresh/app.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/auth.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/entry.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/login.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/shell.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/smoke_refresh.py` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/sw.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/unificado-bridge.js` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/.codex-tmp-maodeobra-refresh/unificado-index.html` | geral | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/assets/img/faleaqui-icon.png` | geral | A | igual a public/unificado/assets/img/faleaqui-icon.png (SHA256 normalizado 571108b3e41b) |
| `unificado/assets/img/pederh-icon.png` | geral | A | igual a public/unificado/assets/img/pederh-icon.png (SHA256 normalizado 4b9b59eea959) |
| `unificado/ged-nativo/teste/app.js` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local f73df39ef75e) |
| `unificado/ged-nativo/teste/index.html` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local b11f6287f3b7) |
| `unificado/ged-nativo/teste/style.css` | ged | B | sem equivalente no escopo vivo da VPS (SHA256 local 5e742445d9ee) |
| `unificado/laboratorio/frontend/index.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 148eae66657b) |
| `unificado/laboratorio/frontend/novo.html` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 23c85ac6351c) |
| `unificado/laboratorio/frontend/package-lock.json` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 177b1ed6fdec) |
| `unificado/laboratorio/frontend/package.json` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local f683e010d853) |
| `unificado/laboratorio/frontend/src/AbsorptionModule.tsx` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 6096248e0cf5) |
| `unificado/laboratorio/frontend/src/domain/catalog-dimensions.test.ts` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local fe2171bdf6d3) |
| `unificado/laboratorio/frontend/src/domain/regras.test.ts` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 8783cfe45da7) |
| `unificado/laboratorio/frontend/src/domain/regras.ts` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 3ef9c884cae8) |
| `unificado/laboratorio/frontend/src/main.tsx` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local f4dfcab491bc) |
| `unificado/laboratorio/frontend/src/novo/PreviewAbsorptionModule.tsx` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local d4a64650b305) |
| `unificado/laboratorio/frontend/src/novo/body.inc` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 35bbec22e4f8) |
| `unificado/laboratorio/frontend/src/novo/build_postes.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 3c32d7d45ee8) |
| `unificado/laboratorio/frontend/src/novo/postes.css` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 487a439ab56c) |
| `unificado/laboratorio/frontend/src/novo/postes.tsx` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local c2b81715a840) |
| `unificado/laboratorio/frontend/src/styles.css` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 7084475fbb65) |
| `unificado/laboratorio/frontend/src/tokens.css` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 8946aeba2888) |
| `unificado/laboratorio/frontend/tsconfig.json` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 3913a4e45921) |
| `unificado/laboratorio/frontend/tsconfig.tsbuildinfo` | laboratorio | C | artefato gerado |
| `unificado/laboratorio/frontend/vite.config.ts` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local d85b9981c647) |
| `unificado/laboratorio/frontend/vite.novo.config.ts` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 0631e7123270) |
| `unificado/laboratorio/nginx-laboratorio.conf` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local f20fac9d84cb) |
| `unificado/laboratorio/server/static/novo/postes/assets/novo-Be6zfux8.js` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/laboratorio/server/static/novo/postes/assets/novo-DjB69vGe.css` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/laboratorio/server/static/novo/postes/novo.html` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/laboratorio/server/static/postes/assets/index-B5pLu2Wm.css` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/laboratorio/server/static/postes/assets/index-S1adWnWg.js` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/laboratorio/server/static/postes/index.html` | laboratorio | C | cópia temporária/snapshot; fonte canônica preservada |
| `unificado/laboratorio/service/laboratorio-unificado.service` | laboratorio | B | difere de laboratorio/service/laboratorio-unificado.service (local 670f31df177a, VPS 53d0faa00e8d) |
| `unificado/laboratorio/service/requirements.txt` | laboratorio | A | igual a laboratorio/service/requirements.txt (SHA256 normalizado 64ad9924d474) |
| `unificado/laboratorio/service/server/__init__.py` | laboratorio | A | igual a laboratorio/service/server/__init__.py (SHA256 normalizado 8b2966b9c8b3) |
| `unificado/laboratorio/service/server/absorcao_sheet.py` | laboratorio | A | igual a laboratorio/service/server/absorcao_sheet.py (SHA256 normalizado 28f910f8572a) |
| `unificado/laboratorio/service/server/app.py` | laboratorio | A | igual a laboratorio/service/server/app.py (SHA256 normalizado eaf35b2cfd4b) |
| `unificado/laboratorio/service/server/assets/concrefer_logo.png` | laboratorio | A | igual a laboratorio/service/server/assets/concrefer_logo.png (SHA256 normalizado 48c459ded0f3) |
| `unificado/laboratorio/service/server/cec_api.py` | laboratorio | A | igual a laboratorio/service/server/cec_api.py (SHA256 normalizado c2b3450dd6f6) |
| `unificado/laboratorio/service/server/postes_api.py` | laboratorio | A | igual a laboratorio/service/server/postes_api.py (SHA256 normalizado b6b796341c93) |
| `unificado/laboratorio/service/server/postes_certificates.py` | laboratorio | A | igual a laboratorio/service/server/postes_certificates.py (SHA256 normalizado ea3c88651315) |
| `unificado/laboratorio/service/server/postes_db.py` | laboratorio | A | igual a laboratorio/service/server/postes_db.py (SHA256 normalizado c7b47524f1ad) |
| `unificado/laboratorio/service/server/postes_report_v2.py` | laboratorio | A | igual a laboratorio/service/server/postes_report_v2.py (SHA256 normalizado 9188b95e491e) |
| `unificado/laboratorio/service/server/postes_reports.py` | laboratorio | A | igual a laboratorio/service/server/postes_reports.py (SHA256 normalizado 4f9b3ce5def1) |
| `unificado/laboratorio/service/server/postes_rules.py` | laboratorio | A | igual a laboratorio/service/server/postes_rules.py (SHA256 normalizado 49e73baf87eb) |
| `unificado/laboratorio/service/server/slump_api.py` | laboratorio | A | igual a laboratorio/service/server/slump_api.py (SHA256 normalizado afa84733f422) |
| `unificado/laboratorio/service/server/static/cec/analise/api-client.js` | laboratorio | A | igual a laboratorio/service/server/static/cec/analise/api-client.js (SHA256 normalizado bef3aa113ac6) |
| `unificado/laboratorio/service/server/static/cec/analise/assets/img/concre.png` | laboratorio | A | igual a laboratorio/service/server/static/cec/analise/assets/img/concre.png (SHA256 normalizado 7551b563f369) |
| `unificado/laboratorio/service/server/static/cec/analise/index.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/analise/index.html (local ff04d1d0614c, VPS d0c1a8eeeca3) |
| `unificado/laboratorio/service/server/static/cec/analise/manifest.json` | laboratorio | A | igual a laboratorio/service/server/static/cec/analise/manifest.json (SHA256 normalizado dc6b2084e685) |
| `unificado/laboratorio/service/server/static/cec/analise/relatorio-icon.svg` | laboratorio | A | igual a laboratorio/service/server/static/cec/analise/relatorio-icon.svg (SHA256 normalizado 945bda2b273d) |
| `unificado/laboratorio/service/server/static/cec/analise/relatorio.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/analise/relatorio.html (local 4cce6002d76d, VPS 739794e2725f) |
| `unificado/laboratorio/service/server/static/cec/analise/resultado-cp.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/analise/resultado-cp.html (local b28391ef0e61, VPS e145ddffb33e) |
| `unificado/laboratorio/service/server/static/cec/analise/sw.js` | laboratorio | B | difere de laboratorio/service/server/static/cec/analise/sw.js (local a5277495e26c, VPS 6592e0d9b450) |
| `unificado/laboratorio/service/server/static/cec/assets/img/PRINCIPAL@2x.png` | laboratorio | A | igual a laboratorio/service/server/static/cec/assets/img/PRINCIPAL@2x.png (SHA256 normalizado 37b5d8cc41cb) |
| `unificado/laboratorio/service/server/static/cec/assets/img/icon-192.png` | laboratorio | A | igual a laboratorio/service/server/static/cec/assets/img/icon-192.png (SHA256 normalizado a59e4a66d10f) |
| `unificado/laboratorio/service/server/static/cec/assets/img/icon-512.png` | laboratorio | A | igual a laboratorio/service/server/static/cec/assets/img/icon-512.png (SHA256 normalizado a14b9447f05a) |
| `unificado/laboratorio/service/server/static/cec/assets/img/logo.png` | laboratorio | A | igual a laboratorio/service/server/static/cec/assets/img/logo.png (SHA256 normalizado 5080b039e746) |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/SOURCES.md` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/bootstrap-icons.min.css` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/bootstrap.bundle.min.js` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/bootstrap.min.css` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/chart.umd.min.js` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459W1hyzbi.woff2` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459WRhyzbi.woff2` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459WZhyzbi.woff2` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459Wdhyzbi.woff2` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/JTUSjIg1_i6t8kCHKm459Wlhyw.woff2` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/bootstrap-icons.woff` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/fonts/bootstrap-icons.woff2` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/html5-qrcode.min.js` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/jspdf.umd.min.js` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/montserrat.css` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/assets/vendor/qrcode.min.js` | laboratorio | C | cache/build/captura gerada |
| `unificado/laboratorio/service/server/static/cec/etiquetas/index.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/etiquetas/index.html (local 75fff8001a0b, VPS 002808958afc) |
| `unificado/laboratorio/service/server/static/cec/index.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/index.html (local 230f028fb1df, VPS 5eb23091e216) |
| `unificado/laboratorio/service/server/static/cec/leitura/index.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/leitura/index.html (local 6fc5dc2d71d0, VPS 4412e409f321) |
| `unificado/laboratorio/service/server/static/cec/leitura/manifest.json` | laboratorio | A | igual a laboratorio/service/server/static/cec/leitura/manifest.json (SHA256 normalizado c147f9222a3c) |
| `unificado/laboratorio/service/server/static/cec/leitura/sw.js` | laboratorio | B | difere de laboratorio/service/server/static/cec/leitura/sw.js (local 655661ea2725, VPS 37c806290cf7) |
| `unificado/laboratorio/service/server/static/cec/relatorio/index.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/relatorio/index.html (local f41abb57c40f, VPS 923f3a2dd202) |
| `unificado/laboratorio/service/server/static/cec/resultados/index.html` | laboratorio | B | difere de laboratorio/service/server/static/cec/resultados/index.html (local e8e20ddcc5a6, VPS 512c46cd319a) |
| `unificado/laboratorio/service/server/static/index.html` | laboratorio | A | igual a laboratorio/service/server/static/index.html (SHA256 normalizado b6df33591180) |
| `unificado/laboratorio/service/server/static/laboratorio-bridge.js` | laboratorio | A | igual a laboratorio/service/server/static/laboratorio-bridge.js (SHA256 normalizado efe58b73da29) |
| `unificado/laboratorio/service/server/static/laboratorio-embedded.css` | laboratorio | A | igual a laboratorio/service/server/static/laboratorio-embedded.css (SHA256 normalizado 13a9f43c0c43) |
| `unificado/laboratorio/service/server/static/novo/assets/fonts/Geist-Bold.woff2` | laboratorio | A | igual a laboratorio/service/server/static/novo/assets/fonts/Geist-Bold.woff2 (SHA256 normalizado 25c8b03dbf96) |
| `unificado/laboratorio/service/server/static/novo/assets/fonts/Geist-Medium.woff2` | laboratorio | A | igual a laboratorio/service/server/static/novo/assets/fonts/Geist-Medium.woff2 (SHA256 normalizado ed653645d0ea) |
| `unificado/laboratorio/service/server/static/novo/assets/fonts/Geist-Regular.woff2` | laboratorio | A | igual a laboratorio/service/server/static/novo/assets/fonts/Geist-Regular.woff2 (SHA256 normalizado 12e7c80de776) |
| `unificado/laboratorio/service/server/static/novo/assets/fonts/GeistMono-Regular.woff2` | laboratorio | A | igual a laboratorio/service/server/static/novo/assets/fonts/GeistMono-Regular.woff2 (SHA256 normalizado 67b27e8a7539) |
| `unificado/laboratorio/service/server/static/novo/assets/fonts/OFL.txt` | laboratorio | A | igual a laboratorio/service/server/static/novo/assets/fonts/OFL.txt (SHA256 normalizado c683bfbcc7e0) |
| `unificado/laboratorio/service/server/static/novo/build_cura.py` | laboratorio | A | igual a laboratorio/service/server/static/novo/build_cura.py (SHA256 normalizado b9ddea5b3c05) |
| `unificado/laboratorio/service/server/static/novo/index.html` | laboratorio | A | igual a laboratorio/service/server/static/novo/index.html (SHA256 normalizado 0034e3083ef2) |
| `unificado/laboratorio/service/server/static/novo/postes/assets/novo-CbdbA7sW.js` | laboratorio | A | igual a laboratorio/service/server/static/novo/postes/assets/novo-CbdbA7sW.js (SHA256 normalizado 29d64ec5ec78) |
| `unificado/laboratorio/service/server/static/novo/postes/metodologia-conteudo.html` | laboratorio | A | conteúdo igual a laboratorio/service/server/static/cronoanalise/metodologia-conteudo.html (SHA256 normalizado 45829075c66a) |
| `unificado/laboratorio/service/server/static/postes/assets/index-B3JJ61-I.js` | laboratorio | A | igual a laboratorio/service/server/static/postes/assets/index-B3JJ61-I.js (SHA256 normalizado 095afa7254dc) |
| `unificado/laboratorio/service/server/static/postes/assets/index-jSh6zGHQ.css` | laboratorio | A | igual a laboratorio/service/server/static/postes/assets/index-jSh6zGHQ.css (SHA256 normalizado 8d44098a6403) |
| `unificado/laboratorio/service/server/static/postes/index.html` | laboratorio | A | igual a laboratorio/service/server/static/postes/index.html (SHA256 normalizado ca7e147c41a8) |
| `unificado/laboratorio/service/server/static/slump/index.html` | laboratorio | A | igual a laboratorio/service/server/static/slump/index.html (SHA256 normalizado 6e0a8f02790e) |
| `unificado/laboratorio/service/server/static/slump/slump.css` | laboratorio | A | igual a laboratorio/service/server/static/slump/slump.css (SHA256 normalizado 1bba502f3c72) |
| `unificado/laboratorio/service/server/static/slump/slump.js` | laboratorio | A | igual a laboratorio/service/server/static/slump/slump.js (SHA256 normalizado f36430e84d7b) |
| `unificado/laboratorio/service/server/static/usinas-relatorios/index.html` | usinas | A | igual a laboratorio/service/server/static/usinas-relatorios/index.html (SHA256 normalizado d4f900751280) |
| `unificado/laboratorio/service/server/static/usinas-relatorios/native-areas.css` | usinas | A | igual a laboratorio/service/server/static/usinas-relatorios/native-areas.css (SHA256 normalizado 91289ac33b85) |
| `unificado/laboratorio/service/server/static/usinas-relatorios/native-areas.js` | usinas | A | igual a laboratorio/service/server/static/usinas-relatorios/native-areas.js (SHA256 normalizado be2e108efd5c) |
| `unificado/laboratorio/service/server/store.py` | laboratorio | A | igual a laboratorio/service/server/store.py (SHA256 normalizado 8677403c9d55) |
| `unificado/laboratorio/service/tests/test_postes_certificates.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 2cb667b1ae03) |
| `unificado/laboratorio/service/tests/test_slump.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local caac56e56797) |
| `unificado/m/maodeobra/entry.css` | geral | A | igual a public/unificado/m/maodeobra/entry.css (SHA256 normalizado 0e6d68e9a6aa) |
| `unificado/m/maodeobra/entry.js` | geral | A | igual a public/unificado/m/maodeobra/entry.js (SHA256 normalizado bce58a04f5d1) |
| `unificado/m/maodeobra/icons/apple-touch-icon.png` | geral | A | igual a public/unificado/m/maodeobra/icons/apple-touch-icon.png (SHA256 normalizado cc52ee10282d) |
| `unificado/m/maodeobra/icons/icon-192.png` | geral | A | igual a public/unificado/m/maodeobra/icons/icon-192.png (SHA256 normalizado 83185ba520a3) |
| `unificado/m/maodeobra/icons/icon-512.png` | geral | A | igual a public/unificado/m/maodeobra/icons/icon-512.png (SHA256 normalizado f723bea65f95) |
| `unificado/m/maodeobra/icons/icon-maskable-512.png` | geral | A | igual a public/unificado/m/maodeobra/icons/icon-maskable-512.png (SHA256 normalizado 245c5bc97fb9) |
| `unificado/m/maodeobra/index.html` | geral | A | igual a public/unificado/m/maodeobra/index.html (SHA256 normalizado e085f3360905) |
| `unificado/m/maodeobra/login.html` | geral | A | igual a public/unificado/m/maodeobra/login.html (SHA256 normalizado e3a3179a3461) |
| `unificado/m/maodeobra/manifest.webmanifest` | geral | A | igual a public/unificado/m/maodeobra/manifest.webmanifest (SHA256 normalizado 4106891d68d2) |
| `unificado/m/maodeobra/prototipo/index.html` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 00e39f8b925b) |
| `unificado/m/maodeobra/prototipo/prototype.css` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 5f80266eb633) |
| `unificado/m/maodeobra/prototipo/prototype.js` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 60f5189aa280) |
| `unificado/m/maodeobra/sw.js` | geral | A | igual a public/unificado/m/maodeobra/sw.js (SHA256 normalizado 77d7cb147dd1) |
| `unificado/mapa/api/action_catalog.json` | mapa | A | igual a mapa-api/action_catalog.json (SHA256 normalizado 7eed3c367a37) |
| `unificado/mapa/api/checklists.json` | mapa | A | igual a mapa-api/checklists.json (SHA256 normalizado c84fa35030fe) |
| `unificado/mapa/api/ged_bridge.py` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local e7ae040d4dde) |
| `unificado/mapa/api/quality_area_catalog.json` | mapa | A | igual a mapa-api/quality_area_catalog.json (SHA256 normalizado 983c9071700b) |
| `unificado/mapa/api/usina_integration.py` | usinas | B | difere de mapa-api/usina_integration.py (local 575fab859ec8, VPS c223f283f976) |
| `unificado/mapa/api/usinas_reporting.py` | usinas | A | igual a mapa-api/usinas_reporting.py (SHA256 normalizado e07b1f3ebcec) |
| `unificado/mapa/database/ged_approved_links_20261016.sql` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 98bdcc1d07dc) |
| `unificado/mapa/database/ged_identity_links_20261016.sql` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 628218451855) |
| `unificado/mapa/database/mapa_login_events.sql` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 3ef145e192a2) |
| `unificado/mapa/database/quality_permissions_20261015.sql` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 90f81dfcbecb) |
| `unificado/mapa/database/user_lifecycle.sql` | mapa | B | sem equivalente no escopo vivo da VPS (SHA256 local 7bdca474da0d) |
| `unificado/mapa/operacao/dashboards-v6.css` | mapa | A | igual a public/unificado/mapa/operacao/dashboards-v6.css (SHA256 normalizado 54e5bf873e21) |
| `unificado/mapa/operacao/dashboards-v6.js` | mapa | A | igual a public/unificado/mapa/operacao/dashboards-v6.js (SHA256 normalizado bf3165870994) |
| `unificado/mapa/operacao/dashboards-v7.css` | mapa | A | igual a public/unificado/mapa/operacao/dashboards-v7.css (SHA256 normalizado 46a48609bcd0) |
| `unificado/mapa/operacao/dashboards-v7.js` | mapa | A | igual a public/unificado/mapa/operacao/dashboards-v7.js (SHA256 normalizado ac28e2fac350) |
| `unificado/mapa/operacao/mandril-report.js` | mapa | A | igual a public/unificado/mapa/operacao/mandril-report.js (SHA256 normalizado ed78f8dec139) |
| `unificado/mapa/operacao/montagem-taxa.css` | mapa | A | igual a public/unificado/mapa/operacao/montagem-taxa.css (SHA256 normalizado ddecb0a25e0e) |
| `unificado/mapa/operacao/montagem-taxa.js` | mapa | A | igual a public/unificado/mapa/operacao/montagem-taxa.js (SHA256 normalizado 153db7ce5b0b) |
| `unificado/mapa/operacao/screen-context.js` | mapa | A | igual a public/unificado/mapa/operacao/screen-context.js (SHA256 normalizado cd826126d4b6) |
| `unificado/mapa/operacao/users-unificado.css` | mapa | A | igual a public/unificado/mapa/operacao/users-unificado.css (SHA256 normalizado b58d1fdb2dd5) |
| `unificado/mapa/operacao/users-unificado.js` | mapa | B | igual apenas a backup da VPS, difere da árvore ativa |
| `unificado/painel-tv/api/app.py` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 18e446f6d526) |
| `unificado/painel-tv/api/formas_fisicas.json` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 24b89591e4cc) |
| `unificado/painel-tv/api/referencias_planilha.json` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local a75d9fe6be84) |
| `unificado/painel-tv/nginx-homolog.conf` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 563ee9cb3265) |
| `unificado/painel-tv/nginx-prod.conf` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local bfde7012b7ca) |
| `unificado/painel-tv/tv-homolog.service` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local 148ddd273cda) |
| `unificado/painel-tv/tv-prod.service` | geral | B | sem equivalente no escopo vivo da VPS (SHA256 local db8d7322bb88) |
| `unificado/pcp/backend/alembic.ini` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 42b83ffc9ede) |
| `unificado/pcp/backend/alembic/env.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 70969f885200) |
| `unificado/pcp/backend/alembic/script.py.mako` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 02d69db1f435) |
| `unificado/pcp/backend/alembic/versions/20261023_01_producao_unidade_expand.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local c925b181f57a) |
| `unificado/pcp/backend/alembic/versions/20261023_02_producao_acesso.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 2dd604d1b195) |
| `unificado/pcp/backend/app/api/routers/producao_unidade.py` | pcp | B | difere de pcp-api/app/api/routers/producao_unidade.py (local 73cdb8d4db0f, VPS 57936fded783) |
| `unificado/pcp/backend/app/api/routers/qualidade_catalogo.py` | pcp | A | igual a pcp-api/app/api/routers/qualidade_catalogo.py (SHA256 normalizado 31a0635f6798) |
| `unificado/pcp/backend/app/services/pederneiras_catalog.py` | pcp | A | igual a pcp-api/app/services/pederneiras_catalog.py (SHA256 normalizado 23b457329f64) |
| `unificado/pcp/backend/app/services/pederneiras_exports.py` | pcp | B | difere de pcp-api/app/services/pederneiras_exports.py (local b72c41dfe385, VPS 90093abe6046) |
| `unificado/pcp/backend/app/services/pederneiras_rules.py` | pcp | B | difere de pcp-api/app/services/pederneiras_rules.py (local 445943d18c0a, VPS 5204d104f25a) |
| `unificado/pcp/backend/migrations/20261016_maodeobra_grupos.psql` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a229b0992c1a) |
| `unificado/pcp/backend/migrations/20261017_maodeobra_confirmacao.psql` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local a312c5da25c4) |
| `unificado/pcp/backend/migrations/20261017_maodeobra_confirmacao_rollback.psql` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 43c57c379091) |
| `unificado/pcp/backend/migrations/20261017_maodeobra_mobile_metadata.psql` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 2ef86efbdf21) |
| `unificado/pcp/backend/migrations/20261017_maodeobra_mobile_metadata_rollback.psql` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 1e0259178595) |
| `unificado/pcp/backend/standard_label_catalog_access.md` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local 752d4579dc95) |
| `unificado/pcp/fechamento-diario/index.html` | pcp | A | igual a public/unificado/pcp/fechamento-diario/index.html (SHA256 normalizado 47023409397e) |
| `unificado/pcp/static/css/maodeobra-mobile.css` | pcp | A | igual a public/unificado/pcp/static/css/maodeobra-mobile.css (SHA256 normalizado 6a154621e612) |
| `unificado/pcp/static/js/maodeobra-core.js` | pcp | A | igual a public/unificado/pcp/static/js/maodeobra-core.js (SHA256 normalizado a667df701964) |
| `unificado/pcp/static/js/maodeobra-grupos.js` | pcp | A | igual a public/unificado/pcp/static/js/maodeobra-grupos.js (SHA256 normalizado 59457f57f6e4) |
| `unificado/pcp/static/js/maodeobra-mobile.js` | pcp | A | igual a public/unificado/pcp/static/js/maodeobra-mobile.js (SHA256 normalizado ea36c04067e8) |
| `unificado/pcp/unificado-screen-context.js` | pcp | A | igual a public/unificado/pcp/unificado-screen-context.js (SHA256 normalizado b835f3e290d3) |
| `unificado/pcp/users-unificado-planning.css` | pcp | A | igual a public/unificado/pcp/users-unificado-planning.css (SHA256 normalizado e10909b463d4) |
| `unificado/pcp/users-unificado-planning.js` | pcp | A | igual a public/unificado/pcp/users-unificado-planning.js (SHA256 normalizado 17d7f753dcae) |
| `unificado/qualidade/.gitignore` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local ed19d3c9c8a5) |
| `unificado/qualidade/frontend/.gitignore` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 292c5dd5d6c7) |
| `unificado/qualidade/frontend/index.html` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 2ca75815c534) |
| `unificado/qualidade/frontend/package-lock.json` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 35f1d8b2b533) |
| `unificado/qualidade/frontend/package.json` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 5f881ac8384a) |
| `unificado/qualidade/frontend/src/PoleResults.tsx` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local f5f72dfa922c) |
| `unificado/qualidade/frontend/src/api.ts` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 2cc78097c895) |
| `unificado/qualidade/frontend/src/main.tsx` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local b7b9854dd709) |
| `unificado/qualidade/frontend/src/style.css` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local bcea8db3ec94) |
| `unificado/qualidade/frontend/tsconfig.json` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local dcb24490f247) |
| `unificado/qualidade/frontend/vite.config.ts` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 3f745e3a916d) |
| `unificado/qualidade/infra/systemd/qualidade-api.service` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 04b215692e26) |
| `unificado/qualidade/infra/systemd/qualidade-outbox.service` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 6ec247f12287) |
| `unificado/qualidade/infra/systemd/qualidade-outbox.timer` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 0073f50c7878) |
| `unificado/qualidade/migrations/alembic.ini` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 4b5e2b579667) |
| `unificado/qualidade/migrations/env.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local a680fdbae843) |
| `unificado/qualidade/migrations/script.py.mako` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local d59cd0c2d423) |
| `unificado/qualidade/migrations/versions/20261015_01_qualidade.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local dde404717186) |
| `unificado/qualidade/migrations/versions/20261015_02_laboratorio_origem.py` | laboratorio | B | sem equivalente no escopo vivo da VPS (SHA256 local 3fe4a6696727) |
| `unificado/qualidade/migrations/versions/20261015_03_numbering_freeze.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 0ce1463a7add) |
| `unificado/qualidade/migrations/versions/20261015_04_campinas.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c40dd88bfb8e) |
| `unificado/qualidade/migrations/versions/20261016_05_fl_sgq_07.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local e54678f034f4) |
| `unificado/qualidade/service/quality/__init__.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local e3b0c44298fc) |
| `unificado/qualidade/service/quality/api.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local ed9d0629a6fc) |
| `unificado/qualidade/service/quality/assets/logo-concrefer.png` | qualidade | B | hash igual a outro ativo da VPS, mas sem destino canônico equivalente |
| `unificado/qualidade/service/quality/auth.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local bdf7d037fee5) |
| `unificado/qualidade/service/quality/db.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 593705ac52ed) |
| `unificado/qualidade/service/quality/fl_sgq_07_pdf.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local fd2a2307c1cc) |
| `unificado/qualidade/service/quality/fl_sgq_07_pdf.py.before-modern` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 4a6d7c63aa81) |
| `unificado/qualidade/service/quality/main.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 43b0e9a3426c) |
| `unificado/qualidade/service/quality/models.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 4e5fd0d88888) |
| `unificado/qualidade/service/quality/outbox.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 472d1c603139) |
| `unificado/qualidade/service/quality/pcp_catalog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local aa536388d193) |
| `unificado/qualidade/service/quality/rules.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c5527ee1169f) |
| `unificado/qualidade/service/requirements.txt` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 702301e5cbf8) |
| `unificado/qualidade/service/tests/test_auth.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local c9c983ad6a16) |
| `unificado/qualidade/service/tests/test_pcp_catalog.py` | pcp | B | sem equivalente no escopo vivo da VPS (SHA256 local b9a72a6d686e) |
| `unificado/qualidade/service/tests/test_permissions.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local e9009a04868e) |
| `unificado/qualidade/service/tests/test_rules.py` | qualidade | B | sem equivalente no escopo vivo da VPS (SHA256 local 5569f69a2961) |
| `unificado/relatorios/fechamento-diario/index.html` | geral | A | igual a public/unificado/relatorios/fechamento-diario/index.html (SHA256 normalizado f637376b96d1) |
| `unificado/shell/home-v2.css` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local be037f80db06) |
| `unificado/shell/home-v2.js` | shell | B | sem equivalente no escopo vivo da VPS (SHA256 local 1841db8c5a94) |
| `unificado/shell/password-visibility.css` | shell | A | igual a public/unificado/shell/password-visibility.css (SHA256 normalizado a0b60a8658fe) |
| `unificado/shell/password-visibility.js` | shell | A | igual a public/unificado/shell/password-visibility.js (SHA256 normalizado 099478266c7a) |
| `unificado/tv/formas/index.html` | geral | A | igual a public/unificado/tv/formas/index.html (SHA256 normalizado 425029ed0342) |
| `unificado/tv/formas/tv.js` | geral | A | igual a public/unificado/tv/formas/tv.js (SHA256 normalizado 392c9a7351e3) |
| `unificado/usinas/concrefer-usinas-reporting-sync.service` | usinas | A | SHA256 normalizado igual à unidade instalada em /etc/systemd/system |
| `unificado/usinas/concrefer-usinas-reporting-sync.timer` | usinas | A | SHA256 normalizado igual à unidade instalada em /etc/systemd/system |
| `unificado/usinas/migrations/004_reporting.sql` | usinas | A | migração representa as 10 tabelas usinas_reporting presentes no banco de produção; SQL não instalado como arquivo |
| `unificado/usinas/reporting_service/__init__.py` | usinas | A | igual a usinas/reporting_service/__init__.py (SHA256 normalizado 0e51b9af23ce) |
| `unificado/usinas/reporting_service/app.py` | usinas | A | igual a usinas/reporting_service/app.py (SHA256 normalizado 99307b5d0179) |
| `unificado/usinas/reporting_service/costs.py` | usinas | A | igual a usinas/reporting_service/costs.py (SHA256 normalizado 9981cec3cf4c) |
| `unificado/usinas/reporting_service/legacy_reports.py` | usinas | A | igual a usinas/reporting_service/legacy_reports.py (SHA256 normalizado 5e855d911081) |
| `unificado/usinas/reporting_service/massadas.py` | usinas | A | igual a usinas/reporting_service/massadas.py (SHA256 normalizado 37d085e03165) |
| `unificado/usinas/reporting_service/parity_digest.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 840ca8be77d8) |
| `unificado/usinas/reporting_service/probe_private.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6eb3c5115623) |
| `unificado/usinas/reporting_service/provision.py` | usinas | A | igual a usinas/reporting_service/provision.py (SHA256 normalizado 0b369fb61723) |
| `unificado/usinas/reporting_service/requirements.txt` | usinas | A | igual a usinas/reporting_service/requirements.txt (SHA256 normalizado 4633ad73efd0) |
| `unificado/usinas/reporting_service/settings.py` | usinas | A | igual a usinas/reporting_service/settings.py (SHA256 normalizado 4449763e4f4f) |
| `unificado/usinas/reporting_service/usinas-reporting.service` | usinas | A | SHA256 normalizado igual à unidade instalada em /etc/systemd/system |
| `unificado/usinas/scripts/patch_reporting_app.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 6ab4ea7eb4b5) |
| `unificado/usinas/sync_reporting.py` | usinas | A | igual a usinas/sync_reporting.py (SHA256 normalizado 0e36e0e30a36) |
| `unificado/usinas/tests/test_reporting_api.py` | usinas | B | sem equivalente no escopo vivo da VPS (SHA256 local 8a0c9674c125) |
