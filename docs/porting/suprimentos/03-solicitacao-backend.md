# E2 — Solicitação e aprovação no backend

**Ambiente de prova:** PostgreSQL 16 descartável em loopback, banco exclusivo com nome aleatório por sessão de teste. Nenhuma VPS foi alterada nesta etapa.

## Implementação

- `unificado/suprimentos/migrations/versions/0003_solicitacao.py`: solicitações, itens, fotos privadas, aprovações, contador por unidade e estruturas reservadas para S2. `client_uuid` é único por unidade; estado e quantidade são restringidos no banco. A FK de endereço da reserva foi completada com chave composta.
- `unificado/suprimentos/service/suprimentos/api/solicitacoes.py`: criação web/PWA, listagem filtrada por escopo, detalhe, edição, envio, decisões individuais e em lote, separação, entrega parcial, cancelamento de item elegível, confirmação, relato e resolução de problema, catálogo e início PWA. Foto até 3 por solicitação e 2 MiB cada, SHA-256, caminho privado configurado e leitura autenticada com a mesma autorização da solicitação. O solicitante não recebe saldo nem preço no catálogo PWA.
- `unificado/suprimentos/service/suprimentos/workflow.py`: transições e eventos atômicos; valor estimado com aviso de item sem preço; alçada provisória de R$ 2.500,00; SLA por urgência; sequência legível `SOL-00001` por unidade; aprovação com nível e CC.
- `unificado/suprimentos/service/suprimentos/auth.py`: regra D7 esclarecida. Papel com `cc_id NULL` abrange todos os CCs da unidade. ADMIN não aprova/devolve/reprova sem papel APROVADOR no nível exigido.
- `unificado/suprimentos/service/suprimentos/close_delivered.py` e `unificado/suprimentos/deploy/suprimentos-fechamento.{service,timer}`: fechamento após o parâmetro de horas, transação idempotente e execução horária prevista para a homologação.

## Verificação

Os testes E2 usam uma assertion HMAC real por **requisição** (`X-Suprimentos-Assertion`) com cliente ASGI em `127.0.0.1`. Não usam `dependency_overrides` de identidade. Cada execução cria um banco descartável, migra com Alembic e o remove no final; os dados de negócio são isolados com `TRUNCATE ... CASCADE` preservando os seeds. O ciclo de downgrade é um teste separado em outro banco vazio: **upgrade head → downgrade base → upgrade head**.

Cobertura: idempotência de cinco reenvios, autorização por papel/unidade/CC, ADMIN sem alçada e com APROVADOR, bordas R$ 2.500,00 e R$ 2.500,01, lote misto, transições válidas e inválidas, devolução/reprovação, urgência, flag, entrega parcial, problema e reentrega, foto acima do limite e de outra unidade, fechamento automático duas vezes.

Após o último ajuste, E1+E2 completos rodaram **três vezes consecutivas**: `12 passed` em cada execução (6,77 s; 6,73 s; 6,86 s). Houve 68 avisos de dependências em cada execução, sem falha. Antes disso, um defeito real foi corrigido: a rota de aprovação retornava 409 antes de verificar o papel; agora a identidade sem alçada recebe 403.

## Limites

- Valores de alçada e SLA permanecem provisórios (`a_confirmar=true`) como D13.
- Compra, reserva funcional e saldo entram em S2/S3; a E2 não simula esses movimentos.
- O timer e o serviço ainda não estão instalados; instalação somente na E7.
