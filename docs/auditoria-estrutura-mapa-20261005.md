# Auditoria estrutural do Mapa — 05/10/2026

**Atualização:** o catálogo ao vivo chegou depois desta auditoria preliminar. Para o estado atual, usar [auditoria-catalogo-mapa-ao-vivo-20261005.md](auditoria-catalogo-mapa-ao-vivo-20261005.md). As pendências descritas abaixo foram reavaliadas nesse documento.

Fontes aceitas da origem: `supabase/migrations/*.sql`, `mapa-concretagem/supabase-formas-manutencao.sql` e apenas contagens/colunas lidas ao vivo em `export-estrutura-mapa/estrutura-atual.json`. `estrutura-atual.sql` e `unificado-mapa-database/` foram excluídos da comparação. O catálogo ao vivo da origem ainda depende da exportação do SQL Editor.

Backup do destino antes das mudanças: `/var/backups/concrefer-unificado/20261005T204225Z`; restauração dos dois bancos conferida.

| Objeto da origem | Uso no `app.js` original | Destino após esta rodada | Diferença pendente |
|---|---|---|---|
| `vw_dashboard_producao_base_v1` | Indireto pela RPC de produtividade na linha 11161; sem consulta direta à visão | Criada pela migração de origem `202608200002` | Confirmar definição contra catálogo ao vivo |
| `vw_dashboard_montagem_base_v1` | Sem referência direta; dashboards usam `montagem_poste` | Criada pela mesma migração | Confirmar definição contra catálogo ao vivo |
| RPCs `rpc_dashboard_produtividade_resumo_v1`, `rpc_dashboard_montagem_resumo_v1`, `rpc_dashboard_defeitos_resumo_v1` | Só a primeira é chamada diretamente, na linha 11161 | Criadas pelas migrações de origem `202608200002` e `202608200004` | Confirmar corpos e permissões ao vivo; o proxy de produtividade já possuía rota própria |
| RPCs `rpc_dashboard_montagem_lista_v1`, `rpc_dashboard_montagem_ranking_v1`, `rpc_dashboard_produtividade_tendencia_v1`, `rpc_dashboard_produtividade_detalhe_v1` | Sem chamada direta encontrada | Criadas do trecho correspondente da migração `202608200003` | Confirmar corpos e permissões ao vivo |
| `dashboard_retrabalho_eventos_v1` e `rpc_dashboard_retrabalho_resumo_v1` | Sem chamada direta encontrada | Tabela criada, 0 linhas como na origem, RLS habilitado, CHECK e três índices criados; RPC ainda ausente | A origem usa `auth.uid()` e `is_master()`, inexistentes no destino. `created_by` não tem o default da origem e as políticas RLS da origem ainda não foram instaladas. Exige mapeamento da identidade de sessão, sem copiar o Hub |
| `producao.vibrado` | Linhas 128, 1285, 1708, 3979 e 4032, entre outras; leitura e gravação do tipo de concreto | Existe, boolean | Confirmar default/nulidade ao vivo |
| `prog_s3_s4` | Linhas 10176, 14487 e 14620; programação e sincronização offline | Tabela existe; CHECK de setor e gatilho `trg_prog_s3_s4_updated_at` criados; chave única equivalente por índice | RLS e políticas da origem não replicados; índice criado antes em `api_write_conflicts.sql` requer confirmação ao vivo como chave da origem |
| `formas_manutencao` | Constante da tabela na linha 700, gravação na linha 761 | Tabela existe; CHECK de status e índices de status e `updated_at DESC` criados | RLS/políticas e publicação `supabase_realtime` não existem no destino. O tempo real do novo servidor usa outra infraestrutura; equivalência funcional precisa de teste |
| `set_prog_s3_s4_updated_at()` | Indireto pela gravação em `prog_s3_s4` | Criada com o gatilho acima | Confirmar corpo ao vivo |
| `set_updated_at()` | Não encontrado no `app.js`; migração `202606290001_auth_hub.sql` aplica a tabelas do Hub | Fora do escopo | Módulo do Hub (`users_app`, `login_logs`, `app_permissions`, `login_attempts`) somente registrado |

As visões do destino retornaram 22.645 linhas de produção e 9.000 de montagem no momento da consulta. O JSON da origem, lido em 05/10, registrou 22.662 e 9.124 respectivamente. Isso reflete fotografias em momentos diferentes; nenhuma importação foi feita nesta rodada.

## Fotos

O `server.js` original grava JPEGs e o índice `fotos-inspecao.json` em disco na outra VPS. O app chama `https://dautomacao.com/api` para fotos; a ponte do novo reescreve essas chamadas para `/unificado/mapa/api`, cujo proxy usa o serviço local `127.0.0.1:13059` e armazenamento `/opt/concrefer-unificado/photo-storage`. A leitura de massadas no servidor novo ainda usa `dautomacao.com`, assunto separado das fotos.

No banco novo, `montagem_poste.checklists` contém 452 referências de foto em 359 registros: 451 imagens `data:image/jpeg;base64,...` embutidas e 1 URL `https://concrefer.concretrack.com.br/unificado/mapa/api/fotos/.../arquivo`. Não há referência a `dautomacao.com` nesses registros. Não existe tabela de inspeção separada no destino; os checklists ficam em `montagem_poste`.

Inventário somente leitura dos discos em 05/10: origem antiga, 2 fotos indexadas, 2 JPEGs, 180.983 bytes; destino, 34 fotos indexadas, 34 JPEGs, 316.352 bytes. Os 2 nomes antigos não estão no destino. Assim, imagens embutidas no banco não dependem da VPS antiga; as 2 fotos do índice antigo não estão disponíveis pelo serviço de fotos novo. A afirmação anterior de 21 arquivos copiados não descreve o estado atual dos discos.

Migração proposta, **aguardando OK do Ricardo**: novo inventário do índice e dos arquivos antigos por SSH somente leitura; backup do armazenamento novo; cópia apenas dos JPEGs faltantes preservando IDs e metadados, mesclagem do índice sem sobrescrever registros novos; comparação de contagem, bytes e SHA-256 por arquivo; teste autenticado dos URLs no novo domínio. Não executar a cópia antes do OK.

## Lacuna do catálogo ao vivo

`scripts/auditar_estrutura_mapa_supabase.sql` contém só `SELECT` sobre `pg_catalog` (e não lê linhas operacionais). Exporta tabelas/colunas, restrições, índices, sequências, gatilhos, funções e corpos, RLS e visões em um resultado. O arquivo de migrações não prova que cada DDL continua igual no Supabase atual.

1. No SQL Editor do projeto Supabase **original do Mapa**, cole todo o conteúdo de `scripts/auditar_estrutura_mapa_supabase.sql` e execute.
2. Exporte o resultado completo como CSV ou JSON; confira `summary.details.object_count + 1` linhas.
3. Anexe o arquivo exportado aqui. Depois dele, comparar o catálogo e corrigir o destino com backup; se uma chave única esbarrar em duplicatas, apresentar os casos sem apagar dados.

## `on_conflict`

| `app.js` | Tabela | Colunas | Chave no destino | Origem ao vivo |
|---|---|---|---|---|
| 761 | `formas_manutencao` | `id` | `formas_manutencao_pkey` | PK prevista no SQL de origem; confirmar catálogo |
| 1687 | `programacao_pcp` | `data_fabricacao,setor,forma` | `programacao_pcp_data_setor_forma_unificado_uidx` | Criada em `api_write_conflicts.sql`; **a confirmar com a origem** |
| 1696 | `liberacao_formas` | `data_fabricacao,setor,forma` | `liberacao_formas_data_setor_forma_unificado_uidx` | Criada em `api_write_conflicts.sql`; **a confirmar com a origem** |
| 10182 e 14626 | `prog_s3_s4` | `data,forma,setor` | `prog_s3_s4_data_forma_setor_unificado_uidx` | Criada em `api_write_conflicts.sql`; migração da origem prevê `prog_s3_s4_unique`, mas **a confirmar com a origem ao vivo** |

Nenhuma chave correspondente está ausente no destino. A equivalência com as chaves originais ainda não está comprovada.
