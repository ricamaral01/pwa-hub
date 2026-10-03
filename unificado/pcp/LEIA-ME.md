# PCP — cópia local de validação

As 24 pastas de páginas e os assets de `static/` foram obtidos por acesso somente leitura
de `/opt/pcp-concrefer/frontend/` em 02/10/2026. A importação reproduzível está em
`scripts/import_unificado_pcp.py`. A página de login antiga foi excluída; a cópia usa
`/unificado/login.html`. Arquivos de backup e `msgbox.*` também foram excluídos.

Os caminhos `/pages/` e `/static/` foram adaptados para esta cópia. Bibliotecas de CDN
foram substituídas por arquivos locais em `unificado/vendor/`. O arquivo
`readonly-guard.js` é carregado antes dos scripts das páginas e bloqueia requisições
HTTP de escrita durante a validação. Não remover esse bloqueio antes de homologar
o conjunto completo, inclusive autenticação e permissões.

Para abrir a cópia local, sirva a **raiz do repositório** e acesse
`http://127.0.0.1:8091/unificado/pcp/dashboard/`. As páginas exigem a sessão PCP;
o login unificado ainda está desativado. A cópia não deve ser considerada uma entrega
operacional ou publicada neste estado.
