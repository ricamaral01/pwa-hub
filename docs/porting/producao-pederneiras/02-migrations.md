# T2 — Expansão reversível do domínio Produção

Preparação em 23/10/2026. A migration **não foi aplicada ao banco operacional**.

## Entrega

- Alembic integrado ao backend PCP com `DATABASE_URL` explícita para evitar aplicação acidental no banco errado.
- Revisão `20261023_01`: schema `producao`, catálogo de unidades, produtos, apontamentos, metas e auditoria; `unidade_id` adicionado como coluna nullable em `atividades_mao_de_obra`, `maodeobra` e `maodeobra_dias`, com backfill Campinas (`id=1`). A expansão não altera os endpoints ou a leitura atual de Campinas.
- Revisão `20261023_02`: vínculo usuário/unidade, gestor único ativo por unidade, observação em mão de obra e índices por unidade.
- Revisão `20261023_03`: amplia a restrição de `maodeobra_dias.grupo_setor` para aceitar a chave isolada `02` de Pederneiras, preservando `12`/`34` de Campinas. A coluna operacional `maodeobra.quantidade_pessoas` já é `numeric(5,2)` e `atividades_mao_de_obra.ordem` já existe; o modelo ORM legado está defasado nesses dois pontos.
- O cadastro de áreas será a tabela atual `atividades_mao_de_obra`, parametrizada por unidade, tipo MOD/MOI e grupo. Reusar essa tabela evita duplicar o motor de lançamento. As restrições antigas continuam nesta fase; a alteração de chaves para incluir unidade e `NOT NULL` ficam para a fase contract depois de validar todos os escritores.
- O seed cria as unidades Campinas (`id=1`) e Pederneiras (`id=2`) como dados de catálogo. As regras de negócio usarão IDs e permissões consultadas no banco, sem comparar o texto do nome.

## Validação

Foi criado um banco de teste temporário `pcp_pederneiras_t2_test` na VPS nova com **somente o schema** de `pcp_unificado_teste`. O SQL gerado pelo Alembic executou `upgrade` completo e `downgrade` completo sem erro, com `ON_ERROR_STOP=1`. O banco temporário foi removido após a verificação. A reversão impede descartar dados novos se houver produtos, apontamentos, metas, auditoria ou mão de obra de outra unidade.

As revisões 01 e 02 também foram aplicadas no banco isolado `pcp_pederneiras_t4_test`. A revisão 03 passou pelo gerador Alembic e foi aplicada no mesmo banco com `ON_ERROR_STOP=1`. Nenhuma revisão foi aplicada ao banco operacional.

## Próximas verificações antes de aplicar em produção

1. Comparar contagens de registros Campinas antes/depois do backfill no banco de homologação com dados.
2. Validar permissões do papel da API para criar o schema e as tabelas; fazer backup e ensaio de rollback.
3. Adaptar consultas/escritas do motor de Mão de Obra para filtrar `unidade_id` e só então gravar Pederneiras.
4. Confirmar usuário gestor e classificação inicial de áreas, mantendo essa classificação editável.
