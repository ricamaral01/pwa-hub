# T12 — E2E isolado e publicação na VPS

Publicação em 24/10/2026 UTC no branch `feat/sistema-unificado`. A tela Unificado foi entregue na versão `1.0.44` e recebeu o acabamento `1.0.45`: o cadastro de área agora exige a escolha explícita de MOD/MOI e funciona em tela estreita. Backup da primeira publicação em `/opt/concrefer-unificado/backups/pederneiras-20261024T011809Z/` contém dump PostgreSQL, arquivos da API/shell e o snippet Nginx. A migração Alembic terminou em `20261023_03` e o seed aplicou 112 produtos provisórios mais a meta de outubro. Nenhuma área foi classificada ou lançada no banco operacional.

O backend PCP publicado na VPS foi conciliado com o código mais recente do servidor antes de acrescentar o roteador. Leituras e escritas antigas de Campinas foram limitadas a `unidade_id=1`. Os 136 registros e 19 atividades de Campinas permaneceram com as mesmas contagens. O Nginx encaminha a API de produção à autenticação e à autorização por unidade do FastAPI, e protege as páginas; manifestos e workers dos dois PWAs são separados.

## Verificações

- `npm run build` dos três clientes React/Vite e `python -m pytest tests/pederneiras -q`: **10 testes passaram**.
- `tests/pederneiras/scratch_http_flow.py` no banco isolado `pcp_pederneiras_t4_test`: 5 postes, 0,25 homem, bloqueio sem equipe, confirmação, 20 postes/homem, dois registros de auditoria, PDF e XLSX válidos; consultas legadas de Campinas não exibiram os dados de Pederneiras.
- API pública com JWT master ativo: produtos 112, áreas 0, meta 1.472, PDF e XLSX HTTP 200. Todas as rotas estáticas, JS, ícones, manifestos e workers testados retornaram HTTP 200. Nginx validado com `nginx -t`; PCP, autenticação Mapa e Nginx ativos.
- Capturas desktop e celular em `prints/` foram feitas com API sintética. O teste de PWA verificou fila offline e sincronização por API simulada.

## Pendências de entrada e validação real

1. Classificação MOD/MOI corrigida das áreas, prometida pelo Ricardo: cadastrar em **Produção Pederneiras → Mão de obra → Configurar áreas** quando estiver definida. A tela não atribui mais MOD automaticamente.
2. Gestor da unidade: Ricardo informou que criará a conta depois. Alex permanece master no Mapa, mas a conta PCP está inativa e precisa de reconciliação para a API.
3. Excel original LT-PRO-04 indisponível. O PDF impresso diverge do próprio rodapé e contém dia 29/10 futuro; nenhuma produção histórica foi importada. Ver `11-paridade.md`.
4. Confirmar instalação e fluxo de trabalho dos PWAs em iPhone e Android reais com o gestor e as áreas corretas. A planilha segue em uso paralelo até essa validação.
