# Diferenças de estrutura do Mapa — 03/10/2026

Origem: `GET /rest/v1/` com OpenAPI do Supabase, sem SQL nem escrita no oficial. Destino: `information_schema.columns` do PostgreSQL `mapa_unificado_teste`. A OpenAPI expõe colunas, obrigatoriedade, padrões e marcação de chave primária; ela não prova índices únicos adicionais, gatilhos ou sequências da origem. Esses itens ainda exigem fonte de catálogo autorizada ou teste de contrato isolado.

| Tabela | Origem | Destino | Só na origem | Só no destino | Padrões/obrigatoriedade divergentes |
|---|---:|---:|---|---|---|
| `usuarios` | 9 | 9 | `senha` | `senha_hash` | — |
| `programacao_pcp` | 10 | 10 | — | — | — |
| `liberacao_formas` | 6 | 6 | — | — | — |
| `producao` | 13 | 13 | — | — | — |
| `montagem_poste` | 17 | 17 | — | — | — |
| `formas_manutencao` | 12 | 12 | — | — | — |
| `prog_s3_s4` | 8 | 8 | — | — | — |

**Totais:** 1 colunas só na origem, 1 só no destino e 0 colunas comuns com padrão ou obrigatoriedade diferente.

A troca intencional de `usuarios.senha` por `usuarios.senha_hash` preserva a senha fora do PostgREST; seu contrato de login é atendido pelo serviço de autenticação com Argon2id. A grafia de padrões booleanos e literais de texto foi normalizada para a comparação.

## Chaves primárias

| Tabela | Origem OpenAPI | Destino PostgreSQL |
|---|---|---|
| `usuarios` | id | id |
| `programacao_pcp` | id | id |
| `liberacao_formas` | id | id |
| `producao` | id | id |
| `montagem_poste` | id | id |
| `formas_manutencao` | id | id |
| `prog_s3_s4` | id | id |

## Detalhe dos padrões e da obrigatoriedade

A OpenAPI e o catálogo PostgreSQL podem escrever padrões equivalentes de maneiras diferentes; os valores abaixo ainda precisam de comparação semântica.

| Coluna | Origem: obrigatória / padrão | Destino: obrigatória / padrão |
|---|---|---|
