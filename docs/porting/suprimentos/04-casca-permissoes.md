# E3 — Casca, permissões e flag de Suprimentos

## Alterações aditivas

- `unificado/shell/menu.config.js`: novo módulo Suprimentos com Painel, Solicitações, Nova solicitação, Fornecedores e Cadastros e alçadas. Almoxarifado/Inventário (S2) e Cotações/Recebimento (S3) estão declarados com `futurePhase` e permanecem ocultos.
- `unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts`: módulo após GED, `MODULE_COLORS.suprimentos = '#2DD4BF'`, mesmos IDs e rotas. `unificado/shell/modelo-a/menu.js` foi recompilado com `npm run build`; typecheck passou. O bundle contém os novos IDs e a cor.
- `unificado/shell/shell.js`, `shared-menu.css`, `module-pages.js` e `router.js`: filtro da flag e da concessão, cor teal no fallback, cartão da Home, abertura via `?view=suprimentos/...` e bootstrap de sessão antes do iframe. As rotas dos módulos existentes foram mantidas.
- `unificado/mapa/api/screen_catalog.json`, `screen_access.py` e `unificado/mapa/operacao/users-unificado.js`: cinco telas S1 no catálogo e caixas de Suprimentos na administração. Perfis ativos podem receber concessões, sem concessão automática para usuários comuns. O papel e o CC continuam obrigatórios na API dedicada. `ricardo.teste` continua elegível; a existência da conta viva será conferida na E7.
- `unificado/mapa/api/app.py`: bootstrap, renovação própria revogável, autorização nginx e assertion HMAC de 20 s. A renovação valida usuário ativo e `updated_at`; usa cookie de refresh restrito a `/unificado/suprimentos/`, sem token PCP. Há cookies separados por path para PWA e API. A flag S1 é lida do serviço dedicado em loopback; falha de leitura esconde o módulo e bloqueia autorização.
- `unificado/suprimentos/service/suprimentos/api/cadastros.py`: consulta interna `/api/suprimentos/flags` limitada a loopback para o gateway.

## Regressão

`tests/suprimentos/test_e3_gateway.py` chama `/unified/screen-access/me` com cinco perfis representativos (master, gerência, gestor, montador e convidado), com banco simulado apenas para as concessões da casca. Os conjuntos de IDs antigos foram comparados com [snapshot anterior](e3-snapshot-before.json) e [posterior](e3-snapshot-after.json): **79/19/17/5/0** antes e depois com a flag desligada. Com S1 ligada e sem concessão, perfis comuns continuam sem Suprimentos; uma concessão de Painel acrescenta somente esse ID; desligar a flag volta ao conjunto anterior. São perfis sintéticos, sem credenciais reais; o snapshot de usuários reais de homologação é parte da E7.

Foram executados: `4 passed` no teste do gateway; regressão integrada E1–E3 `16 passed`; `node --check` dos JS modificados, `python -m py_compile`, validação JSON, `npm run typecheck` e `npm run build` do menu Modelo A. O teste também confere assertion decodificada, os três cookies seguros do bootstrap e a negação da renovação sem sessão.

**Estado da árvore recebido:** `app.py`, `shell.js`, `router.js`, `menu.config.js` e a fonte do Modelo A já continham alterações não commitadas de outras frentes quando a E3 começou. As edições funcionais feitas nesta etapa são extensões de Suprimentos; o commit desses arquivos completos também incorpora o estado pré existente necessário para que o build reflita a árvore testada. Nenhuma dessas alterações pré existentes foi descartada. O diff do bundle `menu.js` é amplo porque foi recompilado a partir dessa fonte já modificada; a regressão acima mede o estado resultante.

## Dependências para E7

O vhost de homologação deve rotear `/unificado/suprimentos/session-renew` ao gateway e `/api/suprimentos/` ao serviço na porta **13067**, com `auth_request` em ambos os caminhos protegidos. A chave `SUPRIMENTOS_GATEWAY_SIGNING_KEY` deve ser igual nos dois processos e ficar fora do repositório. A flag do serviço só será ligada em Campinas na homologação.
