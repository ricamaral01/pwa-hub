# Estoque e blendas

## Escopo implementado

A Fase 5 adiciona o modulo `EstoqueModule` com movimentacao append-only e blendas. O saldo de `lote_resina` muda somente por `EstoqueMovimento`; edicao direta de saldo continua bloqueada por trigger e por servico.

## Movimento de estoque

Tipos de entrada: `entrada`, `ajuste_positivo`, `devolucao`, `transferencia_entrada`, `blenda_producao`.

Tipos de saida: `ajuste_negativo`, `consumo`, `transferencia_saida`, `blenda_consumo`, `estorno`.

Regras:

- toda escrita exige `idempotencyKey`;
- quantidade deve ser maior que zero;
- saldo posterior nunca pode ser negativo;
- lote bloqueado ou inativo nao movimenta;
- `saldoAnteriorKg` e `saldoPosteriorKg` ficam congelados no movimento;
- movimentos nao sao editados nem apagados;
- consumo de apontamento confirmado e transacional com a conclusao do apontamento.

## Blendas

Uma blenda exige pelo menos dois componentes, lotes distintos e saldo suficiente. A conclusao consome os lotes de origem e gera movimento de producao no lote resultante, dentro de uma unica transacao. Cancelamento exige motivo.

