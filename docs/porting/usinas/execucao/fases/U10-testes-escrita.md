# U10 — Homologação de gravação e falhas

**Resultado:** o roteiro H1–H8 está especificado em [write-through-evidencia.md](../write-through-evidencia.md#homologação--roteiro-e-estado): gravação, idempotência, conflito, corrida, origem fora do ar, refresh imediato, autorização e rollback. Os testes executados até agora são E1–E8 do espelho e nove testes unitários de leitura/hash/chave; **nenhum H1–H8 foi executado**. A base oficial não recebeu gravação de teste.

**Limite:** não existe API legada de homologação isolada nem contrato aprovado de escrita. Executar H1–H8 na fonte oficial contrariaria a decisão de somente leitura.

## Pendências para aprovação

- Após resolver U07–U09, preparar ambiente sintético isolado da API/banco antigos e aprovar os dados fictícios e os casos H1–H8 por ação.
- Somente resultados verdes e documentados podem habilitar o pedido de ativação U11; testes do espelho não substituem esses gates.
