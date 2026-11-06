# Entrega do GED no Unificado — versão 1.0.110

Publicado em 2026-11-06 sobre a versão 1.0.109. O frontend GED corrigido está na imagem `ged-concrefer-frontend:embedded-memory-v1`, descrita em `../ged-embedded-storage-fix/README.md`.

Esta entrega atualiza o indicador de versão do Unificado e adiciona `build=20261106-storage-1` à URL do iframe GED. Isso força a página a carregar o frontend novo após a atualização. `index.html`, `sw.js` e `VERSION` usam a versão 1.0.110 e o cache novo. Os cinco arquivos publicados estão em `/opt/concrefer-unificado/releases/20261106T-ged-storage-shell-1/stage`; os anteriores estão em `backup`.

Verificação no site publicado: o botão levou a tela 1.0.109 para 1.0.110, e Calibrações abriu para Ricardo e Ilson mesmo com o armazenamento local cheio. O site respondeu `1.0.110` em `/unificado/VERSION`.
