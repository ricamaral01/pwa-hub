# Continuação da implantação da Dosagem v2 — Release 1 parcial no piloto

Data: 21/10/2026 (America/Sao_Paulo)

## Entrega

- R1-01: login local, troca da senha inicial, saída e ponte Hub simulada com ticket único e PKCE, contra a API real da homologação.
- R1-02: material, produto, granulometria com MF 2,586 e massa específica, com gravação na API real.
- R1-04, R1-05 e R1-07: P1b, P5 e A1 com valores confrontados entre painel, comparador, carta, PDF impresso e documento salvo pelo servidor. A carta antes saía vazia no PDF; o CSS de impressão foi corrigido.
- A fração de argamassa α no resumo agora usa a fração em massa dos dois métodos. O método por volume mostra também os finos calculados. O MF da granulometria é exibido com três casas.
- Os testes usam os quatro tamanhos e axe, sem violações sérias ou críticas. A ponte Hub é simulada somente no Docker de homologação; nenhum mock foi instalado no piloto.

## Portões

| Portão | Resultado |
|---|---|
| F1 | Verde: 25 testes TS, 17 Python e IDs/paridade. |
| F2 | Verde: 55 testes API, 3 importador, migração aditiva e auditoria. |
| F3 | Vermelho: build e 32/32 E2E passaram; mínimo obrigatório 56. Auditor: R1-06, R1-08, R1-09, R1-10, R1-11, R1-12 e R1-14 ausentes nos quatro tamanhos. |
| F4 | Vermelho pela mesma cobertura: 32/32 E2E, backup/restauração e N−1 passaram. |
| P-F1 a P-F4 | Todos verdes. P-F3 e P-F4 passaram 32/32 E2E cada; backup/restauração e N−1 passaram. |

Os resultados foram gravados automaticamente em `GATES.json` (encerrado 21:58:20 BRT) e `GATES-PILOTO.json` (22:05:33 BRT). A Release 1 oficial continua bloqueada pelos portões F3/F4.

## Implantação no piloto

- Pacote de frontend e correção pontual da API: `dosagem-piloto-r1-0102-20261021.tar.gz`, SHA-256 local/remoto `3675ff7f462aa743ce03015896ce6f5f0c532dbbdf93bd2cdc8d17b99a0db39f`.
- A primeira ativação não aguardou tempo suficiente para a API iniciar. O teste de saúde falhou e o script restaurou automaticamente a release Abrams. Após confirmação da API anterior saudável, a ativação preparada foi repetida com espera de até 60 segundos e passou na terceira tentativa de sondagem.
- Release ativa: `/opt/concretrack-dosagem/releases/20261021-r1-0102-x1-piloto`. Rollback preservado: `/opt/concretrack-dosagem/releases/20261021-frontend-abrams-piloto`.
- `https://dosagem.concretrack.com.br/`, o novo bundle e `/api/v1/saude` responderam HTTP 200. Saúde: `banco=ok`, `piloto=true`. A API implantada tem SHA-256 igual ao arquivo local: `938dbc775699a11c54191a6598ec4977c25ae521f4132bbc1dbb70da1ee97694`.
- Os nove sites vizinhos mantiveram 200/200/301/302/302/200/200/200/200. Banco, migrações, credenciais e `.env` não foram alterados.

Scripts de ativação e rollback automático: `deploy/scripts/pilot-release-20261021.sh` e `deploy/scripts/pilot-activate-prepared-20261021.sh`.

## Próxima sessão

Concluir R1-06 e R1-08 a R1-12 e R1-14 com API real, quatro tamanhos e axe; atingir pelo menos 56 E2E e deixar F1–F4 verdes. Depois preparar a virada oficial conforme o Adendo 4.2 e decidir o tratamento dos dados piloto. O legado permanece oficial e o aviso PILOTO continua visível.
