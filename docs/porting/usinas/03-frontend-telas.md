# Frontend, telas e comportamento

Inventário estático de 44 arquivos HTML ativos em `/var/www/concretrack-erp/public` em 22/10/2026. Rotas abaixo relativas a `/concretrack/`. Cada item lista elementos declarados no HTML; conteúdo montado por JavaScript pode acrescentar campos ou ações.

## Capturas

Foram capturadas 12 telas principais em 1440×900 e 820×1180 (24 imagens), além do login em desktop e tablet, na pasta [telas](telas/). Para evitar acesso a dados reais e sem credenciais de aplicação, o navegador recebeu uma resposta **simulada apenas para `GET /auth/me`** com perfil administrador; as demais APIs permaneceram reais e responderam sem sessão. As imagens mostram layout e navegação, não validam dados nem autorização de ponta a ponta. A tela CEC Análise redirecionou ao serviço externo de controle estatéstico.

## Mapa de telas

| Tela | Rota | Título / finalidade declarada | Capturas |
|---|---|---|---|
| cadastros/agregados/index.html | `/cadastros/agregados/index.html` | Cadastro de Agregados • ConcreTrack | — |
| cadastros/agregados-config/index.html | `/cadastros/agregados-config/index.html` | Customização de Agregados • ConcreTrack | — |
| cadastros/cartas-traco/consulta.html | `/cadastros/cartas-traco/consulta.html` | Consulta Cartas de Traço • ConcreTrack | — |
| cadastros/cartas-traco/detalhe.html | `/cadastros/cartas-traco/detalhe.html` | Carta de Traço • ConcreTrack | — |
| cadastros/cartas-traco/index.html | `/cadastros/cartas-traco/index.html` | Cartas de Traço • ConcreTrack | [desktop](telas/cartas-traco-desktop.png), [tablet](telas/cartas-traco-tablet.png) |
| cadastros/cartas-traco/mapeamento/index.html | `/cadastros/cartas-traco/mapeamento/index.html` | Mapeamento de Campos • Cartas de Traço • ConcreTrack | — |
| cadastros/index.html | `/cadastros/index.html` | Cadastro • ConcreTrack | — |
| cadastros/mapeamento-misturador/index.html | `/cadastros/mapeamento-misturador/index.html` | Mapeamento do Misturador • ConcreTrack | — |
| cadastros/pcp/index.html | `/cadastros/pcp/index.html` | PCP • ConcreTrack | [desktop](telas/pcp-desktop.png), [tablet](telas/pcp-tablet.png) |
| cadastros/pcp/ordens/index.html | `/cadastros/pcp/ordens/index.html` | Ordens de Entrega • PCP • ConcreTrack | — |
| cadastros/pcp/programacao/index.html | `/cadastros/pcp/programacao/index.html` | Programação de Produção • PCP • ConcreTrack | — |
| cadastros/produto/index.html | `/cadastros/produto/index.html` | Cadastro de Produto • ConcreTrack | — |
| cec/analise/index.html | `/cec/analise/index.html` | Analise CEC • ConcreTrack | [desktop](telas/cec-analise-desktop.png), [tablet](telas/cec-analise-tablet.png) |
| cec/etiquetas/index.html | `/cec/etiquetas/index.html` | Etiquetas CP • ConcreTrack | — |
| cec/index.html | `/cec/index.html` | Controle Estatístico do Concreto • ConcreTrack | [desktop](telas/cec-desktop.png), [tablet](telas/cec-tablet.png) |
| cec/leitura/index.html | `/cec/leitura/index.html` | Leitura CP • ConcreTrack | — |
| cec/relatorio/index.html | `/cec/relatorio/index.html` | Relatório CEC • ConcreTrack | — |
| cec/resultados/index.html | `/cec/resultados/index.html` | Resultado Corpos de Prova • CEC • ConcreTrack | — |
| estoque/acerto/index.html | `/estoque/acerto/index.html` | Acerto de Estoque • ConcreTrack | — |
| estoque/consumo/index.html | `/estoque/consumo/index.html` | Consumo e Previsao de Estoque - ConcreTrack | — |
| estoque/consumo-cimento/index.html | `/estoque/consumo-cimento/index.html` | Consumo de Cimento • ConcreTrack | — |
| estoque/entrada/index.html | `/estoque/entrada/index.html` | Entrada de Materiais • Estoque • ConcreTrack | [desktop](telas/entrada-desktop.png), [tablet](telas/entrada-tablet.png) |
| estoque/index.html | `/estoque/index.html` | Controle de Estoque • ConcreTrack | [desktop](telas/estoque-desktop.png), [tablet](telas/estoque-tablet.png) |
| estoque/mapeamento-agregados/index.html | `/estoque/mapeamento-agregados/index.html` | Mapeamento das Caixas - ConcreTrack | — |
| estoque/relatorio/index.html | `/estoque/relatorio/index.html` | Relatório de Consumo • Estoque • ConcreTrack | — |
| estoque/saldo/index.html | `/estoque/saldo/index.html` | Saldo de Estoque • ConcreTrack | — |
| handoff-pcp.html | `/handoff-pcp.html` | Handoff Completo - Concretrack ERP / PCP | — |
| index.html | `/index.html` | ConcreTrack • Painel Principal | [desktop](telas/painel-desktop.png), [tablet](telas/painel-tablet.png) |
| login.html | `/login.html` | Login • ConcreTrack | [desktop](telas/login-desktop.png), [tablet](telas/login-tablet.png) |
| mapa-aplicacao.html | `/mapa-aplicacao.html` | Mapa da Aplicação — ConcreTrack ERP | — |
| relatorios/cartas-traco/index.html | `/relatorios/cartas-traco/index.html` | Cartas Traços • ConcreTrack | — |
| relatorios/consumo/index.html | `/relatorios/consumo/index.html` | Consumo de Materiais • Relatório Gerencial • ConcreTrack | — |
| relatorios/custos/carta-slide/index.html | `/relatorios/custos/carta-slide/index.html` | Custo da carta de traço | — |
| relatorios/custos/comparar/index.html | `/relatorios/custos/comparar/index.html` | Comparação de Traços • Custos do Concreto | — |
| relatorios/custos/index.html | `/relatorios/custos/index.html` | Custos do Concreto • ConcreTrack | — |
| relatorios/exportar/index.html | `/relatorios/exportar/index.html` | Exportar Massadas • ConcreTrack | — |
| relatorios/fechamento/index.html | `/relatorios/fechamento/index.html` | Fechamento - Relatório Gerencial - ConcreTrack | [desktop](telas/dashboard-desktop.png), [tablet](telas/dashboard-tablet.png) |
| relatorios/fechamento-diario/index.html | `/relatorios/fechamento-diario/index.html` | Fechamento Diario | [desktop](telas/fechamento-diario-desktop.png), [tablet](telas/fechamento-diario-tablet.png) |
| relatorios/index.html | `/relatorios/index.html` | Relatório Gerencial • ConcreTrack | [desktop](telas/relatorios-desktop.png), [tablet](telas/relatorios-tablet.png) |
| relatorios/producao-periodo/index.html | `/relatorios/producao-periodo/index.html` | Producao por Periodo - Relatorio Gerencial - ConcreTrack | [desktop](telas/producao-periodo-desktop.png), [tablet](telas/producao-periodo-tablet.png) |
| relatorios/reports-diarios/index.html | `/relatorios/reports-diarios/index.html` | Reports Diários - ConcreTrack | — |
| test-auth.html | `/test-auth.html` | ConcreTrack — Test Auth | — |
| trocar-senha/index.html | `/trocar-senha/index.html` | Trocar senha • ConcreTrack | — |
| usuarios/index.html | `/usuarios/index.html` | Usuarios • ConcreTrack | [desktop](telas/usuarios-desktop.png), [tablet](telas/usuarios-tablet.png) |

## Campos, ações e APIs declaradas

### `cadastros/agregados/index.html`

Seções: Cadastro de Agregados, Agregados Cadastrados.
Campos/filtros: editId, fNome, fTipo, fUnidade, fDescricao, filtroTipo, filtroAtivo, mId, mNome, mTipo, mUnidade, mDescricao, mAtivo, delId.
Ações visóveis no HTML: Sair, Adicionar Agregado, Cancelar, Salvar, Excluir.
APIs literais: ver JavaScript dinâmico / integrações.

### `cadastros/agregados-config/index.html`

Seções: Customização de Agregados.
Campos/filtros: mId, mNome, mTipo, mUnidade, mDescricao, mAtivo.
Ações visóveis no HTML: Instalar, Todos, Areia, Brita / Pedra, Coque, Adição Filler, Pó de Pedra, Outro, Ativar todos, Desativar todos, Novo, Excluir, Cancelar, Salvar.
APIs literais: ver JavaScript dinâmico / integrações.

### `cadastros/cartas-traco/consulta.html`

Campos/filtros: statusFilter, searchInput.
Ações visóveis no HTML: Sair.
APIs literais: `/concretrack/api/tracos`, `/concretrack/api/tracos/${id}/ativa`.

### `cadastros/cartas-traco/detalhe.html`

Campos/filtros: toggleAtiva.
Ações visóveis no HTML: Imprimir, Nova Revisão, Sair.
APIs literais: `/concretrack/api/tracos/`.

### `cadastros/cartas-traco/index.html`

Campos/filtros: nomeTraco, obsRevisao, alteradoPor, cimento, adicao1, areia1, areia2, areia3, brita1, brita2, aditivo1, aditivo2, agua.
Ações visóveis no HTML: Sair, Salvar Carta de Traço.
APIs literais: `/concretrack/api/tracos`, `/concretrack/api/tracos/`.

### `cadastros/cartas-traco/mapeamento/index.html`

Seções: Mapeamento de Campos, Campos do Traço × Material do Estoque.
Campos/filtros: cfgId, cfgColuna, cfgLabel, cfgMaterial.
Ações visóveis no HTML: Sair, Atualizar, Cancelar, Salvar.
APIs literais: ver JavaScript dinâmico / integrações.

### `cadastros/index.html`

Seções: Módulo de Cadastro.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: ver JavaScript dinâmico / integrações.

### `cadastros/mapeamento-misturador/index.html`

Seções: Mapeamento do Misturador, Posições x Material do Estoque.
Campos/filtros: cfgId, cfgColuna, cfgLabel, cfgMaterial, cfgFator.
Ações visóveis no HTML: Sair, Atualizar, Cancelar, Salvar.
APIs literais: ver JavaScript dinâmico / integrações.

### `cadastros/pcp/index.html`

Seções: PCP — Planejamento e Controle da Produção.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: ver JavaScript dinâmico / integrações.

### `cadastros/pcp/ordens/index.html`

Seções: Programado vs Realizado.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair, Imprimir.
APIs literais: `/concretrack/api/pcp/ordens`.

### `cadastros/pcp/programacao/index.html`

Seções: Programação Semanal — Setores.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair, Salvar Programação, Imprimir.
APIs literais: `/concretrack/api/pcp`.

### `cadastros/produto/index.html`

Seções: Cadastro de Produtos, Novo Produto, Produtos Cadastrados.
Campos/filtros: fCod, fNome, fDesc, filtAtivo, eCod, eNome, eDesc, eAtivo.
Ações visóveis no HTML: Sair, Salvar, Limpar, Cancelar.
APIs literais: ver JavaScript dinâmico / integrações.

### `cec/analise/index.html`

Seções: Analise CEC.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: links ou ações montadas por JavaScript.
APIs literais: ver JavaScript dinâmico / integrações.

### `cec/etiquetas/index.html`

Seções: Geração de Etiquetas.
Campos/filtros: fAno, fMes, fDia, inputIdade.
Ações visóveis no HTML: Sair, Buscar, Adicionar, Gerar Etiquetas, PDF (90×40mm), Imprimir.
APIs literais: `/concretrack/api/massadas`.

### `cec/index.html`

Seções: CEC — Controle Estatístico do Concreto.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: ver JavaScript dinâmico / integrações.

### `cec/leitura/index.html`

Campos/filtros: inputMPa.
Ações visóveis no HTML: Instalar, ×, Iniciar, Salvar Leitura, Nova Leitura.
APIs literais: ver JavaScript dinâmico / integrações.

### `cec/relatorio/index.html`

Seções: Relatório CEC.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: ver JavaScript dinâmico / integrações.

### `cec/resultados/index.html`

Seções: Resultado Corpos de Prova.
Campos/filtros: filtroMes, filtroAno, filtroBusca.
Ações visóveis no HTML: Sair, Imprimir, Filtrar.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/acerto/index.html`

Seções: Acerto de Estoque, Historico de Acertos.
Campos/filtros: acertoFisico, acertoObs.
Ações visóveis no HTML: Sair, Silo 1, Silo 2, Silo 3, Confirmar Ajuste, Cancelar.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/consumo/index.html`

Seções: Base de Consumo.
Campos/filtros: dataIni, dataFim, grupoFiltro, materialFiltro.
Ações visóveis no HTML: Sair, Sincronizar consumos, Atualizar.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/consumo-cimento/index.html`

Seções: ConcreTrack • Cimento, Nível e consumo por silo, Consumo diário por silo, Projeção de saldo ao fim do dia • próximos 10 dias úteis.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Atualizar.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/entrada/index.html`

Seções: Nova Entrada de Material, Registrar Nova Entrada, Últimas Entradas.
Campos/filtros: fMaterial, fotoNF, arquivoNF, fData, fFornecedor, fNF, fQtd, fUnidade, fRatearSilos, fSiloId, fValorNota, fIcmsPerc, fValorFrete, fIcmsFrete, fObs, fConfirmouNF.
Ações visóveis no HTML: Sair, Tirar foto, Escolher arquivo, Dividir igualmente, Limpar, Salvar Entrada.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/index.html`

Seções: Controle de Estoque de Insumos, Entrada de Materiais, Saldo de Estoque, Relatório de Consumo, Consumo de Agregados, Consumo de Cimento, Mapeamento das Caixas, Acerto de Estoque.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/mapeamento-agregados/index.html`

Seções: Caixas de Agregados.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair, Atualizar, Salvar todas.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/relatorio/index.html`

Seções: Relatório de Consumo de Materiais, Consumo por Posicao do Misturador, Detalhamento por Produto, Entradas, Consumos e Acertos.
Campos/filtros: fDini, fDfim, fProduto.
Ações visóveis no HTML: Sair, Gerar, Imprimir, Consumo da Producao, Movimentos do Estoque.
APIs literais: ver JavaScript dinâmico / integrações.

### `estoque/saldo/index.html`

Seções: Saldo Atual de Estoque, Movimentos.
Campos/filtros: filtCat.
Ações visóveis no HTML: Sair, Atualizar, Sincronizar Produção.
APIs literais: ver JavaScript dinâmico / integrações.

### `handoff-pcp.html`

Seções: Handoff completo — Concretrack ERP / PCP, 1. Onde a aplicação está hospedada, 2. Arquitetura da aplicação, 3. Bancos e conexões usadas, Principais tabelas / estruturas, 4. Arquivos principais do projeto, 5. Inventário completo de arquivos, 6. Comandos operacionais úteis, 7. Pontos de atenção para handoff.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: links ou ações montadas por JavaScript.
APIs literais: `/concretrack/api/health`.

### `index.html`

Seções: Bem-vindo ao ConcreTrack, Painel Usina, Cadastro, PCP, Controle Estatístico, Relatório Gerencial, Controle de Estoque, Usuarios e Alcadas.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: `/concretrack/api/health/home-metrics`.

### `login.html`

Seções: ConcreTrack, ConcreTrack.
Campos/filtros: username, password.
Ações visóveis no HTML: Entrar.
APIs literais: `/concretrack/api/auth/login`, `/concretrack/api/auth/me`.

### `mapa-aplicacao.html`

Seções: ConcreTrack ERP — Mapa da Aplicação.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: links ou ações montadas por JavaScript.
APIs literais: `/api/usina/dashboard`, `/concretrack/api/health`, `/concretrack/api/massadas`, `/concretrack/api/massadas/xlsx`, `/concretrack/api/tracos`, `/concretrack/api/tracos/{id}`, `/concretrack/api/tracos/{id}/ativa`.

### `relatorios/cartas-traco/index.html`

Seções: Cartas Traços Gerencial, Cartas cadastradas, Selecione uma carta.
Campos/filtros: fDataIni, fDataFim, fBusca, fAtivas.
Ações visóveis no HTML: Sair, Filtrar, Imprimir, CSV.
APIs literais: `/concretrack/api/relatorios/cartas-traco`.

### `relatorios/consumo/index.html`

Campos/filtros: fDataIni, fDataFim, fProduto, fFormula.
Ações visóveis no HTML: Sair, Filtrar, Limpar, Todos, Agregados, Cimento, Água, Aditivos, Imprimir, Exportar CSV, Exportar Excel.
APIs literais: `/concretrack/api/relatorios/consumo`.

### `relatorios/custos/carta-slide/index.html`

Seções: Custo da carta de traço.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: links ou ações montadas por JavaScript.
APIs literais: `/concretrack/api/relatorios/cartas-traco`.

### `relatorios/custos/comparar/index.html`

Seções: Comparação de Traços, Comparar custos entre 2 ou 3 traços, Custo total por traço, Participação percentual, Composição de custos por material, Projeção de impacto financeiro, Análise automática, Detalhamento comparativo.
Campos/filtros: sel1, sel2, sel3.
Ações visóveis no HTML: Atualizar dados, Comparar.
APIs literais: ver JavaScript dinâmico / integrações.

### `relatorios/custos/index.html`

Seções: Custos do Concreto, Gestão de custos, Custos contabilizados, Participação dos materiais, Custo por carta de traço, Evolução dos custos, Histórico de ajustes, Ajustar custo gerencial.
Campos/filtros: selCarta, selMaterial, fValor, fData, fMotivo.
Ações visóveis no HTML: Atualizar, Materiais e ajustes, Cartas de traço, Evolução mensal, Comparar traços, Cancelar, Salvar ajuste.
APIs literais: ver JavaScript dinâmico / integrações.

### `relatorios/exportar/index.html`

Campos/filtros: dataIni, dataFim.
Ações visóveis no HTML: Sair, Filtrar, Exportar PDF, Exportar XLSX.
APIs literais: `/concretrack/api/massadas/xlsx?`, `/concretrack/api/massadas?`.

### `relatorios/fechamento/index.html`

Seções: Fechamento, Volume de Concreto - Campinas, ConcretoNormal, ConcretoEspecial, Concreto Obra, Comparativo Mês a Mês, Comparativo Anual, Dias Trabalhados, Resumo de paradas e problemas, INDICADORES USINA, INDICADORES USINA.
Campos/filtros: analysisMonth.
Ações visóveis no HTML: Sair, Atualizar.
APIs literais: `/concretrack/api/relatorios/fechamento?ano`.

### `relatorios/fechamento-diario/index.html`

Seções: Fechamento Diario, Fontes, Texto para envio.
Campos/filtros: dataRel, shareText.
Ações visóveis no HTML: Sair, Atualizar, PDF, WhatsApp, Telegram, Imprimir.
APIs literais: `/concretrack/api/relatorios/fechamento-diario?data`.

### `relatorios/index.html`

Seções: Relatórios Gerenciais.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: ver JavaScript dinâmico / integrações.

### `relatorios/producao-periodo/index.html`

Seções: Producao por Periodo, Resumo do Periodo, Fatores de Queda de Ritmo, Top 10 Gaps (12+ min), Gaps por Hora do Dia, Uso dos Misturadores, Tempo de Batida (hora_final - hora_inicio), Atraso Hora a Hora (vs meta), Ciclos entre Massadas (min), Produtividade Media a cada 15 min (m3/h), Tempo de Batida por Massada (min), Distribuicao dos Ciclos, Previsto vs Realizado por Hora, Tabela Atraso Hora a Hora, Metricas de Constancia de Ritmo, Legenda.
Campos/filtros: fDini, fDfim, fProduto, fMeta.
Ações visóveis no HTML: Sair, Gerar Relatorio, Imprimir.
APIs literais: ver JavaScript dinâmico / integrações.

### `relatorios/reports-diarios/index.html`

Seções: Reports Diários.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Sair.
APIs literais: `/concretrack/api/relatorios/reports-diarios/pcp-producao/run?data`.

### `test-auth.html`

Seções: Teste Auth.
Campos/filtros: montados por JavaScript ou ausentes no HTML.
Ações visóveis no HTML: Login (mock), Me, Logout.
APIs literais: ver JavaScript dinâmico / integrações.

### `trocar-senha/index.html`

Seções: ConcreTrack.
Campos/filtros: senha_atual, nova_senha, confirmar_senha.
Ações visóveis no HTML: Salvar nova senha.
APIs literais: `/concretrack/api/auth/change-password`.

### `usuarios/index.html`

Seções: Usuarios e Alcadas.
Campos/filtros: nome_completo, email, usuario, senha, nivel_acesso, reset_user_id, reset_password.
Ações visóveis no HTML: Sair, Criar usuario, Cancelar, Salvar senha provisoria.
APIs literais: ver JavaScript dinâmico / integrações.

## UX a preservar

- Login, troca obrigatória de senha, visibilidade por perfil e feedback de erro do guard `assets/js/auth.js`.
- Filtros por data, produto, traço, setor e unidade nas telas de produção, estoque e relatórios; manter URL/estado ao navegar.
- Prévia/cálculo de consumo, custos e fechamento, exportações XLSX/CSV/PDF e impressão de cartas/etiquetas. Conferir formatos em testes visuais e de contrato.
- PWA: `manifest.json` e `sw.js` no módulo principal, além de service workers específicos para leitura CEC e configuração de agregados.
- Há redirecionamentos para serviços vizinhos; a integração nativa precisa trazer a navegação para o menu Usinas sem perder o contexto de unidade.

## Evidência e limite

- Dados acima provêm de leitura dos arquivos HTML e Playwright. `telas-inventario.json` guarda o inventário estático estruturado.
- As capturas não demonstram números de produção porque não foi usada sessão real da aplicação. Uma validação autenticada, somente leitura, permanece como tarefa antes de fechar a paridade visual.
