# Exportações do Mapa na rota operacional de testes

Em 03/10/2026, `tests/mapa/e2e/csv_export_parity.py` e `xlsx_export_parity.py` executaram os botões da página original do Mapa e da página publicada com a casca nova, usando **o mesmo PostgreSQL de testes** e a mesma conta sintética de gerência. A página original foi servida a partir do HTML anterior à casca; o `app.js` é o oficial sem edição. Não houve gravação de dados nem requisição a domínio externo. A conta sintética foi removida.

| Saída | Período | Resultado |
|---|---|---|
| CSV de dados de concretagem | 02–03/10/2026 | 191 linhas, conteúdo byte a byte igual; SHA-256 `4ac9c7f9d001ed01382049b2cbe37a199b5036974dd47f58161f267187b8c576`. O nome inclui o instante de geração e difere por essa parte. |
| CSV de paradas | 02–03/10/2026 | 8 linhas, arquivo e nome iguais; SHA-256 `119d24740048c6388e570606e80d54038c37c9cea4a64ff862d9f3a0cbbef6c5`. |
| XLSX de montagem | 01/10/2026 | Abas `Resumo` (17 linhas) e `Base Montagem` (133 linhas) com células iguais, desconsiderando apenas a célula “Gerado em”; SHA-256 lógico `15920604ddbf5db1dc8e487babad47ce833f9eb181717195c6568178dfa8bb7e`. |

O primeiro teste de XLSX revelou uma falha do **servidor novo**: o filtro original `id=in.(...)` para 132 registros tinha linha HTTP de 5.248 bytes e recebia 400 pelo limite de 4.094 bytes do Gunicorn. Após ampliar esse limite apenas em `mapa-unificado-auth.service`, o Nginx respondeu 502 porque o cabeçalho `Content-Location` ultrapassava o buffer de resposta. A configuração testada e publicada está versionada em `infra/systemd/mapa-unificado-auth-long-query.conf` e `infra/nginx/concrefer-unificado-test.conf`; ela aumenta os limites da rota de teste, sem alterar o `app.js`, o backend PCP nem os sistemas oficiais. `nginx -t` passou, o XLSX baixou e as quatro rotas de teste/oficiais verificadas continuaram HTTP 200.

Os arquivos comparados e os relatórios detalhados ficam em `.work-mapa-unificado/e2e/csv-export/` e `xlsx-export/` no espaço de trabalho. Esta comparação usa dados da fotografia de testes. Ainda faltam os outros períodos, perfis e opções de exportação para a certificação integral.
