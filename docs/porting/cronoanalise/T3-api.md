# T3 · API e cálculos

## Implementação

- Router `/api/laboratorio/cronoanalise` no serviço existente do Laboratório, sem serviço ou porta nova.
- Catálogo, medições em lote com UUID idempotente, pausas, invalidação e restauração, importação CSV, filtros e exportação CSV/XLSX, estatística, dimensionamento, configuração e rodadas de simulação.
- Auditoria própria `cronoanalise.auditoria`, usuário `text` validado pela asserção do gateway, unidade `concrefer`.
- Cálculos estatísticos e dimensionamento em Python.

## Verificação

- `python -m pytest -q tests/auth/test_crono_screen_access.py unificado/laboratorio/service/cronoanalise/tests/test_calculos.py unificado/laboratorio/service/cronoanalise/tests/test_permissoes_api.py`: **8 passed**.
- Prova de integração contra banco descartável na VPS: `API_INTEGRATION_OK medicoes=3 auditoria=5`. Incluiu envio duplicado, pausa, detalhe, invalidação, restauração, exportação CSV com BOM e importação repetida.
- `npm test`: **63 passaram, 2 falharam**, as mesmas falhas preexistentes `dashboard-contracts` e `mapa-promocao-producao`.
- Testes do frontend do Laboratório: a mesma fixture preexistente ausente `fl-pro-22.json`; nenhuma falha nova.

O banco descartável `cronoanalise_test_api_20261018` será removido após os testes finais. A inclusão do router em `service/server/app.py` está no diretório de trabalho, mas o arquivo preexistia não rastreado e fica fora deste commit.
