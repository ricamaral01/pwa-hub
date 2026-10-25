# CODEX — ConcreTrack Dosagem v2 (standalone)

**Especificação para execução única** · versão 1.0 · 17/10/2026 · dono do produto: Ricardo

> Execute este documento de ponta a ponta, em uma única rodada, sem parar para pedir aprovação.
> Quando faltar informação, siga a regra de decisão indicada na seção, registre a escolha em
> `docs/dosagem-v2/RELATORIO-EXECUCAO.md` e continue. O Ricardo testa tudo depois e
> as correções vêm em rodadas curtas.

---

## 0. Resumo do que construir

Uma nova aplicação **standalone** de dosagem de concreto (React + TypeScript + Vite).
Ela substitui a SPA atual `dosagem-concreto/index.html` (~700 KB) e deve:

1. Ter **paridade funcional total** com a aplicação atual. Nenhuma função existente pode se perder.
2. Usar um **modelo único de traço**. Toda tela calcula com o mesmo núcleo de cálculo.
3. Gravar com **confirmação real** e **autorização no servidor**.
4. Ter **três layouts distintos**: desktop, tablet e celular. Não basta uma página que só encolhe.
5. Usar a **casca visual do redesign** (paleta navy / vermelho / amarelo, sidebar, barra superior, stepper, painel de resultado fixo).
6. Rodar em **paralelo** com a aplicação atual, sem tocar nos dados nem no código legado.

---

## 1. Decisões fechadas (não reabrir)

| # | Decisão |
|---|---|
| D1 | A aplicação é **standalone**. Não é módulo do Unificado. É publicada no mesmo site estático de hoje, em `https://usina.concretrack.com.br/dosagem-concreto/v2/`. |
| D2 | O legado em `dosagem-concreto/` **não é alterado** e segue no ar. A troca de URL é uma tarefa posterior, depois dos testes. |
| D3 | O backend é **Google Apps Script v2**: um projeto novo, ligado a uma **planilha nova** ("ConcreTrack Dosagem v2"). As planilhas antigas são só lidas, pelo importador. |
| D4 | O frontend usa React 18, TypeScript estrito, Vite, React Router (HashRouter), Zustand, Zod, Vitest e Playwright. Gráficos são componentes SVG próprios, sem biblioteca de gráficos. |
| D5 | O traço é um **documento versionado** (`rascunho → em_teste → aprovado → inativo`) com **lista de itens de material**. Não há campos fixos do tipo "areia2" ou "aditivo2". |
| D6 | O percurso do traço tem 5 etapas: **Objetivo → Materiais → Proporções → Validação → Carta**. |
| D7 | Vermelho `#DB0A40` só para **ação primária e item ativo**. Os estados usam verde, âmbar e vinho, sempre com ícone e texto. |
| D8 | Há três layouts por largura, com opção de forçar o modo em Configurações: celular < 600 px, tablet de 600 a 1279 px, desktop ≥ 1280 px. |
| D9 | Somente tema claro nesta versão. |
| D10 | Idioma pt-BR. Vírgula decimal na exibição. A entrada aceita vírgula ou ponto. |

---

## 2. Regras invioláveis

1. **Não altere nem apague** nada em `dosagem-concreto/` (legado). Também não altere os três Apps Scripts antigos nem as planilhas antigas. A única exceção permitida está na §15.3 (exceção no service worker do Hub).
2. **Não invente fórmula.** Toda fórmula do legado é **portada** a partir do código existente e documentada em `docs/dosagem-v2/FORMULAS.md` com a referência de origem (`arquivo:linha`). As fórmulas novas desta especificação estão escritas aqui; não use outras.
3. **Nenhuma tela mostra "salvo"** sem resposta do servidor com `id`, `versao` e `revisao`.
4. **Nenhum `NaN`, `Infinity` ou valor negativo impossível** chega à tela, à carta ou ao servidor.
5. **Segredos fora do código público.** Tokens, segredos de JWT e IDs de planilha ficam em Script Properties (servidor) ou em `.env` (build, apenas IDs públicos de deploy).
6. **Commits pequenos**, por etapa, com mensagem descritiva em português.
7. **Ao final, gere o relatório** (§16), mesmo que alguma etapa tenha ficado incompleta. O que não foi feito aparece listado como pendente, com o motivo.

---

## 3. Etapa 0 — Reconhecimento (antes de escrever código)

Produza `docs/dosagem-v2/00-RECONHECIMENTO.md` contendo:

1. **Repositório e publicação.** Como o site estático é publicado (GitHub Pages por branch ou por Actions), onde ficam `dosagem-concreto/`, `auth/` e `sw.js`, e qual é o domínio.
2. **Autenticação do Hub.** Leia `auth/config.js`, `auth/client.js` e `auth/guard.js`. Descubra:
   - qual provedor emite a sessão (Supabase Auth, Google ou outro);
   - onde fica o token de acesso e como lê-lo no navegador;
   - qual tipo de token é (JWT HS256, ES256/RS256 ou opaco);
   - como obter e-mail e nome do usuário logado;
   - como o guard redireciona quem não está logado.
3. **Inventário de paridade.** Liste todas as 24 seções `sec-*` do `index.html` legado e cada função visível ao usuário (botões, cálculos, exportações, impressões, importações). Gere `docs/dosagem-v2/PARIDADE.md` como tabela:
   `| Seção legada | Função | Onde fica no v2 (tela/etapa) | Status (feito / parcial / pendente) |`
   Atualize o status ao final.
4. **Fórmulas legadas.** Leia `argamassa-calculo.js`, `dosagem-cientifica.js`, `dosagem-por-argamassa.js`, o cálculo principal (`index.html` ~6787–6892), o cálculo inverso, a análise volumétrica (Abrams e empacotamento), a granulometria, a massa específica e os custos MCC. Transcreva cada fórmula para `FORMULAS.md` com nome, variáveis, unidades e origem.
5. **Dados legados.** Leia os três Apps Scripts (`AppsScript_dosagem.gs`, `AppsScript_custoMCC.gs`, `AppsScript_fornecedores_e_granulometria.gs`). Documente as abas e colunas de cada planilha e todas as chaves de `localStorage` usadas pelo legado, com o formato de cada uma (cartas, banco local de traços, cenários A/B/C, exportação JSON).

**Regra de decisão:** se algo do legado for ambíguo, porte o comportamento atual tal como está e anote no relatório.

---

## 4. Arquitetura e estrutura de pastas

```text
dosagem-concreto-v2/                 # código-fonte (novo)
  package.json  vite.config.ts  tsconfig.json  playwright.config.ts  .env.example
  index.html
  src/
    app/            # roteamento, providers, layout shell (Desktop/Tablet/Mobile)
    core/           # NÚCLEO DE CÁLCULO — TS puro, sem DOM, sem React
      model.ts        # tipos de domínio (§5)
      units.ts        # parse/format pt-BR, conversões
      validate.ts     # validação (§6.6)
      calc/
        volumes.ts  indicadores.ts  umidade.ts  custo.ts  limites.ts
        abrams.ts  granulometria.ts  massaEspecifica.ts
        metodoManual.ts  metodoCientifica.ts  metodoTeorArgamassa.ts
        calculoInverso.ts  empacotamento.ts
      alerts.ts       # gera pendências a partir do resultado
      config/
        indicadores.config.ts   # definições ajustáveis pela engenharia (§6.3)
        nbr12655.ts             # tabela de limites (§6.4)
        nbr7211.ts              # zonas granulométricas (§6.5)
    data/           # cliente da API, IndexedDB, outbox, sincronização
    features/       # telas por domínio (inicio, tracos, materiais, fornecedores,
                    # ensaios, ferramentas, custos, referencia, config, importacao)
    ui/             # design system: tokens.css, componentes
    print/          # carta e relatórios imprimíveis
  tests/
    unit/  golden/  e2e/
  apps-script/      # backend v2 (clasp)
    appsscript.json  Code.gs  auth.gs  repo.gs  import.gs  README.md
docs/dosagem-v2/    # reconhecimento, paridade, fórmulas, API, relatório
dosagem-concreto/v2/  # SAÍDA DO BUILD publicada (ou artefato de Actions; ver §15)
```

**Regra:** `src/core/` não importa nada de `react`, `data/`, `ui/` ou `features/`. Todo cálculo exibido em qualquer tela passa por `core/`.

---

## 5. Modelo de dados

```ts
type Id = string;            // UUID v4 gerado no cliente
type Iso = string;           // data/hora ISO 8601

type StatusTraco = 'rascunho' | 'em_teste' | 'aprovado' | 'inativo';
type Categoria = 'cimento' | 'adicao' | 'areia' | 'brita' | 'agua' | 'aditivo' | 'fibra' | 'outro';
type ClasseAgressividade = 'I' | 'II' | 'III' | 'IV';
type TipoEstrutura = 'armado' | 'protendido' | 'simples';
type Metodo = 'manual' | 'cientifica' | 'teor_argamassa';

interface Fornecedor { id: Id; nome: string; cnpj?: string; cidade?: string; contato?: string;
  materiais: Categoria[]; ativo: boolean; unidade: string; auditoria: Auditoria; }

interface Material { id: Id; nome: string; categoria: Categoria; fornecedorId?: Id;
  origem?: string;                       // jazida, fábrica, lote
  massaEspecificaKgDm3?: number;         // SEMPRE kg/dm³ no modelo
  absorcaoPct?: number; moduloFinura?: number; dmaxMm?: number;
  custoRsKg?: number; custoAtualizadoEm?: Iso;
  curvaAbrams?: { A: number; B: number; fonte: string; atualizadaEm: Iso }; // só cimento
  ensaioVigente?: { massaEspecificaId?: Id; granulometriaId?: Id };
  status: 'ativo' | 'em_teste' | 'inativo'; unidade: string; auditoria: Auditoria; }

interface ItemTraco { id: Id; materialId?: Id; nome: string; categoria: Categoria;
  massaKgM3?: number;                    // por m³; obrigatório exceto aditivo em %
  dosagemPct?: number;                   // aditivo: % sobre a base
  basePct?: 'cimento' | 'aglomerante';
  massaEspecificaKgDm3: number;
  umidadeLivrePct?: number;              // agregados, medida no dia
  custoRsKg?: number;
  ensaioRefs?: { tipo: 'granulometria' | 'massa_especifica' | 'umidade'; ensaioId: Id; data: Iso }[]; }

interface Objetivo { fckMPa: number; sdMPa: number; classe: ClasseAgressividade;
  estrutura: TipoEstrutura; abatimentoMm: number; toleranciaMm: number;
  dmaxMm?: number; aplicacao?: string; }

interface ResultadoExperimental { id: Id; data: Iso; volumeBetonadaL?: number;
  abatimentoMm?: number; massaEspecificaFrescaKgM3?: number; temperaturaC?: number;
  arPct?: number; observacao?: string;
  rupturas: { idadeDias: number; previstaEm: Iso; resultadosMPa: number[] }[]; }

interface Traco { id: Id; codigo: string;          // TR-0001 (gerado pelo servidor)
  nome: string; unidade: string; versao: number; revisao: number;
  status: StatusTraco; baseVersaoId?: Id; metodo: Metodo;
  parametrosMetodo?: Record<string, number>;    // entradas do método científico/teor
  objetivo: Objetivo; itens: ItemTraco[]; arIncorporadoPct: number;
  normalizarPara1m3: boolean;
  experimentais: ResultadoExperimental[];
  notasVersao?: string;
  aprovacao?: { por: string; em: Iso; parecer?: string };
  auditoria: Auditoria; }

interface Auditoria { criadoPor: string; criadoEm: Iso; alteradoPor: string; alteradoEm: Iso; }

interface Ensaio { id: Id; tipo: 'granulometria_miudo' | 'granulometria_graudo'
  | 'massa_especifica_miudo' | 'massa_especifica_graudo' | 'umidade' | 'resistencia_cimento';
  materialId: Id; data: Iso; responsavel: string; dados: unknown; resultado: unknown;
  status: 'rascunho' | 'concluido'; unidade: string; auditoria: Auditoria; }

interface CustoMCC { /* portar do legado (AppsScript_custoMCC.gs) com os mesmos campos */ }
```

**Regras do modelo:**
- Um traço salvo é **imutável por versão**. Editar um traço aprovado cria a versão `n+1` em `rascunho`.
- `revisao` é o contador de concorrência otimista dentro da mesma versão.
- Material ou fornecedor nunca é apagado fisicamente; ele passa a `inativo`. Exclusão física só existe para Custos MCC (paridade) e exige o papel `admin`.

---

## 6. Núcleo de cálculo (`src/core`)

### 6.1 Volume e composição

Para cada item *i*, com massa em kg/m³ e massa específica ρ em kg/dm³:

```text
massa_i       = massaKgM3, ou, para aditivo em %:
                dosagemPct/100 × (Σ cimento  | Σ cimento + Σ adição)   conforme basePct
volume_i (L)  = massa_i / ρ_i
V_ar (L)      = arIncorporadoPct/100 × 1000
V_total (L)   = Σ volume_i + V_ar
desvio (L)    = V_total − 1000
```

Se `normalizarPara1m3` estiver ativo, todas as massas são multiplicadas por `1000 / V_total` antes dos indicadores. A tela mostra que a normalização foi aplicada.

### 6.2 Indicadores

```text
C        = Σ massa(cimento)
Ad       = Σ massa(adicao)
Agl      = C + Ad
Areia    = Σ massa(areia)          (traço seco)
Brita    = Σ massa(brita)
Agua     = Σ massa(agua)           (traço seco)

a/c                    = Agua / C
a/agl                  = Agua / Agl
teor de argamassa seco = (Agl + Areia) / (Agl + Areia + Brita)            (ver 6.3)
consumo de cimento     = C (kg/m³)
consumo de aglomerante = Agl (kg/m³)
traço unitário         = 1 : Areia/Agl : Brita/Agl : Agua/Agl             (base configurável)
massa esp. teórica     = Σ massa_i / (V_total / 1000)                     (kg/m³)
custo (R$/m³)          = Σ massa_i × custoRsKg_i
fcj                    = fck + 1,65 × sd
```

Os nomes no código são `relacaoAguaCimento` e `relacaoAguaAglomerante`. **Nunca** use um campo genérico `ac`.

### 6.3 Definições ajustáveis (`indicadores.config.ts`)

As definições abaixo ficam num único arquivo de configuração, com comentário `// A CONFIRMAR PELA ENGENHARIA`:
- se o teor de argamassa conta as adições junto do aglomerante (padrão: **sim**);
- a base do traço unitário: aglomerante (padrão) ou cimento;
- a faixa interna de teor de argamassa (padrão: **51–55 %**, rotulada "critério interno");
- o prazo de validade de ensaio de agregado (padrão: **180 dias**, rotulado "critério interno").

Se o legado usar outra definição para algum indicador, siga o legado e registre a diferença no relatório.

### 6.4 Limites da ABNT NBR 12655 (`nbr12655.ts`)

| Classe | a/c máx. armado | a/c máx. protendido | Classe mín. armado | Classe mín. protendido | Consumo mín. (kg/m³) |
|---|---|---|---|---|---|
| I | 0,65 | 0,60 | C20 | C25 | 260 |
| II | 0,60 | 0,55 | C25 | C30 | 280 |
| III | 0,55 | 0,50 | C30 | C35 | 320 |
| IV | 0,45 | 0,45 | C40 | C40 | 360 |

Comentário obrigatório no arquivo: `// Conferir contra a edição vigente da NBR 12655 antes de liberar em produção`. Para concreto simples, só há alerta informativo.

### 6.5 Granulometria (`granulometria.ts`, `nbr7211.ts`)

- % retida = massa retida ÷ massa total. % retida acumulada = soma até a peneira. % passante = 100 − acumulada.
- **Módulo de finura** = Σ % retida acumulada nas peneiras da série normal (75; 37,5; 19; 9,5; 4,75; 2,36; 1,18; 0,6; 0,3; 0,15 mm) ÷ 100.
- **Dmáx característica** = abertura da peneira da série normal ou intermediária com % retida acumulada **≤ 5 %**, imediatamente acima da primeira que passa de 5 %.
- Zonas do **agregado miúdo** (NBR 7211, em % retida acumulada; inferior–superior):

| Peneira (mm) | Utilizável | Ótima |
|---|---|---|
| 9,5 | 0–0 | 0–0 |
| 6,3 | 0–7 | 0–0 |
| 4,75 | 0–10 | 0–5 |
| 2,36 | 0–25 | 10–20 |
| 1,18 | 5–50 | 20–30 |
| 0,6 | 15–70 | 35–55 |
| 0,3 | 50–95 | 65–85 |
| 0,15 | 85–100 | 90–95 |

  Faixas de módulo de finura: utilizável inferior 1,55–2,20, ótima 2,20–2,90, utilizável superior 2,90–3,50.
- Para o **graúdo**, porte as faixas e regras exatamente do legado.
- Perda na peneiração = massa inicial − Σ massas retidas. Alerta se a perda for > 0,3 % da massa inicial; se o legado usa outro limite, porte o do legado.

### 6.6 Validação (`validate.ts`)

Retorna `{ campo, nivel: 'erro' | 'aviso', mensagem }[]`. Com qualquer **erro**, a aplicação não calcula indicadores e não salva.

| Regra | Nível |
|---|---|
| Campo numérico vazio, não numérico ou negativo onde a grandeza não pode ser negativa | erro |
| Σ cimento ≤ 0 | erro ("Informe a massa de cimento") |
| Massa específica ≤ 0 ou fora de 0,9–4,0 kg/dm³ | erro |
| Umidade livre fora de 0–20 % | erro |
| Aditivo % fora de 0–10 % | erro |
| Ar incorporado fora de 0–10 % | erro |
| \|desvio de volume\| > 5 L sem normalização | aviso ("Volume 1.012,4 L — ajuste ou ative normalizar") |
| a/c acima do limite da classe | aviso, com o valor-limite e a classe |
| Consumo abaixo do mínimo da classe | aviso |
| fck abaixo da classe mínima | aviso |
| Resistência estimada por Abrams < fcj (com curva cadastrada) | aviso |
| Cimento sem curva de Abrams | aviso informativo ("sem estimativa de resistência") |
| Ensaio vinculado mais antigo que o prazo da §6.3 | aviso ("critério interno") |
| Abatimento experimental fora de alvo ± tolerância | aviso |
| Teor de argamassa fora da faixa interna | aviso ("critério interno") |

A conversão de texto para número é feita **uma vez**, em `units.parseNumero` (aceita `1.234,5`, `1234,5` e `1234.5`). Isso substitui o padrão legado `parseFloat(...) || 0`.

### 6.7 Abrams

`fc_estimada = A / B^(a/c)`, com A e B vindos da curva do cimento. Porte também o ajuste da curva a partir de pares (a/c, fc) usado no legado. Se o legado não tiver ajuste, use regressão linear em `ln(fc) = ln(A) − (a/c)·ln(B)`.

### 6.8 Correção de umidade (traço de obra)

```text
Δ_i         = massa_seca_i × umidadeLivrePct_i / 100      (só areia e brita)
massa_obra_i = massa_seca_i + Δ_i
agua_obra    = Agua − Σ Δ_i
```

A carta mostra o traço seco, a correção e o traço de obra. Também mostra a quantidade por betonada; o volume da betonada é editável na carta, padrão **1,0 m³**.

### 6.9 Métodos

- **Manual:** o usuário digita massas e o núcleo calcula tudo da §6.1–6.2.
- **Científica, por teor de argamassa, cálculo inverso, empacotamento:** porte 1:1 do legado. Os módulos portados recebem os mesmos testes do legado (`tests/*.test.js`), convertidos para Vitest, e precisam passar sem alterar valores esperados.
- **Todo método produz a mesma saída:** a lista de `ItemTraco` com massas por m³. A partir daí, o caminho de cálculo é único.

---

## 7. Backend — Apps Script v2

### 7.1 Planilha nova "ConcreTrack Dosagem v2"

| Aba | Conteúdo |
|---|---|
| `usuarios` | email, nome, papeis (csv), unidades (csv ou `*`), ativo |
| `fornecedores` | 1 linha por registro, coluna `json` com o documento + colunas de índice (id, nome, unidade, ativo, alteradoEm) |
| `materiais` | idem |
| `ensaios` | idem |
| `tracos` | 1 linha por **versão**: id, codigo, versao, revisao, status, unidade, nome, alteradoEm, alteradoPor, json |
| `custos_mcc` | colunas do legado + auditoria |
| `requisicoes` | requestId, acao, usuario, em, resultadoId (para idempotência) |
| `auditoria` | em, usuario, acao, entidade, id, versao, resumo |
| `sequencias` | nome, ultimo (para `TR-0001`) |

Use `LockService.getScriptLock()` em toda gravação.

### 7.2 Contrato

Todas as chamadas são `POST` para a URL do Web App, com `Content-Type: text/plain;charset=utf-8` (evita preflight de CORS). O corpo é JSON:

```json
{ "acao": "tracos.salvarVersao", "token": "<token do Hub>", "requestId": "<uuid>", "dados": { } }
```

Resposta sempre via `ContentService` com `MimeType.JSON`:

```json
{ "ok": true,  "dados": { }, "servidorEm": "2026-10-17T23:41:00Z" }
{ "ok": false, "erro": { "codigo": "CONFLITO_REVISAO", "mensagem": "...", "detalhe": { } } }
```

`doGet` responde só `{ ok: true, versao: "2.0.0" }` (health check), sem dados.

| Ação | Papel mínimo | Observação |
|---|---|---|
| `sessao.quemSou` | leitor | devolve email, nome, papéis, unidades |
| `fornecedores.listar` / `.salvar` / `.inativar` | leitor / laboratorista / engenheiro | |
| `materiais.listar` / `.salvar` / `.inativar` | leitor / laboratorista / engenheiro | |
| `ensaios.listar` / `.obter` / `.salvar` | leitor / leitor / laboratorista | |
| `tracos.listar` | leitor | só a última versão de cada traço + filtros |
| `tracos.obter` | leitor | por id + versão (padrão: última) |
| `tracos.historico` | leitor | lista de versões |
| `tracos.salvarVersao` | laboratorista | cria ou atualiza o rascunho; exige `revisao` |
| `tracos.mudarStatus` | laboratorista (`em_teste`) / engenheiro (`aprovado`, `inativo`) | aprovar exige zero **erros** e registra parecer |
| `tracos.registrarExperimental` | laboratorista | |
| `custos.listar` / `.salvar` / `.excluir` | leitor / laboratorista / **admin** | paridade com o legado |
| `importacao.legado` | admin | §7.6 |
| `usuarios.listar` / `.salvar` | admin | |

Toda ação filtra por `unidade`, conforme as unidades do usuário.

Códigos de erro: `NAO_AUTENTICADO`, `SEM_PERMISSAO`, `VALIDACAO`, `CONFLITO_REVISAO`, `NAO_ENCONTRADO`, `LIMITE`, `INTERNO`.

O servidor **revalida** com as mesmas regras de erro da §6.6. Para isso, mantenha uma cópia em `.gs` das validações essenciais: positivos, cimento > 0 e faixas.

### 7.3 Autenticação (decida pelo que a Etapa 0 encontrar)

Implemente `auth.gs` com `verificarToken(token) → { email, nome } | null`, nesta ordem de preferência:

1. **Sessão do Supabase:** chame `GET {SUPABASE_URL}/auth/v1/user` com `Authorization: Bearer <token>` e `apikey: <anon key>` via `UrlFetchApp`. Guarde o resultado em `CacheService` por 5 min, com o hash do token como chave. Isso funciona com qualquer algoritmo de assinatura.
2. **JWT HS256 com segredo conhecido:** valide a assinatura com `Utilities.computeHmacSha256Signature`, junto com `exp` e `aud`. O segredo fica em Script Properties.
3. **Outro provedor:** implemente o equivalente por introspecção e documente.

Depois de identificar o e-mail, busque os papéis na aba `usuarios`. E-mail desconhecido ou inativo resulta em `SEM_PERMISSAO`.

**Bootstrap:** na primeira execução, se a aba `usuarios` estiver vazia, o e-mail definido em Script Property `ADMIN_EMAIL` vira `admin` com todas as unidades.

### 7.4 Idempotência e concorrência

- Antes de gravar, procure `requestId` em `requisicoes`. Se já existir, devolva o mesmo resultado e **não grave de novo**.
- `tracos.salvarVersao` compara a `revisao` recebida com a gravada. Se forem diferentes, devolve `CONFLITO_REVISAO` com a versão atual em `detalhe`.

### 7.5 Pasta `apps-script/`

Projeto `clasp` com `appsscript.json` (`webapp.access: ANYONE_ANONYMOUS`, `executeAs: USER_DEPLOYING`; a proteção é pelo token), os arquivos `.gs` e um `README.md` com o passo a passo manual de criação e deploy (§18).

### 7.6 Importação do legado

A ação `importacao.legado` lê as planilhas antigas por ID (Script Properties `LEGADO_DOSAGEM_ID`, `LEGADO_CUSTOS_ID`, `LEGADO_FORNECEDORES_ID`) **somente leitura**. Ela converte para o modelo v2 e:
- tem **modo simulação** (padrão): devolve contagens e amostras sem gravar;
- tem **modo efetivo**: grava com `origem: 'legado'` e o ID antigo guardado;
- é **idempotente**: reimportar não duplica, porque usa o ID antigo como chave.

No cliente, a tela **Configurações › Importação** oferece três coisas:
1. importar as planilhas pelo servidor (com simulação primeiro);
2. importar o que está no `localStorage` do navegador (cartas, banco local, cenários). Lê **as mesmas chaves do legado**, porque o v2 roda no mesmo domínio, e envia ao servidor;
3. importar o arquivo JSON exportado pelo legado.

O conversor cria um `ItemTraco` para cada material, inclusive segunda areia e segundo aditivo, cada um com **sua própria** massa específica. Mostra um relatório: X traços lidos, Y convertidos, Z com aviso (lista).

---

## 8. Persistência no cliente e estados de salvamento

- **IndexedDB** (via `idb`) com as stores `cache` (listas e documentos por chave), `rascunhos` e `outbox`.
- **Máquina de estados**, sempre visível no cabeçalho do traço e em cada formulário que grava:

| Estado | Texto | Cor |
|---|---|---|
| `local` | "Rascunho no aparelho" | neutro |
| `enviando` | "Enviando…" | neutro, com spinner |
| `salvo` | "Salvo no servidor · v3 · 20:41" | verde |
| `pendente_offline` | "Sem rede · envia ao reconectar" | âmbar |
| `falhou` | "Falhou ao salvar · Tentar de novo" | vinho, com botão |
| `conflito` | "Alterado por outra pessoa · Ver diferença" | vinho, com botão |

- Toda gravação entra na `outbox` com `requestId`. O reenvio é automático quando o navegador volta a ficar online e ao abrir a aplicação, com backoff exponencial (2 s → 60 s).
- O rascunho do editor é salvo localmente a cada alteração (debounce de 800 ms). Fechar a aba não perde dados.
- **Conflito:** um modal mostra lado a lado "sua versão" e "versão do servidor", campo a campo, com as opções "Manter a do servidor", "Sobrescrever com a minha (nova revisão)" e "Salvar a minha como nova versão".
- **Offline:** as listas e documentos já abertos ficam disponíveis do cache, com o selo "dados de 17/10 20:41". Calcular funciona offline; gravar entra na fila.

---

## 9. Design system (`src/ui`)

### 9.1 Tokens (`tokens.css`)

```css
:root{
  --ct-navy:#0A1530; --ct-navy-2:#0E1F45; --ct-navy-3:#1F2C4F;
  --ct-red:#DB0A40; --ct-red-hover:#B0083A; --ct-red-ink:#B0083A;     /* links */
  --ct-yellow:#FFC906; --ct-yellow-soft:#FFF6D1; --ct-yellow-mid:#FFE27A;
  --ct-bg:#EEF1F7; --ct-card:#FFFFFF; --ct-line:#DBE1EC; --ct-line-2:#E8ECF3;
  --ct-ink:#0A1530; --ct-ink-2:#26324D; --ct-muted:#4A5672;
  --ct-ok:#0B6B3A; --ct-ok-bg:#E7F5EE;
  --ct-warn:#7A4800; --ct-warn-bg:#FFF4DB; --ct-warn-line:#F0C36D;
  --ct-crit:#9F1239; --ct-crit-bg:#FDE8EE;
  --ct-calc-bg:#EEF1F7;                     /* valor calculado */
  --ct-radius:14px; --ct-radius-sm:10px; --ct-radius-xs:8px;
  --ct-font:'Inter',system-ui,sans-serif;
}
```

### 9.2 Regras de cor (obrigatórias)

- Texto sobre vermelho: **sempre branco**. Nunca amarelo sobre vermelho.
- Amarelo: ícones sobre navy, faixas de gráfico e destaques de fundo. **Nunca** texto ou ícone fino sobre branco.
- Estados: ícone + palavra + cor. A cor nunca é o único sinal.
- Contraste mínimo de 4,5:1 para texto. Teste automatizado com `@axe-core/playwright`.

### 9.3 Tipografia

Inter (400/500/600/700) via Google Fonts, com `font-variant-numeric: tabular-nums` em números.

| Uso | Desktop | Tablet | Celular |
|---|---|---|---|
| Título de página | 26 px/700 | 24 px/700 | 20 px/700 |
| Título de card | 16 px/700 | 16 px/700 | 15 px/700 |
| Corpo | 14 px | 15 px | 15 px |
| Rótulo | 12,5 px/600 | 13 px/600 | 13 px/600 |
| KPI | 22 px/700 | 22 px/700 | 18 px/700 |

### 9.4 Componentes

`Button` (primary, secondary, ghost, danger-outline; alturas 44/48), `IconButton` (com `aria-label` obrigatório), `Input`/`NumberInput` (rótulo **visível** associado, unidade no rótulo, erro abaixo do campo com `aria-describedby`), `CalcValue` (fundo `--ct-calc-bg`, sem borda), `Select`, `Combobox` (busca de material), `SegmentedControl`, `Stepper`, `StatusChip`, `SaveStatus`, `Card`, `KpiTile`, `AlertItem` (causa, campo envolvido e link "Ir para o campo"), `DataTable` (com cabeçalho fixo e rolagem horizontal), `CardList` (alternativa móvel à tabela), `Drawer` (lateral), `BottomSheet`, `Modal`, `Toast`, `EmptyState`, `Skeleton`, `CommandPalette` (Ctrl+K), `LogChart` e `LineChart` em SVG.

Ícones: SVG de linha, traço 1,8, em um único arquivo `icons.tsx`. Sem emojis.

---

## 10. Layouts por dispositivo

Um `useLayoutMode()` retorna `desktop | tablet | mobile`. Por padrão, decide pela largura (§1-D8). A escolha pode ser forçada em **Configurações › Aparência › Modo de layout** (`automático | desktop | tablet | celular`), guardada em `localStorage`, para facilitar os testes. Cada modo renderiza **sua própria casca** (`DesktopShell`, `TabletShell`, `MobileShell`), e telas complexas têm variações por modo.

### 10.1 Desktop (≥ 1280 px)

```text
┌──────────┬──────────────────────────────────────────────────────────────┐
│ SIDEBAR  │ BARRA SUPERIOR: trilha · busca Ctrl+K · Unidade ▾ · usuário  │
│ 252 px   ├──────────────────────────────────────────────────────────────┤
│ navy     │ Título + chips de status + SaveStatus + ações secundárias    │
│ logo     │ Stepper (no editor)                                          │
│ grupos   │ ┌──────────────────────────────┐ ┌────────────────────────┐  │
│ ícones   │ │ conteúdo principal           │ │ painel lateral fixo    │  │
│ amarelos │ │ (formulário/tabela)          │ │ (resultado/pendências) │  │
│ ativo =  │ │                              │ │ position: sticky       │  │
│ pílula   │ └──────────────────────────────┘ └────────────────────────┘  │
│ vermelha ├──────────────────────────────────────────────────────────────┤
│          │ BARRA DE AÇÕES FIXA: etapa · voltar · secundária · PRIMÁRIA  │
└──────────┴──────────────────────────────────────────────────────────────┘
```

- A sidebar é recolhível para trilho de 76 px (botão no rodapé; preferência salva).
- Grupos da sidebar: Início · Traços · Materiais · Fornecedores · Ensaios · Ferramentas · Custos · Referência · Configurações (com Usuários e Importação para admin).
- Conteúdo principal com `max-width: 1480px`; painel lateral de 340 px.
- Tabelas completas, com todas as colunas.

### 10.2 Tablet (600–1279 px), otimizado para toque

```text
┌────┬──────────────────────────────────────────────┐
│RAIL│ BARRA: título da tela · SaveStatus · ⋯ · 👤   │
│76px├──────────────────────────────────────────────┤
│ícone│ Stepper compacto (números + nome da atual)  │
│+   │ ┌──────────────────────────────────────────┐ │
│rót.│ │ conteúdo em 1 coluna (retrato)           │ │
│curto│ │ ou 2 colunas (paisagem ≥ 1024: conteúdo  │ │
│    │ │ + painel de 300 px)                      │ │
│    │ └──────────────────────────────────────────┘ │
│    ├──────────────────────────────────────────────┤
│    │ FAIXA DE RESULTADO (retrato): Volume · a/c · │
│    │ Custo · ⚠ 2 — toque abre bottom sheet        │
│    │ BARRA DE AÇÕES: voltar · PRIMÁRIA            │
└────┴──────────────────────────────────────────────┘
```

- **Trilho de navegação** de 76 px: ícone com rótulo curto embaixo. O botão "Menu" abre a sidebar completa como gaveta sobreposta.
- Alvos de toque ≥ **48 px**, espaçamento 12 px entre campos, inputs de 48 px.
- **Retrato (600–1023):** uma coluna. O resultado vira a **faixa fixa** acima da barra de ações (4 KPIs + contador de pendências). Ao tocar, abre um bottom sheet com o resultado completo.
- **Paisagem (1024–1279):** duas colunas, com painel de resultado fixo de 300 px.
- A tabela de materiais vira **cartões em grade de 2 colunas** em retrato. Em paisagem continua tabela, sem as colunas "Custo" e "Ensaio" (que aparecem ao tocar na linha).
- Teclado numérico (`inputmode="decimal"`) em todos os campos numéricos.
- A busca vira um ícone na barra que abre a CommandPalette em tela cheia.

### 10.3 Celular (< 600 px)

```text
┌──────────────────────────────┐
│ APP BAR navy: ‹ · título · ● │  ● = ícone do SaveStatus (toque mostra texto)
├──────────────────────────────┤
│ Etapa 3 de 5 · Proporções    │  barra de progresso amarela
│ [Vol 1.000 L][a/c 0,53][⚠ 2] │  faixa de KPIs fixa (toque → bottom sheet)
├──────────────────────────────┤
│ conteúdo em cartões          │
│ 1 coluna, rolagem vertical   │
├──────────────────────────────┤
│ ‹ Voltar      [ AVANÇAR › ]  │  barra de ações (no editor)
├──────────────────────────────┤
│ Início Traços (+) Ensaios Mais│ tab bar (oculta dentro do editor)
└──────────────────────────────┘
```

- **Tab bar** com 5 posições: Início · Traços · **(+)** · Ensaios · Mais. O **(+)** central (vermelho, 56 px) abre um action sheet: Novo traço · Registrar resultado experimental · Novo ensaio. "Mais" abre um sheet com Materiais, Fornecedores, Ferramentas, Custos, Referência e Configurações.
- **Tabelas viram listas de cartões.** Cada cartão traz nome, valores principais e chevron para o detalhe.
- O editor de traço funciona por completo no celular, uma etapa por tela. Os materiais aparecem como cartões com o campo de massa grande e os valores calculados embaixo.
- Inputs de 48 px de altura, fonte de 17 px no valor, rótulo acima.
- A carta aparece em prévia com zoom (pinch). Ações: Compartilhar (Web Share API com o PDF) e Imprimir.
- A tela de **Resultado experimental** é a referência de fluxo rápido no celular: abatimento, massa específica fresca, temperatura, CPs e idades, botão grande "Salvar resultado".

---

## 11. Telas

Cada tela lista o conteúdo e as diferenças por modo. Todas mostram estados vazio, carregando (skeleton), erro (com "Tentar de novo") e offline.

### 11.1 Início
- Título "O que precisa de você hoje", com os botões **+ Novo traço** (primário) e **Registrar ensaio**.
- Cartões de tarefa, cada um com link para a lista filtrada: Aguardando aprovação · Não sincronizados (âmbar se > 0) · Ensaios vencidos (critério interno) · Traços em teste.
- Cartão navy **"Continuar de onde parou"**: último traço editado, etapa e pendências.
- Tabela **Traços recentes** com filtros (Todos · Aprovados · Em teste · Rascunhos) e colunas Traço · Versão · fck · a/c · Custo · Situação · Alterado.
- *Tablet:* cartões de tarefa em 2×2. *Celular:* cartões de tarefa em rolagem horizontal; recentes como lista.

### 11.2 Traços (lista)
- Busca, filtros (status, unidade, fck, método) e ordenação.
- Ações por linha: abrir, duplicar como novo traço, comparar, histórico.

### 11.3 Editor de traço (5 etapas)

Cabeçalho persistente: nome, código, versão, chip de status, SaveStatus e botão "Comparar com vN-1".

1. **Objetivo** — nome, unidade, aplicação, fck, sd, classe de agressividade, tipo de estrutura, abatimento ± tolerância, Dmáx. Abaixo, um quadro calculado com fcj e os limites da NBR 12655 (a/c máx., consumo mín., classe mín.).
2. **Materiais** — adiciona itens pelo Combobox do cadastro, agrupados por categoria. Cada item mostra o ensaio vinculado e sua data, ou o chip âmbar "Ensaio de dd/mm/aaaa" / "Sem ensaio". A umidade livre do dia entra aqui. Dá para ter quantas areias, britas, adições e aditivos forem necessários.
3. **Proporções** — controle segmentado para o método (Manual · Científica · Por teor de argamassa). Os campos de entrada mudam conforme o método. Abaixo, a **tabela de materiais por m³** com as colunas Material · Ensaio · Massa (kg/m³) [digitada] · Massa esp. (kg/dm³) [calc.] · Volume (L) [calc.] · Custo (R$/m³), ar incorporado e a linha de total. Há a opção "Normalizar para 1 m³". O link **Ferramentas** abre, numa gaveta, cálculo inverso, Abrams e empacotamento, que aplicam o resultado ao traço.
4. **Validação** — lista de pendências (erros e avisos), comparação com a versão anterior (diferenças destacadas) e **resultados experimentais** registrados (lista e "+ Registrar").
5. **Carta** — prévia de impressão (§12), betonada editável, checklist "Antes de aprovar", ações Enviar para aprovação (engenheiro aprova com parecer), Imprimir e Baixar PDF.

**Painel de resultado** (o mesmo componente nas etapas 2 a 5): Volume total com desvio, Custo R$/m³ com a diferença para a versão anterior, a/c com o limite, a/agl, consumo de cimento com o mínimo, teor de argamassa seco com a faixa, traço unitário, massa específica teórica e lista de pendências com link para o campo.

Navegação livre entre etapas. A etapa mostra ✓ quando não tem erros, ou um número de pendências.

### 11.4 Comparador
- Seleciona 2 ou 3 traços ou versões. Mostra **o mesmo painel de resultado** lado a lado e a tabela de materiais alinhada por categoria, com diferenças destacadas. Cobre também os cenários A/B/C do legado.
- *Celular:* uma coluna por vez, com abas A / B / C e um resumo de diferenças no topo.

### 11.5 Materiais
- Abas por categoria. Tabela com Material · Fornecedor · Massa esp. · MF · Dmáx · Custo · Status · ensaio vigente. O detalhe abre num **drawer** com propriedades, histórico de ensaios, prévia da curva granulométrica e curva de Abrams (cimento).
- *Celular:* lista de cartões; o detalhe é uma tela própria.

### 11.6 Fornecedores
- Lista, formulário (dados, materiais fornecidos, contato) e relatório do fornecedor (paridade com o legado).

### 11.7 Ensaios
- Hub com os tipos: granulometria miúdo/graúdo, massa específica miúdo/graúdo, umidade e resistência do cimento (pares a/c × fc para a curva de Abrams). Para cada tipo: último ensaio e status.
- **Granulometria:** tabela de peneiras com massa retida digitada e % retida, acumulada e passante calculadas; total e perda. **Curva em escala logarítmica** (x = abertura em mm, y = % passante) com faixas utilizável (amarelo claro) e ótima (amarelo médio), curva navy e pontos vermelhos. KPIs: MF, Dmáx, classificação, perda. Ação "Salvar ensaio": o ensaio passa a valer para o material, e um aviso informa quais traços em rascunho ou teste usam esse material.
- **Massa específica, umidade:** porte dos formulários legados, com o resultado aplicado ao material.
- *Tablet retrato e celular:* a tabela de peneiras vira lista de linhas (abertura → input → passante) e a curva fica abaixo, com largura total.

### 11.8 Ferramentas
- Cálculo inverso, análise volumétrica (Abrams e empacotamento) e outras ferramentas do legado. Cada uma pode ser aberta solta ou a partir do editor; ao abrir pelo editor, tem a ação "Aplicar ao traço".

### 11.9 Custos
- Cadastro MCC (paridade, incluindo exclusão para admin com confirmação digitando o nome) e comparação de custos entre traços.

### 11.10 Referência
- Normas citadas, o manual novo (gerado a partir da interface final, em `features/referencia/manual`) e as definições dos indicadores com fórmula.

### 11.11 Configurações
- Unidade padrão, modo de layout, tamanho de fonte (normal/grande), informações da versão (app e API) e estado da sincronização.
- Para admin: Usuários (papéis e unidades) e Importação (§7.6).

---

## 12. Carta do traço e impressão

- Componente `print/CartaTraco.tsx` com CSS `@media print`, em A4 retrato, margens de 15 mm, sem a casca da aplicação.
- Conteúdo:
  - cabeçalho com "CONCREFER · UNIDADE <unidade>", título "Carta de traço", nome, código, versão, data de emissão e situação;
  - Objetivo;
  - tabela **traço seco · correção de umidade · traço de obra · betonada**;
  - nota de quando a umidade foi medida;
  - indicadores;
  - rodapé com elaborado por, aprovado por e um QR com `codigo-vVersao` (biblioteca `qrcode`, gerada localmente).
- Traço não aprovado leva a marca d'água diagonal "EM TESTE · NÃO LIBERADO" ou "RASCUNHO".
- "Baixar PDF" usa a impressão do navegador. No celular, "Compartilhar" usa `navigator.share` quando disponível.
- A prévia na tela e a impressão vêm do **mesmo componente**.

---

## 13. Acessibilidade e pt-BR

- Todo controle tem `<label>` associado e todo botão de ícone tem `aria-label`. Foco visível com anel vermelho de 2 px.
- O editor funciona inteiro por teclado. Tab segue a ordem visual; Enter avança o campo.
- Erros são anunciados com `aria-live="polite"`. O SaveStatus usa `role="status"`.
- Números formatados com `Intl.NumberFormat('pt-BR')`. Datas no formato `dd/mm/aaaa`; hora `HH:mm`.

---

## 14. Testes

### 14.1 Unitários e golden (Vitest)

- Testes legados portados devem passar com os valores originais.
- **Caso golden C40** (Apêndice A): todos os indicadores dentro da tolerância.
- Granulometria golden (Apêndice B).
- Casos-limite: cimento 0, campo vazio, massa negativa, massa específica 0, volume fora de 1.000 L, normalização, aditivo % sobre cimento e sobre aglomerante, duas areias com umidades diferentes. **Nenhum** pode produzir `NaN` ou `Infinity`.
- Conversor do legado: fixture com segunda areia e segundo aditivo, cada um com sua massa específica. O volume do segundo aditivo tem de usar a própria densidade, não `rho.adit` (bug legado).
- `parseNumero`: `"1.234,5"`, `"1234,5"`, `"1234.5"`, `""`, `"abc"`.

### 14.2 E2E (Playwright, API simulada com MSW e com o contrato da §7.2)

Rode em **três viewports**: desktop 1440×900, tablet 820×1180 e 1180×820, celular 390×844.

1. Criar traço com 2 areias e 2 aditivos → salvar → recarregar → reabrir: valores iguais.
2. Comparar v2 × v3 → a/c, a/agl, volume, massas e custo **idênticos** aos do editor. Mesmo teste na carta.
3. Sem rede: editar → "Sem rede" → reconectar → "Salvo no servidor".
4. Servidor responde `CONFLITO_REVISAO` → modal de conflito.
5. Servidor responde `SEM_PERMISSAO` → mensagem clara; nada marcado como salvo.
6. Aprovação bloqueada com erro; liberada sem erros, para o papel engenheiro.
7. Granulometria golden → MF 2,71, Dmáx 4,75, zona ótima.
8. Navegação completa por teclado no desktop.
9. `axe` sem violações sérias ou críticas em Início, Editor (etapas 1–5), Granulometria e Carta, nos três modos.
10. Screenshots de cada tela principal nos três modos, salvos em `tests/e2e/__screenshots__/`.

### 14.3 Apps Script

Funções de teste em `apps-script/testes.gs`, executáveis no editor: token inválido recusado, papel insuficiente recusado, `requestId` repetido não duplica, conflito de revisão e importação em simulação.

---

## 15. Build, publicação e service worker

### 15.1 Build
- `vite.config.ts`: `base: '/dosagem-concreto/v2/'`. Variáveis em `.env.example`: `VITE_API_URL` (URL do Web App) e `VITE_APP_VERSION`.
- HashRouter, para não depender de reescrita de URL no GitHub Pages.

### 15.2 Publicação
- Se o site é publicado por **branch**: o build gera `dosagem-concreto/v2/` e você comita a saída.
- Se é publicado por **Actions**: adicione o build do v2 ao workflow existente, sem alterar o resto.
- Script `npm run deploy:check` que valida que nenhum arquivo fora de `dosagem-concreto/v2/`, `dosagem-concreto-v2/` e `docs/dosagem-v2/` foi alterado (exceto a §15.3).

### 15.3 Service worker
- O v2 tem SW próprio (`vite-plugin-pwa`, `injectManifest`) com `scope: '/dosagem-concreto/v2/'`: precache do build e network-first para a API.
- **Única alteração permitida fora do v2:** se o `sw.js` do Hub interceptar requisições de `/dosagem-concreto/v2/` de forma que quebre o v2, adicione uma exceção mínima para esse prefixo. Documente o diff no relatório.
- O Web App Manifest do v2 usa nome "ConcreTrack Dosagem", tema `#0A1530` e ícones gerados a partir do logo do redesign.

### 15.4 Autenticação no cliente
- O `index.html` do v2 carrega os scripts do Hub (`/auth/config.js`, `/auth/client.js`, `/auth/guard.js`) por caminho absoluto, como o legado.
- `src/data/authAdapter.ts` encapsula a leitura do token e do usuário conforme o encontrado na Etapa 0. Expõe `getToken()`, `getUsuario()`, `onExpirada()`.
- Token expirado durante o uso: tenta a renovação do cliente do Hub; se falhar, guarda o rascunho e manda para o login do Hub com retorno.

---

## 16. Entregáveis e relatório

Ao terminar, devem existir:

1. Código em `dosagem-concreto-v2/` com `README.md` (rodar, testar, publicar).
2. Build publicado (ou pronto para publicar) em `dosagem-concreto/v2/`.
3. `apps-script/` com o backend e `README.md` de deploy.
4. `docs/dosagem-v2/00-RECONHECIMENTO.md`, `PARIDADE.md`, `FORMULAS.md` e `API.md` (contrato da §7.2 com exemplos).
5. `docs/dosagem-v2/RELATORIO-EXECUCAO.md` com:
   - o que foi feito, por seção deste documento;
   - todas as decisões tomadas por regra de decisão;
   - diferenças encontradas entre o legado e esta especificação;
   - resultado dos testes (contagem passa/falha) e caminho dos screenshots;
   - pendências com o motivo;
   - **checklist de teste manual para o Ricardo**, por tela e por modo (desktop, tablet, celular).

---

## 17. Critérios de aceite

- [ ] `PARIDADE.md` sem nenhum item "pendente" sem justificativa.
- [ ] Testes legados portados passando com os mesmos valores.
- [ ] Golden C40 e golden granulometria passando.
- [ ] E2E passando nos três modos.
- [ ] Nenhuma tela mostra "salvo" sem `id`, `versao` e `revisao` vindos do servidor.
- [ ] Chamada direta à API sem token ou sem papel é recusada.
- [ ] a/c e a/agl distintos e iguais em editor, comparador, carta e impressão.
- [ ] Segunda areia e segundo aditivo sobrevivem a salvar, reabrir, comparar, imprimir e importar.
- [ ] Três cascas distintas (desktop com sidebar, tablet com trilho, celular com tab bar), com o modo forçável em Configurações.
- [ ] `axe` sem violações sérias.
- [ ] Legado intacto (`git diff` vazio em `dosagem-concreto/` fora de `v2/`).

---

## 18. Passos manuais do Ricardo (o Codex só documenta)

1. Criar a planilha "ConcreTrack Dosagem v2" e anotar o ID.
2. Criar o projeto Apps Script com `clasp` a partir de `apps-script/`.
3. Preencher as Script Properties: `PLANILHA_ID`, `ADMIN_EMAIL`, `SUPABASE_URL` e `SUPABASE_ANON_KEY` (ou `JWT_SECRET`), `LEGADO_DOSAGEM_ID`, `LEGADO_CUSTOS_ID`, `LEGADO_FORNECEDORES_ID`.
4. Implantar como Web App e colocar a URL em `VITE_API_URL`. Gerar o build e publicar.
5. Entrar como admin → Configurações › Importação → simulação → conferir as contagens → importação efetiva.
6. Cadastrar os usuários e papéis.
7. Testar com o checklist do relatório.

---

## Apêndice A — Caso golden C40 · Pré-moldado CA III

**Objetivo:** fck 40 MPa · sd 4,0 MPa · classe III · armado · abatimento 100 ± 20 mm · ar 1,5 % · sem normalização.

| Item | Categoria | Massa (kg/m³) | ρ (kg/dm³) | Umidade livre | R$/kg |
|---|---|---|---|---|---|
| Cimento CP V-ARI | cimento | 340 | 3,10 | — | 0,78 |
| Metacaulim | adicao | 20 | 2,55 | — | 1,40 |
| Areia natural | areia | 520 | 2,63 | 4,2 % | 0,085 |
| Areia industrial | areia | 300 | 2,70 | 2,0 % | 0,07 |
| Brita 0 | brita | 250 | 2,75 | 0 | 0,075 |
| Brita 1 | brita | 782 | 2,75 | 0 | 0,07 |
| Água | agua | 180 | 1,00 | — | 0,01 |
| Superplastificante PCE | aditivo | 0,80 % s/ cimento → 2,72 | 1,07 | — | 9,50 |
| Retardador | aditivo | 0,30 % s/ cimento → 1,02 | 1,15 | — | 7,20 |

**Esperado** (tolerância ± 0,005 nos índices, ± 0,05 nos litros, kg e R$):

| Saída | Valor |
|---|---|
| Volumes (L) | 109,677 · 7,843 · 197,719 · 111,111 · 90,909 · 284,364 · 180,000 · 2,542 · 0,887 · ar 15,000 |
| V_total | 1.000,05 L (desvio +0,05 L) |
| a/c | 0,529 |
| a/agl | 0,500 |
| Teor de argamassa seco (com adição) | 0,533 (53,3 %) |
| Traço unitário (aglomerante) | 1 : 2,278 : 2,867 : 0,500 |
| Massa total | 2.395,74 kg |
| Massa esp. teórica | 2.395,6 kg/m³ |
| Custo | R$ 466,87/m³ |
| fcj | 46,6 MPa |
| Limites CA III | a/c ≤ 0,55 ✓ · consumo ≥ 320 ✓ · classe ≥ C30 ✓ → sem aviso de norma |
| Correção de umidade | areia natural +21,84 → 541,84 · areia industrial +6,00 → 306,00 · água 180 − 27,84 → 152,16 |

## Apêndice B — Golden granulometria (areia natural, 500,0 g)

| Peneira (mm) | 9,5 | 6,3 | 4,75 | 2,36 | 1,18 | 0,6 | 0,3 | 0,15 | Fundo |
|---|---|---|---|---|---|---|---|---|---|
| Retida (g) | 0 | 0 | 12 | 48 | 85 | 120 | 135 | 75 | 25 |
| % ret. acum. | 0,0 | 0,0 | 2,4 | 12,0 | 29,0 | 53,0 | 80,0 | 95,0 | 100,0 |

**Esperado:** MF **2,71** (2,714) · Dmáx **4,75 mm** · todas as peneiras na **zona ótima** · perda 0,0 g.

## Apêndice C — Referência visual

Os mockups aprovados estão em `docs/dosagem-v2/mockups/` como HTML estático. Abra cada um no navegador e reproduza **cores, espaçamentos, tipografia, hierarquia e componentes**:

| Arquivo | Tela | Modo |
|---|---|---|
| `01-inicio-desktop.html` | Início (§11.1) | desktop |
| `02-resultado-experimental-celular.html` | Resultado experimental (§10.3) | celular |
| `03-dosagem-etapa3-desktop.html` | Editor, etapa 3 Proporções, com painel de resultado (§11.3) | desktop |
| `04-granulometria-desktop.html` | Granulometria do miúdo, curva em escala log (§11.7) | desktop |
| `05-carta-desktop.html` | Carta do traço com checklist de aprovação (§12) | desktop |

Regras de uso:
- Os mockups são **referência visual**, não código para copiar. Reimplemente com os componentes da §9 em React. Os números dos mockups são os mesmos do golden C40 (Apêndice A).
- **Tablet** não tem mockup: derive do desktop seguindo a §10.2 (trilho de 76 px, faixa de resultado em retrato, alvos de 48 px).
- **Celular** fora da tela de resultado experimental: derive do arquivo 02 seguindo a §10.3 (app bar navy, cartões, tab bar com (+)).
- Inclua no relatório um screenshot de cada tela nos três modos, lado a lado com o mockup correspondente quando existir.

Em caso de conflito entre uma imagem antiga do redesign e este documento, **vale este documento**. Imagens antigas que estejam no repositório em `telas/` servem apenas como referência de estilo, e seus dados de exemplo **não** devem ser copiados (eles contêm erros conhecidos: a/c 0,8 para 175/350, curva granulométrica em escala linear, "conforme NBR 12655" para teor de argamassa).
