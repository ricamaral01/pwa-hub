# T1 — Navegação Campinas e Pederneiras

No shell e no menu lateral modelo A, os itens existentes de Produção foram agrupados sob **Campinas · Produção**, **Campinas · Montagem**, **Campinas · Controle** e **Campinas · Indicadores**. Seus IDs, telas Mapa e URLs não mudaram; links já salvos continuam válidos. O nome do indicador de concretagem é **Dashboard Concretagem Matriz**.

O grupo **Pederneiras** contém Apontamento do dia, Mão de obra, Produção Pederneiras, Indicadores e Cadastro de produtos. Cada rota abre uma tela identificada como preparação em `/unificado/producao/pederneiras/?tab=...`, com navegação e botão de volta. O roteador do shell reconhece a nova rota sem abrir outro shell.

Os cinco IDs novos foram adicionados ao catálogo de telas. Por padrão só os masters Ricardo, Marcelo e Alex os veem. Os demais usuários precisam de liberação explícita por tela e de conta PCP vinculada; a API ainda confere a unidade e o papel em cada requisição. Nenhuma rota legada ganhou permissão adicional.

## Verificação

- `python -m pytest tests/pederneiras/test_menu_access.py -q`: 3 testes passaram, cobrindo rota Campinas preservada, rota Pederneiras, acesso explícito e masters.
- `npm run build` no sidebar modelo A: TypeScript e Vite concluídos.
- `node --check` no menu e no roteador: sem erro.
- Capturas: [desktop](prints/menu-desktop.png) e [tablet](prints/menu-tablet.png). Capturas locais da tela de preparação, sem sessão de produção.

**Estado:** código e mockups locais. A publicação do menu acompanha a API e os formulários, após o isolamento operacional de mão de obra por unidade. A tela de preparação não substitui as funções finais.
