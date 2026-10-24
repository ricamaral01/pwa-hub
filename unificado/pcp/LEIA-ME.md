# PCP — cópia local de validação

As 24 pastas de páginas e os assets de `static/` foram obtidos por acesso somente leitura
de `/opt/pcp-concrefer/frontend/` em 02/10/2026. A importação reproduzível está em
`scripts/import_unificado_pcp.py`. A página de login antiga foi excluída; a cópia usa
`/unificado/login.html`. Arquivos de backup e `msgbox.*` também foram excluídos.

Os caminhos `/pages/` e `/static/` foram adaptados para esta cópia. Bibliotecas de CDN
foram substituídas por arquivos locais em `unificado/vendor/`. Na rota publicada de
testes, `scripts/build_unificado_pcp_frontend.py` mantém os manipuladores das 24 páginas,
substitui o bloqueio temporário de escrita por `unificado-bridge.js` e carrega a casca
`unificado-shell.css/.js`. A ponte envia `/api/` para `/unificado/pcp/api/` e rejeita
pedidos de dados a domínios oficiais. As gravações chegam apenas ao PostgreSQL PCP de
testes. O arquivo `readonly-guard.js` permanece na cópia local histórica, mas não é
servido nessas páginas.

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

O frontend está publicado em `https://concrefer.concretrack.com.br/unificado/pcp/`.
O login unificado abre a sessão PCP e encaminha para as páginas. Com contas sintéticas
ADMIN, PCP, PRODUCAO e CONSULTA, as 24 URLs responderam HTTP 200; 23 telas normais
receberam a casca e `primeiro-acesso` redirecionou quando a conta já tinha acesso
normal. As permissões existentes redirecionaram `teste-programacao` e `usuarios` para
os três perfis sem ADMIN. Foram 49/47/47/47 respostas de API 2xx, sem chamadas
externas, erros de página ou pedidos para `/api/` fora da ponte. A comparação de
impressões e os testes de gravação por tela ainda faltam.
