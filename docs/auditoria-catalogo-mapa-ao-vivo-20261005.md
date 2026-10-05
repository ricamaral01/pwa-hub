# Catálogo do Mapa: origem ao vivo × PostgreSQL novo — 05/10/2026

Referência exclusiva da origem: `export-estrutura-mapa/catalogo-supabase-ao-vivo.json`, recebido do SQL Editor (342 objetos mais a linha `summary`). Não usar `estrutura-atual.sql` nem `unificado-mapa-database/` como origem. O catálogo exportado contém corpos de funções e fica fora dos commits. Backup anterior às alterações: `/var/backups/concrefer-unificado/20261005T215417Z`, com restauração testada dos dois bancos.

## Diferenças nas oito tabelas do Mapa

Tipos, nulidade, colunas geradas, chaves primárias, CHECKs e gatilhos **da origem** coincidem após os ajustes abaixo, salvo diferenças expressas nesta tabela. Os defaults `timezone('utc'::text, now())` coincidem. O default `extensions.uuid_generate_v4()` do destino chama a mesma função que a origem escreve como `uuid_generate_v4()`; diferença de qualificação do esquema, sem diferença de valor gerado.

| Tabela | Diferenças encontradas e situação após correção |
|---|---|
| `usuarios` | Origem: `senha` em texto; destino: `senha_hash` Argon2id, deliberadamente sem coluna de senha em texto. Destino tem índice não único `usuarios_nome_ativo_idx`. Origem tem RLS e política ampla; destino autentica pela API e não replica essa política. |
| `programacao_pcp` | Índice único do destino foi promovido à restrição de origem `programacao_pcp_data_fabricacao_setor_forma_key`, sem mexer nas linhas. Índice não único adicional `programacao_pcp_data_setor_forma_idx`. RLS e duas políticas da origem não estão no destino. Default UUID qualificado por `extensions`. |
| `liberacao_formas` | Índice único promovido a `liberacao_formas_data_fabricacao_setor_forma_key`. Índice não único adicional `liberacao_formas_data_setor_forma_idx`. RLS e duas políticas não replicados. Default UUID qualificado por `extensions`. |
| `producao` | Mesmas 13 colunas, incluindo `vibrado`; apenas PK única em ambos. Dois índices não únicos adicionais e gatilho `unificado_realtime_producao` no destino. RLS/política da origem não replicados. Default UUID qualificado por `extensions`. |
| `montagem_poste` | Default de `checklists='{}'::jsonb` restabelecido. Destino tem as três colunas extras `codigo_poste`, `descricao_poste`, `codigo_produto` por correção intencional nº 3; origem não as tem. Apenas PK única em ambos. Índice não único adicional `montagem_poste_data_setor_idx`. RLS/política da origem não replicados. |
| `formas_manutencao` | CHECK de status e índices da origem coincidem. Destino tem índice não único `formas_manutencao_setor_forma_idx` e gatilho `unificado_realtime_manutencao` para o tempo real novo. RLS e três políticas da origem não foram replicados; publicação `supabase_realtime` é específica da arquitetura antiga. |
| `prog_s3_s4` | Default `modelo=''`, CHECK de setor, gatilho e função de `updated_at` conferidos. Índice único promovido à restrição `prog_s3_s4_unique`; índice de data/setor renomeado para `idx_prog_s3_s4_data_setor`, igual à origem. RLS e quatro políticas da origem não replicados. |
| `dashboard_retrabalho_eventos_v1` | Mesmas 24 colunas, incluindo geradas `setor_code` e `custo_total`, mesmo CHECK e três índices. RLS habilitado e 0 linhas em ambos. Default `created_by=auth.uid()` e três políticas da origem não existem no destino: o login do Mapa é customizado e não cria sessão Supabase. No caminho do app original a chave é anônima, portanto o default produz `NULL` e a RPC oculta custos. |

Os índices adicionais citados são **não únicos** e não recusam gravações. Os dois gatilhos `unificado_realtime_*` servem à infraestrutura nova; retirá-los interromperia a atualização dos cartões. A diferença de RLS é arquitetural: o novo serviço exige sessão e aplica permissões antes do banco. Ela não prova equivalência de segurança para acesso direto ao PostgreSQL; o acesso direto deve continuar restrito.

## Chaves únicas e dados reais

| Índice único extra anterior | Motivo e gravação dependente | Decisão | Poderia recusar linha aceita pela origem? |
|---|---|---|---|
| `programacao_pcp_data_setor_forma_unificado_uidx` | Criado para `onConflict` do `app.js:1687` | Promovido e renomeado à restrição exata da origem | Não: mesmas três colunas da chave de origem. |
| `liberacao_formas_data_setor_forma_unificado_uidx` | Criado para `onConflict` do `app.js:1696` | Promovido e renomeado à restrição exata da origem | Não: mesmas três colunas. |
| `prog_s3_s4_data_forma_setor_unificado_uidx` | Criado para `onConflict` do `app.js:10182,14626` | Promovido e renomeado à restrição exata da origem | Não: mesmas três colunas. |

**Índices/chaves únicos extras restantes no destino: zero.** `producao` e `montagem_poste` têm somente PK, como na origem. Leitura paginada somente das colunas de chave dos dados reais da origem: em `producao`, 22.662 linhas, 685 grupos repetidos por `(data_fabricacao,setor,forma)`, abrangendo 2.181 linhas, máximo 25 por grupo; em `montagem_poste`, 9.124 linhas, 15 grupos repetidos por `(data_fabricacao,setor,forma_numero)`, abrangendo 34 linhas, máximo 3. IDs duplicados: zero nas duas tabelas. Essas linhas seriam aceitas pela unicidade atual do novo banco. `api_write_conflicts.sql` foi atualizado para usar somente os nomes de restrição confirmados da origem, evitando recriar os índices antigos.

## Funções e visões

Todas as 8 RPCs abaixo existem com a assinatura da origem. Respostas de origem e destino foram comparadas via POST somente leitura na origem e SELECT no destino em **01–07/07/2026** e **01–07/09/2026**. Após omitir `generated_at`, que é a hora de cada execução, as 16 comparações foram iguais. Os testes cobrem parâmetros padrão, escopo `TOTAL`; não demonstram todos os parâmetros/opções possíveis.

As três visões também foram comparadas linha a linha, como multiconjuntos completos, nesses dois períodos: **6/6 iguais**. Em julho: produção 1.438 linhas, montagem 593, formas 1.456. Em setembro: produção 727, montagem 386, formas 832. A primeira paginação de `vw_formas_status` sem `order` pareceu divergir em 87 linhas por repetição entre páginas; a leitura repetida com ordenação estável pelos campos de chave fechou 1.456/1.456 sem diferença. Nenhum dado ou definição foi alterado por esse falso positivo.

| Objeto | Corpo × catálogo ao vivo | Resultado | Uso direto no `app.js` |
|---|---|---|---|
| `rpc_dashboard_defeitos_resumo_v1` | Igual | 2/2 igual | Não encontrado |
| `rpc_dashboard_montagem_lista_v1` | Igual | 2/2 igual | Não encontrado |
| `rpc_dashboard_montagem_ranking_v1` | Igual | 2/2 igual | Não encontrado |
| `rpc_dashboard_montagem_resumo_v1` | Igual | 2/2 igual | Não encontrado |
| `rpc_dashboard_produtividade_detalhe_v1` | Igual | 2/2 igual | Não encontrado |
| `rpc_dashboard_produtividade_resumo_v1` | Igual | 2/2 igual | `app.js:11161` |
| `rpc_dashboard_produtividade_tendencia_v1` | Corrigido para o corpo exportado do catálogo ao vivo | 2/2 igual | Não encontrado |
| `rpc_dashboard_retrabalho_resumo_v1` | Adaptado: `auth.uid() IS NOT NULL` virou `false` para reproduzir o contexto anônimo do app original | 2/2 igual; também igual com `p_incluir_custos=true` em 01–05/10, custos ocultos | Não encontrado |
| 5 auxiliares `dashboard_*` listadas no pedido | Mesmo nome, assinatura e corpo | Indiretamente nas RPCs | Nenhum uso direto |
| `vw_dashboard_producao_base_v1`, `vw_dashboard_montagem_base_v1`, `vw_formas_status` | Definições iguais ao catálogo ao vivo | Existem no destino | Sem consulta direta encontrada; as duas primeiras alimentam RPCs |

`is_master()` aparece na política RLS de retrabalho da origem, não no corpo das RPCs. No novo, permissões passam pelo serviço de autenticação; essa política não foi reproduzida no PostgreSQL. `my_access_context()` pertence ao Hub e ficou fora do escopo. Não há equivalência comprovada para chamadas Supabase feitas como usuário `authenticated`; a equivalência acima é para o caminho efetivo do app original com chave anônima.

## Segurança do oficial — somente catálogo

Na origem, a política `Permitir acesso total aos usuarios` tem `roles=[public]`, `command=ALL`, `using=true`. Assim, ela se aplica a SELECT, INSERT, UPDATE e DELETE para todos os papéis, inclusive `anon`. O `app.js` usa a chave pública para `select('*')` em `usuarios` (`app.js:1778`); portanto essa chave consegue ler a tabela, inclusive a coluna de senha em texto se os privilégios de tabela permitirem, como o uso atual indica. Nenhuma linha foi lida para esta verificação. O sistema oficial não foi alterado.

## Fotos e publicação

Fotos novas: serviço local do unificado, sem chamada do navegador ao servidor antigo para a API de fotos. `montagem_poste.checklists` contém 451 imagens embutidas e 1 URL do domínio novo. No disco antigo há 2 fotos, 180.983 bytes, ausentes entre as 34 fotos do disco novo. **As 2 fotos antigas ainda não foram trazidas**, conforme a instrução de esperar autorização antes da cópia. Nenhuma nova versão de frontend foi publicada nesta rodada; a versão no diretório publicado continua **0.6.9**. O banco de dados novo foi atualizado diretamente com o backup acima.
