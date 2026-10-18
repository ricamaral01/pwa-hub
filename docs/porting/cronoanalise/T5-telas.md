# T5 · Telas e modo offline

## Implementação

- Sete telas no frontend React do Laboratório, com navegação pela casca do Unificado e barra inferior somente no modo celular.
- Coleta com contexto obrigatório, vários cronômetros, pausas motivadas, finalização com distância obrigatória em deslocamentos, descarte com segundo toque, `wakeLock` e persistência em IndexedDB.
- Fila offline com UUID estável, reenvio e resposta idempotente. A API fica fora do cache do service worker.
- Medições com filtros, detalhe e auditoria, invalidação/restauração, importação CSV e exportação CSV/XLSX; catálogo editável; dimensionamento; simulação em Worker com seis sequências, comparação pareada, layout, tempos, histórico e linha do tempo; metodologia integral da referência, sem cabeçalho próprio.
- Bundle estático servido pelo serviço atual do Laboratório em `/cronoanalise`, com rota pública `/unificado/laboratorio/cronoanalise` protegida pelo gateway existente. Sem serviço, porta ou NGINX novo.

## Verificação

- `scripts/porting/build_cronoanalise.ps1`: TypeScript e Vite sem erros.
- `npm exec -- vitest run src/cronoanalise/engine.test.ts`: 20 passaram, incluindo 18/18 golden após a instrumentação.
- `python tests/porting/cronoanalise_ui.py`: `SIMULATION_WORKER_OK`, `SEVEN_SCREENS_OK`, `OFFLINE_QUEUE_OK`, `UI_WIDTHS_OK desktop=1440 tablet=1194 celular=390`.
- FastAPI `TestClient`: `/cronoanalise`, `/cronoanalise/coletar`, HTML de metodologia e asset JavaScript retornaram HTTP 200.
- Mockups de referência abertos no Chromium pelo Playwright. As capturas locais usam apenas catálogo, layout e parâmetros versionados; ainda não representam a homologação publicada.

## Capturas locais

| Largura | Início | Coleta | Outras telas |
| --- | --- | --- | --- |
| 1440×900 | [início](capturas-T5/inicio-desktop.png) | [coleta](capturas-T5/coletar-desktop.png) | [simulação](capturas-T5/simular-desktop.png), [resultado](capturas-T5/simular-resultado-desktop.png), [dimensionamento](capturas-T5/dimensionar-desktop.png) |
| 1194×834 | [início](capturas-T5/inicio-tablet.png) | [coleta](capturas-T5/coletar-tablet.png) | — |
| 390×844 | [início](capturas-T5/inicio-celular.png) | [coleta](capturas-T5/coletar-celular.png) | [simulação](capturas-T5/simular-celular.png), [dimensionamento](capturas-T5/dimensionar-celular.png) |

Os arquivos preexistentes não rastreados do Laboratório e as alterações anteriores no shell/gateway ficam fora do commit. As alterações de integração necessárias estão no diretório de trabalho; T6a aplicará somente os trechos de Cronoanálise após comparar com a homologação.
