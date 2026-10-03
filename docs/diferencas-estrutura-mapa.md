# Diferenças de estrutura do Mapa — 03/10/2026

Origem: `GET /rest/v1/` com OpenAPI do Supabase, sem SQL nem escrita no oficial. Destino: `information_schema.columns` do PostgreSQL `mapa_unificado_teste`. A OpenAPI expõe colunas, obrigatoriedade, padrões e marcação de chave primária; ela não prova índices únicos adicionais, gatilhos ou sequências da origem. Esses itens ainda exigem fonte de catálogo autorizada ou teste de contrato isolado.

| Tabela | Origem | Destino | Só na origem | Só no destino | Padrões/obrigatoriedade divergentes |
|---|---:|---:|---|---|---|
| `usuarios` | 9 | 9 | `senha` | `senha_hash` | `ativo`, `created_at`, `primeiro_acesso`, `updated_at` |
| `programacao_pcp` | 10 | 10 | — | — | `data_hora`, `id`, `quantidade` |
| `liberacao_formas` | 6 | 6 | — | — | `data_hora`, `id` |
| `producao` | 13 | 13 | — | — | `data_hora`, `id`, `tipo_concreto` |
| `montagem_poste` | 17 | 17 | — | — | `banco`, `created_at`, `updated_at` |
| `formas_manutencao` | 12 | 12 | — | — | — |
| `prog_s3_s4` | 8 | 8 | — | — | — |

**Totais:** 1 colunas só na origem, 1 só no destino e 15 colunas comuns com padrão ou obrigatoriedade diferente.

A troca intencional de `usuarios.senha` por `usuarios.senha_hash` e campos de primeiro acesso preserva a senha fora do PostgREST; seu contrato de login precisa ser reproduzido pelo serviço de autenticação. Os demais desvios precisam ser resolvidos ou demonstrados inofensivos antes da rota operacional.

## Detalhe dos padrões e da obrigatoriedade

A OpenAPI e o catálogo PostgreSQL podem escrever padrões equivalentes de maneiras diferentes; os valores abaixo ainda precisam de comparação semântica.

| Coluna | Origem: obrigatória / padrão | Destino: obrigatória / padrão |
|---|---|---|
| `usuarios.ativo` | False / `True` | True / `true` |
| `usuarios.created_at` | True / `timezone('utc'::text, now())` | True / `now()` |
| `usuarios.primeiro_acesso` | False / `True` | True / `false` |
| `usuarios.updated_at` | True / `timezone('utc'::text, now())` | True / `now()` |
| `programacao_pcp.data_hora` | True / `timezone('utc'::text, now())` | True / `now()` |
| `programacao_pcp.id` | True / `extensions.uuid_generate_v4()` | True / `gen_random_uuid()` |
| `programacao_pcp.quantidade` | False / `1` | False / `—` |
| `liberacao_formas.data_hora` | True / `timezone('utc'::text, now())` | True / `now()` |
| `liberacao_formas.id` | True / `extensions.uuid_generate_v4()` | True / `gen_random_uuid()` |
| `producao.data_hora` | True / `timezone('utc'::text, now())` | True / `now()` |
| `producao.id` | True / `extensions.uuid_generate_v4()` | True / `gen_random_uuid()` |
| `producao.tipo_concreto` | False / `PadrÃ£o` | False / `—` |
| `montagem_poste.banco` | False / `montagem_poste` | False / `—` |
| `montagem_poste.created_at` | True / `timezone('utc'::text, now())` | True / `now()` |
| `montagem_poste.updated_at` | True / `timezone('utc'::text, now())` | True / `now()` |
