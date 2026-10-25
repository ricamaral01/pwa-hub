# Etapa 2B — evidência e contrato de escrita na origem

**Estado em 22/10/2026:** mapeamento estático concluído. O proprietário havia priorizado `tbl_receitas` Campinas para estudo de escrita e escolhido a rota API legada → banco antigo → espelho novo; depois decidiu **manter a API e o banco antigos intactos e continuar somente leitura**. O espelho de leitura real, com ciclo de 60 segundos, e uma outbox inerte foram criados no banco de homologação da VPS nova. A tela e a API de leitura foram depois [publicadas no Unificado oficial](DEPLOY-LEITURA-20261022.md) com um espelho de produção separado; nenhum teste de gravação na origem foi executado. **Escrita em produção exige autorização explícita, tabela por tabela.** A VPS antiga continua fonte oficial de tabelas ESPELHO e MISTAS. API e CLP mantêm seus acessos atuais, sem alteração de código. O Unificado lê apenas o espelho na VPS nova; o sincronizador é o único escritor das tabelas espelho. O acompanhamento de U01–U12 está em [fases/00-indice.md](fases/00-indice.md).

### Execução de homologação — `tbl_receitas` Campinas

Código: `unificado/usinas/migrations/001_receitas_homolog.sql`, `002_outbox_guard_homolog.sql`, `sync_receitas.py`, `concrefer-usinas-homolog.service` e `tests/`. Destino: `mapa_unificado_homolog_20261016`, esquemas `usinas` e `usinas_write`, na VPS nova. A origem real `supervisorio_db.public.tbl_receitas` foi **consultada somente em leitura**: 265 linhas, `max(id)=267`. Os testes E1–E8 usaram exclusivamente a origem sintética `usinas_source_homolog_20261022` na VPS nova e duas receitas fictícias; depois foi ligada a leitura real em homologação.

| Evidência | Resultado em 22/10/2026 |
|---|---|
| Migrações 001 e 002 no banco de homologação | aplicadas com `psql -v ON_ERROR_STOP=1`; `COMMIT` em ambas |
| Hash canônico, auditoria e mudança de esquema | `python -m unittest discover -s unificado/usinas/tests -v`: 3 testes, OK |
| E1 repetição do sync | OK; duas linhas, sem regravar `ingested_at` igual |
| E2 atualização, exclusão, revisão e hash | OK; alteração da origem refletida, linha removida e revisão 2 preservada |
| E3 refresh imediato por ID | OK; linha confirmada atualizada sem aguardar ciclo completo |
| E4 origem indisponível | OK; falha de conexão e espelho anterior preservado |
| E5 bloqueio de escrita | OK; três flags `despacho_habilitado=false`, trigger recusa INSERT na outbox |
| E6 unicidade e reversão do teste | OK; mesma chave idempotente não cria segunda operação; flag temporária e eventos revertidos |
| E7 mudança de esquema | OK; coluna inesperada na origem sintética bloqueia o ciclo sem alterar o espelho |
| E8 observabilidade do ciclo | OK; falha gerou `last_error=OperationalError`, ciclo seguinte limpou `last_error` |
| Estado após E1–E8 | 2 linhas **sintéticas** no espelho; 0 eventos na outbox; 0 flags de despacho ativas |

**Leitura real em homologação:** foi criado `usinas_mirror_ro` na VPS antiga, com `CONNECT` no banco, `USAGE` em `public` e `SELECT` em `public.tbl_receitas`; não tem INSERT/UPDATE/DELETE nessa tabela. `pg_hba.conf` ganhou uma regra `hostssl` restrita a `2.25.163.32/32`; backup em `/etc/postgresql/14/main/pg_hba.conf.bak-usinas-20261022`. Na VPS nova, `usinas-sync` tem DML somente em `usinas.receitas` e `usinas.sync_status`, sem acesso à outbox. A conexão usa `sslmode=verify-ca` com certificado da origem fixado em `/etc/concrefer/usinas-old-ca.pem`. O serviço `concrefer-usinas-homolog.service` executa o ciclo de 60 segundos. Credencial em arquivo root/grupo do serviço, fora do repositório; não há senha em logs/documentação. **Permissão herdada identificada:** `public` na origem concede `CREATE` a `PUBLIC`, inclusive ao novo papel. O papel recebeu `default_transaction_read_only=on`, e o script impõe transação somente leitura. Revogar o grant global exige auditoria dos demais usuários legados e não foi feito nesta etapa.

| Gate de leitura real | Resultado |
|---|---|
| Autorização e TLS | `probe_real_read.py`: SSL validado, `SELECT` permitido, DML negado na origem; destino homolog acessível sem INSERT na outbox |
| Primeira carga | 265 linhas de origem e 265 no espelho |
| Fidelidade | `verify_real_mirror.py`: 0 IDs faltantes, 0 extras, 0 hashes/colunas divergentes |
| Saúde do serviço | `systemctl is-active`: `active`; `sync_status`: 265/265, sem erro; outbox 0, flags ativas 0 |

Os casos E1–E8 e os gates de leitura provam o espelho/outbox em homologação. **Não** são H1–H8: estes exigem o fluxo de escrita real com API legada e seguem não executados. A prioridade de homologação não autoriza `espelho_rw`, POST/PATCH ao legado ou virada da interface. O serviço de homologação lê a origem oficial, mas nenhum processo do Unificado escreve nela. A API legada continua sem contrato comprovado de idempotência e CAS para esses endpoints.

**Tela e API do Unificado em homologação:** `unificado/mapa/api/usinas_receitas.py` acrescenta somente `GET /usina/receitas`, que verifica a sessão e a permissão `usinasInicio`, consulta `usinas.receitas` e `usinas.sync_status` com `mapa_api_login` e anuncia `edicao_habilitada=false`. `unificado/usinas/index.html` lista e filtra as receitas dentro do shell do Unificado. O Nginx da homologação protege `/unificado/usinas/` e `/unificado/usinas/index.html` com `auth_request /unificado/screen-authorize`. Seis testes unitários (três da API, três do hash) passaram; os scripts da página passaram em `node --check`; `nginx -t` passou e os serviços Mapa/Usinas estão ativos. Sem sessão, a página respondeu HTTP 403 e a API HTTP 401. O teste visual com uma sessão autorizada ainda não foi executado; portanto a renderização autenticada é pendente. Houve backup do vhost em `/etc/nginx/sites-available/unificado-homolog.conf.bak-usinas-20261022` e do app Mapa em `app.py.bak-usinas-20261022`. Nenhum arquivo da publicação de produção do Unificado foi modificado.

**Última conferência do espelho:** 265 linhas na origem declaradas pelo ciclo, 265 no espelho, sem erro, 33 segundos desde a última atualização; 0 eventos na outbox e 0 permissões de despacho ativas. O HTML instalado na homologação tem SHA-256 `efbe3e9086b4c85b07123d4aee17a5edb2b60bd86b9e45c3be317d16b72fdba5`, igual ao arquivo local. O probe pode ser repetido com `unificado/usinas/scripts/probe_homolog_state.sql`.

### Próxima etapa solicitada — chave do cadastro de receita

O proprietário definiu a chave de negócio para **novo cadastro** como `nome_traco` normalizado: espaços nas pontas removidos, sequências de espaços reduzidas a um e comparação sem distinguir maiúsculas/minúsculas. `id` é `bigint` gerado pela sequência do PostgreSQL; o mesmo nome pode aparecer em revisões. A consulta de esquema na origem mostrou apenas a chave única `tbl_receitas_pkey(id)`, sem índice/constraint exclusivo para o nome. Há 265 linhas, 64 nomes normalizados, 25 grupos com mais de uma revisão e 1 nome presente em grupos distintos. Não foram impressos nomes, valores de materiais ou credenciais.

`unificado/usinas/write_preflight.py` implementa a checagem **somente leitura na origem oficial**. Para `criar`, qualquer linha cujo nome normalizado coincida bloqueia um novo grupo; `nova_revisao` é outra ação e não deve ser bloqueada por esse mesmo nome. Os nove testes unitários passaram. Um probe com a credencial read-only `usinas_mirror_ro` detectou uma chave real existente e confirmou uma chave fictícia ausente. Não houve `INSERT`, `UPDATE` ou `DELETE` na origem.

**A checagem isolada não permite habilitar gravação ainda.** O endpoint existente `POST /tracos` (`api/routers/tracos.py:288-320` na cópia de consulta) insere sem consultar a chave normalizada, não aceita `Idempotency-Key`, não faz comparação de versão e exige `ct_session`. Entre a checagem externa e esse POST, a tela legada pode cadastrar o mesmo nome. Em timeout após o commit, a outbox não consegue repetir com garantia de efeito único. O banco antigo tampouco tem constraint para rejeitar nomes repetidos. A flag `criar` permanece desligada e H1–H8 seguem não executados. Para cumprir as regras anteriores sem afrouxá-las, é necessária uma operação transacional na origem que cheque a chave, reserve a identidade da operação e grave uma única vez, com autenticação de serviço delegada; ela exigirá ajuste aditivo da API/banco antigos ou mudança explícita da rota aprovada. A alteração não foi feita.

**Decisão do proprietário em 22/10/2026:** manter a API e o banco antigos intactos e continuar somente leitura. A proposta local de migração para proteger a chave foi retirada, sem execução. Nenhuma API de criação, worker de despacho ou permissão de escrita será habilitada por este trabalho. A checagem read-only fica como evidência técnica para uma possível decisão futura; ela não será apresentada como botão de cadastro.

## Classificação e autorização

O pedido não nomeia quais tabelas são MISTAS **aprovadas**. A matriz abaixo enumera **candidatas** por haver ação de escrita existente. Nenhuma candidata vira MISTA habilitada por constar aqui. Para cada tabela/unidade, o proprietário aprova ações exatas, perfis, data da virada da edição e quem orientará os usuários da tela legada. Após a virada da **edição humana** daquela tabela, o Unificado é a interface de edição, mas a gravação e a fonte oficial continuam na VPS antiga; jobs e CLP seguem funcionando. Sem aprovação, a tela fica só em leitura.

Tabelas como `tbl_massadas`, `tbl_leiturasetor`, `tbl_tracos` e `tbl_est_silos` não têm ação de edição humana identificada na API do ERP e permanecem propostas como ESPELHO. `ct_usuarios` é tratado pelo IAM, fora da edição de Usinas. `tbl_est_movimentos` também recebe o sincronizador de consumo; a ação automática não passa a ser disparada pelo Unificado apenas por habilitar edição humana.

| Tabela candidata | Unidade | Interface humana responsável **agora** | Interface após aprovação e virada **dessa tabela** | Situação |
|---|---|---|---|---|
| `tbl_agregados` | C/P | cadastro legado | Unificado | pendente |
| `tbl_produtos` | C/P | cadastro legado | Unificado | pendente |
| `tbl_receitas` | C/P | cartas de traço legadas | Unificado | pendente |
| `tbl_config_traco_campo` | C/P | mapeamento legado | Unificado | pendente |
| `tbl_pcpsetor` | C/P | PCP legado | Unificado, coordenado com módulo PCP | pendente |
| `tbl_est_materiais` | C/P | estoque legado | Unificado | pendente |
| `tbl_est_config_massada` | C/P | mapeamento legado | Unificado | pendente |
| `tbl_est_movimentos` | C/P | estoque legado; job continua automático | Unificado para ação humana aprovada; job permanece na origem | pendente |
| `tbl_est_custos_ajustes` | C | custos legado | Unificado | pendente |
| `tbl_paradas_apontadas` | C | Dashboard legado | Unificado | pendente |
| `tbl_nao_conformidades_apontadas` | C | Dashboard legado | Unificado | pendente |
| CEC canônico (`rompimentos*`) | C | leitura CEC legada | Unificado | pendente |
| `tbl_qrcp` | P | leitura CEC legada | Unificado | pendente |
| `tbl_controle_estatistico` | P | controle estatístico legado | Unificado | pendente |

“Unificado” nessa coluna é a **proposta após aprovação**, não uma habilitação. A orientação aos usuários evita dois formulários humanos em paralelo, embora o código da tela legada não seja modificado. A origem continua aceitando seus escritores atuais.

### Endpoints existentes por tabela e ação

Prefixo Campinas: `https://dautomacao.com/concretrack/api` (FastAPI 8010), exceto Dashboard em `https://dautomacao.com/api/usina/`. Prefixo Pederneiras: `https://pederneiras.concretrack.com.br/api` (FastAPI 8011). Os caminhos abaixo são relativos a `/api`. `C` e `P` indicam a instância disponível. `—` significa que a ação não foi encontrada nessa instância; **não** autoriza SQL direto. A linha citada é a declaração da rota; o mesmo corpo da função contém o SQL indicado.

| Candidata / unidade | Ação existente na origem | Endpoint preferencial | Evidência `arquivo:linha` | Observação |
|---|---|---|---|---|
| `tbl_agregados` C/P | criar | `POST /agregados` | C/P `api/routers/agregados.py:38` | INSERT com nome, tipo, unidade, descrição, ativo |
| `tbl_agregados` C/P | editar | `PUT /agregados/{agregado_id}` | C/P `api/routers/agregados.py:54` | substitui os campos do cadastro |
| `tbl_agregados` C/P | ativar/desativar | `PATCH /agregados/{agregado_id}/ativo` | C/P `api/routers/agregados.py:71` | só campo `ativo` |
| `tbl_agregados` C/P | excluir | `DELETE /agregados/{agregado_id}` | C/P `api/routers/agregados.py:88` | existente, **não habilitado** sem aprovação explícita de exclusão |
| `tbl_produtos` C/P | criar | `POST /produtos` | C/P `api/routers/produtos.py:45` | validações da API legada |
| `tbl_produtos` C/P | editar | `PUT /produtos/{produto_id}` | C/P `api/routers/produtos.py:61` | atualização integral |
| `tbl_produtos` C/P | excluir | `DELETE /produtos/{produto_id}` | C/P `api/routers/produtos.py:78` | existente, não habilitado por padrão |
| `tbl_receitas` C/P | criar traço | `POST /tracos` | C `api/routers/tracos.py:252`; P `api/routers/tracos.py:100` | cria grupo/revisão 1 e campos de auditoria; C `:252-285` |
| `tbl_receitas` C/P | ativar/desativar | `PATCH /tracos/{traco_id}/ativa` | C `api/routers/tracos.py:413`; P `api/routers/tracos.py:221` | desativa outras revisões do grupo, última revisão ativa; C `:413-441` |
| `tbl_receitas` C/P | nova revisão | `POST /tracos/{traco_id}/revisoes` | C `api/routers/tracos.py:467`; P `api/routers/tracos.py:275` | transação com grupo, número, origem e `alterado_por`; C `:467-505` |
| `tbl_config_traco_campo` C/P | editar mapeamento | `PUT /tracos/config-campos/{config_id}` | C `api/routers/tracos.py:327`; P `api/routers/tracos.py:173` | preservar vínculo ao material e posição |
| `tbl_pcpsetor` C/P | criar programação | `POST /pcp` | C/P `api/routers/pcp.py:50` | verificar vínculo com PCP do Unificado |
| `tbl_pcpsetor` C/P | mudar status | `PATCH /pcp/{pcp_id}/status` | C/P `api/routers/pcp.py:106` | ação parcial, não edição geral |
| `tbl_pcpsetor` C/P | excluir | `DELETE /pcp/{pcp_id}` | C/P `api/routers/pcp.py:128` | existente, não habilitado por padrão |
| `tbl_est_materiais` C/P | criar material | `POST /estoque/materiais` | C `api/routers/estoque.py:608`; P `api/routers/estoque.py:260` | manter código, categoria e unidade |
| `tbl_est_materiais` C/P | editar material | `PATCH /estoque/materiais/{material_id}` | C `api/routers/estoque.py:629`; P `api/routers/estoque.py:281` | atualização parcial |
| `tbl_est_config_massada` C/P | editar posição/mapeamento | `PUT /estoque/config-massada/{config_id}` | C `api/routers/estoque.py:1352`; P `api/routers/estoque.py:652` | valida `fator_conversao`; C SQL `:1385` |
| `tbl_est_movimentos` C/P | lançar movimento | `POST /estoque/movimentos` | C `api/routers/estoque.py:853`; P `api/routers/estoque.py:407` | conferir sinal, unidade, silo e auditoria |
| `tbl_est_movimentos` C | entrada rateada | `POST /estoque/movimentos/rateados` | C `api/routers/estoque.py:916`; P — | cria vários registros; atualização imediata do **conjunto** |
| `tbl_est_movimentos` C | corrigir movimento | `PATCH /estoque/movimentos/{mov_id}` | C `api/routers/estoque.py:1047`; P — | Pederneiras não tem ação equivalente identificada |
| `tbl_est_movimentos` C/P | excluir movimento | `DELETE /estoque/movimentos/{mov_id}` | C `api/routers/estoque.py:1129`; P `api/routers/estoque.py:474` | existente, não habilitado por padrão |
| `tbl_est_custos_ajustes` C | criar ajuste | `POST /relatorios/custos/ajustes` | C `api/routers/custos.py:26`; P — | tabela ausente em Pederneiras |
| `tbl_paradas_apontadas` C | apontar parada | `POST /usina/paradas` (Dashboard) | `dashboard-usina/app/routes_usina.py:505-506,529` | calcula `m3_perdido`; GET `:495-496` |
| `tbl_nao_conformidades_apontadas` C | abrir NC | `POST /usina/nao-conformidades` (Dashboard) | `dashboard-usina/app/routes_usina.py:593-594,613` | grava tipo, descrição, ação; GET `:555-556` |
| CEC canônico C (`rompimentos*`) | registrar leitura | `POST /qrcp` (proxy para 3086) | `api/routers/qrcp.py:70-95,116-176` | API 8010 não grava `tbl_qrcp`; gravação final é do serviço CEC |
| `tbl_qrcp` P | registrar leitura | `POST /qrcp` | P `api/routers/qrcp.py:45-119` | INSERT local em Pederneiras |
| `tbl_qrcp` P | excluir leitura | `DELETE /qrcp/{item_id}` | P `api/routers/qrcp.py:140-160` | **não habilitado** por padrão; Campinas retorna 405 (`api/routers/qrcp.py:209`) |
| `tbl_controle_estatistico` P | registrar | `POST /controle-estatistico` | P `api/routers/controle_estatistico.py:114-150` | usa `local_id` com conflito idempotente; a rota está pública no middleware P `api/main.py:55` |

**Fora da edição humana:** `POST /estoque/sync-consumo-producao` (C `api/routers/estoque.py:1961`, P `:805`) é um job que recria movimentos derivados. `POST /relatorios/reports-diarios/pcp-producao/run` também é job. Nenhum dos dois deve ser acionado como repetição de uma edição comum.

### SQL de fallback

**Nenhum SQL de escrita foi usado ou autorizado.** Todas as ações humanas localizadas acima possuem endpoint na unidade indicada. Onde a ação desejada não tem endpoint (por exemplo, corrigir movimento em Pederneiras), ela fica indisponível no Unificado até o proprietário aprovar **aquela tabela e ação** e a equivalência de colunas, revisão e auditoria ser demonstrada. Somente então se especifica SQL parametrizado `INSERT` ou `UPDATE`; `DELETE`, DDL, GRANT e escrita nas demais tabelas permanecem fora do papel `espelho_rw`. A conta **não foi criada**.

Para `UPDATE` com conflito atômico, o SQL aprovado precisaria condicionar a versão/hash no `WHERE` e usar `RETURNING`, em transação. PostgreSQL exige privilégio `SELECT` nas colunas lidas pelo `WHERE`/`RETURNING`; portanto o conjunto mínimo real de grants para `espelho_rw` precisará incluir `SELECT` restrito (ou outro mecanismo aprovado) além de `INSERT/UPDATE`. Não ampliar privilégios silenciosamente. A definição do hash tem de cobrir colunas de edição, revisão e auditoria, com serialização canônica de `numeric` e timestamps.

## Fluxo operacional proposto

1. Na VPS nova, `usinas_write.outbox` (separada das tabelas espelho) registra `operation_id`, chave idempotente, tabela, unidade, registro, ação, ator IAM, instante, payload permitido, `_source_hash` visto e estado. Não há escrita no espelho pela aplicação.
2. Antes de aceitar/enviar, o worker lê o registro **na VPS antiga**, compara hash atual com o `_source_hash` apresentado pela tela e verifica aprovação da tabela/ação/perfil. Se divergente, marca conflito e devolve HTTP 409 com convite para recarregar. O hash do espelho de até 1 minuto serve para iniciar a edição, mas não substitui essa leitura da origem.
3. Se a origem estiver indisponível, o módulo exibe modo leitura e **não aceita novas edições**. Eventos já persistidos na outbox aguardam reconciliação; o espelho continua somente leitura.
4. O worker chama uma vez o endpoint legado aprovado, com credencial/autorização válida, registrando resposta e horário. Em resposta confirmada, relê **na origem** todos os registros afetados (incluindo revisões, rateios e saldos relacionados), pede ao sincronizador atualização imediata e só mostra à tela o estado confirmado. O ciclo de 1 minuto continua como reconciliação.
5. Falha comprovadamente anterior ao envio pode ser repetida com a mesma chave. Falha após envio sem resposta é `resultado_desconhecido`: consultar origem por chave de negócio/versão e conciliar **antes** de qualquer repetição. A fila de erros mostra pendências e permite retentativa segura/assistida, nunca POST cego.
6. Guardar trilha antes/depois da origem, ator IAM, identidade legada usada, payload e resultado, sem senha/token. Habilitação e desligamento são por unidade, tabela e ação.

### Limites encontrados nos endpoints existentes

- A API FastAPI exige cookie assinado `ct_session` para escrita (`api/main.py:50-77`; P `api/main.py:47-73`). O único bridge especial identificado em Campinas é **somente leitura** do fechamento diário (`api/main.py:61-65`). O Unificado não dispõe, no mapeamento atual, de credencial delegada por usuário para esses POST/PUT/PATCH. Antes do teste de escrita é preciso definir como autenticar a chamada sem senha compartilhada e como preservar autoria legada; a API não será alterada nesta etapa.
- Busca estática em `api/*.py` das duas instâncias não encontrou suporte geral a `Idempotency-Key`, `If-Match`/ETag ou `_source_hash`. O outbox evita reenvio local, mas não torna um POST legado automaticamente idempotente após perda da resposta. A comparação imediatamente anterior ao endpoint também **não é atômica** com a gravação feita pela API; outro editor pode alterar a linha entre leitura e POST. As garantias “nunca duas vezes” e “recusar qualquer conflito” não devem ser declaradas cumpridas para uma ação enquanto esse intervalo e a resposta ambígua não tiverem solução comprovada em homologação.
- Alguns endpoints têm efeitos em várias linhas, como ativar revisão e lançar entrada rateada. Um único hash/refresh da linha principal é insuficiente.
- O `POST /controle-estatistico` de Pederneiras está isento de `ct_session` no middleware. A autorização do Unificado precisa ser checada antes de encaminhar qualquer chamada; não tomar a ausência de cookie legado como permissão de usuário.

**Gate de arquitetura:** nenhum endpoint sem contrato comprovado de autenticação, idempotência e controle de conflito pode receber edição de produção. Se não for possível cumprir isso mantendo a API inalterada e a regra “endpoint antes de SQL”, a ação permanece em leitura até nova decisão expressa do proprietário.

## Homologação — roteiro e estado

Usar ambiente isolado da produção, registros sintéticos e cópia somente de esquema; não usar os bancos oficiais para testes de escrita. Repetir para **cada tabela/ação/unidade aprovada**, incluindo efeitos secundários. Abaixo estão os critérios, **não resultados executados**: existe uma outbox inerte no banco de homologação para o espelho, mas não há worker de escrita, `espelho_rw` ou ambiente isolado de homologação da API legada para a Etapa 2B.

| Caso | Procedimento | Aceite | Estado |
|---|---|---|---|
| H1 Gravação | editar/criar pelo Unificado; observar request legado, antes/depois na origem e refresh imediato | uma escrita na origem, campos/revisões/auditoria iguais à tela legada; espelho atualizado e valor confirmado exibido | não executado |
| H2 Idempotência | repetir clique e mesma `operation_id`; simular timeout antes do envio e resposta perdida depois do commit | nenhuma linha/efeito duplicado; estado ambíguo conciliado antes de retry | não executado |
| H3 Conflito | abrir com hash A, alterar na origem por outro editor, submeter A | HTTP 409; nenhum overwrite; tela oferece recarga | não executado |
| H4 Corrida | alterar origem entre rechecagem de hash e commit do endpoint | conflito bloqueado atomicamente ou ação mantida em leitura | não executado |
| H5 Origem fora | bloquear rede para API/banco legado antes de abrir e durante envio | aviso e modo leitura; nenhuma escrita só na VPS nova; outbox pendente/ambígua visível | não executado |
| H6 Replicação | pausar ciclo de 1 min, confirmar gravação, forçar refresh do registro; depois retomar ciclo | tela recebe valor confirmado e ciclo não o regride | não executado |
| H7 Autorização | usuário sem perfil/tabela/unidade habilitada tenta operação | 403 sem outbox despachada; nenhuma alteração na origem | não executado |
| H8 Rollback | desligar flag da tabela/ação com eventos em voo | novas edições bloqueadas; eventos em voo conciliados; legado opera normalmente | não executado |

## Reversão

Desabilitar a edição daquela **tabela/ação/unidade** no Unificado e parar novos despachos da outbox. Conciliar operações `enviando` ou `resultado_desconhecido` na VPS antiga antes de encerrá-las. Manter leitura do espelho e sincronização de 1 minuto; orientar usuários a voltar à tela legada de edição. Nenhuma reversão de dados na origem é automática e **não** se restaura o espelho sobre a origem. API, CLP, serviços e banco antigos seguem normais.

## Decisões pendentes

1. Lista de tabelas/ações MISTAS aprovada por unidade e quem assume a edição humana após cada virada.
2. Identidade/autenticação válida para chamadas à API legada, com autoria verificável e sem segunda senha exposta.
3. Solução para conflito atômico e resposta ambígua dos endpoints existentes, sem alterar a API.
4. Eventual `SELECT` restrito necessário ao papel `espelho_rw` nas ações sem endpoint, além de `INSERT/UPDATE`.

**Inspeção e execução realizadas:** leitura de `api/main.py`, `api/routers/*.py` das duas instâncias, `dashboard-usina/app/routes_usina.py`, dumps de esquema locais e busca estática por `Idempotency`/`If-Match`/`_source_hash`. As migrações SQL foram aplicadas **apenas no banco de homologação da VPS nova**; E1–E8 usaram origem sintética; depois a leitura da origem real foi autorizada por papel PostgreSQL com `SELECT` restrito e conectada ao serviço de homologação. Nenhum POST à API legada, SQL de escrita nas tabelas da VPS antiga, criação de `espelho_rw` ou teste de edição em produção foi executado.
