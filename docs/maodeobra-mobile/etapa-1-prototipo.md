# Mão de Obra mobile — etapa 1: protótipo visual

**Estado:** pronto para avaliação visual. Implementação e envio real ainda não iniciados.

**Teste online:** [abrir o protótipo na porta 18446](https://concrefer.concretrack.com.br:18446/unificado/m/maodeobra/prototipo/). Os botões permitem percorrer as sete telas. Para abrir diretamente uma tela, acrescentar `?screen=install`, `launch`, `review`, `sent`, `error`, `no-production` ou `history`.

O protótipo tem valores de exemplo e uma faixa permanente informando que **nenhum dado é enviado**. A confirmação de sucesso é uma simulação visual. O botão de instalação também é demonstrativo nesta etapa.

## Arquivos criados

| Arquivo | Função |
|---|---|
| [`unificado/m/maodeobra/prototipo/index.html`](../../unificado/m/maodeobra/prototipo/index.html) | Entrada isolada do protótipo. |
| [`unificado/m/maodeobra/prototipo/prototype.css`](../../unificado/m/maodeobra/prototipo/prototype.css) | Layout responsivo das sete telas, sem copiar o formato do mockup. |
| [`unificado/m/maodeobra/prototipo/prototype.js`](../../unificado/m/maodeobra/prototipo/prototype.js) | Dados de exemplo, navegação e interação simulada. |
| [`docs/maodeobra-mobile/capturar-etapa1.py`](capturar-etapa1.py) | Capturas e verificações locais e da porta 18446. |
| `docs/maodeobra-mobile/capturas-etapa1-teste/` | 21 capturas do protótipo publicado no teste. |

Nenhum arquivo da tela atual, do manifesto, do service worker, da API ou do banco foi alterado nesta etapa. A publicação na porta 18446 contém somente os três arquivos da rota isolada do protótipo.

## Capturas do teste

| Tela | 360 px | 390 px | 430 px |
|---|---|---|---|
| 00 Instalar | [360](capturas-etapa1-teste/00-install-360.png) | [390](capturas-etapa1-teste/00-install-390.png) | [430](capturas-etapa1-teste/00-install-430.png) |
| 01 Lançamento | [360](capturas-etapa1-teste/01-launch-360.png) | [390](capturas-etapa1-teste/01-launch-390.png) | [430](capturas-etapa1-teste/01-launch-430.png) |
| 02 Conferência | [360](capturas-etapa1-teste/02-review-360.png) | [390](capturas-etapa1-teste/02-review-390.png) | [430](capturas-etapa1-teste/02-review-430.png) |
| 03 Enviado | [360](capturas-etapa1-teste/03-sent-360.png) | [390](capturas-etapa1-teste/03-sent-390.png) | [430](capturas-etapa1-teste/03-sent-430.png) |
| 04 Erro | [360](capturas-etapa1-teste/04-error-360.png) | [390](capturas-etapa1-teste/04-error-390.png) | [430](capturas-etapa1-teste/04-error-430.png) |
| 05 Sem produção | [360](capturas-etapa1-teste/05-no-production-360.png) | [390](capturas-etapa1-teste/05-no-production-390.png) | [430](capturas-etapa1-teste/05-no-production-430.png) |
| 06 Histórico | [360](capturas-etapa1-teste/06-history-360.png) | [390](capturas-etapa1-teste/06-history-390.png) | [430](capturas-etapa1-teste/06-history-430.png) |

## Verificações

- Playwright/Chromium abriu as sete telas nas três larguras, na URL da porta 18446: **21/21 capturas**.
- Sem rolagem horizontal, erros de JavaScript ou chamadas à API nas 21 aberturas.
- No exemplo S1/S2, o total mostrado é **MOD 12,5 + MOI 8 = 20,5**. Ao alternar S3/S4, aparecem nove atividades, incluindo Fab Armação setor 3 e setor 4 em MOI.
- Navegação lançamento → conferência → voltar; campos e grupo de exemplo permanecem na simulação.
- `index.html`, CSS e JS na porta 18446 respondem HTTP 200. Os hashes SHA-256 dos três arquivos publicados são iguais aos locais.

## Limite desta etapa

O campo **Motivo (opcional)** da tela “Sem produção” aparece no mockup, mas o `POST /api/maodeobra/grupo` atual não recebe nem persiste motivo. Como a especificação exige a mesma API e nenhum banco novo, será preciso decidir se o campo sai da versão funcional ou se pode ser apenas uma anotação local explicitamente não enviada. O protótipo não grava esse campo.

**Próximo passo, após aprovação visual:** etapa 2, extrair leitura, validação, totais e envio para a camada comum das vistas desktop e mobile.
