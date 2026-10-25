# Fase 2 — fonte nova e certificado A4

**Concluído em 24/10/2026 (horário de São Paulo; VPS em 25/10 UTC).** Homologação em `:18446` e produção publicadas com `CQ_FONTE_CP=novo`. A emissão comercial está bloqueada enquanto o cadastro da prensa não tiver o nome real do laboratório calibrador/RBC.

## Fonte e conferência independente

- O Controle Estatístico novo da VPS usa `cec-campinas-api.service`, `127.0.0.1:3086`, banco `controle_est_concre_campinas`, com `data_moldagem`, traço, idade, CP, MPa e data de ruptura. `source.py` permite `CQ_FONTE_CP=novo|antigo`; produção e homologação estão em `novo`. A alternativa antiga continua disponível para retorno operacional. Nenhuma credencial foi adicionada ao Git.
- O critério original de dez certificados legados foi substituído por decisão do Ricardo, pois o histórico legado inclui datas de 2025 e a fonte de CPs começa em 05/01/2026. O único par comparável, `CQ-20260326-153230`, bateu nas três leituras: **33,00 MPa aos 28 dias** e não conforme para fck 35.
- Dez datas de 2026 com 28 dias foram recalculadas por SQL direto em `rompimentos_atuais`: **10/10** iguais ao módulo em número de CPs, médias de 3/7/28 dias, traço escolhido e resultado. O cálculo passou a usar `Decimal` após quatro diferenças iniciais de 0,01 MPa por `float`. Evidência: `evidencias/comparacao-fontes-20261024.json`.
- Nos últimos 90 dias, as fontes antiga e nova retornaram **222 leituras cada**, sem datas ausentes ou diferenças nos campos conferidos. Rascunhos recalculam pela fonte ativa; emitidos preservam PDF, resultados e SHA-256.
- O cadastro de origem não informou o laboratório calibrador da prensa Kratos IK-14 A/P. Valor vazio ou “Não informado” retorna **HTTP 422** ao emitir, com instrução para completar o cadastro. Nenhum nome foi inventado.

## Comparação visual do PDF com os mockups aprovados

Referências: `mockups/png/03-certificado-a4.png` (10 datas), `mockups/png/03b-certificado-a4-poucas-linhas.png` (3 datas) e `mockups/fonte/03-certificado-a4.html`. A renderização foi comparada lado a lado em 1, 3 e 10 datas, com PNGs A4 de 1588 × 2246 px gerados a partir dos PDFs reais de `:18446`:

| Datas | Comparação lado a lado | PDF e PNG de homologação |
| --- | --- | --- |
| 1, referência compacta de até 5 datas | [Mockup × resultado](evidencias/comparacao-pdf-1-datas.png) | [PDF](exemplos/fase2-homolog-rascunho-1-datas-id30.pdf) · [PNG](exemplos/fase2-homolog-rascunho-1-datas-id30.png) |
| 3 | [Mockup × resultado](evidencias/comparacao-pdf-3-datas.png) | [PDF](exemplos/fase2-homolog-rascunho-3-datas-id31.pdf) · [PNG](exemplos/fase2-homolog-rascunho-3-datas-id31.png) |
| 10 | [Mockup × resultado](evidencias/comparacao-pdf-10-datas.png) | [PDF](exemplos/fase2-homolog-rascunho-10-datas-id32.pdf) · [PNG](exemplos/fase2-homolog-rascunho-10-datas-id32.png) |

| Elemento do mockup | Verificação no PDF gerado |
| --- | --- |
| Cabeçalho e cliente | Logo real, título e subtítulo ABNT NBR 8451, quadro Nº/Revisão/Emissão e Cliente/NF/Entrega/Unidade. |
| Produtos | Grade `#9AA6B4` de 0,75 pt (aproximadamente 1 px), cabeçalho `#E9EEF4`, Modelo à esquerda com 38% da largura, demais colunas centralizadas; sete colunas pedidas e “Total de postes”. Altura/carga inteiras e peso com milhar (`1.530` no teste de emissão). |
| Resistência | Sete colunas pedidas, sem Traço; 28 dias e CONFORME em negrito, resultado em maiúsculas. |
| Assinaturas e rodapé | Linhas das duas colunas na mesma altura; imagem do engenheiro acima da linha quando emitido. QR de aproximadamente 44 px para 6–10 datas e 92 px para até 5 datas, com o título ampliado. Link emitido usa `https://concrefer.concretrack.com.br/v/<nº>`. |
| Rascunho | Marca d’água RASCUNHO com opacidade de 6%, atrás das tabelas e legível. Os três exemplos têm uma página A4. |

Diferenças esperadas em relação às imagens de referência: os exemplos usam **dados reais** do Controle Estatístico novo e o logo real; estão em **rascunho**, portanto não exibem número definitivo nem a imagem de assinatura. Um teste visual local do caminho `issued=True`, sem gravar certificado no banco, confirmou a imagem da assinatura acima da linha e o domínio de produção no rodapé/QR. O mockup usa pesos fictícios; os **100 modelos ativos** importados estão sem `peso_kg` e mostram “—” no PDF. A lista nominal está em [modelos-sem-peso.md](modelos-sem-peso.md). A prensa mostra fielmente o placeholder do cadastro até a correção pelo gestor.

## Publicação e retorno

- Testes automatizados selecionados: **17 passaram** (`test_core_pdf.py`, `test_source.py`, `test_gateway_catalog.py`); incluem uma página em 1/5/6/10 datas, fonte nova, arredondamento, colunas/formatos do PDF, peso ausente e URL de verificação. Os três exemplos de homologação foram baixados novamente após o último ajuste do PDF; emissão de exemplo com RBC não informado permaneceu bloqueada em **422**. Homologação: Nginx válido, serviço ativo, gate geral **7/7**. Backup final: `/opt/concrefer-unificado/homolog/backups/cq-phase2-20261025T013445Z`.
- A primeira tentativa anterior de produção foi revertida automaticamente após erro de permissão na leitura do ambiente protegido durante a importação legada. O importador de uso único foi corrigido para ler esse arquivo como root, sem registrar nem copiar a senha, e ensaiado em homologação com retorno idempotente de zero importações. Backup da tentativa revertida: `/opt/concrefer-unificado/backups/cq-production-20261025T003053Z`.
- A **nova tentativa autorizada** passou em produção: backup do banco e snapshot de permissões, migrações, importação de **8** certificados históricos, serviço `cq-laboratorio.service` ativo, Nginx válido, acesso `www-data`, nenhuma permissão 777/666 nos arquivos tocados, smoke e gate geral **7/7**. Backup: `/opt/concrefer-unificado/backups/cq-production-20261025T013559Z`. O procedimento contém retorno automático em erro; ele não foi acionado nesta tentativa.
- Conferência autenticada após implantação: bootstrap **200**, configuração **200**, `fonte_cp=novo`, **100** modelos e **1** prensa. A rota sem sessão redireciona ao login (**302**). O campo RBC da prensa continua “Não informado no cadastro de origem”; a emissão permanece bloqueada como solicitado.

## Git e pendências

- Produção parte de `origin/feat/sistema-unificado` (`c38fe79f`); o módulo está em `feat/laboratorio-certificado-producao`, sem merge em `main`. A reconciliação de `main` continua pendente em trabalho separado.
- Para liberar a emissão, preencher no cadastro da prensa o **nome real do laboratório calibrador/RBC**. Completar `peso_kg` dos modelos quando os dados forem conhecidos; nenhum peso foi estimado.
- A senha fixa da trilha `db/*.py` do sistema antigo continua pendente de troca pelo proprietário da integração; não foi usada nesta implantação.
