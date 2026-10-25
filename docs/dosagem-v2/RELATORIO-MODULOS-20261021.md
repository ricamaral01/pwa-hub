# Dosagem v2: módulos separados (21/10/2026)

## Publicação

- Piloto ativo: `https://dosagem.concretrack.com.br/`.
- Empacotamento: `https://dosagem.concretrack.com.br/#/dosagem/empacotamento`.
- Volume: `https://dosagem.concretrack.com.br/#/dosagem/volume`.
- Release ativada: `/opt/concretrack-dosagem/releases/20261021-frontend-metodos-piloto`.
- Release anterior preservada para rollback: `/opt/concretrack-dosagem/releases/20261019-141044-piloto`.
- Alteração somente no frontend. API, banco, configuração, credenciais e serviços não foram alterados.

## Funcionalidade

- O módulo de empacotamento usa o cálculo Principal (Abrams e teor de argamassa). Recebe curvas granulométricas de duas areias em 12 peneiras, compara a combinação à curva de Alfred, sugere a proporção de menor desvio e permite aplicá-la ao traço.
- O módulo por volume usa o cálculo Alternativo Concrefer da planilha Rica v4, com as entradas e frações volumétricas próprias.
- Os dois módulos têm entradas separadas na navegação e na página inicial. A rota antiga `/#/dosagem41` foi mantida para compatibilidade.
- A otimização granulométrica atual contempla duas areias. As curvas coladas no painel não são gravadas com o traço; a proporção aplicada é parte do traço. A sugestão precisa de validação de laboratório.

## Verificações

- `npm run gates -- --perfil piloto`: P-F1, P-F2, P-F3 e P-F4 verdes na mesma execução, encerrada em `2026-10-21T20:27:07Z`. Incluiu 53 testes da API, dois ciclos com 24 testes de navegador cada, restauração de backup e compatibilidade N-1.
- F5: 21 amostras em 601 segundos; carga média de 15 minutos 0,09; RAM livre mínima 5.521 MB; disco livre mínimo 39 GB; PostgreSQL e nove sites vizinhos aprovados.
- Teste específico dos novos módulos: 2/2 em desktop e celular.
- Pacote do frontend: SHA-256 `e8fc56e9fe32da069b91bb4cbcefb80d28004cfa10afa3d55c2e5c1c736664cc`, confirmado localmente e na VPS.
- Após ativação: página HTTP 200, `/api/v1/saude` HTTP 200 com `banco=ok` e `piloto=true`; os dois módulos renderizaram no navegador contra o domínio público com autenticação simulada. O login real não fez parte deste smoke.
- Códigos HTTP dos nove sites vizinhos após a ativação: 200/200/301/302/302/200/200/200/200, iguais aos da medição F5.

## Correção do link antigo e cache (21/10/2026)

- A captura enviada pelo usuário mostrava `/#/dosagem41` e o menu do bundle anterior. O endereço antigo agora redireciona para `/#/dosagem/empacotamento`.
- A comparação dos métodos permanece em `/#/comparacao-metodos` para os fluxos de homologação; os módulos operacionais continuam separados.
- O PWA passou para atualização automática: o novo service worker usa `skipWaiting` e `clientsClaim`.
- Release atual: `/opt/concretrack-dosagem/releases/20261021-frontend-refresh-piloto`. A release `20261021-frontend-metodos-piloto` permanece como rollback.
- Pacote: SHA-256 `b4e6735f3a8cbfac22f0d86acd073d7d4d725eda31660431dcd30c37d9679edd`, conferido localmente e na VPS.
- `GATES-PILOTO.json`: P-F1 a P-F4 verdes na execução encerrada em `2026-10-21T20:49:46Z`. Teste específico do link antigo e dos dois módulos: 4/4 em desktop e celular.
- Smoke público com autenticação simulada: acesso a `/#/dosagem41` redirecionou para empacotamento; link do menu abriu volume. Página, bundle, service worker e `/api/v1/saude` HTTP 200; os nove sites vizinhos preservaram 200/200/301/302/302/200/200/200/200.

O aviso de PILOTO segue ativo: cartas não estão liberadas para produção oficial.

## Curvas gravadas e nova atualização do piloto (21/10/2026)

- O módulo de empacotamento agora grava com o traço as 12 peneiras, as duas curvas de percentuais passantes, o expoente `q` e os diâmetros mínimo e máximo. Se uma curva foi iniciada e está inválida ou incompleta, o salvamento é bloqueado até a correção. A proporção aplicada permanece nos dados do método principal.
- O módulo por volume continua independente e não recebe o campo `empacotamento`.
- O teste local com API simulada passou em desktop e celular (2/2). O teste com API real confirmou os dois documentos separados e as curvas devolvidas pelo servidor nos quatro tamanhos, com axe sem violações sérias ou críticas.
- `npm run gates -- --perfil piloto`: P-F1 a P-F4 verdes; 25 testes TS, 17 Python, 53 da API, 3 de importação, 28/28 E2E em cada ciclo, backup/restauração e compatibilidade N−1. `GATES-PILOTO.json` foi gravado pelo portão.
- `npm run gates` completo: F1 e F2 verdes; F3 e F4 vermelhos. Persistem os 13 fluxos R1-01 a R1-12 e R1-14 ausentes nos quatro tamanhos. Uma execução F3 teve falha isolada no login P5 em tablet retrato sob quatro workers; F4 passou 20/20 com dois. O teste F3 com API real foi alinhado a dois workers e timeout de 120 s.
- Release ativa: `/opt/concretrack-dosagem/releases/20261021-frontend-packing-piloto`. Release anterior `/opt/concretrack-dosagem/releases/20261021-frontend-refresh-piloto` preservada para retorno. Atualização somente do frontend como `deploy-dosagem`, sem alteração de banco, API ou configuração.
- Pacote: SHA-256 `68dca845bb93ccdd8d2c671135560756eba4562de8f6ce0ab5ec709d42d75a8a`, idêntico no workspace e na VPS. Página pública e `/api/v1/saude` HTTP 200; saúde `banco=ok`, `piloto=true`. Os nove sites vizinhos mantiveram 200/200/301/302/302/200/200/200/200.

### Próxima sessão

Concluir as telas e os testes reais R1-01 a R1-12 e R1-14 com axe nos quatro tamanhos; deixar F1–F4 verdes antes de preparar a virada oficial. Manter o legado oficial e as cartas do piloto com marca d'água até essa condição e a decisão sobre os dados do piloto.
