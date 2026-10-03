# Contrato inicial das tabelas do Mapa — 03/10/2026

## Leituras capturadas

`tests/mapa/contract_read_tables.py` extraiu **78 GETs distintos** das 231 entradas capturadas no navegador original, excluindo `usuarios` para não processar senhas em fixtures. Cada consulta foi enviada por GET ao Supabase oficial e ao proxy autenticado de testes, preservando query, `Range` e `Prefer`; nenhum pedido de escrita foi enviado ao oficial. O relatório privado de hashes e formas de diferença está em `/root/mapa-unificado-migration/contract-read-tables.json` na VPS de testes. Resultado: **66/78 respostas com status e corpo iguais na ordem original; 76/78 com os mesmos registros e campos, ignorando apenas a ordem da lista**. As duas restantes são páginas 0 e 1 de `producao` com `order=data_fabricacao.desc`: cada página tem a mesma contagem, mas 39 IDs trocam de página porque muitos registros empatam na data e a consulta não define desempate. A equivalência do conjunto das duas páginas ainda deve ser conferida em um teste explícito de paginação.

A visão `vw_formas_status` da cópia expunha nove campos a menos e dois campos extras. `unificado/mapa/database/api_formas_status.sql` foi reaplicado somente no banco de testes, após backup e restauração verificada, para igualar o conjunto de campos do oficial. Depois da correção, suas 209 linhas têm os mesmos valores em ordem diferente. Não foi alterado o `app.js`.

## Escritas sintéticas

Foi criado PostgREST de escrita **somente em `127.0.0.1:13058`**, conectado a `mapa_unificado_teste` com papel `mapa_api_writer`; o PostgREST de leitura continua em `127.0.0.1:13051`. O proxy Flask de testes escolhe o destino pelo método, exige sessão Mapa em todos os métodos e exige `Origin: https://concrefer.concretrack.com.br` para escrita. `usuarios` e `vw_formas_status` não recebem escrita genérica. A rota `/unificado/mapa/operacao/` continua fechada. O verificador confirmou `POST` sem sessão = HTTP 401 e preservação das rotas existentes.

`tests/mapa/contract_write_smoke.py` usou uma forma sintética em 2099, somente na API e no banco de testes: **insert 201/lista, update 200/lista, upsert 200/lista e delete 200/lista**. A conferência direta encontrou **zero linhas remanescentes**. O primeiro upsert havia devolvido `42P10` por falta de índice único; após auditoria de zero duplicatas e criação de índice único apenas no destino de testes, passou. A equivalência dos índices únicos com a origem não está diretamente comprovada pela OpenAPI.

`tests/mapa/contract_write_all_tables.py` ampliou o teste para as seis tabelas operacionais (`programacao_pcp`, `liberacao_formas`, `producao`, `montagem_poste`, `formas_manutencao`, `prog_s3_s4`). **24/24** combinações de insert, update, upsert e delete responderam com os códigos e formato de lista esperados pela API de testes. A limpeza conferiu **zero registros sintéticos restantes nas seis tabelas**. Ainda é preciso transformar cada captura do navegador em fixture de contrato com o retorno esperado do oficial; não houve escrita no oficial para obter esse retorno.

## Falta para o portão da operação

As capturas de escrita simulada da matriz ainda não são fixtures aprovados: é preciso validar para **cada tabela e ação** os métodos, `Prefer`, `on_conflict`, filtros, retorno e erros contra a rota nova, incluindo `usuarios`, fotos e fila offline. As leituras com ordenação incompleta precisam de teste de paginação por conjunto e de comparação visual dos cartões. Nenhuma das 24 jornadas E2E foi executada na rota operacional. O frontend PCP aguarda B e C concluídos.
