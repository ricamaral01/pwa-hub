# Plano de retirada completa do Supabase

**Data:** 22/10/2026  
**Estado:** planejamento; nenhuma migração ou desligamento foi executado por este documento.  
**Escopo:** Mapa/Concretagem, PCP, inspeção móvel, aplicativos legados que ainda gravam no Supabase e o projeto Supabase (PostgreSQL, Storage, Auth, RPC, automações e Realtime).  
**Destino:** PostgreSQL da VPS nova (`2.25.163.32`), com acesso dos clientes exclusivamente por APIs próprias no mesmo domínio.

## Resultado e regras de execução

Ao fim da migração, o Supabase não recebe leituras nem escritas de produção. Código, builds, PWAs, serviços, jobs e ambientes de execução não dependem de SDK, URL, chave ou protocolo Realtime do Supabase. O projeto antigo fica arquivado e pausado; sua exclusão e o cancelamento do plano são decisões posteriores e explícitas.

1. **Um escritor oficial por tabela, sempre.** Durante a transição, uma tabela pode ter o Supabase como escritor e PostgreSQL local como espelho de leitura. A troca do escritor é controlada por tabela. Se forem encontrados dois escritores independentes, interromper a passagem dessa tabela e definir precedência e sincronização antes de continuar.
2. **Mesmos resultados antes e depois.** Dashboards, `PROD_ANALISE`, PCP, relatórios e exportações mantêm fórmulas e regras de negócio. A refatoração visual de `PROD_ANALISE` fica para depois do corte dos dados.
3. **Fonte do Mapa:** `mapa-concretagem/`. `unificado/mapa/operacao` é gerado pelo build; `current-mapa/` é histórico.
4. **Homologação antes de produção.** Cada etapa tem evidência em `docs/porting/supabase/` com comandos executados, resultados, critério de aceite e procedimento de reversão. A etapa seguinte só começa após a aprovação da evidência da etapa atual. A publicação em produção também exige autorização específica.
5. **Segredos fora de documentos, logs e Git.** Registrar apenas nomes das variáveis, local de armazenamento e presença/ausência; nunca copiar valores de `anon`, `service_role`, senhas ou tokens para a evidência.
6. **Rollback considera o escritor.** Antes da primeira escrita oficial no destino, é possível voltar a apontar os clientes à origem, após reconciliar a janela. Depois da primeira escrita, a recuperação padrão é corrigir para frente; voltar ao Supabase requer sincronização reversa planejada.

## O que já existe e o que precisa ser confirmado

- A API do Mapa já encaminha REST ao PostgREST local (porta `13051` para leitura e `13058` para escrita) e expõe a RPC de produtividade. Isso reduz trabalho de API, mas não elimina o SDK usado pelo frontend nem comprova paridade de todas as ações.
- O build atual troca a URL Supabase do Mapa por `/unificado/mapa/api`, mas ainda copia `supabase.js` e mantém `createClient`. A ponte `bridge.js` também reescreve `*.supabase.co`. Ambos devem sair após a migração dos chamadores.
- `unificado/m/inspecao/api.js` já usa a API local; `supabaseClient` é o nome de um adaptador, a confirmar em todos os fluxos móveis.
- O PCP ainda usa nomes e contratos `SUPABASE_*`/`/producao/supabase`. É preciso verificar se cada ambiente aponta para Supabase externo ou PostgREST local antes de mudar o serviço.
- `unificado/mapa/LEIA-ME.md` relata uma fotografia de **02/10/2026**, mas a API local já retornou dados de **21/10/2026**. A origem de cada escrita recente e a atualização de cada tabela permanecem questões de inventário, não premissas.
- `realtime_bridge.py` usa um protocolo compatível com o SDK. Para cumprir a meta de não manter um protocolo ligado ao Supabase, o destino preferido é polling controlado ou SSE próprio, seguido da retirada dessa compatibilidade.

## Etapas, evidências e passagem

| Etapa | Entrega | Evidência obrigatória | Critério para avançar |
|---|---|---|---|
| 00 | Inventário de código, escritores, projeto Supabase e bases | `00-inventario.md` | Toda tabela, arquivo e escrita têm dono identificado. |
| 01 | Espelho contínuo Supabase → PostgreSQL enquanto houver legado escritor | `01-sync-continuo.md` | 24 h observadas, atraso ≤ 2 min e reconciliação diária sem divergência não explicada. |
| 02 | Esquema, automações e dados reconciliados | `02-reconciliacao.md` | Importação repetível, sem duplicatas, backup restaurável e diferenças resolvidas/documentadas. |
| 03 | Storage e Auth, se usados, transferidos | `03-storage-auth.md` | 100% dos arquivos acessíveis, referências migradas e nenhum login dependente do Supabase. |
| 04 | Contratos da API própria completos | `04-contratos-api.md` | Matriz de chamadas coberta, com permissões e semântica equivalentes. |
| 05 | Mapa e PWA sem SDK | `05-mapa-sem-sdk.md` | Fluxos online e offline funcionam sem `window.supabase`. |
| 06 | PCP e inspeção sem contratos legados | `06-pcp-inspecao.md` | Consumidores usam rotas/nomes próprios e não acessam o Supabase. |
| 07 | Escritores legados cortados, tabela por tabela | `07-corte-escritores.md` | Supabase sem escritores; logs e contagens estáveis por 7 dias. |
| 08 | Bridges, builds, caches, jobs e ambientes limpos | `08-limpeza.md` | Nenhuma dependência de execução ou asset do Supabase. |
| 09 | Arquivo final e pausa do projeto | `09-desligamento.md` | Cópia histórica validada, chaves revogadas e projeto pausado. |

Cada arquivo de evidência deve conter: ambiente, revisão do código, início/fim, comandos ou consultas (sem segredos), resultado, diferenças encontradas, aceite, responsável pela aprovação e reversão aplicável. Falha no critério bloqueia a passagem; não é aprovação tácita.

### 00 — Inventário completo e linha de base

**Código e rede**

1. Partir de `docs/matriz-chamadas-mapa.md` e levantar novamente todas as chamadas `.from`, `.rpc`, `.channel`, `.storage` e `.auth` em `mapa-concretagem/app.js`, inclusive chamadas dinâmicas. Para cada uma: tabela/RPC, método, filtros, ordenação, paginação, `on_conflict`, campos, tela, perfil, ação e tratamento de erro.
2. Inventariar PCP (`config.py`, `sheets_service.py`, `pcp.py`, `producao/index.html`), inspeção móvel, bridges, service workers, builds de Mapa/tablet/PCP, `deploy/scripts/preparar_env.py` e variáveis de todos os ambientes.
3. Encontrar aplicativos **fora do Unificado** que ainda escrevem no Supabase: Mapa legado, PCP legado, scripts, dispositivos, integrações e outros. Mapear por tabela o escritor, host, processo, frequência, credencial e usuários ainda ativos.
4. Capturar tráfego real e ações de Mapa/PCP/inspeção em navegador, incluindo reconexão e fila offline. Diferenciar chamadas ao Supabase externo, PostgREST local, WebSocket de compatibilidade e simples ocorrência textual do nome.

**Projeto Supabase e dados**

5. Inventariar tabelas, views, funções/RPC, triggers, sequences, políticas RLS, Storage buckets/objetos, Auth, Edge Functions, `pg_cron`, Database Webhooks e Realtime por tabela. Registrar quais objetos são efetivamente usados.
6. Para Storage: quantidade, tamanho total, tipos, checksums, estrutura de pastas e colunas do banco que guardam URLs. Para Auth: usuários, identidade de vínculo com o Unificado e telas que dependem da sessão antiga. Localizar chaves `anon` e `service_role` por **local de uso**, sem registrar os valores.
7. Comparar Supabase e PostgreSQL local por tabela: contagem, maior data de criação/alteração, IDs ausentes de cada lado, duplicatas, cancelamentos e exclusões. Investigar especificamente as escritas posteriores a 02/10.
8. Fazer backup do destino e restaurá-lo em ambiente isolado. Guardar um `pg_dump` completo da origem fora do Git, com acesso restrito e teste de integridade.

**Passagem:** matriz de chamadas e de escritores completa; cada tabela e arquivo com dono; nenhuma escrita sem destino definido. Evidência: `docs/porting/supabase/00-inventario.md`.

### 01 — Sincronização contínua enquanto o legado escreve

1. Instalar na VPS nova um serviço de leitura do Supabase a cada **1 minuto** apenas para tabelas cujo escritor oficial ainda é o legado. Processar incrementalmente por `updated_at` + ID (ou outro cursor comprovadamente monotônico), com margem de sobreposição e checkpoint persistente.
2. Fazer `upsert` idempotente preservando ID, timestamps, setor, forma, status e vínculos. Nunca transformar o espelho em segundo escritor independente.
3. Para tabelas pequenas, comparar hashes completos; executar reconciliação horária de IDs/contagens para detectar alterações tardias e exclusões que o cursor incremental não captura. Exclusões sem tombstone exigem confirmação antes de apagar no destino.
4. Expor atraso por tabela, falhas, último checkpoint e divergências. Alertar se o atraso passar de 2 minutos. Medir por pelo menos 24 horas, incluindo um ciclo real de escrita do legado.
5. Caso uma tabela tenha escrita nos dois lados, fixar um único escritor imediatamente ou documentar uma regra de conflito verificável antes de sincronizá-la. A preferência é evitar esse estado.

**Passagem:** atraso ≤ 2 min e zero divergência não explicada na reconciliação diária. Evidência: `01-sync-continuo.md`, com 24 h de lag, contagens e falhas observadas.

### 02 — Esquema, automações e reconciliação de dados

1. Comparar estrutura do destino com a origem e aplicar migrações versionadas: colunas, tipos, chaves únicas, índices, sequences, views, RPC, permissões e triggers. Dar atenção a `vw_formas_status` e `rpc_dashboard_produtividade_resumo_v1`.
2. Recriar automações efetivamente usadas: triggers e jobs no PostgreSQL/API própria; Edge Functions, cron e webhooks em serviços do Unificado. Validar efeito e frequência antes de desligar o original.
3. Importar registros ausentes de modo idempotente. Não sobrepor dado local recente com snapshot antigo. Definir precedência para cada divergência e preservar histórico de cancelamento.
4. Conferir se continua válida a decisão de 03/10 para a tabela `producao_diaria` vazia e fallback de modelo. Ela não é a coluna `programacoes_alex.producao_diaria`.
5. Reconciliar por tabela: contagem, IDs, hash de campos de negócio e totais por dia/setor. Reexecutar a importação para provar ausência de duplicatas; repetir a restauração isolada do backup.

**Passagem:** divergências resolvidas ou explicitamente decididas, importação repetível e backup restaurável. Evidência: `02-reconciliacao.md`.

### 03 — Storage e Auth

**Storage, se houver objetos em uso**

1. Copiar todos os objetos dos buckets para storage local do Unificado, com estrutura de pastas e metadados preservados. Pode-se usar o padrão do GED (storage local e cópia via `rclone`), após confirmar permissões e capacidade.
2. Servir por rotas próprias autenticadas e autorizadas, inclusive fotos de inspeção, checklists e anexos. Impedir acesso por URL pública antiga depois do corte.
3. Construir mapa temporário de URL antiga → rota nova **fora do banco operacional definitivo**; atualizar as colunas que guardam URLs, testar a reversão e retirar o mapa antigo após a validação. Isso permite exigir zero `supabase.co` nas colunas finais.
4. Comparar 100% dos objetos por caminho, tamanho e checksum; testar abertura em desktop, celular e tablet, inclusive offline quando aplicável.

**Auth, se for usado**

5. Relacionar contas do Supabase Auth às contas do Unificado pelo identificador verificado, preservando permissões e trilha. Não assumir que nome ou e-mail igual basta.
6. Substituir qualquer sessão/Auth do Supabase por sessão do Unificado; testar acesso, revogação e primeiro acesso.

**Passagem:** todos os arquivos acessíveis pelas rotas novas, nenhuma URL Supabase no banco operacional e nenhum login antigo necessário. Se Storage ou Auth não forem usados, registrar a comprovação e marcar a subetapa como não aplicável. Evidência: `03-storage-auth.md`.

### 04 — APIs próprias e atualização de tela

1. Confrontar as rotas locais `/unificado/mapa/api` (PostgREST `13051` leitura e `13058` escrita) com cada item da matriz 00: `GET`, `POST`, `PATCH`, `DELETE`, paginação, `Prefer`, `on_conflict`, formato e códigos de erro.
2. Criar endpoints de domínio para operações com várias escritas, validação ou auditoria: concretagem, liberação, cancelamento, manutenção, montagem, inspeção com foto e sequência S3. Garantir transações e idempotência.
3. Aplicar autorização por usuário, tela, setor e ação no servidor. Não levar RLS, `service_role` ou chave de banco ao navegador.
4. Publicar contrato interno de leitura para o PCP (`producao` liberada e `producao_diaria`), com paginação e identidade de serviço restrita. O PostgreSQL do Mapa continua dono desses dados; o PCP não mantém cópia independente.
5. Substituir a assinatura Supabase por polling controlado ou SSE com contrato próprio e autenticação. A ponte `realtime_bridge.py` só pode ser usada temporariamente; por emular o protocolo do SDK, deve sair do estado final. Definir atraso aceitável e recarga após reconexão.

**Passagem:** todas as chamadas cobertas por testes de contrato, permissão, erro e concorrência, com a mesma semântica. Evidência: `04-contratos-api.md`.

### 05 — Mapa e PWA sem SDK

1. Criar `mapa-api.js` com funções explícitas por recurso e ação; migrar em lotes: leituras/dashboards → escritas simples → operações de várias etapas, fotos e fila offline → `.channel(...)`.
2. Preservar chave idempotente da produção (data/setor/forma), tratamento de registros legados, status, cálculos e exportações. Comparar `PROD_ANALISE` antes/depois com os mesmos dados.
3. Remover de `mapa-concretagem/` `SUPABASE_CONFIG`, `createClient`, script e arquivo `supabase.js`, chamadas ao SDK e mensagens que atribuem erros ao Supabase.
4. Atualizar `scripts/build_unificado_mapa_operacao.py` e o build de tablet para não copiar nem injetar o SDK. Gerar novamente `unificado/mapa/operacao` e conferir o conteúdo real publicado.
5. Testar primeiro em homologação: concretagem/liberação nos quatro setores, mandril, cancelamento, manutenção, montagem, inspeção, fotos, sequência S3, dashboards, CSV/Excel/PDF e reenvio offline.

**Passagem:** nenhum `window.supabase`; Mapa e PWA funcionam online, offline e após reconexão, com dados equivalentes. Evidência: `05-mapa-sem-sdk.md`.

### 06 — PCP e inspeção móvel

1. Em `sheets_service.py`, substituir `_fetch_supabase_rows` pelo contrato interno da etapa 04 e renomear as configurações `SUPABASE_*`. Manter o agrupamento e os fallbacks atuais, inclusive a regra de `producao_diaria` decidida na etapa 02.
2. Criar `/api/producao/realizada` e mover UI/consumidores para ela. Manter `/api/producao/supabase` como alias temporário; retirá-lo só após consulta aos logs demonstrar ausência de consumidores.
3. Renomear “Produção Realizada - Supabase” na interface e ajustar build do PCP para não recolocar o texto ou a rota antiga.
4. Em `unificado/m/inspecao/api.js`, renomear o adaptador `supabaseClient` para cliente da API local; testar leitura, criação, edição, exclusão, permissões e uso em celular/tablet.

**Passagem:** PCP e inspeção sem URL/credencial externa e sem rota legada nos consumidores. Evidência: `06-pcp-inspecao.md`.

### 07 — Corte de todos os escritores legados

1. Para cada aplicativo legado ainda ativo, escolher **A)** desativar a escrita e redirecionar usuários ao Unificado ou **B)** mantê-lo temporariamente como cliente da API própria. Registrar responsável, data e rota de destino.
2. Cortar uma tabela por vez: congelar escrita → esvaziar filas offline dos PWAs → executar último delta → reconciliar → liberar escrita **somente** no PostgreSQL local → observar.
3. Registrar instante do corte, último ID/horário na origem, primeiro ID/horário no destino, usuários atingidos e procedimento de contingência. Conferir logs do Supabase e contagem estável por 7 dias.
4. Depois da primeira escrita no destino, corrigir falhas para frente. Retorno ao Supabase só com plano específico de sincronização reversa e nova aprovação.

**Passagem:** nenhum escritor restante no Supabase, comprovado por logs e contagens estáveis durante 7 dias. Evidência: `07-corte-escritores.md`.

### 08 — Limpeza de execução e publicação

1. Remover dos bridges apenas a regra `*.supabase.co`; manter reescritas de `pcp.concretrack.com.br`, `usina.concretrack.com.br`, `dautomacao.com` e `docs.google.com` até a migração própria de cada integração.
2. Retirar a substituição cosmética de “Supabase” de `unificado-bridge.js` e atualizar `unificado/mapa/index.html` após as mensagens reais terem sido corrigidas.
3. Retirar `supabase.js` de HTML, builds, manifests e precaches. Incrementar versões dos service workers e comprovar atualização de PWAs instalados nos tablets e celulares dos setores.
4. Desligar a sincronização da etapa 01 após os cortes; desativar importadores/scripts que escreviam no Supabase. Tirar scripts históricos do fluxo de deploy.
5. Remover `SUPABASE_*` dos ambientes, de `deploy/scripts/preparar_env.py` e de configurações de serviços. Procurar referências também em aplicações legadas, cron, timers, containers e Nginx.

**Passagem:** busca estática e tráfego real sem dependência Supabase. Evidência: `08-limpeza.md`.

### 09 — Arquivo, revogação e pausa do projeto

1. Gerar `pg_dump` final e cópia final dos buckets, com checksums, catálogo, data e procedimento de restauração; guardar fora do Git com acesso restrito.
2. Rotacionar/revogar `anon` e `service_role` usadas, inclusive a chave `anon` exposta no `app.js` e em versões históricas. Confirmar que nenhum serviço para ao revogar.
3. Pausar o projeto Supabase e acompanhar um período de segurança sugerido de **30 dias** de operação normal.
4. Após esse período, apresentar evidência de ausência de tráfego e solicitar autorização específica para **excluir o projeto e cancelar o plano**. Pausa e exclusão são marcos distintos.

**Passagem:** projeto pausado com arquivo restaurável; exclusão somente após autorização posterior. Evidência: `09-desligamento.md`.

## Aceite final do programa

- [ ] Código de execução, builds e configuração sem `createClient`, `supabaseClient`, `SUPABASE_CONFIG`, `SUPABASE_*`, `supabase.js`, `supabase.co` e `/producao/supabase`. Documentação histórica identificada pode conservar esses termos.
- [ ] Busca em todas as colunas textuais do banco operacional sem URLs `supabase.co`; mapa de conversão de URLs antigas guardado somente em arquivo de migração restrito.
- [ ] DevTools/Network sem HTTP nem WebSocket `*.supabase.co` em desktop, tablet e celular, inclusive após reconectar o PWA.
- [ ] `PROD_ANALISE`, PCP, relatórios e exportações iguais para os mesmos dados e datas, conferidos com SQL de referência.
- [ ] `tests/mapa/e2e` (dashboards, CSV/exportações e viewports) e testes de escrita, cancelamento, permissões, fotos, fila offline e atualização do service worker concluídos.
- [ ] Logs do projeto Supabase sem requisições por 7 dias antes da pausa; monitoramento de erros de API, atraso de atualização e contagens por pelo menos um ciclo operacional completo após o corte.
- [ ] Cada uma das dez evidências aprovada antes de iniciar a etapa seguinte; nenhuma chave em documentação, logs ou commits.

## Entrega posterior: visual de `PROD_ANALISE`

Após estabilizar o banco e os contratos, aplicar a refatoração visual descrita no MD original. Preservar os IDs `pa*`/`chartPa*` usados por `app.js` e pelos testes. Antes de retirar a aba Dados, decidir se sua tabela é necessária para auditoria; antes de alterar a apresentação de Eficiência, validar a regra que atualmente pode produzir valores acima de 100%.
