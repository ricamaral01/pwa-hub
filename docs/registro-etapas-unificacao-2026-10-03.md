# Registro de execução — continuação da unificação

**Data:** 03/10/2026. **Ambiente de testes:** VPS `2.25.163.32`. **Oficiais:** somente leitura. Nenhuma virada executada.

## Etapa A — organização e fotografia

### A1 — concluída

- Branch: `feat/sistema-unificado`.
- Commit de consolidação: `6db01c4d` (`feat: preserve unified test site, Mapa snapshot and PCP frontend copy`). Tag de retorno: `unificado-leitura-ok-20261003`.
- Somente arquivos do unificado, seus scripts, documentos e regras de exclusão foram incluídos. Arquivos temporários e alterações preexistentes de outros projetos não entraram no commit. O bytecode Python encontrado na área do unificado foi retirado do stage.
- Comandos locais principais: `git diff --stat`, `git add -- <caminhos do unificado>`, `git diff --cached --stat`, `git grep --cached` para padrões de credenciais, `python scripts/bump_unificado.py --check`, `python -m py_compile`, `git commit`, `git tag`.
- Resultado: verificação de versão `0.2.0` passou; sintaxe Python passou; nenhuma credencial com valor foi encontrada no conjunto incluído. O arquivo original importado do PCP tem espaços finais em várias linhas; ele não foi editado manualmente para preservar a cópia gerada.

### A2 — destino encontrado; decisão de pasta pendente

- Na VPS combinada, o site publicado está em `/var/www/concretrack-unificado-tests-root/unificado/`; a API de testes em `/root/mapa-unificado-migration/api/`. A pasta proposta `/opt/concrefer-unificado/` não existe.
- Comando remoto de leitura: `find /opt/concrefer-unificado /var/www/concretrack-unificado-tests-root /root/mapa-unificado-migration -maxdepth 2 -type d`.
- Nenhuma pasta foi movida. Foi solicitado ao usuário escolher entre manter os caminhos atuais e planejar uma migração de pasta.

### A3 — fotografia repetível executada

- `scripts/refresh_mapa_snapshot.py` prepara exportação somente leitura do Supabase, conferência de contagens/hashes, importação em tabelas de estágio, backup privado `pg_dump` e troca transacional da fotografia no banco `mapa_unificado_teste`.
- O script preserva o hash de senha e o estado de primeiro acesso das contas que já existem no ambiente de testes, para que a atualização não desfaça senhas trocadas nesse ambiente.
- Comando local executado: `python -m py_compile scripts/refresh_mapa_snapshot.py`. O usuário autorizou criar o arquivo privado; ele foi criado na VPS com proprietário `root` e modo `600`, e os nomes/formato das duas variáveis foram validados sem exibir os valores.
- Os scripts `export_mapa_supabase.py` e `refresh_mapa_snapshot.py` foram transferidos para `/root/mapa-unificado-migration/`, conferidos por SHA-256 e compilados na VPS. Foi criado o ambiente Python privado `refresh-venv` com `requests==2.32.5` e `argon2-cffi==25.1.0`.
- Comandos na VPS de testes: `python3 -m venv /root/mapa-unificado-migration/refresh-venv`, `/root/mapa-unificado-migration/refresh-venv/bin/python -m pip install --disable-pip-version-check requests==2.32.5 argon2-cffi==25.1.0`, `/root/mapa-unificado-migration/refresh-venv/bin/python /root/mapa-unificado-migration/refresh_mapa_snapshot.py --dry-run` e, após a checagem, o mesmo comando sem `--dry-run`. Os comandos são mostrados aqui sem segredos; o script lê as variáveis diretamente do arquivo privado.
- A exportação de **03/10/2026 15:36:45 UTC** foi importada em tabelas de estágio, com hash dos arquivos e IDs e contagem conferidos antes da troca. O backup anterior à troca ficou em `/root/mapa-unificado-migration/snapshots/20261003T153645Z/before-refresh.dump` (`root`, modo `600`, 113.594.716 bytes). O manifesto ficou na mesma pasta privada.
- A auditoria final registrou `usuarios` 38, `programacao_pcp` 3.280, `liberacao_formas` 5.307, `producao` 22.523, `montagem_poste` 8.990, `formas_manutencao` 2 e `prog_s3_s4` 0: **40.140 registros**. A última `data_fabricacao` em `producao` continua **02/10/2026**. As senhas já trocadas no ambiente de testes foram preservadas pela operação de estágio antes da transação.

## Etapa B — chamadas do Mapa

- `scripts/inventory_mapa_calls.py` encontrou **84 referências estáticas** a Supabase, RPC, eventos, `fetch` e auxiliares de dados no `mapa-concretagem/app.js`. O índice está em `docs/matriz-chamadas-mapa.md`; contratos dinâmicos ainda exigem revisão manual.
- `scripts/capture_mapa_requests_offline.py` executou o **app.js original** em navegador local com sessão sintética e interceptação de toda chamada externa. Os 18 modos de navegação abriram. Foram bloqueados e capturados **31 pedidos externos**. Programação e desprogramação por cartão, liberação e concretagem com tipo no Setor 3 produziram os métodos REST esperados na captura sintética.
- Comandos locais: `python scripts/inventory_mapa_calls.py`, `python scripts/capture_mapa_requests_offline.py`. O JSON de pedidos ficou na pasta ignorada `.work-mapa-unificado/`; somente o resumo sem cabeçalhos e sem credenciais foi para a matriz.
- **Pendente:** capturar e comparar todos os demais fluxos listados na tarefa, preencher todos os filtros, colunas, retornos e erros da matriz. B1/B2 ainda não estão concluídas. Nenhum endpoint de escrita do unificado foi liberado.
- O código original usa Supabase Realtime para `producao` e `formas_manutencao`. O usuário autorizou reproduzir o mesmo efeito visível com eventos da API de testes; o mecanismo ainda não foi implementado.

## Leitura antecipada da Etapa E1 — dependência descoberta

Foi feito somente inventário, sem alterar a VPS oficial `31.97.241.84`:

- Comandos remotos de leitura: `psql --version`, `find /opt/pcp-concrefer -maxdepth 2 -type f`, `pg_lsclusters`, `cut -d= -f1 /opt/pcp-concrefer/.env`, `du -sh` em diretórios do aplicativo, e consultas SQL `SHOW server_version` e `pg_database_size` no banco PCP. Os valores das variáveis de ambiente não foram mostrados.
- O backend oficial é FastAPI; o banco `pcp_concrefer` é PostgreSQL **14.24**, com cerca de **16 MB** na data da leitura. Foram localizados código `app/`, frontend, `requirements.txt`, dados de layout, arquivo de credenciais Google e serviços de planilha.
- O backend consulta também Supabase `producao` e `producao_diaria` e planilhas Google. A fotografia atual do Mapa inclui `producao`, mas não `producao_diaria` nem as planilhas. Isso impede afirmar que uma cópia do backend, apontada apenas ao novo banco PCP, opera exclusivamente com dados PostgreSQL de testes.
- Esta leitura foi antecipada para verificar a condição explícita de parada da tarefa. Foi solicitada decisão sobre fotografar também essas fontes e oferecer equivalentes locais sem alterar o contrato percebido pelo usuário. E2 a E4 não foram executadas.

## Disponibilidade conferida antes de qualquer publicação nova

Comando local: `curl.exe --head --silent --show-error --max-time 12` para cada endereço. Resultado: as quatro rotas existentes do unificado retornaram **HTTP 200**; o Mapa oficial retornou **HTTP 200**; a raiz do PCP oficial retornou **HTTP 302** (redirecionamento de entrada). Nenhum arquivo ou serviço oficial foi reiniciado, modificado ou redirecionado.

## Pendências que dependem do usuário

1. **Obrigatória antes da virada:** sair de `/root/`, executar os serviços com usuário sem privilégio e consolidar em `/opt/concrefer-unificado/`. Durante os testes, manter os caminhos atuais.
2. Resolver a origem de `producao_diaria`: a tabela não existe no projeto Supabase do Mapa consultado em 03/10/2026. Os detalhes, a leitura somente leitura das planilhas e as credenciais privadas da VPS de testes estão em `docs/fontes-externas-pcp-unificado.md`. A autorização para eventos em tempo real do Mapa já foi recebida.

Após A3, as quatro rotas existentes do unificado foram reconferidas e responderam HTTP 200. O Mapa oficial respondeu HTTP 200 e a entrada do PCP oficial permaneceu em HTTP 302. Nenhuma recarga de Nginx foi necessária porque não houve publicação nova. Antes de qualquer publicação, serão feitos os três backups e `nginx -t` exigidos pela tarefa.

## Etapas E e F — backend PCP isolado e publicado para testes

- O usuário decidiu preservar `producao_diaria` vazia. Nenhum script de importação da planilha foi executado e nenhum outro projeto Supabase foi consultado. O inventário de efeitos por tela e a pendência **“confirmar com o Ricardo se o vazio é esperado”** constam em `docs/fontes-externas-pcp-unificado.md`.
- Antes das alterações, foram criados três backups privados na VPS de testes, em `/root/mapa-unificado-migration/backups-pcp-20261003/`: `mapa-before-pcp.dump` (PostgreSQL), `concrefer.nginx.before-pcp.conf` (Nginx) e `unificado.before-pcp.tar.gz` (site publicado), todos com modo `600`. O dump foi listado com `pg_restore -l`.
- Em `mapa_unificado_teste`, `public.producao_diaria` foi criada com a estrutura, restrição e índice do código PCP, sem dados: **0 linhas**. `api.producao_diaria` é uma visão somente leitura para o PostgREST local. `GET` local retornou `[]`.
- O banco `pcp_concrefer` oficial foi exportado somente em leitura e restaurado no novo `pcp_unificado_teste`. As contagens exatas das **19 tabelas** coincidiram entre origem e destino. O dump privado `pcp-source.dump` ficou na mesma pasta de backups. A role `pcp_unificado_app` não tem privilégios administrativos.
- Os 47 arquivos de código e requisitos do backend em `/opt/pcp-unificado-test/` têm o mesmo hash agregado da origem: `9171a0ea43a23ddee1a9e4e5ca05d8e6653da5713ff6465e2b8940987fe7a28e`. **Nenhum arquivo do backend foi editado.** O pacote oficial `requirements.txt` omitia `httpx`; a dependência `httpx==0.27.2`, versão da VPS oficial, foi instalada somente no ambiente virtual de testes.
- A mesma cópia de 47 arquivos foi incluída no workspace em `unificado/pcp/backend/`, com o mesmo hash agregado. `__pycache__/` é ignorado pelo Git; nenhum `.env` nem JSON de credencial foi colocado na pasta.
- O arquivo privado `/etc/pcp-unificado/pcp.env` (modo `600`) configura `SUPABASE_URL` para `127.0.0.1:13053`. Nginx nessa porta aceita apenas GET/HEAD, remove cabeçalhos de autenticação Supabase e encaminha a `/rest/v1/` do PostgREST local, que lê `producao` e `producao_diaria` do PostgreSQL de testes. As consultas e respostas do backend permaneceram iguais, sem acesso do processo ao host Supabase. A regra Google e as duas IDs de planilhas permaneceram iguais às do oficial.
- `pcp-unificado-test.service` executa a API como usuário sem privilégio `pcp-unificado`, somente em `127.0.0.1:13054`; o Nginx publicou a rota independente `https://concrefer.concretrack.com.br/unificado/pcp/api/`. `nginx -t` passou antes da recarga. A rota sem token respondeu `403`; com token gerado localmente para uma conta existente no banco copiado, oito rotas de leitura responderam `200`, incluindo produção, dashboard, volume, Apontamento Mega e PCP Diário. `Acompanhamento Mensal` respondeu `200` ao usar os parâmetros corretos `ano=2026&mes=10`. Nenhum dado ou credencial do token foi exibido.
- A chamada da cópia a `producao_diaria` devolveu **0 linhas** e a chamada a `producao` devolveu 191 apontamentos para 02/10/2026, ambas via `127.0.0.1`. A integração Google foi testada como usuário do serviço, apenas com leituras. A interface PCP copiada ainda tem bloqueio de escrita e login PCP ainda não integrado à casca; esta publicação entrega a **API de testes**, não libera operação pelas 24 telas.
- A comparação da leitura de 02/10/2026 entre oficial e cópia deu **191 registros brutos idênticos** (`SHA-256 8ffbd978fbeb0e71749b0f2a4fbbd4cb42910534d42f9298086fb5c8f81bea17`) e **28 grupos consolidados idênticos** (`SHA-256 62f05e1422dfaceb3f90c47bb9c7b7b982bc92133df14e62520c86f94a726108`). `producao_diaria` devolveu 0 linhas em ambos. Essa prova é para a data comparada; dados posteriores à fotografia do Mapa exigem atualização para continuar iguais.
- Depois da publicação, as quatro rotas existentes do unificado continuaram em HTTP 200. A rota nova sem autenticação devolveu HTTP 403. PCP e Mapa oficiais continuaram acessíveis com HTTP 200. As portas 13053 e 13054 escutam apenas em `127.0.0.1` na VPS de testes.

### Retorno das etapas E/F

O retorno da API consiste em desabilitar `pcp-unificado-test.service` e retirar somente o bloco `location ^~ /unificado/pcp/api/` do Nginx, após comparar a configuração atual com `concrefer.nginx.before-pcp.conf`; validar com `nginx -t` antes do reload. A configuração local adicional é `/etc/nginx/conf.d/pcp-unificado-postgrest-local.conf`. Os bancos e backups permanecem preservados para auditoria; nenhum `DROP` é necessário para tirar a API do ar. Os caminhos antigos e o site unificado anterior não dependem da nova API.

## Ampliação da conferência e testes de escrita — 03/10/2026

- A auditoria em `docs/auditoria-paridade-pcp-2026-10-03.md` comparou **12 datas** entre 31/07 e 03/10, cobrindo viradas de semana e mês, e **3 períodos mensais** (agosto, setembro e 01–03/10). Foram 63 pares de respostas HTTP 200, com GET apenas nos dois ambientes e hashes SHA-256 individuais. **59 respostas são iguais; 4 divergem.** Todas as diferenças são em `totais` do PCP Diário: 14/08, `volume_programado` oficial 29,84 e cópia 29,85 m³; 17/09, oficial 81,54 e cópia 81,55 m³, vista em três janelas. As listas `linhas` dessas respostas são iguais. A causa do arredondamento segue em análise; nenhuma regra do backend foi alterada para esconder a diferença. A tela Comparação usa o endpoint `GET /api/dashboard`, coberto pela auditoria.
- Antes de escrever, foi criado o backup privado `backups-pcp-20261003/pcp-before-synthetic.dump` (modo `600`) e conferido com `pg_restore -l` (233 itens). O script reproduzível `scripts/test_pcp_backend_writes.py` validou que seu `DATABASE_URL` era local e terminava em `pcp_unificado_teste`, e que `SUPABASE_URL` apontava para `127.0.0.1`. Todas as chamadas de escrita foram feitas somente à API de testes com conta sintética.
- Passaram: criação e edição de usuário; login, troca de senha de primeiro acesso e novo login; programação S1/S2 em lote, S3 e S4 individuais, leitura da Programação Final (quatro linhas); programação circular S3/S4 por período e por dia; mão de obra; apontamento Mega. Nenhuma escrita foi enviada à API oficial.
- O usuário autorizou **usar a planilha de outubro** no teste. A cópia recebeu apenas a configuração `SPREADSHEET_ID_10` e a seleção dessa ID quando ambas as datas são de outubro de 2026. A planilha é `10 - Controle de Produção Out - 2026` (`17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM`). A prévia foi somente leitura; o botão `POST /api/pcp/alocacao-formas/importar`, com `substituir=false` em 09/10 para S3, leu a planilha e inseriu **43** programações no banco de testes. Ele não gravou na planilha. Ao final, o script apagou por IDs somente as linhas sintéticas e a conta criada. **Todas as contagens das tabelas públicas voltaram à linha de base** (`cleanup_deltas={}`). O oficial continua escolhendo agosto para outubro, conforme a pendência em `docs/fontes-externas-pcp-unificado.md`.

## Portão antes da publicação do frontend PCP

| Etapa do Mapa | Estado em 03/10/2026 | Evidência e falta principal |
|---|---|---|
| B — matriz de chamadas | **Parcial** | 84 referências estáticas e 31 chamadas capturadas em 18 modos; filtros, respostas, erros e fluxos dinâmicos ainda não foram conferidos em toda a matriz. |
| C — servidor compatível | **Parcial** | Sessão, PostgreSQL de testes, PostgREST de leitura e `vw_formas_status` existem. Escritas, RPCs, fotos, integração PCP e eventos equivalentes ao Realtime ainda faltam. |
| D — operação completa na rota nova | **Não concluída** | `/unificado/mapa/` oferece consulta histórica; o tablet de trabalho não foi publicado nem homologado para apontamentos, inspeção, montagem, offline e sincronização. |

A publicação do frontend PCP e a liberação de escrita pelas páginas ficam após a conclusão de B, C e D, conforme a ordem determinada pelo usuário. A API PCP permanece isolada e publicada apenas para testes.

## Correções exigidas na continuação — 03/10/2026

- A sincronização de teste anterior leu `10 - Controle de Produção Out - 2026`, ID `17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM`, pela seleção temporária em `GoogleSheetsRepository._spreadsheet_id_para_periodo`, chamada por `AlocacaoFormasService` e `POST /api/pcp/alocacao-formas/importar`. Isso alterou dois arquivos do backend e adicionou `SPREADSHEET_ID_10` no ambiente privado. Por determinação posterior, os dois arquivos foram restaurados a partir do oficial na cópia local e na VPS; a variável foi removida. O script `scripts/verify_pcp_backend_identity.py` confirmou **47/47 arquivos idênticos**, hash do manifesto `558f4432c2edc233057388ce7d847676b3c5979418dc82f481d9f9c2575befbc`. A regra atual de outubro volta a escolher agosto em ambos os ambientes.
- A diferença de 0,01 m³ não vinha dos dados: as colunas `volume_m3_programado` de `programacoes` e `programacoes_alex` são `numeric(10,3)` nos dois bancos; os valores, quantidades e ordem das 114 e 108 parcelas examinadas eram idênticos. O rastreio de `scripts/diagnose_pcp_rounding.py` mostrou que `sum()` no Python **3.10.12** do oficial produzia `29.845` e `81.54499999999996`, enquanto o Python **3.12.3** da cópia produzia `29.845000000000002` e `81.545`; `round(..., 2)` explicava as respostas. Um ambiente Python **3.10.22** foi criado dentro de `/opt/pcp-unificado-test/`, sem editar o backend, e a unidade `pcp-unificado-test.service` passou a usá-lo. A unidade anterior ficou em backup privado. A repetição completa da auditoria deu **63/63 pares idênticos**, HTTP 200, com hashes em `docs/auditoria-paridade-pcp-2026-10-03.md`.

## Continuação das etapas B e infraestrutura — 03/10/2026

- A varredura estática ampliada encontrou 143 ocorrências de API de dados, armazenamento local e cache no `app.js` original; **86 locais são candidatos a chamada de rede**. A captura Playwright, ainda inteiramente sem rede externa, registrou 31 pedidos e mapeou suas pilhas a 16 linhas de origem. Os cabeçalhos `Prefer` e `Range`, presença de `apikey`, query e corpo foram guardados em fixtures **rascunho** em `tests/mapa/fixtures/`. Como as respostas ainda são sintéticas vazias e faltam os demais perfis, setores e fluxos, B segue parcial e nenhum fixture passou pelo contrato real.
- `scripts/verificar_unificado.sh` foi instalado na VPS de testes e passou: início, login, histórico, consulta, saúde da API Mapa, proteção da API PCP, acessibilidade dos dois oficiais e 12 arquivos publicados sem chamada de dados para os domínios oficiais. A biblioteca genérica `supabase.js` é excluída da varredura estática de destinos; o aplicativo que a configura é verificado.
- `scripts/backup_unificado_testes.py` foi instalado e agendado via `backup-unificado-testes.timer` às 03:10 UTC com atraso aleatório de até 10 minutos, retenção de 14 dias. O primeiro backup foi executado em 03/10/2026, com `mapa_unificado_teste` (**56.795.176 bytes**) e `pcp_unificado_teste` (**329.183 bytes**); os dois dumps foram restaurados em bancos temporários, com contagens de todas as tabelas públicas iguais às origens, e os temporários foram removidos. O serviço roda como `postgres`; o diretório `/var/backups/concrefer-unificado/` pertence a esse usuário e tem modo `700`.
- `scripts/refresh_unificado_snapshots.py` passou no pré voo e foi executado: backup anterior com restauração verificada, origem PCP lida por `pg_dump`, restauração em banco de estágio e conferência das **19 tabelas/25.198 linhas**, atualização transacional de `pcp_unificado_teste`, seguida da exportação GET/HEAD, conferência e atualização transacional do Mapa por `refresh_mapa_snapshot.py`. O Mapa registrou a exportação em **03/10/2026 18:35:43 UTC** com backup e manifesto privados. Depois, `producao_diaria` continuou com **0** linhas, os 47 arquivos PCP permaneceram idênticos, o verificador das rotas passou e a auditoria oficial × cópia permaneceu em **63/63** respostas idênticas.
- As etapas C e D continuam sem contrato completo e sem publicação operacional. A rota de escrita do Mapa ainda devolve `410` após autenticação; o frontend PCP da etapa 4 permanece não publicado.

## Etapa C — primeiro contrato RPC comprovado

- A OpenAPI oficial foi consultada somente por GET para inventariar as sete tabelas operacionais e a RPC de produtividade. A primeira execução de `scripts/audit_mapa_schema.py` registrou em `docs/diferencas-estrutura-mapa.md` a troca `usuarios.senha`/`senha_hash` e 15 diferenças de padrão ou obrigatoriedade; o alinhamento posterior reduziu estas últimas a zero. A OpenAPI não revelou índices únicos adicionais, gatilhos ou sequências, então a estrutura completa ainda não está validada.
- A função de leitura `api.rpc_dashboard_produtividade_resumo_v1` foi criada **apenas** em `mapa_unificado_teste` e recebeu `EXECUTE` apenas para `mapa_api_reader`. A API Mapa de testes ganhou um proxy autenticado para GET e POST **somente dessa RPC**, sem liberar escrita genérica. O código anterior foi guardado em backup privado antes da recarga do serviço.
- `tests/mapa/contrato.py` obteve 21 respostas oficiais por GET e comparou cada uma com GET e POST no proxy de testes, cobrindo três períodos e sete escopos: **42/42 status e corpos equivalentes** depois de retirar o timestamp dinâmico `generated_at`, previamente validado como ISO. As 31 capturas genéricas da etapa B continuam rascunhos e não entram nesse total. C ainda não está concluída.

Após novo backup dos dois bancos de testes, ambos restaurados em temporários, `unificado/mapa/database/align_source_defaults.sql` alinhou no **Mapa de testes** os padrões e a obrigatoriedade observáveis da OpenAPI oficial. A repetição de `scripts/audit_mapa_schema.py` encontrou **0 diferenças** entre as colunas comuns, inclusive as sete chaves primárias; a única troca de coluna continua sendo `usuarios.senha` por `senha_hash`. A auditoria não demonstra índices únicos adicionais, gatilhos ou sequências de origem, que a OpenAPI não expõe. A rota operacional continua fechada.

## Etapa B — captura local com fotografia de testes

- O arquivo `scripts/export_mapa_test_snapshot.py` exportou oito visões `api` do PostgreSQL de testes para uma área local ignorada pelo Git: **62.178 linhas**, sem coluna de senha. `scripts/mapa_snapshot_server.py` usou esses dados para responder localmente às leituras da interface original; os pedidos de escrita alteraram apenas cópias em memória. O navegador interceptou todas as URLs com `page.route('**/*')` e não enviou dados para hosts externos.
- A captura registrou **71 pedidos** (55 GET, 16 escritas simuladas) e mapeou todos a linhas de origem do `app.js`. O cruzamento com a varredura estática comprovou **18/73 locais de chamada de rede** exercitados; os 55 restantes constam em `tests/mapa/fixtures/coverage-summary.json`. Programação/desprogramação e concretagem por cartão foram exercitadas nos quatro setores; a liberação do Setor 4 ainda não produziu a escrita esperada no roteiro e precisa de investigação.
- Uma matriz separada abriu os 18 modos em quatro perfis e quatro setores: **288 casos de navegação**, com 184 permitidos abertos e 104 negados sem abrir. Isso não valida as ações internas. Os fixtures de captura permanecem rascunhos; B ainda não atende o critério de 100%.
