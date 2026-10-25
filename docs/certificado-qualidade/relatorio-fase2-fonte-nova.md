# Fase 2 — fonte nova dos certificados de qualidade

**Data local:** 24/10/2026. **Estado:** homologação publicada com `CQ_FONTE_CP=novo`; uma tentativa de produção foi revertida automaticamente, portanto o módulo permanece **fora de produção**.

## Fonte e implementação

- O CEC Campinas da VPS nova roda em `cec-campinas-api.service`, `127.0.0.1:3086`, banco `controle_est_concre_campinas`. O endpoint `GET /api/controle-estatistico/rompimentos-grupos` entrega `data_moldagem`, traço, idade, CP, MPa e data de ruptura. O módulo passou a usar `source.py` com `CQ_FONTE_CP=novo|antigo`; `novo` aponta para loopback da VPS nova, `antigo` permanece no código para reversão. Nenhuma credencial foi adicionada ao repositório. Detalhes em `fonte-controle-estatistico-novo.md`.
- O cálculo usa `Decimal` com arredondamento a duas casas compatível com o SQL. Rascunhos recalculam pela fonte configurada; emitidos continuam a servir os resultados e o PDF gravados. Emissão agora exige laboratório calibrador preenchido com nome real: vazio ou “Não informado” retorna HTTP 422. A prensa Kratos do cadastro de origem mantém o placeholder até atualização pelo gestor.
- Foram adicionados `source.py`, `migrations/003_seed_prensa_existente.sql`, testes de fonte e arredondamento, scripts de auditoria e publicação. `laboratorio-unificado.service`, manifesto e service worker não foram alterados.

## Conferência de liberação substituída

O critério de dez certificados antigos foi cancelado por decisão do Ricardo. O resultado aplicado foi:

| Gate | Resultado |
| --- | --- |
| Pares legados disponíveis | **1/1**: `CQ-20260326-153230`, 04/02/2026, 28 dias **33,00 MPa** no legado, fonte antiga e fonte nova; não conforme para fck 35 |
| Dez datas de 2026 com 28 dias, cálculo independente por SQL direto em `rompimentos_atuais` | **10/10** para nº de CPs, médias 3/7/28d, traço escolhido e situação; datas em `evidencias/comparacao-fontes-20261024.json` |
| Fontes antiga × nova, últimos 90 dias (26/07–24/10/2026) | **222 leituras em cada**, zero datas ausentes, zero datas com diferença nos campos conferidos |
| Três certificados para conferência manual em `:18446` | Rascunhos de **1, 3 e 10 datas**, PDFs de uma página em `exemplos/fase2-homolog-rascunho-*-datas-*.pdf`; IDs 27, 28 e 29. A conferência manual não bloqueia a publicação. |

A primeira comparação SQL revelou quatro diferenças de 0,01 MPa decorrentes de `float`; a implementação foi corrigida para `Decimal`, os testes passaram e a comparação foi refeita, resultando em 10/10. Não se inventou CP de 2025.

## Testes e publicação

- `pytest`: **15 passaram** (regra > fck, maior traço, pendência/ausência, 1/5/6/10 datas, fonte nova, data de moldagem obrigatória, arredondamento, IAM e calibrador).
- Homologação `https://concrefer.concretrack.com.br:18446/unificado/?view=laboratorio%2Fcertificados-qualidade%2F`: fonte nova ativa, três rascunhos/PDFs de uma página, tentativa de emissão com calibrador ausente bloqueada em HTTP 422, serviço saudável, Nginx válido e gate geral **7/7**. Último backup com permissões e banco: `/opt/concrefer-unificado/homolog/backups/cq-phase2-20261025T003000Z`.
- Base de código de produção identificada como `origin/feat/sistema-unificado` (`c38fe79f`). O módulo foi levado por cherry-pick para `feat/laboratorio-certificado-producao`, sem arrastar a restauração inteira de `main`; commit Fase 2 `a85416de`. Branch enviada ao remoto. **Sem merge em `main`**, cuja reconciliação continua pendente.
- Uma publicação em produção foi tentada com backup e retorno automático. Backup: `/opt/concrefer-unificado/backups/cq-production-20261025T003053Z`. Após migração e patch de rotas, o importador falhou com `PermissionError` ao tentar ler `/etc/concrefer-unificado/laboratorio.env` sob `monitorconcreto`; o diretório pai é protegido. O script restaurou gateway, menu e Nginx, parou o serviço e removeu as novas tabelas `cq_*`. Foi confirmado: serviço inativo/sem unidade instalada, rota ausente, tabelas ausentes e gate original de produção **7/7**. Não houve nova tentativa.
- A correção posterior faz o importador de uso único ler o ambiente como root, sem imprimir a senha nem copiá-la para o repositório. Ela foi ensaiada com o ambiente protegido de homologação, retornando `historical certificates imported: 0` no importador idempotente. A produção ainda requer uma nova janela autorizada de publicação.

## Configuração final e pendências

- Homologação: `CQ_FONTE_CP=novo`, serviço `cq-laboratorio-homolog.service` ativo.
- Produção: módulo de certificados **não publicado** após o retorno; nenhuma configuração `CQ_FONTE_CP` do certificado está ativa. O Laboratório oficial continua operando. Não foi criada credencial dedicada para a VPS antiga: o adaptador antigo usa GET público somente quando selecionado, e não está ativo em homologação.
- Antes de emitir certificados comerciais, preencher o **laboratório calibrador/RBC** da prensa com o nome verdadeiro no cadastro. A emissão continuará bloqueada até isso ocorrer.
- Reexecutar o procedimento de produção corrigido em nova janela, com backup, permissões, teste `www-data`, smoke, gate 7/7 e retorno automático. Reconciliar `main` em trabalho separado.
- A senha fixa encontrada em `db/*.py` do sistema antigo permanece pendente de rotação pelo proprietário da integração; ela não foi usada.
