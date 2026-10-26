# F4 — Contrato com o Estoque da usina (Laboratório)

**Ambiente:** somente homologação `https://concrefer.concretrack.com.br:18446`; Campinas. Versão final `1.0.84`, revisão Alembic `sup_0011`. A flag `S4` está **desligada**, e não há chave de serviço configurada. Não houve alteração em produção, na VPS antiga ou no estoque legado.

## Entrega

| Requisito | Implementação | Evidência |
|---|---|---|
| Sugestão vinda do Laboratório | `POST /api/suprimentos/integracao/sugestoes` valida origem, material ativo do domínio `insumo_usina`, quantidade, prazo e silo. Usa bloqueio transacional e índice de chave única para idempotência. | `api/integracao.py`, migração `0011_laboratorio_contrato.py`, `test_signed_suggestion_idempotency_and_flag`. |
| Cartão de silos | Painel mostra sugestões somente a Compras/Admin quando `S4` estiver ativa. Tabela fica dentro do cartão com rolagem interna. | `frontend/app.js`, capturas `capturas/f4/`; em homologação o cartão está oculto pela flag. |
| Baixa física informada pelo Laboratório | `POST /integracao/pedidos/{id}/recebido` verifica OC/item/domínio/saldo, admite parcial, registra evento e avaliação IQF, atualiza OC/solicitação e não lança `sup_movimento`. Chave repetida com outro conteúdo retorna 409. | `test_received_callback_updates_order_without_warehouse`, `test_non_usina_order_rejected`. |
| Compra normal de insumo da usina | Solicitação → aprovação → destino compra → cotação seguem o mesmo fluxo da S1/S3A. Catálogo web e PWA só apresenta `insumo_usina` quando S4 estiver ativa. | `api/solicitacoes.py`, `frontend/app.js`, `test_usina_material_follows_regular_purchase_flow`. |
| Segurança | Assertion HMAC de 30 segundos, emissor/audiência/unidade fixos, loopback interno. Não usa sessão de operador. | `integration_auth.py`, teste de token inválido, vencido e unidade trocada. |
| Contrato | OpenAPI 3.1, exemplos e regra de ativação. | [contrato-laboratorio.md](contrato-laboratorio.md). |

O simulador é o cliente `Lab` em `service/tests/test_f4.py`, que assina chamadas reais em banco descartável. `S4` só poderá ser ativada quando o Laboratório tiver fonte própria de data, cadastro de materiais e emissor da assertion.

## Verificação e publicação

- Suíte E1–F4 em bancos isolados: **34 passed**. Migração em banco vazio: `upgrade head → downgrade base → upgrade head`, **1 passed**.
- Primeiro teste de solicitação `insumo_usina` revelou validação antiga limitada ao almoxarifado. Foi corrigida com gate S4, e o fluxo até a cotação passou. Um segundo retorno 403 era causado pela ausência do CC na checagem interna; o CC da solicitação passou a ser fornecido. Falhas anteriores do ensaio da migração foram da montagem do banco descartável (arquivo `env.py` e `PYTHONPATH`), corrigidas sem mudar o produto.
- Backup e snapshot de permissões em `backups/suprimentos-f4-20261026T031500Z`. Migração `sup_0011`, `nginx -t`, serviço ativo e smoke **43/43**. A verificação final de conteúdo da chave idempotente recebeu backup `backups/suprimentos-f4-finish-20261026T032800Z`, smoke **43/43** e versão `1.0.83`.
- A auditoria com o cartão visível encontrou quebra do título em 360×780 com zoom 125%; `sup-silo-head` passou a permitir quebra de linha, com CSS escopado. Backup `backups/suprimentos-f4-layout-20261026T034000Z`, smoke **43/43**, versão `1.0.84`.
- Retorno da mudança de infraestrutura ensaiado: `sup_0011 → sup_0010`, arquivos e versão revertidos, serviço e nginx ativos. Reinstalação completa `sup_0010 → sup_0011`, 1.0.82 → 1.0.83 → **1.0.84**, com smoke **43/43** em cada passo e `health=200` ao final. Backups de reinstalação terminam em `f4-reinstall-20261026T034500Z`, `f4-finish-reinstall-20261026T034600Z` e `f4-layout-reinstall-20261026T034700Z`.
- Auditoria autenticada pela casca para o Painel do comprador em PC 1366×768, 1440×900, 1920×1080, tablet 820×1180 e 1180×820, celular 390×844 e 360×780, zoom 100% e 125%, menu aberto/recolhido. A rolagem horizontal fica apenas no componente `.table-scroll`, dentro do cartão; documento e iframe não rolam horizontalmente. [Diagnóstico real](capturas/f4/diagnostico.json). O cartão S4 foi conferido também com resposta simulada no navegador, sem ligar a flag no servidor: [diagnóstico simulado](capturas/f4/diagnostico-s4-simulado.json).

## Limites para a ativação

O Laboratório ainda precisa implementar sua ponta e validar idempotência em ambiente integrado. A chave `SUPRIMENTOS_LAB_SERVICE_KEY` deverá ser gerada e guardada fora do Git. A entrada física e o saldo dos silos permanecem responsabilidade do Laboratório. Não há leitura nem escrita de `tbl_est_*`, nem chamada ao proxy legado.
