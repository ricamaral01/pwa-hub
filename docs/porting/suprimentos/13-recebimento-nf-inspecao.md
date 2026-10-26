# F3 — Recebimento com NF, inspeção e IQF

**Ambiente:** somente homologação `https://concrefer.concretrack.com.br:18446` (Campinas). Versão final da F3: `1.0.81`; migração Alembic `sup_0010`. Produção e VPS antiga não foram alteradas.

## Entrega verificável

| Tema | Implementação | Evidência |
|---|---|---|
| Documento versionado | `sup_recebimento`, `sup_recebimento_item`; rascunho → conferência humana → inspeção → confirmação. Estorno compensa movimentos e cria versão seguinte. | `migrations/versions/0009_recebimento.py`, `0010_recebimento_rateio.py`, `api/recebimento.py`; teste `test_manual_nf_divergence_inspection_iqf_and_reverse`. |
| NF privada e leitura opcional | Anexo PDF/JPG/PNG até 12 MB, SHA-256, arquivo 0600 fora de `public`. `sup_nf_job` persistente; worker por timer, provedor configurável por `SUPRIMENTOS_NF_PROVIDER_URL` e `SUPRIMENTOS_NF_PROVIDER_KEY`. Sem chave: `DESLIGADO` e digitação manual. JSON extraído fica como sugestão e exige confirmação humana. | `nf_worker.py`, `suprimentos-nf-worker.service/.timer`; teste `test_nf_job_survives_database_reconnect`; timer `active`, log `SEM_JOB` em homologação. |
| Divergências | Número/CNPJ da NF e itens digitados pelo almoxarife. Diferença de quantidade NF×contagem, preço acima da OC, quantidade acima da OC ou CNPJ diferente criam pendência para Compras. Quantidade acima da OC requer retificação da OC. | `POST /recebimentos/{id}/conferir`, `/resolver`; testes F3. |
| Estoque e destino | Itens liberados com material registram entrada e, se houver origem na solicitação, saída de cross-docking. Custo unitário inclui item+IPI+frete. Frete total é distribuído proporcionalmente ao valor dos itens liberados. Endereço é escolhido na tela. | `api/estoque.py` `movement()`, `api/recebimento.py` `confirm()`; assertivas de saldo, livro, custo e rateio no teste F3. |
| Inspeção | Critérios editáveis por categoria em `sup_inspecao_criterio`: EPI pede CA válido; químico, FDS/lote/validade; demais, embalagem e quantidade. Decisão `LIBERADO`, `CONDICIONAL` ou `REPROVADO`. | `GET/PUT /recebimentos/criterios/...`, teste de reprovação. |
| NC | Reprovação cria fila idempotente `sup_nc_pendente`, acessível à Qualidade, e marca o destino como devolução. O vínculo ao número da NC é informado pela Qualidade. | `GET /recebimentos/ncs/pendentes`, `POST /ncs/{id}/vincular`; teste `test_rejected_receipt_queues_nc`. |
| IQF | Notas automáticas de prazo, quantidade, inspeção e documentos; atendimento começa em 3/5 e pode ser confirmado manualmente. Estorno marca a avaliação, excluindo-a da média dos últimos 12 meses. | `apply_iqf()`, `POST /recebimentos/{id}/atendimento`; teste F3. |
| Interface | Lista, novo rascunho, detalhe, documento, itens, inspeção, divergência e estorno; CSS escopado ao módulo. Menu e catálogo de telas reconhecem `suprimentosRecebimento`, visível só com `S3B`. | `recebimento/index.html`, `frontend/recebimento.js/.css`, `shell/menu.config.js`, `shell/router.js`, `screen_catalog.json`. |

**Contrato proposto para abertura automática da NC:** a Qualidade disponibiliza uma rota interna autenticada por assertion de serviço própria (emissor `suprimentos`, audiência `qualidade`, TTL curto), aceita `unidade`, `recebimento_id`, `item_id`, `motivo` e `chave_idempotencia`, responde `nc_id`. Quando o contrato existir, um consumidor da fila marca `ENVIADA` na mesma chave. A rota atual do operador não é chamada com privilégios herdados. Nenhuma chave de IA ou de serviço foi cadastrada nesta fase.

## Testes e publicação

- Migração em banco descartável: `upgrade head → downgrade base → upgrade head` passou com as revisões `sup_0009` e `sup_0010`.
- Regressão integrada E1–E7+F1+F2+F3: **31 passed** após o último endurecimento de escopo, incluindo CA no cadastro e visibilidade de NC por CC. Assertion assinada por ator e banco descartável por teste.
- Homologação: backup anterior ao deploy em `backups/suprimentos-f3-20261026T020900Z`, complemento visual em `.../suprimentos-f3-finish-20261026T022100Z`, regra de frete em `.../suprimentos-f3-rateio-20261026T023000Z` e escopo/CA em `.../suprimentos-f3-seguranca-20261026T023500Z`; arquivos e banco copiados com modos 0600 nos backups. `nginx -t` passou, serviço e timer ativos, smoke **43/43** após cada publicação.
- O primeiro ensaio do deploy da F3 falhou por sintaxe no script de patch da casca. O retorno automático executou `downgrade sup_0009 → sup_0008`, restaurou os arquivos e deixou `VERSION=1.0.77`; a instalação corrigida foi concluída em seguida. A regra de frete foi instalada na versão `1.0.80` com backup e retorno pronto.
- Auditoria autenticada pela casca na versão final `1.0.81`, com menu aberto/recolhido e zoom 100/125: **252/252 combinações sem estouro horizontal, 404 de recursos ou erro do módulo**, cobrindo lista e detalhe para almoxarife, comprador, Qualidade e `ricardo.teste`, além de Novo para almoxarife. Tamanhos: 1366×768, 1440×900, 1920×1080, 820×1180, 1180×820, 390×844 e 360×780. Resultado em [diagnostico.json](capturas/f3/diagnostico.json), com PNGs na mesma pasta.

## Capturas de referência

| Tela | PC | Celular |
|---|---|---|
| Lista | [1440×900](capturas/f3/e2e-suprimentos-almox-lista-1440x900-z100-aberto.png) | [390×844](capturas/f3/e2e-suprimentos-almox-lista-390x844-z100-recolhido.png) |
| Documento | [1440×900](capturas/f3/e2e-suprimentos-almox-detalhe-1440x900-z100-aberto.png) | [390×844](capturas/f3/e2e-suprimentos-almox-detalhe-390x844-z100-recolhido.png) |
| Novo | [1440×900](capturas/f3/e2e-suprimentos-almox-novo-1440x900-z100-aberto.png) | [390×844](capturas/f3/e2e-suprimentos-almox-novo-390x844-z100-recolhido.png) |

## Limites conhecidos

- O provedor de leitura de NF não tem chave configurada; a fila fica desligada e o fluxo manual funciona.
- A Qualidade ainda não oferece autenticação serviço a serviço para abrir NC; a fila visível evita perda, sem chamada privilegiada à rota existente.
- A classificação fiscal do custo continua `a_confirmar` pela contabilidade. Não há importação de NF nem recebimento real nesta homologação.
