# Campinas — relatórios e custos na VPS nova

**Execução:** 25/10/2026, horário de São Paulo. **Escopo aprovado:** todos os
relatórios gerenciais de Campinas e custos; na VPS antiga, apenas ampliar
leitura. A origem permanece responsável por produção, ajustes de custos,
estoque e demais escritas. Pederneiras e Noroeste não foram alteradas.

## Fontes e espelho

Foi concedido `SELECT` ao papel existente `usinas_mirror_ro` em
`tbl_config_traco_campo`, `tbl_est_config_massada`, `tbl_est_custos_ajustes`,
`tbl_est_materiais`, `tbl_est_movimentos`, `tbl_nao_conformidades_apontadas`,
`tbl_paradas_apontadas` e `tbl_qrcp`. O papel já possuía `SELECT` em
`tbl_massadas` e `tbl_receitas`. Não houve alteração de API, CLP, linhas ou
esquema da origem. A conexão do sincronizador força transações somente de
leitura. O privilégio `CREATE` herdado pelo papel através de grants antigos no
esquema `public` continua sendo uma limitação anterior; este trabalho não
alterou grants globais que poderiam atingir outros serviços.

Na VPS nova, a migração
[`004_reporting.sql`](../../../../unificado/usinas/migrations/004_reporting.sql)
criou dez tabelas no esquema `usinas_reporting` em `mapa_unificado_teste`, com
`SELECT` para a API e DML apenas para `usinas-sync`. O job
[`sync_reporting.py`](../../../../unificado/usinas/sync_reporting.py) usa
snapshot `REPEATABLE READ READ ONLY` na origem, confere colunas/tipos e banco
de destino, faz upsert somente de linhas alteradas e remove ausentes na mesma
transação. Uma queda acima de 5% na contagem de qualquer tabela aborta todo o
ciclo. O timer roda a cada minuto e registra dez checkpoints com prefixo
`reporting.` em `usinas.sync_status`.

| Tabela | Linhas na carga inicial e na conferência |
|---|---:|
| `tbl_config_traco_campo` | 11 |
| `tbl_est_config_massada` | 15 |
| `tbl_est_custos_ajustes` | 3 |
| `tbl_est_materiais` | 18 |
| `tbl_est_movimentos` | 1.111 |
| `tbl_massadas` | 10.875 |
| `tbl_nao_conformidades_apontadas` | 0 |
| `tbl_paradas_apontadas` | 199 |
| `tbl_qrcp` | 3 |
| `tbl_receitas` | 270 |

`sync_reporting.py --verify` comparou todas as colunas de todas as linhas das
dez tabelas em ordem de ID: nenhuma divergência. Em 25/10, os dez checkpoints
tinham `source_count = mirror_count`, sem erro, e atraso máximo de 54 segundos.

## API e comparação

`usinas-reporting.service` escuta apenas em `127.0.0.1:3087`. O serviço usa
`usinas_reporting_ro`, conta com `SELECT` no espelho e transação somente de
leitura por padrão. O código das fórmulas veio do ERP em produção naquele dia;
credenciais embutidas na versão antiga foram substituídas por variáveis fora do
repositório. O proxy `/unificado/mapa/api/usina/reporting/` aceita somente sete
rotas GET, exige a sessão do Unificado e `usinasInicio`, e recusa convidados.
Sem sessão, rota e status retornaram HTTP 401. POST não foi exposto.

O script `parity_digest.py` comparou SHA-256 do JSON gerado diretamente pelas
funções do ERP antigo com o JSON da API nova, com filtros fixos de outubro de
2026. Foram iguais: custos, cartas de traço, consumo de materiais, fechamento
mensal, produção por período e listagem de massadas para CSV. O fechamento diário também foi igual ao
executar o ERP com o mesmo usuário do processo web e ignorar apenas
`atualizado_em` e textos variáveis de erro das fontes externas. Os dados de
volume, ocorrências, controle estatístico e demais seções coincidiram. Na data
comparada, a fonte de armações e outras consultas externas já informavam
indisponibilidade no processo web antigo; a migração não resolveu essa
indisponibilidade. O token público usado pelo adaptador do Mapa foi colocado no
arquivo de ambiente restrito da VPS nova, sem incluí-lo no código.

## Publicação e limites

Correção de navegação no mesmo dia: **Laboratório → Usina de Campinas →
Relatórios e custos** agora abre `/unificado/laboratorio/usinas-relatorios/`.
A tela usa as mesmas sete consultas de leitura do espelho. A permissão
`labUsinasRelatorios` é concedida a usuários que já têm acesso ao Laboratório,
salvo negativa explícita para essa tela; convidados continuam sem acesso aos
dados financeiros. O menu da VPS foi alterado de forma pontual para preservar
as versões publicadas de Pederneiras e dos demais módulos. O serviço do
Laboratório serve a página e seus dois arquivos de interface, enquanto a API
de relatórios permanece no proxy autenticado do Mapa. Uma publicação simultânea
do shell exigiu reconciliar a entrada do menu visual e renovar o cache para
`1.0.50-lab-reports`; o menu simples, o menu visual e o roteador foram conferidos
após essa publicação.

Conferência final do deploy em 25/10/2026: os serviços
`usinas-reporting`, `concrefer-usinas-reporting-sync.timer` e
`mapa-unificado-auth` estavam ativos. As sete consultas da API privada
responderam HTTP 200. Na rota pública, a tela sem sessão respondeu 403, a API
sem sessão respondeu 401 e POST respondeu 405. Os hashes SHA-256 dos módulos
privados, do proxy e dos arquivos da tela publicados coincidiram com os arquivos
locais. O comando `sync_reporting.py --verify`, executado no servidor com o
ambiente do serviço, confirmou todas as colunas de todas as linhas nas dez
tabelas, sem divergência. O serviço privado escutava apenas em `127.0.0.1:3087`
e não havia avisos recentes no journal dos serviços de API.

A tela `?area=relatorios` consulta as sete rotas na VPS nova, mostra aviso se
algum dos dez checkpoints passar de cinco minutos, falhar ou divergir em
contagem, e não pede login antigo nessas consultas. `native-areas.js` e
`index.html` publicados têm o mesmo SHA-256 dos arquivos locais. O cadastro de
ajustes de custo continua na origem porque grava dados. A aba **Exportar
massadas** lê o espelho e baixa CSV; o disparador de **Reports diários**
permanece indisponível na interface nova.
Estoque mantém a ponte antiga. Esses fluxos não foram apresentados como
migrados. As fórmulas de fechamento ainda contêm ajustes de competência no
código original; a migração conservou esses valores e não os converteu em
cadastro auditável.

## Operação e reversão

- Serviço de cálculo: `usinas-reporting.service`.
- Atualização: `concrefer-usinas-reporting-sync.timer` e respectivo `.service`.
- Ambiente restrito: `/etc/concrefer/usinas-reporting.env`; origem e destino do
  sincronizador: `/etc/concrefer/usinas-prod.env`.
- Backup anterior ao registro da rota: `/opt/concrefer-unificado/mapa-api/app.py.bak-usinas-reporting-20261025`.
- Backups anteriores à troca da tela: `native-areas.js.bak-reporting-20261025`
  e `index.html.bak-reporting-20261025` na pasta publicada de Usinas.

Para voltar apenas a interface, restaurar os dois arquivos publicados e
desregistrar a rota nova usando o backup de `app.py`, com reinício do serviço
`mapa-unificado-auth`. Parar o timer e o serviço privados suspende o novo
espelho sem alterar produção na origem. Antes de qualquer exclusão de dados ou
revogação de grants, verificar consumidores e cópias de segurança.
