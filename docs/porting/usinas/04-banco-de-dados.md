# Bancos, esquemas e proveniência

Inspeção em 22/10/2026 via `pg_dump --schema-only --no-owner` e consultas `BEGIN READ ONLY`. Dumps preservam definições de tabelas, PK/FK, índices, views, funções, triggers, sequências e GRANTs. Contagens são instantâneas no momento da consulta, portanto podem mudar com a produção. Tamanho = `pg_total_relation_size` (dados + índices + TOAST). **“Destino proposto” indica tabela espelho na VPS nova, sem transferir a fonte oficial:** a aplicação só lê o espelho; somente o sincronizador o atualiza. Escritas humanas aprovadas voltam à VPS antiga conforme a [Etapa 2B](execucao/write-through-evidencia.md).

## Resumo dos bancos

| Banco | Tabelas | Views | Funções | Triggers | Sequências | índices | Papel no porting |
|---|---:|---:|---:|---:|---:|---:|---|
| [supervisorio_db](schemas/supervisorio_db.sql) | 21 | 0 | 1 | 1 | 12 | 19 | Operação Campinas |
| [supervisorio_db_pede](schemas/supervisorio_db_pede.sql) | 23 | 0 | 1 | 1 | 11 | 21 | Operação Pederneiras |
| [controle_est_concre_db](schemas/controle_est_concre_db.sql) | 8 | 0 | 0 | 0 | 1 | 14 | CEC canônico |
| [pcp_concrefer](schemas/pcp_concrefer.sql) | 19 | 0 | 0 | 0 | 19 | 48 | Dependência PCP |
| [pcpconcrefer_db](schemas/pcpconcrefer_db.sql) | 7 | 0 | 0 | 0 | 7 | 12 | Dependência PCP |
| [pcp_armaduras](schemas/pcp_armaduras.sql) | 6 | 0 | 0 | 0 | 6 | 10 | Dependência PCP |
| [concrefer_db](schemas/concrefer_db.sql) | 0 | 0 | 0 | 0 | 0 | 0 | Sem objetos de usuário |

## Tabelas, contagens, tamanho e datas

A coluna de data é a primeira coluna temporal preferencial (`data`, `datahora`, `created_at` etc.); tabelas sem coluna temporal têm `—`. `Leitores/escritores` deriva de referências estáticas em arquivos selecionados, não de auditoria de execução. Para tabelas do supervisório sem escrita observada no ERP, a escrita do CLP/serviço de ingestão – hipótese a confirmar com o fornecedor da automação.

### supervisorio_db

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| `Empresas` | 0 | 16 kB | – | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_massadas` | 10797 | 4488 kB | data: 2026-02-19 – 2026-10-22 | erp_api:routers/massadas.py (leitura/ref.)<br>erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (leitura/ref.)<br>erp_scripts:sync_consumo_producao.py (leitura/ref.)<br>erp_scripts:match_massadas_setor.py (escrita)<br>erp_scripts:relatorio_massadas_supervisorio.py (leitura/ref.) | usinas.massadas |
| `tbl_produtos` | 6 | 32 kB | criado_em: 2026-04-10 00:24:01.11612+00 – 2026-09-04 10:27:14.877931+00 | erp_api:routers/produtos.py (escrita)<br>pede_api:routers/produtos.py (escrita) | usinas.produtos |
| `__EFMigrationsHistory` | 4 | 24 kB | – | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `ct_usuarios` | 11 | 120 kB | criado_em: 2026-06-11 00:20:09.994983+00 – 2026-10-06 10:03:21.99376+00 | erp_api:routers/auth.py (escrita)<br>pede_api:routers/auth.py (escrita) | IAM Unificado (vínculo/auditoria) |
| `ct_usuarios_auditoria` | 45 | 48 kB | criado_em: 2026-06-19 12:02:47.296268+00 – 2026-10-16 17:32:09.664645+00 | erp_api:routers/auth.py (escrita)<br>pede_api:routers/auth.py (escrita) | IAM Unificado (vínculo/auditoria) |
| `tbl_agregados` | 9 | 32 kB | criado_em: 2026-04-10 00:31:19.347836+00 – 2026-04-24 12:22:50.822273+00 | erp_api:routers/agregados.py (escrita)<br>pede_api:routers/agregados.py (escrita) | usinas.agregados |
| `tbl_config_traco_campo` | 11 | 48 kB | – | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/tracos.py (escrita)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/tracos.py (escrita) | usinas.config_traco_campo |
| `tbl_est_config_massada` | 15 | 80 kB | – | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (escrita)<br>erp_scripts:sync_consumo_producao.py (leitura/ref.)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/estoque.py (escrita) | usinas.est_config_massada |
| `tbl_est_custos_ajustes` | 3 | 48 kB | created_at: 2026-08-03 12:42:31.334369+00 – 2026-08-03 12:49:38.153456+00 | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/custos.py (escrita) | usinas.est_custos_ajustes |
| `tbl_est_materiais` | 18 | 72 kB | created_at: 2026-04-09 22:03:05.668564+00 – 2026-05-18 16:30:41.144293+00 | erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (escrita)<br>erp_api:routers/custos.py (leitura/ref.)<br>erp_api:routers/tracos.py (leitura/ref.)<br>erp_scripts:sync_consumo_producao.py (leitura/ref.)<br>pede_api:routers/relatorios.py (leitura/ref.) | usinas.est_materiais |
| `tbl_est_movimentos` | 1094 | 440 kB | data: 2020-08-06 – 2026-10-22 | erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (escrita)<br>erp_api:routers/custos.py (leitura/ref.)<br>erp_scripts:sync_consumo_producao.py (escrita)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/estoque.py (escrita) | usinas.est_movimentos |
| `tbl_est_movimentos_backup_unidades_20260601` | 245 | 48 kB | data: 2026-04-22 – 2026-06-01 | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_est_silos` | 3 | 24 kB | created_at: 2026-04-17 16:41:02.546559+00 – 2026-04-17 16:41:02.546559+00 | erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/estoque.py (leitura/ref.)<br>pede_api:routers/estoque.py (leitura/ref.) | usinas.est_silos |
| `tbl_leiturasetor` | 9855 | 1965 MB | datahora: 2026-02-17 08:22:39 – 2026-09-18 10:14:32 | erp_api:routers/pcp.py (leitura/ref.)<br>erp_scripts:match_massadas_setor.py (leitura/ref.)<br>erp_scripts:sync_gsheets_leiturasetor.py (escrita)<br>pede_api:routers/pcp.py (leitura/ref.) | usinas.leiturasetor |
| `tbl_nao_conformidades_apontadas` | 0 | 24 kB | data: — – — | erp_api:routers/relatorios.py (leitura/ref.)<br>dashboard:routes_usina.py (escrita) | usinas.nao_conformidades_apontadas |
| `tbl_paradas_apontadas` | 196 | 104 kB | data: 2026-08-25 – 2026-10-22 | erp_api:routers/relatorios.py (leitura/ref.)<br>dashboard:routes_usina.py (escrita) | usinas.paradas_apontadas |
| `tbl_pcpsetor` | 384 | 168 kB | data: 2026-02-23 – 2026-08-22 | erp_api:routers/pcp.py (escrita)<br>pede_api:routers/pcp.py (escrita)<br>dashboard:routes_usina.py (leitura/ref.) | usinas.pcpsetor |
| `tbl_qrcp` | 3 | 32 kB | created_at: 2026-02-23 00:51:43.680151 – 2026-07-24 10:24:43.87962 | erp_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/qrcp.py (escrita) | usinas.qrcp |
| `tbl_receitas` | 265 | 664 kB | created_at: 2026-02-22 19:34:13.459524 – 2026-10-22 17:03:03.554114 | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/tracos.py (escrita)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/tracos.py (escrita) | usinas.receitas |
| `tbl_tracos` | 4 | 64 kB | created_at: 2026-02-22 19:34:13.459524 – 2026-05-27 12:16:25.138811 | não identificado em código inspecionado | usinas.tracos |

### supervisorio_db_pede

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| `Empresas` | 0 | 16 kB | – | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_massadas` | 11 | 40 kB | data: 2026-06-18 – 2026-06-18 | erp_api:routers/massadas.py (leitura/ref.)<br>erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (leitura/ref.)<br>erp_scripts:sync_consumo_producao.py (leitura/ref.)<br>erp_scripts:match_massadas_setor.py (escrita)<br>erp_scripts:relatorio_massadas_supervisorio.py (leitura/ref.) | usinas.massadas |
| `tbl_produtos` | 4 | 32 kB | criado_em: 2026-04-10 00:24:01.11612+00 – 2026-04-10 00:24:01.11612+00 | erp_api:routers/produtos.py (escrita)<br>pede_api:routers/produtos.py (escrita) | usinas.produtos |
| `__EFMigrationsHistory` | 4 | 24 kB | – | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `ct_usuarios` | 3 | 80 kB | criado_em: 2026-06-11 00:20:09.994983+00 – 2026-06-18 15:49:29.323365+00 | erp_api:routers/auth.py (escrita)<br>pede_api:routers/auth.py (escrita) | IAM Unificado (vínculo/auditoria) |
| `ct_usuarios_auditoria` | 3 | 48 kB | criado_em: 2026-06-18 15:47:18.891003+00 – 2026-06-18 15:51:05.049232+00 | erp_api:routers/auth.py (escrita)<br>pede_api:routers/auth.py (escrita) | IAM Unificado (vínculo/auditoria) |
| `tbl_agregados` | 9 | 32 kB | criado_em: 2026-04-10 00:31:19.347836+00 – 2026-04-24 12:22:50.822273+00 | erp_api:routers/agregados.py (escrita)<br>pede_api:routers/agregados.py (escrita) | usinas.agregados |
| `tbl_config_traco_campo` | 11 | 48 kB | – | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/tracos.py (escrita)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/tracos.py (escrita) | usinas.config_traco_campo |
| `tbl_controle_estatistico` | 0 | 112 kB | created_at: — – — | pede_api:routers/controle_estatistico.py (escrita) | usinas.controle_estatistico |
| `tbl_est_config_massada` | 15 | 48 kB | – | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (escrita)<br>erp_scripts:sync_consumo_producao.py (leitura/ref.)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/estoque.py (escrita) | usinas.est_config_massada |
| `tbl_est_materiais` | 20 | 40 kB | created_at: 2026-04-09 22:03:05.668564+00 – 2026-06-17 13:41:15.556416+00 | erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (escrita)<br>erp_api:routers/custos.py (leitura/ref.)<br>erp_api:routers/tracos.py (leitura/ref.)<br>erp_scripts:sync_consumo_producao.py (leitura/ref.)<br>pede_api:routers/relatorios.py (leitura/ref.) | usinas.est_materiais |
| `tbl_est_movimentos` | 297 | 232 kB | data: 2026-04-22 – 2026-06-18 | erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/estoque.py (escrita)<br>erp_api:routers/custos.py (leitura/ref.)<br>erp_scripts:sync_consumo_producao.py (escrita)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/estoque.py (escrita) | usinas.est_movimentos |
| `tbl_est_movimentos_backup_unidades_20260601` | 245 | 48 kB | data: 2026-04-22 – 2026-06-01 | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_est_movimentos_backup_zero_20260618_125136` | 289 | 56 kB | data: 2026-04-22 – 2026-06-12 | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_est_saldo_backup_zero_20260618_125136` | 17 | 16 kB | backup_em: 2026-06-18 15:51:59.143179+00 – 2026-06-18 15:51:59.143179+00 | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_est_silos` | 3 | 24 kB | created_at: 2026-04-17 16:41:02.546559+00 – 2026-04-17 16:41:02.546559+00 | erp_api:routers/health.py (leitura/ref.)<br>erp_api:routers/estoque.py (leitura/ref.)<br>pede_api:routers/estoque.py (leitura/ref.) | usinas.est_silos |
| `tbl_leiturasetor` | 5778 | 8000 kB | datahora: 2026-02-17 08:22:39 – 2026-06-15 14:21:55 | erp_api:routers/pcp.py (leitura/ref.)<br>erp_scripts:match_massadas_setor.py (leitura/ref.)<br>erp_scripts:sync_gsheets_leiturasetor.py (escrita)<br>pede_api:routers/pcp.py (leitura/ref.) | usinas.leiturasetor |
| `tbl_pcpsetor` | 264 | 120 kB | data: 2026-02-23 – 2026-06-13 | erp_api:routers/pcp.py (escrita)<br>pede_api:routers/pcp.py (escrita)<br>dashboard:routes_usina.py (leitura/ref.) | usinas.pcpsetor |
| `tbl_qrcp` | 1 | 32 kB | created_at: 2026-02-23 00:51:43.680151 – 2026-02-23 00:51:43.680151 | erp_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/qrcp.py (escrita) | usinas.qrcp |
| `tbl_receitas` | 5 | 72 kB | created_at: 2026-06-17 10:21:25.464503 – 2026-06-18 10:50:45.953887 | erp_api:routers/relatorios.py (leitura/ref.)<br>erp_api:routers/tracos.py (escrita)<br>pede_api:routers/relatorios.py (leitura/ref.)<br>pede_api:routers/tracos.py (escrita) | usinas.receitas |
| `tbl_receitas_backup_limpeza_20260617_0703` | 20 | 16 kB | created_at: 2026-02-22 19:34:13.459524 – 2026-06-16 23:27:51.668685 | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |
| `tbl_tracos` | 0 | 64 kB | created_at: — – — | não identificado em código inspecionado | usinas.tracos |
| `tbl_tracos_backup_limpeza_20260617_0703` | 4 | 16 kB | created_at: 2026-02-22 19:34:13.459524 – 2026-05-27 12:16:25.138811 | não identificado em código inspecionado | arquivo histórico; sem tabela operacional nova |

### controle_est_concre_db

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| `estatistica_diaria` | 453 | 216 kB | data_referencia: 2026-01-05 – 2026-10-15 | cec:repositories/analytics_repository.js (leitura/ref.)<br>cec:services/analytics_service.js (escrita) | usinas.cec_estatistica_diaria |
| `estatistica_mensal` | 388 | 208 kB | updated_at: 2026-09-17 11:21:52.802615+00 – 2026-10-21 14:38:24.019351+00 | cec:repositories/analytics_repository.js (leitura/ref.)<br>cec:services/analytics_service.js (escrita) | usinas.cec_estatistica_mensal |
| `faixas_resistencia` | 4 | 40 kB | created_at: 2026-07-16 11:55:00.251342+00 – 2026-07-16 11:55:00.251342+00 | cec:services/analytics_service.js (leitura/ref.) | usinas.cec_faixas_resistencia |
| `fila_recalculo` | 3268730 | 740 MB | created_at: 2026-07-16 11:55:12.001865+00 – 2026-10-21 14:38:23.864724+00 | cec:repositories/rompimentos_repository.js (escrita)<br>cec:services/analytics_service.js (escrita)<br>cec:jobs/backfill.js (escrita) | usinas.cec_fila_recalculo |
| `rompimentos` | 868 | 3176 kB | created_at: 2026-03-29 01:40:15.110857+00 – 2026-10-21 14:38:23.864724+00 | erp_api:routers/qrcp.py (leitura/ref.)<br>cec:repositories/rompimentos_repository.js (escrita)<br>cec:services/analytics_service.js (leitura/ref.)<br>cec:api/controle_estatistico_v2.js (leitura/ref.)<br>cec:api/controle_estatistico.js (leitura/ref.)<br>cec:api/legacy.js (leitura/ref.)<br>cec:core/config.js (leitura/ref.) | usinas.cec_rompimentos |
| `rompimentos_atuais` | 834 | 4696 kB | created_at: 2026-03-29 01:40:15.110857+00 – 2026-10-21 14:37:43.216501+00 | cec:repositories/rompimentos_repository.js (escrita)<br>cec:services/analytics_service.js (leitura/ref.)<br>cec:jobs/backfill.js (escrita) | usinas.cec_rompimentos_atuais |
| `rompimentos_eventos` | 6431676 | 6842 MB | created_at: 2026-03-29 01:40:15.110857+00 – 2026-10-21 14:38:23.864724+00 | cec:repositories/rompimentos_repository.js (escrita)<br>cec:jobs/backfill.js (escrita) | usinas.cec_rompimentos_eventos |
| `rompimentos_grupos` | 461 | 256 kB | data_moldagem: 2026-01-05 – 2026-10-15 | erp_api:routers/tracos.py (leitura/ref.)<br>cec:repositories/analytics_repository.js (leitura/ref.)<br>cec:services/analytics_service.js (escrita) | usinas.cec_rompimentos_grupos |

### pcp_concrefer

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| `apontamentos_mega` | 2 | 136 kB | data: 2026-05-26 – 2026-05-26 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `atividades_mao_de_obra` | 16 | 120 kB | created_at: 2026-04-12 00:33:52.792335 – 2026-04-12 00:33:52.792335 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `etiquetas_armaduras_modelos` | 98 | 120 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `formas` | 16 | 40 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `maodeobra` | 37 | 72 kB | data: 2026-04-27 – 2026-06-09 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `maodeobra_rateio` | 0 | 32 kB | created_at: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `mapeamento_forma_acessorios` | 8 | 104 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `mapeamento_forma_postes` | 1700 | 592 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `mapeamento_formas` | 355 | 272 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `producoes` | 0 | 24 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `produtos` | 277 | 80 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `programacoes` | 5534 | 880 kB | data: 2026-04-11 – 2026-10-07 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `programacoes_alex` | 17629 | 3896 kB | data: 2026-05-26 – 2026-10-07 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `programacoes_circular_s3` | 250 | 176 kB | data: 2026-10-01 – 2026-10-09 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `programacoes_circular_s4` | 0 | 32 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `saques_mandril` | 242 | 160 kB | data: 2026-10-01 – 2026-10-13 | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `setores` | 4 | 56 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `teste_programacoes` | 0 | 32 kB | data_criacao: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `usuarios` | 15 | 80 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |

### pcpconcrefer_db

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| `formas` | 10 | 40 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `mao_de_obra` | 0 | 24 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `producoes` | 0 | 24 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `produtos` | 24 | 56 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `programacoes` | 0 | 24 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `setores` | 4 | 56 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `usuarios` | 4 | 64 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |

### pcp_armaduras

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| `armaduras` | 0 | 32 kB | created_at: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `estoques` | 0 | 24 kB | updated_at: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `inspecoes` | 0 | 24 kB | data_inspecao: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `movimentacoes_estoque` | 0 | 24 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `producoes` | 0 | 32 kB | data: — – — | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |
| `usuarios` | 4 | 56 kB | – | não identificado em código inspecionado | PCP existente; referência, sem duplicação em Usinas |

### concrefer_db

| Tabela | Linhas | Volume | Coluna temporal / primeira–última | Leitores/escritores identificados | Destino proposto |
|---|---:|---:|---|---|---|
| – | – | – | – | – | sem objetos |

## Diferenças Campinas – Pederneiras

- Os 18 nomes de tabelas comuns têm o mesmo conjunto de colunas neste dump, mas dados e regras operacionais são distintos.
- Só Campinas tem `tbl_est_custos_ajustes`, `tbl_paradas_apontadas`, `tbl_nao_conformidades_apontadas`. Só Pederneiras tem `tbl_controle_estatistico` (vazia) e quatro tabelas históricas de backup.
- `tbl_massadas`: 10.797 linhas em Campinas e 11 em Pederneiras; isso indica fontes ou retenção distintas, e impede somar as duas unidades sem examinar competência/ingestão.
- A composição de agregados de Pederneiras/Noroeste deve ser uma regra versionada por `unidade_id`, com posições físicas e categorias de material explícitas. Não presumir que índices `agregado1...7` tenham o mesmo significado em todas as plantas. A interface hoje usa rótulos iguais em ambos os HTML; validar configuração real com operação antes da carga.
- O alvo deve manter `origem_banco`, `origem_id`, `unidade_id` e a configuração do misturador vigente na data da massada. Não apagar colunas brutas do CLP nem sobrescrever regras locais por um agregado genérico.

## Mapeamento coluna a coluna para a camada fiel

Na carga do **espelho**, cada coluna operacional é copiada com nome e tipo equivalentes (sem transformação numérica). A chave no espelho é `(unidade_id, origem_banco, origem_id)` para evitar colisão de IDs entre Campinas e Pederneiras. Campos novos comuns: `unidade_id`, `origem_banco`, `origem_id`, `ingested_at`, `source_hash`. O Unificado não recebe DML nessas tabelas. `ct_usuarios` são vinculados ao IAM, sem transportar hash de senha como credencial ativa. Backups e históricos de migração permanecem nos dumps de evidência.

### Colunas de supervisorio_db

| Origem tabela.coluna | Tipo legado / restrição | Coluna alvo | Tratamento |
|---|---|---|---|
| `supervisorio_db.public.Empresas.Id` | `integer NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.Empresas.Name` | `"text" NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.Empresas.Email` | `"text" NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.Empresas.Senha` | `"text" NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_massadas.id` | `integer NOT NULL` | `usinas.massadas.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.produto` | `"text" NOT NULL` | `usinas.massadas.produto` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.formula` | `"text" NOT NULL` | `usinas.massadas.formula` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.qtd` | `numeric NOT NULL` | `usinas.massadas.qtd` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.data` | `"date"` | `usinas.massadas.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.hora` | `time without time zone` | `usinas.massadas.hora` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.data_hora` | `timestamp without time zone` | `usinas.massadas.data_hora` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.hora_inicio` | `time without time zone` | `usinas.massadas.hora_inicio` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.hora_final` | `time without time zone` | `usinas.massadas.hora_final` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.hora_descarga` | `time without time zone` | `usinas.massadas.hora_descarga` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.misturador` | `"text"` | `usinas.massadas.misturador` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.numero_serie` | `numeric` | `usinas.massadas.numero_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.temperatura` | `double precision` | `usinas.massadas.temperatura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado1` | `numeric` | `usinas.massadas.real_agregado1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado2` | `numeric` | `usinas.massadas.real_agregado2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado3` | `numeric` | `usinas.massadas.real_agregado3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado4` | `numeric` | `usinas.massadas.real_agregado4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado5` | `numeric` | `usinas.massadas.real_agregado5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado6` | `numeric` | `usinas.massadas.real_agregado6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agregado7` | `numeric` | `usinas.massadas.real_agregado7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado1` | `numeric` | `usinas.massadas.prog_agregado1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado2` | `numeric` | `usinas.massadas.prog_agregado2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado3` | `numeric` | `usinas.massadas.prog_agregado3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado4` | `numeric` | `usinas.massadas.prog_agregado4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado5` | `numeric` | `usinas.massadas.prog_agregado5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado6` | `numeric` | `usinas.massadas.prog_agregado6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agregado7` | `numeric` | `usinas.massadas.prog_agregado7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur1` | `numeric` | `usinas.massadas.ur1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur2` | `numeric` | `usinas.massadas.ur2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur3` | `numeric` | `usinas.massadas.ur3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur4` | `numeric` | `usinas.massadas.ur4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur5` | `numeric` | `usinas.massadas.ur5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur6` | `numeric` | `usinas.massadas.ur6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ur7` | `numeric` | `usinas.massadas.ur7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_silo1` | `numeric` | `usinas.massadas.real_silo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_silo2` | `numeric` | `usinas.massadas.real_silo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_silo3` | `numeric` | `usinas.massadas.real_silo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_silo4` | `numeric` | `usinas.massadas.real_silo4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_silo1` | `numeric` | `usinas.massadas.prog_silo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_silo2` | `numeric` | `usinas.massadas.prog_silo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_silo3` | `numeric` | `usinas.massadas.prog_silo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_silo4` | `numeric` | `usinas.massadas.prog_silo4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_agua1` | `numeric` | `usinas.massadas.real_agua1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_agua1` | `numeric` | `usinas.massadas.prog_agua1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_aditivo1` | `numeric` | `usinas.massadas.real_aditivo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_aditivo2` | `numeric` | `usinas.massadas.real_aditivo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.real_aditivo3` | `numeric` | `usinas.massadas.real_aditivo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_aditivo1` | `numeric` | `usinas.massadas.prog_aditivo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_aditivo2` | `numeric` | `usinas.massadas.prog_aditivo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.prog_aditivo3` | `numeric` | `usinas.massadas.prog_aditivo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.corte` | `numeric` | `usinas.massadas.corte` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ac` | `double precision` | `usinas.massadas.ac` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.carregado` | `integer` | `usinas.massadas.carregado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.alterado` | `integer` | `usinas.massadas.alterado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.setor` | `"text"` | `usinas.massadas.setor` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.setor_atualizado_em` | `timestamp without time zone` | `usinas.massadas.setor_atualizado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.ativa` | `boolean DEFAULT true NOT NULL` | `usinas.massadas.ativa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_massadas.redosa` | `integer DEFAULT 0 NOT NULL` | `usinas.massadas.redosa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.id` | `integer NOT NULL` | `usinas.produtos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.nome` | `"text" NOT NULL` | `usinas.produtos.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.codigo` | `"text"` | `usinas.produtos.codigo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.descricao` | `"text"` | `usinas.produtos.descricao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.produtos.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.produtos.criado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_produtos.alterado` | `integer DEFAULT 0 NOT NULL` | `usinas.produtos.alterado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.__EFMigrationsHistory.MigrationId` | `character varying(150) NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.__EFMigrationsHistory.ProductVersion` | `character varying(32) NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.ct_usuarios.id` | `bigint NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.nome_completo` | `character varying(160) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.email` | `character varying(180) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.usuario` | `character varying(60) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.senha_hash` | `"text" NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.nivel_acesso` | `character varying(30) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.ativo` | `boolean DEFAULT true NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.tentativas_invalidas` | `integer DEFAULT 0 NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.bloqueado_ate` | `timestamp with time zone` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.ultimo_login` | `timestamp with time zone` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.atualizado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.criado_por` | `character varying(60)` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.senha_deve_trocar` | `boolean DEFAULT false NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.senha_alterada_em` | `timestamp with time zone` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios.senha_definida_por` | `character varying(60)` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios_auditoria.id` | `bigint NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios_auditoria.usuario_id` | `bigint` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios_auditoria.ator` | `character varying(80)` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios_auditoria.acao` | `character varying(80) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios_auditoria.detalhes` | `"jsonb" DEFAULT '{}'::"jsonb" NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.ct_usuarios_auditoria.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db.public.tbl_agregados.id` | `integer NOT NULL` | `usinas.agregados.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_agregados.nome` | `"text" NOT NULL` | `usinas.agregados.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_agregados.tipo` | `"text" DEFAULT 'outro'::"text" NOT NULL` | `usinas.agregados.tipo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_agregados.unidade` | `"text" DEFAULT 'kg'::"text" NOT NULL` | `usinas.agregados.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_agregados.descricao` | `"text"` | `usinas.agregados.descricao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_agregados.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.agregados.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_agregados.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.agregados.criado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_config_traco_campo.id` | `integer NOT NULL` | `usinas.config_traco_campo.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_config_traco_campo.coluna` | `"text" NOT NULL` | `usinas.config_traco_campo.coluna` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_config_traco_campo.label` | `"text" NOT NULL` | `usinas.config_traco_campo.label` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_config_traco_campo.material_id` | `integer` | `usinas.config_traco_campo.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_config_traco_campo.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.config_traco_campo.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_config_traco_campo.ordem` | `integer DEFAULT 0 NOT NULL` | `usinas.config_traco_campo.ordem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.id` | `integer NOT NULL` | `usinas.est_config_massada.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.coluna` | `"text" NOT NULL` | `usinas.est_config_massada.coluna` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.label` | `"text" NOT NULL` | `usinas.est_config_massada.label` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.material_id` | `integer` | `usinas.est_config_massada.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.est_config_massada.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.ordem` | `integer DEFAULT 0 NOT NULL` | `usinas.est_config_massada.ordem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_config_massada.fator_conversao` | `numeric DEFAULT 1.0 NOT NULL` | `usinas.est_config_massada.fator_conversao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.id` | `bigint NOT NULL` | `usinas.est_custos_ajustes.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.material_id` | `integer NOT NULL` | `usinas.est_custos_ajustes.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.valor_unitario` | `numeric(14,6) NOT NULL` | `usinas.est_custos_ajustes.valor_unitario` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.vigencia` | `"date" DEFAULT CURRENT_DATE NOT NULL` | `usinas.est_custos_ajustes.vigencia` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.motivo` | `"text" NOT NULL` | `usinas.est_custos_ajustes.motivo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.responsavel` | `character varying(100)` | `usinas.est_custos_ajustes.responsavel` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_custos_ajustes.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_custos_ajustes.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.id` | `integer NOT NULL` | `usinas.est_materiais.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.codigo` | `character varying(50) NOT NULL` | `usinas.est_materiais.codigo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.nome` | `character varying(200) NOT NULL` | `usinas.est_materiais.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.categoria` | `character varying(50) DEFAULT 'outro'::character varying NOT NULL` | `usinas.est_materiais.categoria` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.unidade` | `character varying(20) DEFAULT 'kg'::character varying NOT NULL` | `usinas.est_materiais.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.saldo_inicial` | `numeric(16,3) DEFAULT 0 NOT NULL` | `usinas.est_materiais.saldo_inicial` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.est_materiais.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_materiais.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_materiais.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.id` | `integer NOT NULL` | `usinas.est_movimentos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.material_id` | `integer NOT NULL` | `usinas.est_movimentos.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.tipo` | `character varying(20) NOT NULL` | `usinas.est_movimentos.tipo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.data` | `"date" DEFAULT CURRENT_DATE NOT NULL` | `usinas.est_movimentos.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.quantidade` | `numeric(16,3) NOT NULL` | `usinas.est_movimentos.quantidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.nota_fiscal` | `character varying(100)` | `usinas.est_movimentos.nota_fiscal` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.fornecedor` | `character varying(200)` | `usinas.est_movimentos.fornecedor` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.observacao` | `"text"` | `usinas.est_movimentos.observacao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.responsavel` | `character varying(100)` | `usinas.est_movimentos.responsavel` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.origem` | `character varying(50) DEFAULT 'manual'::character varying NOT NULL` | `usinas.est_movimentos.origem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.referencia_id` | `integer` | `usinas.est_movimentos.referencia_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_movimentos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.unidade` | `character varying(20)` | `usinas.est_movimentos.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.silo_id` | `integer` | `usinas.est_movimentos.silo_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.valor_nota` | `numeric(12,4)` | `usinas.est_movimentos.valor_nota` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.icms_perc` | `numeric(5,2)` | `usinas.est_movimentos.icms_perc` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.valor_frete` | `numeric(12,4)` | `usinas.est_movimentos.valor_frete` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.icms_frete` | `numeric(12,4)` | `usinas.est_movimentos.icms_frete` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos.valor_unitario_liquido` | `numeric(12,4)` | `usinas.est_movimentos.valor_unitario_liquido` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.material_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.tipo` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.data` | `"date"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.quantidade` | `numeric(16,3)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.nota_fiscal` | `character varying(100)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.fornecedor` | `character varying(200)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.observacao` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.responsavel` | `character varying(100)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.origem` | `character varying(50)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.referencia_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.created_at` | `timestamp with time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.unidade` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.silo_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.valor_nota` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.icms_perc` | `numeric(5,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.valor_frete` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.icms_frete` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_movimentos_backup_unidades_20260601.valor_unitario_liquido` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db.public.tbl_est_silos.id` | `integer NOT NULL` | `usinas.est_silos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_silos.nome` | `character varying(100) NOT NULL` | `usinas.est_silos.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_silos.capacidade_nominal` | `numeric(10,2) NOT NULL` | `usinas.est_silos.capacidade_nominal` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_silos.capacidade_operacional` | `numeric(10,2) NOT NULL` | `usinas.est_silos.capacidade_operacional` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_silos.unidade` | `character varying(20) DEFAULT 'ton'::character varying NOT NULL` | `usinas.est_silos.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_silos.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.est_silos.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_est_silos.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_silos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.id` | `integer NOT NULL` | `usinas.leiturasetor.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.datahora` | `timestamp without time zone NOT NULL` | `usinas.leiturasetor.datahora` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.id_leitura` | `integer NOT NULL` | `usinas.leiturasetor.id_leitura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.qr_raw` | `character varying(100)` | `usinas.leiturasetor.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.volume` | `numeric(10,2)` | `usinas.leiturasetor.volume` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.n_serie` | `character varying(100)` | `usinas.leiturasetor.n_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.leiturasetor.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_leiturasetor.uid` | `character varying(30) NOT NULL` | `usinas.leiturasetor.uid` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.id` | `integer NOT NULL` | `usinas.nao_conformidades_apontadas.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.data` | `"date" NOT NULL` | `usinas.nao_conformidades_apontadas.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.hora_apontamento` | `time without time zone DEFAULT CURRENT_TIME NOT NULL` | `usinas.nao_conformidades_apontadas.hora_apontamento` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.turno` | `"text"` | `usinas.nao_conformidades_apontadas.turno` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.tipo` | `"text" NOT NULL` | `usinas.nao_conformidades_apontadas.tipo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.descricao` | `"text" NOT NULL` | `usinas.nao_conformidades_apontadas.descricao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.acao_tomada` | `"text"` | `usinas.nao_conformidades_apontadas.acao_tomada` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_nao_conformidades_apontadas.criado_em` | `timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL` | `usinas.nao_conformidades_apontadas.criado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.id` | `integer NOT NULL` | `usinas.paradas_apontadas.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.data` | `"date" NOT NULL` | `usinas.paradas_apontadas.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.hora_apontamento` | `time without time zone DEFAULT CURRENT_TIME NOT NULL` | `usinas.paradas_apontadas.hora_apontamento` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.turno` | `"text"` | `usinas.paradas_apontadas.turno` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.hora_inicio` | `time without time zone` | `usinas.paradas_apontadas.hora_inicio` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.hora_fim` | `time without time zone` | `usinas.paradas_apontadas.hora_fim` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.minutos` | `numeric NOT NULL` | `usinas.paradas_apontadas.minutos` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.motivo` | `"text" NOT NULL` | `usinas.paradas_apontadas.motivo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.m3_perdido` | `numeric DEFAULT 0 NOT NULL` | `usinas.paradas_apontadas.m3_perdido` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_paradas_apontadas.criado_em` | `timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL` | `usinas.paradas_apontadas.criado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.id` | `integer NOT NULL` | `usinas.pcpsetor.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.data` | `"date" NOT NULL` | `usinas.pcpsetor.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.dia_semana` | `character varying(20) NOT NULL` | `usinas.pcpsetor.dia_semana` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.setor` | `character varying(20) NOT NULL` | `usinas.pcpsetor.setor` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.volume` | `numeric(10,2) DEFAULT 0` | `usinas.pcpsetor.volume` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.status` | `character(1) DEFAULT 'A'::"bpchar"` | `usinas.pcpsetor.status` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.pcpsetor.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_pcpsetor.updated_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.pcpsetor.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.id` | `character varying(36) DEFAULT ("gen_random_uuid"())::"text" NOT NULL` | `usinas.qrcp.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.traco` | `character varying(200)` | `usinas.qrcp.traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.numero_serie` | `character varying(50)` | `usinas.qrcp.numero_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.nome` | `character varying(200)` | `usinas.qrcp.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.cp` | `character varying(10)` | `usinas.qrcp.cp` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.idade` | `integer` | `usinas.qrcp.idade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.data_moldagem` | `"date"` | `usinas.qrcp.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.hora_moldagem` | `character varying(10)` | `usinas.qrcp.hora_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.data_ruptura` | `"date"` | `usinas.qrcp.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.qr_raw` | `"text"` | `usinas.qrcp.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.qrcp.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_qrcp.resistencia_mpa` | `numeric(10,2)` | `usinas.qrcp.resistencia_mpa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.id` | `bigint NOT NULL` | `usinas.receitas.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.nome` | `"text" NOT NULL` | `usinas.receitas.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado1` | `numeric` | `usinas.receitas.agregado1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado2` | `numeric` | `usinas.receitas.agregado2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado3` | `numeric` | `usinas.receitas.agregado3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado4` | `numeric` | `usinas.receitas.agregado4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado5` | `numeric` | `usinas.receitas.agregado5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado6` | `numeric` | `usinas.receitas.agregado6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agregado7` | `numeric` | `usinas.receitas.agregado7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.cimento1` | `numeric` | `usinas.receitas.cimento1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.cimento2` | `numeric` | `usinas.receitas.cimento2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.cimento3` | `numeric` | `usinas.receitas.cimento3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.cimento4` | `numeric` | `usinas.receitas.cimento4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.agua` | `numeric` | `usinas.receitas.agua` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.aditivo1` | `numeric` | `usinas.receitas.aditivo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.aditivo2` | `numeric` | `usinas.receitas.aditivo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.aditivo3` | `numeric` | `usinas.receitas.aditivo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.ativa` | `boolean DEFAULT true NOT NULL` | `usinas.receitas.ativa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.alterado` | `integer DEFAULT 1 NOT NULL` | `usinas.receitas.alterado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.nome_traco` | `character varying NOT NULL` | `usinas.receitas.nome_traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.cimento` | `numeric` | `usinas.receitas.cimento` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.adicao_1` | `numeric` | `usinas.receitas.adicao_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.adicao_2` | `numeric` | `usinas.receitas.adicao_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.areia_1` | `numeric` | `usinas.receitas.areia_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.areia_2` | `numeric` | `usinas.receitas.areia_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.areia_3` | `numeric` | `usinas.receitas.areia_3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.brita_1` | `numeric` | `usinas.receitas.brita_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.brita_2` | `numeric` | `usinas.receitas.brita_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.aditivo_1` | `numeric` | `usinas.receitas.aditivo_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.aditivo_2` | `numeric` | `usinas.receitas.aditivo_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.ac` | `numeric` | `usinas.receitas.ac` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.r24h` | `numeric` | `usinas.receitas.r24h` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.r3` | `numeric` | `usinas.receitas.r3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.r7` | `numeric` | `usinas.receitas.r7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.r28` | `numeric` | `usinas.receitas.r28` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.receitas.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.revisao_grupo` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.receitas.revisao_grupo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.revisao_numero` | `integer DEFAULT 1 NOT NULL` | `usinas.receitas.revisao_numero` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.revisao_origem_id` | `bigint` | `usinas.receitas.revisao_origem_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.observacao_revisao` | `"text"` | `usinas.receitas.observacao_revisao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.revisado_em` | `timestamp without time zone` | `usinas.receitas.revisado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_receitas.alterado_por` | `"text"` | `usinas.receitas.alterado_por` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.id` | `integer NOT NULL` | `usinas.tracos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.nome_traco` | `character varying(200) NOT NULL` | `usinas.tracos.nome_traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.cimento` | `numeric(10,2)` | `usinas.tracos.cimento` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.adicao_1` | `numeric(10,2)` | `usinas.tracos.adicao_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.adicao_2` | `numeric(10,2)` | `usinas.tracos.adicao_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.areia_1` | `numeric(10,2)` | `usinas.tracos.areia_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.areia_2` | `numeric(10,2)` | `usinas.tracos.areia_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.areia_3` | `numeric(10,2)` | `usinas.tracos.areia_3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.brita_1` | `numeric(10,2)` | `usinas.tracos.brita_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.brita_2` | `numeric(10,2)` | `usinas.tracos.brita_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.aditivo_1` | `numeric(10,2)` | `usinas.tracos.aditivo_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.aditivo_2` | `numeric(10,2)` | `usinas.tracos.aditivo_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.agua` | `numeric(10,2)` | `usinas.tracos.agua` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.ac` | `numeric(10,4)` | `usinas.tracos.ac` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.r24h` | `numeric(10,2)` | `usinas.tracos.r24h` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.r3` | `numeric(10,2)` | `usinas.tracos.r3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.r7` | `numeric(10,2)` | `usinas.tracos.r7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.r28` | `numeric(10,2)` | `usinas.tracos.r28` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.tracos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.ativa` | `boolean DEFAULT true` | `usinas.tracos.ativa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.revisao_grupo` | `"uuid" NOT NULL` | `usinas.tracos.revisao_grupo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.revisao_numero` | `integer DEFAULT 1 NOT NULL` | `usinas.tracos.revisao_numero` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.revisao_origem_id` | `integer` | `usinas.tracos.revisao_origem_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.observacao_revisao` | `"text"` | `usinas.tracos.observacao_revisao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.revisado_em` | `timestamp without time zone` | `usinas.tracos.revisado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db.public.tbl_tracos.alterado_por` | `"text"` | `usinas.tracos.alterado_por` | cópia fiel; incluir chave de origem/unidade |

### Colunas de supervisorio_db_pede

| Origem tabela.coluna | Tipo legado / restrição | Coluna alvo | Tratamento |
|---|---|---|---|
| `supervisorio_db_pede.public.Empresas.Id` | `integer NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.Empresas.Name` | `"text" NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.Empresas.Email` | `"text" NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.Empresas.Senha` | `"text" NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_massadas.id` | `integer NOT NULL` | `usinas.massadas.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.produto` | `"text" NOT NULL` | `usinas.massadas.produto` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.formula` | `"text" NOT NULL` | `usinas.massadas.formula` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.qtd` | `numeric NOT NULL` | `usinas.massadas.qtd` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.data` | `"date"` | `usinas.massadas.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.hora` | `time without time zone` | `usinas.massadas.hora` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.data_hora` | `timestamp without time zone` | `usinas.massadas.data_hora` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.hora_inicio` | `time without time zone` | `usinas.massadas.hora_inicio` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.hora_final` | `time without time zone` | `usinas.massadas.hora_final` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.hora_descarga` | `time without time zone` | `usinas.massadas.hora_descarga` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.misturador` | `"text"` | `usinas.massadas.misturador` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.numero_serie` | `numeric` | `usinas.massadas.numero_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.temperatura` | `double precision` | `usinas.massadas.temperatura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado1` | `numeric` | `usinas.massadas.real_agregado1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado2` | `numeric` | `usinas.massadas.real_agregado2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado3` | `numeric` | `usinas.massadas.real_agregado3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado4` | `numeric` | `usinas.massadas.real_agregado4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado5` | `numeric` | `usinas.massadas.real_agregado5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado6` | `numeric` | `usinas.massadas.real_agregado6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agregado7` | `numeric` | `usinas.massadas.real_agregado7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado1` | `numeric` | `usinas.massadas.prog_agregado1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado2` | `numeric` | `usinas.massadas.prog_agregado2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado3` | `numeric` | `usinas.massadas.prog_agregado3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado4` | `numeric` | `usinas.massadas.prog_agregado4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado5` | `numeric` | `usinas.massadas.prog_agregado5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado6` | `numeric` | `usinas.massadas.prog_agregado6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agregado7` | `numeric` | `usinas.massadas.prog_agregado7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur1` | `numeric` | `usinas.massadas.ur1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur2` | `numeric` | `usinas.massadas.ur2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur3` | `numeric` | `usinas.massadas.ur3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur4` | `numeric` | `usinas.massadas.ur4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur5` | `numeric` | `usinas.massadas.ur5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur6` | `numeric` | `usinas.massadas.ur6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ur7` | `numeric` | `usinas.massadas.ur7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_silo1` | `numeric` | `usinas.massadas.real_silo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_silo2` | `numeric` | `usinas.massadas.real_silo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_silo3` | `numeric` | `usinas.massadas.real_silo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_silo4` | `numeric` | `usinas.massadas.real_silo4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_silo1` | `numeric` | `usinas.massadas.prog_silo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_silo2` | `numeric` | `usinas.massadas.prog_silo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_silo3` | `numeric` | `usinas.massadas.prog_silo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_silo4` | `numeric` | `usinas.massadas.prog_silo4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_agua1` | `numeric` | `usinas.massadas.real_agua1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_agua1` | `numeric` | `usinas.massadas.prog_agua1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_aditivo1` | `numeric` | `usinas.massadas.real_aditivo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_aditivo2` | `numeric` | `usinas.massadas.real_aditivo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.real_aditivo3` | `numeric` | `usinas.massadas.real_aditivo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_aditivo1` | `numeric` | `usinas.massadas.prog_aditivo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_aditivo2` | `numeric` | `usinas.massadas.prog_aditivo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.prog_aditivo3` | `numeric` | `usinas.massadas.prog_aditivo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.corte` | `numeric` | `usinas.massadas.corte` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ac` | `double precision` | `usinas.massadas.ac` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.carregado` | `integer` | `usinas.massadas.carregado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.alterado` | `integer` | `usinas.massadas.alterado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.setor` | `"text"` | `usinas.massadas.setor` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.setor_atualizado_em` | `timestamp without time zone` | `usinas.massadas.setor_atualizado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.ativa` | `boolean DEFAULT true NOT NULL` | `usinas.massadas.ativa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_massadas.redosa` | `integer DEFAULT 0 NOT NULL` | `usinas.massadas.redosa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.id` | `integer NOT NULL` | `usinas.produtos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.nome` | `"text" NOT NULL` | `usinas.produtos.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.codigo` | `"text"` | `usinas.produtos.codigo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.descricao` | `"text"` | `usinas.produtos.descricao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.produtos.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.produtos.criado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_produtos.alterado` | `integer DEFAULT 0 NOT NULL` | `usinas.produtos.alterado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.__EFMigrationsHistory.MigrationId` | `character varying(150) NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.__EFMigrationsHistory.ProductVersion` | `character varying(32) NOT NULL` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.ct_usuarios.id` | `bigint NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.nome_completo` | `character varying(160) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.email` | `character varying(180) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.usuario` | `character varying(60) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.senha_hash` | `"text" NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.nivel_acesso` | `character varying(30) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.ativo` | `boolean DEFAULT true NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.tentativas_invalidas` | `integer DEFAULT 0 NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.bloqueado_ate` | `timestamp with time zone` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.ultimo_login` | `timestamp with time zone` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.atualizado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.criado_por` | `character varying(60)` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.senha_deve_trocar` | `boolean DEFAULT false NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.senha_alterada_em` | `timestamp with time zone` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios.senha_definida_por` | `character varying(60)` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios_auditoria.id` | `bigint NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios_auditoria.usuario_id` | `bigint` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios_auditoria.ator` | `character varying(80)` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios_auditoria.acao` | `character varying(80) NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios_auditoria.detalhes` | `"jsonb" DEFAULT '{}'::"jsonb" NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.ct_usuarios_auditoria.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `iam.identity_link`/auditoria | vincular pelo identificador estável; hash e segredo não viram login novo |
| `supervisorio_db_pede.public.tbl_agregados.id` | `integer NOT NULL` | `usinas.agregados.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_agregados.nome` | `"text" NOT NULL` | `usinas.agregados.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_agregados.tipo` | `"text" DEFAULT 'outro'::"text" NOT NULL` | `usinas.agregados.tipo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_agregados.unidade` | `"text" DEFAULT 'kg'::"text" NOT NULL` | `usinas.agregados.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_agregados.descricao` | `"text"` | `usinas.agregados.descricao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_agregados.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.agregados.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_agregados.criado_em` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.agregados.criado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_config_traco_campo.id` | `integer NOT NULL` | `usinas.config_traco_campo.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_config_traco_campo.coluna` | `"text" NOT NULL` | `usinas.config_traco_campo.coluna` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_config_traco_campo.label` | `"text" NOT NULL` | `usinas.config_traco_campo.label` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_config_traco_campo.material_id` | `integer` | `usinas.config_traco_campo.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_config_traco_campo.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.config_traco_campo.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_config_traco_campo.ordem` | `integer DEFAULT 0 NOT NULL` | `usinas.config_traco_campo.ordem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.id` | `character varying(36) DEFAULT ("gen_random_uuid"())::"text" NOT NULL` | `usinas.controle_estatistico.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.unidade` | `character varying(80) DEFAULT 'Pederneiras'::character varying NOT NULL` | `usinas.controle_estatistico.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.operador` | `character varying(120) NOT NULL` | `usinas.controle_estatistico.operador` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.resistencia_mpa` | `numeric(10,2) NOT NULL` | `usinas.controle_estatistico.resistencia_mpa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.traco` | `character varying(200)` | `usinas.controle_estatistico.traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.numero_serie` | `character varying(50)` | `usinas.controle_estatistico.numero_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.nome` | `character varying(200)` | `usinas.controle_estatistico.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.cp` | `character varying(20)` | `usinas.controle_estatistico.cp` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.idade` | `integer` | `usinas.controle_estatistico.idade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.data_moldagem` | `"date"` | `usinas.controle_estatistico.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.hora_moldagem` | `character varying(10)` | `usinas.controle_estatistico.hora_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.data_ruptura` | `"date"` | `usinas.controle_estatistico.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.qr_raw` | `"text" NOT NULL` | `usinas.controle_estatistico.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.created_at` | `timestamp without time zone DEFAULT "now"() NOT NULL` | `usinas.controle_estatistico.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_controle_estatistico.local_id` | `character varying(80)` | `usinas.controle_estatistico.local_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.id` | `integer NOT NULL` | `usinas.est_config_massada.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.coluna` | `"text" NOT NULL` | `usinas.est_config_massada.coluna` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.label` | `"text" NOT NULL` | `usinas.est_config_massada.label` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.material_id` | `integer` | `usinas.est_config_massada.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.est_config_massada.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.ordem` | `integer DEFAULT 0 NOT NULL` | `usinas.est_config_massada.ordem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_config_massada.fator_conversao` | `numeric DEFAULT 1.0 NOT NULL` | `usinas.est_config_massada.fator_conversao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.id` | `integer NOT NULL` | `usinas.est_materiais.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.codigo` | `character varying(50) NOT NULL` | `usinas.est_materiais.codigo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.nome` | `character varying(200) NOT NULL` | `usinas.est_materiais.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.categoria` | `character varying(50) DEFAULT 'outro'::character varying NOT NULL` | `usinas.est_materiais.categoria` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.unidade` | `character varying(20) DEFAULT 'kg'::character varying NOT NULL` | `usinas.est_materiais.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.saldo_inicial` | `numeric(16,3) DEFAULT 0 NOT NULL` | `usinas.est_materiais.saldo_inicial` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.est_materiais.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_materiais.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_materiais.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.id` | `integer NOT NULL` | `usinas.est_movimentos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.material_id` | `integer NOT NULL` | `usinas.est_movimentos.material_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.tipo` | `character varying(20) NOT NULL` | `usinas.est_movimentos.tipo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.data` | `"date" DEFAULT CURRENT_DATE NOT NULL` | `usinas.est_movimentos.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.quantidade` | `numeric(16,3) NOT NULL` | `usinas.est_movimentos.quantidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.nota_fiscal` | `character varying(100)` | `usinas.est_movimentos.nota_fiscal` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.fornecedor` | `character varying(200)` | `usinas.est_movimentos.fornecedor` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.observacao` | `"text"` | `usinas.est_movimentos.observacao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.responsavel` | `character varying(100)` | `usinas.est_movimentos.responsavel` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.origem` | `character varying(50) DEFAULT 'manual'::character varying NOT NULL` | `usinas.est_movimentos.origem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.referencia_id` | `integer` | `usinas.est_movimentos.referencia_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_movimentos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.unidade` | `character varying(20)` | `usinas.est_movimentos.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.silo_id` | `integer` | `usinas.est_movimentos.silo_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.valor_nota` | `numeric(12,4)` | `usinas.est_movimentos.valor_nota` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.icms_perc` | `numeric(5,2)` | `usinas.est_movimentos.icms_perc` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.valor_frete` | `numeric(12,4)` | `usinas.est_movimentos.valor_frete` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.icms_frete` | `numeric(12,4)` | `usinas.est_movimentos.icms_frete` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos.valor_unitario_liquido` | `numeric(12,4)` | `usinas.est_movimentos.valor_unitario_liquido` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.material_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.tipo` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.data` | `"date"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.quantidade` | `numeric(16,3)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.nota_fiscal` | `character varying(100)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.fornecedor` | `character varying(200)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.observacao` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.responsavel` | `character varying(100)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.origem` | `character varying(50)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.referencia_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.created_at` | `timestamp with time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.unidade` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.silo_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.valor_nota` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.icms_perc` | `numeric(5,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.valor_frete` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.icms_frete` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_unidades_20260601.valor_unitario_liquido` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.material_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.tipo` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.data` | `"date"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.quantidade` | `numeric(16,3)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.nota_fiscal` | `character varying(100)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.fornecedor` | `character varying(200)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.observacao` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.responsavel` | `character varying(100)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.origem` | `character varying(50)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.referencia_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.created_at` | `timestamp with time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.unidade` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.silo_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.valor_nota` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.icms_perc` | `numeric(5,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.valor_frete` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.icms_frete` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_movimentos_backup_zero_20260618_125136.valor_unitario_liquido` | `numeric(12,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.backup_em` | `timestamp with time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.material_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.codigo` | `character varying(50)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.nome` | `character varying(200)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.categoria` | `character varying(50)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.unidade` | `character varying(20)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.saldo_inicial` | `numeric(16,3)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_saldo_backup_zero_20260618_125136.saldo_antes` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_est_silos.id` | `integer NOT NULL` | `usinas.est_silos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_silos.nome` | `character varying(100) NOT NULL` | `usinas.est_silos.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_silos.capacidade_nominal` | `numeric(10,2) NOT NULL` | `usinas.est_silos.capacidade_nominal` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_silos.capacidade_operacional` | `numeric(10,2) NOT NULL` | `usinas.est_silos.capacidade_operacional` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_silos.unidade` | `character varying(20) DEFAULT 'ton'::character varying NOT NULL` | `usinas.est_silos.unidade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_silos.ativo` | `boolean DEFAULT true NOT NULL` | `usinas.est_silos.ativo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_est_silos.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.est_silos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.id` | `integer NOT NULL` | `usinas.leiturasetor.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.datahora` | `timestamp without time zone NOT NULL` | `usinas.leiturasetor.datahora` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.id_leitura` | `integer NOT NULL` | `usinas.leiturasetor.id_leitura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.qr_raw` | `character varying(100)` | `usinas.leiturasetor.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.volume` | `numeric(10,2)` | `usinas.leiturasetor.volume` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.n_serie` | `character varying(100)` | `usinas.leiturasetor.n_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.leiturasetor.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_leiturasetor.uid` | `character varying(30) NOT NULL` | `usinas.leiturasetor.uid` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.id` | `integer NOT NULL` | `usinas.pcpsetor.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.data` | `"date" NOT NULL` | `usinas.pcpsetor.data` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.dia_semana` | `character varying(20) NOT NULL` | `usinas.pcpsetor.dia_semana` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.setor` | `character varying(20) NOT NULL` | `usinas.pcpsetor.setor` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.volume` | `numeric(10,2) DEFAULT 0` | `usinas.pcpsetor.volume` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.status` | `character(1) DEFAULT 'A'::"bpchar"` | `usinas.pcpsetor.status` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.pcpsetor.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_pcpsetor.updated_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.pcpsetor.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.id` | `character varying(36) DEFAULT ("gen_random_uuid"())::"text" NOT NULL` | `usinas.qrcp.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.traco` | `character varying(200)` | `usinas.qrcp.traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.numero_serie` | `character varying(50)` | `usinas.qrcp.numero_serie` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.nome` | `character varying(200)` | `usinas.qrcp.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.cp` | `character varying(10)` | `usinas.qrcp.cp` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.idade` | `integer` | `usinas.qrcp.idade` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.data_moldagem` | `"date"` | `usinas.qrcp.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.hora_moldagem` | `character varying(10)` | `usinas.qrcp.hora_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.data_ruptura` | `"date"` | `usinas.qrcp.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.qr_raw` | `"text"` | `usinas.qrcp.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.qrcp.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_qrcp.resistencia_mpa` | `numeric(10,2)` | `usinas.qrcp.resistencia_mpa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.id` | `bigint NOT NULL` | `usinas.receitas.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.nome` | `"text" NOT NULL` | `usinas.receitas.nome` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado1` | `numeric` | `usinas.receitas.agregado1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado2` | `numeric` | `usinas.receitas.agregado2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado3` | `numeric` | `usinas.receitas.agregado3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado4` | `numeric` | `usinas.receitas.agregado4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado5` | `numeric` | `usinas.receitas.agregado5` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado6` | `numeric` | `usinas.receitas.agregado6` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agregado7` | `numeric` | `usinas.receitas.agregado7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.cimento1` | `numeric` | `usinas.receitas.cimento1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.cimento2` | `numeric` | `usinas.receitas.cimento2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.cimento3` | `numeric` | `usinas.receitas.cimento3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.cimento4` | `numeric` | `usinas.receitas.cimento4` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.agua` | `numeric` | `usinas.receitas.agua` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.aditivo1` | `numeric` | `usinas.receitas.aditivo1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.aditivo2` | `numeric` | `usinas.receitas.aditivo2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.aditivo3` | `numeric` | `usinas.receitas.aditivo3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.ativa` | `boolean DEFAULT true NOT NULL` | `usinas.receitas.ativa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.alterado` | `integer DEFAULT 1 NOT NULL` | `usinas.receitas.alterado` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.nome_traco` | `character varying NOT NULL` | `usinas.receitas.nome_traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.cimento` | `numeric` | `usinas.receitas.cimento` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.adicao_1` | `numeric` | `usinas.receitas.adicao_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.adicao_2` | `numeric` | `usinas.receitas.adicao_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.areia_1` | `numeric` | `usinas.receitas.areia_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.areia_2` | `numeric` | `usinas.receitas.areia_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.areia_3` | `numeric` | `usinas.receitas.areia_3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.brita_1` | `numeric` | `usinas.receitas.brita_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.brita_2` | `numeric` | `usinas.receitas.brita_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.aditivo_1` | `numeric` | `usinas.receitas.aditivo_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.aditivo_2` | `numeric` | `usinas.receitas.aditivo_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.ac` | `numeric` | `usinas.receitas.ac` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.r24h` | `numeric` | `usinas.receitas.r24h` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.r3` | `numeric` | `usinas.receitas.r3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.r7` | `numeric` | `usinas.receitas.r7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.r28` | `numeric` | `usinas.receitas.r28` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.receitas.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.revisao_grupo` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.receitas.revisao_grupo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.revisao_numero` | `integer DEFAULT 1 NOT NULL` | `usinas.receitas.revisao_numero` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.revisao_origem_id` | `bigint` | `usinas.receitas.revisao_origem_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.observacao_revisao` | `"text"` | `usinas.receitas.observacao_revisao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.revisado_em` | `timestamp without time zone` | `usinas.receitas.revisado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas.alterado_por` | `"text"` | `usinas.receitas.alterado_por` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.id` | `bigint` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.nome` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado3` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado4` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado5` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado6` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agregado7` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.cimento1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.cimento2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.cimento3` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.cimento4` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.agua` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.aditivo1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.aditivo2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.aditivo3` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.ativa` | `boolean` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.alterado` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.nome_traco` | `character varying` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.cimento` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.adicao_1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.adicao_2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.areia_1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.areia_2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.areia_3` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.brita_1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.brita_2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.aditivo_1` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.aditivo_2` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.ac` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.r24h` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.r3` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.r7` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.r28` | `numeric` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.created_at` | `timestamp without time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.revisao_grupo` | `"uuid"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.revisao_numero` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.revisao_origem_id` | `bigint` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.observacao_revisao` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.revisado_em` | `timestamp without time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_receitas_backup_limpeza_20260617_0703.alterado_por` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos.id` | `integer NOT NULL` | `usinas.tracos.id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.nome_traco` | `character varying(200) NOT NULL` | `usinas.tracos.nome_traco` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.cimento` | `numeric(10,2)` | `usinas.tracos.cimento` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.adicao_1` | `numeric(10,2)` | `usinas.tracos.adicao_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.adicao_2` | `numeric(10,2)` | `usinas.tracos.adicao_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.areia_1` | `numeric(10,2)` | `usinas.tracos.areia_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.areia_2` | `numeric(10,2)` | `usinas.tracos.areia_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.areia_3` | `numeric(10,2)` | `usinas.tracos.areia_3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.brita_1` | `numeric(10,2)` | `usinas.tracos.brita_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.brita_2` | `numeric(10,2)` | `usinas.tracos.brita_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.aditivo_1` | `numeric(10,2)` | `usinas.tracos.aditivo_1` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.aditivo_2` | `numeric(10,2)` | `usinas.tracos.aditivo_2` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.agua` | `numeric(10,2)` | `usinas.tracos.agua` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.ac` | `numeric(10,4)` | `usinas.tracos.ac` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.r24h` | `numeric(10,2)` | `usinas.tracos.r24h` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.r3` | `numeric(10,2)` | `usinas.tracos.r3` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.r7` | `numeric(10,2)` | `usinas.tracos.r7` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.r28` | `numeric(10,2)` | `usinas.tracos.r28` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.created_at` | `timestamp without time zone DEFAULT "now"()` | `usinas.tracos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.ativa` | `boolean DEFAULT true` | `usinas.tracos.ativa` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.revisao_grupo` | `"uuid" NOT NULL` | `usinas.tracos.revisao_grupo` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.revisao_numero` | `integer DEFAULT 1 NOT NULL` | `usinas.tracos.revisao_numero` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.revisao_origem_id` | `integer` | `usinas.tracos.revisao_origem_id` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.observacao_revisao` | `"text"` | `usinas.tracos.observacao_revisao` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.revisado_em` | `timestamp without time zone` | `usinas.tracos.revisado_em` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos.alterado_por` | `"text"` | `usinas.tracos.alterado_por` | cópia fiel; incluir chave de origem/unidade |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.nome_traco` | `character varying(200)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.cimento` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.adicao_1` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.adicao_2` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.areia_1` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.areia_2` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.areia_3` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.brita_1` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.brita_2` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.aditivo_1` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.aditivo_2` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.agua` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.ac` | `numeric(10,4)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.r24h` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.r3` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.r7` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.r28` | `numeric(10,2)` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.created_at` | `timestamp without time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.ativa` | `boolean` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.revisao_grupo` | `"uuid"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.revisao_numero` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.revisao_origem_id` | `integer` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.observacao_revisao` | `"text"` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.revisado_em` | `timestamp without time zone` | – | preservar no dump histórico; não alimentar runtime |
| `supervisorio_db_pede.public.tbl_tracos_backup_limpeza_20260617_0703.alterado_por` | `"text"` | – | preservar no dump histórico; não alimentar runtime |

### Colunas de controle_est_concre_db

| Origem tabela.coluna | Tipo legado / restrição | Coluna alvo | Tratamento |
|---|---|---|---|
| `controle_est_concre_db.public.estatistica_diaria.id` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.cec_estatistica_diaria.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.data_referencia` | `"date" NOT NULL` | `usinas.cec_estatistica_diaria.data_referencia` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.traco_id` | `"text" NOT NULL` | `usinas.cec_estatistica_diaria.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.idade_dias` | `integer NOT NULL` | `usinas.cec_estatistica_diaria.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.quantidade_grupos` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_diaria.quantidade_grupos` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.quantidade_corpos_prova` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_diaria.quantidade_corpos_prova` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.quantidade_ok` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_diaria.quantidade_ok` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.quantidade_nok` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_diaria.quantidade_nok` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.quantidade_amp` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_diaria.quantidade_amp` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.media_mpa` | `numeric(8,2)` | `usinas.cec_estatistica_diaria.media_mpa` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.desvio_padrao` | `numeric(8,2)` | `usinas.cec_estatistica_diaria.desvio_padrao` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.valor_minimo` | `numeric(8,2)` | `usinas.cec_estatistica_diaria.valor_minimo` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.valor_maximo` | `numeric(8,2)` | `usinas.cec_estatistica_diaria.valor_maximo` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_diaria.updated_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_estatistica_diaria.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.id` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.cec_estatistica_mensal.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.ano_mes` | `"text" NOT NULL` | `usinas.cec_estatistica_mensal.ano_mes` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.traco_id` | `"text" NOT NULL` | `usinas.cec_estatistica_mensal.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.idade_dias` | `integer NOT NULL` | `usinas.cec_estatistica_mensal.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.quantidade_grupos` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_mensal.quantidade_grupos` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.quantidade_corpos_prova` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_mensal.quantidade_corpos_prova` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.quantidade_ok` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_mensal.quantidade_ok` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.quantidade_nok` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_mensal.quantidade_nok` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.quantidade_amp` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_estatistica_mensal.quantidade_amp` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.media_mpa` | `numeric(8,2)` | `usinas.cec_estatistica_mensal.media_mpa` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.desvio_padrao` | `numeric(8,2)` | `usinas.cec_estatistica_mensal.desvio_padrao` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.valor_minimo` | `numeric(8,2)` | `usinas.cec_estatistica_mensal.valor_minimo` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.valor_maximo` | `numeric(8,2)` | `usinas.cec_estatistica_mensal.valor_maximo` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.estatistica_mensal.updated_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_estatistica_mensal.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.faixas_resistencia.id` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.cec_faixas_resistencia.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.faixas_resistencia.idade_dias` | `integer NOT NULL` | `usinas.cec_faixas_resistencia.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.faixas_resistencia.valor_minimo` | `numeric(8,2) NOT NULL` | `usinas.cec_faixas_resistencia.valor_minimo` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.faixas_resistencia.valor_maximo` | `numeric(8,2) NOT NULL` | `usinas.cec_faixas_resistencia.valor_maximo` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.faixas_resistencia.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_faixas_resistencia.created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.faixas_resistencia.updated_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_faixas_resistencia.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.id` | `bigint NOT NULL` | `usinas.cec_fila_recalculo.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.data_moldagem` | `"date" NOT NULL` | `usinas.cec_fila_recalculo.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.traco_id` | `"text" NOT NULL` | `usinas.cec_fila_recalculo.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.idade_dias` | `integer NOT NULL` | `usinas.cec_fila_recalculo.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.status` | `"text" DEFAULT 'pendente'::"text" NOT NULL` | `usinas.cec_fila_recalculo.status` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.tentativas` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_fila_recalculo.tentativas` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.erro` | `"text"` | `usinas.cec_fila_recalculo.erro` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_fila_recalculo.created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.started_at` | `timestamp with time zone` | `usinas.cec_fila_recalculo.started_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.fila_recalculo.processed_at` | `timestamp with time zone` | `usinas.cec_fila_recalculo.processed_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.id` | `"uuid" NOT NULL` | `usinas.cec_rompimentos.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.source` | `"text" DEFAULT 'qr-concreto'::"text" NOT NULL` | `usinas.cec_rompimentos.source` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.etiqueta_id` | `"text"` | `usinas.cec_rompimentos.etiqueta_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.traco_id` | `"text" NOT NULL` | `usinas.cec_rompimentos.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.idade_dias` | `integer NOT NULL` | `usinas.cec_rompimentos.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.cp` | `"text" NOT NULL` | `usinas.cec_rompimentos.cp` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.data_moldagem` | `"date"` | `usinas.cec_rompimentos.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.hora_moldagem` | `"text"` | `usinas.cec_rompimentos.hora_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.data_ruptura` | `"date"` | `usinas.cec_rompimentos.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.mpa` | `numeric(8,2) NOT NULL` | `usinas.cec_rompimentos.mpa` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.status_meta` | `"text"` | `usinas.cec_rompimentos.status_meta` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.meta_min` | `numeric(8,2)` | `usinas.cec_rompimentos.meta_min` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.meta_max` | `numeric(8,2)` | `usinas.cec_rompimentos.meta_max` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.responsavel` | `"text"` | `usinas.cec_rompimentos.responsavel` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.qr_raw` | `"text"` | `usinas.cec_rompimentos.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.payload_json` | `"jsonb" DEFAULT '{}'::"jsonb" NOT NULL` | `usinas.cec_rompimentos.payload_json` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.client_created_at` | `timestamp with time zone` | `usinas.cec_rompimentos.client_created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_rompimentos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos.updated_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_rompimentos.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.id` | `"uuid" NOT NULL` | `usinas.cec_rompimentos_atuais.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.source` | `"text" NOT NULL` | `usinas.cec_rompimentos_atuais.source` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.etiqueta_id` | `"text"` | `usinas.cec_rompimentos_atuais.etiqueta_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.traco_id` | `"text" NOT NULL` | `usinas.cec_rompimentos_atuais.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.idade_dias` | `integer NOT NULL` | `usinas.cec_rompimentos_atuais.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.cp` | `"text" NOT NULL` | `usinas.cec_rompimentos_atuais.cp` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.data_moldagem` | `"date"` | `usinas.cec_rompimentos_atuais.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.hora_moldagem` | `"text"` | `usinas.cec_rompimentos_atuais.hora_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.data_ruptura` | `"date"` | `usinas.cec_rompimentos_atuais.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.mpa` | `numeric(8,2) NOT NULL` | `usinas.cec_rompimentos_atuais.mpa` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.status_meta` | `"text"` | `usinas.cec_rompimentos_atuais.status_meta` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.meta_min` | `numeric(8,2)` | `usinas.cec_rompimentos_atuais.meta_min` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.meta_max` | `numeric(8,2)` | `usinas.cec_rompimentos_atuais.meta_max` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.responsavel` | `"text"` | `usinas.cec_rompimentos_atuais.responsavel` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.qr_raw` | `"text"` | `usinas.cec_rompimentos_atuais.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.payload_json` | `"jsonb" DEFAULT '{}'::"jsonb" NOT NULL` | `usinas.cec_rompimentos_atuais.payload_json` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.client_created_at` | `timestamp with time zone` | `usinas.cec_rompimentos_atuais.client_created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_rompimentos_atuais.created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_atuais.updated_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_rompimentos_atuais.updated_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.id` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.cec_rompimentos_eventos.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.rompimento_id` | `"uuid" NOT NULL` | `usinas.cec_rompimentos_eventos.rompimento_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.source` | `"text" NOT NULL` | `usinas.cec_rompimentos_eventos.source` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.etiqueta_id` | `"text"` | `usinas.cec_rompimentos_eventos.etiqueta_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.traco_id` | `"text" NOT NULL` | `usinas.cec_rompimentos_eventos.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.idade_dias` | `integer NOT NULL` | `usinas.cec_rompimentos_eventos.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.cp` | `"text" NOT NULL` | `usinas.cec_rompimentos_eventos.cp` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.data_moldagem` | `"date"` | `usinas.cec_rompimentos_eventos.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.hora_moldagem` | `"text"` | `usinas.cec_rompimentos_eventos.hora_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.data_ruptura` | `"date"` | `usinas.cec_rompimentos_eventos.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.mpa` | `numeric(8,2) NOT NULL` | `usinas.cec_rompimentos_eventos.mpa` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.status_meta` | `"text"` | `usinas.cec_rompimentos_eventos.status_meta` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.meta_min` | `numeric(8,2)` | `usinas.cec_rompimentos_eventos.meta_min` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.meta_max` | `numeric(8,2)` | `usinas.cec_rompimentos_eventos.meta_max` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.responsavel` | `"text"` | `usinas.cec_rompimentos_eventos.responsavel` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.qr_raw` | `"text"` | `usinas.cec_rompimentos_eventos.qr_raw` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.payload_original` | `"jsonb" DEFAULT '{}'::"jsonb" NOT NULL` | `usinas.cec_rompimentos_eventos.payload_original` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.tipo_evento` | `"text" NOT NULL` | `usinas.cec_rompimentos_eventos.tipo_evento` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.client_created_at` | `timestamp with time zone` | `usinas.cec_rompimentos_eventos.client_created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_eventos.created_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_rompimentos_eventos.created_at` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.id` | `"uuid" DEFAULT "gen_random_uuid"() NOT NULL` | `usinas.cec_rompimentos_grupos.id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.data_moldagem` | `"date" NOT NULL` | `usinas.cec_rompimentos_grupos.data_moldagem` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.traco_id` | `"text" NOT NULL` | `usinas.cec_rompimentos_grupos.traco_id` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.idade_dias` | `integer NOT NULL` | `usinas.cec_rompimentos_grupos.idade_dias` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.data_ruptura` | `"date"` | `usinas.cec_rompimentos_grupos.data_ruptura` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.mpa_cp1` | `numeric(8,2)` | `usinas.cec_rompimentos_grupos.mpa_cp1` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.mpa_cp2` | `numeric(8,2)` | `usinas.cec_rompimentos_grupos.mpa_cp2` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.media_mpa` | `numeric(8,2)` | `usinas.cec_rompimentos_grupos.media_mpa` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.quantidade_cp` | `integer DEFAULT 0 NOT NULL` | `usinas.cec_rompimentos_grupos.quantidade_cp` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.status_resultado` | `"text" NOT NULL` | `usinas.cec_rompimentos_grupos.status_resultado` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.meta_minima` | `numeric(8,2)` | `usinas.cec_rompimentos_grupos.meta_minima` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.meta_maxima` | `numeric(8,2)` | `usinas.cec_rompimentos_grupos.meta_maxima` | cópia fiel; incluir chave de origem/unidade |
| `controle_est_concre_db.public.rompimentos_grupos.updated_at` | `timestamp with time zone DEFAULT "now"() NOT NULL` | `usinas.cec_rompimentos_grupos.updated_at` | cópia fiel; incluir chave de origem/unidade |

## Integridade e limitações

- Dumps em `schemas/*.sql` são os artefatos integrais de DDL e GRANTs. Arquivos `*-contagens.txt`, `*-datas.txt`, `*-volumes.txt` são evidências agregadas, sem registros individuais.
- A verificação dos escritores de `tbl_massadas` e `tbl_receitas` precisa de confirmação operacional do CLP/supervisório; referências de código não provam o processo que efetivamente inseriu cada linha.
- Não foi extraído conteúdo de nenhuma tabela nem senhas/chaves.

