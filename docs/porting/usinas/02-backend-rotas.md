# Backend e rotas do ConcreTrack

Levantamento em 22/10/2026 dos decoradores FastAPI da origem. Prefixo público: `https://dautomacao.com/concretrack/api`; o NGINX remove `/concretrack` e envia à porta 8010. `GET /health` e `POST /auth/login` são públicos; as demais rotas exigem `ct_session`. A tabela aponta referências diretas detectadas no corpo da função; chamadas auxiliares podem acessar outras tabelas (ver `tabelas-uso.json`). O uso desses endpoints para edição MISTA é tratado em [write-through-evidencia.md](execucao/write-through-evidencia.md); nenhuma rota foi alterada ou acionada para escrita neste levantamento.

## Matriz de acesso

- `admin` e `gerente`: todas as rotas no middleware; endpoints de usuários aplicam `require_admin` e aceitam só `admin`.
- `administrativo`: todas, porém traços, produtos e agregados apenas em leitura; gestão de usuários bloqueada.
- `pcp`: PCP e estoque (leitura/escrita); massadas, health e auth somente leitura.
- `laboratorio`: QRCP, traços, produtos e agregados (leitura/escrita); relatórios, health e auth somente leitura.
- Senha obrigatória impede qualquer rota além de `auth/me`, `auth/logout`, `auth/change-password` (`api/main.py:20-77`).

## Rotas da origem

| Método | Path após `/api` | Autorização | Dados diretos / destino | Regra / efeito | Fonte |
|---|---|---|---|---|---|
| GET | `/agregados` | admin, gerente, administrativo, laboratorio | tbl_agregados | listar agregados | `api/routers/agregados.py:21` |
| POST | `/agregados` | admin, gerente, laboratorio | tbl_agregados | criar agregado | `api/routers/agregados.py:38` |
| PUT | `/agregados/{agregado_id}` | admin, gerente, laboratorio | tbl_agregados | atualizar agregado | `api/routers/agregados.py:54` |
| PATCH | `/agregados/{agregado_id}/ativo` | admin, gerente, laboratorio | tbl_agregados | toggle ativo agregado | `api/routers/agregados.py:71` |
| DELETE | `/agregados/{agregado_id}` | admin, gerente, laboratorio | tbl_agregados | excluir agregado | `api/routers/agregados.py:88` |
| POST | `/auth/login` | Público | ct_usuarios | login | `api/routers/auth.py:146` |
| GET | `/auth/me` | todos autenticados | via auxiliares / sem tabela direta | me | `api/routers/auth.py:230` |
| POST | `/auth/logout` | todos autenticados | via auxiliares / sem tabela direta | logout | `api/routers/auth.py:235` |
| POST | `/auth/change-password` | todos autenticados | ct_usuarios | change password | `api/routers/auth.py:241` |
| GET | `/auth/access-levels` | todos autenticados | via auxiliares / sem tabela direta | access levels | `api/routers/auth.py:297` |
| GET | `/auth/users` | admin | ct_usuarios | list users | `api/routers/auth.py:311` |
| POST | `/auth/users` | admin | ct_usuarios | create user | `api/routers/auth.py:332` |
| PATCH | `/auth/users/{user_id}/status` | admin | ct_usuarios | update user status | `api/routers/auth.py:369` |
| POST | `/auth/users/{user_id}/reset-password` | admin | ct_usuarios | reset user password | `api/routers/auth.py:408` |
| POST | `/relatorios/custos/ajustes` | admin, gerente, administrativo | tbl_est_custos_ajustes, tbl_est_materiais | criar ajuste | `api/routers/custos.py:26` |
| GET | `/relatorios/custos` | admin, gerente, administrativo, laboratorio | tbl_est_custos_ajustes, tbl_est_materiais, tbl_est_movimentos | relatorio custos | `api/routers/custos.py:48` |
| GET | `/estoque/nota-fiscal/provider` | admin, gerente, administrativo, pcp | via auxiliares / sem tabela direta | Extrai dados de NF por IA; job/status | `api/routers/estoque.py:506` |
| POST | `/estoque/nota-fiscal/ler/iniciar` | admin, gerente, administrativo, pcp | via auxiliares / sem tabela direta | Extrai dados de NF por IA; job/status | `api/routers/estoque.py:511` |
| GET | `/estoque/nota-fiscal/ler/status/{job_id}` | admin, gerente, administrativo, pcp | via auxiliares / sem tabela direta | Extrai dados de NF por IA; job/status | `api/routers/estoque.py:531` |
| POST | `/estoque/nota-fiscal/ler` | admin, gerente, administrativo, pcp | via auxiliares / sem tabela direta | Extrai dados de NF por IA; job/status | `api/routers/estoque.py:539` |
| GET | `/estoque/materiais` | admin, gerente, administrativo, pcp | tbl_est_materiais | listar materiais | `api/routers/estoque.py:587` |
| POST | `/estoque/materiais` | admin, gerente, administrativo, pcp | tbl_est_materiais | criar material | `api/routers/estoque.py:608` |
| PATCH | `/estoque/materiais/{material_id}` | admin, gerente, administrativo, pcp | tbl_est_materiais | atualizar material | `api/routers/estoque.py:629` |
| GET | `/estoque/saldo` | admin, gerente, administrativo, pcp | tbl_est_config_massada, tbl_est_materiais, tbl_est_movimentos | consultar saldo | `api/routers/estoque.py:654` |
| GET | `/estoque/movimentos` | admin, gerente, administrativo, pcp | tbl_est_materiais, tbl_est_movimentos | listar movimentos | `api/routers/estoque.py:801` |
| POST | `/estoque/movimentos` | admin, gerente, administrativo, pcp | tbl_est_materiais, tbl_est_movimentos | registrar movimento | `api/routers/estoque.py:853` |
| POST | `/estoque/movimentos/rateados` | admin, gerente, administrativo, pcp | tbl_est_materiais, tbl_est_movimentos | registrar entrada rateada | `api/routers/estoque.py:916` |
| PATCH | `/estoque/movimentos/{mov_id}` | admin, gerente, administrativo, pcp | tbl_est_materiais, tbl_est_movimentos | editar entrada | `api/routers/estoque.py:1047` |
| DELETE | `/estoque/movimentos/{mov_id}` | admin, gerente, administrativo, pcp | tbl_est_movimentos | deletar movimento | `api/routers/estoque.py:1129` |
| GET | `/estoque/silos` | admin, gerente, administrativo, pcp | tbl_est_silos | listar silos | `api/routers/estoque.py:1176` |
| GET | `/estoque/silos/nivel` | admin, gerente, administrativo, pcp | tbl_est_materiais, tbl_est_movimentos, tbl_est_silos | nivel silos | `api/routers/estoque.py:1191` |
| GET | `/estoque/relatorio` | admin, gerente, administrativo, pcp | tbl_est_materiais, tbl_est_movimentos | relatorio | `api/routers/estoque.py:1274` |
| GET | `/estoque/config-massada` | admin, gerente, administrativo, pcp | tbl_est_config_massada, tbl_est_materiais | listar config massada | `api/routers/estoque.py:1329` |
| PUT | `/estoque/config-massada/{config_id}` | admin, gerente, administrativo, pcp | tbl_est_config_massada, tbl_est_materiais | atualizar config massada | `api/routers/estoque.py:1352` |
| GET | `/estoque/consumo-producao` | admin, gerente, administrativo, pcp | tbl_est_config_massada, tbl_est_materiais, tbl_massadas | consumo producao | `api/routers/estoque.py:1408` |
| GET | `/estoque/consumo-agregados/analise` | admin, gerente, administrativo, pcp | tbl_est_config_massada, tbl_est_materiais, tbl_est_movimentos, tbl_massadas | analise consumo agregados | `api/routers/estoque.py:1503` |
| POST | `/estoque/sync-consumo-producao` | admin, gerente, administrativo, pcp | tbl_est_config_massada, tbl_est_materiais, tbl_est_movimentos, tbl_massadas | Regera consumo de produção no estoque | `api/routers/estoque.py:1961` |
| GET | `/health` | Público | via auxiliares / sem tabela direta | health | `api/routers/health.py:10` |
| GET | `/health/home-metrics` | admin, gerente, administrativo, pcp, laboratorio | tbl_est_materiais, tbl_est_movimentos, tbl_est_silos, tbl_massadas | home metrics | `api/routers/health.py:15` |
| GET | `/massadas` | admin, gerente, administrativo, pcp | tbl_massadas | listar massadas | `api/routers/massadas.py:63` |
| GET | `/massadas/xlsx` | admin, gerente, administrativo, pcp | tbl_massadas | Exporta massadas em XLSX | `api/routers/massadas.py:90` |
| POST | `/pcp` | admin, gerente, administrativo, pcp | tbl_pcpsetor | save pcp | `api/routers/pcp.py:50` |
| GET | `/pcp` | admin, gerente, administrativo, pcp | tbl_pcpsetor | get pcp | `api/routers/pcp.py:77` |
| PATCH | `/pcp/{pcp_id}/status` | admin, gerente, administrativo, pcp | tbl_pcpsetor | toggle status | `api/routers/pcp.py:106` |
| DELETE | `/pcp/{pcp_id}` | admin, gerente, administrativo, pcp | tbl_pcpsetor | delete pcp | `api/routers/pcp.py:128` |
| GET | `/pcp/ordens` | admin, gerente, administrativo, pcp | tbl_leiturasetor, tbl_pcpsetor | get ordens | `api/routers/pcp.py:144` |
| GET | `/produtos` | admin, gerente, administrativo, laboratorio | tbl_produtos | listar produtos | `api/routers/produtos.py:20` |
| GET | `/produtos/{produto_id}` | admin, gerente, administrativo, laboratorio | tbl_produtos | obter produto | `api/routers/produtos.py:34` |
| POST | `/produtos` | admin, gerente, laboratorio | tbl_produtos | criar produto | `api/routers/produtos.py:45` |
| PUT | `/produtos/{produto_id}` | admin, gerente, laboratorio | tbl_produtos | atualizar produto | `api/routers/produtos.py:61` |
| DELETE | `/produtos/{produto_id}` | admin, gerente, laboratorio | tbl_produtos | excluir produto | `api/routers/produtos.py:78` |
| POST | `/qrcp` | admin, gerente, administrativo, laboratorio | CEC externo | Lê/grava rompimentos no serviço CEC | `api/routers/qrcp.py:116` |
| GET | `/qrcp` | admin, gerente, administrativo, laboratorio | CEC externo | Lê/grava rompimentos no serviço CEC | `api/routers/qrcp.py:180` |
| DELETE | `/qrcp/{item_id}` | admin, gerente, administrativo, laboratorio | CEC externo | Proxy para CEC; exclusão retorna 405 | `api/routers/qrcp.py:209` |
| GET | `/relatorios/fechamento` | admin, gerente, administrativo, laboratorio | via auxiliares / sem tabela direta | fechamento | `api/routers/relatorios.py:1104` |
| GET | `/relatorios/fechamento-diario` | admin, gerente, administrativo, laboratorio | tbl_nao_conformidades_apontadas, tbl_paradas_apontadas | fechamento diario | `api/routers/relatorios.py:1274` |
| GET | `/relatorios/cartas-traco` | admin, gerente, administrativo, laboratorio | tbl_config_traco_campo, tbl_est_custos_ajustes, tbl_est_materiais, tbl_est_movimentos, tbl_massadas, tbl_qrcp, tbl_receitas | cartas traco | `api/routers/relatorios.py:1395` |
| GET | `/relatorios/consumo` | admin, gerente, administrativo, laboratorio | tbl_est_config_massada, tbl_est_materiais, tbl_est_movimentos, tbl_massadas | consumo materiais | `api/routers/relatorios.py:1643` |
| GET | `/relatorios/producao-periodo` | admin, gerente, administrativo, laboratorio | tbl_massadas | producao periodo | `api/routers/relatorios.py:1954` |
| POST | `/relatorios/reports-diarios/pcp-producao/run` | admin, gerente, administrativo | via auxiliares / sem tabela direta | Dispara publicação de relatório PCP | `api/routers/relatorios.py:2017` |
| POST | `/tracos` | admin, gerente, laboratorio | tbl_receitas | criar traco | `api/routers/tracos.py:252` |
| GET | `/tracos` | admin, gerente, administrativo, laboratorio | via auxiliares / sem tabela direta | listar tracos | `api/routers/tracos.py:287` |
| GET | `/tracos/config-campos` | admin, gerente, administrativo, laboratorio | tbl_config_traco_campo, tbl_est_materiais | listar config campos | `api/routers/tracos.py:304` |
| PUT | `/tracos/config-campos/{config_id}` | admin, gerente, laboratorio | tbl_config_traco_campo | atualizar config campo | `api/routers/tracos.py:327` |
| GET | `/tracos/{traco_id}/resistencias-medias` | admin, gerente, administrativo, laboratorio | tbl_receitas | obter resistencias medias | `api/routers/tracos.py:353` |
| GET | `/tracos/{traco_id}` | admin, gerente, administrativo, laboratorio | via auxiliares / sem tabela direta | obter traco | `api/routers/tracos.py:385` |
| PATCH | `/tracos/{traco_id}/ativa` | admin, gerente, laboratorio | tbl_receitas | toggle ativa | `api/routers/tracos.py:413` |
| GET | `/tracos/{traco_id}/revisoes` | admin, gerente, administrativo, laboratorio | tbl_receitas | listar revisoes | `api/routers/tracos.py:447` |
| POST | `/tracos/{traco_id}/revisoes` | admin, gerente, laboratorio | tbl_receitas | criar revisao | `api/routers/tracos.py:467` |

## Instância Pederneiras

A aplicação separada em `pederneiras.concretrack.com.br` declara 57 rotas, com NGINX para porta 8011 e banco `supervisorio_db_pede`. A lista abaixo integra o escopo multiunidade; a regra de acesso deve ser validada nessa instância antes da implementação.

| Método | Path após `/api` | Fonte |
|---|---|---|
| GET | `/massadas` | `api/routers/massadas.py:63` |
| GET | `/massadas/xlsx` | `api/routers/massadas.py:90` |
| GET | `/health` | `api/routers/health.py:6` |
| GET | `/relatorios/cartas-traco` | `api/routers/relatorios.py:114` |
| GET | `/relatorios/consumo` | `api/routers/relatorios.py:337` |
| GET | `/relatorios/producao-periodo` | `api/routers/relatorios.py:648` |
| POST | `/pcp` | `api/routers/pcp.py:50` |
| GET | `/pcp` | `api/routers/pcp.py:77` |
| PATCH | `/pcp/{pcp_id}/status` | `api/routers/pcp.py:106` |
| DELETE | `/pcp/{pcp_id}` | `api/routers/pcp.py:128` |
| GET | `/pcp/ordens` | `api/routers/pcp.py:144` |
| GET | `/estoque/materiais` | `api/routers/estoque.py:239` |
| POST | `/estoque/materiais` | `api/routers/estoque.py:260` |
| PATCH | `/estoque/materiais/{material_id}` | `api/routers/estoque.py:281` |
| GET | `/estoque/saldo` | `api/routers/estoque.py:306` |
| GET | `/estoque/movimentos` | `api/routers/estoque.py:355` |
| POST | `/estoque/movimentos` | `api/routers/estoque.py:407` |
| DELETE | `/estoque/movimentos/{mov_id}` | `api/routers/estoque.py:474` |
| GET | `/estoque/silos` | `api/routers/estoque.py:498` |
| GET | `/estoque/silos/nivel` | `api/routers/estoque.py:513` |
| GET | `/estoque/relatorio` | `api/routers/estoque.py:574` |
| GET | `/estoque/config-massada` | `api/routers/estoque.py:629` |
| PUT | `/estoque/config-massada/{config_id}` | `api/routers/estoque.py:652` |
| GET | `/estoque/consumo-producao` | `api/routers/estoque.py:708` |
| POST | `/estoque/sync-consumo-producao` | `api/routers/estoque.py:805` |
| GET | `/agregados` | `api/routers/agregados.py:21` |
| POST | `/agregados` | `api/routers/agregados.py:38` |
| PUT | `/agregados/{agregado_id}` | `api/routers/agregados.py:54` |
| PATCH | `/agregados/{agregado_id}/ativo` | `api/routers/agregados.py:71` |
| DELETE | `/agregados/{agregado_id}` | `api/routers/agregados.py:88` |
| POST | `/controle-estatistico` | `api/routers/controle_estatistico.py:114` |
| GET | `/controle-estatistico` | `api/routers/controle_estatistico.py:154` |
| GET | `/produtos` | `api/routers/produtos.py:20` |
| GET | `/produtos/{produto_id}` | `api/routers/produtos.py:34` |
| POST | `/produtos` | `api/routers/produtos.py:45` |
| PUT | `/produtos/{produto_id}` | `api/routers/produtos.py:61` |
| DELETE | `/produtos/{produto_id}` | `api/routers/produtos.py:78` |
| POST | `/auth/login` | `api/routers/auth.py:146` |
| GET | `/auth/me` | `api/routers/auth.py:230` |
| POST | `/auth/logout` | `api/routers/auth.py:235` |
| POST | `/auth/change-password` | `api/routers/auth.py:241` |
| GET | `/auth/access-levels` | `api/routers/auth.py:297` |
| GET | `/auth/users` | `api/routers/auth.py:311` |
| POST | `/auth/users` | `api/routers/auth.py:332` |
| PATCH | `/auth/users/{user_id}/status` | `api/routers/auth.py:369` |
| POST | `/auth/users/{user_id}/reset-password` | `api/routers/auth.py:408` |
| POST | `/qrcp` | `api/routers/qrcp.py:45` |
| GET | `/qrcp` | `api/routers/qrcp.py:115` |
| DELETE | `/qrcp/{item_id}` | `api/routers/qrcp.py:140` |
| POST | `/tracos` | `api/routers/tracos.py:100` |
| GET | `/tracos` | `api/routers/tracos.py:133` |
| GET | `/tracos/config-campos` | `api/routers/tracos.py:150` |
| PUT | `/tracos/config-campos/{config_id}` | `api/routers/tracos.py:173` |
| GET | `/tracos/{traco_id}` | `api/routers/tracos.py:198` |
| PATCH | `/tracos/{traco_id}/ativa` | `api/routers/tracos.py:221` |
| GET | `/tracos/{traco_id}/revisoes` | `api/routers/tracos.py:255` |
| POST | `/tracos/{traco_id}/revisoes` | `api/routers/tracos.py:275` |

## Regras que exigem testes de equivalência

- Sessão assinada HMAC-SHA256, cookie `ct_session`, hash bcrypt com custo 12; validade padrão de 28.800 segundos (8 h). `api/security.py:13-116`, `api/routers/auth.py:76-81,123-133`.
- Massadas e exportação XLSX: `api/routers/massadas.py:63-148`.
- CEC: `/qrcp` encaminha à porta 3086; exclusão está desabilitada com HTTP 405. `api/routers/qrcp.py:11-209`.
- Estoque: soma de movimentos por tipo/origem, mapeamento das posições do misturador e sincronização idempotente de consumo. Data de corte 22/04/2026 no sincronizador. `api/routers/estoque.py:654-800,1408-1501,1961-2050`.
- Custos: entrada de sólidos persistida em tonelada, custo do relatório dividido por 1.000 para kg; `api/routers/relatorios.py:73-107`.
- Fechamento gerencial: horas = dias × 8,8; produtividade = m³/horas; ciclo = mediana dos intervalos positivos até 30 min; variação = `(atual/anterior - 1) × 100`. `api/routers/relatorios.py:987-1099`.
- Postes: usa volume cadastrado ou 0,430 m³ e acrescenta 5%. `api/routers/relatorios.py:335-345`.
- Há ajustes manuais de volume por competência no código; migrar como dados auditáveis, sem apagar a regra. `api/routers/relatorios.py:777-814,1111-1175`.
- As permissões acima são deduzidas do middleware. O frontend ainda aplica visibilidade por `data-permission`; testar ambos.

## Limitações verificáveis

- A listagem cobre decoradores `@router.<método>`; integrações Flask/Node têm inventário em `05-integracoes.md`.
- O acesso não executou POST, PATCH, PUT ou DELETE. Não foi criado nem alterado registro.
- As referências de tabela extraídas estaticamente podem omitir SQL montado em helpers. Conferir no teste de contrato de cada tarefa de migração.
