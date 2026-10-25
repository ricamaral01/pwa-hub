# Etapa 0 — inventário da retirada do Supabase

Data da leitura: 22/10/2026 (America/Sao_Paulo). Fonte do Mapa: `mapa-concretagem/`. O plano recebido na conversa tem seções 1 a 5 e não contém a seção 6 citada no pedido.

## Estado do levantamento

**Inventário de código e comparação de dados executados; catálogo interno e `pg_dump` histórico do Supabase pendentes de conexão PostgreSQL de leitura.** O usuário autorizou encerrar a Etapa 0 com esses itens explicitamente pendentes se a DSN não fosse encontrada. Na VPS e no projeto foram encontradas `SUPABASE_URL` e `SUPABASE_SECRET_KEY`, suficientes para REST, Storage e Auth, mas não para `pg_dump` ou `pg_catalog`. Não iniciar a Etapa 1 sem aprovação.

Procedimento: leitura estática no repositório e nas aplicações publicadas; consultas GET/HEAD no Supabase; `SELECT` no PostgreSQL `mapa_unificado_teste`; inspeção de `systemd`, cron e processos nas VPS `vps-staging` e `vps-rh`. Nenhuma consulta de escrita foi feita ao Supabase nem aos bancos operacionais. Os únicos arquivos criados foram os backups de auditoria na VPS e este documento; uma instância PostgreSQL temporária, totalmente isolada, foi iniciada apenas para testar a restauração, parada e removida.

## 1. Matriz de chamadas

Contagem estática: **53 `.from`, 1 `.rpc`, 1 `.channel` no `mapa-concretagem/app.js`; zero `.storage` e zero `.auth` nesse arquivo**. O formulário compartilhado da Inspeção tem mais **4 `.from`** por meio do alias `db`; o adaptador `unificado/m/inspecao/api.js` implementa esses métodos sobre a API local. O PCP tem **zero chamadas SDK** e **2 GET REST** com nomes de configuração Supabase. Assim, são **59 ocorrências de SDK/alias e 2 chamadas REST PCP**, ou **61 pontos de chamada** no escopo. Contar locais estáticos não equivale a contar requisições em produção.

`MANUTENCAO_FORMAS_TABLE = formas_manutencao`. `tableName` dos auxiliares resolve para `producao` no fluxo de inspeção e `montagem_poste` no fluxo de montagem. `opts.table` resolve para `producao` e `montagem_poste` nas telas de montagem e painéis. `table` da exportação vem do catálogo de bases do relatório. O RPC dinâmico observado é `rpc_dashboard_produtividade_resumo_v1` ([app.js:11301](../../../mapa-concretagem/app.js#L11301)).

O perfil é **dinâmico**: as permissões do Unificado são por usuário/tela/ação e o Mapa original também usa o perfil do usuário na interface. A chamada isolada não codifica um perfil fixo; cada linha da matriz marca `dinâmico*`. A autorização efetiva por rota deve ser medida na Etapa 4. As linhas de auxiliares e chamadas condicionais precisam ser lidas junto com os chamadores indicados.

| Arquivo:linha | Tela/fluxo | Alvo | Metodo | Filtros / ordem / pagina / conflito / retorno | Perfil |
|---|---|---|---|---|---|
| [app.js:752](../../../mapa-concretagem/app.js#L752) | Manutencao/liberacao | `formas_manutencao` | SELECT | filtro: -; ordem/pagina: order("updated_at", { ascending: false }); conflito: -; retorno: "*" | dinamico* |
| [app.js:769](../../../mapa-concretagem/app.js#L769) | Manutencao/liberacao | `formas_manutencao` | UPSERT | filtro: -; ordem/pagina: -; conflito: "id"; retorno: - | dinamico* |
| [app.js:1526](../../../mapa-concretagem/app.js#L1526) | Infra/API | `producao / montagem_poste (dinamico)` | SELECT | filtro: applyFilters(options) dinamico; ordem/pagina: order(opts.orderBy, opts.orderOptions), range(from,to) em lotes; conflito: -; retorno: opts.select | dinamico* |
| [app.js:1596](../../../mapa-concretagem/app.js#L1596) | Infra/API | `producao / montagem_poste (chamador)` | INSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1600](../../../mapa-concretagem/app.js#L1600) | Infra/API | `producao / montagem_poste (chamador)` | INSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1605](../../../mapa-concretagem/app.js#L1605) | Infra/API | `producao / montagem_poste (chamador)` | UPSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1608](../../../mapa-concretagem/app.js#L1608) | Infra/API | `producao / montagem_poste (chamador)` | UPSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1614](../../../mapa-concretagem/app.js#L1614) | Infra/API | `producao` | SELECT | filtro: eq('data_fabricacao', row.data_fabricacao), eq('setor', row.setor), eq('forma', row.forma); ordem/pagina: order('data_hora', { ascending: false, nullsFirst: false }); conflito: -; retorno: 'id' | dinamico* |
| [app.js:1626](../../../mapa-concretagem/app.js#L1626) | Infra/API | `producao` | UPDATE | filtro: eq('id', current.id); ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1633](../../../mapa-concretagem/app.js#L1633) | Infra/API | `producao` | UPDATE | filtro: eq('id', current.id); ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1641](../../../mapa-concretagem/app.js#L1641) | Infra/API | `producao` | DELETE | filtro: in('id', duplicates.map((item); ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1648](../../../mapa-concretagem/app.js#L1648) | Infra/API | `producao` | INSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1652](../../../mapa-concretagem/app.js#L1652) | Infra/API | `producao` | INSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:1664](../../../mapa-concretagem/app.js#L1664) | Acoes Mapa/usuarios | `usuarios` | SELECT | filtro: -; ordem/pagina: limit(1); conflito: -; retorno: 'id' | dinamico* |
| [app.js:1694](../../../mapa-concretagem/app.js#L1694) | Acoes Mapa/usuarios | `programacao_pcp` | UPSERT | filtro: -; ordem/pagina: -; conflito: 'data_fabricacao,setor,forma'; retorno: - | dinamico* |
| [app.js:1707](../../../mapa-concretagem/app.js#L1707) | Acoes Mapa/usuarios | `liberacao_formas` | UPSERT | filtro: -; ordem/pagina: -; conflito: 'data_fabricacao,setor,forma'; retorno: - | dinamico* |
| [app.js:1753](../../../mapa-concretagem/app.js#L1753) | Acoes Mapa/usuarios | `producao` | SELECT | filtro: eq(status,LIBERADO), eq(data_fabricacao,payload.data) e eq(setor,payload.setor) opcionais; ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:1773](../../../mapa-concretagem/app.js#L1773) | Acoes Mapa/usuarios | `producao` | SELECT | filtro: eq(data_fabricacao,payload.data) e eq(setor,payload.setor) opcionais; ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:1795](../../../mapa-concretagem/app.js#L1795) | Acoes Mapa/usuarios | `usuarios` | SELECT | filtro: eq('ativo', true); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:1803](../../../mapa-concretagem/app.js#L1803) | Acoes Mapa/usuarios | `usuarios` | SELECT | filtro: eq('ativo', true), or(`id.ilike.${payload.name},nome.ilike.${payload.name}`), eq('senha', payload.password); ordem/pagina: limit(1); conflito: -; retorno: '*' | dinamico* |
| [app.js:1827](../../../mapa-concretagem/app.js#L1827) | Acoes Mapa/usuarios | `usuarios` | UPSERT | filtro: -; ordem/pagina: -; conflito: -; retorno: * | dinamico* |
| [app.js:1842](../../../mapa-concretagem/app.js#L1842) | Acoes Mapa/usuarios | `usuarios` | UPDATE | filtro: eq('id', payload.id); ordem/pagina: -; conflito: -; retorno:  | dinamico* |
| [app.js:1852](../../../mapa-concretagem/app.js#L1852) | Acoes Mapa/usuarios | `usuarios` | UPDATE | filtro: eq('id', payload.id); ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:3287](../../../mapa-concretagem/app.js#L3287) | Programacao/liberacao | `programacao_pcp` | DELETE | filtro: eq('data_fabricacao', data), eq('setor', setor), eq('forma', forma); ordem/pagina: -; conflito: -; retorno: - | dinamico* |
| [app.js:3335](../../../mapa-concretagem/app.js#L3335) | Programacao/liberacao | `programacao_pcp` | SELECT | filtro: eq('data_fabricacao', data); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:3336](../../../mapa-concretagem/app.js#L3336) | Programacao/liberacao | `liberacao_formas` | SELECT | filtro: eq('data_fabricacao', data); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:3337](../../../mapa-concretagem/app.js#L3337) | Programacao/liberacao | `producao` | SELECT | filtro: eq('data_fabricacao', data); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:3389](../../../mapa-concretagem/app.js#L3389) | Programacao/liberacao | `vw_formas_status` | SELECT | filtro: eq('data_fabricacao', data); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:3588](../../../mapa-concretagem/app.js#L3588) | Programacao/liberacao | `programacao_pcp` | SELECT | filtro: eq('data_fabricacao', data), eq('setor', sectorLabel); ordem/pagina: -; conflito: -; retorno: 'forma' | dinamico* |
| [app.js:4253](../../../mapa-concretagem/app.js#L4253) | Programacao S3/montagem | `programacao_pcp` | SELECT | filtro: eq('data_fabricacao', filtroData), eq('setor', 'Setor 3'); ordem/pagina: -; conflito: -; retorno: 'forma, modelo' | dinamico* |
| [app.js:5049](../../../mapa-concretagem/app.js#L5049) | Montagem/inspecao | `montagem_poste` | SELECT | filtro: eq('id', key); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:5241](../../../mapa-concretagem/app.js#L5241) | Montagem/inspecao | `montagem_poste` | SELECT | filtro: eq(setor,setor) opcional; eq(data_fabricacao,filtroData) quando modoCarga=data; ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:5417](../../../mapa-concretagem/app.js#L5417) | Montagem/inspecao | `montagem_poste` | SELECT | filtro: eq('id', key); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:6215](../../../mapa-concretagem/app.js#L6215) | Dashboards/acompanhamento | `producao` | SELECT | filtro: gte('data_fabricacao', startDateStr), lte('data_fabricacao', endDateStr); ordem/pagina: order('data_fabricacao', { ascending: false }), range(from, to); conflito: -; retorno: DASHBOARD_PRODUCAO_SELECT | dinamico* |
| [app.js:6240](../../../mapa-concretagem/app.js#L6240) | Dashboards/acompanhamento | `montagem_poste` | SELECT | filtro: or(`data_fabricacao.gte.${startDateStr},updated_at.gte.${startOfRangeISO}`); ordem/pagina: -; conflito: -; retorno: DASHBOARD_MONTAGEM_SELECT | dinamico* |
| [app.js:6857](../../../mapa-concretagem/app.js#L6857) | Dashboards/acompanhamento | `producao` | SELECT | filtro: eq(setor,setor); eq(data_fabricacao,data) opcional; ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:6983](../../../mapa-concretagem/app.js#L6983) | Dashboards/acompanhamento | `producao` | SELECT | filtro: eq('setor', setor), eq('data_fabricacao', data); ordem/pagina: -; conflito: -; retorno: DASHBOARD_PRODUCAO_SELECT | dinamico* |
| [app.js:7705](../../../mapa-concretagem/app.js#L7705) | Mandril | `producao` | SELECT | filtro: eq("data_fabricacao", dataFabricacao), eq("setor", "Setor 3"), eq("forma", formaCanonica), eq("status", "LIBERADO"); ordem/pagina: order("data_hora", { ascending: false, nullsFirst: false }), limit(1); conflito: -; retorno: "id" | dinamico* |
| [app.js:7719](../../../mapa-concretagem/app.js#L7719) | Mandril | `producao` | UPDATE | filtro: eq("id", id), eq("data_fabricacao", dataFabricacao), eq("setor", "Setor 3"), eq("status", "LIBERADO"); ordem/pagina: -; conflito: -; retorno: "id,modelo,descricao_poste,codigo_produto" | dinamico* |
| [app.js:7962](../../../mapa-concretagem/app.js#L7962) | Mandril | `producao` | SELECT | filtro: eq('data_fabricacao', selectedDate), eq('setor', 'Setor 3'), eq('status', 'LIBERADO'); ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:8174](../../../mapa-concretagem/app.js#L8174) | Relatorio setor | `producao` | SELECT | filtro: eq(data_fabricacao,data); eq(setor,setor) se diferente de Todos; ordem/pagina: -; conflito: -; retorno: '*' | dinamico* |
| [app.js:8184](../../../mapa-concretagem/app.js#L8184) | Relatorio setor | `programacao_pcp` | SELECT | filtro: eq(data_fabricacao,data); eq(setor,setor) se diferente de Todos; ordem/pagina: -; conflito: -; retorno: 'data_fabricacao,setor,forma,data_hora' | dinamico* |
| [app.js:8185](../../../mapa-concretagem/app.js#L8185) | Relatorio setor | `liberacao_formas` | SELECT | filtro: eq(data_fabricacao,data); eq(setor,setor) se diferente de Todos; ordem/pagina: -; conflito: -; retorno: 'data_fabricacao,setor,forma,data_hora,colaborador' | dinamico* |
| [app.js:10316](../../../mapa-concretagem/app.js#L10316) | Fila offline/realtime | `prog_s3_s4` | UPSERT | filtro: -; ordem/pagina: -; conflito: "data,forma,setor"; retorno: - | dinamico* |
| [app.js:13440](../../../mapa-concretagem/app.js#L13440) | Exportacao | `montagem_poste` | SELECT | filtro: gte("data_fabricacao", loteInicio), lte("data_fabricacao", loteFim); ordem/pagina: order("id", { ascending: true }), range(from, to); conflito: -; retorno: select | dinamico* |
| [app.js:13559](../../../mapa-concretagem/app.js#L13559) | Exportacao | `producao` | SELECT | filtro: in("id", lote); ordem/pagina: -; conflito: -; retorno: "id,codigo_poste,descricao_poste,codigo_produto" | dinamico* |
| [app.js:14268](../../../mapa-concretagem/app.js#L14268) | Montagem/checklist | `montagem_poste` | SELECT | filtro: eq("id", row.id); ordem/pagina: -; conflito: -; retorno: DASHBOARD_MONTAGEM_SELECT | dinamico* |
| [app.js:14483](../../../mapa-concretagem/app.js#L14483) | Montagem/checklist | `montagem_poste` | UPDATE | filtro: eq("id", normRow.id), eq("status_montagem", "R"); ordem/pagina: -; conflito: -; retorno: "id,status_montagem,checklists" | dinamico* |
| [app.js:14629](../../../mapa-concretagem/app.js#L14629) | Sequencia S3 | `prog_s3_s4` | SELECT | filtro: eq("data", selectedDate), eq("setor", "Setor 3"); ordem/pagina: -; conflito: -; retorno: "forma, modelo" | dinamico* |
| [app.js:14762](../../../mapa-concretagem/app.js#L14762) | Sequencia S3 | `prog_s3_s4` | UPSERT | filtro: -; ordem/pagina: -; conflito: "data,forma,setor"; retorno: - | dinamico* |
| [app.js:14846](../../../mapa-concretagem/app.js#L14846) | ODIN | `producao` | SELECT | filtro: eq("data_fabricacao", date), eq("setor", setor), eq("forma", normalizedForma); ordem/pagina: -; conflito: -; retorno: "*" | dinamico* |
| [app.js:14911](../../../mapa-concretagem/app.js#L14911) | ODIN | `producao` | UPDATE | filtro: eq("id", current.id), eq("tipo_concreto", current.tipo_concreto); ordem/pagina: -; conflito: -; retorno: "id" | dinamico* |
| [app.js:14924](../../../mapa-concretagem/app.js#L14924) | ODIN | `producao` | DELETE | filtro: eq("id", current.id), eq("tipo_concreto", current.tipo_concreto); ordem/pagina: -; conflito: -; retorno: "id" | dinamico* |

| Arquivo:linha | Tela/fluxo | Alvo | Método | Filtros/ordem/página/on_conflict/retorno | Perfil |
|---|---|---|---|---|---|
| [app.js:1484](../../../mapa-concretagem/app.js#L1484) | PROD_ANALISE | `rpc_dashboard_produtividade_resumo_v1` via `rpcName` | RPC POST | parâmetros montados em [app.js:11301](../../../mapa-concretagem/app.js#L11301); retorno `data` | dinâmico* |
| [app.js:10380](../../../mapa-concretagem/app.js#L10380) | Liberação/manutenção | `custom-producao-channel` | Realtime subscribe | `postgres_changes`, `*`, `public.producao` e `public.formas_manutencao`; sem paginação | dinâmico* |
| [inspecao-defeitos.js:165](../../../mapa-concretagem/inspecao-defeitos.js#L165) | Inspeção S3/S4 — registrar/análise/postes | `inspecao_defeitos` | SELECT | `*`, `order(data_desforma desc)`, `range(offset, offset+499)` | permissão `inspecao` |
| [inspecao-defeitos.js:194](../../../mapa-concretagem/inspecao-defeitos.js#L194) | Inspeção S3/S4 — editar | `inspecao_defeitos` | UPDATE | `eq(id, editing.id)`, retorno mínimo no adaptador | permissão `inspecao` |
| [inspecao-defeitos.js:194](../../../mapa-concretagem/inspecao-defeitos.js#L194) | Inspeção S3/S4 — registrar | `inspecao_defeitos` | INSERT | `payload`, retorno mínimo no adaptador | permissão `inspecao` |
| [inspecao-defeitos.js:296](../../../mapa-concretagem/inspecao-defeitos.js#L296) | Inspeção S3/S4 — excluir | `inspecao_defeitos` | DELETE | `eq(id,row.id)`, retorno mínimo no adaptador | permissão `inspecao` |
| [sheets_service.py:41](../../../unificado/pcp/backend/app/services/sheets_service.py#L41) | PCP Produção Realizada e Programado × Realizado | `SUPABASE_PRODUCAO_TABLE` (`producao`) | GET REST | `select=data_fabricacao,setor,forma,modelo,status`; `status=LIBERADO`; período/setor opcionais; ordem data/setor/modelo/forma; páginas de 1000; cache 300 s | usuário PCP autorizado |
| [sheets_service.py:96](../../../unificado/pcp/backend/app/services/sheets_service.py#L96) | PCP Programação circular S3 | `producao_diaria` | GET REST | `select=data_producao,forma,tipo_poste,quantidade,setor`; `setor=3`; período opcional; ordem data/forma; 404 retorna lista vazia | usuário PCP autorizado |

O cliente do PCP legado em `/opt/pcp-concrefer/app/services/sheets_service.py` usa os mesmos GETs, mas sua configuração aponta para o host Supabase. No Unificado, `/etc/pcp-unificado/pcp.env` mantém os nomes `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PRODUCAO_TABLE`, porém o host configurado é `127.0.0.1`. A interface ainda chama `/api/producao/supabase` ([producao/index.html:700](../../../unificado/pcp/producao/index.html#L700)); o backend mantém esse alias ([pcp.py:1686](../../../unificado/pcp/backend/app/api/routers/pcp.py#L1686)).

### Bridges, publicação e segredos — nomes, sem valores

O Mapa fonte declara `SUPABASE_CONFIG` em [app.js:208](../../../mapa-concretagem/app.js#L208), carrega `supabase.js` em [index.html:5](../../../mapa-concretagem/index.html#L5) e o precacheia em [sw.js:22](../../../mapa-concretagem/sw.js#L22). O build de operação copia o SDK e reescreve a URL para `/unificado/mapa/api` ([build_unificado_mapa_operacao.py:70](../../../scripts/build_unificado_mapa_operacao.py#L70), [107](../../../scripts/build_unificado_mapa_operacao.py#L107)); o build de tablet também o copia e altera a configuração ([build_unificado_mapa_tablet.py:30](../../../scripts/build_unificado_mapa_tablet.py#L30)). O bridge reescreve `*.supabase.co` para a API local ([bridge.js:15](../../../unificado/mapa/operacao/bridge.js#L15)); `unificado-bridge.js` ainda tem tratamento textual de Supabase. `deploy/scripts/preparar_env.py` gera `SUPABASE_URL` e `SUPABASE_ANON_KEY` para PCP ([linha 30](../../../deploy/scripts/preparar_env.py#L30)). A Inspeção PWA aponta para a API local via [api.js:2](../../../unificado/m/inspecao/api.js#L2) e [index.html:80](../../../unificado/m/inspecao/index.html#L80), embora mantenha o nome `supabaseClient` no adaptador.

Locais de variáveis observados: `SUPABASE_URL` e `SUPABASE_SECRET_KEY` em `/opt/concrefer-unificado/migration/supabase-source.env` (modo `600`); `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PRODUCAO_TABLE` em `/etc/pcp-unificado/pcp.env` e `/opt/pcp-concrefer/.env`; `SUPABASE_CONFIG.URL` e `SUPABASE_CONFIG.KEY` no Mapa fonte. Não foram registrados valores de chaves, senhas ou tokens.

## 2. Escritores por tabela e sincronização atual

| Tabela | Escrita Supabase observável no código | Escrita PostgreSQL observável | Evidência de atividade até 22/10 | Dono ainda indefinido? |
|---|---|---|---|---|
| `producao` | Mapa legado: insert/update/delete, inspeção e ODIN | Mapa Unificado via PostgREST local | origem até 14/10; destino até 22/10 | sim, durante corte |
| `programacao_pcp` | Mapa legado: upsert/delete | Mapa Unificado | origem até 07/10; destino até 22/10 | sim |
| `liberacao_formas` | Mapa legado: upsert | Mapa Unificado | origem **100 registros de 22/10**; destino **0 de 22/10**, último 21/10 | **sim; origem ainda ativa** |
| `montagem_poste` | Mapa legado: upsert/update | Mapa Unificado | origem até 13/10; destino até 22/10 | sim |
| `formas_manutencao` | Mapa legado: upsert | Mapa Unificado | 2 dos dois lados, sem mudança após 30/07 | sim, se voltar a gravar |
| `prog_s3_s4` | Mapa legado: upsert e fila offline | Mapa Unificado: código pode gravar, tabela local vazia | origem 52 até 21/10; destino 0 | **sim; falta importação** |
| `usuarios` | Mapa legado: upsert/update | Mapa Unificado/autenticação local | origem 38 até 08/10; destino 59 até 21/10 | requer regra de identidade |
| `inspecao_defeitos` | não exposta na API Supabase consultada | Inspeção PWA e Mapa Unificado | destino 0 | local |
| `dashboard_retrabalho_eventos_v1` | não localizado escritor ativo | local 0 | ambos 0 | confirmar catálogo |
| `producao_diaria` | script avulso antigo de importação circular S3 pode fazer DELETE/POST; endpoint fonte retornou 404 | local 0; PCP faz leitura com fallback | sem execução agendada encontrada | pendente de decisão de uso |
| `app_permissions`, `users_app`, `login_attempts`, `login_logs` | `app_permissions`: carga da migração; `users_app`: funções `admin-users`/`change-password`; `login_attempts`: `auth-login`; `login_logs`: as três funções, **se publicadas** | sem homólogos `public` locais | 69/3/63/73 na origem; implantação das funções não comprovada | sim |

O Mapa legado publicado em `vps-rh:/opt/resultado-ensaios-usina/current/mapa-concretagem/app.js` usa domínio Supabase e contém operações insert/upsert/update/delete. Nginx o serve em `/mapa-concretagem/` ([configuração legada, linhas 65–68](/etc/nginx/sites-available/dashboard-usina)). A versão `mapa-concretagem-teste` também contém escrita, mas o roteamento ativo dela não foi comprovado. O PCP legado ativo (`pcp-concrefer.service`) lê o Supabase pelos GETs de `sheets_service.py`; não foi encontrado POST/PATCH/DELETE nesse serviço. O script avulso `/opt/pcp-concrefer/scripts/import_programacao_circular_s3_supabase.py` tem DELETE/POST ([linhas 261–295](/opt/pcp-concrefer/scripts/import_programacao_circular_s3_supabase.py)), sem agenda encontrada.

**Sync Supabase → PostgreSQL rodando hoje:** não foi identificado em `systemd` (services/timers), cron, nem processos das duas VPS inspecionadas. Os scripts `refresh_mapa_snapshot.py`, `refresh_unificado_snapshots.py`, `sync_mapa_producao_source_order.py` e `sync_mapa_montagem_source_order.py` existem, mas não aparecem em agendamentos ativos; são instrumentos de fotografia/importação manual, no sentido **Supabase → PostgreSQL de testes**, sem frequência automática comprovada. O Mapa no navegador executa sincronização de fila local a cada 30 segundos e pull de telas a cada 3 minutos ([app.js:10363](../../../mapa-concretagem/app.js#L10363)), mas isso não replica bancos. Portanto, a frequência do sync de banco atualmente observada é **nenhuma**. A ausência de logs internos do projeto Supabase limita uma afirmação absoluta sobre automações fora das VPS.

## 3. Projeto Supabase — inventário observado

REST/OpenAPI expõe **12 tabelas**: `app_permissions`, `producao`, `formas_manutencao`, `montagem_poste`, `programacao_pcp`, `liberacao_formas`, `login_attempts`, `usuarios`, `users_app`, `prog_s3_s4`, `login_logs`, `dashboard_retrabalho_eventos_v1`. Expõe **3 views**: `vw_dashboard_producao_base_v1`, `vw_formas_status`, `vw_dashboard_montagem_base_v1`. Expõe **15 rotas RPC**: `rpc_dashboard_produtividade_tendencia_v1`, `my_access_context`, `dashboard_jsonb_rejected_labels_v1`, `dashboard_jsonb_count_value_v1`, `rpc_dashboard_montagem_ranking_v1`, `rpc_dashboard_produtividade_detalhe_v1`, `rpc_dashboard_montagem_lista_v1`, `dashboard_sector_code_v1`, `rpc_dashboard_produtividade_resumo_v1`, `dashboard_scope_sectors_v1`, `is_master`, `rpc_dashboard_defeitos_resumo_v1`, `rpc_dashboard_retrabalho_resumo_v1`, `dashboard_jsonb_string_leaf_count_v1`, `rpc_dashboard_montagem_resumo_v1`.

Storage: `GET /storage/v1/bucket` retornou lista vazia: **0 buckets, 0 objetos, 0 bytes** visíveis por essa chave. Busca por `supabase.co/storage/` nas colunas de texto/JSON das tabelas operacionais expostas não encontrou registros; no destino, 116 colunas texto/JSON de `public` foram examinadas e nenhuma apontou para esse caminho.

Auth: `GET /auth/v1/admin/users` paginado retornou **3 usuários** do provedor e-mail, os 3 confirmados e com registro de login anterior. Os 3 correspondem por ID e e-mail aos 3 registros de `users_app`; **0 dos 3 e-mails** coincide com os 26 e-mails cadastrados em `pcp_unificado_teste.public.usuarios`. Isso não resolve o vínculo com outras contas locais. A interface Mapa fonte autentica contra `public.usuarios` via [app.js:1803](../../../mapa-concretagem/app.js#L1803); a Inspeção PWA usa `/unificado/mapa/api/me` ([app.js:18](../../../unificado/m/inspecao/app.js#L18)); não foi encontrada tela de Mapa/PCP/Inspeção usando `supabaseClient.auth`.

Realtime: o cliente se inscreve em `public.producao` e `public.formas_manutencao`, eventos `*` ([app.js:10380](../../../mapa-concretagem/app.js#L10380)). A lista de tabelas realmente incluídas em `supabase_realtime` não pode ser confirmada pelo REST. Edge Functions: `GET /functions/v1/` respondeu 404, o que **não** é listagem administrativa. Tabelas internas, triggers, sequences, RLS/policies, `pg_cron`, Database Webhooks e catálogo completo de funções/Edge Functions continuam **não verificados**, aguardando DSN PostgreSQL de leitura ou acesso administrativo de inspeção. A OpenAPI pode omitir objetos de schemas não expostos.

**Definições versionadas, sem confirmação de implantação no projeto:** `supabase/functions/` contém `auth-login`, `admin-users` e `change-password`; [config.toml](../../../supabase/config.toml) configura JWT falso para a primeira e verdadeiro para as demais. `auth-login` escreve em `login_attempts` e `login_logs`; `admin-users` escreve em `users_app`, `login_logs` e Supabase Auth; `change-password` escreve em `users_app`, `login_logs` e Auth. As migrações em `supabase/migrations/` e [supabase-formas-manutencao.sql](../../../mapa-concretagem/supabase-formas-manutencao.sql) definem **13 policies RLS**, **3 triggers** (`users_app_updated`, `app_permissions_updated`, `trg_prog_s3_s4_updated_at`), ao menos **3 sequences de identidade** (`login_logs`, `app_permissions`, `login_attempts`) e inclusão de `formas_manutencao` na publicação `supabase_realtime`. Não foram encontradas definições de `pg_cron` ou Database Webhooks nessas migrações. Esses números descrevem **arquivos do repositório**, não o catálogo instalado ao vivo.

## 4. Linha de base Supabase × PostgreSQL local

Leitura entre 20h e 21h BRT de 22/10. Contagens e máximos são fotografias não transacionais entre os dois sistemas; IDs foram comparados em páginas de 1.000 na origem e por SELECT no destino. `Só origem` e `só destino` são diferenças de **IDs**, não prova isolada de exclusão: podem ser escritas independentes. Divergência compara colunas comuns de negócio, ignorando credenciais e metadados de criação/alteração; normalização de timestamps apenas textual, portanto pode incluir falsos positivos.

| Objeto | Supabase: linhas / maior data | PostgreSQL: linhas / maior data | Só origem | Só destino | IDs repetidos O/D | IDs comuns divergentes |
|---|---|---|---:|---:|---|---:|
| `producao` | 23.416 / `data_hora` 14/10 16:43 UTC | 24.796 / 22/10 19:08 UTC | 8 | 1.388 | 0 / 0 | 9 |
| `formas_manutencao` | 2 / `updated_at` 30/07 18:07 UTC | 2 / mesma data | 0 | 0 | 0 / 0 | 0 |
| `montagem_poste` | 9.797 / `updated_at` 13/10 19:07 UTC | 10.595 / 22/10 19:05 UTC | 0 | 798 | 0 / 0 | 3 |
| `programacao_pcp` | 3.547 / `data_hora` 07/10 11:49 UTC | 4.610 / 22/10 18:49 UTC | 0 | 1.063 | 0 / 0 | 0 |
| `liberacao_formas` | 5.808 / `data_hora` 22/10 18:32 UTC | 5.999 / 21/10 18:37 UTC | **225** | 416 | 0 / 0 | 0 |
| `usuarios` | 38 / `updated_at` 08/10 14:03 UTC | 59 / 21/10 12:51 UTC | 0 | 21 | 0 / 0 | 4 |
| `prog_s3_s4` | 52 / `updated_at` 21/10 19:42 UTC | 0 | **52** | 0 | 0 / 0 | 0 |
| `dashboard_retrabalho_eventos_v1` | 0 | 0 | 0 | 0 | 0 / 0 | 0 |
| `app_permissions` | 69 / `updated_at` 29/06 21:53 UTC | ausente | 69 | — | não aplicável | — |
| `login_attempts` | 63 / `attempted_at` 19/10 16:12 UTC | ausente | 63 | — | não aplicável | — |
| `users_app` | 3 / `updated_at` 19/10 16:04 UTC | ausente | 3 | — | não aplicável | — |
| `login_logs` | 73 / `created_at` 19/10 16:12 UTC | ausente | 73 | — | não aplicável | — |
| `inspecao_defeitos` | não exposta | 0 | — | 0 | — | — |
| `producao_diaria` | endpoint REST 404 | 0 | — | 0 | — | — |
| `vw_dashboard_producao_base_v1` | 23.416 / 14/10 | 24.796 / 22/10 | não comparado | não comparado | — | — |
| `vw_formas_status` | 24.842 / 22/10 | 26.121 / 22/10 | sem ID único | sem ID único | — | — |
| `vw_dashboard_montagem_base_v1` | 9.797 / fabricação 09/10 | 10.595 / fabricação 21/10 | não comparado | não comparado | — | — |

Na chave natural `data_fabricacao,setor,forma,status`, `producao` tem 1.400 repetições em cada base, mas nenhum `id` duplicado; é preciso verificar se são produções múltiplas legítimas antes de deduplicar. `programacao_pcp`, `liberacao_formas` e `prog_s3_s4` não apresentaram repetição da chave natural. `producao` tem 23.137 `LIBERADO`, 137 `INSPECIONADO`, 82 `PROGRAMADA` e 60 `AGUARDANDO_CONCRETAGEM` na origem; no destino, respectivamente 24.517, 137, 82 e 60. Não há trilha de tombstone via REST para provar exclusões; o código ODIN efetua DELETE, e o código de usuários usa `ativo=false` como exclusão lógica. Cancelamentos precisam ser confrontados com auditoria/logs do catálogo interno antes de reconciliação.

Diferenças exemplares de colunas comuns: 9 registros de `producao` divergem em campos como `modelo`, `codigo_poste`, `codigo_produto` e `descricao_poste`; 3 de `montagem_poste` em `checklists`, etapa/status e horários; 4 de `usuarios` em `ativo`, setor ou `primeiro_acesso`. O mais recente `liberacao_formas` da origem e a diferença **100 registros de fabricação 22/10 na origem contra 0 no destino** são evidência concreta de que a Etapa 1 ou um corte imediato controlado será necessária antes de encerrar o legado.

Lista completa de IDs só da origem, só do destino, IDs repetidos e nomes de colunas divergentes por tabela: `/opt/concrefer-unificado/migration/etapa0-20261022/ids-diferencas.json.gz` na VPS nova, modo `600`, 91.572 bytes, SHA-256 `b0a9294bfdfb9d3ed47554e9f9c045b8d7b8f6dde1684baeed21ff2d494c3d28`. O arquivo não contém valores de negócio ou credenciais e não foi copiado para a máquina local. Hashes por linha não foram calculados; a comparação de valores comuns foi executada em memória.

## 5. Backups de destino e restauração isolada

Backup na VPS nova, fora do Git: `/opt/concrefer-unificado/migration/etapa0-20261022/`, diretório e arquivos em modo `700`/`600`. `pg_dump -Fc` foi executado como usuário PostgreSQL, com redirecionamento para arquivos root-only:

| Banco | Arquivo | Bytes | SHA-256 | Restauração isolada |
|---|---|---:|---|---|
| `mapa_unificado_teste` | `mapa_unificado_teste.dump` | 114.406.930 | `6c7c5e20380de50efc972677c3a4816def31479da64f9cdf4e0b4579fa3adb47` | OK, 60 tabelas/views em instância PG16 isolada |
| `pcp_unificado_teste` | `pcp_unificado_teste.dump` | 456.654 | `47f837c2a268430e18841aed185abc7bd433cd9f56b8098c5cf7f742818229e6` | OK, 22 tabelas/views em instância PG16 isolada |

Teste: `initdb` em `/var/tmp/etapa0-restore-isolado`, socket Unix privado, sem escuta TCP (`listen_addresses=''`), porta 55432; `createdb` e `pg_restore --exit-on-error --single-transaction --no-owner --no-privileges`; SELECT de contagem de objetos; `pg_ctl stop`; remoção da instância temporária. Os dois restores passaram. O `pg_dump` **do Supabase** não foi realizado: a DSN PostgreSQL de origem não está nas credenciais encontradas na VPS nem no projeto. O usuário autorizou deixar este item pendente. Quando retomado, o dump deverá ocorrer **Supabase → VPS nova**, em pasta root-only fora do Git, sem trânsito pelo computador local.

## 6. Decisões e pendências do plano

O anexo recebido termina na seção 5; portanto não há seis decisões literais de uma seção 6 para responder. Os seis pontos decisórios do conteúdo recebido que este levantamento permite tratar são:

1. **O Mapa legado ainda grava?** O código publicado pode gravar e `liberacao_formas` recebeu 100 registros de 22/10 só na origem. Há pelo menos um escritor no projeto Supabase, mas não é possível atribuir esses registros ao Mapa legado sem logs de requisição/auditoria; usuários e setores específicos seguem pendentes.
2. **O Mapa no Unificado grava localmente?** Sim: PostgREST local e dados novos em `producao`, `programacao_pcp` e `montagem_poste` até 22/10. Quem usou cada setor exige logs de acesso por usuário.
3. **O PCP legado grava `producao`/`producao_diaria`?** O serviço ativo lê `producao` e tenta ler `producao_diaria`; não foi localizado escritor nesse serviço. Há um script manual antigo capaz de DELETE/POST em `producao_diaria`, sem agendamento visto, e a rota fonte atual devolve 404.
4. **Existe sync contínuo Supabase → PostgreSQL?** Não encontrado em nenhuma das duas VPS; frequência automática observada: nenhuma. Os scripts de importação são manuais e escrevem no destino de testes quando executados.
5. **Storage/Auth precisam de migração?** Storage retornou zero buckets e não foram encontradas URLs de Storage nas colunas examinadas. Supabase Auth tem 3 contas, mas as telas do escopo usam `usuarios`/auth local. O vínculo de identidades ainda requer verificação individual.
6. **A Etapa 1 é necessária?** **Sim, se o Mapa legado continuar gravando**: `liberacao_formas` diverge hoje e `prog_s3_s4` falta inteiro no destino. Alternativa é parar o escritor legado por corte controlado e reconciliar; escolher a estratégia depende do usuário e das garantias de operação.

Pendentes de decisão do usuário: permanência/redirecionamento do Mapa legado por setor, dono definitivo de cada tabela durante a transição, estratégia para `producao_diaria`, vínculo das 3 contas Auth, manutenção da aba Dados e regra de eficiência acima de 100% (as duas últimas pertencem à refatoração posterior de PROD_ANALISE). Pendentes de evidência técnica: DSN e `pg_dump` histórico, catálogo interno Supabase, lista administrativa de Edge Functions, logs de requisições/escrita por cliente e reconciliação completa de exclusões.

## Resumo e limite de passagem

### Comandos e critério de aceite

Consultas feitas com credenciais carregadas somente na VPS, sem imprimir seus valores: `GET /rest/v1/` com Accept OpenAPI; `GET /rest/v1/{objeto}` paginado; GET com `Prefer: count=exact`; `GET /storage/v1/bucket`; `GET /auth/v1/admin/users` paginado. No destino: `psql -AtX -d mapa_unificado_teste -c 'SELECT ...'` para catálogo, contagem, máximos e dados comparáveis; `systemctl show`, `systemctl list-timers --all`, leitura de cron e processos nas duas VPS. Para backup: `pg_dump -Fc` dos bancos `mapa_unificado_teste` e `pcp_unificado_teste`; em instância temporária, `initdb`, `createdb`, `pg_restore --exit-on-error --single-transaction --no-owner --no-privileges`, SELECT de contagem, `pg_ctl stop` e remoção do diretório temporário. O único teste com conexão ao projeto Supabase foi de leitura.

**Etapa 0 encerrada com pendências autorizadas, sem cumprir o critério de passagem:** faltam catálogo interno e `pg_dump` histórico do Supabase, prova administrativa de Edge Functions/webhooks e definição de dono para fluxos de escrita da origem. A reversão do próprio inventário consiste apenas em retirar este MD e os artefatos de auditoria restritos, se isso for solicitado; não há alteração operacional a reverter. Nenhuma etapa posterior foi executada.

**61 pontos de chamada** no escopo (59 SDK/alias e 2 REST PCP); **12 tabelas e 3 views expostas pelo Supabase**; **ao menos 1 escritor ativo no projeto, ainda não identificado por cliente**, com Mapa legado publicado e capaz de escrever, 3 Edge Functions definidas no repositório sem implantação confirmada e 1 script avulso sem execução ativa comprovada. **Etapa 1 é necessária enquanto essa escrita permanecer**, pois não foi encontrado sync contínuo e há 225 IDs de `liberacao_formas` e 52 de `prog_s3_s4` só na origem. O catálogo completo e o dump histórico permanecem pendentes, conforme autorizado.

Nada foi alterado em código, builds, `.env`, service workers, bancos operacionais, Supabase ou serviços em operação. Foram criados apenas os backups solicitados, a evidência restrita de diferenças e este documento; a restauração de teste ocorreu em uma instância isolada já parada e removida. **Parar aqui. A Etapa 1 depende de resolução das pendências que afetam o corte e de aprovação expressa.**

## Rechecagem somente leitura — 23/10/2026, 08h33 BRT

Consultas `GET` ao REST do Supabase com a credencial já guardada na VPS nova e `SELECT count(*), max(...)` no banco `mapa_unificado_teste`, sem exibir a credencial:

| Tabela | Origem em 22/10 | Origem em 23/10 | Destino em 23/10 | Maior horário na origem | Maior horário no destino |
|---|---:|---:|---:|---|---|
| `liberacao_formas` | 5.808 | 5.833 | 5.999 | 23/10 11h19 UTC | 21/10 18h37 UTC |
| `prog_s3_s4` | 52 | 52 | 0 | 21/10 19h42 UTC | sem registros |

Em `liberacao_formas`, a origem ganhou **25 linhas líquidas** desde o inventário. A consulta de registros com `data_hora > 22/10 18h32 UTC` retornou 46 linhas: 19 do Setor 1 e 2 do Setor 2 com data de fabricação 22/10; 16 do Setor 1 e 9 do Setor 2 com data de fabricação 23/10. Esse recorte não identifica o cliente que escreveu nem distingue inserções de atualizações. A divergência operacional continua aumentando, e não há evidência de sincronização automática.

Para `data_fabricacao >= 22/10`, a comparação pela chave natural `(data_fabricacao, setor, forma)` encontrou **125 linhas na origem e nenhuma no destino**. Não há conflito de chave nesse recorte, mas isso não resolve a precedência dos registros anteriores nem prova ausência de dois escritores em dias futuros.

O túnel registrado no histórico, `ssh -N -L 18443:127.0.0.1:18380 vps-antiga`, não estava ativo na rechecagem. A porta remota `18380` responde como **ConcreTrack Dosagem v2** via Nginx; ela não fornece acesso PostgreSQL ao Supabase. Nenhuma DSN de leitura foi obtida por esse caminho. A Etapa 1 permanece sem início.

## Atualização — 23/10/2026

As conclusões acima registram o estado na data de cada levantamento. Depois, a Etapa 1 foi iniciada com autorização do usuário e o espelho contínuo das tabelas legadas entrou em operação. O usuário forneceu uma conexão PostgreSQL válida; o catálogo interno, o `pg_dump` integral e a restauração isolada das 12 tabelas públicas foram concluídos. Os resultados e as limitações da restauração integral estão em [03-corte-mapa-legado.md](03-corte-mapa-legado.md). Após uma falha transitória de paginação às 14h55 BRT, o aceite de 24 horas do espelho foi reagendado para **24/10/2026 às 15h32min40s BRT**. O usuário confirmou que não há pendências locais nos aparelhos e que o acesso real ao Mapa do Unificado foi validado; repetir essas verificações na janela de corte.
