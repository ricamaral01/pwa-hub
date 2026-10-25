# ADENDO 4.2 — Escopo da Release 1, portões objetivos e autorizações

**Vale junto com `CODEX_DOSAGEM_V2_DEFINITIVA.md` (4.1). Onde este adendo contradiz a 4.1, vale o adendo.** 18/10/2026 · dono do produto: Ricardo.

## 1. Por que este adendo existe

A 4.1 descreve o produto completo. Este adendo define Release 1 e Release 2, corrige S1, X1 e a autorização do REVOKE, torna os portões verificáveis por `npm run gates` e autoriza a preparação da VPS.

## 2. Correções da 4.1

| Item | Correção |
|---|---|
| S1 (§17) | Usa **P1b** (balanço completo), não A1. Aprovar P1b; alterar a ρ da areia 2 de **2,68 para 2,60**. A versão aprovada permanece intacta (areias 142,416 / 569,663). O volume da areia 2 passa de 212,56 L para 219,10 L (**+6,54 L**); avaliação “revisão necessária”, produção bloqueada, `UPDATE` direto recusado pelo trigger. |
| X1 (§17) | E2E obrigatório para **P1b, P5 e A1**; A1 só para comparar, sem aprovação. C40 é teste unitário de conferência de traço digitado: **1000,05 L ± 0,01**. |
| REVOKE | Autorizado `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`. A role dona continua com acesso total; outros bancos não são afetados. |
| Build | `base: '/'`, manifesto com `start_url: '/'` e `scope: '/'`. Remover scripts `/auth/*.js` do Hub no `index.html` v2; a ponte permanece apenas no Hub. |
| Limpeza | Apagar somente os dois assets e a pasta temporária indicados na §6.3. Preservar `dosagem-concreto/PLANO_MODERNIZACAO.md` e `dosagem-concreto/docs/`. |

## 3. Escopo

### Release 1

| Área | Incluído |
|---|---|
| Acesso | Login local, conta de emergência e usuários, ticket único + PKCE do Hub, troca de senha, papéis e unidades, tela Usuários (admin). |
| Cadastros | Fornecedores, materiais com `MaterialVersao`, lotes, equipamentos e produtos com critério de desforma. |
| Laboratório | Granulometria de miúdo e graúdo, zonas NBR 7211, massa específica, absorção, umidade e Curvas de Abrams G1–G3. |
| Engenharia | Dois métodos completos (§7–8), balanço completo e modo planilha, painel, gráficos G4–G7, G9 e G10, comparador de versões e métodos, carta e impressão. |
| Validação | Plano experimental, misturas convencionais e CAA, histórico de ajustes, ajuste na betoneira, fresco, resistências por idade, curva e desforma (G8, G11). |
| Aprovação | Estados da §6.6, recálculo no servidor, snapshot, avaliação de impacto e trigger de imutabilidade. |
| Produção | Betonada do dia, carta com rastreabilidade, dosado manual, tolerâncias G13 e desforma por lote. |
| Importação | Rica v4, Curva de Abrams e Udemy, simulação e efetivação idempotente. |
| Infra | Backup diário, monitor do banco e Configurações › Saúde. |

### Release 2

Gestão (sd gerencial, comparador de eficiência, comparativos de unidades, cimentos e fornecedores, G14–G15), otimização granulométrica na interface (G12; O1 continua testado no núcleo), recomendação por regressão (R1 continua calculado; na Release 1 só histórico), importação do legado JSON/localStorage/Apps Script e CSV da usina. Essas telas aparecem desativadas no menu como **“Em breve (Release 2)”** e não bloqueiam Release 1.

## 4. Portões objetivos — `npm run gates`

`dosagem-concreto-v2/scripts/gates.mjs` executa os comandos em ordem e grava `docs/dosagem-v2/GATES.json` com comando, código de saída, contagem de testes e data. Sai com erro se algum portão falhar. Portão verde exige saída 0 nesta execução. Proibido marcar verde manualmente, pular testes (`skip`, `only`, `xfail`) ou alterar valor esperado.

| Portão | Comandos e condição |
|---|---|
| F1 | `npm run test:core` e `pytest api/tests/core -q`. Devem existir e passar P1, P1b, P2, P3, P3b, P5, P6, P7, A1, A2, A3, I1, O1, N1, R1, C40-conferência, propriedade de 200 traços, nos dois núcleos, mais paridade TS × Python. Conferir IDs nos dois lados. |
| F2 | `pytest api/tests -q` e `alembic upgrade head --sql \| python deploy/scripts/verificar-migracoes.py`. Exige autenticação §14.2, S1 corrigido, D1, plano experimental, importadores Release 1 com planilhas `referencia/`, migração só aditiva. |
| F3 | `npm run build` e `npx playwright test --project=desktop --project=tablet-retrato --project=tablet-paisagem --project=celular` contra API real em Docker. Fluxos R1-E2E nos quatro tamanhos, `axe` sem violações sérias ou críticas em cada tela. Build sem aviso de script externo. |
| F4 | `docker compose -f docker-compose.hml.yml up -d --build`, mesma suíte Playwright na homologação, `scripts/teste-backup-restauracao.sh` e `scripts/teste-compat-n-1.sh`. Stack derrubada no final. |

### Fluxos R1-E2E (todos em quatro tamanhos)

1. Login local, troca de senha inicial, logout e ponte com Hub simulado (ticket + PKCE).
2. Materiais e produto; granulometria com MF 2,586 para mistura atual e massa específica.
3. Curva de Abrams P2: A, B, k1, k2 e tabela de projeto na tela.
4. P1b do Objetivo à Carta, valores da §17.
5. P5: a/c 0,6400 e a/agl 0,5888 na tela.
6. A1: valores da §17, finos 385,23 e betonada corrigida.
7. X1: P1b, P5 e A1 iguais no painel, comparador, carta, impressão e servidor.
8. Plano experimental: aprovação bloqueada se incompleto e liberada se completo e conforme (P1b).
9. CAA: classes, espalhamento, manutenção G11 e reprovação da classe não atingida.
10. Resistências por idade I1: curva, extrapolação marcada, desforma bloqueada sem CP do lote e liberada com CP ≥ mínimo.
11. S1: mudança de material, impacto, produção bloqueada, decisão do engenheiro.
12. Produção: betonada P6, massas e água dosada, carta com lote, umidade com hora e balança, desvio fora da tolerância com alerta.
13. Rica v4: simulação de R10, FILLER V2, MARCOS e TESTE AGREGADO V2 com aviso de volume; efetivação repetida sem duplicar.
14. Offline e reconexão: rascunho preservado, “salvo” só após servidor, conflito de revisão.

## 5. Regras para chegar a 100 %

Não parar em ambiguidade: registrar decisão no `RELATORIO-EXECUCAO.md` e continuar. Contradição com 4.1: vale este adendo; contradição interna da 4.1: escolher cálculo fisicamente correto e registrar. Valor esperado considerado errado: não alterar; cálculo independente em `DIVERGENCIAS.md`, teste vermelho até Ricardo decidir. Release 2 não bloqueia nem deve ser implementada antes de F1–F4 verdes. Ao fim da sessão, rodar `npm run gates`, atualizar `GATES.json` e “Próxima sessão”.

## 6. Autorizações explícitas do Ricardo

### 6.1 Etapa 0 — root uma única vez

1. Usar `/root/preparar-vps.sh` se SHA-256 coincidir com o repositório; senão copiar novamente.
2. Rodar `sudo bash /root/preparar-vps.sh --simular`. Permitido criar `deploy-dosagem`/`ctdosagem`, `.ssh` e `authorized_keys`, bloquear senha do deploy, ajustar `/opt/concretrack-dosagem/{,releases,shared,backups,acme}` e `shared/.env`, cinco `ALTER ROLE dosagem_app SET`, `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`, wrapper `/usr/local/sbin/ctdosagem-instalar` e sudoers validado por `visudo`. Proibido instalar pacotes, reiniciar/recarregar serviços ou criar/recriar role ou banco.
3. Se a simulação respeitar a lista, executar script sem `--simular` e anexar saída a `VPS-PREPARACAO.md`.
4. Gerar chave local `~/.ssh/codex_dosagem_ed25519` sem passphrase, instalar apenas a pública para deploy (authorized_keys dono deploy, modo 600), configurar `vps-antiga` para `deploy-dosagem@31.97.241.84` com `IdentitiesOnly yes`, sem alterar entrada root existente.
5. Verificar diagnóstico do wrapper via SSH BatchMode, falha de `sudo -n true` e códigos HTTP vizinhos inalterados.
6. Apagar `/root/preparar-vps.sh`. **Depois, root proibido.**

### 6.2 F5/F6

Autorizados automaticamente quando `GATES.json` estiver todo verde. Usar somente `deploy-dosagem` e `sudo /usr/local/sbin/ctdosagem-instalar`, conforme §16.1–16.5 da 4.1; reutilizar banco, role, senha, `.env` e Python isolado em `/opt/concretrack-dosagem/python`, sem instalação. Se DNS `dosagem.concretrack.com.br` resolver para a VPS, executar certbot; senão, deploy HTTP só com desafio certbot, teste por túnel SSH, TLS pendente de Ricardo. Publicar a ponte no Hub somente se publicado pelo mesmo repositório e o commit contiver só `auth/ponte-dosagem.html`; caso contrário, deixar pendente e manter login local.

### 6.3 Limpeza local autorizada

Apagar exatamente `dosagem-concreto/v2/assets/index-BQdA5Qy9.js`, `dosagem-concreto/v2/assets/index-DwyCgfM7.css`, `dosagem-concreto/.work-dosagem-v2-4.1/` e, se existir e não for rastreada, `.work-dosagem-v2-4.1/` da raiz. Preservar `dosagem-concreto/PLANO_MODERNIZACAO.md` e `dosagem-concreto/docs/`.
