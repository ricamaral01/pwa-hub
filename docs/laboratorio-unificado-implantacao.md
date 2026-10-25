# Laboratório no unificado — 0.6.27

- URL: `https://concrefer.concretrack.com.br/unificado/laboratorio/`.
- Serviço oficial preservado: `monitor-concreto.service`, porta 8088, `/opt/monitor_concreto`, publicado também em `https://concrefer.concretrack.com.br:18445/`. Nginx: site `concrefer.concretrack.com.br`.
- Segunda instância: `laboratorio-unificado.service`, porta local 13064, um worker, código em `/opt/concrefer-unificado/laboratorio/service`. Proxy em `/etc/nginx/snippets/laboratorio-unificado.conf`.
- Desde 07/10, o unificado usa a cópia isolada `concretrack_postes_unificado`; o oficial segue em `concretrack_postes`. O diretório `/opt/monitor_concreto/data` é somente leitura para a segunda instância. O serviço oficial permanece o único escritor de NDJSON, configurações e eventos de coletores.
- Os IDs ativos `user-ricardo` e `ricardo.teste` recebem papel `admin` no módulo. `ricardo.teste` já possui Planejamento ADMIN e Produção GERENCIA. A autorização e a identidade assinada têm validade curta; os segredos ficam fora do repositório. O cookie `ct_session` do serviço oficial não foi alterado.
- Salvar configuração, registrar evento e enviar foto de não conformidade estão desabilitados no módulo, com link para a tela oficial. Fotos ficam em `/opt/monitor_concreto/data/postes_uploads`; a segunda instância só as lê.
- Antes e depois da publicação: serviço oficial PID 3475421, iniciado em 2026-10-04 16:22:23 UTC; último NDJSON `data/readings/cura-01/2026/10/2026-10-04.ndjson`, 31.795 bytes, mtime epoch 1791140168; POST `/api/v1/ingest` sem chave HTTP 401. Nenhuma leitura de teste foi enviada.
- Última ingestão autorizada vista no log desde 2026-10-04: 2026-10-04 18:56:08 UTC, HTTP 200. Há erros preexistentes de `RecursionError` em laudos no serviço oficial em 2026-10-06; relatórios e PDF testados pela segunda instância retornaram HTTP 200.
- Rascunho de teste criado no mesmo banco: amostra `LAB-TESTE-20261007-01`, ID `c9bc9c40-aa61-46a4-bed6-655a08f72aa5`. A aplicação não oferece remoção de ensaio; o rascunho foi mantido para identificação.
- Falta validação com login digitado por Ricardo e conferência visual do rascunho na interface oficial `/postes`; as verificações automatizadas usaram sessão assinada válida gerada para o ID confirmado.

## Atualização de 07/10/2026 — limites dimensionais isolados

O Laboratório unificado agora usa `concretrack_postes_unificado`, cópia inicial
do banco `concretrack_postes` com 13 ensaios. O serviço antigo continua usando
`concretrack_postes`; a configuração e o serviço antigos não foram alterados.
A versão 4 dos critérios no banco novo reúne os modelos A.1/A.2 já cadastrados,
as cotas F/J/e antes presentes no frontend e a fonte ABNT NBR 8451-2:2020.
Os ensaios finalizados conservam seus snapshots de critérios e limites.

## Conferência de 08/10/2026

A configuração observada no processo `laboratorio-unificado.service` aponta
para `concretrack_postes`, divergindo da cópia isolada descrita acima. A
homologação criada nesta data usa `concretrack_postes_homolog`, clonada do banco
realmente usado pelo processo. A divergência de produção exige uma decisão
separada antes de qualquer troca de banco, para preservar os ensaios recentes.
