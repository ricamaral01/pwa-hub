# Dosagem v2 — avanço da Release 1 em 21/10/2026

## Implementado localmente

- R1-06: betonada A1 com correção por umidade e absorção, cálculo no cliente e recálculo no servidor; painel, carta e documento salvo.
- R1-08: plano de três misturas, registro de ensaios e aprovação condicionada ao resultado no servidor. Corrigido o estado retornado em `documento.status`.
- R1-12: Produção exige horário da medição, responsável, balança e lote de cada material. A API valida os campos quando a rastreabilidade é informada, calcula massas úmidas e água, conserva esses dados e sinaliza dosado fora da tolerância. A tabela da carta ganhou rolagem horizontal no celular.

## Verificação

- `npm run build`: passou.
- `PYTHONPATH=api python -m pytest api/tests/test_s1_impact41.py -q`: 1 passou.
- R1-06, R1-08 e R1-12: 4/4 testes de navegador cada, com API real, axe e capturas por tamanho em `dosagem-concreto-v2/tests/e2e/__screenshots__/`.
- `npm run gates`: F1 e F2 verdes. F3 e F4 vermelhos: 44/44 testes de navegador passaram em cada ciclo, mas o mínimo é 56. Mensagem exata: `Expected at least 56 passing tests`. Auditoria: `R1-09`, `R1-10`, `R1-11` e `R1-14` ausentes para desktop, tablet-retrato, tablet-paisagem e celular. Backup/restauração e compatibilidade N−1 passaram. Detalhes automáticos em `GATES.json`; log em `GATES-EXEC-20261021.log`.

## Próxima etapa

Concluir CAA (R1-09), resistências/desforma (R1-10), impacto S1 (R1-11) e offline/conflito (R1-14), com teste real nos quatro tamanhos. Repetir `npm run gates` até F1–F4 verdes. A Release 1 oficial permanece bloqueada. Este avanço ainda não foi enviado à VPS; a versão piloto publicada permanece a release `20261021-r1-0102-x1-piloto`.
