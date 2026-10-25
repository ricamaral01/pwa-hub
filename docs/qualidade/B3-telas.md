# B3 — telas da Qualidade

**Data:** 15/10/2026. **Estado:** SPA construída e revisada visualmente com dados sintéticos; build publicado no destino sob `auth_request`, sem liberação no menu. React 18 + TypeScript + Vite, base `/unificado/qualidade/`, arquivos em `unificado/qualidade/frontend` e build em `unificado/qualidade/dist`.

O contrato de dados foi fixado primeiro em [OpenAPI B2](B2-openapi.json). A SPA usa o prefixo público `/unificado/qualidade/api/`; só o seletor de usuários usa a rota Flask `/unificado/mapa/api/unified/quality-users`. A API aplica permissões por operação. A UI também oculta botões sem grant para evitar ações sem saída.

| Tela | Referência de estrutura | Implementação | Captura local |
|---|---|---|---|
| Painel | `mockups/Main.dc.html` | KPIs, filtros, busca, lista, etapa, minhas pendências, prazo, nova NC | [painel.png](capturas-b3/painel.png) |
| Abertura | `mockups/Abertura.dc.html` | Três blocos, rascunho, classificação, evidência, mais detalhes recolhido, painel ISO | [abertura.png](capturas-b3/abertura.png) |
| Tratativa | `mockups/Tratativa.dc.html` | Seis etapas, contenção, 5 Porquês/Ishikawa, 5W2H, eficácia por rodadas, encerramento, histórico, comentários, anexo/PDF | [tratativa.png](capturas-b3/tratativa.png) |
| Abertura rápida | `mockups/Mobile.dc.html` | Descrição, área, foto, segregação, registro com título/data automáticos | [abertura-mobile.png](capturas-b3/abertura-mobile.png) |

As capturas foram geradas em Chromium local com dados sintéticos; não são evidência de sessão, banco ou Nginx em produção. A captura mobile usa viewport de 390 × 844; os controles têm altura mínima de 44 px. Os PNGs finais dos mockups ainda dependem de Ricardo, conforme decisão de 15/10; os `.dc.html` orientaram estrutura/textos nesta revisão.

**Limites conhecidos:** a leitura de QR do lote permanece oculta até B4 comprovar contrato confiável. A seleção de setor/produto PCP depende da integração B4; a abertura atual exige área Qualidade para indicar onde ocorreu. Fotos ficam pendentes de confirmação integrada no banco/arquivo. Os cadastros de contatos para SMTP estão na quarta tela administrativa, sob `qualidade.nc.cadastros`. O menu e a navegação da casca mantêm Qualidade invisível até o lote 2, conforme decisão; a URL direta protegida depende de sessão, bootstrap e grants explícitos.

**Verificações:** `npm ci --ignore-scripts` e `npm run build` passaram. Chromium abriu painel, abertura, tratativa e abertura rápida com respostas HTTP sintéticas sem erro de renderização. Após publicação, página e API negaram sessão ausente com 401; a regressão PCP, Mapa e Laboratório passou 7/7. O teste real em tablet/celular, a comparação final lado a lado com PNGs e o ensaio funcional completo integram B5.
