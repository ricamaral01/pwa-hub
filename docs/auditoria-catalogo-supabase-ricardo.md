# Catálogo estrutural do Mapa no Supabase

O arquivo [auditar_estrutura_mapa_supabase.sql](../scripts/auditar_estrutura_mapa_supabase.sql) contém somente consultas `SELECT` a `pg_catalog` e não lê linhas das tabelas da aplicação. Ele devolve um único conjunto de resultados com quatro colunas: `object_type`, `object_schema`, `object_name` e `details` (JSON). O esquema consultado é `public`. A primeira linha, `summary`, informa quantos objetos devem aparecer no arquivo exportado.

1. Abra o **SQL Editor do projeto Supabase do Mapa**, cole o conteúdo integral do arquivo SQL e execute. Não é necessário alterar ou criar nenhum objeto.
2. Exporte **todo** o resultado como CSV ou JSON. Confira que o número de linhas exportadas é `summary.details.object_count + 1`. Se `last_value_visible` for `false`, a conta do Editor não pôde mostrar o valor daquela sequência; mantenha a linha no arquivo.
3. Envie o arquivo exportado como anexo, sem colar corpos de funções no chat. Com ele, compararemos o catálogo com o PostgreSQL novo; antes de qualquer ajuste no novo banco, haverá backup com restauração testada. Uma chave única bloqueada por duplicatas será apresentada com as chaves dos casos, sem excluir ou alterar linhas automaticamente.

O arquivo exportado inclui definições de funções e políticas e deve ser tratado como material interno. Ele não contém linhas operacionais das tabelas.

## `on_conflict` já conferido no banco novo

Consulta somente leitura: `scripts/auditar_on_conflict_mapa.sql`, executada em `mapa_unificado_teste` em 05/10/2026. Os índices abaixo são únicos, válidos, prontos e sem predicado parcial.

| Chamada no `app.js` | Tabela | Colunas de conflito | Chave encontrada |
|---|---|---|---|
| 761 | `formas_manutencao` | `id` | `formas_manutencao_pkey` |
| 1687 | `programacao_pcp` | `data_fabricacao,setor,forma` | `programacao_pcp_data_setor_forma_unificado_uidx` |
| 1696 | `liberacao_formas` | `data_fabricacao,setor,forma` | `liberacao_formas_data_setor_forma_unificado_uidx` |
| 10182 e 14626 | `prog_s3_s4` | `data,forma,setor` | `prog_s3_s4_data_forma_setor_unificado_uidx` |

**Chaves ausentes para `on_conflict` explícito: zero.** O resultado do catálogo oficial ainda é necessário para comparar as demais restrições, índices, sequências, gatilhos, funções e políticas RLS.
