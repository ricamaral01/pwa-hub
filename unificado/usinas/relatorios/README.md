# Relatórios gerenciais de Usinas

As páginas desta pasta reproduzem o HTML e os estilos publicados em
`/var/www/concretrack-erp/public/relatorios/` na VPS antiga em 04/11/2026.
Os caminhos de navegação e as consultas foram adaptados para `/unificado/`.
O shell carrega a página inicial ao abrir `?view=usinas%2F%3Farea%3Drelatorios`;
`unificado/usinas/index.html` encaminha cada `app` para sua página.

As consultas de Campinas usam `/unificado/mapa/api/usina/reporting/` e o
espelho `usinas_reporting` da VPS nova. A API exige sessão e permissão de
Usinas. Os relatórios PCP gerados são lidos da origem pela API autenticada,
sem acionar a rotina de geração. Ajustes de custo e geração manual de reports
continuam disponíveis somente no ERP antigo, pois são operações de escrita.

Ao atualizar os arquivos da origem, preservar a ponte de sessão, as URLs
internas do Unificado, o redirecionamento de acesso direto e as rotas de API.
Validar novamente filtros, dados, impressão, PDF, Excel, nova aba e recarga.
