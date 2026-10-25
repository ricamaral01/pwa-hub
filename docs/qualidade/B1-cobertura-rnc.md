# B1.3 ? Cobertura integral do RNC legado

Invent?rio: esquema vivo do GED consultado em 15/10/2026, confrontado com `docs/porting/ged/00-esquema-rnc-ged.md`. As seis tabelas somam **89 colunas**. Cada linha tem destino expl?cito. Al?m do campo normalizado, `legado_payload` ret?m a linha original em JSONB em cada entidade e um evento `IMPORTACAO` guarda o conjunto original por NC. IDs de usu?rio s? entram em `*_id` ap?s resolu??o no mapa de identidades; o UUID GED permanece no payload.

O v?nculo `rnc_id` ? resolvido por `nc.id_legado`. `id_legado` ? ?nico por tabela de destino. Nenhum campo de origem ? descartado.

## `rnc_reports` ? 36 colunas

| Origem | Destino |
|---|---|
| `id` | `nc.id_legado` |
| `number` | `nc.numero_legado` |
| `title` | `nc.titulo` |
| `status` | `nc.status; nc.status_legado` |
| `severity` | `nc.gravidade_id; nc.gravidade_legado` |
| `origin` | `nc.origem_id; nc.origem_legado` |
| `rnc_type` | `nc.tipo_id; nc.tipo_legado` |
| `emitter_area` | `nc.area_emissora_id` |
| `destination_area` | `nc.area_responsavel_id` |
| `occurrence_at` | `nc.data_ocorrencia` |
| `detected_at` | `nc.data_deteccao` |
| `requirement_reference` | `nc.requisito_texto` |
| `description` | `nc.descricao` |
| `evidence_description` | `nc.evidencias_texto` |
| `impact_description` | `nc.impacto` |
| `containment_action` | `nc_contencao.descricao` |
| `source_reference` | `nc.referencia_origem` |
| `product_reference` | `nc.produto_texto` |
| `process_reference` | `nc.processo_texto` |
| `lot_reference` | `nc.lote_texto` |
| `supplier_reference` | `nc.fornecedor_texto` |
| `customer_reference` | `nc.cliente_texto` |
| `order_reference` | `nc.pedido_texto` |
| `responsible_sector_user_id` | `nc.responsavel_id; nc.legado_payload.responsible_sector_user_id` |
| `assigned_by` | `nc.atribuido_por; nc.legado_payload.assigned_by` |
| `triage_notes` | `nc.observacoes_triagem` |
| `conclusion_summary` | `nc_encerramento.conclusao` |
| `due_date` | `nc.prazo_final` |
| `closed_at` | `nc.encerrada_em` |
| `closed_by` | `nc.encerrada_por; nc.legado_payload.closed_by` |
| `reopened_at` | `nc.reaberta_em` |
| `reopened_by` | `nc.reaberta_por; nc.legado_payload.reopened_by` |
| `created_by` | `nc.criado_por; nc.legado_payload.created_by` |
| `updated_by` | `nc.atualizado_por; nc.legado_payload.updated_by` |
| `created_at` | `nc.criado_em` |
| `updated_at` | `nc.atualizado_em` |

## `rnc_root_cause_analyses` ? 12 colunas

| Origem | Destino |
|---|---|
| `id` | `nc_causa.id_legado` |
| `rnc_id` | `nc_causa.nc_id via nc.id_legado` |
| `method` | `nc_causa.metodo` |
| `problem_statement` | `nc_causa.problema` |
| `direct_cause` | `nc_causa.causa_direta` |
| `root_cause` | `nc_causa.causa_raiz` |
| `contributing_causes` | `nc_causa.causas_contribuintes` |
| `method_payload` | `nc_causa.metodo_payload; nc_porque quando estruturado` |
| `validated_by` | `nc_causa.validado_por; nc_causa.legado_payload.validated_by` |
| `created_by` | `nc_causa.criado_por; nc_causa.legado_payload.created_by` |
| `created_at` | `nc_causa.criado_em` |
| `updated_at` | `nc_causa.atualizado_em` |

## `rnc_action_plans` ? 18 colunas

| Origem | Destino |
|---|---|
| `id` | `nc_acao.id_legado` |
| `rnc_id` | `nc_acao.nc_id via nc.id_legado` |
| `action_type` | `nc_acao.tipo` |
| `status` | `nc_acao.status; nc_acao.status_legado` |
| `action_description` | `nc_acao.o_que` |
| `why` | `nc_acao.por_que` |
| `where_action` | `nc_acao.onde` |
| `who_user_id` | `nc_acao.quem_id; nc_acao.legado_payload.who_user_id` |
| `when_due` | `nc_acao.quando` |
| `how` | `nc_acao.como` |
| `how_much` | `nc_acao.quanto` |
| `evidence` | `nc_acao.evidencia` |
| `completed_at` | `nc_acao.concluida_em` |
| `verified_by` | `nc_acao.verificada_por; nc_acao.legado_payload.verified_by` |
| `verification_notes` | `nc_acao.notas_verificacao` |
| `created_by` | `nc_acao.criado_por; nc_acao.legado_payload.created_by` |
| `created_at` | `nc_acao.criado_em` |
| `updated_at` | `nc_acao.atualizado_em` |

## `rnc_effectiveness_reviews` ? 7 colunas

| Origem | Destino |
|---|---|
| `id` | `nc_eficacia.id_legado` |
| `rnc_id` | `nc_eficacia.nc_id via nc.id_legado` |
| `effectiveness_result` | `nc_eficacia.resultado (true EFICAZ; false NAO_EFICAZ)` |
| `reviewed_by` | `nc_eficacia.verificador_id; nc_eficacia.legado_payload.reviewed_by` |
| `reviewed_at` | `nc_eficacia.verificada_em` |
| `notes` | `nc_eficacia.notas` |
| `follow_up_required` | `nc_eficacia.requer_acompanhamento` |

## `rnc_history` ? 7 colunas

| Origem | Destino |
|---|---|
| `id` | `nc_evento.id_legado` |
| `rnc_id` | `nc_evento.nc_id via nc.id_legado` |
| `event_type` | `nc_evento.tipo` |
| `description` | `nc_evento.descricao` |
| `metadata` | `nc_evento.payload` |
| `created_by` | `nc_evento.autor_id; nc_evento.legado_payload.created_by` |
| `created_at` | `nc_evento.ocorrido_em` |

## `rnc_attachments` ? 9 colunas

| Origem | Destino |
|---|---|
| `id` | `nc_anexo.id_legado` |
| `rnc_id` | `nc_anexo.nc_id via nc.id_legado` |
| `file_name` | `nc_anexo.nome_armazenado` |
| `original_name` | `nc_anexo.nome_original` |
| `mime_type` | `nc_anexo.mime` |
| `file_size` | `nc_anexo.tamanho` |
| `storage_path` | `nc_anexo.storage_path_legado` |
| `uploaded_by` | `nc_anexo.enviado_por; nc_anexo.legado_payload.uploaded_by` |
| `created_at` | `nc_anexo.enviado_em` |

## Confer?ncia

- Colunas mapeadas: **89/89**; lacunas: **0**.
- Mapeamentos de enums/status seguem a se??o 6.1 do plano v2 e as decis?es C1/D9.
- O valor `ATRASADA` em a??o vira `EM_ANDAMENTO` no estado calculado; o valor original permanece em `status_legado` e no evento.
- As tabelas filhas vazias no snapshot A1 continuam cobertas para registros que surgirem at? C1.
