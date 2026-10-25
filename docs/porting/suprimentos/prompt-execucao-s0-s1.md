# Suprimentos — Prompt de execução S0.2 → S1 (Codex)

**Aprovado por:** Ricardo Do Amaral, 25/10/2026
**Leia antes, inteiros:** `docs/porting/suprimentos/00-plano-suprimentos.md` (plano v2) e `docs/porting/suprimentos/01-descoberta.md` (S0.1, aprovada).
**Repositório:** `C:\Users\Admin\Documents\pwa-hub-fase1`. **Unidade:** Campinas.

---

## 0. Regras de execução

1. Execute as etapas **E1 → E7 em ordem**. Cada etapa só começa quando os testes da anterior passam.
2. Cada etapa gera **um documento de evidência** em `docs/porting/suprimentos/` (nomes indicados em cada etapa). Atualize `docs/porting/suprimentos/progresso.md` ao fim de cada etapa (etapa, status, testes, pendências).
3. **Pare apenas** em três situações: (a) ao concluir a E7, para eu testar a homologação; (b) quando um teste não passar depois de 2 tentativas de correção; (c) quando uma decisão abaixo se mostrar impossível no código real. Nesses dois últimos casos, registre o bloqueio em `progresso.md` e pare.
4. **Não quebrar nada:** é proibido alterar o comportamento de PCP, Mão de Obra, Laboratório, Mapa, GED, Qualidade e Usinas. Arquivos compartilhados da casca podem receber **somente acréscimos** para registrar o Suprimentos, sempre com teste de regressão do que já existe.
5. **Fora de limite:** tabelas `tbl_est_*`, proxy `usinas_legacy_read.py`, VPS antiga, produção, `git push`. Pode commitar localmente em uma branch `feat/suprimentos-s0-s1`, um commit por etapa.
6. Produção **não** entra neste prompt. A homologação só entra na E7, com backup e rollback.

## 1. Decisões (registrar em `docs/porting/suprimentos/decisoes.md`, D1–D14)

- **D1 · Serviço isolado no padrão da Qualidade:** FastAPI em `unificado/suprimentos/service/suprimentos/`, systemd próprio, porta em loopback (escolher uma livre e documentar), env fora do repositório. Autenticação por assertion assinada de curta duração emitida pelo gateway (mesmo padrão de `quality/auth.py`), header `X-Suprimentos-Assertion`, `auth_request` no nginx.
- **D2 · Banco dedicado** (padrão Qualidade), schema `suprimentos`, tabelas `sup_*`. Migrations **somente** por Alembic em `unificado/suprimentos/migrations/`, sem `create_all`.
- **D3 · Escopo dos dados.** GLOBAIS: unidade de medida, conversão, material (código único global), CA de EPI, fornecedor (CNPJ único global). POR UNIDADE: `sup_material_unidade` (ponto_pedido, estoque_minimo, lote_economico, lead_time_dias, seguranca_dias, ativo; PK material+unidade), local, endereço, centro de custo, alçada, parâmetro, papéis, flag e todos os documentos.
- **D4 · Unidade:** tabela própria `sup_unidade(id smallint, codigo unique, nome, ativo)`, seed `campinas`. Nenhuma FK para bancos de outros módulos; a borda da API usa o código.
- **D5 · IDs:** UUIDv7 gerado no serviço para cadastros e documentos; número legível sequencial por unidade (`SOL-00001`); bigint identity reservado ao livro de movimentos (S2).
- **D6 · Usuário:** referência à identidade IAM como texto (`iam_user_id`) mais o nome exibido, gravado no momento da ação. Não criar tabela de usuário.
- **D7 · Papéis próprios** em `sup_usuario_papel(iam_user_id, unidade_id, papel, cc_id NULL)`: SOLICITANTE, APROVADOR, ALMOXARIFE, COMPRADOR, QUALIDADE, ADMIN. Matriz papel × ação em `auth.py`; **toda** rota checa ação + unidade (+ centro de custo quando houver). A alçada monetária fica em `sup_alcada` e não é papel.
- **D8 · Feature flag** `sup_flag(unidade_id, fase, habilitado)` consultada pela API (bloqueia escrita com 403 e motivo) e pela casca (esconde menu/telas). Seed: campinas S0 e S1 = habilitado **somente em homologação**.
- **D9 · Auditoria e imutabilidade:** `criado_em/por`, `atualizado_em/por` em tudo. Cadastros usam `ativo` (sem DELETE físico). Toda transição de estado de um documento é gravada em `sup_evento(alvo_tipo, alvo_id, de, para, por, em, comentario)`.
- **D10 · Fora deste prompt:** cotação/pedido, recebimento, NF por IA, jobs, anexos via GED, NC, estoque/livro de movimentos, integração com o Laboratório.
- **D11 · Fotos da solicitação (único anexo deste prompt):** armazenamento próprio do serviço (diretório configurável fora do webroot), máx. 3 fotos por solicitação e 2 MB cada depois da compressão, SHA-256, download só autenticado e autorizado pela mesma regra da solicitação. Nada público.
- **D12 · Sessão do PWA:** reutilizar a sessão do Unificado (`mapa_unificado_session`, renovada em `/me`). Criar no gateway uma renovação própria do Suprimentos, revogável, no escopo `/unificado/suprimentos/`, **sem** reaproveitar o token do PCP. Sessão expirada pausa a sincronização e preserva a fila até um novo login.
- **D13 · Valores:** os parâmetros e as alçadas entram como seed marcados `a_confirmar = true` e são editáveis na tela de Cadastros e alçadas.
- **D14 · Notificação:** nesta fase é só dentro do app (badge e lista ao abrir). Push fica para depois.

## 2. Etapas

### E1 · Serviço + schema de cadastros → `02-schema-cadastros.md`

1. Esqueleto: `main.py`, `db.py`, `auth.py` (assertion, matriz papel × ação, unidade, flag), `models.py`, `schemas.py`, `api/cadastros.py`. Rotas `GET /api/suprimentos/health` e `GET /api/suprimentos/me` (papéis, unidades, flags e telas do usuário).
2. Migration 0001: `sup_unidade`, `sup_unidade_medida`, `sup_conversao`, `sup_material`, `sup_material_unidade`, `sup_epi_ca`, `sup_fornecedor`, `sup_local`, `sup_endereco`, `sup_centro_custo`, `sup_alcada`, `sup_parametro`, `sup_usuario_papel`, `sup_flag`, `sup_evento`. Constraints: códigos únicos; CNPJ com 14 dígitos (DV validado na API); `valor_ate > 0`; `nivel ≥ 1`; `fator > 0`.
   `sup_material`: codigo, descricao, categoria (`EPI | ABRASIVO | FERRAMENTA | CONSUMIVEL_PRODUCAO | MANUTENCAO | LIMPEZA_ESCRITORIO | INSUMO_USINA | OUTROS`), un_estoque, controla_estoque, dominio (`almoxarifado | insumo_usina`), exige_ca, patrimoniado, ativo.
3. Migration 0002 (seed): unidade `campinas`; unidades de medida `un, par, kg, t, g, m, m², m³, L, mL, tb, cx, rl, pc, jg`; parâmetros `a_confirmar` (`fechamento_auto_horas=48`, `ajuste_inventario_sem_aprovacao=200`, `cotacao_minima_3_acima=1000`, `tolerancia_preco_oc_perc=10`, `sla_aprovacao_urgente_horas=4`, `sla_aprovacao_normal_horas=24`); alçadas de Campinas `a_confirmar` (nível 1 até 2500 → APROVADOR nível 1; nível 2 acima → APROVADOR nível 2); flags campinas S0/S1. **Não** cadastrar materiais nem fornecedores.
4. Importação: modelos `docs/porting/suprimentos/modelos/materiais.csv` e `fornecedores.csv` (cabeçalho + 2 linhas de exemplo) e as rotas `POST /api/suprimentos/cadastros/{materiais|fornecedores}/importar`. A importação valida tudo, só grava se não houver nenhum erro e devolve um relatório linha a linha.
5. CRUD (listar com filtro e paginação, obter, criar, editar, ativar/desativar) de todos os cadastros, respeitando D3, D7 e D8.
6. Testes pytest: upgrade/downgrade em banco descartável; CRUD; unicidades; CNPJ inválido; negação por papel (cada papel tenta uma ação proibida → 403); unidade errada → 403; flag desligada bloqueia escrita; DELETE físico inexistente; CSV com 1 erro não grava nada.

### E2 · Solicitação e aprovação (backend) → `03-solicitacao-backend.md`

1. Migration 0003: `sup_solicitacao`, `sup_solicitacao_item`, `sup_solicitacao_foto`, `sup_aprovacao`, `sup_reserva` (só a estrutura; a reserva funcional entra na S2), `sup_sugestao_ressuprimento` (só a estrutura). Campos conforme a seção 6 do plano. `client_uuid` UNIQUE (por unidade).
2. **Estados da solicitação:** `RASCUNHO → EM_APROVACAO → APROVADA → EM_ATENDIMENTO → ENTREGUE → CONCLUIDA`; `DEVOLVIDA` (volta ao solicitante, que edita e reenvia); `REPROVADA`; `CANCELADA` (pelo solicitante enquanto nenhum item estiver em atendimento). Cada transição grava em `sup_evento`. Transição inválida → 409.
3. **Estados do item nesta fase:** `PENDENTE → SEPARADO → ENTREGUE` (atendimento manual pelo almoxarife), `CANCELADO`; entrega parcial permitida (`qtd_entregue`).
4. **Alçada:** `valor_estimado` = Σ(qtd × último custo conhecido; enquanto não houver custo, usar o valor informado pelo almoxarife/comprador ou 0 com aviso “sem preço”). Os níveis exigidos vêm de `sup_alcada` (unidade, CC, categoria, valor). A aprovação percorre os níveis em ordem; o aprovador só vê e age dentro da sua unidade, do seu CC (se restrito) e do seu nível. Aprovação em lote aceita apenas itens da alçada de quem aprova; o resto é recusado individualmente no retorno.
5. **Urgência:** `NORMAL | URGENTE | PAROU_PRODUCAO`. PAROU_PRODUCAO exige justificativa com ≥ 20 caracteres. O prazo de SLA é calculado pelos parâmetros e exposto na API (`vence_em`).
6. **Fechamento automático:** solicitação `ENTREGUE` há mais de `fechamento_auto_horas` passa a `CONCLUIDA` (evento “auto”). Implementar como função idempotente com timer systemd (padrão outbox/timer da Qualidade) e comando manual.
7. **Item fora do catálogo:** permitido (`descricao_livre`, foto recomendada). O almoxarife/comprador vincula a um material depois (evento registrado).
8. **Rotas:** as de Solicitações e PWA da seção 7 do plano + `POST /itens/{id}/separar`, `POST /itens/{id}/entregar` (qtd), `POST /solicitacoes/{id}/confirmar-recebimento` e `POST /solicitacoes/{id}/recebi-com-problema` (texto obrigatório; volta para EM_ATENDIMENTO com evento). `POST /pwa/solicitacoes` é **idempotente** por `client_uuid`: repetir o envio devolve 200 com a mesma solicitação.
9. **Fotos:** conforme D11 (`POST/GET /solicitacoes/{id}/fotos`).
10. **Testes:** todas as transições válidas e inválidas; alçada na borda (2500,00 e 2500,01); aprovação em lote mista; envio duplicado (5×) → 1 registro; permissões por papel, unidade e CC; fechamento automático idempotente; foto acima do limite recusada; foto de outra unidade → 403.

### E3 · Casca, menu, permissões e flag → `04-casca-permissoes.md`

1. Registrar o Suprimentos **nos dois cadastros de navegação** (`unificado/shell/menu.config.js` e `unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts`), cor `MODULE_COLORS.suprimentos = '#2DD4BF'`, depois do GED, com os subitens: Painel, Solicitações, Almoxarifado*, Inventário*, Cotações e pedidos*, Recebimento*, Fornecedores, Cadastros e alçadas. (*) Itens de fases futuras ficam **ocultos por flag**, sem tela vazia.
2. Fallback em `shell.js`/`shared-menu.css` com a cor teal. Recompilar `unificado/shell/modelo-a/menu.js` a partir da fonte e comparar o diff do bundle.
3. Acrescentar as telas do Suprimentos em `screen_catalog.json` e nas caixas de `users-unificado.js` (seção “Suprimentos”) e liberar os perfis existentes que podem recebê-las. A concessão de tela na casca **não substitui** o papel do Suprimentos (D7): a tela “Cadastros e alçadas → Usuários e papéis” atribui os papéis.
4. No gateway (`unificado/mapa/api/app.py`): emitir a assertion do Suprimentos, a rota de autorização para o `auth_request` e a renovação de sessão de D12.
5. Respeitar a decisão já tomada: o novo menu vale para os modos PC e tablet; **não alterar o comportamento dos PWAs existentes**. Logos da Concrefer e da ConcreTrack continuam visíveis.
6. **Testes de regressão:** todos os módulos atuais continuam aparecendo para os mesmos usuários (snapshot antes/depois de `/unified/screen-access/me` para pelo menos 5 usuários de perfis diferentes); `ricardo.teste` continua existindo; usuário sem concessão não vê o Suprimentos; flag desligada esconde o módulo.

### E4 · Telas desktop/tablet → `05-telas-desktop.md`

Mesma casca, tipografia e componentes do Unificado. Funciona em 1440 px e 820 px (tablet) sem rolagem horizontal da página; tabelas largas rolam dentro da própria caixa. Linguagem: português, valores em R$ com vírgula, datas dd/mm.

1. **Painel** (`?view=suprimentos/painel`): cabeçalho com “Registrar recebimento” (oculto por flag) e “+ Nova solicitação”. Cinco indicadores: aguardando **sua** aprovação (e quantas há mais de 24 h); em atendimento (urgentes / parou produção); pedidos de compra abertos (oculto até a S3); abaixo do ponto de pedido (oculto até a S2); autonomia de cimento (oculto até a S4). “Fila de trabalho”: tabela com Nº, solicitante e setor, resumo dos itens, urgência (selo), situação (selo) e idade. A coluna lateral “Silos da usina” e “Ressuprimento sugerido” fica **oculta** até a S4.
2. **Solicitações** (`suprimentos/solicitacoes`): abas por situação com contagem (Todas, Em aprovação, Devolvidas, Aprovadas/separar, Entregues/aguardando confirmação, Concluídas, Canceladas/reprovadas); filtros (busca, setor/CC, urgência, origem PWA/Web, “só as que eu aprovo”); tabela com seleção, Nº, aberta em, solicitante e setor, itens, valor estimado, urgência, precisa em, alçada (nível e quem) e origem. A barra de ação em lote mostra a quantidade e o valor selecionados, se estão todos na sua alçada, e os botões Devolver / Aprovar selecionadas. Rodapé explicando como o valor estimado é calculado.
3. **Detalhe** (`suprimentos/solicitacao?id=`): título com o número e selos (situação com nível “2 de 2”, urgência); ações Reprovar / Devolver para ajuste / Aprovar, conforme permissão; cartão de dados (solicitante, setor/CC, aberta em + origem, precisa em, valor estimado, alçada aplicada, justificativa); tabela de itens (item e código, qtd, situação, entregue); fotos; coluna lateral “Histórico” em linha do tempo (de `sup_evento`) e campo de comentário obrigatório para devolver ou reprovar. Para o almoxarife aparecem as ações por item (Separar, Entregar qtd).
4. **Nova solicitação (web):** mesmo fluxo do PWA em uma página (itens → detalhes → enviar).
5. **Fornecedores** e **Cadastros e alçadas:** listas com busca e filtros, formulário lateral de criar/editar, ativar/desativar e importação CSV com relatório de erros. Abas de Cadastros: Materiais (globais + parâmetros por unidade), Unidades de medida, Locais e endereços, Centros de custo, Alçadas, Parâmetros (com selo “a confirmar”), Usuários e papéis, Flags (somente ADMIN).
6. Estados vazios, carregando e erro em todas as telas; botões com área mínima de 44 px no tablet; contraste AA.
7. Testes Playwright: fluxo completo solicitante → aprovador nível 1 → nível 2 → almoxarife separa/entrega → solicitante confirma; capturas em 1440 e 820 px de cada tela.

### E5 · PWA Solicitação → `06-pwa-solicitacao.md`

Escopo e instalador próprios em `/unificado/suprimentos/pwa/` (`manifest.webmanifest` com `id/start_url/scope` exclusivos, `display: standalone`, ícones 192/512/maskable e apple-touch-icon; instruções de instalação no Android via `beforeinstallprompt` e no iPhone via Safari → Compartilhar → Adicionar à Tela de Início). O SW só faz cache da shell e não pode se sobrepor ao `unificado/sw.js`. Tela fixa para celular (390 px de referência), alvos de toque ≥ 44 px, cor principal `#0F766E`.

1. **Início:** cabeçalho com o logo “C”, “Suprimentos”, o estado de sincronização (Sincronizado / N pendentes / Sem conexão), “Olá, <nome>” e o setor/CC; botão grande “+ Nova solicitação”; aviso de entregas para confirmar; lista “Minhas solicitações” (número, selo de situação, resumo dos itens, data/urgência/precisa em). Barra inferior: Início, Nova, Minhas, Aprovar (com badge; **só** para quem tem papel APROVADOR).
2. **Nova — itens:** busca por nome/código e botão de QR (lê o código do material); atalhos “Mais pedidos pelo seu setor”; lista de itens com − / quantidade / + e unidade; “Item que não acho na lista — descrever e fotografar”; botão “Continuar · N itens”. Saldo e preço **nunca** aparecem.
3. **Nova — detalhes e envio:** setor/CC (pré-selecionado), preciso para (data), urgência em botões segmentados Normal / Urgente / Parou produção (com a explicação de cada uma), “Por que precisa?”, até 3 fotos (comprimidas no aparelho para ≤ 1600 px, JPEG ~80%) e “Enviar solicitação”. Sem conexão, uma faixa avisa que a solicitação fica guardada e sobe sozinha.
4. **Acompanhar:** número, selo, itens (pedidos/entregues), linha do tempo dos eventos e, quando ENTREGUE, os botões “Recebi tudo” e “Recebi com problema” (texto obrigatório). Aviso de fechamento automático em 48 h.
5. **Aprovar:** cartões das pendências na alçada do usuário (número, urgência, valor, itens, solicitante/setor/precisa em) com Devolver (comentário obrigatório) e Aprovar; o cartão mostra o resultado e o badge diminui.
6. **Offline:** IndexedDB por usuário e unidade com: catálogo (com data de atualização), minhas solicitações, aprovações pendentes e **fila de envio**. O `client_uuid` é gerado ao criar; o item só sai da fila depois da confirmação do servidor (idempotente). Reenvio ao voltar a conexão (`online`, Background Sync quando houver, e ao abrir o app no iOS). Fotos ficam na fila como Blob. Sessão expirada → pausa e pede login sem perder a fila. Aprovação offline **não** é permitida (o botão fica desabilitado, com explicação).
7. **Testes:** Playwright em emulação mobile (Pixel e iPhone): criar offline → 5 reenvios → 1 registro; fila sobrevive a fechar e reabrir; sessão expirada preserva a fila; aprovador vê a aba Aprovar e solicitante não; capturas de cada tela. Lighthouse PWA “instalável” = ok.

### E6 · Revisão integrada → `07-revisao-integrada.md`

Rodar todos os testes (pytest + Playwright + regressão da E3). Checklist de segurança: toda rota com papel + unidade + flag; fotos sem URL pública; nenhum segredo no repositório; logs sem dados pessoais desnecessários. Listar riscos e o que fica para S2/S3/S4.

### E7 · Homologação → `08-homologacao.md`

1. Ambiente de homologação existente (`:18446`, `/opt/concrefer-unificado/homolog/`). Antes de mudar: backup de nginx, das permissões (`screen_catalog` e as concessões) e dos arquivos da casca; snapshot do `/unified/screen-access/me` dos 5 usuários da E3.
2. Criar o banco/usuário do Suprimentos de homologação, rodar as migrations, instalar o serviço systemd (usuário próprio, escrita restrita), a location nginx `/api/suprimentos/` (mais específica que `/api/`) com `auth_request`, `/unificado/suprimentos/` e `/unificado/suprimentos/pwa/`. `nginx -t` antes do reload.
3. Smoke test: health, login, fluxo completo da E4, PWA instalável, regressão dos módulos existentes = idêntica ao snapshot.
4. Script de **retorno** testado (remove as locations, para o serviço, restaura catálogo e casca) e documentado.
5. Atribuir em homologação o papel ADMIN a `ricardo.teste` na unidade campinas.
6. **Pare aqui.** Entregue as URLs de homologação, os usuários de teste por papel e o roteiro de teste para eu validar no PC, no tablet e no celular.

## 3. Entregáveis finais

- `docs/porting/suprimentos/decisoes.md`, `progresso.md` e as evidências 02 a 08.
- Branch local `feat/suprimentos-s0-s1` com um commit por etapa (mensagem `suprimentos: E<n> <resumo>`).
- Nenhuma alteração em produção.
