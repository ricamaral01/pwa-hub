# U06 — Interface nativa de leitura no Unificado

**Resultado:** `/unificado/usinas/` em homologação apresenta receitas Campinas, busca, idade do espelho, detalhe de cada carta, histórico de revisões do grupo e impressão simples dentro do shell do Unificado. `GET /unificado/mapa/api/usina/receitas` consulta somente o espelho, exige sessão e permissão `usinasInicio` e informa `edicao_habilitada=false`. `nginx -t`, nove testes unitários e `node --check` dos dois scripts da página passaram. O teste visual isolado `visual_mock.cjs` passou lista, detalhe, histórico, busca e ausência de edição com dados fictícios; [captura sintética](captura-U06-sintetica.png). A consulta de todas as colunas do detalhe passou como `mapa_api_login` no banco de homologação; havia 265 linhas, 217 com revisão maior que 1. Sem sessão, a página responde 403 e a API 401. O menu existente ainda possui apenas “Visão geral”.

**Limite:** uma sessão autorizada não foi usada para teste visual real. A impressão é simples e não foi comparada pixel a pixel com a carta legada; revisões aparecem como histórico, sem edição. Não há massadas, estoque, CEC, Dashboard, etiquetas, relatórios nem equivalência de PWA. A [matriz de paridade](../../06-matriz-paridade.md) registra essas lacunas; a tela não deve ser apresentada como módulo Usinas completo.

**Publicação de leitura:** a página e a API foram instaladas no Unificado oficial em `https://concrefer.concretrack.com.br/unificado/?view=usinas/`. Um probe da API com o papel real de produção retornou 265 receitas e `edicao_habilitada=false`; sem sessão, página/API responderam 403/401. O teste visual com sessão real continua pendente. [Evidência](../DEPLOY-LEITURA-20261022.md).

## Pendências para aprovação

- Validar visualmente a lista com usuário autorizado da homologação e aprovar o desenho de navegação das próximas telas de leitura.
- Priorizar as funções da matriz de paridade e fornecer casos de referência para comparação de valores e impressão. Publicação no endereço oficial continua separada do aceite de homologação.
