# Dosagem v2 — estado na pausa de 19/10/2026

## Resumo executivo

O piloto da Dosagem v2 está instalado na VPS, mas **o acesso pelo túnel HTTP ainda não está funcional para o Ricardo**. A conta local foi criada e a API aceita as credenciais, porém a release ativa envia o cookie de sessão com o atributo `Secure` sobre `http://127.0.0.1:18443`; o cliente não o devolve na consulta seguinte. A correção foi implementada e passou em teste local específico, **mas não foi publicada**. O Ricardo pediu a interrupção antes da conclusão da nova rodada de portões. Nenhum outro deploy será feito até nova instrução.

O legado continua sendo o sistema oficial. O piloto permanece marcado como piloto e não libera cartas para produção real. O túnel SSH local foi encerrado ao pausar; os serviços da VPS **não** foram desligados. Não há stack de homologação ou banco de testes Docker ativo no computador.

## Base documental e decisões de escopo

- A execução segue `CODEX_DOSAGEM_V2_DEFINITIVA.md` 4.1, `ADENDO-4.2-RELEASE1.md` e `ADENDO-4.3-PILOTO.md`, nesta ordem de precedência quando há conflito. O texto do 4.3 foi salvo no repositório.
- O Adendo 4.2 separou Release 1 de Release 2, corrigiu S1 para P1b, definiu X1 para P1b/P5/A1 e autorizou o `REVOKE` no banco da Dosagem. Valores esperados dos casos não foram alterados.
- O Adendo 4.3 autorizou o piloto com portões P-F1 a P-F4. Os portões F1 a F4 completos continuam necessários para tornar o sistema oficial; 13 fluxos E2E da Release 1 ainda faltam.
- O papel pedido como “master” foi implementado com `admin`, o nível mais alto existente, e acesso a todas as unidades (`["*"]`). A senha solicitada pelo Ricardo foi armazenada apenas como hash Argon2id. Este relatório não contém senha ou hash.

## Trabalho concluído antes do incidente de login

| Área | O que foi feito e como foi conferido |
|---|---|
| Núcleos de cálculo | Métodos Principal e Alternativo, balanço físico, modo planilha, curvas, umidade, ajuste, otimização, regressão, normas e paridade TS × Python. Casos P1, P1b, P2, P3, P3b, P5, P6, P7, A1, A2, A3, I1, O1, N1, R1 e C40-conferência. C40 mantém 1000,05 L ± 0,01 como conferência de traço digitado. |
| API e dados | Recálculo no servidor, aprovação com snapshot, bloqueios de estado, imutabilidade, plano experimental, importações Rica v4/Curva de Abrams/Udemy, produção simulada, autenticação local e ponte Hub com ticket e PKCE. Migrações aditivas e teste de compatibilidade N−1. |
| Interface piloto | Painel, comparador, carta, impressão, faixa e marca d'água de piloto, importação Rica v4 e botões “Mostrar senha”/“Ocultar senha” no login e na troca. Itens de Release 2 aparecem desativados como “Em breve”. |
| Etapa 0 VPS | `preparar-vps.sh` simulado e executado dentro da lista autorizada, inclusive `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`; banco, role, senha, `.env` e Python isolado existentes foram reutilizados. Chave exclusiva local e alias `vps-antiga` configurados. `sudo` genérico foi recusado. `/root/preparar-vps.sh` foi removido. **Root segue proibido.** |
| Deploy inicial | Piloto ativado somente como `deploy-dosagem`; comandos privilegiados passaram pelo wrapper `/usr/local/sbin/ctdosagem-instalar`. `MODO_PILOTO=true`, API e backup ativos. Traços P1b e A1 de verificação foram conferidos e removidos. |
| Conta Ricardo | `ricardo.rda@gmail.com`, papel `admin`, todas as unidades, sem troca de senha obrigatória. A API respondeu HTTP 200 ao login com a senha pedida; a senha não aparece em relatórios. |

Detalhes históricos, saídas e decisões anteriores estão em `RELATORIO-EXECUCAO.md` e `VPS-PREPARACAO.md`.

## Diagnóstico e ações desta sessão

1. O Ricardo informou que `http://127.0.0.1:18443/auth/login/` carregava, mas rejeitava o acesso. Confirmou que o botão de mostrar senha aparece, que a senha exibida e o e-mail digitado estão corretos.
2. A API recebeu as credenciais exatas via túnel e respondeu **HTTP 200** com `trocarSenha=false`. A resposta continha cookie `ct_dosagem_sessao`, mas uma nova requisição na mesma sessão HTTP a `/api/v1/auth/sessao` respondeu **401**. O código ativo usa `secure=True` no cookie, incompatível com o acesso HTTP do túnel.
3. Para mostrar a resposta real da API ao usuário, foi atualizada `public/auth/login/index.html` para exibir HTTP e código de erro sem mostrar a senha. Essa alteração de interface passou por uma rodada completa do perfil piloto e foi publicada na release `/opt/concretrack-dosagem/releases/20261019-121843-piloto`. A API dessa release **ainda tem o erro do cookie**.
4. A homologação local foi deslocada da porta 18443 para a **18444**, separando seus E2E do túnel de acesso. O timeout do teste de paridade foi elevado de 20 para 60 segundos após um estouro ocasional; casos e valores esperados permaneceram iguais.
5. Antes desse deploy de interface, `npm run gates -- --perfil piloto` terminou com **P-F1, P-F2, P-F3 e P-F4 verdes**: 25 testes TS, 17 core Python, 51 API, 3 de importação, 20 E2E em P-F3 e 20 em P-F4, migração aditiva, backup/restauração e N−1. O arquivo `GATES-PILOTO.json` foi depois sobrescrito pela execução interrompida descrita abaixo; não deve ser interpretado como evidência da nova correção.
6. A F5 dessa manutenção foi medida de 12:08:17 a 12:18:19 UTC: **21 amostras/600 s**, carga média de 15 min 0,18 em 2 vCPU, RAM disponível mínima 5409 MB, swap 0, disco livre 39 GB e PostgreSQL acessível. Os nove sites vizinhos ficaram em **200/200/301/302/302/200/200/200/200** antes e depois. O verificador `check-f5-log.py` passou. Saída integral: `VPS-F5-LOGIN-HOTFIX.log`.
7. Após encontrar a causa, `api/app/main.py` passou a emitir o cookie **sem `Secure` somente quando `MODO_PILOTO=true` e o acesso é HTTP em `127.0.0.1` ou `localhost`**. Em HTTPS e em outros hosts, `Secure` permanece. O novo teste `test_pilot_local_http_tunnel_keeps_session_cookie` passou, comprovando login seguido de sessão HTTP 200.
8. Foi iniciada uma nova rodada de `npm run gates -- --perfil piloto` para essa correção da API. O Ricardo pediu para parar; a execução foi interrompida durante a checagem de migrações de P-F2. Até então passaram P-F1 (25 TS, 17 Python e IDs), 52 testes da API e 3 de importação. P-F3/P-F4 **não rodaram nessa última rodada**. O túnel e os processos locais de teste foram encerrados.

## Estado exato dos portões e da VPS ao parar

| Item | Estado |
|---|---|
| `GATES.json` completo | F1 e F2 verdes; F3 e F4 vermelhos, por fluxos E2E restantes. Última execução completa de 18/10/2026. |
| `GATES-PILOTO.json` atual | **Incompleto:** `finishedAt=null`; P-F1 concluído, P-F2 tem apenas 2 comandos registrados, P-F3/P-F4 sem comandos. Os campos `green` parciais não são liberação para novo deploy. Não foram editados manualmente. |
| Última rodada piloto completa | Quatro portões verdes **antes** da correção do cookie; não valida o código local atual. |
| Correção do cookie | Implementada localmente, teste específico aprovado; **não publicada**. |
| Release ativa | `/opt/concretrack-dosagem/releases/20261019-121843-piloto`, com diagnóstico de erro na tela e cookie antigo. Release anterior: `20261019-ricardo-master-piloto`. |
| API e sites VPS | Última verificação: `/api/v1/saude` HTTP 200, nove sites vizinhos nos códigos esperados. Serviços da VPS não foram parados. |
| Acesso local | Túnel `127.0.0.1:18443` encerrado a pedido de pausa. Mesmo se reaberto, o login de navegador continuará incompleto até o deploy da correção do cookie. |
| DNS/TLS | `dosagem.concretrack.com.br` ainda sem apontamento confirmado para a VPS; HTTPS público e ponte do Hub pendentes. |
| Credenciais | Conta existe; senha não é reproduzida neste arquivo. |

O pacote transferido na manutenção que está ativo tinha SHA-256 local/remoto `d686145490f52ff158ff4526d35cd47ccf84378a5a8b21dade275b6646793592`. Ele foi gerado **antes** da correção do cookie. A ativação da release nova foi feita como `deploy-dosagem`, com troca atômica do link `current` e `sudo -n /usr/local/sbin/ctdosagem-instalar restart-api`; nenhum acesso root, pacote ou alteração do banco ocorreu nessa manutenção.

## Arquivos relevantes

- `dosagem-concreto-v2/api/app/main.py`: correção local do cookie, ainda não implantada.
- `dosagem-concreto-v2/api/tests/test_auth_session41.py`: teste de regressão HTTP do piloto.
- `dosagem-concreto-v2/public/auth/login/index.html`: erro com HTTP/código, já na release ativa.
- `dosagem-concreto-v2/docker-compose.hml.yml`, `playwright.hml.config.ts` e `playwright.config.ts`: homologação na porta 18444.
- `dosagem-concreto-v2/tests/golden/parity41.test.ts`: timeout de 60 s, sem mudança de expectativas.
- `dosagem-concreto-v2/deploy/scripts/activate-login-hotfix.sh`: ativação com retorno ao link anterior caso o reinício da API falhe.
- `docs/dosagem-v2/GATES-PILOTO.json`: última execução interrompida e parcial.
- `docs/dosagem-v2/VPS-F5-LOGIN-HOTFIX.log`: medição de dez minutos validada.

Há muitas alterações de outros projetos no `git status` do repositório compartilhado. Nenhum desses arquivos foi limpo, descartado ou incluído nesta correção.

## O que falta, na ordem

1. **Somente quando o Ricardo autorizar continuar:** executar `npm run gates -- --perfil piloto` até `GATES-PILOTO.json` terminar com `finishedAt` preenchido e P-F1 a P-F4 verdes para o código com o cookie corrigido. A homologação local usa 18444; o túnel pode usar 18443 sem conflito.
2. Medir F5 antes do novo deploy conforme o procedimento, ou registrar a aceitação da medição de dez minutos já feita nesta manutenção. Gerar novo pacote, conferir SHA-256 local/remoto, publicar **somente como `deploy-dosagem`** e usar sudo apenas via wrapper. Não usar root nem instalar pacotes. Manter `MODO_PILOTO=true`.
3. Após o deploy, conferir `/api/v1/saude`, login, cookie do túnel sem `Secure`, `/api/v1/auth/sessao` HTTP 200 e entrada real no navegador; conferir novamente os nove sites vizinhos. Reabrir o túnel somente nessa retomada. Se falhar, voltar apenas o link de código para a release anterior; não reverter banco.
4. Atualizar `RELATORIO-EXECUCAO.md`, `VPS-PREPARACAO.md` e os portões após a conclusão. Não marcar portão verde à mão.
5. Para sair do piloto: implementar e testar os fluxos R1-01 a R1-12 e R1-14 nos quatro tamanhos com axe, concluir telas pendentes da Release 1, fazer `npm run gates` completo ficar verde e só então novo deploy oficial com decisão do Ricardo sobre os dados piloto. DNS/TLS e publicação da ponte do Hub seguem pendentes.

## Restrições que continuam valendo

Root na VPS está proibido. Acesso remoto somente por `vps-antiga` como `deploy-dosagem`; qualquer operação privilegiada somente pelo wrapper autorizado. Não modificar valores esperados dos casos, não pular testes e não instalar pacotes no sistema. O legado permanece oficial até a virada aprovada da Release 1.
