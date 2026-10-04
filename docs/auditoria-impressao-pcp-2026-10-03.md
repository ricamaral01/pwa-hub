# Impressão PCP: oficial × cópia de testes

Em 03/10/2026, `tests/pcp/print_parity.py` abriu as páginas oficiais em **somente leitura** e as páginas publicadas em `/unificado/pcp/`, com o mesmo navegador, largura e credencial de perfil ADMIN. Todas as requisições ao oficial foram GET/HEAD. O teste esperou o carregamento dos dados antes de gerar cada PDF. Comparou, por página, tamanho físico, SHA-256 do texto extraído e SHA-256 dos pixels renderizados. Nenhum recurso externo foi requisitado pela cópia.

| Saída | Páginas | Texto e imagem iguais ao oficial | Hashes SHA-256 da imagem (prefixos, por página) |
|---|---:|---|---|
| FL-PRO-15, Setores 1/2, semana de 28/09/2026 | 1 | sim | `a05cb7e238b37132` |
| PCP Diário, período 29/09 a 03/10/2026 | 2 | sim | `57b911c3496cd921`, `7f42ccf81cd665e0` |
| Etiquetas padrão 95×40 mm, 02/10/2026, um par gerado | 2 | sim | `f61aa8ee347b300c`, `503e8232426df689` |

As três saídas tiveram HTTP 200, zero erro de página e zero requisição bloqueada. O arquivo completo de hashes e metadados do teste está em `.work-mapa-unificado/pcp-print/report.json`; os seis PDFs comparados estão no mesmo diretório de trabalho. A primeira rodada do PCP Diário mostrou diferença visual causada pela ausência local da fonte Inter carregada pelo oficial. A cópia agora serve a fonte localmente em `unificado/pcp/static/fonts/`, mantendo o conteúdo e a impressão originais.

O teste cobre estas datas e estas três saídas. As demais etiquetas, relatórios, filtros e opções de impressão ainda precisam de comparação própria antes da certificação integral.
