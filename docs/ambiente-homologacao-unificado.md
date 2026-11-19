# Homologação do sistema unificado

## Etapa separada CQ 006 — aplicada em 19/11/2026

Após a autorização explícita para prosseguir sem comprovação de aplicação da
006 em produção, foi aplicado **somente** o conteúdo exato de
`/opt/concrefer-unificado/cq/migrations/006_liberacao_excepcional.sql` no banco
**`laboratorio_visual_homolog_20261118`**, em transação única. O hash do SQL é
`c95fb280c2be0a16f6467b67c87be9f78f8e88bd19e03a73c106449b39d16799`.
Nenhuma outra migração foi aplicada e nenhum arquivo de API foi alterado.

Antes da escrita, foi criado o dump customizado:

`/opt/concrefer-unificado/homolog-next/backups/cq-006-20261119T121847Z/laboratorio_visual_homolog_20261118-before-006.dump`

- Tamanho: **218.265 bytes**; arquivo privado fora da árvore pública.
- SHA-256: `cb9f80b81b23e79c1c0fbbbe376c966bb9d6c462a36975c7b4b14cde348fee03`.
- Verificação: índice `pg_restore --list` e leitura/descompressão integral com
  `pg_restore --file=/dev/null`, sem restauração ou conexão a outro banco.
- A primeira tentativa de abertura do SQL pelo usuário `postgres` foi recusada
  pelo sistema de arquivos, antes de qualquer DDL. A execução bem-sucedida usou
  os mesmos bytes do arquivo oficial pela entrada padrão, sem mudar permissões
  ou arquivos de produção, após novo dump verificado.

Foram confirmadas as quatro colunas `liberacao_excepcional_por`,
`liberacao_excepcional_nome`, `liberacao_excepcional_motivo` e
`liberacao_excepcional_em` em `cq_certificados`, além de `resultado_origem` em
`cq_resultados_data`, com os tipos oficiais. Os hashes e as contagens dos dados
preexistentes em todas as tabelas públicas, desconsiderando apenas os novos
campos, permaneceram iguais. Proprietários e permissões dos objetos também
permaneceram iguais. O comprovante inclui os resultados antes e depois.

**A aplicação da 006 em produção não foi comprovada pelo histórico de
migrações. O usuário confirmará abrindo o histórico de certificados em
produção.** Nesta etapa não houve conexão a banco de produção, alteração de
serviços, Nginx, APIs, regras ou permissões. A comparação dos `app.py` publicados
mostrou uma única diferença preexistente: o endereço padrão `CQ_VERIFY_BASE`
inclui `:18446` na cópia isolada; os arquivos não são idênticos byte a byte.
Nenhum deles foi alterado nesta etapa.

O histórico foi comprovado na **18446**, sem interceptar arquivos candidatos:

- **GERENCIA** e **LABORATORIO** têm acesso existente; página e consulta do
  histórico responderam **200** em **1440, 1024, 820 e 390px**.
- Os sete perfis da matriz foram examinados. As contas sem concessão de CQ
  mantiveram a recusa; identidades exclusivas do Planejamento não receberam
  concessão central. Nenhum acesso foi criado.
- O teste bloqueia requisições de escrita no navegador; não houve tentativa
  de salvar, emitir, corrigir ou alterar cadastros. Não houve erro JavaScript.
- As capturas 1440/390 dos dois perfis foram inspecionadas: o histórico está
  funcional; o título repetido da versão publicada foi registrado como problema
  visual a corrigir na rodada seguinte, sem aprovação visual indevida.
- Gate executado **depois da migração: 7/7**.
- Auditoria de arquivos de aplicação de produção, serviços, Nginx e IAM
  preservada. A observação operacional de fotos já documentada na rodada
  anterior permanece discriminada, sem atribuí-la a esta migração.

Relatório e evidências próprios:
[aplicação e dump](revisao-visual-unificado/homolog/cq-migracao-006/aplicacao.json),
[perfis](revisao-visual-unificado/homolog/cq-migracao-006/historico-perfis.json),
[matriz](revisao-visual-unificado/homolog/cq-migracao-006/matriz.json),
[revisão visual](revisao-visual-unificado/homolog/cq-migracao-006/revisao-visual.json),
[gate](revisao-visual-unificado/homolog/cq-migracao-006/gate.json) e
[auditoria](revisao-visual-unificado/homolog/cq-migracao-006/auditoria.json).
Os dumps permanecem somente no diretório privado da VPS.

Esta etapa será preservada em commit próprio, antes de retomar as alterações
visuais do `PROMPT_CODEX_FINAL.md`. A migração não publica a candidata visual:
a homologação continua em **1.4.25**, com a candidata **1.4.26** local.

## Etapa separada CQ 006 — 19/11/2026 — execução interrompida

A candidata visual **1.4.26** continua local, no commit `3ec8a07f`.
A **18446 permanece em 1.4.25**. A rodada visual está suspensa enquanto esta
etapa separada aguarda a condição de execução estabelecida pelo usuário.

O histórico de certificados retorna HTTP 500 porque a consulta usa
`cq_certificados.liberacao_excepcional_por`, ausente na cópia isolada. A
configuração do serviço `unificado-visual-homolog-cq.service` foi lida sem
registrar credenciais: aponta exclusivamente para
`laboratorio_visual_homolog_20261118`, em `127.0.0.1:5432`.

A migração oficial é
`/opt/concrefer-unificado/cq/migrations/006_liberacao_excepcional.sql`.
Seu arquivo publicado e a cópia em
`homolog-next/visual-full/cq/migrations/006_liberacao_excepcional.sql` têm o
mesmo SHA-256:
`c95fb280c2be0a16f6467b67c87be9f78f8e88bd19e03a73c106449b39d16799`.
Ela acrescenta exatamente estas cinco colunas, todas ausentes na consulta de
metadados feita em transação **READ ONLY** no banco de homologação:

| Tabela | Coluna | Tipo |
| --- | --- | --- |
| `cq_certificados` | `liberacao_excepcional_por` | `text` |
| `cq_certificados` | `liberacao_excepcional_nome` | `text` |
| `cq_certificados` | `liberacao_excepcional_motivo` | `text` |
| `cq_certificados` | `liberacao_excepcional_em` | `timestamptz` |
| `cq_resultados_data` | `resultado_origem` | `text` |

**Não foi possível comprovar a execução da 006 em produção.** A presença do
arquivo no código publicado não prova sua aplicação. O script publicado
`cq/deploy/deploy_phase2_production.sh` referencia apenas `001` a `005`;
`migrate.py` executa apenas `001_schema.sql`, e `app.py` não executa a 006
automaticamente. Os históricos consultados não forneceram registro de execução.
Isso também não prova que a migração nunca foi aplicada: o estado permanece
**desconhecido**, sem conexão ao banco de produção.

Conforme as condições do usuário, a execução parou antes de qualquer DDL.
Não houve dump, migração, alteração de API, regra, permissão, dados existentes,
serviços ou Nginx. O dump verificado continua obrigatório antes de qualquer
escrita futura. Nenhuma migração alternativa foi criada.

O próximo passo depende de um registro verificável da aplicação da 006 em
produção, ou de decisão explícita sobre proceder sem essa comprovação.
Somente depois será possível aplicar a migração autorizada, comprovar o
histórico com os perfis permitidos, atualizar matriz/revisão visual e executar
o gate **7/7 posterior à migração**. Esses testes ainda não foram realizados
nesta etapa; o gate anterior não os substitui.

Relatório próprio: [diagnóstico CQ 006](revisao-visual-unificado/homolog/cq-migracao-006/diagnostico.json),
com SQL oficial, hashes, fontes consultadas e limites da evidência.

## Estado final da revisão visual — 18/11/2026

A porta **18446** recebeu a versão **1.4.20**, com as fases 1–7 concluídas.
A entrega, o checklist, os arquivos alterados, as evidências e o roteiro do teste
definitivo estão no [relatório final](revisao-visual-unificado/homolog/fase-7/RELATORIO.md).
A [galeria](revisao-visual-unificado/homolog/fase-7/galeria.html) reúne as capturas.
Os registros anteriores desta página são históricos e não descrevem a versão final.

Dependências finais isoladas, além dos bancos já listados abaixo:

- `erp_visual_homolog_20261118`: somente tabelas de backup offline do ERP;
  papel exclusivo de leitura e serviço `unificado-visual-homolog-erp.service`,
  porta local **14189**. Os dois Fechamentos Diários usam essa cópia.
- `dosagem_visual_homolog_20261118`: restore do dump offline nativo de
  22/10/2026, com dump do banco vazio antes. Serviço de Dosagem continua em
  **14169**, com papel técnico próprio e sem conexão ao banco de produção.
- Monitor térmico: `unificado-visual-homolog-monitor.service`, **14190**,
  snapshot de arquivos em `homolog-next/visual-full/monitor/data`, sem banco SQL,
  sem ingestão de dispositivos publicada e sem chamadas ao serviço de produção.
- CEC Noroeste: as tabelas analíticas vazias da cópia de teste foram alinhadas
  às chaves de número de série utilizadas no código publicado; dump anterior em
  `homolog-next/backups/paridade-completa-20261118T204523Z/cec_noroeste_visual_homolog_20261118-before-serial-keys.dump`.

As regras dos Fechamentos Diários foram adicionadas somente ao snippet
`visual-full-unificado-screen-access-homolog.conf`, com backup, `nginx -t` e
recarga. O vhost de produção e seus arquivos permanecem iguais aos inventariados.
O login estreito foi preservado em folha exclusiva, carregada apenas até 1024px
e congelada por hash no teste da fase 7. O gate final é **7/7**.

Os dados desta geração são snapshots e dados de teste identificados; não há
sincronização contínua com produção. Não foram habilitados envios externos ou
workers de produção. A auditoria compara os perfis/concessões com os dumps
iniciais e os arquivos/processos de produção com o inventário anterior.

A publicação em produção continua dependendo de **aval escrito separado**.

## Continuação autorizada — paridade e fases 3–7

O usuário autorizou em 18/11/2026 a conclusão das fases restantes e a paridade
dos módulos/funções publicados, exclusivamente no ambiente de teste.
Plano antes das alterações: [alinhamento completo](revisao-visual-unificado/homolog/alinhamento-completo/PLANO.md).
Os bancos `mapa_ref_homolog_20261118`, `pcp_ref_homolog_20261118` e
`qualidade_ref_homolog_20261118` são referências descartáveis de **estrutura**
obtida de dumps locais já existentes. Não recebem conexões da aplicação nem
dados de contas. Não permitem FDW ou mapeamentos para fontes de produção.
Os bancos `mapa_validacao_homolog_20261118`, `pcp_validacao_homolog_20261118`
e `qualidade_validacao_homolog_20261118` recebem cópias privadas dos próprios
bancos de homologação para ensaiar as migrações antes de aplicá-las à 18446.

**Isolamento adicional identificado durante o ensaio:** o serviço publicado
`carta-traco-staging.service` (3088), usado pelo vhost de produção, lê
`mapa_unificado_homolog_20261016`. Esse banco antigo não receberá o alinhamento
completo nem alterações no estoque. Produção não será reconfigurada.
As novas cópias exclusivas da revisão são:

- `mapa_visual_homolog_20261118`
- `pcp_visual_homolog_20261118`
- `qualidade_visual_homolog_20261118`
- `laboratorio_visual_homolog_20261118`
- `suprimentos_visual_homolog_20261118`
- `carta_traco_visual_homolog_20261118`
- `cec_campinas_visual_homolog_20261118`
- `cec_noroeste_visual_homolog_20261118`

São criadas dos dumps dos próprios bancos de teste verificados, preservando
contas e concessões. As migrações de paridade serão aplicadas a essas cópias.
O estoque antigo de Carta Traço permanece na cópia própria da Carta Traço;
na cópia do Mapa, seu esquema antigo é arquivado por renomeação para permitir
criar o esquema publicado de Noroeste sem conversão destrutiva de dados.
CEC Campinas usa o dump offline já existente de 09/11/2026 como referência
de estrutura/dados; CEC Noroeste recebe a mesma estrutura publicada sem copiar
leituras de Campinas. Os serviços e workers de sincronização de produção não
são executados. Dados de Noroeste podem ser carregados somente de fontes de
homologação documentadas ou por operações de teste identificadas.
Suprimentos de teste usa `suprimentos_homolog_20261025`, conforme configuração
do serviço existente. Os demais bancos de aplicação documentados continuam
sendo os únicos destinos autorizados de migrações de aplicação.

## Revisão visual em 18/11/2026 — fases 1 e 2

A porta **18446** está na versão **1.4.8**, com a base compartilhada e a casca
revistas. A execução parou ao concluir a fase 2 para revisão do usuário.
As fases 3–7 não foram iniciadas e não houve publicação em produção.

- Antes da fase 1, os endpoints publicados de acesso rápido e unidades de
  Armação foram alinhados em etapa separada. Armação tem instância própria em
  `homolog-next/armacao-api`, serviço `unificado-homolog-armacao.service`, porta
  **13168**, bancos PCP/Mapa de homologação e armazenamento próprio.
- Quatro migrações publicadas de Armação somente no PCP de homologação, DDL
  de duas tabelas de acesso rápido e de `user_units` no Mapa de homologação.
  Dumps prévios dos dois bancos em
  `homolog-next/backups/visual-endpoints-20261118T175103Z`.
  Não foram importadas configurações pessoais, atribuídas unidades ou semeadas
  permissões. Relatório: [pré-fase 1](revisao-visual-unificado/homolog/pre-fase-1/RELATORIO.md).
- Somente o vhost 18446 recebeu o encaminhamento para Armação. Houve backup,
  `nginx -t` aprovado e recarga; o vhost de produção permaneceu inalterado.
- Fase 1: **1.4.7**, tokens e Geist local, build React aprovado e gate 7/7.
- Fase 2: **1.4.8**, Início/menu/listas de módulos/login desktop; 24 capturas
  finais nas larguras 1440, 1024, 820 e 390, incluindo a prévia identificada
  do componente de acesso rápido. Login estreito preservado.
- Fases visuais publicadas por cópia de arquivos estáticos com backups,
  conferência de hashes e retorno em caso de erro, sem reinício de APIs/bancos.
- Gate final **7/7**, quatro perfis conferidos e reimpressões PDF idênticas.
  Service worker atualizou 1.4.7 → 1.4.8 sem limpeza manual de cache.
- Auditoria: 394 arquivos de produção e PIDs/vhost preservados; contas,
  concessões e vínculos de identidade iguais aos backups.

Relatório e roteiro: [fase 2](revisao-visual-unificado/homolog/fase-2/RELATORIO.md).
Capturas antes/depois: [galeria](revisao-visual-unificado/homolog/fase-2/galeria.html).
Os textos abaixo registram o histórico anterior desta montagem.

## Atualização funcional de 18/11/2026 — fase 0.5

A casca e os arquivos necessários do Planejamento na porta **18446** foram
sincronizados com os arquivos efetivamente publicados da versão **1.4.6**,
sem iniciar a revisão visual. O PCP de homologação passou a fornecer as APIs
de Números de série do Setor 3, Programação da semana S1/S2 e Programação de
armaduras/relatórios.

- Código PCP: `/opt/concrefer-unificado/homolog-next/pcp-api`, serviço
  `unificado-homolog-pcp.service`, porta **13154**.
- Catálogo de telas: `screen_access.py` e `screen_catalog.json` publicados,
  em `homolog-next/mapa-api`, serviço `unificado-homolog-mapa.service`, porta
  **13152**. O `app.py`, cookies e configurações isoladas foram preservados.
- Banco alterado: **somente** `pcp_unificado_homolog_20261016`. Foram aplicadas
  as 19 revisões publicadas de `20261023_01` até **`20261111_04`**.
- Banco Mapa: `mapa_unificado_homolog_20261016`, sem migração nesta etapa.
- Backups verificados de ambos os bancos e dos arquivos substituídos:
  `/opt/concrefer-unificado/homolog-next/backups/padrao-visual-fase-0.5-20261118T171811Z`.
  Há também o backup da primeira tentativa em `...-20261118T171548Z`.
- Bibliotecas adicionadas somente ao Python de homologação, nas versões
  publicadas: Alembic 1.14.1, Mako 1.4.3, MarkupSafe 3.0.4, ReportLab 4.4.4,
  Pillow 12.3.0, openpyxl 3.1.5 e et_xmlfile 2.0.0.
- Nenhuma configuração Nginx foi alterada ou recarregada. Somente os dois
  serviços de homologação acima foram parados/iniciados.
- Perfis de usuários, 667 concessões de telas, 21 concessões de ações e
  17 vínculos de identidade foram comparados com os dumps e preservados.
- Os testes só usam a origem **18446**. O endpoint legado de leitura do Mapa
  continua local em **13153**; os DSNs conferidos apontam aos bancos de
  homologação. Não houve conexão a banco de produção ou integração externa
  de escrita. Os hashes e PIDs dos serviços de produção não mudaram.

Foram validadas as três telas nos perfis ADMIN/gerência, PCP, produção e
consulta, com recusa das escritas não permitidas. A semana **07/01/2030** foi
criada como dado de teste, salva, validada e publicada com um poste. Foram
emitidos PDFs de armaduras e séries; as reimpressões devolveram bytes
idênticos. Não houve atribuição de número definitivo a produção real.

O gate continua sendo:

```powershell
$env:UNIFICADO_BASE_URL='https://concrefer.concretrack.com.br:18446'
$env:PCP_ANON_EXPECTED='401'
python tests/unificado/modelo_a_gate.py
```

Resultado: **7/7**. O 401 anônimo é o comportamento já existente da camada
de proteção da homologação, não uma flexibilização do gate.

Relatório, migrações, inventário, capturas e limites restantes:
[`docs/revisao-visual-unificado/homolog/fase-0.5/RELATORIO.md`](revisao-visual-unificado/homolog/fase-0.5/RELATORIO.md).
As fases visuais 1–7 aguardam o ok do usuário. Os parágrafos históricos abaixo
descrevem a montagem anterior; não indicam que toda a homologação já esteja
equiparada à produção em todos os módulos.

## Endereços

- Homologação: `https://concrefer.concretrack.com.br:18446/unificado/`
- Produção: `https://concrefer.concretrack.com.br/unificado/`

A porta 18446 é uma origem separada. O service worker e o armazenamento do
navegador da homologação não controlam nem compartilham o cache da produção.
A cópia atual da casca e dos módulos fica em
`/opt/concrefer-unificado/homolog-next/public/unificado`. As telas de entrada e
início exibem uma faixa de ambiente de teste. A árvore anterior em
`/opt/concrefer-unificado/homolog` permanece como referência do Laboratório.

O Laboratório de homologação usa `laboratorio-homolog.service` na porta local
13065, código em `/opt/concrefer-unificado/homolog/laboratorio/service`, banco
`concretrack_postes_homolog` e uploads em
`/opt/concrefer-unificado/homolog/data/postes_uploads`. O banco foi clonado do
banco realmente usado pelo processo de produção em 08/10/2026,
`concretrack_postes`. O acesso às leituras do monitor de cura é somente leitura;
as rotas de ingestão de dispositivos não são publicadas na homologação.

Em 16/10/2026, a homologação foi completada com serviços, dados e caminhos
próprios na mesma VPS. O vhost da porta 18446 usa apenas os serviços locais
13115 (hub), 13152 (Mapa e autenticação), 13154 (PCP), 13160 (realtime),
13166 (Qualidade), 13170/13171 (GED) e 13065 (Laboratório). As regras do Nginx
foram copiadas da produção com destinos de teste. O `nginx -t` passou antes da
troca do vhost.

| Módulo | Banco de homologação | Arquivos de homologação |
| --- | --- | --- |
| Mapa | `mapa_unificado_homolog_20261016` | `homolog-next/mapa-api`, armazenamento de fotos próprio |
| PCP | `pcp_unificado_homolog_20261016` | `homolog-next/pcp-api` |
| Qualidade | `qualidade_homolog_20261016` | `homolog-next/qualidade/service` e `homolog-next/qualidade/uploads` |
| GED | `ged_concrefer_homolog` em Postgres Docker próprio | `homolog-next/ged/uploads` |
| Hub | `concretrack_auth_homolog_20261016` e três bancos `supervisorio_db_*_homolog_20261016` | `homolog-next/hub-api` |
| Laboratório | `concretrack_postes_homolog` | `homolog/laboratorio/service` e `homolog/data/postes_uploads` |

Os bancos GED e Qualidade foram restaurados de cópias da produção feitas para
esta montagem; o vínculo GED ativo na cópia é somente o de `user-ricardo`.
Os dumps ficam em `homolog/backups/20261016` na VPS. As strings de conexão
auditadas apontam para os bancos acima, sem imprimir credenciais. O serviço
Qualidade usa o papel exclusivo `qualidade_homolog_app`, restrito no
`pg_hba.conf` ao banco de teste. O SMTP do GED está desativado (porta local 9),
e nenhuma rotina de envio de e-mail da Qualidade foi iniciada. Integrações
externas de escrita do PCP/Mapa foram esvaziadas ou direcionadas a destinos
locais sem serviço. As chamadas do navegador são limitadas à origem de teste.
As cópias de arquivos têm o mesmo hash de árvore da produção: SPA Qualidade
`9df1fd13c11a531c4c2c…` (9 arquivos), anexos Qualidade vazios em ambas as
origens, uploads GED `606fa55cd954775af29f…` (52 arquivos) e fotos Mapa
`7fa9483a70b38a9c56f6…` (87 arquivos).

O frontend e o backend GED da homologação e os publicados em produção após a
correção do pisca usam os mesmos digests Docker, respectivamente
`sha256:1093e3dc5d3f…` e `sha256:ea49fecc2071…`. A configuração da
homologação fornece endereços e cookies de teste a essas imagens. O serviço
Qualidade da homologação tem adaptação de configuração para o banco isolado;
seu hash ainda difere do publicado em produção. A
casca de produção está em 1.0.11; a 1.0.12 candidata, com quadro oculto até
o evento `unificado-ged-ready`, está somente na porta 18446 para a janela das
20h–21h. Os demais arquivos estáticos foram copiados da versão publicada antes
das alterações candidatas. O gate de sete casos executado com
`UNIFICADO_BASE_URL=https://concrefer.concretrack.com.br:18446` passou 7/7.
O SPA Qualidade autenticado e `/api/contexto` responderam 200; o WebSocket
realtime do Mapa abriu autenticado pela origem de teste.

## Fluxo de publicação

1. Implementar no repositório e incrementar `unificado/VERSION`, as URLs com
   `?v=` no HTML/roteador e o identificador de cache em `unificado/sw.js`.
2. Copiar somente os arquivos alterados para a árvore `homolog-next` e aplicar
   `scripts/mark_unificado_homolog.py` após copiar `index.html` ou `login.html`.
3. Validar a interface, a atualização do service worker, as permissões e os
   fluxos do módulo alterado na porta 18446. Executar o gate 7/7 com
   `UNIFICADO_BASE_URL` apontando para a porta 18446.
4. Fazer backup dos arquivos de produção afetados. Publicar exatamente os
   arquivos validados na homologação, sem a faixa de teste, na árvore
   `/opt/concrefer-unificado/public/unificado` e verificar a URL de produção.

Após os testes, publicar exatamente a versão aprovada e repetir smoke e gate
na produção. Qualquer falha exige retorno aos arquivos, imagens e configuração
de Nginx salvos antes da troca.
