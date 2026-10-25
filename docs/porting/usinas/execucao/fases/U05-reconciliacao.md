# U05 — Fidelidade e reconciliação

**Resultado:** `verify_real_mirror.py` comparou `tbl_receitas` Campinas com `usinas.receitas`: 0 IDs faltantes, 0 extras e 0 diferenças nas 42 colunas ou no hash canônico. Os testes sintéticos E1–E8 cobriram repetição, atualização, remoção, revisão, refresh por ID, falha da origem, bloqueio de outbox, mudança de esquema e estado de erro. A última verificação encontrou 265/265 receitas, 0 eventos na outbox e 0 permissões de despacho ativas.

**Limite:** essa evidência é de leitura/espelhamento e não substitui H1–H8 de escrita. Não cobre somatórios de massadas, movimentos, saldos, CEC, relatórios nem outras unidades. Uma conferência pontual não demonstra histórico contínuo de SLA.

**Publicação de leitura:** a comparação após a carga no banco oficial novamente encontrou 265/265, 0 faltantes, 0 extras e 0 divergências de colunas/hash. [Evidência](../DEPLOY-LEITURA-20261022.md).

## Pendências para aprovação

- Aprovar casos de referência e tolerâncias para somatórios, fórmulas e datas por tabela/unidade antes da expansão.
- Definir período de observação e limite de atraso para aceite da próxima fonte de leitura.
