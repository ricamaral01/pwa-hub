# Preparação da reconciliação após a janela de observação

Estado inicial em 23/10/2026, 14h18 BRT: **preparação somente de leitura**. O Supabase permanece escritor temporário de `liberacao_formas` e `prog_s3_s4`; o espelho da VPS nova escreve apenas em `mapa_unificado_teste`. A janela inicial começou em 23/10 às 08h50 BRT. Após uma falha transitória de paginação às 14h55 BRT, a janela de aceite foi reiniciada para **23/10 às 15h30 BRT**, com término mínimo em **24/10 às 15h30 BRT**, sujeito aos timers saudáveis e nova reconciliação.

## Evidência atual

- `liberacao_formas`: 5.866 linhas na origem, 6.269 no destino, 5.853 IDs compartilhados e zero divergências de campos comuns. Todas as chaves naturais da origem existem no destino. As 403 chaves exclusivas do destino correspondem exatamente à lista privada `local-only-baseline.json`.
- As 13 chaves com IDs diferentes têm mesmo `(data_fabricacao,setor,forma)` e mesmo `colaborador` nos dois lados. Todos os registros de destino têm `data_hora` posterior, por 1.896 a 11.013 segundos. Os 13 pares coincidem com `accepted-collisions.json`. Não há auditoria de UPDATE que permita afirmar se esses registros foram editados depois.
- `prog_s3_s4`: 52 linhas e 52 IDs compartilhados, sem diferença de campos.
- `pg_constraint` no banco de teste não mostra chave estrangeira apontando para `public.liberacao_formas`. O código encontrado para o Mapa cruza liberações por data, setor e forma. Isso reduz o risco de vínculo relacional nesses 13 IDs, mas não prova ausência de referências fora do banco ou em exportações.

## Verificação reproduzível

Na VPS nova, executar `python3 /opt/concrefer-unificado/migration/supabase-sync/audit.py` como root. O script [audit_supabase_legacy_mirror.py](../../../scripts/audit_supabase_legacy_mirror.py) lê REST do Supabase e PostgreSQL de teste, compara todas as linhas e imprime somente contagens. Código de saída zero indica ausência das divergências verificadas; código não zero impede aceite. Uma falha isolada durante escrita simultânea na origem deve ser reavaliada após o próximo ciclo do espelho, preservando o primeiro resultado no registro da investigação.

## Decisões antes de qualquer corte

1. O usuário decidiu migrar o Mapa legado para a VPS nova. O Supabase permanece escritor temporário das duas tabelas espelhadas até o corte, condicionado ao aceite de 24 horas.
2. **Preservar** as 403 linhas só do destino; não apagá-las na reconciliação.
3. **Manter** os 13 IDs antigos como equivalências por chave natural; não reescrever IDs no corte. Não há chave estrangeira para `liberacao_formas` no banco de teste, mas o histórico de origem permanece no backup.
4. **Concluído em 23/10:** conexão PostgreSQL da origem recebida, catálogo interno registrado e `pg_dump` histórico gerado. Ver [03-corte-mapa-legado.md](03-corte-mapa-legado.md).
5. No fechamento das 24 horas, conferir logs completos sem falha, atraso máximo de 120 segundos, escrita real do legado e executar novamente a prévia `sync.py --dry-run` e a auditoria independente. Registrar contagens e horário antes de propor a mudança de escritor.

Nenhuma alteração de IDs, exclusão, troca de escritor ou atualização de cliente foi realizada nesta preparação.
