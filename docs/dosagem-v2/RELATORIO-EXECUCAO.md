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
| Conversão | Navegador lê JSON, localStorage e .xlsx/.csv via SheetJS; preserva segunda areia e segundo aditivo com massas específicas independentes; rejeita densidade ausente com aviso. Prévia e simulação antes de efetivar. Os formatos sem conversor validado recebem aviso e não são importados. A interface ainda envia um único lote; arquivos acima de 500 registros precisam ser separados. |
| API | FastAPI/Python 3.12, SQLAlchemy 2, Alembic, PostgreSQL JSONB, autenticação Supabase/JWT, papéis, unidade, transações, auditoria, idempotência, revisão otimista, importação. Contrato em `API.md`. |
| Interface | Bearer, JSON e Idempotency-Key nos headers; `VITE_API_URL` de produção configurada para o novo RPC. E2E mock atualizado. |
| Infraestrutura preparada | Templates nginx/systemd e scripts de provisionamento, deploy Windows/Linux, rollback e backup em `deploy/`. Nenhum foi executado na VPS. |

### Verificação da rodada 2

| Comando / ensaio | Resultado |
|---|---|
| `npm test -- --run` | 20 passaram, 1 falhou intencionalmente (golden C40, abaixo), 8 arquivos |
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
ssh -o BatchMode=yes vps-antiga 'mkdir -p /tmp/dosagem-provisionamento && tar -xzf /tmp/dosagem-provisionamento.tar.gz -C /tmp/dosagem-provisionamento && bash /tmp/dosagem-provisionamento/deploy/scripts/provisionar.sh /tmp/dosagem-provisionamento'
powershell -ExecutionPolicy Bypass -File .\deploy\scripts\deploy.ps1
```

O script usa somente `vps-antiga` e reprova testes locais falhos. Para TLS e backup, seguir `deploy/README.md`.

### Checklist manual atualizado

- [ ] Resolver o golden C40 com fonte de engenharia e conferir os limites normativos.
- [ ] Conferir mapeamento e amostras dos três arquivos reais antes da importação; separar lotes de até 500 e tratar formatos ainda não validados.
- [ ] Configurar SSH por chave, DNS e `.env` privado; preencher o reconhecimento da VPS e registrar códigos HTTP de outros sites.
- [ ] Provisionar somente recursos da Dosagem, implantar, verificar saúde local e pública, TLS e que outros sites mantêm seus códigos HTTP.
- [ ] Ativar e verificar timer diário; executar backup manual e restauração em banco temporário.
- [ ] Publicar o build estático no GitHub Pages depois dos gates; testar token real, usuários, papéis, importação, conflito, offline e carta em quatro tamanhos de tela.
