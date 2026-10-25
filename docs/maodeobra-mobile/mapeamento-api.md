# Mão de Obra mobile — mapeamento da API antes da etapa 2

> Registro da descoberta anterior à implementação. As adições aprovadas e testadas em homologação estão em [etapa 2](etapa-2-logica-comum.md); as limitações descritas abaixo eram o estado inicial.

**Estado:** análise para aprovação; nenhuma implementação ou migração feita. Conferi o código do repositório e a implementação das rotas `dia` e `grupo` instalada na homologação `:18446` em 17/10/2026. Os caminhos abaixo são os do backend FastAPI (`/api/...`); o vhost também declara o prefixo público `/unificado/pcp/api/...`. A escolha do prefixo pelo cliente na futura rota mobile deve ser verificada na etapa de integração.

## Contratos já disponíveis

| Rota | Request | Response atual | Fonte / limite |
|---|---|---|---|
| `GET /api/atividades-maodeobra?grupo_setor=12|34&ativo=true` | Query `grupo_setor`, `ativo`; aceita ainda `tipo` e `setor_id`. Bearer PCP. | Lista `{id, tipo, descricao, setor_id, grupo_setor, ordem, responsavel, fator, ativo}`. | Cadastro `atividades_mao_de_obra`. Já fornece MOD/MOI, Fab Armação como cadastrada, responsável/fator e ordem; nenhuma lista precisa ser fixa no mobile. |
| `GET /api/maodeobra/dia?data=AAAA-MM-DD&grupo_setor=12|34` | Data e grupo na query. Bearer PCP. | `{lancado: boolean, sem_producao: boolean, itens: [{atividade_id, quantidade_pessoas}]}`. | Lê `maodeobra_dias` e `maodeobra`. Só um dia/grupo; não traz hora, usuário, motivo nem total pronto. `lancado` pode ser verdadeiro por existir linha legada mesmo sem linha em `maodeobra_dias`. |
| `POST /api/maodeobra/grupo` | JSON `{data, grupo_setor, sem_producao: boolean, itens: [{atividade_id, quantidade_pessoas}]}`. Bearer PCP. Exige todas as atividades ativas do grupo uma vez. | `{lancado: true, sem_producao: boolean, itens: número_de_atividades}` após `commit`. | Faz upsert de `(data, atividade_id)` em `maodeobra` e atualiza/cria `maodeobra_dias`. **Não retorna data/hora de gravação, identidade, quantidades ou totais.** |
| `GET /api/maodeobra?data_inicio=...&data_fim=...` | Período opcional e `setor_id` opcional. Bearer PCP. | Lista de linhas `{id, data, atividade_id, setor_id, quantidade_pessoas, atividade, setor}`; `atividade` contém `tipo` e `grupo_setor`. | Permite calcular MOD/MOI por dia/grupo no cliente, mas **não retorna situação do grupo**. Não consulta `maodeobra_dias`; não distingue “lançado com zero” de “sem produção”. |

`quantidade_pessoas` é `numeric(5,2)` no banco. A tela atual aceita vírgula e valida passo de 0,5 no JavaScript; o schema da API valida valor não negativo com até duas casas, **não exige múltiplos de 0,5 no servidor**. A camada comum da etapa 2 manterá a regra atual sem alterar o contrato da API.

## Tela por tela

| Tela | Endpoint(s) | Request necessário | Dado de response usado | Existe hoje? |
|---|---|---|---|---|
| **1 — Lançamento** | `GET /atividades-maodeobra`; `GET /maodeobra/dia` | Grupo e `ativo=true`; data + grupo. | Atividade, tipo, ordem, responsável/fator; valores já salvos e situação do dia. | **Sim**, exceto hora do selo “Lançado às HH:MM”. MOD, MOI e Total podem ser calculados dos valores recebidos. |
| **2 — Conferência** | Nenhuma nova chamada; usa o carregamento da tela 1. | Nenhum request. | Data, grupo, lista digitada, totais e diferença frente aos valores que vieram de `/dia`. | **Sim**, a comparação pode ser feita no cliente. O aviso de substituição usa `lancado`. |
| **3 — Enviado** | `POST /maodeobra/grupo`; opcionalmente `GET /maodeobra/dia` para verificar o outro grupo. | JSON atual com `sem_producao:false` e todas as atividades. | POST confirma `lancado`, `sem_producao`, quantidade de itens. `/dia` informa se o outro grupo está pendente. | **Parcial**: não existe hora de gravação nem autor confirmados pelo servidor. O nome da sessão local é só dado de exibição, não prova quem gravou. |
| **4 — Erro de envio** | Mesma tentativa `POST /maodeobra/grupo`. | Mesmo JSON da tela 3; rascunho permanece no aparelho por data + grupo. | Em HTTP de erro, API fornece `detail`; falha de rede não tem response. | **Sim** para mostrar “Não enviado” e manter os números localmente. A tela não deve tratar um timeout como prova de que o servidor não gravou; ao reconectar, lê `/dia` antes de reenviar. |
| **5 — Sem produção** | `POST /maodeobra/grupo` | Mesmo JSON, `sem_producao:true` e todas as quantidades `0`. | Confirma `lancado:true` e `sem_producao:true`. | **Parcial**: a situação existe; `motivo` não está no request, no response nem em `maodeobra_dias`. |
| **6 — Histórico** | Hoje `GET /maodeobra` por período + até dois `GET /maodeobra/dia` por data para situações. | `data_inicio`, `data_fim`, grupo opcional na interface. | Linhas de atividades e, por consultas individuais, `lancado`/`sem_producao`. | **Parcial**: existe consulta de vários dias, porém sem situação e totais MOD/MOI **por grupo**. O histórico do mockup exigiria muitas chamadas e agregação no navegador. |

### Tela 3: horário e usuário

A resposta atual do POST é exatamente `{lancado, sem_producao, itens}`. `maodeobra_dias` tem somente `id`, `data`, `grupo_setor`, `sem_producao`. `maodeobra` também não tem `created_at`, `updated_at` nem usuário. O cabeçalho HTTP `Date`, o relógio do celular ou `pcp_user` do armazenamento local não são fonte confiável para dizer **“Confirmado pelo servidor às HH:MM · por Fulano”**. Para gravações antigas, essa informação não pode ser reconstruída fielmente.

O backend já identifica o usuário PCP autenticado por `require_roles(...)`, mas a rota atual descarta o objeto retornado (`_`). Ela pode passar a usá-lo sem mudar o login. A hora deve ser registrada no servidor em UTC e exibida em `America/Sao_Paulo`.

### Tela 6: período

`GET /api/maodeobra` aceita `data_inicio`/`data_fim` e inclui a atividade em cada linha. Portanto os totais **podem** ser calculados por tipo/grupo, mas o endpoint não traz uma linha para grupo pendente, a marcação `sem_producao` nem metadados do último envio. `GET /api/maodeobra/dia` resolve a situação **somente de uma data e um grupo**. O histórico legado sem `grupo_setor` continua no histórico desktop e não deve ser atribuído arbitrariamente a S1/S2 ou S3/S4.

## Menores adições propostas

| Lacuna | Adição compatível | Comportamento antigo |
|---|---|---|
| Hora e autor do último envio | Acrescentar a `maodeobra_dias` duas colunas **nulas para o legado**: `salvo_em timestamptz NULL` e `salvo_por_usuario_id integer NULL` (referência a `usuarios.id`). No POST, preencher após autenticação em cada envio/reenvio; acrescentar `data`, `grupo_setor`, `salvo_em` e `salvo_por: {id, nome}` à resposta. Acrescentar os mesmos metadados, anuláveis, ao GET `/dia`. | Corpo antigo do POST continua válido; chaves antigas da resposta permanecem. Desktop ignora as novas. Linhas antigas mostram hora/autor indisponíveis, sem hora inventada. Reenvio passa a mostrar o **último** envio. |
| Motivo de sem produção | Acrescentar `motivo_sem_producao varchar(255) NULL` em `maodeobra_dias` e `motivo: string|null` **opcional** no JSON do mesmo POST. Aceitar/preencher apenas quando `sem_producao:true`; normalizar texto vazio para `NULL`; limpar o motivo se o grupo for reenviado como produção. Incluir `motivo` no POST e GET `/dia`. | Desktop envia o JSON de hoje, sem motivo, e continua funcionando. Legado fica `NULL`. Não criar endpoint de escrita novo. |
| Histórico consolidado | Novo endpoint **somente leitura** `GET /api/maodeobra/resumo?data_inicio=AAAA-MM-DD&data_fim=AAAA-MM-DD`, limitado a um período curto (por exemplo, até 31 dias). Resposta: por data, dois grupos `{grupo_setor, lancado, sem_producao, mod, moi, total, motivo, salvo_em, salvo_por}`. Agregar `maodeobra` por `atividade.tipo` e `atividade.grupo_setor`, cruzar com `maodeobra_dias` e gerar grupos pendentes quando não houver registro. | `GET /api/maodeobra` e o histórico desktop continuam iguais. Grupos lançados com total zero seguem `lancado:true, sem_producao:false`; “sem produção” segue `true`; grupo sem registro fica `lancado:false`. Datas sem nenhum grupo lançado podem ser ocultadas **pela interface**, sem transformar ausência em zero lançado. |

**Cuidados de compatibilidade:** a migração proposta só adiciona colunas nulas; não move nem renumera registros. A API de escrita continua uma só. O resumo deve fazer leituras agregadas por período, sem consultar `/dia` dezenas de vezes. As permissões seguem as atuais: leitura para ADMIN/PCP/PRODUCAO/CONSULTA; escrita para ADMIN/PCP/PRODUCAO. A tela mobile ainda depende da permissão de tela do Unificado.

**Limite da verificação HTTP:** o contrato acima foi confirmado no código instalado na homologação, mas uma consulta pública **sem autenticação** a `/unificado/pcp/api/maodeobra/dia` retornou HTTP 500, enquanto `/api/maodeobra/dia` retornou 502. O serviço PCP local da homologação responde 200 em `/openapi.json` na porta 13054. Não fiz chamada autenticada nem alterei serviços ou Nginx. Antes dos testes funcionais da etapa 2, será necessário conferir o encaminhamento público e a sessão; essas respostas anônimas não validam o comportamento do endpoint com token.

## Decisão solicitada

Proponho aprovar as três adições acima. Elas permitem que as telas 3, 5 e 6 reproduzam os mockups com dados verdadeiros, mantendo o POST único e o desktop. Sem essa aprovação, a implementação pode prosseguir apenas com as partes que a API já fornece, sem exibir hora/autor confirmados, motivo persistido ou histórico consolidado.

## Fontes verificadas

- [Rotas PCP](../../unificado/pcp/backend/app/api/routers/pcp.py) — `GET /maodeobra`, `GET /maodeobra/dia`, `POST /maodeobra/grupo` e cadastro de atividades.
- [Schemas da API](../../unificado/pcp/backend/app/schemas/producao.py) — request do grupo e responses de atividade/linha.
- [Modelos de banco](../../unificado/pcp/backend/app/models/producao.py) e [migração dos grupos](../../unificado/pcp/backend/migrations/20261016_maodeobra_grupos.psql) — colunas e unicidade.
- [Autenticação PCP](../../unificado/pcp/backend/app/core/security.py) e [cliente da tela atual](../../unificado/pcp/static/js/maodeobra-grupos.js) — papel autenticado e uso dos endpoints.
