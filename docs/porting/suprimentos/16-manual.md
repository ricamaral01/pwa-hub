# F6 — Manual visual e fluxograma do Suprimentos

**Escopo:** Campinas, homologação `https://concrefer.concretrack.com.br:18446`; versão final `1.0.89`. Produção e VPS antiga não foram alteradas. Sem push.

## Entregas

| Artefato | Evidência |
|---|---|
| Manual HTML autocontido | [`manual/manual-suprimentos.html`](manual/manual-suprimentos.html): 33 seções de tela, índice clicável, imagens incorporadas e ampliáveis, botão Imprimir, resumo, RACI, PWA, situações, parâmetros e glossário. |
| PDF do mesmo HTML | [`manual/manual-suprimentos.pdf`](manual/manual-suprimentos.pdf): A4, 78 páginas, sumário paginado, cabeçalho e rodapé com versão, data e página. |
| Fluxograma completo | [`manual/fluxo-pedidos.mmd`](manual/fluxo-pedidos.mmd), [SVG](manual/fluxo-pedidos.svg), [PNG](manual/fluxo-pedidos.png). Raias: Solicitante, Aprovador N1, Aprovador N2, Almoxarife, Comprador, Qualidade e Sistema. A integração S4 está pontilhada. |
| Caminho resumido | [`manual/fluxo-pedidos-simplificado.mmd`](manual/fluxo-pedidos-simplificado.mmd), [SVG](manual/fluxo-pedidos-simplificado.svg), [PNG](manual/fluxo-pedidos-simplificado.png). |
| Capturas e marcas | [`manual/capturas.json`](manual/capturas.json) e [`manual/img/`](manual/img/): 93 capturas, 93 cópias anotadas, 279 marcadores localizados e explicados, zero erro JavaScript. Todas as telas web foram abertas pela casca com autenticação no PC 1440×900, tablet 820×1180 e celular 390×844; PWA no tablet e celular. |
| Conferência do PDF | [`manual/revisao/f6-paginas/`](manual/revisao/f6-paginas/) contém cada página renderizada em PNG; os dez [contatos visuais](manual/revisao/f6-contato-01.png) foram inspecionados. O verificador não encontrou página quase vazia, texto além do limite, imagem ausente ou marcador sem explicação. |

O HTML pode ser aberto sozinho sem rede: as imagens e as fontes usadas nas telas estão incorporadas. A versão SVG integral pode ser ampliada no HTML; impressa em A4, o fluxo completo é pequeno, por isso o caminho resumido aparece também em destaque.

## Dados DEMO da homologação

- O conjunto S1 existente cobre rascunho, N1, N2, devolvida, aprovada, entrega parcial, entregue, concluída e reprovada, incluindo **Parou produção**, item livre e foto. Manifesto local: [`manual/dados-demo.json`](manual/dados-demo.json).
- A F6 acrescentou um quarto fornecedor e quatro situações de homologação: homologado, condicional, suspenso e em qualificação, com avaliações de IQF. Acrescentou três OCs (aberta, atrasada e recebida), reserva de material, ficha de EPI confirmada e inventário com divergência. IDs em [`manual/dados-demo-f6.json`](manual/dados-demo-f6.json). A cotação F1 de três propostas foi mantida.
- Criador idempotente: [`seed-f6-demo-homolog.py`](../../../unificado/suprimentos/deploy/seed-f6-demo-homolog.py). Remoção protegida: [`cleanup-f6-demo-homolog.py`](../../../unificado/suprimentos/deploy/cleanup-f6-demo-homolog.py), em modo **plano** por padrão. O plano autenticado contabilizou 14 solicitações, 4 OCs, 4 fornecedores, 3 materiais DEMO-F2, 136 eventos e 1 arquivo privado; a execução exige backup externo recente e só opera no banco de homologação. **Não foi executada** porque os exemplos são necessários para a conferência e treinamento até a liberação final.

## Validação e publicação

- `pytest` integrado E1–F5: **37 passed** em banco descartável. As capturas têm zero erro de console e os 279 seletores de marca encontrados.
- Mermaid CLI (`mmdc`) renderizou os dois fluxogramas em SVG e PNG. O HTML e o PDF são gerados por [`build_manual_f6.py`](manual/build_manual_f6.py) e [`render_manual_pdf.py`](manual/render_manual_pdf.py); [`verify_manual_f6.py`](manual/verify_manual_f6.py) renderiza e verifica todas as 78 páginas.
- Publicação apenas de versão/cache na homologação: backup privado `backups/suprimentos-f6-manual-20261026T063000Z`, dump e snapshot de permissões 0600, `nginx -t`, smoke **43/43**. Retorno para `1.0.88` executado e reinstalação `1.0.89` em `backups/suprimentos-f6-manual-reinstall-20261026T064000Z`, novamente com smoke **43/43**. `VERSION`, `APP_VERSION` e cache do SW coincidem em `1.0.89`.
- Limites descritos claramente no manual: S4/Laboratório, e-mail, push e provedor de leitura automática da NF desligados. Alçadas e limites de gestão têm selo **a confirmar**. Nenhum dado foi publicado em produção.
