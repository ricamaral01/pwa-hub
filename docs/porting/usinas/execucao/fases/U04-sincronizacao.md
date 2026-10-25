# U04 — Carga inicial e atualização a cada minuto

**Resultado:** `concrefer-usinas-homolog.service` está ativo na VPS nova e executa `sync_receitas.py` em ciclos de 60 segundos. O script valida a base de origem, recusa destino fora de homologação, confere contrato de colunas, usa snapshot read-only da origem e faz upsert por `(unidade_id, origem_banco, origem_id)`. Uma atualização imediata por IDs foi testada com dados sintéticos. Na última conferência: 265 linhas na origem declaradas pelo ciclo, 265 no espelho, sem erro e 24 segundos desde a atualização.

**Limite:** a varredura completa por minuto foi aceita somente para 265 receitas. Tabelas grandes como `tbl_massadas` e CEC exigem janela/estratégia própria, checkpoint e medida de carga antes de serem ligadas. O serviço não sincroniza Pederneiras.

**Publicação de leitura:** `concrefer-usinas-prod.service` está ativo com destino nomeado exatamente `mapa_unificado_teste`. A carga inicial oficial repetiu a contagem de 265 receitas. A homologação mantém serviço e banco separados. [Evidência](../DEPLOY-LEITURA-20261022.md).

## Pendências para aprovação

- Confirmar a ordem de expansão das tabelas/unidades em homologação, após U01–U03.
- Validar o limite operacional de atraso mostrado aos usuários e a janela de reconciliação para tabelas volumosas.
