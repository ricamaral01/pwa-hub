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

O backend PCP copiado está publicado apenas como API de testes em
`https://concrefer.concretrack.com.br/unificado/pcp/api/`. Sem autenticação,
as rotas de leitura protegidas devolvem `403`. O serviço usa o PostgreSQL PCP
copiado e, para as leituras antes endereçadas ao Supabase, um PostgREST local
sobre o PostgreSQL do Mapa de testes. A tabela `producao_diaria` está vazia por
decisão do usuário. Consulte `docs/fontes-externas-pcp-unificado.md` e
`docs/registro-etapas-unificacao-2026-10-03.md` para as verificações e pendências.
O backend em `unificado/pcp/backend/` e na VPS de testes voltou a ser uma cópia
byte a byte dos 47 arquivos oficiais, conforme `scripts/verify_pcp_backend_identity.py`.
A seleção temporária da planilha de outubro usada no teste foi revertida; para
outubro, a regra original ainda escolhe agosto. O runtime de testes usa Python
3.10 como o oficial, sem editar consultas ou regras do backend.

Para abrir a cópia local do frontend, sirva a **raiz do repositório** e acesse
`http://127.0.0.1:8091/unificado/pcp/dashboard/`. As páginas exigem a sessão PCP;
o login unificado do PCP ainda está desativado. O frontend PCP não foi publicado
na VPS e a API publicada não libera operação pelas páginas neste estado.
