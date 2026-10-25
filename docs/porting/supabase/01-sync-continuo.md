# Etapa 1 — espelho temporário das tabelas legadas

Início: 23/10/2026, 08h45 BRT. Ambiente: VPS nova `vps-staging`, banco `mapa_unificado_teste`. Origem: REST de leitura do Supabase com credencial já guardada na VPS. Revisão de código: árvore de trabalho `feat/sistema-unificado` em 23/10, com arquivos ainda não versionados; base `231e88bc`.

## Escopo e decisão

O usuário aprovou avançar com o Supabase como escritor oficial temporário de `liberacao_formas` e `prog_s3_s4`. O espelho escreve apenas no PostgreSQL de testes. Não houve alteração do Supabase, de produção ou de clientes. O catálogo interno e o `pg_dump` histórico da origem continuam pendentes da Etapa 0.

O sincronizador em [scripts/sync_supabase_legacy_tables.py](../../../scripts/sync_supabase_legacy_tables.py) lê as duas tabelas inteiras a cada minuto, em páginas de 1.000 ordenadas por ID. Para esse volume (5.833 e 52 linhas no primeiro ciclo), a varredura completa cobre edições tardias e detecta exclusões sem depender de um cursor `updated_at` ainda não comprovado. Confere contagem exata e IDs únicos antes de abrir a transação. A rotina interrompe diante de exclusão na origem, colisão nova de chave natural, mudança de chave de um ID ou divergência em que o destino seja tão recente quanto a origem. Não propaga `DELETE` automaticamente.

O estado privado em `/opt/concrefer-unificado/migration/supabase-sync/state.json` registra IDs, maior horário da origem e último sucesso; modo `600`, fora do Git. Uma execução concorrente é impedida por `flock`. O serviço e timer `supabase-legacy-mirror` executam a cada minuto. O serviço de saúde `supabase-legacy-mirror-health` falha e registra alerta no journal quando o último sucesso ultrapassa 120 segundos. Ainda não existe canal externo de notificação configurado.

## Prévia, colisões e carga inicial

- Prévia transacional com `--dry-run`: origem 5.833 `liberacao_formas` e 52 `prog_s3_s4`; importação prevista de 237 e 52, seguida de `ROLLBACK`.
- A prévia inicial detectou 13 colisões de chave natural `(data_fabricacao,setor,forma)` em 20/10: IDs diferentes, mesmo `colaborador`, horário do destino posterior em 1.896 a 11.013 segundos. Essas linhas equivalentes foram preservadas no destino com seus IDs locais; o código aceita somente esse caso datado. Uma colisão nova interrompe a execução. Os 13 pares de IDs ainda exigem decisão na Etapa 2, inclusive checagem de vínculos, antes de qualquer normalização.
- Backup anterior à escrita: `/opt/concrefer-unificado/migration/supabase-sync/pre-sync-20261023.dump`, modo `600`, SHA-256 `ed6e29ab2f5c4eb0a37cf05a5b9b9fc8b8c688af6498b7ff209b2d1dff4341dc`. Contém as duas tabelas; `pg_restore -l` confirmou os itens de dados. A restauração isolada do banco completo havia sido aprovada na Etapa 0.
- Primeira execução com escrita: `INSERT 0 237` em `liberacao_formas`, total 6.236; `INSERT 0 52` em `prog_s3_s4`, total 52; `COMMIT`.
- Segunda execução imediata: `INSERT 0 0` nas duas tabelas, mesmos totais. Isso verifica idempotência da carga inicial.
- `systemd-analyze verify` passou sem mensagens; os dois timers foram habilitados na VPS nova às 08h45 BRT.
- O primeiro ciclo automático, às 08h46 BRT, terminou com sucesso e zero novas inserções. A unidade de saúde falhou inicialmente porque `systemd` interpretou `%` no comando Python embutido; a verificação foi movida para [check_supabase_legacy_mirror.py](../../../scripts/check_supabase_legacy_mirror.py). A execução manual corrigida às 08h47 BRT passou, com último sucesso há 6,7 segundos.
- Reconciliação por chave natural após a carga: **zero chaves da origem ausentes no destino** nas duas tabelas; `liberacao_formas` conserva 403 chaves só do destino e os 13 pares com IDs diferentes. A lista desses 13 pares foi gravada em `accepted-collisions.json`, modo `600`, fora do Git; o sincronizador aceita somente esses pares e falha diante de outra colisão. A prévia após esse ajuste continuou idempotente.
- Os timers permaneceram ativos após o ajuste. O ciclo automático de 08h48 BRT concluiu com zero inserções; a checagem automática de 08h48min30s passou, com último sucesso há 19,8 segundos.
- As 403 chaves que já existiam só no destino foram fixadas em `local-only-baseline.json`, modo `600`, fora do Git. A rotina agora interrompe se surgir outra linha só no destino, para detectar um segundo escritor local. A prévia com essa guarda passou e os timers foram retomados.
- O primeiro ciclo automático com as duas listas de exceção fixadas, às 08h50 BRT, terminou com sucesso e zero novas inserções; ambos os timers continuaram ativos.

## Aceite e reversão

**Em observação.** A passagem da Etapa 1 exige 24 horas de ciclos, incluindo escrita real do legado, último sucesso com atraso máximo de 2 minutos e reconciliação diária sem divergência não explicada. A janela sem falhas começa em 23/10 às 08h50 BRT, após a correção da checagem de saúde e a ativação das duas listas de exceções; o aceite mais cedo é 24/10/2026, 08h50 BRT. É preciso medir erros e mudanças após a ativação; a carga inicial sozinha não satisfaz o critério.

### Acompanhamento — 23/10/2026, 09h34 BRT

Desde 08h50 BRT, o journal registrou **45 inícios e 45 conclusões** do serviço de cópia e **45 inícios e 45 conclusões** do serviço de saúde, sem evento de falha. O maior intervalo entre o último sucesso e a checagem de saúde foi **24,5 segundos**. Origem e destino permaneceram em 5.833/6.236 linhas para `liberacao_formas` e 52/52 para `prog_s3_s4`. A comparação por chave natural retornou zero chaves da origem ausentes do destino; persistem as 403 chaves históricas só do destino e os 13 pares de IDs já documentados. O maior `data_hora` de `liberacao_formas` na origem ainda é 23/10 11h19 UTC; **não houve nova escrita de origem observada após a ativação**, portanto o ciclo real de escrita exigido para o aceite ainda não foi testado.

Comparação independente dos campos comuns por ID, normalizando horários como `timestamptz`: **5.820 IDs compartilhados de `liberacao_formas` e 52 de `prog_s3_s4`, sem divergência de campos**. Os 13 pares com IDs distintos são a exceção histórica separada acima.

O caminho de `UPDATE` foi exercitado sem alterar dados persistidos: uma linha compartilhada de cada tabela foi modificada apenas no snapshot em memória, com timestamp da origem um segundo à frente. A transação de teste registrou `INSERT 0 1` para cada tabela e terminou em `ROLLBACK`; consulta posterior retornou zero linhas com o marcador de teste. Isso confirma a SQL de atualização, mas não substitui a observação de uma escrita real no legado.

### Acompanhamento — 23/10/2026, 10h53 BRT

Desde 08h50 BRT, o journal registrou 124 inícios do espelho e 123 conclusões no instante da consulta (um ciclo em andamento), **sem falha**; a checagem de saúde teve 123 inícios e 123 conclusões, também sem falha. A maior idade do último sucesso medida pela checagem foi **24,6 segundos**.

Houve escrita real no legado: `liberacao_formas` passou de 5.833 para **5.851 linhas** na origem. O espelho aplicou 6 linhas no ciclo de 10h27 BRT e mais 12 no de 10h28 BRT; o destino passou de 6.236 para **6.254 linhas**. O maior `data_hora` da origem é 23/10 13h27min11s UTC. A comparação atual encontrou **zero chaves da origem ausentes do destino** e **zero divergências de campos** entre IDs compartilhados. Persistem somente as 403 chaves históricas do destino e os 13 pares de IDs já explicados. `prog_s3_s4` continua em 52/52 linhas, sem mudança. A escrita real foi observada; falta completar as 24 horas e repetir a reconciliação no fechamento da janela.

Em falha, `systemctl disable --now supabase-legacy-mirror.timer supabase-legacy-mirror-health.timer` interrompe novas cópias. O backup anterior à carga permite restaurar as duas tabelas em ambiente isolado para comparar e planejar a reversão. Restaurá-lo diretamente no banco ativo depois de novas escritas poderia apagar dados posteriores; qualquer reversão operacional precisa reconciliar a janela primeiro. A rotina não apaga nem altera dados na origem.

### Acompanhamento — 23/10/2026, 11h09 BRT

Desde 08h50 BRT, o journal registra **139 inícios e 139 conclusões** do espelho e **139 inícios e 139 conclusões** da checagem de saúde, sem falhas. A maior idade do último sucesso nas checagens foi **24,6 segundos**. Os dois timers seguem ativos. A prévia transacional executada agora terminou em `ROLLBACK`, com zero inserções ou atualizações pendentes: origem/destino em **5.851/6.254** linhas para `liberacao_formas` e **52/52** para `prog_s3_s4`. Permanecem os 403 registros locais históricos e os 13 pares de IDs já documentados. O aceite continua condicionado ao fechamento das 24 horas, a partir de 24/10 às 08h50 BRT.

### Acompanhamento — 23/10/2026, 14h18 BRT

O espelho continua ativo e acompanhou outras 15 linhas reais na origem: `liberacao_formas` está em **5.866/6.269** linhas (origem/destino), e `prog_s3_s4` em **52/52**. Uma nova prévia transacional terminou em `ROLLBACK`, com zero alterações pendentes. A auditoria independente em [audit_supabase_legacy_mirror.py](../../../scripts/audit_supabase_legacy_mirror.py) foi instalada na VPS nova como `/opt/concrefer-unificado/migration/supabase-sync/audit.py` e executada somente em leitura. Ela confirmou, para `liberacao_formas`, **5.853 IDs compartilhados com zero divergências de campos**, zero chaves da origem ausentes e somente as 403 chaves locais históricas; os 13 pares de IDs e a lista de 403 IDs coincidem exatamente com as exceções privadas. Para `prog_s3_s4`, os 52 IDs e campos coincidem integralmente. O script retorna código diferente de zero diante de duplicidade, diferença de campos ou exceção nova. O aceite permanece pendente das 24 horas e de nova execução dessa auditoria no fechamento da janela.

### Checagem agendada para 24/10/2026, 08h52min40s BRT

O timer `supabase-legacy-mirror-acceptance.timer` foi instalado na VPS nova para uma execução única, somente de leitura, depois das 24 horas. Ele verifica os logs da janela desde 08h50 BRT (sem falhas, intervalos de sucesso de até 120 segundos, saúde e escrita real), executa a prévia do sincronizador com `ROLLBACK` e a auditoria independente. O script [check_supabase_mirror_acceptance.py](../../../scripts/check_supabase_mirror_acceptance.py) foi executado antes do prazo: **336 ciclos completos do espelho e da saúde, zero falhas, maior intervalo de 80,2 segundos e maior idade de 24,6 segundos**, mas `ready_24h=false` como esperado. A execução agendada não faz corte, troca de escritor nem escrita no Supabase.

### Reinício da janela — 23/10/2026, 15h30 BRT

Às 14h55 BRT, um ciclo falhou com `source changed during pagination`: uma escrita na origem alterou a contagem entre páginas REST. O sincronizador abortou antes de aplicar a fotografia inconsistente; o ciclo posterior se recuperou. A regra de aceite de **zero falhas** exige reiniciar a observação. [sync_supabase_legacy_tables.py](../../../scripts/sync_supabase_legacy_tables.py) agora descarta a leitura afetada e a tenta novamente até cinco vezes antes de sinalizar falha. O caminho de retentativa foi testado com falhas transitórias e persistentes simuladas na VPS nova; a prévia real após a implantação terminou em `ROLLBACK`, com 5.887/6.290 linhas de `liberacao_formas` e 52/52 de `prog_s3_s4`, sem alterações pendentes.

A nova janela começa em **23/10 às 15h30 BRT (18h30 UTC)** e completa 24 horas em **24/10 às 15h30 BRT**. O timer de aceite foi reagendado para **24/10 às 15h32min40s BRT (18h32min40s UTC)**. Ele continua apenas verificando; não executa o corte. Qualquer nova falha nessa janela exigirá investigação e novo aceite.

O primeiro ciclo da nova janela terminou com sucesso: um início e uma conclusão do espelho e da checagem de saúde, **zero falhas**, idade do último sucesso de **13,9 segundos**. `ready_24h=false` permanece esperado antes de completar a janela.
