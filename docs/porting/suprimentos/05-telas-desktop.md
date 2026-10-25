# E4 — Telas desktop e tablet

## Telas entregues

O frontend compartilhado está em `unificado/suprimentos/frontend/app.js` e `app.css`. Cada rota contém um HTML mínimo que carrega essa base: `painel/`, `solicitacoes/`, `solicitacao/`, `nova/`, `fornecedores/` e `cadastros/`. Navegação pela casca: `?view=suprimentos/<tela>/`.

- **Painel:** aprovação da pessoa logada (com atrasadas há mais de 24 h), atendimento (com urgentes/parou produção) e fila com Nº, solicitante/CC, resumo, urgência, situação e idade. Indicadores de compras/estoque/silos e botão de recebimento permanecem ocultos até suas fases.
- **Solicitações:** abas com contagem, filtros de busca, CC, urgência, origem e “só as que eu aprovo”; tabela rolável no próprio cartão; seleção e decisões em lote com quantidade/valor e verificação de alçada; explicação do valor estimado.
- **Detalhe:** dados, nível, itens, fotos privadas, histórico e comentário obrigatório para devolver/reprovar. Atende separar, entrega, confirmação, problema e solução conforme papel/estado.
- **Nova solicitação:** fluxo itens → detalhes → envio; material de catálogo ou descrição livre, quantidade/unidade, CC permitido pré selecionado quando único, urgência, justificativa, data e até três fotos.
- **Fornecedores e Cadastros:** busca, lista, formulário lateral, ativação/desativação, importação CSV com relatório linha a linha. Abas para materiais, medidas, locais, endereços, CC, alçadas, parâmetros, usuários/papéis e flags (esta apenas para ADMIN).

Estados vazios, carregando e erro estão presentes; ações tocam área mínima de 44 px no tablet. Datas são `dd/mm/aaaa`, valores usam `R$` e vírgula. O documento inteiro não rola horizontalmente em 1440 e 820 px; tabelas largas têm rolagem interna.

## Evidência de interface

O teste [test_e4_ui.py](../../../tests/suprimentos/test_e4_ui.py) usou Chromium/Playwright com API controlada para percorrer o fluxo de ponta a ponta na interface: solicitante cria e envia → aprovador nível 1 → nível 2 → almoxarife separa e entrega → solicitante confirma. As regras de negócio e o banco reais são cobertos pelos testes E2. O teste verificou ausência de erro e de rolagem horizontal e gravou capturas das seis telas em desktop e tablet.

| Tela | 1440 px | 820 px |
|---|---|---|
| Painel | [desktop](capturas/e4/painel-desktop.png) | [tablet](capturas/e4/painel-tablet.png) |
| Solicitações | [desktop](capturas/e4/solicitacoes-desktop.png) | [tablet](capturas/e4/solicitacoes-tablet.png) |
| Detalhe | [desktop](capturas/e4/solicitacao-desktop.png) | [tablet](capturas/e4/solicitacao-tablet.png) |
| Nova | [desktop](capturas/e4/nova-desktop.png) | [tablet](capturas/e4/nova-tablet.png) |
| Fornecedores | [desktop](capturas/e4/fornecedores-desktop.png) | [tablet](capturas/e4/fornecedores-tablet.png) |
| Cadastros | [desktop](capturas/e4/cadastros-desktop.png) | [tablet](capturas/e4/cadastros-tablet.png) |

`17 passed` na regressão E1–E4. A API de listagem recebeu filtro de CC e resumo de itens em uma consulta agregada por página. A homologação real da casca e dos dados continua reservada à E7.
