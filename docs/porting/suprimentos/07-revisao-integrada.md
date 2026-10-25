# E6 — Revisão integrada

**Data:** 25/10/2026. **Escopo:** S0–S1 local. Nenhuma alteração em produção ou na VPS antiga.

## Regressão

`SUPRIMENTOS_TEST_ADMIN_URL` apontou para o PostgreSQL descartável em loopback. `python -m pytest unificado/suprimentos/service/tests tests/suprimentos -q` terminou com **21 passed** (25,62 s), incluindo migrations, fluxo completo, autorização do gateway/casca com os cinco perfis da E3, desktop/tablet E4, PWA Pixel/iPhone E5 e rollback de migration em banco vazio. `node --check` do app e SW, `compileall` do serviço e `git diff --check` passaram. Os avisos restantes são de deprecação de FastAPI/Alembic no Python 3.14.

## Segurança

| Controle | Resultado |
|---|---|
| Identidade | Assertion HMAC de 20 s gerada no gateway; serviço aceita apenas origem de loopback. Testes assinam por requisição, sem override global. |
| Papel, unidade, CC e flag | Rotas de escrita usam `context`/`check_action`; aprovação requer APROVADOR no nível, inclusive para ADMIN; flag S1 bloqueia escrita. Rotas de leitura contextualizam a unidade. `health` e `/flags` têm uso operacional e `/flags` restringe loopback. |
| Catálogos e CC | Durante a revisão, a lista/detalhe de centros de custo foi limitada aos CCs dos papéis; `mais-pedidos` exige papel no CC pedido. Teste negativo cobre outro CC e outra unidade. |
| Fotos | Até 3 por solicitação, até 2 MiB, SHA-256, tipo JPEG/PNG, `client_uuid` idempotente, caminho fora do webroot, arquivo modo 0600, download com a mesma autorização do pedido e `private, no-store`. A validação de caminho passou a usar ancestral real, sem comparação textual de prefixo. |
| Segredos | Varredura de atribuições literais de credenciais, URL PostgreSQL com senha e blocos de chave privada nos arquivos `unificado/suprimentos/` e `tests/suprimentos/`: **0 ocorrências**. Chave de assinatura de produção e URL do banco são variáveis de ambiente externas ao repositório. |
| Logs | O serviço não imprime corpo de pedido, foto, cookie, nome ou token; o timer imprime apenas a contagem de solicitações fechadas. |
| PWA | SW cacheia só a shell; API e fotos fora do cache. IndexedDB separado por ID IAM e unidade; reenvio pausado após 401 e fila preservada. |

O nginx de homologação ainda precisa ser instalado e testado na E7, sobretudo precedência de location, `auth_request`, permissões do diretório privado, flag efetiva e isolamento do banco. A revisão de código local não substitui esses testes.

## Itens para fases posteriores

- **S2:** reserva e livro de movimentos, inventário, níveis de estoque e alertas de ponto de pedido.
- **S3:** cotação, pedidos, fornecedor e recebimento completo, integração de anexos com GED, NF por IA e jobs.
- **S4:** insumos da usina no Laboratório, automações e integração com Não Conformidade.
- **Antes de liberar usuários reais:** confirmar valores marcados `a_confirmar` de alçadas e SLA; cadastrar centros, materiais e papéis reais por Campinas; repetir teste de PWA em iOS Safari físico.

**Arquivos ajustados nesta etapa:** `unificado/suprimentos/service/suprimentos/api/cadastros.py`, `api/solicitacoes.py`, `service/tests/test_e2.py`, `docs/porting/suprimentos/07-revisao-integrada.md`, `progresso.md`.
