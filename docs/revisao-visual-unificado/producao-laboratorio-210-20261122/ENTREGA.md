# Laboratório 2.1.0 publicado

Produção e homologação 18446: **2.1.0**. Gate: **7/7** em cada ambiente.
Matriz por ambiente: 112 casos de acesso, 12 recusas de lançamento e 22
verificações de interface. Francisco: LB técnico em Pederneiras, sem Ribeirão.

Folga final: **37 conexões comuns**; mínimo **34** durante a matriz em produção.
Configuração global preservada: max_connections=100 e reserva administrativa=3.

Parados: unificado-homolog-mapa-realtime, mapa, pcp, armacao e qualidade;
containers mapa-homolog-postgrest-reader e writer; quatro timers antigos
unificado-homolog-tarefas-{ged,notify,outbox,suprimentos}. Suprimentos-homolog
permaneceu ativo por uso identificado. As paradas não desabilitam o retorno
no reboot; reavaliar a folga após uma reinicialização.

Rollback testado, com dados novos preservados:

```sh
ssh vps-concrefer 'python3 /opt/concrefer-unificado/backups/lab210-production-20261123T000518Z/rollback/release.py rollback'
```

- PR aberto para main: https://github.com/ricamaral01/pwa-hub/pull/11
- Branch enviada: feature/laboratorio-unidades-2.1.0.
- [Relatório completo](RELATORIO.html).
- [Auditoria final e concessões](execucao/final-audit.json).
- [Provas em produção](execucao/production-access.json).
- [Backup](execucao/backup.json) e [ensaio de restauração](execucao/rehearse.json).
- [Primeiro rollback](execucao/rollback.json): expectativa do teste PCP corrigida
  de 401 para o 403 histórico; segunda tentativa passou integralmente.

Base aprovada 53f77c6c. Fonte do candidato congelado: 1dac8f0f. Evidências:
318cea0d; integração com main, preservando seu Concrejet: c0520673.
O pacote publicado tem 44 arquivos conferidos por SHA-256. Manual e Ajuda
ficam em branch local separada, sem push, PR ou publicação em produção.

Importação inicial de leitura do ERP: 1.613 massadas Pederneiras e 829 Ribeirão,
sem sincronização automática. Os oito IDs incompletos continuam excluídos.
