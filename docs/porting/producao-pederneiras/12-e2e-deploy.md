# T12 — E2E isolado e publicação na VPS

Publicação em 24/10/2026 UTC no branch `feat/sistema-unificado`. A tela Unificado foi entregue na versão `1.0.44`, recebeu o acabamento `1.0.45` e está agora em `1.0.46` com a importação de outubro. O cadastro de área exige a escolha explícita de MOD/MOI e funciona em tela estreita. Backup da primeira publicação em `/opt/concrefer-unificado/backups/pederneiras-20261024T011809Z/` contém dump PostgreSQL, arquivos da API/shell e o snippet Nginx. A migração Alembic terminou em `20261023_03` e o seed aplicou 112 produtos provisórios mais a meta de outubro. Na primeira publicação, nenhuma área havia sido classificada ou lançada; o cadastro e a importação posteriores estão documentados em `13-excel-importacao.md`.

O backend PCP publicado na VPS foi conciliado com o código mais recente do servidor antes de acrescentar o roteador. Leituras e escritas antigas de Campinas foram limitadas a `unidade_id=1`. Os 136 registros e 19 atividades de Campinas permaneceram com as mesmas contagens. O Nginx encaminha a API de produção à autenticação e à autorização por unidade do FastAPI, e protege as páginas; manifestos e workers dos dois PWAs são separados.

## Verificações

- `npm run build` dos três clientes React/Vite e `python -m pytest tests/pederneiras -q`: **10 testes passaram**.
- `tests/pederneiras/scratch_http_flow.py` no banco isolado `pcp_pederneiras_t4_test`: 5 postes, 0,25 homem, bloqueio sem equipe, confirmação, 20 postes/homem, dois registros de auditoria, PDF e XLSX válidos; consultas legadas de Campinas não exibiram os dados de Pederneiras.
- API pública com JWT master ativo: produtos 112, áreas 0, meta 1.472, PDF e XLSX HTTP 200. Todas as rotas estáticas, JS, ícones, manifestos e workers testados retornaram HTTP 200. Nginx validado com `nginx -t`; PCP, autenticação Mapa e Nginx ativos.
- Capturas desktop e celular em `prints/` foram feitas com API sintética. O teste de PWA verificou fila offline e sincronização por API simulada.
- Acabamento `1.0.45`: build React concluído, 10 testes passaram novamente, commit `a6974220` enviado a `feat/sistema-unificado`. Backup da aplicação estática anterior em `/opt/concrefer-unificado/backups/pederneiras-final-before-1.0.45.tar.gz`; os 13 arquivos novos foram aplicados na VPS nova. `nginx -t` passou. A URL pública `/unificado/VERSION`, o service worker, os três bundles JS/CSS e os dois manifestos PWA responderam HTTP 200. As páginas de trabalho exigem autenticação e retornaram 403 sem sessão, como esperado.

## Pendências de entrada e validação real

1. **Concluído em 24/10:** Ricardo definiu cinco áreas; Produção é MOD e Usina de Concreto, Fab Armação e estribos, Encarregado Produção e Sacador núcleo são MOI. Áreas e histórico validado foram cadastrados em produção. Ver `13-excel-importacao.md`.
2. **Acesso a configurar pelo Ricardo:** ele criará o gestor da unidade depois. Os cadastros existentes foram mantidos, inclusive Ricardo, Marcelo e Alex como masters no Mapa. A conta PCP de Alex ainda está inativa e requer reconciliação se ele for acessar a API.
3. **Fonte histórica:** Excel recebido e confrontado com o PDF. Foram importados somente os 16 dias válidos até 23/10. Os 74 postes escritos no rodapé de 29/10, sem itens ou equipe, ficaram fora. Ver `13-excel-importacao.md`.
4. **Validação em aparelhos reais:** confirmar instalação e fluxo de trabalho dos dois PWAs em iPhone e Android com o gestor. Manter a planilha em paralelo até essa validação.
5. **Cadastro definitivo:** revisar códigos, letras e m³ por peça dos 112 produtos provisórios quando houver tabela definitiva.
