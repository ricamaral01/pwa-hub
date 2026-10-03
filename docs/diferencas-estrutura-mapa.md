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

## Restrições de conflito para escrita

A auditoria de 03/10/2026 encontrou **zero grupos duplicados** nas combinações `programacao_pcp(data_fabricacao,setor,forma)`, `liberacao_formas(data_fabricacao,setor,forma)` e `prog_s3_s4(data,forma,setor)`. O destino tinha apenas índices não únicos nessas combinações. O teste sintético do `POST` com `Prefer: resolution=merge-duplicates` e `on_conflict=data_fabricacao,setor,forma` falhou com `42P10` no destino. Foram criados índices únicos **somente no Mapa de testes** por `api_write_conflicts.sql`; o mesmo teste passou depois, com limpeza confirmada. O `app.js` original usa essas combinações em seus upserts, mas a OpenAPI de origem não expõe seus índices; ainda não há prova direta de equivalência dos índices com o oficial.

| Coluna | Origem: obrigatória / padrão | Destino: obrigatória / padrão |
|---|---|---|
