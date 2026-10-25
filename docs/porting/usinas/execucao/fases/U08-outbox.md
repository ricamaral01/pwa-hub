# U08 — Outbox e fila de erros

**Resultado:** `usinas_write.permissions`, `outbox` e a view `fila_erros` existem somente no banco de homologação. A chave de idempotência é única, e um trigger recusa novas intenções ou despacho quando a flag da ação está desligada. O teste sintético E6 confirmou que repetir a mesma chave não cria duas intenções; a transação de teste foi revertida. A última conferência mostrou 0 eventos e 0 permissões de despacho ativas.

**Limite:** não há endpoint de criação de intenção, worker de despacho, reconciliação de resposta ambígua nem tela operacional de fila. O esquema inerte não equivale ao fluxo de escrita homologado. Implementar um worker utilizável depende de U07 e U09.

## Pendências para aprovação

- Manter a outbox inerte enquanto vigorar a decisão de somente leitura. Uma futura autorização deve ser específica para tabela/ação/unidade e vir acompanhada do contrato de idempotência da origem.
- Aprovar responsáveis pela triagem de `conflito`, `resultado_desconhecido` e `erro` antes de disponibilizar a fila a operadores.
