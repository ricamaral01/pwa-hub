# Contrato S4 — Laboratório ↔ Suprimentos

**Estado:** implementado no lado do Suprimentos, desativado pela flag `S4` em Campinas na homologação. O Estoque da usina ainda não foi migrado para o Laboratório. Nenhuma chamada para o legado ou para `tbl_est_*` é feita.

## Transporte e autenticação

O Laboratório chama o serviço do Suprimentos pelo endereço interno `http://127.0.0.1:13167` na VPS nova, com `Content-Type: application/json` e `X-Suprimentos-Service-Assertion`. Não usar cookie de usuário ou sessão do Unificado. A rota rejeita clientes fora do loopback. A assertion é `base64url(JSON).base64url(HMAC-SHA256)`, emitida com `SUPRIMENTOS_LAB_SERVICE_KEY` de pelo menos 32 caracteres, fora do Git. Claims: `iss=laboratorio`, `aud=suprimentos-integracao`, `unidade=campinas`, `iat`, `exp=iat+30` (segundos Unix). Chaves de serviço e flag `S4` só serão ativadas após o Laboratório implementar e homologar o emissor. A unidade da assertion precisa coincidir com o parâmetro `unidade`.

## OpenAPI 3.1 (contrato)

```yaml
openapi: 3.1.0
info:
  title: Suprimentos × Laboratório — Estoque da usina
  version: 1.0.0
servers:
  - url: http://127.0.0.1:13167
components:
  securitySchemes:
    ServiceAssertion:
      type: apiKey
      in: header
      name: X-Suprimentos-Service-Assertion
paths:
  /api/suprimentos/integracao/sugestoes:
    post:
      summary: Registrar sugestão de ressuprimento da usina
      security: [{ServiceAssertion: []}]
      parameters:
        - {in: query, name: unidade, schema: {type: string, default: campinas}}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [origem, material_id, quantidade, data_limite, silo_destino, chave_idempotencia]
              properties:
                origem: {type: string, const: estoque_usina}
                material_id: {type: string, format: uuid}
                quantidade: {type: number, exclusiveMinimum: 0}
                data_limite: {type: string, format: date}
                silo_destino: {type: string, maxLength: 120}
                chave_idempotencia: {type: string, maxLength: 120}
      responses:
        '201': {description: Criada ou repetida sem duplicar; retorna id, status SUGERIDA e repetida}
        '401': {description: Assertion ausente, vencida ou inválida}
        '403': {description: Origem não interna, unidade diferente ou S4 desligada}
        '409': {description: Chave reutilizada com conteúdo diferente}
        '422': {description: Material, quantidade, data ou silo inválidos}
    get:
      summary: Painel de sugestões, só para Compras ou Admin com S4
      parameters:
        - {in: query, name: unidade, schema: {type: string, default: campinas}}
        - {in: query, name: status, schema: {type: string, default: SUGERIDA}}
        - {in: query, name: page, schema: {type: integer, minimum: 1, default: 1}}
        - {in: query, name: size, schema: {type: integer, minimum: 1, maximum: 100, default: 40}}
      responses:
        '200': {description: total, page, size e items}
        '403': {description: Sem papel, unidade ou flag}
  /api/suprimentos/integracao/pedidos/{id}/recebido:
    post:
      summary: Confirmar entrada física do insumo no Laboratório
      security: [{ServiceAssertion: []}]
      parameters:
        - {in: path, name: id, required: true, schema: {type: string, format: uuid}}
        - {in: query, name: unidade, schema: {type: string, default: campinas}}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [pedido_item_id, quantidade, chave_idempotencia]
              properties:
                pedido_item_id: {type: string, format: uuid}
                quantidade: {type: number, exclusiveMinimum: 0}
                numero_nf: {type: string, maxLength: 40}
                documento_ref: {type: string, maxLength: 120, description: Referência privada do documento no Laboratório}
                inspecao_status: {type: string, enum: [LIBERADO, CONDICIONAL, REPROVADO]}
                chave_idempotencia: {type: string, maxLength: 120}
      responses:
        '200': {description: id, status RECEBIDO, pedido_status, avaliacao_id e repetida}
        '401': {description: Assertion inválida}
        '403': {description: Unidade ou flag indisponível}
        '404': {description: Pedido ou item fora da unidade}
        '409': {description: Pedido não aguardando entrada, item fora do domínio, quantidade excedida ou chave divergente}
```

`inspecao_status=REPROVADO` não baixa o pedido. Quantidades parciais usam chaves distintas. Uma repetição com a mesma chave e o mesmo conteúdo retorna o recebimento original. A entrada física e o saldo do silo pertencem ao Laboratório; a baixa no Suprimentos afeta só a OC e a solicitação. O IQF recebe avaliação automática e provisória, com atendimento 3/5 até confirmação humana. O número da NF e a referência documental ficam apenas como metadados no Suprimentos.

## Simulador e aceite

`unificado/suprimentos/service/tests/test_f4.py` contém o cliente `Lab`, que assina chamadas reais de 30 segundos, cria sugestão, repete a chave, rejeita alteração de conteúdo, testa flag desligada e entrada física parcial/total, sem movimentar `sup_movimento`. Ele usa PostgreSQL descartável por teste. Ativar S4 exige teste integrado com o Laboratório, cadastro de materiais `insumo_usina` e decisão sobre a chave de serviço; não é parte desta fase.
