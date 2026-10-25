# B2 — API e regras de NC

**Data:** 15/10/2026. **Estado:** código implantado no destino durante o lote 1, sem liberação operacional aos usuários. O gate pré-migration encontrou falha anterior no iframe PCP; após aprovação de Ricardo, ela foi corrigida e a regressão passou. As migrations aditivas foram aplicadas, sem migração de RNC. Veja o [relatório consolidado](../porting/lote-1.md).

## Contrato

- Serviço: `unificado/qualidade/service/quality`, FastAPI + SQLAlchemy 2, banco exclusivo `qualidade`, schema `qualidade`.
- Prefixo interno: `/api`; prefixo público: `/unificado/qualidade/api/`. [OpenAPI gerado](B2-openapi.json) a partir de `quality.main:app`, com 37 operações e 36 caminhos nesta revisão. O Nginx autentica também os arquivos da SPA, retira `Cookie` e passa apenas `X-Qualidade-Assertion` ao loopback da API.
- Afirmação HMAC: `{id,name,iss:'unificado',exp,actions:[...],areas:[codigos],unit?,superuser?}`. A assinatura usa HMAC-SHA256 do JSON em base64url, validade máxima de 20 segundos; API exige origem 127.0.0.1, segredo de pelo menos 32 caracteres e decide a ação por endpoint. Todas as ações vêm na afirmação. Superusuário recebe ações implícitas e gera `nc_evento` como qualquer ator.
- Diretório para seletores: rota **Flask**, fora da OpenAPI FastAPI, `GET /unificado/mapa/api/unified/quality-users`. Resposta `{ok:true,users:[{id,name}]}`; somente sessão Mapa ativa com alguma tela Qualidade. A API Qualidade não consulta Mapa/PCP diretamente.
- Escopo: rascunho só autor/superusuário; NC registrada visível ao autor, responsável, `ver_todas` da empresa ou `ver_area` quando `area_emissora` ou `area_responsavel` tiver código presente em `areas` da afirmação. A unidade ativa da sessão, quando existir, restringe leitura e escrita. As áreas são os 20 códigos do GED, persistidos em `qualidade.area.codigo` e concedidos pelo Unificado.
- Corpo de arquivos: máximo 25 MiB, assinatura de conteúdo conferida contra MIME PDF, PNG, JPEG, WebP, TXT UTF-8, DOC, DOCX, XLS e XLSX. Diretório privado `QUALIDADE_UPLOAD_DIR`, fora de `public`; download só por endpoint autenticado.

## Estados e numeração

| Evento | Origem | Destino | Ação |
|---|---|---|---|
| registrar | RASCUNHO | REGISTRADA | `abrir`, autor |
| triar | REGISTRADA | CONTENCAO | `triar` |
| concluir contenção | CONTENCAO | ANALISE_CAUSA | `tratar` |
| dispensar corretiva | CONTENCAO | ENCERRAMENTO | `triar`, justificativa, Menor/Observação sem reincidência obrigatória |
| concluir causa | ANALISE_CAUSA | PLANO_ACAO | `tratar` |
| concluir plano | PLANO_ACAO | VERIFICACAO_EFICACIA | `tratar` |
| eficácia eficaz | VERIFICACAO_EFICACIA | ENCERRAMENTO | `verificar_eficacia` |
| eficácia não eficaz | VERIFICACAO_EFICACIA | ANALISE_CAUSA | `verificar_eficacia` |
| aprovar encerramento | ENCERRAMENTO | ENCERRADA | `encerrar` |
| reabrir com motivo | ENCERRADA | ANALISE_CAUSA | `encerrar` |
| cancelar com motivo | REGISTRADA/CONTENCAO | CANCELADA | `triar` |
| descartar com motivo | RASCUNHO | CANCELADA | `abrir`, autor |

Não há PATCH genérico de status. `RASCUNHO` não consome numeração. Ao registrar, a API incrementa `nc_numero_contador` com `INSERT ... ON CONFLICT DO UPDATE RETURNING`, preenche `NC-AAAA-NNNN` e grava `nc_evento` na mesma transação. Se o contador passar de 9999, a transação falha. Rascunho descartado continua no banco com evento e motivo.

## Operações por grupo

| Grupo | Rotas principais | Regra |
|---|---|---|
| Consulta | `/contexto`, `/catalogos`, `/painel`, `/nc`, `/nc/{id}`, `/nc/{id}/semelhantes`, `/nc/{id}/pdf` | Identidade, escopo da NC, filtros por unidade/status/gravidade/origem/área/busca/atribuição/atraso/eficácia. |
| Abertura | `/nc/rascunhos`, `/nc/{id}/registrar`, `/nc/{id}/descartar` | Descrição e local na abertura rápida; abertura completa exige título, origem e detecção. Título e data automáticos no registro rápido. |
| Fluxo | `/triagem`, `/contencoes`, `/concluir-contencao`, `/dispensar-corretiva`, `/causa`, `/concluir-causa`, `/acoes`, `/concluir-plano`, `/eficacia`, `/encerramento`, `/encerrar`, `/reabrir`, `/cancelar` | Cada rota confere etapa e ação HMAC. Mudança, evento e outbox na transação. |
| Complementos | `/comentarios`, `/vinculos`, `/anexos`, `/anexos/{id}`, `/pdf` | Sem exclusão física; referência, arquivo e evento associados à NC. |
| Cadastros | `/cadastros/{name}`, `/cadastros/contatos/usuarios` | Gravações exigem `qualidade.nc.cadastros`. `usuario_contato` local guarda e-mail por ID para SMTP; atualização não toca cadastro Mapa/PCP. |

Regras implementadas: triagem define gravidade/tipo/área/responsável/prazo e completa origem de abertura rápida; Maior exige corretiva concluída e rodada eficaz; Menor recorrente não dispensa corretiva; contenção exige disposição; `CONCESSAO` exige aprovador e cria pedido na outbox; causa-raiz e ocorrência em outros locais são obrigatórias; executor não verifica sua própria ação; encerramento exige decisões e justificativas de riscos e documentos. Cliente afetado gera pendência com confirmação auditada em endpoint próprio. `legado=true` pode ser lido com lacunas, mostradas em `campos_pendentes`, e passa pelas regras novas na transição seguinte. Atraso é calculado por prazo, não gravado no status da ação.

## Outbox

`notificacao_outbox` recebe atribuição, pedido de aprovação de concessão/encerramento, aviso dois dias antes do prazo e atraso. `quality.outbox` é o entrypoint de timer systemd: envia via SMTP com STARTTLS ou SSL (`QUALIDADE_SMTP_SECURE`), usando credenciais próprias `QUALIDADE_SMTP_*` fora do Git, conta tentativas e grava código de erro. O código GED usa `SMTP_HOST`, `SMTP_PORT` e `SMTP_SECURE` no provedor existente; a configuração do destino será conferida sem copiar credenciais. Falha SMTP ou ausência de e-mail não desfaz a NC. `usuario_contato` fornece e-mail sem conexão a outro banco. Quando contato é cadastrado após a criação da pendência, o timer tenta resolvê-lo novamente. A tela do painel consulta atribuições e ações pendentes.

## Testes e limites

- `PYTHONPATH=unificado/qualidade/service python -m pytest -q unificado/qualidade/service/tests`: **27 passaram**. Cobrem transições, registro rápido mínimo, Maior, causa, verificador independente, prazo calculado, escopo de leitura/tratativa, assinatura/expiração HMAC e assinatura de arquivo.
- Importação e OpenAPI FastAPI concluídas; build React 18/TypeScript/Vite da B3 concluído.
- **Verificado no destino:** migrations PostgreSQL 16 aplicadas, serviço systemd ativo, `/api/health` 200, consulta do banco dedicado com HMAC no loopback e Nginx negando página/API sem sessão (401). O teste HTTPS com conta Qualidade criou rascunho, registrou a NC com número oficial e confirmou eventos. A triagem aditiva levou a NC para `CONTENCAO` e gravou atribuição e avisos na outbox; veja o [lote 1](../porting/lote-1.md). SMTP real e PDF com dados reais ficam para a validação B5. O PDF atual gera identificação e descrição básica da NC; composição completa com anexos/histórico fica para o ensaio B5.
- Contatos precisam ser cadastrados para que a outbox envie e-mail. Entradas sem contato ficam em `SEM_EMAIL`; a operação da NC continua. O diretório Flask fornece somente ID/nome, sem e-mail.
