# Preparação da validação da equipe — versão 0.5.12

Ambiente exclusivo de testes: `https://concrefer.concretrack.com.br/unificado/testar/`.
Não houve virada, redirecionamento ou alteração de DNS. A versão 0.5.12 foi
congelada para a validação. A fotografia final dos dados terminou em
**04/10/2026 20:05:33 BRT** (`2026-10-04T23:05:33Z`) e não deve ser refeita até
nova ordem do Ricardo.

## Evidências finais

- PCP: 19 tabelas e 25.198 linhas copiadas. A auditoria de leitura passou em
  63/63 casos. As 24 páginas abriram nos perfis ADMIN, PCP, PRODUCAO e CONSULTA,
  sem erro de página ou chamada externa.
- Mapa: 67/78 respostas brutas são exatas e 76/78 têm as mesmas linhas. As 11
  diferenças são de ordem; o estado final foi conferido. A paginação de
  `producao` devolveu 1.056 linhas únicas, sem falta ou repetição, com hash
  `89a5bb6388d9279a34fc366a979c3b79ca3a0255a30a14073888c92b0c58b913`.
- Segunda inspeção: o teste por toque real passou para GERENCIA e MONTADOR nos
  resultados `RR` (retrabalhado e aprovado) e `R` (perda), preservando a
  primeira inspeção. Os dados e as fotos sintéticos foram removidos.
- Defeitos: a fotografia final confirmou 01/10 `14 → 7`, 02/10 `14 → 7` e
  01–04/10 `28 → 14`. Tratativa, Histórico e os três dashboards passaram.
- Offline: sequência S3, liberação, inspeção e montagem passaram, com fila,
  reenvio e resíduo zero. Tempo real atualizou o segundo tablet em 0,36 s para
  produção e 0,37 s para manutenção.
- Concorrência: seis sessões gravaram simultaneamente; todas receberam HTTP 201
  e enxergaram as seis linhas. Latência máxima: 218 ms. Resíduo final: zero.
- Sessão: cookies publicados Secure/HttpOnly, SameSite=Lax, renovados com
  validade de 129.600 s (36 h).
- Impressão: FL-PRO-15, programação S3/S4, PCP Diário, etiquetas SC e armaduras
  ficaram iguais. As 306 etiquetas comuns de 01/10 têm exatamente o mesmo
  multiconjunto de páginas, mas a sequência varia porque as quatro leituras por
  setor terminam em ordem diferente. Dois CSVs ficaram iguais byte a byte e o
  XLSX passou na data com dados (01/10).
- Android Chrome e iPad Safari, retrato e paisagem: login único, modos do Mapa,
  identificação do PWA de teste e zero host externo. O ensaio offline do Android
  gravou, recarregou e reenviou com resíduo zero.

## Logos

As marcas oficiais Concrefer e ConcreTrack aparecem juntas no login, primeiro
acesso, página de testes, menu expandido e recolhido do Mapa, menu expandido e
recolhido do PCP, faixas de teste em tablet/celular, carregamento e instalação
do PWA. Foram geradas 13 capturas do endereço publicado em
`docs/capturas-validacao-0512/logos/`. Impressos controlados não foram alterados.

## Backup e retorno

- Bancos: `/var/backups/concrefer-unificado/20261005T003810Z`, com restauração
  automática de prova concluída para `mapa_unificado_teste` e
  `pcp_unificado_teste`.
- Fotos: `/var/backups/concrefer-unificado-fotos/20261005T003904Z`, 21 arquivos,
  restauração de prova concluída.
- Versão anterior: `/var/backups/concrefer-unificado/releases/0.5.11-before-validation-20261004T231500Z`.
- Resumo diário: `sudo /opt/concrefer-unificado/mapa-api/.venv/bin/python
  /opt/concrefer-unificado/infra/summarize_validation_day.py AAAA-MM-DD`.

## Limites conhecidos para a validação

1. Os três testes de inspeção foram reescritos para toque real; os outros 21
   ainda misturam controles visíveis com chamadas auxiliares do próprio teste.
   Dois fluxos (segunda inspeção e RR) mudaram de resultado ao eliminar o falso
   positivo anterior.
2. `Teste Programação` conserva o HTTP 500 do backend oficial ao comparar o
   identificador textual da forma com a chave inteira. Nenhum dado é gravado.
3. O PDF do Relatório de Manutenção tem conteúdo e filtros iguais, mas o hash da
   imagem das páginas em branco varia entre renderizações.
4. A automação headless não abre o aplicativo WhatsApp. A geração do PDF e o
   conteúdo de compartilhamento já foram conferidos separadamente.
5. A varredura dinâmica executou 29 ações sem host externo. O roteiro de tempo
   real tentou assinar duas vezes o mesmo canal e falhou no próprio instrumento;
   os testes dedicados de WebSocket passaram.

Os sistemas oficiais PCP e Mapa responderam HTTP 200 ao final. Todos os testes
de escrita usaram somente os bancos de testes. As contas sintéticas, vínculos,
linhas futuras e arquivos privados temporários foram removidos.
