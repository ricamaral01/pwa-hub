# T1 · Migração e seeds — 18/10/2026

## Implementação

Foi criada a migração SQL aditiva `001_schema.sql` no pacote do Laboratório. Ela cria apenas o schema `cronoanalise`, com as tabelas da especificação: `atividades`, `medicoes`, `pausas`, `auditoria`, `parametros_dimensionamento`, `layout_setores`, `config_simulacao`, `cenarios` e `simulacoes`. Foram acrescentadas `listas` para os dois conjuntos de motivos e `schema_migrations` para rastrear as versões SQL. Há índices e restrições conforme `docs/02`; `medicoes` mantém o ID UUID gerado no aparelho.

As referências de usuário são `text` sem FK, pois `public.usuarios` está em outro banco. Todas as tabelas da unidade usam `unidade_codigo text` com padrão `concrefer`. A API terá de validar o usuário autenticado. Nenhuma tabela ou revisão Alembic de `ensaio_postes` foi alterada. A revisão existente, tanto em `concretrack_postes_homolog` como em `concretrack_postes`, é `0005_conicidade_circular`.

`seed.py` gerou `migrations/002_seeds.sql` em UTF-8 a partir dos quatro JSON copiados para o pacote. Cada `INSERT` usa `ON CONFLICT DO NOTHING`, preservando edições de usuários quando o seed for reaplicado. O schema e os seeds começam sem medições, cenários ou simulações.

## Arquivos criados

- `unificado/laboratorio/service/cronoanalise/migrations/001_schema.sql`
- `unificado/laboratorio/service/cronoanalise/migrations/002_seeds.sql`
- `unificado/laboratorio/service/cronoanalise/migrations/999_rollback_test.sql` — recusa banco cujo nome não começa com `cronoanalise_test_`.
- `unificado/laboratorio/service/cronoanalise/seed.py`
- `unificado/laboratorio/service/cronoanalise/seeds/{catalogo,layout_setores,parametros,listas}.json`

## Teste em banco separado na VPS nova

Comandos relevantes: `python seed.py --output T1-seeds-generated.sql` (movido para `002_seeds.sql` após o teste); `createdb cronoanalise_test_20261018_1`; `psql -v ON_ERROR_STOP=1 -f 001_schema.sql`; `psql -v ON_ERROR_STOP=1 -f T1-seeds-generated.sql`; reaplicação dos dois scripts; consulta de contagens; `psql -v ON_ERROR_STOP=1 -f 999_rollback_test.sql`; consulta `to_regnamespace('cronoanalise')`; `dropdb cronoanalise_test_20261018_1`.

| Checagem após duas aplicações | Saída |
| --- | ---: |
| `atividades` | 40 |
| `layout_setores` | 4 |
| `parametros_dimensionamento` | 1 |
| `config_simulacao` | 1 |
| `listas` | 2 |
| `medicoes` | 0 |
| `schema_migrations` | 2 |
| `to_regnamespace` após reversão | `absent` |
| banco temporário após `dropdb` | ausente |

A primeira geração do SQL de seeds por redirecionamento PowerShell saiu em UTF-16 e foi rejeitada pelo PostgreSQL (`invalid byte sequence 0xff`). `seed.py --output` passou a gravar UTF-8 diretamente; a execução e a reaplicação posteriores passaram. Nenhum dado de homologação ou produção foi alterado em T1.
