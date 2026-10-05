# Estrutura origem × unificado — 05/10/2026

## Escopo e método

- PCP: `pg_dump --schema-only --no-owner --no-acl` executado em modo somente leitura em `pcp_concrefer` e `pcp_unificado_teste`; comparação por objeto e definição SQL. Nenhum dado ou senha foi incluído no relatório.
- Mapa: OpenAPI e GETs somente leitura no Supabase; catálogos PostgreSQL do banco `mapa_unificado_teste`. A credencial disponível da origem é da API REST, sem acesso ao `pg_catalog`. Por isso índices, sequências, gatilhos, definições de views e corpos de funções da origem **não são verificáveis** neste acesso. Não se presume igualdade nesses pontos.
- Backup dos dois bancos novos, restaurado em bases temporárias e conferido por contagem: `/var/backups/concrefer-unificado/20261005T195212Z/`. Não se refez a fotografia.

## PCP

Os 180 objetos de esquema identificados por nome e tipo tiveram definições SQL iguais: 19 tabelas, 19 sequências, 19 vínculos de sequência, 19 defaults, 30 restrições, 25 chaves estrangeiras, 48 índices e um tipo enum. Nenhuma view, função SQL ou gatilho apareceu nesses dumps. O PostgreSQL da origem é 14 e o do destino é 16; cabeçalhos e identificadores gerados pelo `pg_dump` diferem, mas não as definições dos objetos. Diferenças estruturais encontradas: **zero**.

## Mapa

As sete tabelas usadas pelo `app.js` são `usuarios`, `programacao_pcp`, `liberacao_formas`, `producao`, `montagem_poste`, `formas_manutencao` e `prog_s3_s4`. Nas 94 colunas comuns das tabelas e da view, os tipos expostos coincidem com os tipos PostgreSQL: 61 `text`, 14 `timestamptz`, 7 `uuid`, 6 `date`, 3 `boolean`, 2 `integer` e 1 `jsonb`. Obrigatoriedade, defaults e marcações de chave primária também coincidem na comparação OpenAPI × PostgreSQL. A view `vw_formas_status` tem as mesmas 20 colunas expostas nos dois lados. A RPC efetivamente chamada pelo `app.js`, `rpc_dashboard_produtividade_resumo_v1`, expõe na origem os argumentos `p_data_inicio`, `p_data_fim`, `p_scope`, que constam da função de destino; o corpo da função de origem não está disponível para comparação estrutural.

| Objeto | Origem | Destino | Diferença |
|---|---:|---:|---|
| `usuarios` | 9 colunas | 9 colunas | `senha` da origem é substituída intencionalmente por `senha_hash` Argon2id no destino. A view de leitura `api.usuarios` omite ambos. |
| `programacao_pcp` | 10 | 10 | Nenhuma coluna. |
| `liberacao_formas` | 6 | 6 | Nenhuma coluna. |
| `producao` | 13 | 13 | Nenhuma coluna. |
| `montagem_poste` | 17 | 20 | Só no destino: `codigo_poste`, `descricao_poste`, `codigo_produto` (`text`, anuláveis). |
| `formas_manutencao` | 12 | 12 | Nenhuma coluna. |
| `prog_s3_s4` | 8 | 8 | Nenhuma coluna. |
| `vw_formas_status` | 20 | 20 | Nenhuma coluna exposta. |

Os três GETs diretos `montagem_poste?select=id,<coluna>&limit=1` na origem responderam HTTP 400, erro PostgreSQL `42703` (coluna inexistente). Portanto, não há conteúdo de origem nessas colunas a recuperar. **Registros preenchidos por migração: 0.** No destino, 2 das 9.000 linhas têm valor nas três colunas; essas duas linhas foram preservadas. Amostras conferidas sem expor valores: hashes abreviados dos IDs `83e9d58ea7f9` e `aa2ca3f09c06`, ambas com os três campos presentes.

A estrutura inicial do banco novo seguiu a estrutura da tabela oficial: as três colunas não foram esquecidas pela fotografia, pois tampouco existiam na origem. O `app.js` oficial já tenta enviá-las e, ao receber erro de coluna ausente, repete a gravação sem elas em `upsertWithLegacyFallback`. A versão 0.6.7 acrescentou esses campos apenas ao novo banco para não descartar valores novos. A view `api.montagem_poste`, criada antes, permaneceu com a lista antiga porque PostgreSQL expande `SELECT *` ao criar a view. A versão 0.6.8 recriou somente a view no novo banco, preservando as 9.000 linhas e expondo os três campos.

Há três índices únicos adicionais no destino (`programacao_pcp_data_setor_forma_unificado_uidx`, `liberacao_formas_data_setor_forma_unificado_uidx`, `prog_s3_s4_data_forma_setor_unificado_uidx`) e dois gatilhos locais de tempo real (`unificado_realtime_producao`, `unificado_realtime_manutencao`). O restante dos índices/constraints/sequências/gatilhos da origem não pode ser enumerado pelo REST. Esses objetos locais não foram apresentados como equivalentes aos da origem.

O exportador agora obtém todas as colunas da OpenAPI antes de exportar, inclusive para tabela vazia, e recusa linha com conjunto de colunas divergente. O script de fotografia recusa a troca de dados se alguma coluna nova da origem não existir no destino. Como o REST não fornece índices, sequências e gatilhos, uma futura mudança desses objetos exige acesso de catálogo à origem e migração estrutural explícita; o script falha antes de `TRUNCATE`. A trava de autorização escrita do Ricardo permanece. Nenhuma fotografia foi executada nesta rodada.

## Conferência publicada

Na versão 0.6.9, o endereço publicado abriu, por clique no menu, Montagem, Inspeção, Relatório, Dashboard Defeitos, Dashboard Montagem e Histórico, sem erro de página. O CSV do Dashboard Defeitos foi baixado sem falha. O endpoint de leitura da montagem passou a incluir as três colunas; a contagem das linhas permaneceu 9.000.

## PDF e Usuários

`html2pdf.bundle.min.js` 0.10.1 foi copiado byte a byte do CDN para `/unificado/vendor/html2pdf/` (SHA-256 `85e6ee9ce246e3ae4424313f7e46a5ed860a28d757811de8dc9c43f306049d65`). O build aponta o `app.js` publicado para esse arquivo; o original permanece intacto. O service worker 0.6.9 o inclui no cache. Em Chromium com largura de tablet, CDN bloqueado, o relatório gerou PDF (`application/pdf`, cerca de 149 kB); após ativação do service worker e modo offline, o arquivo local foi obtido do cache (HTTP 200, 905.956 bytes). Nenhum host externo foi pedido nesse fluxo. O compartilhamento abre `api.whatsapp.com` somente ao toque do usuário. Em outra comparação sobre o mesmo relatório e DOM, o PDF gerado com a biblioteca local e o gerado com a biblioteca original do CDN tiveram ambos 366.483 bytes, uma página e o mesmo hash de pixels renderizados (`a6f4ebf4067534588d23863bac5e69313f835363be730067702dbf1ad3c58e44`).

O `app.js` original faz sondagem `usuarios?select=id&limit=1` para conectividade, consulta `select('*')` para `listar_usuarios`, consulta de autenticação e operações de cadastro/troca/desativação. A lista só é renderizada no modo `USUARIOS`, concedido a GERENCIA e explicitamente ao nome exibido `Ricardo` em `setAccessByRole`. GESTOR, MONTADOR e APONTADOR não consultam a lista para operador, encarregado ou relatório; suas exceções por nome para outras telas usam o usuário da sessão. A rota nova passou a permitir a leitura da tabela também à conta com nome exibido exatamente `Ricardo`, independentemente do perfil, além da sondagem. A view `api.usuarios` expõe oito campos e nunca senha/hash. Uma conta sintética MONTADOR com nome exibido `Ricardo` recebeu HTTP 200 para a lista e nenhuma coluna de senha; foi removida.
