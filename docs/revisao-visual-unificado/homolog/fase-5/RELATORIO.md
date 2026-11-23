# Fase 5 — Laboratório e Usinas — 1.4.11

Publicada somente na porta 18446. Fontes locais, tokens comuns, cabeçalhos, listas de acesso e tabelas foram aplicados às telas de Laboratório e Usinas. O frontend do Laboratório foi recompilado a partir do código-fonte; os arquivos servidos pela API de teste foram publicados separadamente, com backup e sem reiniciar serviços.

As 32 capturas válidas em `depois/` cobrem oito telas nas larguras 1440, 1024, 820 e 390. Sem erros HTTP/JavaScript, páginas vazias ou rolagem lateral do corpo. A Carta de Traço usa a rota existente `laboratorio/carta-traco/`; a tentativa com a rota inexistente `usinas/carta-traco.html` foi conservada em `rejected-route-probe.json`, sem criar rota ou ampliar permissão.

O teste de fluxo registrou e releu um CP identificado e salvou/releu uma Carta em Rascunho no banco isolado (`flow-results.json`). Foi necessário restaurar a leitura técnica do esquema `usinas_reporting` da cópia de homologação, com dump anterior; nenhuma concessão de usuário foi alterada. O teste foi corrigido para conferir o objeto `carta` do contrato já publicado.

Gate Modelo A: 7/7. Service worker: evidência em `service-worker.json`. Backup estático final: `/opt/concrefer-unificado/homolog-next/backups/visual-fase-5-20261118T231353Z`. Manifestos de arquivos públicos e assets do serviço estão nesta pasta. A auditoria de produção permanece sem diferenças.

As capturas são amostras de telas e não substituem a matriz final de todos os perfis, fluxos e módulos.
