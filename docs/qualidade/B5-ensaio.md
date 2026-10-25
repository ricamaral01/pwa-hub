# B5 — ensaio funcional da Qualidade

**Data:** 15/10/2026. **Ambiente:** Qualidade no destino, via HTTPS do Unificado. Todos os registros abaixo são sintéticos e foram preservados para o inventário e a limpeza autorizada antes do uso real. Credenciais de teste estão somente em `/etc/mapa-unificado/` no destino.

## Quatro casos

O script [qualidade_lote2_b5_live.py](../../tests/unificado/qualidade_lote2_b5_live.py) fez login real da conta sintética, bootstrap da casca e chamadas HTTPS à API. O resultado foi **PASS**:

| Caso | NC | ID | Resultado | Eventos |
|---|---|---|---|---:|
| Maior, corretiva concluída e eficácia eficaz | NC-2026-0002 | `4b2c6f6f-34a4-4672-a88b-3ae8cddca71d` | ENCERRADA | 14 |
| Maior, eficácia não eficaz, volta à causa e segunda rodada eficaz | NC-2026-0003 | `1c454aaf-05ae-499c-90fc-b435f9197745` | ENCERRADA | 21 |
| Menor, correção e dispensa justificada de corretiva | NC-2026-0004 | `fb810b2a-9c1f-4944-9b6e-b19a490e539f` | ENCERRADA | 7 |
| Abertura com mínimo do celular, classificação e atribuição na triagem | NC-2026-0005 | `b6e8ea38-f6e3-403d-be56-15343fa1e2f1` | CONTENCAO | 4, incluindo anexo |

Rascunhos não receberam número; o registro produziu número oficial. O caso Menor foi encerrado sem plano corretivo após justificativa. O caso Maior não eficaz retornou à causa e registrou duas rodadas de eficácia. O PDF da primeira NC retornou `200` e assinatura `%PDF-`.

O [teste de negativas](../../tests/unificado/qualidade_lote2_negative_live.py) passou: tentativa sem ação de abrir, triar, tratar, aprovar concessão, verificar eficácia, encerrar e cadastrar recebeu `403`; NC de outro autor ficou invisível (`404`); contexto sem sessão recebeu `401`; abertura móvel sem local recebeu `422`. Um rascunho sintético sem número (`88267077-41a3-4487-ab90-1c02f0123873`) foi preservado para essa última prova. O [teste de anexo](../../tests/unificado/qualidade_lote2_attachment_live.py) confirmou upload `201`, SHA-256, download autorizado `200` com bytes idênticos e acesso anônimo `401`.

Os testes de unidade de [regras](../../unificado/qualidade/service/tests/test_rules.py), [permissões](../../unificado/qualidade/service/tests/test_permissions.py) e [autenticação](../../unificado/qualidade/service/tests/test_auth.py) cobrem transições, escopo de rascunho/área/unidade, validação de causa, verificador diferente do executor, limite/MIME do anexo e fechamento Maior. As negativas HTTPS acima confirmam a imposição de ações na API. A verificação presencial de foto/câmera e toque está no [roteiro de Ricardo](../porting/roteiro-ricardo.md).

## Concessão, cliente e acesso por perfil

O [ensaio HTTPS específico](../../tests/unificado/qualidade_lote2_concession_live.py) criou duas NCs sintéticas com `cliente_afetado=true`. Em ambas, o registro gerou `PENDENCIA_CLIENTE`; a confirmação vazia foi rejeitada em `422`, e a confirmação com referência gerou `CLIENTE_NOTIFICADO` e eliminou a pendência. A criação de contenção `CONCESSAO` sem aprovador foi rejeitada em `422`; com aprovador, criou pedido de aprovação na outbox. A aprovação gravou `CONCESSAO_APROVADA` e `concessao_aprovada_por`.

O primeiro ensaio, `NC-2026-0006`, revelou uma omissão B2.2: antes da aprovação, `concluir-contencao` respondia `200` e avançava para `ANALISE_CAUSA`. Esse histórico inconsistente foi preservado, sem edição ou descarte. A guarda foi acrescentada apenas ao fluxo de conclusão. Depois de backup dos dois arquivos ativos e teste local (23 regras), o ensaio `NC-2026-0007` confirmou `409` antes da aprovação e `200` após, com evento. Cada uma dessas NCs tem oito eventos e quatro linhas de outbox; ambas permanecem no banco oficial como dados sintéticos. O [gate de regressão](../../scripts/qualidade_regression_gate.py) passou **7/7 antes e depois** da publicação, abrangendo PCP, Mapa e navegação do Laboratório; health da Qualidade `200`. A cópia anterior está em `/root/quality-b5-concession-20261015/` no destino. O deploy transportou somente a guarda e sua regra, sem incluir o candidato B4.

O [ensaio de menu da conta PCP vinculada](../../tests/unificado/qualidade_lote2_pcp_menu_live.py) passou no navegador: Planejamento e Qualidade aparecem; nenhum grupo Produção/Mapa vazio aparece. O [ensaio de contexto](../../tests/unificado/qualidade_lote2_ricardo_context_remote.py) consultou o código e o banco ativos sem simular credenciais: `user-ricardo` tem 56/56 telas, nove ações e 20 áreas por superusuário implícito. Para uma conta ativa comum escolhida sem divulgar sua identidade, a regra de sessão retornou `preview_modules=false` e zero telas Qualidade; portanto GED e Qualidade não são exibidos pelo menu.

## Restauração isolada

O script [b5-restore-smoke.sh](../../infra/qualidade/b5-restore-smoke.sh) criou dump custom do banco `qualidade` e restaurou em `qualidade_b5_restore_20261015`, sem escrever no banco oficial. Copiou o diretório de anexos para `/root/qualidade-b5-restore-20261015/anexos-restaurados`, fora de `public`. As contagens de origem e restauração coincidiram: **5 NC, 49 eventos, 1 anexo e 27 linhas de outbox**. O SHA-256 do arquivo restaurado foi idêntico ao da origem. O dump privado ficou em `/root/qualidade-b5-restore-20261015/qualidade.dump`, SHA-256 `f27ffb0169a4b58bbac21aa43f7711869d307d955489472b4a5f44251462b764`. O banco de ensaio e os arquivos foram preservados.

## Limites da evidência

As quatro trajetórias foram exercidas pela API HTTPS com navegador headless; o quarto caso usou viewport de celular, mas câmera e toque físicos exigem a verificação de Ricardo. O ensaio ainda não demonstra envio SMTP real, pois faltam credenciais próprias. O PDF foi validado como arquivo gerado; sua composição visual detalhada requer conferência humana. O caso `NC-2026-0006` continua registrado como evidência de que a guarda faltava antes da correção.
