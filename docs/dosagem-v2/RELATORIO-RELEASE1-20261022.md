# Dosagem v2 — preparação da Release 1 (22/10/2026)

## Aplicação e validação

- R1-09 a R1-14 completos, incluindo CAA, curva de idades, impacto de material e sincronização offline. O projeto oferece os métodos de empacotamento e volume em telas distintas.
- O servidor agora recusa produção oficial com traço ou betonada marcados `piloto=true` e recusa desforma de betonada piloto. A tela de produção não oferece traços piloto no modo oficial; a carta do editor identifica os registros piloto.
- `npm run gates` terminou em 22/10/2026 08:41:10 UTC com **F1, F2, F3 e F4 verdes**. Foram 60/60 Playwright em F3 e 60/60 em F4, com axe nos quatro tamanhos, auditoria Release 1, backup/restauração e N−1. Resultado estruturado em `GATES.json` e log em `GATES-EXEC-20261022-VALIDADO.log` (o log contém somente credenciais descartáveis da homologação; não publicar o log).

## F5 — VPS

`deploy-dosagem` mediu 21 amostras durante 600 segundos (08:19:24–08:29:24 UTC). Validador `check-f5-log.py`: **aprovado**. Load15 médio 0,11 em 2 vCPUs; RAM disponível mínima 5.546 MB; disco livre mínimo 39 GB; swap usada 0; PostgreSQL disponível. Os nove sites vizinhos responderam, antes e depois, `200/200/301/302/302/200/200/200/200`. Medições integrais em `VPS-F5-20261022.log`.

O comando remoto retornou código 1 por um caractere `CR` acrescentado pelo pipe PowerShell depois da linha `END` (`bash: line 31: $'\r': command not found`). Todas as 21 amostras, a duração, o banco e os 18 códigos HTTP passaram no verificador independente, com código 0. O mesmo detalhe de transporte havia ocorrido na medição F5 do piloto.

## Release preparada, ainda sem ativação

Pacote `release1-20261022.tar.gz` com frontend compilado, API, migrações aditivas, dependências Linux já empacotadas e unit oficial. SHA-256 local e remoto: `b984b1c7282150edf249e7cc8183d142fbfe39f07f55176a0a42eca875c57c74`. Staging em `/opt/concretrack-dosagem/releases/20261022-release1-oficial` feito somente como `deploy-dosagem`, sem root, instalação de pacote, alteração do banco ou reinício. Código e dependências da API compilaram com o Python isolado existente. O arquivo protegido `shared/.env` não foi modificado; o lançador oficial define `MODO_PILOTO=false` diretamente no processo da API. O instalador restrito instalará a unit da release quando ativada; a unit piloto antiga permanece na release anterior para rollback de código e configuração.

Após o último gate, 91 arquivos do pacote (`web`, API, migrações, `vendor` e unit) foram comparados byte a byte com o workspace e permaneceram idênticos. O SHA-256 remoto foi conferido novamente.

## F6 — ativação oficial

Ricardo decidiu **preservar identificados** os registros do piloto. O servidor bloqueia o uso de traços e betonadas piloto na produção oficial e bloqueia a desforma real desses lotes. Nenhum registro foi excluído ou convertido.

Em 22/10/2026 09:57 UTC, `deploy-dosagem` ativou `/opt/concretrack-dosagem/releases/20261022-release1-oficial` pelo instalador restrito. O `ExecStartPre` fez dump pré-migração (`backups/dosagem-20261022T095721Z.dump`) e o verificador de migrações registrou `Migração aditiva: OK`. A unit oficial iniciou com limites de CPU 50% e memória 600 MB. O health check local e público respondeu HTTP 200, `banco=ok` e sem `piloto=true`; página e bundle público responderam HTTP 200. O `index.html` ativo tem SHA-256 idêntico ao build local (`84a873982d2324db598ba3ff757d97c000865e2ef6375f6ebcbe01ce2d219d96`). Os nove sites vizinhos conservaram `200/200/301/302/302/200/200/200/200` logo após a troca.

Rollback de código e unit preparado: `/opt/concretrack-dosagem/releases/20261021-r1-0102-x1-piloto`. O dump não é restaurado automaticamente. O smoke de login autenticado, criação/remoção dos traços P1b e A1 e impressão pública depende das credenciais do Ricardo; não há senha disponível para a conta no workspace nem acesso à sessão de navegador dele. Os 60 testes E2E de F3 e F4 cobriram esses fluxos com API real na homologação.

Às 10:02 UTC, mais de cinco minutos após a troca, o serviço permanecia ativo: load1/5/15 `0,14/0,16/0,11`, RAM disponível 5.559 MB, swap 0, disco livre 39 GB, API com 69 MB sob `MemoryMax=600M`. Health público 200 sem marcador de piloto, página 200, e os nove sites vizinhos seguiram em `200/200/301/302/302/200/200/200/200`. O log da API mostrou respostas HTTP 200 para sessão autenticada e RPC vindas de um navegador externo; isso confirma tráfego autenticado bem-sucedido, mas não os valores P1b/A1 nem a impressão nessa sessão.

## F7 — validação final

- Smoke público sem credenciais: navegador abriu `https://dosagem.concretrack.com.br/auth/login/` por HTTPS, encontrou os campos de e-mail e senha, confirmou `/api/v1/saude` com banco OK e não encontrou faixa PILOTO. Captura: `capturas/login-oficial-20261022.png`.
- Smoke de cálculo somente leitura, executado com o Python isolado da release ativa na VPS: P1b por empacotamento = **1000,000000 L e 321 kg de cimento**; A1 por volume = **999,969085 L e 351 kg de cimento**. Ambos passaram com os dados de referência da própria release.
- Checklist manual autenticado: conferência no site oficial **informada como realizada pelo Ricardo em 22/10/2026**, em resposta ao pedido para verificar os dois métodos com sua sessão autenticada. O agente não acompanhou a sessão e não possui captura dos passos, dos valores exibidos nem da eventual remoção de traços de verificação. A execução automatizada anterior em homologação cobriu salvar, recarregar e imprimir; a confirmação do usuário é a evidência da conferência pública.

Às 10:39 UTC de 22/10/2026, nova conferência somente leitura: release oficial ainda ativa, `concretrack-dosagem-api.service` ativo, `/api/v1/saude` HTTP 200 com `banco=ok`, página de login HTTP 200, memória da API 72.380.416 bytes, RAM disponível 5.558 MB e disco livre 39 GB. Nenhum registro ou configuração foi alterado nesta conferência.
