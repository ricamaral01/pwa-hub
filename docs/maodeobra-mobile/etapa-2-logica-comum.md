# Mão de Obra mobile — etapa 2: lógica comum

**Ambiente:** `https://concrefer.concretrack.com.br:18446` (PCP isolado, banco `pcp_unificado_homolog_20261016`). **Produção não foi alterada.** Esta etapa implementa a camada comum e as três adições de API/banco aprovadas em 17/10/2026. A vista mobile funcional e o PWA pertencem às etapas seguintes.

## Entrega

- `MaoDeObraCore` concentra leitura do dia/atividades, ordem do cadastro, vírgula e passos de 0,5, totais MOD/MOI, payload e envio pelo mesmo `POST /api/maodeobra/grupo`. O desktop passou a chamá-lo sem mudar sua estrutura visual. A futura vista mobile chamará a mesma função.
- Em erro de rede/timeout no POST, o core consulta `GET /dia` e compara grupo, data, situação, motivo e quantidades. Uma resposta que confirma a gravação permite informar sucesso; sem confirmação, conserva o erro e não reenvia automaticamente. Os valores digitados permanecem na tela.
- `maodeobra_dias` recebeu apenas colunas nulas: `salvo_em`, `salvo_por_usuario_id` (FK `usuarios.id ON DELETE SET NULL`) e `motivo_sem_producao`. O POST preenche autor/hora no servidor; reenvio como produção limpa o motivo. Registros anteriores mostram metadados `null` (na interface futura, “indisponível”).
- POST e GET `/api/maodeobra/dia` incluem `data`, `grupo_setor`, `salvo_em`, `salvo_por {id,nome}` e `motivo`. `GET /api/maodeobra/resumo` agrega MOD/MOI por dia e grupo, informa lançado/sem produção, inclusive zero lançado, e recusa intervalos acima de 31 dias. Lançamentos históricos sem grupo continuam fora desse resumo.
- O servidor recusa quantidades negativas ou que não sejam múltiplas de 0,5. `motivo` só é aceito com `sem_producao:true`; vazio vira `NULL`.

## Encaminhamento da API de teste

Antes dos testes funcionais, a rota pública `/unificado/pcp/api/maodeobra/dia` devolvia **500** sem token. A causa era o `auth_request` para serviços isolados de homologação que estavam parados; o Nginx devolvia 500 ao não conseguir consultar a autorização. Os serviços de homologação foram iniciados. Havia ainda uma regra que convertia 401 e 403 para a mesma resposta 403; no vhost **somente de teste**, a ausência de bearer agora retorna 401, preservando 403 para falta de permissão de tela. `nginx -t` passou e o Nginx foi recarregado.

`/api/maodeobra/dia` direto devolvia **502** porque `/api/` aponta para o hub de homologação, também parado. Após iniciá-lo, essa URL retorna **404**, como esperado: o PCP é acessado em `/unificado/pcp/api/...`; o bridge do módulo reescreve as chamadas do frontend para esse prefixo. Não foi criada uma segunda rota global para o PCP.

Verificação anônima final: `/unificado/pcp/api/maodeobra/dia` **401**; `/api/maodeobra/dia` **404**. O teste funcional autenticado pela casca passou.

## Migração, backup e retorno

- Backup do banco de teste antes da migração: `/root/backups/pcp-homolog-maodeobra-before-20261017.dump`, SHA-256 `350314113327fedab7791f598febc53b06d659bb42e5f2157506ec862dda70cb`.
- Backup dos arquivos de homologação: `/root/backups/pcp-homolog-maodeobra-files-before-20261017.tgz`. Backups do vhost/snippet: `/root/nginx-backups/maodeobra-20261017/`, fora de `sites-enabled`.
- Migração: `unificado/pcp/backend/migrations/20261017_maodeobra_mobile_metadata.psql`; aplicada apenas a `pcp_unificado_homolog_20261016` e repetida com sucesso para comprovar idempotência. Reversão: `20261017_maodeobra_mobile_metadata_rollback.psql` (remove somente as três colunas e a FK adicionadas). A reversão não foi executada no banco ativo, pois descartaria os metadados novos.

## Evidência e testes

| Verificação | Resultado |
|---|---|
| `node --test tests/pcp/maodeobra-core.test.cjs` | 4/4: vírgula, 0,5, ordem, totais, payload único, sem produção, timeout com GET antes de novo envio |
| `python -m py_compile` dos três arquivos Python alterados | Passou |
| Desktop real no `:18446` | Salvar 13,5; reenviar 11,5 sem duplicar; sem produção zera; GET confirma autor/hora |
| Motivo e validação HTTP | Motivo “Chuva” gravado e limpo ao reenviar como produção; 1,25 retorna 422; período de 32 dias retorna 400 |
| Resumo | Dia lançado com zero distinto de grupo pendente; leitura autenticada passou |
| Nginx de homologação | `nginx -t` passou; rota PCP anônima 401 |

Teste de navegador: `python tests/pcp/maodeobra_stage2_homolog.py`; os registros da data fictícia foram removidos **somente do banco de teste** após a verificação.

Captura do desktop sem mudança de layout: [Mão de Obra no teste](etapa-2-desktop-homolog.png). As telas mobile continuam no protótipo visual aprovado da etapa 1: [lançamento 390 px](capturas-etapa1-teste/01-launch-390.png) e [conferência 390 px](capturas-etapa1-teste/02-review-390.png). Esta etapa ainda não liga o envio no protótipo.

## Arquivos alterados ou criados nesta etapa

- `unificado/pcp/static/js/maodeobra-core.js` (novo)
- `unificado/pcp/static/js/maodeobra-grupos.js`; `unificado/pcp/maodeobra/index.html`
- `unificado/pcp/backend/app/api/routers/pcp.py`; `app/models/producao.py`; `app/schemas/producao.py`
- `unificado/pcp/backend/migrations/20261017_maodeobra_mobile_metadata.psql` e `_rollback.psql` (novos)
- `tests/pcp/maodeobra-core.test.cjs` e `tests/pcp/maodeobra_stage2_homolog.py` (novos)
- `scripts/porting/fix_homolog_pcp_auth_status.py` e `fix_homolog_pcp_missing_token.py` (homologação)
- Este relatório e sua captura desktop.

**Melhoria futura:** histórico de alterações de cada lançamento (auditoria), incluindo valores anteriores e autor de cada edição. Os campos atuais registram apenas o último salvamento.

**Gate da etapa:** lógica comum e API aprovadas tecnicamente no teste. Aguardando aprovação do Ricardo para iniciar a etapa 3 (vista mobile funcional). Produção permanece na versão anterior.
