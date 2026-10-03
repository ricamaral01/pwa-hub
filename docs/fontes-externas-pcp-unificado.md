# Fontes externas do PCP na unificação de testes

Levantamento de 03/10/2026. VPS oficial: `31.97.241.84`. VPS de testes: **`2.25.163.32`**. O site de testes permanece em `/var/www/concretrack-unificado-tests-root/unificado/`. O material de migração permanece em `/root/mapa-unificado-migration/`; a unidade `mapa-unificado-auth.service` executa a API em `/opt/mapa-unificado-api/` como `www-data`. Nenhum serviço foi movido nesta etapa.

## `producao_diaria`

O backend oficial consulta `public.producao_diaria` em `app/services/sheets_service.py` para obter `data_producao`, `forma`, `tipo_poste`, `quantidade` e `setor`. O uso atual é associar o tipo de poste às formas especiais do Setor 3 no resultado de produção. A consulta usa o mesmo `SUPABASE_URL` do Mapa (`fbvvdyirhtgvycullsqy.supabase.co`). Quando o PostgREST devolve `404/PGRST205`, a função devolve uma lista vazia; esse é o comportamento atual.

O código em `scripts/import_programacao_circular_s3_supabase.py` define `producao_diaria` como **tabela própria**, com chave `id`, data, forma, tipo de poste, quantidade, setor e data de criação. Ele lê a programação e o layout do Google Sheets e insere registros no Supabase; com `--replace`, apaga e reinsere os registros do Setor 3 nas datas escolhidas. Não é uma visão derivada das tabelas do Mapa. Esse script é o único gravador identificado no código do PCP, e não foi encontrada execução agendada dele no cron ou em timers da VPS oficial. A frequência efetiva de execução manual não pôde ser comprovada.

Uma consulta direta e somente leitura ao projeto Supabase acima retornou **`404/PGRST205` para `public.producao_diaria`** em 03/10/2026. Na mesma consulta, `public.producao` respondeu com **22.523 linhas**. O usuário determinou preservar o resultado vazio atual e não procurar outro projeto nem executar o script de importação.

Foi criada no PostgreSQL `mapa_unificado_teste` a tabela `public.producao_diaria` **vazia**, com as sete colunas, chave primária, valores padrão, restrição de quantidade e índice único definidos no script do PCP. A visão de leitura `api.producao_diaria` expõe essa tabela ao PostgREST local. A contagem conferida após a criação foi **0** e a consulta REST local respondeu `[]`. O backend copiado não foi editado: `SUPABASE_URL` no ambiente exclusivo de testes aponta para `127.0.0.1:13053`, que encaminha as leituras REST ao PostgREST do PostgreSQL de testes. Assim, a mesma consulta do código devolve `[]` sem chamada à rede Supabase. A outra leitura, `producao`, usa a mesma origem local e a fotografia de 22.523 linhas do Mapa.

**Pendência: confirmar com o Ricardo se o vazio é esperado.** Até essa confirmação, não popular `producao_diaria` e não executar `import_programacao_circular_s3_supabase.py`.

### Telas, endpoints e indicadores afetados pelo vazio

`producao_diaria` é consultada apenas por `_fetch_programacao_circular_rows()` dentro de `get_producao_sheets()`. Ela fornece o **tipo de poste por data e forma no Setor 3** quando o registro de `producao` tem modelo genérico (`SC` ou `DT`). Com a lista vazia, o código usa, na mesma ordem já existente, a programação e alocação do PostgreSQL PCP e por último o modelo original do Mapa. Os apontamentos de `producao` continuam existindo; o vazio **não zera automaticamente a produção realizada**.

| Tela PCP | Endpoint(s) que passam pela leitura | O que aparece com `producao_diaria` vazia |
|---|---|---|
| Produção | `GET /api/producao/supabase`; alias `GET /api/producao/sheets` | Produção realizada continua vindo de `producao`; a identificação de poste do Setor 3 usa a programação/alocação PCP ou permanece `SC`/`DT` quando não há correspondência. O quadro de formas circulares (`GET /api/producao/circular-formas`) não consulta `producao_diaria`. |
| Dashboard e Comparação | `GET /api/dashboard`; `GET /api/volume-total` | Volume e peso realizados, eficiência e indicadores por setor/produto continuam calculados dos apontamentos de `producao`. O agrupamento por produto e seus volumes podem refletir o fallback de modelo do Setor 3. `volume-total` resume os mesmos volumes. |
| Apontamento Mega | `GET /api/apontamento-mega`; `GET /api/apontamento-mega/consulta` | Quantidade realizada cruzada com a programação continua vindo de `producao`; quando não há correspondência de modelo, permanecem os apontamentos locais usados como fallback pelo código. |
| Acompanhamento Mensal (Setores 1/2 e Setores 3/4) | `GET /api/acompanhamento-mensal` | Programado, realizado e totais por dia permanecem; o Setor 3 pode perder a identificação por forma que viria da tabela vazia e usar o fallback. Setores 1/2 e 4 não dependem diretamente dessa tabela. |
| PCP Diário e Relatório de Produção | `GET /api/pcp-diario` | Programado, realizado e desvios continuam calculados de `producao` e dos apontamentos locais; o agrupamento do Setor 3 pode usar o modelo de fallback. |

O campo `programacoes_alex.producao_diaria` é uma **coluna do PostgreSQL PCP**, usada na tela Programação Alex e no fallback de alocação; não é a tabela externa `public.producao_diaria`.

`public.producao`, a outra leitura Supabase do PCP, já consta da fotografia PostgreSQL do Mapa de testes com 22.523 linhas. A fotografia não recebe alterações automaticamente. A integração funcional do Mapa e a atualização contínua dos dados seguem pendentes antes da virada.

## Google Sheets lido pelo backend

O repositório `app/repositories/google_sheets_repository.py` usa exclusivamente os escopos `spreadsheets.readonly` e `drive.readonly`; as chamadas são abertura da planilha, listagem de abas e `get` em intervalos. A busca da aba de programação aceita o nome base ou um título que termina nele. Os títulos abaixo foram confirmados por metadados das planilhas em 03/10/2026.

| Planilha oficial | Tela / ação | Abas lidas | Intervalos |
|---|---|---|---|
| `08- Controle de Produção Ago - 2026` (`1eq5GNZpN_aEU0xAK-bWInmAJvFzzD-4x_PLWzytbPT8`) | PCP `Programação` → `Sincronizar Google Sheets`, Setor 3 | `20 - Prog Circular modelo mensal`; `14 - Layout  S3 Programação` | `A4:AH151`; `A1:BA39` |
| Mesma planilha | PCP `Programação` → `Sincronizar Google Sheets`, Setor 4 | `22 - Prog DT Rede mensal`; `SETOR 4` | `A4:AH69`; `A1:BA120` |
| `09 - Controle de Produção Set - 2026` (`18OwJ1bUK1xvr1WG-epDChi5na7FD2MMdsEgeJgBTpRA`) | Mesma tela e ação, somente quando início e fim estão ambos em setembro do mesmo ano | As mesmas quatro abas e intervalos, conforme o setor | Os mesmos acima |

**Pendência, sem correção:** a regra de escolha só conhece agosto e setembro de 2026. Para um período em **outubro de 2026, tanto o oficial quanto a cópia atual usam `08- Controle de Produção Ago - 2026`** (`1eq5GNZpN_aEU0xAK-bWInmAJvFzzD-4x_PLWzytbPT8`). O teste anterior de outubro usou temporariamente `10 - Controle de Produção Out - 2026` (`17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM`) por uma alteração em `app/core/config.py`, `app/repositories/google_sheets_repository.py` e `SPREADSHEET_ID_10` no ambiente privado. A instrução posterior determinou reverter tudo: os dois arquivos oficiais foram restaurados na cópia local e na VPS, a variável foi removida e os 47 arquivos do backend voltaram a ser idênticos. A aba `INICIO` (gid `1549375122`) do link não é lida pela importação. A ação da tela chama `POST /api/pcp/alocacao-formas/importar`: o backend **lê a planilha e grava a programação no PostgreSQL PCP de testes**. Não há gravação em Google Sheets no backend examinado. O endpoint `GET /api/pcp/alocacao-formas` também lê essas abas se chamado, mas não há chamada dele nas páginas oficiais localizadas.

Há ainda um script avulso, `scripts/import_programacao_circular_s3_supabase.py`, com planilha padrão histórica `05- Controle de Produção Mai- 2026` (`11BTzfxzzgYCT2Ig49p9WbDcSoz7p68mOUhUiHPclwpU`), abas `Prog Circular modelo mensal` e a primeira cujo nome contém `S3` e `Programa` (`Layout  S3 Programação` nos metadados atuais). Ele é executado fora das telas do backend, lê as planilhas e **pode escrever no Supabase** se invocado sem `--dry-run`. Não escreve no Google Sheets. Não deve ser executado como parte da cópia.

As planilhas não foram copiadas. A cópia usa as planilhas oficiais em somente leitura, com escopos `spreadsheets.readonly` e `drive.readonly`. A leitura de outubro, com a regra original, aponta para agosto e devolveu 147 linhas de programação no Setor 3 e 65 no Setor 4. Durante o teste temporário de outubro, a prévia de 09/10 mostrou 44 alocações S3 e 6 S4. O teste do botão `Sincronizar Google Sheets` em 09/10 importou **43** linhas S3 da planilha de outubro para `pcp_unificado_teste`, sem substituir linhas anteriores (`substituir=false`); a limpeza retirou as 43 linhas e as contagens de todas as tabelas voltaram à linha de base. Após o teste, a seleção voltou à regra original. A credencial Google da cópia fica **apenas na VPS de testes**, fora do repositório, em `/etc/pcp-unificado/google-service-account.json`, modo `600`, proprietária de `pcp-unificado`; o SHA-256 confere com a credencial oficial. A credencial de origem Supabase usada exclusivamente pela fotografia do Mapa está em `/root/mapa-unificado-migration/supabase-source.env`, modo `600`, fora do repositório. O backend PCP copiado não recebe essa credencial; usa somente o endpoint REST local. Nenhuma credencial foi incluída no Git.

## Pendência obrigatória antes da virada

Consolidar a publicação e os componentes necessários em `/opt/concrefer-unificado/`, retirar dependências operacionais de `/root/` e verificar que **todos** os serviços da aplicação executem com usuário Linux sem privilégio. A unidade de autenticação do Mapa já executa como `www-data`; isso não encerra a pendência para os demais componentes e arquivos. Fazer backup, ajustar permissões e unidades, validar Nginx e testar as rotas antes de qualquer virada. Até lá, manter os caminhos atuais durante os testes.
