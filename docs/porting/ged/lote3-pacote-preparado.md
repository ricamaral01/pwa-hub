# Pacote preparado para a janela do lote 3

> **Cronograma posterior de 15/10:** Ricardo autorizou [A6 somente GED](A6-ged-2026-10-15.md) hoje, 20h–21h. Limpeza da Qualidade, C1 e C2 foram movidos para 16/10, 20h–21h, após os pré-requisitos próprios. O RNC segue gravável no GED até C2. Este bloco substitui o cronograma conjunto descrito abaixo.

**Estado:** preparação documental, ensaio isolado e migration de unidade. Nenhum DNS, domínio antigo, C1 oficial ou C2 foi alterado por este pacote. Ricardo antecipou a janela para **15/10/2026**, sujeita a GO às 19h; se faltar pré-requisito, corte em **16/10 às 20h**. Shell 20h00–20h15, limpeza Qualidade 20h15–20h35 e A6 com T0=20h40. A1 `prepare/copy/verify`, o roteiro presencial aprovado, os três mapeamentos confirmados e o smoke da versão no ar são necessários; SMTP não é pré-requisito.

| Item | Artefato | Estado para a janela |
|---|---|---|
| A1 | [Segunda proteção](A1-segunda-protecao-preparo.md) e `scripts/porting/a1_password_recovery.py` | Script preparado e testes locais 2/2: Ricardo executa `prepare` com prompt sem eco e confirmação (mínimo 20 caracteres); depois a equipe executa `copy` sem senha; Ricardo executa `verify` por prompt sem eco. Invólucro real, cópia cifrada root-only e restauração sem DPAPI **não realizados**. Obrigatórios antes do corte. |
| A7 | [Backup diário](A7-backup-diario.md) e `scripts/porting/backup_ged_qualidade.sh` | Timer diário e teste mensal instalados no destino; restauração antecipada passou. Revalidar último backup na janela. |
| C1 | [Ensaio lado a lado](C1-ensaio.md), `scripts/porting/c1_migrate_rnc.py` e `scripts/porting/c1_prepare_ensayo.sh` | Ricardo confirmou Campinas e `user-ricardo` para as três RNCs. Migration `20261015_04` aplicada apenas ao banco Qualidade após backup; novo ensaio em `qualidade_c1_campinas_ensaio` passou com 3 NCs, 12 eventos e reexecução idempotente. O bloqueio técnico está publicado **desativado** e ensaiado. Se GO e OK da lista, limpar 20h15–20h35. Antes da C1 oficial: exigir contador zero e nenhuma NC numerada. |
| C2 | [Modo somente leitura](C2-preparo.md) | Duas imagens C2 pré-construídas no destino com Node 20.20.2 e Compose candidatos com flag persistente `0` e `1`; testes de guarda 2/2 no backend construído, login/raiz do frontend isolado e validação Compose passaram. Os contêineres oficiais continuam nas imagens A5; implantação e ativação `1` só após C1 na janela. |
| A6 | [Runbook](A6-runbook-preparado.md) e [configuração 302](../../../infra/ged/nginx-old-domain-a6-302.conf) | Vhost completo preparado a partir de cópia somente leitura e sintaxe validada em isolamento, **não aplicado**; DNS permanece intacto. Sequência T0=20h40–T+60, reserva de retorno e ponto de não retorno definidos. Validar QR impresso, documentos e links antes de qualquer 301. |

## Conferências obrigatórias durante a execução

1. Antes do dump final, registrar contagens dos dados A5 de prova no GED destino. Depois da restauração, confirmar que desapareceram contas `e2e-ged-a5-*`, documento `E2E-A5-2026`, tarefa, calibrações e anexos sintéticos. Não fazer limpeza manual para forçar o resultado.
2. Após o dump final, confirmar Ricardo `ADMIN_MASTER` e zero `deny` individuais no GED destino; reaplicar papel só no destino se necessário. Validar login e acesso total no GED/Qualidade.
3. Conferir as seis tabelas RNC, números, estados, gravidade, unidades, usuários e anexos. Antes de C1, exigir contador ainda zerado e zero NC numerada; qualquer desvio interrompe a migração. C1 no banco oficial exige flag explícita, mapa confirmado e transação única; C2 ativa 410 depois da migração, na mesma janela.
4. Só após o corte e smoke final, confirmar remoção de `/etc/ged-a5-probe.env`. Não removê-lo nesta preparação.
5. Salvar somente evidências sem segredos: horários, contagens, SHA-256, códigos de resposta, tipo de conexão e `host:porta`. Não imprimir env, DSN, token, `Authorization`, `Cookie` ou query de login.

**Retorno:** seguir os backups e critérios do runbook A6. Uma falha em QR, links, PCP, Mapa, Laboratório, login ou dados migrados interrompe a liberação; restaurar a configuração anterior sem abrir escrita dupla.
