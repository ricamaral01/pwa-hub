# Relatório de execução — Dosagem v2

Data: 17/10/2026. Escopo: execução da especificação v1.0 recebida nesta conversa. **Estado: implementação parcial, pronta para desenvolvimento e avaliação local; ainda não apta a substituir o legado em produção.**

## Onde roda

O legado roda como aplicação estática em `dosagem-concreto/index.html`, no mesmo domínio do Hub (`usina.concretrack.com.br`). O novo código fonte está em `dosagem-concreto-v2/`. Seu build estático sai em `dosagem-concreto/v2/` e a rota prevista, após publicação, é `https://usina.concretrack.com.br/dosagem-concreto/v2/`. O backend novo é um Web App de Google Apps Script com planilha própria. **Não foi implantado**: faltam ID da planilha nova, projeto Apps Script, Script Properties e URL do Web App. A fonte exata do GitHub Pages (branch ou Actions) não foi verificável na cópia local; não há workflow rastreado.

## Trabalho feito, por área da especificação

| Área | Entrega | Estado |
|---|---|---|
| Reconhecimento (§1–4) | Leitura do HTML legado, três Apps Scripts, autenticação e SW; inventário das 24 seções e 119 botões internos; fórmulas e esquemas documentados | Parcial: faltam 30 botões fora das seções, controles dinâmicos e revisão manual do inventário |
| Modelo e cálculo (§5–6) | Modelo único TypeScript, parsing pt-BR, validações, volumes, indicadores, umidade, custo, limites, Abrams, granulometria, massa específica, cálculo inverso, empacotamento; três módulos legados portados | Parcial: científico e teor de argamassa ainda não ligados ao editor; parâmetros e tabelas normativas incompletos |
| API e dados (§7–8) | Apps Script novo com autenticação Supabase por introspecção, papéis, unidades, lock, revisão otimista, requestId, versões, aprovação, importação parcial; IndexedDB, rascunhos e outbox | Parcial: sem teste em serviço implantado, importação incompleta, cache e resolução de conflito limitados |
| Interface (§9–11) | Cascas desktop, tablet e celular; início, listas, editor em cinco etapas, painel de resultado, formulários básicos, navegação e busca | Parcial: faltam várias ações de paridade, detalhes, visualizações e estados completos |
| Carta (§12) | Prévia e CSS de impressão, correção de umidade, betonada, indicadores, QR local e marca d'água | Parcial: compartilhamento de PDF no celular e revisão visual de impressão física pendentes |
| Acessibilidade (§13) | Labels básicos, foco visível, status, teste axe na tela inicial | Parcial: axe não foi aplicado a todas as telas e etapas |
| Testes (§14) | Vitest, Playwright em quatro viewports, screenshots de Início e Editor, teste de salvamento com API simulada | Parcial: faltam fixtures golden oficiais, fluxos de offline/conflito/permissões/aprovação e testes amplos do Apps Script |
| Publicação (§15–18) | Build Vite com base e HashRouter, PWA própria, exceção mínima no SW do Hub, instruções de deploy | Pendente de infraestrutura e validação real antes de publicar |

## Decisões e diferenças encontradas

1. O Hub usa Supabase Auth, mas `authEnabled` está `false` nesta cópia. A v2 permite rascunhos locais e exige token válido para o servidor. O backend valida o token pela API `/auth/v1/user`, independentemente do algoritmo de assinatura; não foi possível afirmar HS256/RS256 sem um token real.
2. O Apêndice A forneceu somente o objetivo C40, sem massas, densidades, preços e resultados completos. O Apêndice B informou MF 2,714 e Dmáx 4,75 mm, sem tabela de massas retidas. Foram criados testes de comportamento e uma amostra sintética de granulometria, **não** um golden oficial do apêndice. Não se inventaram valores esperados do C40.
3. Os cinco mockups HTML estão em `dosagem-concreto/docs/dosagem-v2/mockups/`, não em `docs/dosagem-v2/mockups/` como diz o texto. Foram lidos como referência, sem alteração do legado. A paridade visual completa ainda requer comparação sistemática de telas.
4. A normalização usa o fator solicitado `1000/V_total` nas massas e mantém o volume de ar informado constante. Com ar não nulo, o volume final não é necessariamente 1000 L; a diferença está descrita em `FORMULAS.md` e requer decisão de engenharia antes da liberação.
5. Os limites normativos e zonas granulométricas sem dados completos na especificação não foram completados por suposição. Os valores presentes em arquivos de configuração estão marcados para conferência contra a edição vigente das normas.
6. A importação do legado cobre parte de cartas, fornecedores e custos. Página1, Experimental, ensaios, mapeamentos de densidade e vários formatos locais ainda exigem conversão e fixtures reais. Simulação deve ser usada antes de qualquer importação efetiva.
7. A interface dos métodos científico e por teor de argamassa exibe aviso explícito: os módulos estão portados, mas a edição ainda usa massas manuais. Isso evita afirmar uma paridade inexistente.
8. A única mudança fora das três pastas novas é o bloco de três linhas em `sw.js`: `if (url.pathname.startsWith("/dosagem-concreto/v2/")) return;`. Ele impede que o cache do Hub intercepte a PWA v2.
9. O repositório já tinha muitos arquivos alterados antes desta tarefa. O verificador `npm run deploy:check` lista essas mudanças externas e por isso falha nesta árvore suja; não foram incorporadas à v2 nem revertidas.
10. A PWA pré-carrega o build e usa network-first nas páginas sob `/dosagem-concreto/v2/`. A API usa `POST` autenticado; esse tráfego não é armazenado pelo service worker. A outbox do cliente faz o reenvio. O requisito literal de cache network-first para a API ficou pendente de uma política que não armazene tokens nem respostas privadas.

## Verificação executada

| Verificação | Resultado |
|---|---|
| `npm test` | 10/10 testes passaram, em 3 arquivos; inclui cálculos centrais, exemplos portados do legado e amostra sintética de granulometria |
| `npm run build` | TypeScript e Vite concluíram; saída em `dosagem-concreto/v2/` |
| `npm audit` | 0 vulnerabilidades após atualizar Vitest para 5.0.5 |
| Playwright, 1440×900, 820×1180, 1180×820, 390×844 | 12/12 passaram; cobrem casca, acesso ao editor, salvamento com resposta simulada, reabertura e axe em Início |
| Apps Script | Código e funções `testesRodar_` preparados; **não executados em projeto Apps Script real** |
| Publicação / autenticação real | Não testadas; faltam infraestrutura, URL e usuários |

Screenshots disponíveis em `dosagem-concreto-v2/tests/e2e/__screenshots__/`: `inicio-desktop.png`, `inicio-tablet-retrato.png`, `inicio-tablet-paisagem.png`, `inicio-celular.png`, `editor-desktop.png`, `editor-tablet-retrato.png`, `editor-tablet-paisagem.png`, `editor-celular.png`. Eles documentam apenas Início e a primeira etapa do Editor. A matriz completa de telas × modos e os pares lado a lado com mockups ainda estão pendentes.

## Pendências prioritárias

| Prioridade | Pendência | Motivo / critério de saída |
|---|---|---|
| P0 | Criar planilha, implantar Apps Script, configurar Script Properties, URL e papéis; testar token, unidade, lock, duplicação e conflito reais | Sem credenciais e IDs na cópia local; só então há gravação confirmada de ponta a ponta |
| P0 | Completar e testar importação dos três arquivos legados e localStorage/JSON com fixtures reais | A conversão atual é parcial e pode omitir campos; não executar modo efetivo antes de validar contagens e amostras |
| P0 | Obter tabelas completas dos Apêndices A/B e rodar os goldens oficiais | Entradas esperadas não constam da especificação anexada |
| P0 | Conferir tabelas e interpretações da NBR 12655 e NBR 7211 com engenharia | Configuração atual não representa validação normativa para produção |
| P1 | Ligar métodos científico e por teor de argamassa, comparação A/B/C, banco de traços, MCC por traço e memória de cálculo ao modelo único | Paridade funcional total ainda não atingida; ver `PARIDADE.md` |
| P1 | Completar resultados experimentais (CPs, idades), ensaios, fornecedores, materiais e ferramentas com todos os campos/ações legados | Telas entregues são simplificadas |
| P1 | Concluir fluxo de aprovação com checklist de engenharia, comparação de versões e testes de papéis reais | Há ações de API e controles básicos, sem validação operacional completa |
| P1 | Testar offline/reconexão, conflito, SEM_PERMISSAO, carta, impressão, teclado e axe em todas as etapas/modos | Cobertura atual é parcial |
| P2 | Refinar fidelidade aos cinco mockups, incluir comparação visual lado a lado e screenshots de todas as telas nos três modos | Capturas atuais são só de Início e Editor |
| P2 | Confirmar modo de publicação do GitHub Pages e publicar após os gates P0 | Configuração remota não foi acessada |

## Checklist manual para Ricardo

Em **cada modo** — desktop 1440×900, tablet retrato 820×1180, tablet paisagem 1180×820 e celular 390×844 — confira:

| Tela / fluxo | Conferência |
|---|---|
| Início | tarefas, recentes, links, filtros, estados vazio/carregando/erro/offline, navegação e contraste |
| Editor: Objetivo | nome, unidade, fck, sd, classe, abatimento, limites, teclado e mensagens |
| Editor: Materiais | duas areias e dois aditivos, densidades próprias, ensaio vinculado, umidade, remoção e reabertura |
| Editor: Proporções | a/c distinto de a/agl, volumes, custo, normalização, scroll da tabela, métodos e barra fixa no celular |
| Editor: Validação | erros bloqueiam cálculo e salvar; versões e resultados experimentais; anúncio acessível |
| Carta | traço seco/obra, betonada, QR, marca d'água, PDF A4, aprovação por papel |
| Traços / Comparação | filtros, versão anterior, A/B/C, custos e histórico; itens ainda pendentes devem ser marcados para nova rodada |
| Materiais e Fornecedores | cadastrar, inativar, reabrir, relatório e permissões por unidade |
| Ensaios e Ferramentas | MF, Dmáx, perda, curva logarítmica, densidades, Abrams, empacotamento e aplicação ao traço |
| Custos, Referência e Configurações | MCC, manual, layout forçado, versão, sincronização, usuários e importação simulada |

Teste também com rede desligada, reconexão, segunda sessão alterando a mesma revisão, usuário sem papel, engenheiro aprovando e impressão real. **Não importe dados antigos em modo efetivo antes de conferir a simulação.**

## Rodada 2 — complemento FastAPI/PostgreSQL (17/10/2026)

Esta seção substitui, para a rodada 2, as referências acima a Apps Script como backend vigente. O código Apps Script foi movido sem exclusão para `docs/dosagem-v2/arquivado/apps-script/`. O frontend continua em `dosagem-concreto-v2/`, com build estático em `dosagem-concreto/v2/`; o backend novo está em `dosagem-concreto-v2/api/`. **Estado: pronto para avaliação local; não implantado.**

### Feito e decisões

| Entrega | Resultado |
|---|---|
| Núcleo C40 | Teste golden com entradas e indicadores dos mockups aprovados. O Apêndice A recebido não contém a tabela completa; a origem do fixture está identificada no teste. CA III configurada conforme mockup: a/c máximo 0,55 e cimento mínimo 320 kg/m³, ainda sujeita à conferência normativa. |
| Granulometria | Fixture de 500 g das peneiras do mockup: MF 2,714, Dmáx 4,75 mm, zona ótima, perda zero. Apêndice B isolado informa só resultados, sem massas. |
| Legado | Testes dos três módulos portados para Vitest, valores esperados preservados. Casos de massas inválidas, divisões por zero e resultados não finitos ampliados. |
| Conversão | Navegador lê JSON, localStorage e .xlsx/.csv via SheetJS; preserva segunda areia e segundo aditivo com massas específicas independentes; rejeita densidade ausente com aviso. Inclui fornecedores e ensaios granulométricos de planilha/localStorage. Prévia e simulação antes de efetivar; lotes de até 500 registros. Página1, Experimental e demais formatos sem densidades ou conversor validado recebem aviso e não são importados. |
| API | FastAPI/Python 3.12, SQLAlchemy 2, Alembic, PostgreSQL JSONB, autenticação Supabase/JWT, papéis, unidade, transações, auditoria, idempotência, revisão otimista, importação. Contrato em `API.md`. |
| Interface | Bearer, JSON e Idempotency-Key nos headers; `VITE_API_URL` de produção configurada para o novo RPC. E2E mock atualizado. |
| Infraestrutura preparada | Templates nginx/systemd e scripts de provisionamento, deploy Windows/Linux, rollback e backup em `deploy/`. Nenhum foi executado na VPS. |

### Verificação da rodada 2

| Comando / ensaio | Resultado |
|---|---|
| `npm test -- --run` | 21 passaram, 1 falhou intencionalmente (golden C40, abaixo), 8 arquivos |
| `npm run build` | Passou; arquivos gerados em `dosagem-concreto/v2/`, com SheetJS carregado em chunk separado |
| `npm audit --audit-level=high` | 0 vulnerabilidades informadas |
| `npm run test:e2e` | 12/12 passaram em desktop, tablet retrato/paisagem e celular contra o contrato novo simulado |
| `api/.venv/Scripts/python -m pytest -q` | 7/7 passaram em PostgreSQL 16 temporário via `testing.postgresql`; Docker CLI presente mas daemon indisponível e cluster local acessível sem credenciais de teste |
| `git diff --check` | Sem erros de whitespace nos caminhos da Dosagem |
| VPS | `ssh -o BatchMode=yes -o ConnectTimeout=8 vps-antiga true` falhou: alias não resolvido. Nada foi instalado, reiniciado ou alterado remotamente |

### Divergência a decidir

O mockup do C40 apresenta `V_total = 1000,0 L`. Aplicando a fórmula especificada aos valores exibidos no próprio mockup, o núcleo calcula `1000,0520387687917 L`. A tolerância exigida é ±0,05 L; a diferença excede a faixa por `0,0020387687917 L`. O teste em `tests/golden/c40.test.ts` permanece falhando, como solicitado. É preciso esclarecer se o mockup usa densidades ou massas internas com mais casas, arredondamento intermediário diferente, ou outro valor de referência. Não houve alteração do esperado nem correção artificial da fórmula. A liberação do cálculo C40 fica pendente desta decisão.

### Deploy e reconhecimento pendentes

O alias `vps-antiga` deve ser configurado e o acesso por chave testado. Não se tentou senha nem IP direto, conforme o complemento. O inventário requisitado de SO, CPU, memória, disco, portas, serviços, nginx, PostgreSQL, Docker e certbot está em `VPS-RECONHECIMENTO.md`, com campos marcados como não observados. Também faltam DNS, `.env` privado, TLS, backup ativo e teste de restauração. Não é possível confirmar os códigos HTTP dos demais sites antes/depois ou declarar que o novo serviço escuta em produção. O template restringe Uvicorn a `127.0.0.1`.

Comandos exatos, da raiz do repositório, **depois de configurar SSH por chave e resolver a divergência C40**:

```powershell
ssh -o BatchMode=yes vps-antiga true
ssh -o BatchMode=yes vps-antiga 'cat /etc/os-release; nproc; free -m; df -h /opt; ss -ltnp; systemctl list-units --type=service --state=running --no-pager; nginx -T 2>/dev/null | grep -E "server_name|listen"; psql --version || true; pg_lsclusters || true; docker --version || true; certbot --version || true'
```

Após conferir os recursos e o servidor web, criar `/opt/concretrack-dosagem/shared/.env` com permissão 600, usando `dosagem-concreto-v2/api/.env.example` como modelo. Da raiz local, transferir apenas os arquivos desta aplicação:

```powershell
tar --exclude=.venv --exclude=__pycache__ --exclude=.env -czf dosagem-provisionamento.tar.gz dosagem-concreto-v2/api deploy
scp -o BatchMode=yes dosagem-provisionamento.tar.gz vps-antiga:/tmp/
ssh -o BatchMode=yes vps-antiga 'mkdir -p /tmp/dosagem-provisionamento && tar -xzf /tmp/dosagem-provisionamento.tar.gz -C /tmp/dosagem-provisionamento && mv /tmp/dosagem-provisionamento/dosagem-concreto-v2/api /tmp/dosagem-provisionamento/api && rmdir /tmp/dosagem-provisionamento/dosagem-concreto-v2 && bash /tmp/dosagem-provisionamento/deploy/scripts/provisionar.sh /tmp/dosagem-provisionamento'
powershell -ExecutionPolicy Bypass -File .\deploy\scripts\deploy.ps1
```

O script usa somente `vps-antiga` e reprova testes locais falhos. Para TLS e backup, seguir `deploy/README.md`.

### Checklist manual atualizado

- [ ] Resolver o golden C40 com fonte de engenharia e conferir os limites normativos.
- [ ] Conferir mapeamento e amostras dos três arquivos reais antes da importação; a interface divide em lotes de até 500 e formatos ainda não validados precisam de tratamento.
- [ ] Configurar SSH por chave, DNS e `.env` privado; preencher o reconhecimento da VPS e registrar códigos HTTP de outros sites.
- [ ] Provisionar somente recursos da Dosagem, implantar, verificar saúde local e pública, TLS e que outros sites mantêm seus códigos HTTP.
- [ ] Ativar e verificar timer diário; executar backup manual e restauração em banco temporário.
- [ ] Publicar o build estático no GitHub Pages depois dos gates; testar token real, usuários, papéis, importação, conflito, offline e carta em quatro tamanhos de tela.

## Rodada 4.1 — 18/10/2026

A especificação definitiva do pacote `dosagem-v2-definitiva-4.1-codex.zip` e suas três planilhas de referência foram incorporadas em `docs/dosagem-v2/`. A cópia da especificação anterior foi arquivada; o arquivo original do legado foi preservado. Este registro distingue o pedido do usuário (ler e executar) das instruções contidas no pacote: a especificação define critérios técnicos e portões, mas não substitui a autorização explícita do usuário nem a verificação do estado real.

| Fase | Estado | Evidência / bloqueio |
|---|---|---|
| F0 | Parcial | Código v2 da rodada anterior e Hub reconhecidos no `00-RECONHECIMENTO.md`; VPS acessível por chave SSH. A leitura desta rodada foi feita por root por ser a única identidade SSH configurada; nenhuma alteração foi feita na VPS. O usuário restrito `deploy-dosagem` e o wrapper de instalação ainda não existem. |
| F1 | Reprovado | Foram implementados módulos puros novos em TS e Python para o método principal e correção de umidade. Goldens P1, P1b, P5, P6 e P7 passam em ambos; propriedade de volume passou em 200 traços válidos. Ainda faltam P2, P3, P3b, A1–A3, I1, O1, N1, R1, S1, D1 e X1, integração dos núcleos com o editor/API e testes de paridade completos. |
| F2–F6 | Não iniciadas nesta rodada | O portão F1 reprovado impede as fases seguintes e o deploy. Nenhuma migração, instalação ou alteração de nginx/systemd foi executada. |
| F7 | Este relatório | Checklist e pendências abaixo. |

Verificações locais: `npx vitest run tests/golden/principal41.test.ts tests/golden/moisture41.test.ts` passou (6/6); os testes Python equivalentes executados diretamente passaram; `npm run build` passou. A suíte TS preexistente tem 1 falha em 22 testes: C40 calculado em 1000,052 L excede o esperado 1000,000 ±0,05 L. O valor esperado foi mantido. A suíte pytest completa não inicia neste ambiente por ausência de `testing.postgresql`. Os módulos 4.1 ainda não são usados pela interface nem pela API atual.

### Pendências antes de produção

1. Terminar todos os casos e motores da F1, ligar os métodos ao editor e à autoridade de cálculo do servidor, e resolver a divergência C40 com base técnica verificável.
2. Completar API, migrações somente aditivas, autenticação por ticket/OIDC com PKCE, snapshots imutáveis, aprovação e importadores (F2).
3. Completar os quatro ambientes e E2E nos tamanhos de tela, e executar homologação isolada com restauração de backup (F3/F4).
4. Medir a VPS por 10 minutos no portão F5. Criar a identidade de implantação restrita e o wrapper após revisão do script; verificar DNS/TLS e os códigos HTTP dos sites vizinhos antes e depois.
5. Só então preparar artefatos fora da VPS e executar F6, com rollback limitado ao código.

### Checklist manual por ambiente e tela

Em desktop 1440×900, tablet 820×1180 e 1180×820, e celular 390×844: Engenharia (dois métodos, curvas, otimização, aprovação), Laboratório (ensaios, CAA, ajustes, idades), Produção (umidade, dosado real, rastreabilidade, carta) e Gestão (sd, custos, comparação). Conferir foco/teclado, axe, salvamento confirmado pelo servidor, permissões e impressão. Este checklist ainda não foi executado.

## Continuação da rodada 4.1 — 18/10/2026

Este registro substitui o estado dos portões descrito acima para esta continuação. Os itens P1, P1b, P5, P6, P7 e a propriedade de volume de 200 traços da etapa anterior não foram refeitos como implementação.

| Fase / portão | Estado em 18/10 | Evidência e trabalho restante |
|---|---|---|
| F1 — cálculo | **Reprovado, apesar dos testes numéricos verdes** | Implementados em TS e Python P2, P3, P3b, A1, A2, A3, I1, O1, N1 e R1 com fixtures comuns e teste de paridade TS × Python. X1 tem verificação estrutural local de painel/comparador/carta/impressão e paridade de itens/resposta Python; falta a verificação integral para cada traço na interface real, impressão e resposta do servidor. Os casos-limite e fluxos complementares da §17.1 não estão completos. |
| F2 — dados/API | **Reprovado** | PostgreSQL 16 via `api/docker-compose.test.yml`; `testing.postgresql` removido. Migração aditiva, snapshot de versão aprovada, trigger de imutabilidade, recálculo no servidor e bloqueio por divergência testados. S1 foi exercitado com A1 histórico aprovado inserido no banco, porque o A1 da especificação usa modo planilha e seu volume físico não é aprovável pelo critério de balanço completo. Impacto da alteração da areia 2 e bloqueio da produção passaram. Autenticação por ticket de uso único/PKCE, papéis completos, importadores 4.1 e contrato atualizado ainda faltam. |
| D1 dentro de F2/F4 | **Parcial** | Verificador de SQL Alembic passa na migração real e reprova `DROP COLUMN`; rollback simulado troca apenas o código, preservando a linha gravada após a migração. Não foi testado que a release N−1 executa sobre o esquema N. |
| F3 — interface | **Reprovado** | Página `/dosagem41` integra cálculo local dos métodos Principal e Alternativo, painel, comparador, carta e impressão, além de salvar e solicitar aprovação pelo RPC. É uma implementação parcial: quatro ambientes, CAA, fluxos laboratoriais/produção/gestão, autenticação standalone, E2E nos quatro tamanhos e axe não estão completos. O build novo sai em `dosagem-concreto-v2/dist`; configuração de base/manifesto ainda aponta ao caminho antigo e os scripts de autenticação do Hub aparecem como avisos no build. |
| F4 — homologação local | **Não executada; portão reprovado** | Não há stack isolada nginx + API + PostgreSQL pronta e os portões anteriores estão vermelhos. Portanto não há E2E de homologação nem restauração de backup validada. |
| F5 — VPS | **Não iniciada** | A única tentativa SSH desta continuação foi como `deploy-dosagem@31.97.241.84`, com `BatchMode=yes`, e retornou `Permission denied (publickey,password)`. O reconhecimento anterior registrou que a conta e `/usr/local/sbin/ctdosagem-instalar` não existiam. Sem acesso restrito, não foi possível verificar novamente sua existência ou medir os recursos por 10 minutos. Nenhum acesso root ou alteração remota ocorreu nesta continuação. |
| F6 — produção | **Não iniciada** | A condição imposta pelo usuário para F5/F6 não foi satisfeita e os portões F1–F4 estão vermelhos. Nenhum deploy, migração ou restauração foi feito na VPS. Os artefatos locais de código/build são parciais, não um pacote liberado para produção. |

### Verificações desta continuação

| Verificação | Resultado |
|---|---|
| `npm test -- --run` | 42/42 testes passaram em 16 arquivos |
| `python -m pytest -q` | 25/25 passaram no PostgreSQL 16 de Docker Compose; 23 avisos de dependências |
| `npm run build` | TypeScript e Vite passaram, gerando `dist/`; PWA gerado. Avisos sobre scripts externos de autenticação legada no `index.html` |
| `alembic upgrade head --sql \| python ../deploy/scripts/verificar-migracoes.py` | Passou na migração aditiva; fixture destrutiva reprovada pelo teste |
| C40 | Teste convertido em conferência de traço digitado pelo balanço físico da §6.2, água líquida 180 L e volume integral dos aditivos, sem teor de sólidos. Esperado mantido em 1000,05 L; calculado 1000,0520387687917 L, diferença 0,0020387687917 L, dentro de ±0,01 L. A antiga comparação com 1000,0 ±0,05 falhava por 0,0020387687917 L além da tolerância. |

Os dois arquivos JavaScript/CSS não rastreados em `dosagem-concreto/v2/assets/` foram gerados por um build anterior desta continuação antes da correção do `outDir`. Os arquivos rastreados do legado foram restaurados. A revisão automática bloqueou a remoção dos dois arquivos gerados; permanecem apenas como arquivos não rastreados. Não se deve incluir esses arquivos em commit ou deploy. Nenhuma outra limpeza destrutiva foi tentada.

## Rodada seguinte — preparação autorizada da VPS (18/10/2026)

O script `docs/dosagem-v2/deploy/preparar-vps.sh` foi conferido contra o pacote 4.1 (SHA-256 idêntico), copiado para `/root/preparar-vps.sh`, posto em modo 700 e teve o hash remoto conferido. O hash local e remoto é `8b679886850e74ddcde08b1aeb10a1adde069654f87385989597b2c6db95e181`. A saída **completa** da simulação está em `VPS-PREPARACAO.md`.

**Portão 0.2 reprovado:** a simulação propõe `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`, alteração do banco fora das exceções explicitamente autorizadas para esta etapa. A role e o banco já existem; a simulação não propôs recriá-los nem instalar pacotes ou reiniciar serviços. O passo 0.3 não foi executado; 0.4–0.6 não foram executados, e a etapa 0 foi interrompida. O script copiado ainda está em `/root/preparar-vps.sh`, pois a remoção estava prevista no passo 0.6. Nenhuma migração ou deploy foi feito na VPS. As etapas locais F1–F4 continuam independentes.

Antes da simulação, `git clean -n -- dosagem-concreto/` listou: `.work-dosagem-v2-4.1/`, `PLANO_MODERNIZACAO.md`, `docs/`, `v2/assets/index-BQdA5Qy9.js` e `v2/assets/index-DwyCgfM7.css`. Somente os dois assets e `.work-dosagem-v2-4.1/` foram identificados como gerados nesta execução; os demais caminhos não devem ser apagados. A limpeza 0.7 não foi feita porque a etapa 0 parou no portão 0.2.

### Continuação local F1–F4 após o portão 0.2

| Portão | Situação | Evidência e lacuna |
|---|---|---|
| F1 | **Reprovado** | Os casos numéricos TS × Python continuam passando. P1b e A1 foram verificados em E2E real contra a API, nos quatro tamanhos, comparando massas, volume, a/c, a/agl, α e custo entre painel, comparador, carta, impressão e `resumoCalculado`/`itens` do servidor. C40 continua sendo conferência de traço digitado em teste unitário, mas falta o E2E integral de X1 para ele. |
| F2 | **Reprovado** | A investigação do Hub confirmou Supabase Auth. Foram adicionados ticket de uso único/60 s, PKCE S256, sessão por cookie, CORS exclusivo do endpoint de ticket, login local Argon2id, bloqueio após cinco falhas, troca obrigatória de senha inicial e teste do token fora dos logs de teste. Migração de autenticação é aditiva e o verificador analisa o SQL Alembic real. O plano experimental passou a exigir três condições distintas, volume, ensaios de fresco, CPs e critérios; há testes de bloqueio. A ponte estática foi criada em `auth/ponte-dosagem.html`, mas não implantada no Hub; faltam fluxos de laboratório completos, importadores 4.1 e a integração do bootstrap da conta de emergência ao provisionamento restrito. S1 permanece parcial quanto à aprovação literal do A1 em modo planilha. |
| D1 | **Aprovado localmente** | Verificador rejeita `DROP COLUMN` e aceita o SQL real das migrações; rollback simulado preserva dados; teste novo executou o código da release N−1 (`HEAD`) sobre o esquema N e obteve saúde e listagem HTTP 200. Não houve rollback em VPS. |
| F3 | **Reprovado** | A SPA usa base `/`, API de mesma origem e sessão própria; páginas de login, retorno e troca de senha foram construídas. O Playwright legado passou 12/12 em quatro tamanhos, com API simulada. O E2E real dos métodos P1b/A1 passou 8/8 em quatro tamanhos, incluindo axe sem violações sérias nesses percursos. Ainda faltam os fluxos 1–14 completos da §17.3, quatro ambientes, CAA, idades, produção e gestão. |
| F4 | **Reprovado, infraestrutura local validada** | `docker-compose.hml.yml` sobe nginx HTTPS, API Python 3.12 e PostgreSQL 16; os três serviços ficaram saudáveis e `/api/v1/saude` respondeu 200. Backup `pg_dump -Fc` foi restaurado em banco temporário; origem e restauração mostraram revisão `20261018_03` e 13 tabelas. Banco temporário e arquivo de dump foram removidos. Faltam E2E completos contra a stack e todos os portões anteriores verdes. |
| F5/F6 | **Não iniciados** | A etapa 0 parou no portão 0.2, sem conta restrita nem wrapper. Não houve medição contínua de 10 minutos, deploy, alteração de senha, instalação de pacote ou operação remota adicional. |

Contagem final verificada nesta continuação: Vitest **42/42**; pytest **30/30** (127 avisos de dependências); Playwright local com API simulada **12/12**; Playwright na homologação real **8/8**; build TS/Vite/PWA **passou**. O teste de captura do SQL Alembic teve uma falha de codificação no Windows, corrigida antes da rodada final verde. `git diff --check` não encontrou erro de whitespace (apenas avisos de normalização LF/CRLF).

A stack de homologação foi encerrada com `docker compose ... down` após os testes; o volume local `dosagem-v2-hml_hml_data` foi preservado para reprodução. Nenhum serviço de homologação ficou escutando no computador ao final desta rodada.

## Adendo 4.2 — Etapa 0 concluída (18/10/2026)

O texto anexado do adendo autorizou expressamente `REVOKE ALL ON DATABASE concretrack_dosagem FROM PUBLIC`; por isso a reprovação anterior do portão 0.2 não se aplica a esta rodada. O script local e `/root/preparar-vps.sh` tinham SHA-256 idêntico: `8b679886850e74ddcde08b1aeb10a1adde069654f87385989597b2c6db95e181`. Nova simulação e execução terminaram com código 0; a saída completa de ambas está em `VPS-PREPARACAO.md`. A role e o banco existentes foram reutilizados. Não houve instalação de pacotes ou reinício de serviços.

Foi criada a chave local exclusiva `~/.ssh/codex_dosagem_ed25519`; somente a chave pública foi instalada no `authorized_keys` de `deploy-dosagem` (dono correto, modo 600). O alias `vps-antiga` usa deploy-dosagem, a chave nova e `IdentitiesOnly yes`; a entrada SSH de root existente foi preservada. `id` confirmou uid/gid 1001 e grupo `ctdosagem`; o wrapper `diagnostico` funcionou; `sudo -n true` falhou com “a password is required”. Os nove códigos HTTP vizinhos permaneceram 200/200/301/302/302/200/200/200/200 na ordem do reconhecimento. `/root/preparar-vps.sh` foi removido no passo 6. Acesso root encerrado para o restante desta rodada.

### Limpeza local §6.3

`git clean -n` listou exatamente os dois assets não rastreados e `dosagem-concreto/.work-dosagem-v2-4.1/`; nenhum deles era rastreado pelo Git. Os três caminhos foram apagados individualmente com `git clean -f` (`-fd` para a pasta), após conferir que os caminhos resolvidos ficavam dentro do workspace. A pasta `.work-dosagem-v2-4.1/` na raiz não existia. `PLANO_MODERNIZACAO.md` e `dosagem-concreto/docs/` foram preservados.

## Decisões

- O arquivo completo `ADENDO-4.2-RELEASE1.md` e `GATES.json` não estavam no workspace nem nos pacotes locais ao iniciar esta rodada. O anexo “Pasted text.txt” contém só um extrato e omite os comandos da §4 e partes das §§2–3. O usuário foi solicitado a anexar a versão integral; enquanto isso, a Etapa 0 e a limpeza foram executadas com a autorização explícita presente no extrato.


## Continua??o do Adendo 4.2 ? 18/10/2026, 20:33 BRT

O usu?rio forneceu nesta rodada o texto **integral** do Adendo 4.2; ele foi registrado em `ADENDO-4.2-RELEASE1.md`. A anota??o anterior em ?Decis?es? sobre aus?ncia do adendo descreve apenas o come?o da rodada e est? superada por este registro.

Foi criado `scripts/gates.mjs` e executado novamente ap?s as ?ltimas altera??es. O resultado est? em `GATES.json` (`finishedAt` 2026-10-18T23:32:52.444Z). Nenhum estado verde foi escrito manualmente:

| Port?o | Situa??o | Verifica??o desta execu??o |
|---|---|---|
| F1 | **Verde** | N?cleo TS **25/25**, n?cleo Python **17/17**, IDs dos 16 casos e paridade verificados. |
| F2 | **Vermelho** | API **48/48** e verificador de migra??es aditivas passam; o audit ainda exige testes e implementa??o de CAA, produ??o e desforma. |
| F3 | **Vermelho** | Build passa; Playwright com API Docker real **16/16** passa nos quatro tamanhos, mas cobre apenas P1b, P5, A1 e o fluxo R1-13. Os fluxos R1-01 a R1-12 e R1-14 n?o est?o completos; m?nimo de 56 n?o atingido. |
| F4 | **Vermelho** | Homologa??o HTTPS **16/16**, backup/restaura??o e compatibilidade N?1 **1/1** passam; faltam os mesmos fluxos. Stack encerrada. |
| F5/F6 | **N?o iniciados** | Condi??o expl?cita do Adendo ?6.2 ainda falsa: F2?F4 vermelhos. Nenhum deploy foi feito. |

### Decis?es desta continua??o

- A importa??o Rica v4 foi implementada como **refer?ncia de confer?ncia**, com massa e densidade de cada item, volume f?sico recalculado, aviso de diverg?ncia e estado sem aprova??o. A planilha n?o traz fck confi?vel nas abas pedidas; portanto o importador n?o inventa um objetivo de engenharia nem aprova esses dados como tra?o de produ??o.
- Udemy e Curva de Abrams tamb?m entram como refer?ncias de confer?ncia. A segunda curva do arquivo de refer?ncia n?o tem R28 medidos; seus pontos ficam vazios e o usu?rio recebe aviso, sem valores fabricados.
- O importador usa o mapeamento idempotente `origem` + aba no RPC existente. O teste de API usa as quatro abas reais e verifica simula??o sem grava??o, efetiva??o e repeti??o sem duplicar. A interface foi testada na homologa??o real nos quatro tamanhos, com axe.
- O primeiro E2E completo teve um `ERR_ABORTED` transit?rio no carregamento HTTPS inicial em tablet paisagem. A navega??o de login passou a usar `domcontentloaded` e repetir somente esse erro; a execu??o final passou **16/16** tanto em F3 quanto em F4. Nenhum teste foi pulado.

### Pr?xima sess?o

1. Implementar e testar CAA (classes, espalhamento e manuten??o), produ??o P6 com massas a pesar, ?gua dosada, lotes, umidade com hora, equipamentos, dosado/toler?ncias, e desforma por CP do lote. Adicionar os testes de API R1-CAA, R1-PRODUCAO e R1-DESFORMA.
2. Completar acesso/usu?rios, cadastros, laborat?rio, curvas, plano experimental e hist?ricos que faltam na interface; executar os fluxos R1-01 a R1-12 e R1-14, cada um nos quatro tamanhos e com axe. Manter X1 de P1b/P5/A1 com todas as grandezas; C40 s? no unit?rio.
3. Rodar `npm run gates` at? F1?F4 ficarem verdes. S? ent?o, como `deploy-dosagem`, medir F5 por 10 minutos e executar F6 com o wrapper autorizado. Atualizar relat?rio e `GATES.json` ap?s cada nova tentativa.


## Port?es ap?s CAA, produ??o e desforma ? 18/10/2026, 20:45 BRT

`npm run gates` foi executado ap?s as altera??es e atualizou `GATES.json` em `2026-10-18T23:45:24.880Z`. Resultado **F1 verde, F2 verde, F3 vermelho, F4 vermelho**. F1: 25/25 TS, 17/17 Python e paridade/IDs. F2: 50/50 testes da API, 3/3 testes de convers?o das planilhas reais e migra??o aditiva. F3: build e 16/16 E2E reais passam, mas apenas quatro cen?rios s?o cobertos nos quatro tamanhos; 13 fluxos R1-E2E seguem ausentes, exig?ncia de 56 testes n?o atingida. F4: 16/16 E2E de homologa??o, backup/restaura??o e compatibilidade N?1 1/1 passam, mas os mesmos 13 fluxos faltam. A stack foi encerrada.

### Decis?es atualizadas

- O servidor exige classes CAA SF/VS/IEV e resultados de espalhamento, T500, estabilidade, manuten??o, finos e CPs em cada mistura antes da aprova??o. As faixas SF e o limite VS1 seguem a ?9.3; o plano define a perda m?xima de espalhamento.
- A produ??o aprovada usa o snapshot congelado, calcula massas ?midas e ?gua dosada via corre??o f?sica ?6.4, registra dosado real e alerta para desvios de cimento/?gua ?1 %, agregados ?2 % e aditivos ?3 %. A interface `/producao-r1` permite cadastrar produto, planejar betonada, registrar dosado e solicitar desforma; lotes/equipamentos e auditoria de decis?o do alerta ainda precisam ser completados.
- A libera??o de desforma exige dois CPs medidos do pr?prio lote, idade-alvo e crit?rio do produto; o maior dos dois ? o exemplar padr?o da ?9.5. Estimativa de curva n?o libera lote. O teste integrado exerce bloqueio por falta de CP, resist?ncia insuficiente e libera??o com CP conforme.
- O teste de interface de importa??o Rica v4 completou o fluxo R1-13 nos quatro tamanhos. Os importadores Udemy e Curva de Abrams t?m testes das planilhas reais em TS e Python; ainda falta a tela de Curva de Abrams com ajuste visual do P2.

### Pr?xima sess?o ? pend?ncias exatas

1. Completar os fluxos de interface R1-01 a R1-12 e R1-14, em desktop, tablet retrato, tablet paisagem e celular, com axe em todas as telas visitadas. Os E2E atuais P1b/P5/A1 e R1-13 n?o substituem os 13 fluxos ausentes. Incluir login/Hub/troca de senha, cadastros e laborat?rio, curva P2, plano experimental, CAA, idades/desforma, S1, produ??o P6 e offline/conflito.
2. Completar a interface de produ??o com lotes, equipamentos, umidade com hora e identidade do medidor, carta rastre?vel e decis?o de alerta; cadastrar produtos/equipamentos/lotes; validar em E2E real. Completar curvas, gr?ficos e compara??es previstos para Release 1. Manter Release 2 desativada.
3. Rodar `npm run gates` novamente. Somente com **F1?F4 verdes** iniciar F5 (medi??o VPS de 10 min) e F6 como `deploy-dosagem`, pelo wrapper. N?o usar root. Registrar DNS/TLS e a ponte do Hub conforme ?6.2.

## Adendo 4.3 — piloto implantado em 18/10/2026

O texto integral recebido do Ricardo foi salvo em `ADENDO-4.3-PILOTO.md`. O perfil `npm run gates -- --perfil piloto` gravou `GATES-PILOTO.json` automaticamente na execução final de 19/10/2026 01:20:04–01:23:31 UTC. **P-F1, P-F2, P-F3 e P-F4 ficaram verdes** por código de saída 0 nesta execução. O perfil completo e `GATES.json` não foram alterados nesta rodada.

| Portão piloto | Resultado verificado |
|---|---|
| P-F1 | 25/25 testes TS, 17/17 Python, IDs dos 16 casos e paridade. |
| P-F2 | 51/51 testes da API, 3/3 do importador, migração Alembic aditiva e auditoria Release 1. Inclui teste de `piloto=true`, bloqueio da desforma real e restrição de usuários. |
| P-F3 | Build TS/Vite/PWA verde; 20/20 Playwright nos quatro tamanhos contra API real em Docker: P1b, P5, A1, R1-13 e login local com troca de senha e saída. O smoke confere a faixa, a marca d'água e axe nas telas visitadas. |
| P-F4 | 20/20 Playwright na homologação, backup/restauração, compatibilidade N−1 1/1; stack encerrada. |

**F5 passou.** Como `deploy-dosagem`, houve 21 amostras em 10 minutos, de 00:47:04 a 00:57:06 UTC. Média de load15 0,10 para 2 vCPU, RAM disponível mínima 5739 MB, swap 0, disco livre 40 GB, iowait máximo 0%; PostgreSQL respondeu. Os nove sites ficaram em 200/200/301/302/302/200/200/200/200 antes e depois. Saída integral em `VPS-F5-PILOTO.log`. A transferência do script pelo PowerShell acrescentou um CR *após* `END`, gerando saída 127 depois de todas as medições; o verificador independente `python dosagem-concreto-v2/deploy/scripts/check-f5-log.py docs/dosagem-v2/VPS-F5-PILOTO.log` passou com código 0, confirmando duração de 601 segundos, 21 amostras, limites e sites.

**F6 piloto implantado**, somente via SSH `vps-antiga` (`deploy-dosagem`) e sudo restrito ao wrapper. Release ativa: `/opt/concretrack-dosagem/releases/20261019-010306-piloto`. Arquivo de release final local e remoto com SHA-256 `437498bcfb1d257cdb36189bc4e7319baa29c260a0717ede3d6f9e7f05217b0e`. O Python 3.12 isolado e a `.venv` existentes foram reutilizados; quatro dependências de autenticação ausentes foram copiadas como artefatos da imagem local de homologação para `api/vendor`. Não houve `pip`, instalação de pacote ou uso de root na VPS. A migração `20261018_04` foi verificada como aditiva e aplicada após dump pré-migração. O `.env` existente cresceu exatamente 17 bytes (471→488), correspondentes a `MODO_PILOTO=true`; as demais linhas não foram modificadas.

A API e o timer diário de backup estão ativos; `/api/v1/saude` respondeu 200 com `piloto=true`, e a página respondeu 200 pelo túnel. O login do admin foi confirmado no navegador: faixa PILOTO visível, sessão HTTP 200 e redirecionamento para troca obrigatória da senha inicial. A senha não aparece neste relatório nem nos logs de teste. O arquivo protegido `ADMIN_SENHA_INICIAL.txt` está em modo 600, dono `ctdosagem`; a diferença do dono `root` previsto na 4.1 decorre da proibição posterior de root. O smoke de produção confirmou que há **somente o admin**, criou P1b pelo método Principal (1000,00 L; 321 kg) e A1 pelo Alternativo (999,969085 L; 351 kg), ambos com `piloto=true`, e removeu os dois traços e seus registros de auditoria. A conferência numérica e a limpeza ocorreram por rotina isolada do servidor; a criação interativa no navegador continua pendente da troca de senha pelo Ricardo. Após mais de cinco minutos, os nove sites mantinham os códigos anteriores; load 0,48/0,37/0,24, RAM disponível 5674 MB e disco livre 40 GB.

### Decisões do piloto

- `dosagem.concretrack.com.br` não resolve para `31.97.241.84` na VPS. Foi publicado apenas o desafio HTTP; a aplicação é acessível por túnel `ssh -L 18443:127.0.0.1:18380 vps-antiga` em `http://127.0.0.1:18443/`. **TLS público está pendente.** Após corrigir o DNS, executar `sudo /usr/local/sbin/ctdosagem-instalar certbot` como `deploy-dosagem`, preparar o site HTTPS da Dosagem e usar o wrapper para validar/recarregar nginx.
- A pasta `shared` tinha permissão 2750 e impedia `ctdosagem` de criar o arquivo da senha inicial; ela passou a 2770, mantendo a segregação pelo grupo `ctdosagem`. O primeiro smoke de produção importou acidentalmente o pacote Python da release antiga pela `.venv`; `PYTHONPATH` agora aponta primeiro à API ativa e depois ao `vendor`. O smoke foi repetido e passou, sem deixar traços de teste.
- Antes da implantação, `current` era um link autorreferente e a release antiga não tinha `web`; portanto **não há uma release N−1 funcional na VPS para rollback**. O script de rollback apenas de código está no pacote, e a compatibilidade N−1 foi testada localmente, mas o retorno remoto a uma versão funcional anterior não pôde ser demonstrado nesta primeira implantação. Nenhum rollback de banco foi feito.
- O acesso pelo Hub continua pendente da publicação de `auth/ponte-dosagem.html` no repositório próprio do Hub; o login local funciona. Release 2 permanece desativada com “Em breve”. O legado continua oficial; as cartas do piloto trazem marca d'água e a desforma real é bloqueada no servidor.
- Na última revisão, a faixa e a marca d'água passaram a aparecer também enquanto o navegador confirma o modo piloto, evitando impressão sem aviso antes da resposta de `/api/v1/saude`. A tela de retorno do Hub recebeu a mesma faixa. O perfil piloto foi repetido e ficou todo verde após essa correção; o `index.html` gerado e publicado tem SHA-256 idêntico nos dois lados.

### Próxima sessão — trabalho restante

1. Ricardo: apontar o DNS de `dosagem.concretrack.com.br` para `31.97.241.84`, emitir o certificado com o comando acima e ativar HTTPS pelo wrapper. Ler a senha inicial no arquivo protegido da VPS e trocá-la no primeiro acesso; não copiar a senha ao relatório. Publicar a ponte no repositório do Hub conforme o Adendo 4.2.
2. Completar e testar os 13 fluxos E2E R1-01 a R1-12 e R1-14 nos quatro tamanhos, com axe e API real; concluir as telas de laboratório, cadastros, produção rastreável, curva P2, CAA, impacto S1 e offline/conflito. Rodar `npm run gates` até F1–F4 completos verdes. O piloto não substitui esses portões.
3. Depois dos portões completos verdes, fazer novo deploy normal e `MODO_PILOTO=false`; registrar a decisão do Ricardo sobre os dados do piloto. Preparar um alvo de rollback remoto funcional antes da virada oficial.

## 19/10/2026 — conta local do Ricardo e visibilidade da senha

A conta `ricardo.rda@gmail.com` foi criada no piloto com papel `admin` (maior privilégio disponível) e unidades `["*"]`. A senha indicada pelo usuário foi transformada em hash Argon2id localmente; nenhum texto de senha foi salvo no repositório, release ou relatórios. O hash temporário foi consumido e removido. A conta permite acesso direto. Login real HTTP 200; sessão `papel=admin`, `unidades=["*"]`, `trocarSenha=false`.

Login e troca de senha agora oferecem “Mostrar senha”/“Ocultar senha”. O smoke exercita ambos nos quatro tamanhos. Para evitar contenção local, Playwright usa dois workers, timeout de 120 s e espera de 15 s; fluxos e valores esperados foram mantidos. `npm run gates -- --perfil piloto` terminou em 19/10/2026 10:23:08 UTC com P-F1–P-F4 verdes: 25 TS + 17 Python, 51 API + 3 importação, 20/20 E2E em P-F3 e 20/20 em P-F4, backup/restauração e N−1 aprovados. `GATES-PILOTO.json` foi gravado pelo script; o perfil completo ainda requer os 13 fluxos R1 ausentes.

A release `/opt/concretrack-dosagem/releases/20261019-ricardo-master-piloto` foi ativada como `deploy-dosagem`; os únicos comandos com sudo foram `ctdosagem-instalar units`, `enable concretrack-dosagem-user-ricardo.service` e `restart-api`. Sem root, pacote, migração ou mudança do `.env`. API e página HTTP 200, saúde `piloto=true`, nove sites vizinhos em 200/200/301/302/302/200/200/200/200. Túnel local `127.0.0.1:18443` reaberto.

### Decisões

- “Master” foi mapeado para `admin` com todas as unidades, pois não existe papel `master` no esquema.
- A criação pontual autorizada pelo Ricardo não abre o cadastro comum de usuários no piloto; `usuarios.salvar` continua bloqueado.
- A senha indicada pelo usuário está ativa, sem troca obrigatória. O legado continua oficial.

### Próxima sessão

1. Ricardo acessa `http://127.0.0.1:18443/auth/login/` com a conta nova e entra diretamente.
2. Concluir R1-01 a R1-12 e R1-14 e deixar o `npm run gates` completo verde.
3. Resolver DNS/TLS e a ponte com o Hub conforme os adendos.

Correção após o relato de acesso: a provisão inicial marcou a senha escolhida pelo Ricardo como provisória. A própria API de troca de senha confirmou a mesma senha e removeu essa marcação, sem mudar o valor informado. O navegador foi testado até a página inicial; login HTTP 200, sessão admin com trocarSenha=false.

## 21/10/2026 — curvas de empacotamento e pacote único de código

As curvas do módulo de empacotamento agora acompanham o documento do traço salvo; entrada parcial ou inválida bloqueia a gravação. A homologação real confirmou o campo `empacotamento` somente no método principal, com as duas curvas de 12 pontos, nos quatro tamanhos. O método por volume permanece independente. O código textual do legado, da v2, o HTML e o build foram exportados em um único `PROJETO-COMPLETO-CODIGO-HTML-20261021.md`, com manifesto SHA-256 e indicação dos binários e segredos não embutidos.

`npm run gates -- --perfil piloto` encerrou com P-F1–P-F4 verdes (28/28 E2E em cada ciclo, backup/restauração e N−1). `npm run gates` completo manteve F1–F2 verdes e F3–F4 vermelhos: seguem ausentes os fluxos R1-01 a R1-12 e R1-14. Uma falha isolada de login no P5 de tablet retrato sob quatro workers não se repetiu no ciclo F4 com dois; a configuração F3 de API real foi alinhada a dois workers e 120 s.

O frontend validado foi ativado como `deploy-dosagem` em `/opt/concretrack-dosagem/releases/20261021-frontend-packing-piloto`, preservando a release anterior. Pacote SHA-256 `68dca845bb93ccdd8d2c671135560756eba4562de8f6ce0ab5ec709d42d75a8a` igual nos dois lados. Página e API públicas HTTP 200, `banco=ok`, `piloto=true`; nove sites vizinhos com códigos 200/200/301/302/302/200/200/200/200. Banco, API, credenciais e configuração não mudaram.

### Próxima sessão

Completar os 13 fluxos R1 pendentes e suas telas com axe em quatro tamanhos, executar `npm run gates` até F1–F4 verdes e só então preparar a implantação oficial e a decisão sobre os dados piloto. O legado continua oficial.

### Continuação de 21/10/2026 — Curva de Abrams P2

A tela Ferramentas ganhou o ajuste P2 com A, B, k1, k2, R² e tabela de projeto; R1-03 passou nos quatro tamanhos com axe e API real. `npm run gates` terminou com F1/F2 verdes e F3/F4 vermelhos: 24/24 E2E existentes passaram, mas ainda faltam 12 fluxos R1 obrigatórios e o mínimo de 56. `npm run gates -- --perfil piloto` ficou inteiramente verde, com 32/32 E2E em P-F3 e P-F4. A release frontend `/opt/concretrack-dosagem/releases/20261021-frontend-abrams-piloto` foi ativada, preservando `/opt/concretrack-dosagem/releases/20261021-frontend-layout-piloto` para rollback. Detalhes e verificações públicas: `RELATORIO-IMPLANTACAO-ABRAMS-20261021.md`.

Próxima sessão: completar R1-01, R1-02, R1-04 a R1-12 e R1-14, rodar os portões completos e então preparar a virada oficial. O legado continua oficial.

### Continuação de 21/10/2026 — R1-01, R1-02, P1b/P5/A1 e impressão

Foram concluídos os fluxos R1-01 (login local, troca, saída e ponte Hub simulada com ticket/PKCE), R1-02 (cadastros, MF 2,586 e massa específica), R1-04, R1-05 e R1-07 (P1b/P5/A1 do objetivo ao servidor, incluindo comparador e PDF). O resumo α passou a usar a fração de argamassa em massa; o método por volume exibe finos. A impressão da carta, antes vazia em desktop, foi corrigida e verificada por extração do PDF nos quatro tamanhos.

`npm run gates`: F1/F2 verdes, F3/F4 vermelhos pela cobertura ainda incompleta; 32/32 E2E passaram em cada ciclo, mas o mínimo é 56 e faltam R1-06, R1-08 a R1-12 e R1-14. `npm run gates -- --perfil piloto`: P-F1 a P-F4 verdes, com 32/32 E2E em P-F3 e P-F4, backup/restauração e N−1. Registros automáticos em `GATES.json` e `GATES-PILOTO.json`.

A release piloto `/opt/concretrack-dosagem/releases/20261021-r1-0102-x1-piloto` foi ativada, preservando `/opt/concretrack-dosagem/releases/20261021-frontend-abrams-piloto` para rollback. Página, bundle e API responderam HTTP 200, `banco=ok`, `piloto=true`; nove sites vizinhos mantiveram seus códigos. Detalhes, hashes e a primeira ativação revertida automaticamente: `RELATORIO-IMPLANTACAO-R1-PARCIAL-20261021.md`.

Próxima sessão: concluir R1-06, R1-08 a R1-12 e R1-14, executar os portões completos até F1–F4 verdes e só então preparar a virada oficial. O legado continua oficial.

### Continuação de 21/10/2026 — R1-06, R1-08 e R1-12

Foram implementadas a correção da betonada A1 no cliente e servidor, a gravação das três misturas experimentais com bloqueio da aprovação incompleta, e a rastreabilidade da produção com hora, responsável, balança e lotes. R1-06, R1-08 e R1-12 passaram cada um nos quatro tamanhos contra a API real, com axe. Build e teste da API S1 passaram.

`npm run gates` terminou com F1/F2 verdes e F3/F4 vermelhos: 44/44 E2E passaram em cada ciclo, abaixo dos 56 exigidos. A auditoria aponta R1-09, R1-10, R1-11 e R1-14 ausentes nos quatro tamanhos. Backup/restauração e N−1 passaram. Os resultados estão em `GATES.json` e `RELATORIO-AVANCO-R1-20261021.md`; o Markdown único de código foi regenerado. Nenhum deploy foi feito nesta continuação; o piloto e o legado oficial permanecem como estavam.

Próxima sessão: completar os quatro fluxos ausentes, repetir F1–F4 e então avaliar a ativação oficial conforme o Adendo 4.2.

## 22/10/2026 — Release 1 validada e preparada

R1-09 a R1-14 foram concluídos. `npm run gates` terminou em 22/10/2026 08:41:10 UTC com F1–F4 verdes, 60/60 testes Playwright em cada ciclo, backup/restauração e N−1. F5 passou no verificador independente com 21 amostras em 600 s, nove sites vizinhos sem alteração de código HTTP, PostgreSQL disponível, load15 médio 0,11, RAM mínima 5.546 MB e disco mínimo 39 GB. Foi preparada na VPS a release `/opt/concretrack-dosagem/releases/20261022-release1-oficial` (SHA-256 `b984b1c7282150edf249e7cc8183d142fbfe39f07f55176a0a42eca875c57c74`), sem ativá-la. A release ativa continua a piloto `20261021-r1-0102-x1-piloto`. Detalhes em `RELATORIO-RELEASE1-20261022.md`.

Após Ricardo decidir preservar os registros piloto identificados, a release oficial foi ativada às 09:57 UTC. API e página públicas responderam HTTP 200, `banco=ok`, sem marcador de piloto; os nove sites vizinhos mantiveram os códigos anteriores. A release piloto `20261021-r1-0102-x1-piloto` foi mantida como rollback. O smoke autenticado público depende da sessão ou senha do Ricardo; detalhes e evidências estão em `RELATORIO-RELEASE1-20261022.md`.

F7 avançou com smoke público da tela de login (captura sem faixa PILOTO) e cálculo P1b/A1 no Python da release ativa na VPS: 1000 L/321 kg e 999,969085 L/351 kg, respectivamente. Naquele momento, a conferência manual autenticada dos dois métodos ainda constava no checklist do relatório.

Em 22/10/2026, Ricardo respondeu que já realizou a conferência autenticada solicitada dos dois métodos no site oficial. O agente não acompanhou sua sessão nem recebeu capturas ou valores dessa execução; a confirmação do usuário consta como evidência manual em `RELATORIO-RELEASE1-20261022.md`. A release oficial permaneceu ativa e o health público continuou HTTP 200 com banco OK na última conferência independente às 10:39 UTC.
