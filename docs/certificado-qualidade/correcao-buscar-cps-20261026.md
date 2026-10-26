# Certificados de qualidade — correção da consulta de CPs

**Data:** 26/10/2026

## Causa

O botão de consulta enviava o rascunho completo a `/api/resultados`. Essa rota validava o campo obrigatório `cliente` mesmo quando o usuário queria somente consultar CPs. Com cliente vazio, a API devolvia HTTP 422 com uma lista de objetos de validação; o JavaScript mostrava essa lista como `[object Object]`.

O erro foi reproduzido em homologação e produção. Com o mesmo poste e data, cliente vazio produzia 422; cliente preenchido produzia 200 e uma linha de resultados.

## Correção

- `/api/resultados` recebe somente os itens produzidos. Salvar e emitir o certificado continuam validando os dados completos do rascunho.
- O botão envia `{itens}` em vez do formulário inteiro.
- Erros estruturados da API são convertidos em texto legível.
- A referência do JavaScript foi atualizada para `app.js?v=1.0.105` para renovar o arquivo no navegador.

## Validação e publicação

- Sintaxe Python e JavaScript: sem erro.
- Teste no navegador: o clique com cliente vazio enviou apenas os postes, exibiu o resultado e apresentou a validação simulada sem `[object Object]`.
- Homologação `:18446`: teste autenticado de `/api/resultados` retornou 200 e uma linha sem cliente; serviço ativo. Backup: `/opt/concrefer-unificado/backups/cq-buscar-cps-stage-20261026T150935Z`.
- Produção: mesmo teste autenticado passou, página respondeu HTTP 200, `nginx -t` passou e serviço ativo. Backup: `/opt/concrefer-unificado/backups/cq-buscar-cps-production-20261026T151039Z`.
- Nenhuma tabela ou registro de certificado foi alterado.

Arquivos: `unificado/laboratorio/certificados-qualidade/app.py`, `static/app.js`, `static/index.html`, `tests/smoke_buscar_cps.py` e `deploy/scripts/deploy-cq-buscar-cps-20261026.sh`.
