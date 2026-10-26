# F2 — Almoxarifado geral de Campinas

**Ambiente:** somente homologação `https://concrefer.concretrack.com.br:18446`. Produção e VPS antiga não foram acessadas nesta fase. Branch local `feat/suprimentos-s0-s1`, sem push.

## Entrega

- Livro `sup_movimento` imutável (`bigint identity`) com entrada, entrega, ajuste, transferência em dois lançamentos e estorno vinculado. A chave de idempotência é única por unidade. Lançamentos futuros são recusados.
- Projeções transacionais `sup_saldo` e `sup_custo_medio`: saldo por material/endereço, reservado, disponível e custo médio por material/unidade. Estorno imediato restaura quantidade e custo médio; estorno tardio que deixaria custo negativo é bloqueado para revisão.
- Reserva na aprovação final da solicitação. O saldo disponível é travado e consumido em ordem de endereço; falta de saldo preenche `qtd_comprar`, já prevista na S1. A cotação usa apenas essa quantidade. Cancelamento libera reserva. Entrega baixa a reserva e gera movimento; a parte comprada segue a entrega direta da F1 até a F3.
- Colaborador mínimo, ficha de EPI com CA vigente obrigatório e confirmação na tela do almoxarife. Inventário de abertura e cíclico com ficha cega, horário de corte, divergência, aprovação por outro almoxarife acima do limiar ou para EPI e ajuste vinculado à contagem. Movimentos após o corte são preservados.
- Sugestão de ressuprimento calculada por consumo, lead time e dias de segurança. O comprador confirma com CC ou descarta; confirmação cria uma solicitação em rascunho, vinculada à sugestão, e a envia pelo fluxo normal de aprovação. Há prevenção de duplicidade enquanto a sugestão ou solicitação estiver ativa.
- Telas responsivas `almoxarifado/` e `inventario/`: saldos e filtros, livro, separação, consumo por setor/CC, EPI, ponto de pedido, contagem e revisão. O Painel mostra materiais abaixo do ponto de pedido. A flag `S2` está ligada apenas para Campinas em `:18446`.

## Arquivos

| Camada | Arquivos |
|---|---|
| Banco | `unificado/suprimentos/migrations/versions/0007_almoxarifado.py`, `0008_reposicao.py` |
| API | `service/suprimentos/api/estoque.py`, integrações em `api/solicitacoes.py`, `api/compras.py`, `workflow.py`, `auth.py`, `main.py` |
| Telas | `unificado/suprimentos/almoxarifado/index.html`, `inventario/index.html`, `frontend/estoque.js`, `estoque.css`, `frontend/app.js` |
| Casca | `unificado/shell/router.js`, `unificado/mapa/api/screen_catalog.json`; menu S2 já previsto em `menu.config.js` |
| Verificação | `service/tests/test_f2.py`, `tests/suprimentos/check_layout_f2.py`, `check_f2_forms.py`; scripts de deploy `deploy/f2-*-homolog.sh` |

## Testes e evidência

- Migrações em banco descartável: upgrade até `sup_0008`, downgrade até base e novo upgrade. Suíte E1–E7 + F1 + F2: **27 testes aprovados**. Cobertura específica: livro imutável, idempotência, estorno e custo médio, corrida pelo último saldo, cotação apenas da falta, liberação por cancelamento, CA vencido, transferência, corte do inventário com movimento posterior, aprovação por outro ator, consumo por CC e sugestão convertida em solicitação sem duplicação.
- Publicações sucessivas na homologação com backup privado, snapshot de permissões, `nginx -t`, serviço pronto e smoke **43/43**. O retorno da mudança de esquema `sup_0008 → sup_0007` foi executado e a versão nova reinstalada. A versão final da F2 é **1.0.77**, coerente em `VERSION`, `APP_VERSION` e cache do SW.
- Auditoria visual autenticada via casca em 1366×768, 1440×900, 1920×1080, 820×1180, 1180×820, 390×844 e 360×780; zoom 100/125% e menu aberto/recolhido. Almoxarife em ambas as telas, comprador no almoxarifado. **84 estados, zero largura da página, zero recurso 404 e zero erro JavaScript do Suprimentos**. As tabelas e abas mantêm rolagem interna intencional. Diagnóstico e PNGs em [`capturas/f2/`](capturas/f2/).
- Os formulários de entrada foram abertos pela casca em PC e celular, com opções reais de material e endereço; o comprador não vê ações de almoxarife. Resultado e capturas em [`capturas/f2-formularios/`](capturas/f2-formularios/).
- O 403 da consulta automática de produtividade do Mapa para contas exclusivas de Suprimentos é externo ao módulo; segue registrado para a auditoria da casca na F8. Não houve erro no iframe do Suprimentos.

## Dados de demonstração e limites

O script `deploy/seed-f2-demo-homolog.py` criou três materiais `DEMO-F2-*`, um endereço e entradas de estoque somente na homologação. Esses dados serão removidos com os demais `DEMO` na F8. Valores de R$ 200 e 2% estão marcados `a_confirmar` e podem ser alterados em Cadastros e alçadas. O custo de NF com IPI/frete, a inspeção e o IQF automático são da F3; a integração física com silos é da F4 e permanece desligada.
