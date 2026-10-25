# Manual visual do Suprimentos — entrega em homologação

Data: 25/10/2026. Ambiente: `https://concrefer.concretrack.com.br:18446`. Esta entrega não foi publicada em produção e não recebeu `git push`.

## Acesso dos usuários master

As contas IAM ativas `ricardo`, `marcelo` e `alex` receberam, somente no banco isolado do Suprimentos em homologação, os papéis ADMIN SUPRIMENTOS, APROVADOR N1 e APROVADOR N2 para Campinas, com `cc_id NULL` (todos os centros de custo da unidade). A concessão dos papéis de aprovador é necessária: o papel ADMIN, sozinho, não autoriza aprovação. A tela de acesso da casca permaneceu igual. O teste com assertions IAM assinadas e rotas reais confirmou **3/3 contas** com acesso ao módulo e ao bootstrap da API. A implementação reproduzível e sua conferência estão em `unificado/suprimentos/deploy/grant-masters-homolog.py` e `tests/suprimentos/check_master_homolog.py`.

## Arquivos entregues

| Arquivo | Conteúdo |
| --- | --- |
| `manual/manual-suprimentos.html` + `manual/img/` | Manual portátil, índice lateral clicável, botão Imprimir e ampliação das imagens. |
| `manual/manual-suprimentos.pdf` | O mesmo conteúdo em A4, **75 páginas**, sumário numerado, cabeçalho e rodapé. |
| `manual/fluxo-pedidos.mmd`, `.svg`, `.png` | Fluxograma completo em raias, incluindo fluxo S1 e fases futuras pontilhadas. |
| `manual/fluxo-pedidos-resumo.mmd`, `.svg`, `.png` | Caminho principal simplificado para o resumo. |
| `manual/capturas.json` | Índice das capturas e dos marcadores explicados no texto. |
| `manual/dados-demo.json` | IDs das nove solicitações e do centro de custo de demonstração. |
| `manual/build_manual.py`, `manual/render_manual_pdf.py` | Geração reproduzível de HTML e PDF. |
| `manual/revisao/contato-01.png` a `contato-07.png` | Revisão visual de todas as páginas renderizadas do PDF. |

O manual cobre **21 telas/estados**: 15 telas na casca em PC, tablet e celular, mais 6 estados do PWA em celular e tablet. São **57 capturas autenticadas** e 57 versões anotadas. Os papéis usados incluem solicitante, aprovador N1, almoxarife e administrador. O conteúdo distingue o que funciona em S1 das fases S2–S4, identificadas como ainda indisponíveis. Inclui RACI, instalação Android/iPhone, fluxo offline, estados do pedido, parâmetros e glossário.

## Acabamentos publicados somente em homologação

- O seletor, o trilho e o menu identificam Suprimentos por **SU** em teal `#2DD4BF`.
- O histórico web e PWA apresenta estados legíveis, ator, data e hora.
- O cartão de fotos vazio usa a linha discreta “Sem fotos anexadas”.
- O CSS e os recursos da homologação estão na versão **1.0.61**. A casca em produção e a árvore local de outras frentes têm versões próprias; não foram substituídas por esta entrega.

Publicação com backup e retorno automático preparados, `nginx -t` aprovado e smoke **43/43**. Backup do acabamento: `/opt/concrefer-unificado/homolog-next/backups/suprimentos-s1-20261025T222820Z/`. Backup do ajuste posterior de PWA/menu: `/opt/concrefer-unificado/homolog-next/backups/suprimentos-pwa-history-20261025T224500Z/`. Backup das concessões master: `/opt/concrefer-unificado/homolog-next/backups/suprimentos-masters-20261025T222256Z/`. O primeiro ensaio de smoke revelou uma rota CSS protegida e acionou o retorno; os ensaios posteriores de sessão/dados de demonstração também retornaram automaticamente até a correção da fixture. A publicação final passou no smoke e no `nginx -t`.

## Dados de demonstração

O centro de custo `DEMO-MANUAL-20261025` e as solicitações `SOL-00006` a `SOL-00014` cobrem rascunho, aprovação N1/N2, devolução, aprovação concluída, entrega parcial, entregue, concluída e reprovada. Há diferentes urgências, “Parou produção”, item livre e foto sintética de luva. A imagem é uma ilustração gerada para o exemplo, não um registro real. Os dados permanecem somente em homologação para os testes. O script `unificado/suprimentos/deploy/manual-demo-homolog.py` inclui a remoção seletiva desses registros; ela não foi executada porque os exemplos devem continuar disponíveis.

## Conferência

- Regressão local E1–E7: **21 testes aprovados**.
- Smoke autenticado após a publicação: **43/43 verificações**.
- Capturas: **57/57** concluídas, sem erro JavaScript do módulo, recurso ausente ou marcador faltante nos estados capturados.
- PDF: **75/75 páginas** renderizadas e revistas em sete folhas de contato. Nenhuma página vazia, imagem cortada ou sobreposição de texto observada. A seção de instalação foi ajustada para conter as imagens do PWA em duas páginas. O sumário aponta para as páginas de início corretas.
- O HTML permite ampliar capturas para leitura de detalhes; no PDF as telas de PC estão acima das de tablet e celular.

## Uso para o treinamento

- Casca: `https://concrefer.concretrack.com.br:18446/unificado/?view=suprimentos/painel/`
- PWA: `https://concrefer.concretrack.com.br:18446/unificado/suprimentos/pwa/`
- As contas master já podem testar. Outras pessoas precisam de concessão no IAM e de papéis do Suprimentos conforme a sua atuação.

Pendente para a equipe de Campinas: preencher a coluna “Pessoa em Campinas” da matriz RACI e confirmar os valores de alçadas e parâmetros antes de usar o manual como norma operacional. A instalação do PWA depende dos menus da versão de Android/iOS; o manual contém os passos e links oficiais de [Chrome para Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid) e [Safari no iPhone](https://support.apple.com/en-eg/guide/iphone/iphea86e5236/ios).
