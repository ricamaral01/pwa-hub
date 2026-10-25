# CODEX — ConcreTrack Dosagem v2 · Especificação DEFINITIVA (Rodada 4.1)

**Versão 4.1 · 18/10/2026 · dono do produto: Ricardo**

> **Este é o único documento válido.** Ele substitui `CODEX_DOSAGEM_V2.md`, `CODEX_DOSAGEM_V2_RODADA2_VPS.md`, `CODEX_DOSAGEM_V2_RODADA3.md` e a versão 4.0 deste documento.
>
> **O que mudou da 4.0 para a 4.1** (revisão técnica do Ricardo, 18/10/2026):
> - água dos aditivos sem dupla contagem no volume (§6.2);
> - volumes dos aditivos recalculados no ajuste na betoneira (§7.5);
> - materiais congelados por versão do traço, com avaliação de impacto (§15.5);
> - rollback de código separado da recuperação de dados, e migrações só aditivas (§16.4, §16.5);
> - regressão de ajustes com amostra mínima e fatores independentes (§9.4);
> - sd normativo fixo em 20 resultados consecutivos em 30 dias (§6.5);
> - plano experimental obrigatório para aprovar (§6.6, §9.6);
> - login por ticket de uso único ou OIDC com PKCE, sem token na URL (§14.2);
> - usuário de implantação com permissões restritas, build fora da VPS, sem instalar PostgreSQL na VPS antiga (§3, §16);
> - curvas de idade por traço, cimento, temperatura e cura, com referência à NBR 9062 (§9.5);
> - tolerâncias de dosagem da Concrefer e rastreabilidade na carta de produção (§11);
> - normas da §6.5 conferidas na NBR 12655:2022;
> - novos casos de teste P3b e P7 e portão F1 reforçado (§2, §17).
> No início da execução, mova esses três arquivos para `docs/dosagem-v2/arquivado/`, com uma nota "substituído pela especificação definitiva". Não siga nenhuma instrução deles.
>
> **Modo de execução:** uma única rodada, de ponta a ponta, sem parar para pedir aprovação. A rodada passa por **portões automáticos** (§2): se um portão falhar, o Codex não avança para o deploy em produção. Ele termina tudo o que for possível, registra o motivo e entrega o relatório.
> Quando faltar informação, siga a regra de decisão da seção, registre em `docs/dosagem-v2/RELATORIO-EXECUCAO.md` e continue.
>
> **Fontes da verdade das fórmulas** (em `docs/dosagem-v2/referencia/`):
> - `1.Dosagem-Udemy.xlsx`
> - `RECURSOS-CURVADEABRAMS-UDEMY.xlsx`
> - `Dosagem_Concreto_Rica_v4.xlsx`
>
> **Referência visual:** `docs/dosagem-v2/mockups/*.html`.

---

## 0. Visão do produto

O ConcreTrack Dosagem é um **sistema de engenharia e gestão tecnológica do concreto**. Ele calcula, testa, corrige, aprova e acompanha o desempenho real de cada traço. O foco é a produção de pré-moldados (postes), onde importam:
- o fck aos 28 dias;
- a resistência nas primeiras horas (desforma);
- a trabalhabilidade e sua manutenção;
- a estabilidade do concreto;
- o custo por m³.

**Princípio central:** as planilhas definem o ponto de partida dos cálculos, mas o sistema **aprende com os resultados reais** do laboratório. Curvas de Abrams, curvas de resistência por idade e desvio-padrão são calibrados com os ensaios registrados.

Uma única base de dados atende **quatro ambientes**, cada um com interface própria:

| Ambiente | Quem usa | O que faz |
|---|---|---|
| **Engenharia** | engenheiro | traços (dois métodos), curvas de Abrams, otimização granulométrica, custos, comparador de eficiência, aprovação |
| **Laboratório** | laboratorista | ensaios de materiais, misturas experimentais, ajustes na betoneira, concreto fresco (convencional e CAA), resistências por idade |
| **Produção** | operador da usina | traço aprovado, betonada do dia com correção de umidade, registro do que foi realmente dosado |
| **Gestão** | engenharia e gerência | desempenho histórico, desvio-padrão, eficiência, custos e comparativos entre unidades, cimentos e fornecedores |

---

## 1. Parecer sobre a revisão do Ricardo (o que entrou e como)

| Ponto da revisão | Decisão | Onde |
|---|---|---|
| Volume de aditivos e adições fora do balanço | **Aceito.** Balanço físico completo por padrão; "modo planilha" só para conferência | §6.2 |
| Densidade do aglomerante por média aritmética | **Aceito.** Volume por kg de aglomerante = (1−F)/ρc + F/ρad | §6.2, §7.5 |
| Correção de água linear pelo abatimento | **Aceito.** Sai a regra de 0,3 L/mm. Entra o módulo de ajustes experimentais; sugestões valem só para a próxima betonada | §9.4 |
| Seco × umidade × SSS misturados | **Aceito.** Condição de referência por material, umidade total, absorção, água livre, massa a pesar, água dosada × água efetiva | §6.4 |
| Condições de preparo A/B/C sem restrição por classe | **Aceito.** Restrição por classe, configurável | §6.5 |
| Desvio-padrão por caixa de marcar | **Aceito.** sd calculado dos ensaios válidos registrados | §6.5, §12.2 |
| Três estados com critérios de bloqueio distintos | **Aceito:** rascunho, liberado para ensaio, aprovado | §6.6 |
| Modo CAA | **Aceito.** Tipo de concreto escolhido no início; ensaios da NBR 15823 | §9.3 |
| Resistência nas primeiras horas e idades configuráveis | **Aceito.** Curva calibrada por cimento; critério de desforma por produto | §9.5 |
| Otimização granulométrica | **Aceito** como sugestão com curvas antes × depois, volume e custo, sem garantia de desempenho | §10 |
| Traço de laboratório × traço produzido | **Aceito:** ambiente Produção com registro do dosado e comparação | §11 |
| Comparador de eficiência | **Aceito:** kg de cimento por MPa, R$/MPa, R$ por m³ aprovado, desempenho nas primeiras idades | §12.3 |
| Não executar tudo numa rodada só | **Ajustado.** O Ricardo pediu uma rodada só. Ela passa por **homologação local isolada** e por um **portão de recursos da VPS**; sem condições, não há deploy em produção | §2, §16 |
| VPS sobrecarregada (carga ≈ 39 em 2 vCPU) | **Aceito:** medição obrigatória antes do deploy, limites de CPU e memória para o serviço, recomendação de VPS própria se o portão falhar | §16.1 |
| Aproveitar a autenticação central | **Aceito:** primeiro tenta o login único com o ConcreTrack; o login local só existe como reserva e para a conta de emergência | §14 |
| Servidor recalcular tudo na aprovação | **Aceito:** o servidor é a autoridade final; o núcleo de cálculo existe em TS e Python, com os mesmos casos de teste | §5, §15.3 |
| Um único documento definitivo | **Aceito:** este documento | — |
| Biblioteca de gráficos em vez de SVG à mão | **Aceito:** Apache ECharts 5.5.1, com exportação | §13 |

**Revisão 4.1 (segunda revisão do Ricardo):**

| Ponto | Decisão | Onde |
|---|---|---|
| Água dos aditivos contada duas vezes no volume | **Aceito.** Indicadores usam a água efetiva; o volume físico usa a água líquida adicionada + o volume integral dos aditivos. Novo teste P7 | §6.2, §17 |
| Volume dos aditivos fixo no ajuste na betoneira | **Aceito.** Os volumes dos aditivos entram no recálculo, por kg de aglomerante. Novo teste P3b | §7.5 |
| Mudança em material afeta traço aprovado sem aviso | **Aceito.** Snapshot dos materiais por versão; alteração gera avaliação de impacto obrigatória | §15.5 |
| Rollback restaura o banco e pode apagar dados novos | **Aceito.** Rollback automático só do código; migrações só aditivas; restauração de dados manual, por procedimento | §16.4, §16.5 |
| Regressão com 3 ajustes | **Aceito.** 3 ajustes só para histórico; recomendação exige n ≥ 8, fatores independentes e graus de liberdade | §9.4 |
| Período do sd configurável | **Aceito.** Regra normativa fixa (20 consecutivos em 30 dias); outros períodos só em Gestão, como análise não normativa | §6.5 |
| Um ensaio libera para aprovação | **Aceito.** Plano experimental definido pela engenharia, que precisa estar completo | §6.6, §9.6 |
| Token transportado entre aplicações | **Aceito.** Ticket de uso único + PKCE, ou OIDC com PKCE; o token não aparece em URL | §14.2 |
| Limite só no Uvicorn; build e PostgreSQL na VPS | **Aceito.** Build fora da VPS, sem instalar PostgreSQL na VPS antiga, limites também na role e no backup | §16 |
| Acesso root ao processo automático | **Aceito.** Usuário `deploy-dosagem` com sudo restrito, criado uma vez pelo Ricardo com o script do pacote | §3, §20 |
| Desforma | **Aceito.** Curvas por traço, cimento, temperatura e cura; o tempo estimado nunca autoriza desforma; referência à NBR 9062 | §9.5, §11 |
| Tolerâncias de dosagem | **Aceito.** Cimento e água ±1 %, agregados ±2 %, aditivos ±3 % (sujeitos à verificação normativa e metrológica) | §11 |
| Rastreabilidade na carta de produção | **Aceito.** Lote dos materiais, hora da medição de umidade, balança ou dosador | §11 |
| Portão F1 com os testes novos e portão contra migração destrutiva | **Aceito** | §2 |

---

## 2. Execução em uma rodada, com portões

A rodada é sequencial. Cada fase termina com um portão automático. **Portão reprovado = a fase seguinte não roda**, exceto a geração do relatório, que sempre roda.

| Fase | Entrega | Portão para avançar |
|---|---|---|
| F0 | Reconhecimento: repositório, código da rodada 1, Hub, autenticação, VPS **somente leitura** | `00-RECONHECIMENTO.md` e `VPS-RECONHECIMENTO.md` gerados |
| F1 | **Motor de cálculo** (TS + Python): dois métodos, água, adições, volumes, umidade/absorção, Abrams, idades, granulometria, otimização | **Todos** os casos de teste da §17 passam nos dois núcleos, **incluindo obrigatoriamente P1b, P3b, P5, P6 e P7** (balanço físico) e a verificação automática de **volume = 1000,0 ± 0,05 L em balanço completo** sobre 200 traços aleatórios válidos (teste de propriedade) |
| F2 | Banco, API, autenticação, aprovação com recálculo no servidor, snapshot de materiais, importadores | pytest verde, contrato `API.md` gerado, **verificador de migrações** (§16.5) sem nenhuma operação destrutiva |
| F3 | Interface: quatro ambientes, três layouts, gráficos, CAA, idades, produção, gestão | Vitest e Playwright verdes nos três tamanhos de tela; `axe` sem violações sérias |
| F4 | **Homologação local isolada** com Docker Compose (nginx + api + postgres, igual à produção) e E2E completo contra ela | E2E de homologação verde; restauração de backup testada |
| F5 | **Portão da VPS:** medição de recursos e conferência dos outros sites | §16.1 aprovado |
| F6 | Deploy em produção na VPS antiga (artefatos já construídos) + smoke test + conferência dos outros sites | §16.4 aprovado; se falhar, **rollback automático do código** (o banco nunca é restaurado automaticamente) |
| F7 | Relatório final e checklist manual | sempre |

---

## 3. Regras invioláveis

1. **A VPS antiga roda sistemas em produção** (PCP, Mapa, GED antigo e outros). Não pare, reinicie, atualize nem reconfigure nada que não seja desta aplicação.
2. Proibido:
   - `apt upgrade` ou `dist-upgrade`;
   - editar o `postgresql.conf` ou o `pg_hba.conf` globais (exceção: no máximo uma linha para a role desta aplicação);
   - editar server blocks de outros sites;
   - `systemctl restart nginx` (use `nginx -t && systemctl reload nginx`);
   - abrir portas novas;
   - usar `certbot --nginx`.
3. Tudo desta aplicação fica em `/opt/concretrack-dosagem/`, com usuário de sistema, banco, serviço e site nginx **próprios**. A API escuta só em `127.0.0.1`.
4. **Nenhuma credencial** no repositório, no relatório ou em logs. Só um `.env.example` fictício.
5. **Acesso à VPS somente pelo usuário `deploy-dosagem`**, com a chave SSH que o Ricardo fornecer no ambiente do Codex (alias `vps-antiga`).
   - Esse usuário é criado antes pelo Ricardo, como root, com `docs/dosagem-v2/deploy/preparar-vps.sh` (§20). Ele só pode escrever em `/opt/concretrack-dosagem/` e só executa como root o wrapper `sudo /usr/local/sbin/ctdosagem-instalar <subcomando>`.
   - Subcomandos do wrapper:
     - `units`: instala as units `concretrack-dosagem-*` da release atual, validando `User=ctdosagem`, ExecStart dentro de `/opt/concretrack-dosagem/` e a ausência de prefixos de privilégio;
     - `nginx-site`: instala o site, validando `server_name`, `root`/`alias`, includes e certificados; roda `nginx -t` e restaura o arquivo anterior se falhar;
     - `reload-nginx`, `restart-api`, `status-api`;
     - `enable <units>`;
     - `certbot`: só certonly webroot para o domínio;
     - `diagnostico`: somente leitura.
   - O Codex gera os arquivos de unit e de site **dentro dessas regras**. O que o wrapper recusa vira pendência no relatório.
   - **Nunca use root nem senha.** Se algo exigir root além da lista branca, não faça: registre o comando no relatório para o Ricardo executar.
   - A chave privada nunca entra no repositório, no relatório nem em logs.
5a. **Nada é compilado na VPS.** O SPA é construído na máquina do Codex. A API vai como wheels pré-construídas (`pip download`/`pip wheel` para a plataforma da VPS) e é instalada com `pip install --no-index`.
5b. **Não instalar PostgreSQL nem nenhum pacote na VPS antiga.** Se não houver um PostgreSQL utilizável, o portão F5 reprova.
6. **Legado intacto:** `git diff` vazio em `dosagem-concreto/` e nos Apps Scripts antigos. A única exceção é o arquivo novo da ponte de login (§14.2), se essa for a opção escolhida.
7. **Fórmulas:** siga este documento. A planilha é a origem; onde este documento corrige a planilha, a correção vem marcada **[CORREÇÃO]**, e o relatório lista o valor da planilha e o valor novo.
8. Se um teste com números esperados falhar, corrija o código. **Nunca altere o valor esperado.** Se discordar de um valor, deixe o teste falhando e marque "divergência a decidir".
9. **Critério interno ≠ norma.** Todo limite que não vem de norma aparece rotulado "critério interno" e é editável em Configurações.

---

## 4. Decisões fechadas

| # | Decisão |
|---|---|
| D1 | App **standalone** em `https://dosagem.concretrack.com.br`, servido inteiro pela **VPS antiga** (`31.97.241.84`): SPA, API e PostgreSQL |
| D2 | Frontend: o React 18 + TypeScript + Vite da rodada 1, adaptado. Estado com Zustand, validação com Zod, gráficos com Apache ECharts 5.5.1, testes com Vitest + Playwright |
| D3 | Backend: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, psycopg 3, argon2-cffi, httpx; testes com pytest |
| D4 | **Dois métodos de dosagem:** Principal (Abrams + teor de argamassa, planilhas Udemy) e Alternativo (método Concrefer, aba "1.0 - TRAÇO ALTERNATIVO"). "Científica" e "cálculo inverso" do legado viram Ferramentas |
| D5 | **Tipo de concreto** escolhido no início do traço: convencional ou CAA. Isso muda os ensaios, as classes e os alertas |
| D6 | Traço = documento versionado com os estados `rascunho → liberado_ensaio → aprovado → inativo`. Os materiais são uma lista de itens |
| D7 | Servidor é a autoridade: ele **recalcula** o traço em toda gravação de `liberado_ensaio` e de `aprovado` |
| D8 | Casca visual do redesign (paleta navy `#0A1530`, vermelho `#DB0A40`, amarelo `#FFC906`, fundo `#EEF1F7`) com três layouts: desktop ≥ 1280, tablet 600–1279, celular < 600 px. Modo forçável em Configurações |
| D9 | Somente pt-BR e tema claro. Vírgula decimal na exibição; a entrada aceita vírgula e ponto |
| D10 | Legado `dosagem-concreto/` (GitHub Pages) continua no ar e intocado. O build v2 que estiver no GitHub Pages pode ficar, mas o endereço oficial é o da VPS |

---

## 5. Arquitetura

```text
https://dosagem.concretrack.com.br   (nginx, site próprio, TLS)
 ├── /        SPA estático      /opt/concretrack-dosagem/current/web
 └── /api/    FastAPI           127.0.0.1:<PORTA>   (systemd, limites de CPU e memória)
                 └── PostgreSQL  banco concretrack_dosagem · role dosagem_app

dosagem-concreto-v2/
  web/src/core/        núcleo de cálculo TS (puro: sem DOM, sem React, sem rede)
  web/src/{app,data,features,ui,charts,print}/
  api/app/calc/        núcleo de cálculo Python (porte 1:1 do TS)
  api/app/{auth,rpc,acoes,modelos,validacao,importacao}/
  shared/golden/*.json casos de teste com números esperados, usados pelos DOIS núcleos
  deploy/ (nginx, systemd, scripts) · docker-compose.hml.yml (homologação local)
```

- **Paridade dos núcleos:** `shared/golden/*.json` traz entradas e saídas esperadas. Vitest e pytest leem os mesmos arquivos. Uma divergência entre TS e Python acima da tolerância **reprova a F1**.
- O cliente calcula ao vivo; o servidor recalcula ao gravar e devolve os valores **dele**. Se o cliente e o servidor diferirem acima da tolerância, a gravação é recusada com `DIVERGENCIA_CALCULO` e o detalhe campo a campo.
- **Mesma origem** para app e API: sem CORS, cookie `SameSite=Lax`.

---

## 6. Regras comuns de cálculo (valem para os dois métodos)

### 6.1 Unidades e conversão

- No modelo, a massa específica fica sempre em **kg/dm³** e a umidade e a absorção em **fração** (0,11 = 11 %).
- A conversão de texto para número é feita **uma única vez**, em `parseNumero` (aceita `1.234,5`, `1234,5` e `1234.5`).
- Nenhuma tela, carta ou gravação pode conter `NaN`, `Infinity` ou um negativo impossível.

### 6.2 Balanço de volume físico **[CORREÇÃO]**

Todo componente com massa ocupa volume, e **cada parcela de água é contada uma única vez**:

```text
V_total = Σ m_ref,i/ρ_ref,i            (cimento, adições, agregados na condição de referência)
        + Σ m_aditivo,k/ρ_aditivo,k   (volume INTEGRAL do aditivo, incluindo a água que ele contém)
        + Σ m_menores/ρ + fibras
        + V_água_líquida_ref
        + V_ar                         = 1000 L

água_aditivos     = Σ m_aditivo,k · (1 − sólidos_k)                (0 se o teor de sólidos estiver vazio)
V_água_líquida_ref = água_efetiva − água_aditivos                  (água a adicionar com os agregados na condição de referência)
```

- **Por que assim:** a água do aditivo já ocupa espaço dentro do volume do aditivo. Somar a água efetiva inteira com o volume do aditivo contaria essa água duas vezes. Exemplo: 2 kg de aditivo, ρ 1,10 e 50 % de sólidos ocupam 1,82 L e contêm 1 kg de água. O balanço usa 1,82 L de aditivo e (água efetiva − 1) L de água líquida.
- **A água efetiva** é a usada nos indicadores (a/c, a/agl, §6.3). **A água líquida** é a usada no volume físico e, depois da correção dos agregados (§6.4), na balança.
- **A massa específica de cada agregado tem de corresponder à sua condição de referência**: ρ seca para referência seca, ρ SSS para referência SSS. Assim a água de absorção fica dentro do volume do grão e não é contada outra vez. O cadastro guarda as duas, e o cálculo usa a da condição escolhida.
- **Padrão: "balanço completo".** O volume de aditivos, adições menores e fibras sai do volume disponível para os sólidos **antes** da divisão argamassa/agregados (ver cada método). A água usada no volume é a **água líquida**.
- **"Modo planilha"** (opção por traço, só para conferência): reproduz a planilha, com aditivos e adições menores fora do balanço. O painel mostra em destaque "fora do balanço: X L" e o traço **não pode ser aprovado** nesse modo.
- **Volume ocupado por 1 kg de aglomerante** com fração mássica F de adição:
  `v_agl = (1 − F)/ρc + F/ρad`.
  > **[CORREÇÃO]** A planilha usa 1/[(1−F)·ρc + F·ρad] (média aritmética das densidades), que é incorreto.
- **Água dos aditivos:** campo "teor de sólidos" (fração) por aditivo. Se informado, a água do aditivo faz parte da **água efetiva**: ela é descontada da água líquida, e não somada de novo. Se vazio, o painel mostra "água dos aditivos não considerada" e a água do aditivo é tratada como 0.

### 6.3 Indicadores com nomes distintos

| Nome no código | Exibição | Definição |
|---|---|---|
| `relacaoAguaCimento` | a/c | água efetiva ÷ cimento |
| `relacaoAguaAglomerante` | a/agl | água efetiva ÷ (cimento + adições reativas) |
| `teorArgamassaVol` | teor de argamassa (vol.) | V(aglomerante + miúdos) ÷ V(aglomerante + miúdos + graúdos) |
| `teorArgamassaMassa` | α (massa) | m(aglomerante + miúdos) ÷ m(aglomerante + miúdos + graúdos) |
| `tracoUnitario` | 1 : a : p : x | sobre o aglomerante (configurável: aglomerante ou cimento) |
| `consumoCimento`, `consumoAglomerante` | kg/m³ | |
| `massaEspecificaTeorica` | kg/m³ | Σ massas ÷ (V_total/1000) |
| `finosMCC` | kg/m³ | Σ m_i × fração < 0,075 mm |
| `custo` | R$/m³ | Σ m_i × custo_i |

Cada adição tem a marca **"reativa"** (conta no a/agl: metacaulim, sílica, escória, cinza) ou **"inerte"** (filler calcário: não conta no a/agl e entra nos finos).

### 6.4 Umidade, absorção e água **[CORREÇÃO]**

Por agregado:
- **condição de referência das massas de projeto:** `seca` ou `sss` (saturada superfície seca); o padrão vem do método (§7 seca, §8 sss);
- **h** = umidade total sobre a massa seca (medida no dia);
- **a** = absorção sobre a massa seca.

```text
m_seca      = m_ref                   (ref = seca)     |  m_ref / (1 + a)    (ref = sss)
m_a_pesar   = m_seca · (1 + h)
água_livre  = m_seca · (h − a)        (positiva = traz água; negativa = absorve)
água_dosada = V_água_líquida_seca − Σ água_livre
             (V_água_líquida_seca = água_efetiva − água_aditivos; com referência SSS a absorção é descontada
              pela própria água_livre, porque m_seca já foi convertida)
```

- A **água efetiva** é a água de projeto, usada no a/c e no a/agl.
- A **água dosada** é a que vai para a balança.
- O mesmo número aparece nos dois núcleos e na carta: **água efetiva = água dosada + Σ água_livre + água_aditivos**. Essa identidade é verificada em teste.
- O app mostra as duas, sempre lado a lado, e a carta de produção mostra **massa a pesar** e **água dosada**.

> **[CORREÇÃO]** A planilha Rica usa m·(1 + h − a), uma aproximação da forma exata para referência SSS. A planilha Udemy só aplica h, sem absorção. As duas aproximações ficam disponíveis no "modo planilha" para conferência.

### 6.5 Regras normativas

Os valores desta seção foram conferidos pelo Ricardo no texto da **ABNT NBR 12655:2022**.
- Eles ficam em Configurações › Normas com a fonte "NBR 12655:2022" e a data da conferência. Só o papel `admin` edita, com registro na auditoria.
- A tela Referência mostra o aviso "verificar vigência e emendas no catálogo ABNT".

**Condição de preparo (NBR 12655):**

| Condição | sd (MPa) | Classes permitidas |
|---|---|---|
| A | 4,0 | todas |
| B | 5,5 | C10 a C20 |
| C | 7,0 | C10 e C15 |

Para uma classe acima do limite, a condição **não aparece para escolha**.

**Desvio-padrão:**
- **sd normativo (regra fixa, não configurável):**
  - o app procura **pelo menos 20 resultados consecutivos** de 28 dias, válidos, obtidos **num período de até 30 dias**, do mesmo concreto ou de concretos produzidos em condições equivalentes (mesma família, definida pelo engenheiro, com o mesmo cimento, os mesmos agregados e a mesma central);
  - aplica o mínimo de **2,0 MPa**;
  - mostra n, o período, a lista dos resultados e a família.
- Sem dados que cumpram a regra, usa o sd da condição de preparo.
- **Não há caixa de marcar para declarar sd conhecido**, e o período normativo **não é editável**.
- **Análises gerenciais** (Gestão, §12) podem calcular sd em outros períodos e com outros filtros, sempre rotuladas **"análise não normativa — não usar no fcj"**.

**fcj** = fck + 1,65·sd.

**Limites por classe de agressividade (a/c máximo e consumo mínimo):**

| Classe | a/c máx. CA | a/c máx. CP | Classe mín. CA | Classe mín. CP | Consumo mín. (kg/m³) |
|---|---|---|---|---|---|
| I | 0,65 | 0,60 | C20 | C25 | 260 |
| II | 0,60 | 0,55 | C25 | C30 | 280 |
| III | 0,55 | 0,50 | C30 | C35 | 320 |
| IV | 0,45 | 0,45 | C40 | C40 | 360 |

### 6.6 Estados do traço e critérios de bloqueio

| Requisito | Rascunho | Liberado para ensaio | Aprovado |
|---|---|---|---|
| Campos obrigatórios e números válidos | pode faltar | **obrigatório** | **obrigatório** |
| Frações dos grupos somam 100 % | aviso | **bloqueia** | **bloqueia** |
| Volume 1000 ± 1 L em balanço completo | aviso | **bloqueia** | **bloqueia** |
| Modo planilha | permitido | permitido | **bloqueia** |
| a/c máx., consumo mín. e classe mín. (norma) | aviso | aviso + justificativa | **bloqueia** |
| Condição de preparo compatível com a classe | aviso | **bloqueia** | **bloqueia** |
| Ensaios dos materiais vigentes (critério interno) | aviso | aviso | aviso + justificativa |
| Plano experimental (§9.6) definido pela engenharia | — | **obrigatório** (o laboratório executa contra ele) | **obrigatório e completo**: todas as misturas, idades e CPs previstas executadas, e todos os critérios de aceitação do plano atendidos |
| Critério de desforma (quando o produto exigir) | — | — | **obrigatório**: resultados **ensaiados** na idade de desforma ≥ mínimo em todas as misturas do plano (a estimativa pela curva não conta) |
| Materiais do snapshot iguais aos do cadastro, ou impacto avaliado (§15.5) | aviso | aviso | **bloqueia** enquanto houver avaliação de impacto pendente |
| Recálculo do servidor igual ao do cliente | — | **obrigatório** | **obrigatório** |
| Quem pode | laboratorista | laboratorista | **engenheiro**, com parecer |

---

## 7. Método Principal — Abrams + teor de argamassa (planilhas Udemy)

### 7.1 Curvas de Abrams (cadastro por cimento)

**Ensaios** (aba "AJUSTE DE ÁGUA"). Por betonada: ar, volume (L), fck alvo, descrição, água inicial (L/m³), consumo (kg/m³), ajuste de água (kg), abatimento final e resistências por idade (§9.5).

```text
a/c final  = (V/1000·água_inicial + ajuste) / (V/1000·consumo)                 [I5]
água final = 1000·(V/1000·água_inicial + ajuste) / (V + ajuste/(1 − ar))       [H6]
```

A água final é sempre calculada. A planilha tinha 195 digitado por cima da fórmula em H5 e H14.

**Ajuste:** pares (a/c final, R28), mínimo de 3 pontos com R28 > 0; com menos, a curva fica "incompleta". Calcule **os dois modelos**, com o R²:

```text
Potência:     fc = A·(a/c)^B        (regressão de ln fc em ln(a/c))
Exponencial:  fc = k1 / k2^(a/c)    (regressão de ln fc em a/c)
```

- Modelo padrão da curva: potência (paridade com a planilha).
- Os coeficientes **sempre** saem da regressão; não há campo para digitar A e B.
- **Recalibração:** toda vez que um traço com essa curva recebe um resultado de 28 d válido, o par (a/c efetivo, R28) pode ser incluído na curva, por escolha do engenheiro. A curva guarda o histórico das versões.

**Lei de Lyse (água × a/c):** interpolação linear entre os pares (a/c, água final). Fora do intervalo ensaiado, usa o ponto extremo e mostra o aviso "extrapolação da curva de água".
> **[CORREÇÃO]** A planilha interpolava até uma célula vazia e tinha 195 digitado no C40.

**Tabela de projeto:** para cada fck da lista, com o sd conforme a §6.5:

```text
fcj     = fck + 1,65·sd
a/c     = (fcj/A)^(1/B)            (exponencial: ln(k1/fcj)/ln k2)
água    = ARRED.BAIXO(Lyse(a/c), 0)
cimento = ARRED.CIMA(água / a/c, 0)
```

Mostre um aviso quando o a/c ficar fora do intervalo ensaiado ("extrapolação da curva de Abrams").

### 7.2 Entradas do traço (aba "Dosagem ")

| Campo | Padrão |
|---|---|
| água efetiva (L/m³) | sugerida pela curva (Lyse) |
| **consumo de aglomerante** (kg/m³) **ou** a/c | consumo sugerido = água ÷ a/c(fcj) |
| fração F da adição **no aglomerante** e densidade (planilha F32 e I14) | 0 |
| Targ, teor de argamassa **volumétrico** | digitado (ex.: 0,48) |
| ar | digitado (ex.: 0,03) |
| até 3 areias e 3 britas: proporção **em massa** no grupo, ρ, h, a | do cadastro e dos ensaios |
| até 3 aditivos (% sobre o aglomerante, ρ, teor de sólidos) e adições menores ou fibras (% sobre o aglomerante, ρ) | |
| betonada (L) | 25 |

Regras:
- C = consumo · (1 − F) e Ad = consumo · F (planilha G31 e G32).
- Se o a/c for digitado em vez do consumo: consumo = água ÷ (a/c × (1 − F)), para que o a/c seja água/cimento. A tela mostra o a/c e o a/agl resultantes.

### 7.3 Cálculo por m³

```text
V_menores = Σ m_aditivos/ρ (volume integral) + Σ m_adições_menores/ρ    (0 no modo planilha)
água_liq  = água_efetiva − água_aditivos                                 (§6.2; = água_efetiva no modo planilha)
Vsól      = 1000 − 1000·ar − água_liq − V_menores
Vareias   = Targ·Vsól − C/ρc − Ad/ρad
Vbritas   = (1 − Targ)·Vsól
m_areia_i = Vareias · f_i / Σ_j(f_j/ρ_j)                       [CORREÇÃO da média ρ̄ da planilha]
m_brita_i = Vbritas · f_i / Σ_j(f_j/ρ_j)
```

- As proporções de cada grupo devem somar 100 % (§6.6).
- Saídas: massas por m³ e por betonada (aditivo em kg, g e mL), os indicadores da §6.3, o volume (= 1000,0 L), a correção de umidade (§6.4) e o custo.

### 7.4 Granulometria e esqueleto

- **Areias:** % retida individual → mistura Σ f_i·%ret_i → acumulada → módulo de finura **calculado**.
  > **[CORREÇÃO]** Na planilha o MF dá #REF!.
- **Britas:** % retida acumulada → mistura.
- **Zonas da NBR 7211** (miúdo: utilizável e ótima; graúdo: zonas por d/D).
  > **[CORREÇÃO]** As faixas JIS da planilha e a interpolação com LOG(9,8) ficam fora.
- **Peneiras:** série normal e intermediária da NBR NM 248. O importador converte as antigas (4,8 → 4,75; 2,4 → 2,36; 1,2 → 1,18; 12,7 → 12,5).
- **Curva do esqueleto:** % passante do conjunto de todos os sólidos, ponderada em massa. O cimento e os finos entram como passantes na 0,15 mm. O total fecha em 100 %.
  > **[CORREÇÃO]** Na planilha o total fechava em 84,6 %.

### 7.5 Ajuste na betoneira e traço corrigido (planilha AW/AX e H) **[CORREÇÃO de v_agl e dos volumes dos aditivos]**

O laboratório registra o **acréscimo** de cada material (kg, na condição em que foi pesado), **inclusive dos aditivos**:

```text
acr_seco_i   = acr_i / (1 + h_i)                                (agregados)
água_extra   = Σ (acr_i − acr_seco_i)                           (umidade trazida pelos acréscimos)
base         = C_bet + Ad_bet + acr_C + acr_Ad
F'           = (Ad_bet + acr_Ad) / base
unit_i       = (m_bet_ref_i + acr_ref_i) / base                 (agregados na condição de referência)
unit_adit_k  = (m_adit_bet_k + acr_adit_k) / base               (dosagem real do aditivo por kg de aglomerante)
unit_menor_j = (m_menor_bet_j + acr_menor_j) / base
unit_água_liq = (água_líquida_bet + acr_água + água_extra) / base   (água líquida: SEM a água dos aditivos)

v_por_kg_agl = (1 − F')/ρc + F'/ρad
             + Σ unit_i/ρ_i
             + Σ unit_adit_k/ρ_k  + Σ unit_menor_j/ρ_j          ← volumes dos aditivos e menores ACOMPANHAM a nova composição
             + unit_água_liq

Agl_corr     = (1000 − 1000·ar) / v_por_kg_agl
m_corr_i     = unit_i · Agl_corr        ;   m_adit_corr_k = unit_adit_k · Agl_corr
água_efetiva_corr = unit_água_liq·Agl_corr + Σ m_adit_corr_k·(1 − sólidos_k)
```

- **Nenhum volume fica fixo:** se o aglomerante mudar, a massa e o volume dos aditivos mudam junto. No modo planilha, os termos de aditivos e menores somem do denominador (como na planilha), e o resultado vem marcado "modo planilha".
- O botão "Criar versão com o traço corrigido" gera uma versão nova do traço, em rascunho, com o % de aditivo recalculado sobre o novo aglomerante.

---

## 8. Método Alternativo — método Concrefer (aba "1.0 - TRAÇO ALTERNATIVO")

### 8.1 Entradas

| Campo | Célula | Caso de teste A1 |
|---|---|---|
| a/c | D7 | 0,57 |
| água efetiva (L/m³) | X15 | 200 |
| adição (fração **sobre o cimento**), ρ, reativa/inerte | X7, F14 | 0 · 2,60 · inerte |
| teor de argamassa **volumétrico** | X8 | 0,525 |
| ar | X9 | 0,02 |
| aditivos 1–3 (fração), base (cimento ou cimento + adição), ρ, teor de sólidos | Q7–Q9, Y14 | 0,0062 · cimento · 1,09 |
| Areia 1, 2, 3: fração **em volume** no miúdo, ρ, h, a | E8/F8/G8, linha 14, linha 9, AT | 0,2 / 0,8 · 2,63 / 2,67 · 11 % / 10 % · 0 |
| Areia 3 mista: passante na 4,75 mm | AK30 | 0,7 |
| Brita 0, Brita 1/2: fração **em volume** no graúdo, ρ, h, a | K8/M8 | 1,0 / 0 · 2,80 · 0,5 % |
| fração de finos < 0,075 mm por material | AI8:AP8 | cimento 1 · areia 1 0,02 · brita 0 0,03 |
| betonada (L) | AB7 | 1000 |
| arredondar MCC a kg inteiro | — | sim (paridade com a planilha) |
| condição de referência dos agregados | — | **SSS** (método Concrefer) |

### 8.2 Cálculo por m³

```text
C        = ARRED(água / (a/c), 0)                                      [C15]
Ad       = C · %adição                                                 [F15]
aditivos = ARRED(%·base, 3)                                            [Y15]
V_menores = Σ m_aditivos/ρ (integral) + fibras                         (0 no modo planilha)
água_liq = água − água_aditivos                                        (§6.2; = água no modo planilha)
Vbritas  = (1000 − 1000·ar − água_liq − V_menores) · (1 − Targ)        [AF8, AF9]
m_brita_j, m_misto = ARRED(Vbritas · fv · ρ, 0)                        [R15, V15, P15]
Vfixos   = C/ρc + Ad/ρad + Σ m_brita/ρ + m_misto/ρ + água_liq + V_menores  [AF6]
Vareias  = 1000 − 1000·ar − Vfixos                                     [AF7]
m_areia_i = ARRED(Vareias · fv_i · ρ_i, 0)                             [H15, K15, N15]
```

- As areias completam o volume.
- As frações (em volume) de cada grupo devem somar 1,000 ± 0,001. Se não somarem, aparece "faltam X L/m³" (§6.6).
  > **[CORREÇÃO]** Na planilha, 11 abas do grupo R10 fecham em 960 L e a FILLER V2 em 1.045 L.
- **Areia 3 mista:** a parte fina (fração G8) e a graúda (fração I8 do grupo graúdo) vêm do traço de referência (§8.5) ou são digitadas. Na tabela, aparecem como duas linhas do mesmo material.

### 8.3 Indicadores próprios (colunas AI–AP)

- % miúdo, % graúdo e % agregados sobre o concreto;
- % miúdo e % graúdo sobre os agregados;
- % aglomerante sobre o concreto;
- teor de água = água ÷ massa seca total;
- **finos no MCC**, com o critério interno de CAA (padrão "≥ 450 kg/m³", editável).

### 8.4 Betonada e betonada corrigida

- betonada = MCC × V/1000;
- aditivo em g e mL;
- correção pela §6.4 com referência SSS. O resultado exato substitui a fórmula m·(1 + h − a) da planilha; no modo planilha, a fórmula aproximada aparece para conferência.
  > **[CORREÇÃO]** O aditivo 3 e a fibra passam a ser calculados (na planilha as fórmulas apontavam para células vazias).

### 8.5 Traço de referência (blocos AI20:AP31 e AR20:AX31)

Painel "Partir de um traço de referência": escolha um traço salvo ou digite as massas. O app calcula:
- frações volumétricas das areias (com a parte fina da areia 3) e das britas (com a parte graúda da areia 3);
- teor de argamassa **volumétrico e em massa**, cada um com o seu nome;
- volume teórico e ar previsto;
- a/c, % de aditivo, % de filler.

O botão "Usar como ponto de partida" preenche a §8.1. Um segundo traço pode ser aberto lado a lado.

> **[CORREÇÃO]** O aditivo não entra mais na divisão entre as britas, e o rótulo "(vol)" sobre a fórmula em massa deixa de existir.

---

## 9. Laboratório

### 9.1 Ensaios de materiais

- Granulometria miúda e graúda, massa específica, absorção, umidade, material pulverulento (finos < 0,075 mm) e resistência do cimento.
- Cada ensaio salvo atualiza o material e avisa quais traços em rascunho ou liberados usam aquele material.

### 9.2 Misturas experimentais (convencional)

Por mistura (até 10 por versão):
- nº, data e hora, temperaturas (ambiente e concreto), umidade relativa;
- água inicial e de retorno (mL);
- abatimento inicial e nos tempos configuráveis;
- ar medido;
- classe visual do abatimento (1–7) e aspecto da argamassa;
- exsudação, tempo de pega e observações;
- corpos de prova moldados com idades e datas previstas.

```text
água efetiva corrigida = (água adicionada mL / V_betonada L) + água efetiva      [X21]
a/c corrigida = ÷ cimento  ;  a/agl corrigida = ÷ (cimento + adições reativas)
```

> **[CORREÇÃO]** Na planilha a "a/c corrigida" dividia por cimento + filler.

**Massa específica fresca:**
- recipiente configurável (padrão CP 10×20 = π/2 dm³);
- ρ = (massa conjunto − massa recipiente)/V;
- rendimento = Σ massas/ρ/1000;
- consumo real = aglomerante/rendimento;
- ar gravimétrico = 1 − V_teórico_sem_ar/rendimento.

Com massa vazia, o resultado fica vazio.

### 9.3 Modo CAA (NBR 15823; classes editáveis)

Com tipo = CAA, o abatimento sai de cena e entram:

| Ensaio | Resultado | Classes |
|---|---|---|
| Espalhamento (slump-flow) | mm | SF1 550–650 · SF2 660–750 · SF3 760–850 |
| T500 | s | VS1 ≤ 2 · VS2 > 2 |
| Índice de estabilidade visual | 0–3 | IEV 0 a 3 |
| Anel J | mm (diferença) | PJ1 / PJ2 |
| Caixa L | H2/H1 | PL1 / PL2 |
| Funil V | s | VF1 / VF2 |
| Coluna de segregação | % | SR1 / SR2 |
| Manutenção | espalhamento em tempos configuráveis (padrão +10, +20, +30 min) | perda (%) e classe a cada tempo |

No Objetivo do traço CAA, o engenheiro informa as **classes exigidas**. A aprovação confere os resultados contra elas. Os finos no MCC são indicador obrigatório.

### 9.4 Ajustes experimentais **[CORREÇÃO: substitui a regra linear de 0,3 L/mm]**

- O laboratório registra cada ajuste feito na mistura: o quê (água, aditivo, areia…), quanto, quando e o efeito observado (abatimento ou espalhamento antes e depois, estabilidade).
- **Nunca** se propõe retirar água de uma mistura existente.
- **Histórico comparativo** (a partir de 3 ajustes do mesmo traço ou família): tabela e gráfico de dispersão Δágua e Δaditivo × Δabatimento/Δespalhamento. **Não há recomendação** nesse nível.
- **Recomendação para a próxima betonada**, só quando **todas** as condições abaixo forem verdadeiras:
  1. n ≥ 8 ajustes válidos da mesma família (mesmo cimento, aditivo, agregados e faixa de temperatura);
  2. graus de liberdade residuais ≥ 5 (n − número de preditores − 1);
  3. **fatores independentes:** |correlação entre Δágua e Δaditivo| < 0,7 e as duas variáveis com pelo menos 3 níveis distintos;
  4. modelo de regressão múltipla Δtrabalhabilidade = b0 + b1·Δágua + b2·Δaditivo, com R² ajustado ≥ 0,6.
- A recomendação mostra n, R² ajustado, os coeficientes com **intervalo de confiança de 95 %**, e a frase fixa "sugestão para a próxima betonada; validar em laboratório". Ela nunca altera o traço sozinha.
- Se qualquer condição falhar, aparece o motivo ("faltam 3 ajustes", "água e aditivo variaram juntos") e o plano mínimo para obter dados independentes (variar um fator por vez).
- O ajuste na betoneira (§7.5) gera a versão corrigida do traço.

### 9.5 Resistências por idade e desforma

- **Idades configuráveis.** Padrão: 12 h, 18 h, 24 h, 3 d, 7 d, 28 d. É possível acrescentar outras (ex.: 6 h, 14 d, 63 d).
- Por idade: corpos de prova (2 a 6), carga, resistência, maior e média. O valor do exemplar é configurável (padrão "maior de dois", como na planilha).
- **Curva de resistência × idade calibrada por cimento** (modelo fib Model Code):

  ```text
  fc(t) = fc28 · exp( s · (1 − √(28/t)) )         t em dias (12 h = 0,5)
  regressão linear: ln fc = ln fc28 + s·x,  x = 1 − √(28/t)
  ```

  - **Cada curva tem uma chave própria:** traço (ou família), cimento, **regime de cura** (ambiente, vapor ou térmica, com o ciclo informado) e **faixa de temperatura** do concreto e do ambiente (padrão: < 20 °C, 20–30 °C, > 30 °C).
    - Resultados de chaves diferentes **nunca** se misturam na mesma curva.
    - A curva mostra n, R², o intervalo de idades ensaiado e as condições.
  - Para pré-moldados, a calibração exige **ensaios reais nas primeiras 24 h** da chave. Sem pelo menos 2 idades ≤ 24 h ensaiadas, a curva não mostra estimativa nessa faixa.
  - Fora do intervalo ensaiado, aparece o aviso "extrapolação". **Nas idades em horas, a estimativa nunca substitui o ensaio.**
- **Tabela preliminar** em fração do fcj (3/7/14/28 d): CP III 0,40/0,65/0,82/1,00 · CP V 0,50/0,80/0,90/1,00 · CP II 0,45/0,70/0,85/1,00 (**a confirmar pela engenharia**).
  - Ela só é usada enquanto o cimento não tem uma curva calibrada com n ≥ 6 pontos em pelo menos 3 idades.
  - Sempre rotulada "referência preliminar".
- **Critério de desforma por produto** (cadastro Produto: poste DT, poste circular, aduela…): resistência mínima (MPa) e idade-alvo (h), definidos pela engenharia.
  - O traço aprovado para o produto exige resultado ensaiado na idade-alvo ≥ mínimo.
  - A curva calibrada mostra o tempo estimado para atingir o mínimo:
    `t = 28 / (1 − ln(fmin/fc28)/s)²`
  - **O tempo estimado é só informativo e nunca autoriza desforma.**
  - A **liberação de desforma** de cada lote (§11) exige o resultado de CP **do próprio lote**, ensaiado e ≥ mínimo, registrado por um usuário autorizado. A tela de referência cita a **ABNT NBR 9062** (projeto e execução de pré-moldados), que rege a desforma e a movimentação; o critério numérico é definido pela engenharia.

### 9.6 Plano experimental (obrigatório para aprovação)

Ao liberar um traço para ensaio, o engenheiro define o **plano experimental** da versão:
- número de misturas (padrão 3, mínimo configurável pela engenharia), com a condição de cada uma: dias diferentes, lotes diferentes de cimento ou variação de água/aditivo;
- volume da betonada;
- ensaios de concreto fresco obrigatórios (convencional: abatimento e manutenção, ar, massa específica; CAA: as classes exigidas da §9.3);
- idades de rompimento e número de CPs por idade (padrão 2);
- idade e critério de desforma (se o produto exigir);
- **critérios de aceitação**: por exemplo, todos os exemplares de 28 d ≥ fcj, média ≥ fcj + margem, abatimento dentro da tolerância em todas as misturas, perda de espalhamento ≤ X % em 30 min.

O laboratório executa contra o plano, que mostra o progresso ("2 de 3 misturas · 10 de 18 CPs rompidos"). O traço só pode ser aprovado com o plano **completo** e os **critérios atendidos**. O engenheiro pode revisar o plano, com registro na auditoria; revisar não apaga os resultados já obtidos.

---

## 10. Engenharia — otimização granulométrica (sugestão)

- **Entrada:** granulometrias de 2 ou 3 areias (ou 2 ou 3 britas) e uma **curva-alvo**. Opções:
  - centro da zona ótima da NBR 7211 (miúdo);
  - centro da zona do graúdo;
  - Andreasen modificado, P(d) = (d^q − dmin^q)/(Dmax^q − dmin^q), com q configurável (padrão 0,37), sobre o esqueleto inteiro.
- **Método:** busca em grade com passo de 0,5 % sobre as proporções (Σ = 1, cada uma ≥ 0, limites mínimo e máximo opcionais por material), minimizando a soma dos quadrados dos desvios nas peneiras da série normal.
- **Saída:**
  - proporções sugeridas e as atuais;
  - curvas antes × depois sobre a curva-alvo e as zonas;
  - MF antes e depois;
  - impacto no traço atual (massas, volume, finos, custo R$/m³).
- O botão "Aplicar ao traço" gera uma versão em rascunho.
- Texto fixo: **"Sugestão geométrica de empacotamento; não garante desempenho. Validar em laboratório."**

---

## 11. Produção — laboratório × produzido

- **Traço aprovado para a produção:** só traços `aprovado`. Mostra a versão, o responsável e a data, com QR que identifica o traço e a versão.
- **Betonada do dia:**
  - o operador informa o volume (m³) e as umidades medidas (ou usa as últimas do laboratório, com a data e a hora);
  - o app calcula a **massa a pesar** de cada material e a **água dosada** (§6.4).
  - Layout tablet e celular, com números grandes e um material por linha.
- **Carta de produção** (impressa e na tela), com rastreabilidade:
  - traço, versão e estado, com QR;
  - **lote de cada material** (cimento, adições, aditivos e, se houver, agregados);
  - **data e hora da medição de umidade** de cada agregado e quem mediu;
  - **identificação da balança ou do dosador** de cada material (cadastro Equipamentos, com a data da última calibração e um aviso se estiver vencida);
  - massa a pesar, água dosada e a tolerância de cada material.
- **Registro de produção** (manual ou CSV da usina; a integração automática fica para depois):
  - quantidades **realmente dosadas** por material, água adicionada, aditivo, volume e horário;
  - lotes e equipamentos usados;
  - abatimento/espalhamento na saída;
  - corpos de prova moldados, que viram o **lote de produção** ligado à versão do traço e ao snapshot de materiais (§15.5).
- **Comparação planejado × dosado:** desvio por material (kg e %), água efetiva real e a/c real, consumo real de cimento, custo efetivo por m³.
- **Tolerâncias padrão (Concrefer):** cimento e água **±1 %**, agregados **±2 %**, aditivos **±3 %**.
  - Editáveis por material só pelo `admin`, rotuladas "critério interno — sujeito à verificação normativa e à capacidade metrológica da usina".
  - Desvio fora da tolerância gera um alerta no lote, com registro de quem viu e da decisão tomada.
- **Liberação de desforma por lote:** resultado do CP do lote na idade-alvo ≥ critério do produto (§9.5). O lote fica "aguardando desforma" até o resultado ser lançado.

---

## 12. Gestão tecnológica

1. **Desempenho por traço:** resultados de 28 d e das primeiras idades no tempo, com a média móvel, o fcj e o fck.
2. **Desvio-padrão real** (§6.5) por traço, família, unidade e período, com n e a regra aplicada.
3. **Comparador de eficiência** (2 ou 3 traços ou versões), lado a lado:
   - kg de cimento por MPa (aos 28 d e na idade de desforma);
   - R$/m³, R$/MPa e **R$ por m³ aprovado** (custo dividido pela fração de lotes que atendem);
   - trabalhabilidade e sua manutenção;
   - resistência nas primeiras horas;
   - consumo real × teórico.
4. **Comparativos:** entre unidades (Pederneiras, Ribeirão, Noroeste), entre cimentos e entre fornecedores de agregados (granulometria e umidade médias e sua variação).
5. **Evolução de custos** dos materiais e dos traços aprovados.

---

## 13. Gráficos (Apache ECharts 5.5.1, renderizador SVG, exportação PNG/SVG em todos)

Tema único no design system: curva principal navy, pontos vermelhos, faixas em amarelo claro e médio, séries extras em navy-2, cinza e âmbar. Vírgula decimal e unidades nos eixos. Valores ao passar o mouse ou tocar. Versão impressa.

| # | Gráfico | Ambiente |
|---|---|---|
| G1 | Curva de Abrams: pontos, os dois modelos, R², fcj e o ponto do traço | Engenharia |
| G2 | Curva de água (Lyse), com os trechos extrapolados destacados | Engenharia |
| G3 | Consumo × fck (tabela de projeto) | Engenharia |
| G4 | Granulometria das areias e da mistura, eixo log, zonas NBR 7211 | Laboratório / Engenharia |
| G5 | Granulometria das britas e da mistura, eixo log, zonas | Laboratório / Engenharia |
| G6 | Curva do esqueleto × curva-alvo | Engenharia |
| G7 | Composição: massa (100 %) e volume (L), barras empilhadas | Engenharia |
| G8 | Resistência × idade: pontos ensaiados, curva calibrada, faixa de extrapolação, linha do critério de desforma e do fcj | Laboratório |
| G9 | Relação entre os MCCs (método Alternativo) | Engenharia |
| G10 | Finos no MCC por material + critério | Engenharia |
| G11 | Manutenção da trabalhabilidade (abatimento ou espalhamento × tempo, com as faixas de classe) | Laboratório |
| G12 | Otimização: curvas antes × depois × alvo | Engenharia |
| G13 | Planejado × dosado por material | Produção / Gestão |
| G14 | Desempenho no tempo com fck, fcj e média móvel | Gestão |
| G15 | Comparador de eficiência (barras agrupadas) | Gestão |

Celular: um gráfico por cartão, largura total, legenda abaixo. Tablet em paisagem: dois por linha. Dados vazios mostram um estado vazio, nunca um gráfico quebrado.

---

## 14. Autenticação e usuários

### 14.1 Ordem de preferência (decidir na F0, registrar no relatório)

1. **Login único com o ConcreTrack/Hub** (preferencial). Se o Hub usa Supabase Auth: ponte de login (§14.2).
2. **IAM do Unificado** (se a F0 encontrar um provedor OIDC acessível): fluxo OIDC Authorization Code com PKCE.
3. **Login local** (usuário e senha no banco): só se 1 e 2 forem inviáveis.

Em todos os casos:
- os **papéis e as unidades** ficam na tabela `usuarios` desta aplicação, ligados pelo e-mail;
- existe uma **conta local de emergência** `admin`, sempre;
- a sessão da aplicação é um cookie próprio: `ct_dosagem_sessao`, `HttpOnly; Secure; SameSite=Lax`, validade de 12 h renovada no uso, 30 dias com "manter conectado".

### 14.2 Login único sem transportar token **[revisão 4.1]**

**Regra geral:** o access token do Hub **nunca aparece em URL, fragmento, log ou armazenamento** da Dosagem.

**Opção 2 (OIDC do Unificado), quando disponível:** Authorization Code + **PKCE (S256)**, `state` e `nonce`, client confidencial no servidor da Dosagem, troca do código só no back-end.

**Opção 1 (Hub com Supabase): ticket de uso único + PKCE.**
1. O app gera `code_verifier` (guardado em sessionStorage) e envia o `code_challenge` (S256) e o `estado` para `POST /api/v1/auth/hub/iniciar`. A API guarda o par (estado, challenge) por 5 min e devolve a URL da ponte.
2. O navegador vai para `https://usina.concretrack.com.br/auth/ponte-dosagem.html?estado=<estado>`. É um **arquivo novo e estático** no Hub, a única alteração permitida fora do v2. Com a sessão Supabase existente, a página faz um `fetch` **POST** para `https://dosagem.concretrack.com.br/api/v1/auth/hub/ticket`:
   - o token vai no cabeçalho `Authorization: Bearer`, e o estado no corpo;
   - **é o único endpoint com CORS**, liberado só para a origem `https://usina.concretrack.com.br`, sem credenciais de cookie.
3. A API valida o token em `GET {SUPABASE_URL}/auth/v1/user`, **descarta o token** e emite um **ticket opaco** de 256 bits:
   - uso único, validade de 60 s;
   - ligado ao estado, ao challenge e ao e-mail;
   - guardado só como hash.
4. A ponte redireciona para `https://dosagem.concretrack.com.br/auth/retorno?ticket=<ticket>&estado=<estado>`. O ticket sozinho não serve para nada.
5. A página de retorno envia `POST /api/v1/auth/hub/trocar` com o ticket, o estado e o `code_verifier`. A API confere o PKCE, consome o ticket, procura o e-mail em `usuarios` e cria a sessão.
6. E-mail sem cadastro → "acesso não liberado; peça ao administrador". Ticket expirado ou já usado → recomeça o fluxo.

Testes obrigatórios:
- ticket reutilizado → recusado;
- ticket com outro verifier → recusado;
- ticket depois de 60 s → recusado;
- chamada ao `/ticket` de outra origem → recusada pelo CORS;
- nenhum token nos logs (teste que procura o padrão JWT nos logs da homologação).

### 14.3 Regras

- Senhas (conta de emergência e login local) com argon2id e mínimo de 8 caracteres. Bloqueio de 15 min após 5 falhas. Atraso fixo nas respostas de erro.
- Gravações exigem o cabeçalho `X-Requested-With: dosagem` e a origem igual ao host.
- **Papéis:**
  - `leitor`;
  - `laboratorista` (ensaios, misturas, liberar para ensaio);
  - `producao` (betonada do dia, registro de produção);
  - `engenheiro` (aprovar, inativar, curvas, critérios);
  - `admin` (usuários, configurações, importação, excluir custo).
- **Primeiro acesso:** `provisionar.sh` cria o `admin` com uma senha provisória aleatória.
  - Ela é gravada só em `/opt/concretrack-dosagem/shared/ADMIN_SENHA_INICIAL.txt` (chmod 600, root) e mostrada uma única vez no terminal.
  - O sistema obriga a trocar no primeiro login, e então o arquivo é apagado.

---

## 15. Dados, API e aprovação

### 15.1 Modelo (resumo; tipos completos em `core/model.ts` e em `api/app/modelos.py`)

- **Material:** categoria, fornecedor, ρ seca e ρ SSS (agregados), absorção, finos, reativa/inerte (adições), teor de sólidos (aditivos), custo, condição de referência padrão e ensaios vigentes. **Cada alteração de propriedade técnica cria uma nova `MaterialVersao`** (§15.5).
- **Equipamento:** balança ou dosador, identificação, material que dosa, data da última calibração, validade.
- **Lote de material:** material, lote, data de recebimento, certificado.
- **Produto:** nome, critério de desforma (MPa, h) e classes CAA exigidas, se houver.
- **CurvaAbrams:** cimento, ensaios, pares de água, modelo padrão e versões.
- **CurvaIdade:** cimento ou traço, pontos, s, fc28, n, R².
- **Traco** e **TracoVersao:**
  - código `TR-0001`, nome, unidade, produto, tipo (convencional/CAA), método (`principal_abrams` | `alternativo_concrefer`);
  - parâmetros do método (com versão de esquema), objetivo, itens, balanço (completo/planilha);
  - resultado **calculado pelo servidor**, estado, aprovação (por, em, parecer, justificativas);
  - auditoria.
- **Mistura** (experimental): fresco, CAA, ajustes e corpos de prova.
- **ResultadoResistencia:** idade, CPs e exemplar.
- **Producao (lote de produção):** traço, versão e snapshot de materiais; data e hora; volume; umidades com hora e responsável; lotes de material; equipamentos; dosado por material; desvios; saída; CPs; estado de desforma.
- **PlanoExperimental:** misturas previstas, ensaios, idades, CPs por idade, critérios de aceitação e progresso.

### 15.2 Banco (PostgreSQL)

- Banco `concretrack_dosagem`, role `dosagem_app`, migrations com Alembic.
- Tabelas com colunas de índice + `documento jsonb` + `revisao` + auditoria: `usuarios`, `sessoes`, `auth_tickets`, `fornecedores`, `materiais`, `material_versoes`, `lotes_material`, `equipamentos`, `produtos`, `curvas_abrams`, `curvas_idade`, `ensaios`, `tracos`, `traco_versoes`, `planos_experimentais`, `misturas`, `resistencias`, `producoes`, `avaliacoes_impacto`, `custos_mcc`, `config`, `idempotencia`, `auditoria`, `importacoes`, `legado_ids`.
- **Versões aprovadas são imutáveis no banco:** um trigger recusa `UPDATE` e `DELETE` em `traco_versoes` com estado `aprovado`, exceto a mudança para `inativo`, feita por uma função dedicada.
- Toda gravação: transação + auditoria + `Idempotency-Key`. Revisão diferente → `CONFLITO_REVISAO`.

### 15.3 API

- `POST /api/v1/rpc` com `{acao, requestId, dados}` → `{ok, dados, servidorEm}` ou `{ok:false, erro:{codigo, mensagem, detalhe}}`.
- Rotas `/api/v1/auth/*` e `GET /api/v1/saude`.
- Códigos de erro: `NAO_AUTENTICADO`, `SEM_PERMISSAO`, `VALIDACAO`, `BLOQUEIO_ESTADO`, `CONFLITO_REVISAO`, `DIVERGENCIA_CALCULO`, `NAO_ENCONTRADO`, `INTERNO`.
- **Mudar para `liberado_ensaio` ou `aprovado`:**
  1. o servidor recalcula o traço inteiro com `api/app/calc` (massas, volumes, indicadores, correções);
  2. aplica os critérios da §6.6;
  3. compara com os valores enviados pelo cliente;
  4. grava **os valores do servidor**.
- Toda ação filtra por unidade e por papel.

### 15.5 Materiais congelados por versão e avaliação de impacto **[revisão 4.1]**

- **Snapshot:** ao liberar para ensaio e ao aprovar, a versão do traço grava uma cópia completa das propriedades técnicas de cada material usado: ρ, absorção, granulometria, MF, finos, sólidos, ensaio de origem e `MaterialVersao`.
  - O cálculo da versão, a carta e a impressão usam **sempre o snapshot**, nunca o cadastro atual.
  - **O registro histórico de uma versão aprovada nunca muda.**
- **Alteração de material** (nova `MaterialVersao`, por ensaio novo ou edição):
  1. o servidor encontra todas as versões `liberado_ensaio` e `aprovado` que usam o material;
  2. para cada uma, recalcula **em simulação** com as propriedades novas e cria uma **avaliação de impacto**: diferenças em massas, volume, a/c, α, finos, custo, granulometria contra as zonas e critérios afetados;
  3. classifica o impacto (padrões editáveis pela engenharia):
     - **sem impacto relevante**: |Δvolume| ≤ 2 L, |Δa/c| ≤ 0,005 e nenhum critério muda;
     - **revisão necessária**: qualquer outro caso.
  4. Avisa os engenheiros (aviso no app e item em "Aprovações pendentes").
- **Decisão do engenheiro**, registrada com parecer:
  - "manter a versão aprovada", com justificativa (a versão continua usando o snapshot antigo; a produção mostra o aviso "material diferente do aprovado: avaliado em dd/mm por X");
  - "criar nova versão", em rascunho com as propriedades novas, que segue o fluxo normal;
  - "suspender", que bloqueia o uso na produção até haver nova aprovação.
- Enquanto a avaliação estiver pendente, a **Produção** mostra o traço com a faixa "avaliação de impacto pendente". O engenheiro configura se isso bloqueia a betonada (padrão: **bloqueia** quando a classificação for "revisão necessária").
- **Rastreabilidade:** cada lote de produção guarda o traço, a versão, o snapshot e os lotes de material usados. Assim é possível responder qual composição foi usada em qual lote de postes.

### 15.4 Estados de salvamento (cliente)

`local` · `enviando` · `salvo (v3 · 20:41)` · `pendente_offline` · `falhou` · `conflito` — sempre visíveis no cabeçalho do traço.
- A outbox em IndexedDB reenvia com backoff.
- O rascunho local é salvo a cada alteração.
- O cálculo funciona offline; gravar entra na fila.

---

## 16. Infraestrutura, homologação e deploy

### 16.1 Portão da VPS (F5)

Medir por 10 min (amostra a cada 30 s), **somente leitura**:
- load average de 1, 5 e 15 min;
- vCPUs, RAM disponível, swap usada, disco livre, iowait;
- os 10 processos que mais consomem.

**Reprova o portão se** (limites em Configurações do deploy):
- load15 médio > 2 × vCPUs; **ou**
- RAM disponível < 400 MB; **ou**
- swap > 50 %; **ou**
- disco livre < 3 GB; **ou**
- **não existe um PostgreSQL utilizável** (o Ricardo cria o banco com `preparar-vps.sh`; o Codex não instala nada); **ou**
- algum site existente não responde com o mesmo código HTTP do início da F0.

Com o portão reprovado:
- **não há deploy em produção**;
- o relatório traz a medição, os processos responsáveis, a recomendação (VPS própria para a Dosagem com 2 vCPU/4 GB, ou correção do que sobrecarrega a VPS antiga) e o pacote pronto para implantar em qualquer servidor com `provisionar.sh` + `deploy.sh`.

### 16.2 Homologação local isolada (F4)

- `docker-compose.hml.yml` com nginx, api e postgres:16, nas mesmas versões e configurações de produção.
- Roda o E2E completo (§17.3) contra ela, além do teste de backup/restauração e de migração do zero e incremental.
- **Nada da F6 roda sem a F4 verde.**

### 16.3 Estrutura e serviço na VPS

```text
/opt/concretrack-dosagem/   dono ctdosagem (usuário de sistema, sem shell)
  releases/<ts>/{web,api}   current -> releases/<última>   shared/.env (600)   backups/
/etc/systemd/system/concretrack-dosagem-api.service
/etc/systemd/system/concretrack-dosagem-backup.{service,timer}     (diário 03:15, retenção 14 dias)
/etc/nginx/sites-available/dosagem.concretrack.com.br.conf
```

- **systemd (API):** `User=ctdosagem`, Uvicorn com **1 worker** em `127.0.0.1:<porta livre 18300–18399>`, `Restart=on-failure`, `NoNewPrivileges=true`, `ProtectSystem=full`, **`CPUQuota=50%`**, **`MemoryMax=600M`**, `Nice=10`.
- **systemd (backup e tarefas):** `CPUQuota=25%`, `MemoryMax=300M`, `Nice=19`, `IOSchedulingClass=idle`.
- **Deploy:** os scripts rodam com `nice -n 19 ionice -c3`. Não há compilação nem `npm` na VPS (§3, 5a).
- **PostgreSQL (somente o cluster já existente; nada é instalado):**
  - banco e role criados pelo `preparar-vps.sh` do Ricardo;
  - role com `CONNECTION LIMIT 10`, `statement_timeout = 15s`, `lock_timeout = 5s`, `idle_in_transaction_session_timeout = 60s`, `work_mem = 8MB`, `maintenance_work_mem = 64MB` (todos via `ALTER ROLE … SET`, sem mexer na configuração global);
  - pool da aplicação com no máximo 5 conexões;
  - **monitoramento separado:** um timer a cada 5 min grava em `/opt/concretrack-dosagem/shared/monitor.log` as conexões, as consultas lentas (> 2 s, via `pg_stat_activity` da própria role) e o tamanho do banco. A página Configurações › Saúde (admin) mostra esses dados.
- **nginx:**
  - SPA com `try_files $uri /index.html`;
  - `/api/` com proxy para 127.0.0.1;
  - cache longo em `/assets/`, sem cache para `index.html` e para o service worker;
  - `client_max_body_size 20m`;
  - cabeçalhos de segurança (CSP restrita ao próprio domínio, ao Google Fonts e ao Supabase do Hub, se for o caso);
  - logs próprios.
- **TLS:** `certbot certonly --webroot -d dosagem.concretrack.com.br`. Sem DNS apontado, fica só o HTTP com o desafio, o teste é feito por túnel SSH e o comando final vai para o relatório.

### 16.4 Deploy em produção (F6)

Todos os comandos rodam como `deploy-dosagem` (sudo só para a lista branca do `preparar-vps.sh`).

1. `provisionar.sh` (idempotente): pastas da release, `.env` (gera o `SESSION_SECRET`; a senha do banco já está lá, criada pelo `preparar-vps.sh`), units, timer e site nginx, todos instalados pelo **wrapper autorizado** `/usr/local/sbin/ctdosagem-instalar`; depois `nginx -t` e `reload`; e o usuário admin (§14.3).
2. `deploy.sh`, com os **artefatos já construídos** fora da VPS:
   1. envio para `releases/<ts>`;
   2. `.venv` com `pip install --no-index` a partir das wheels;
   3. `pg_dump` pré-migração (guardado, **nunca restaurado automaticamente**);
   4. `alembic upgrade head`, só com migrações aditivas (§16.5);
   5. troca atômica de `current`;
   6. restart **só** deste serviço;
   7. checagem de `/api/v1/saude` e da página.
3. Smoke test E2E contra a URL real (ou o túnel):
   - login;
   - um traço por método com os dados P1b e A1, conferindo os valores;
   - salvar, recarregar, imprimir;
   - remover os dados de teste.
4. Conferir os códigos HTTP dos outros sites e o load da VPS 5 min depois.
5. **Qualquer falha → `rollback.sh` automático, que só mexe no CÓDIGO:** volta o `current` para a release anterior e reinicia o serviço.
   - **O banco não é restaurado.** Como as migrações são só aditivas, a release anterior funciona sobre o esquema novo.
   - O relatório registra a falha, o dump pré-migração disponível e o procedimento manual da §16.5.

### 16.5 Migrações e recuperação de dados **[revisão 4.1]**

- **Migrações só aditivas (expand) nesta rodada e em todo deploy automático:** criar tabela, coluna anulável ou com padrão, índice (`CONCURRENTLY`), view, função e trigger novos.
- **Proibidas no deploy automático:** `DROP`, `RENAME`, `ALTER COLUMN … TYPE`, `SET NOT NULL` em coluna existente, `DELETE`/`UPDATE` em massa e `TRUNCATE`.
- **Verificador de migrações** (`deploy/scripts/verificar-migracoes.py`): analisa o SQL gerado pelo Alembic (`alembic upgrade --sql`) e **reprova** a F2 e a F6 se encontrar operação proibida.
  - Mudanças destrutivas (contract) só em uma rodada futura, com o procedimento manual e a aprovação do Ricardo.
- **Compatibilidade:** a release N−1 do código precisa funcionar sobre o esquema N. Isso é testado na F4: o código anterior roda sobre o banco migrado.
- **Recuperação de dados é um procedimento controlado, nunca automático**, documentado em `docs/dosagem-v2/RUNBOOK-RECUPERACAO.md`:
  1. congelar as gravações (modo manutenção somente leitura);
  2. restaurar o dump num **banco temporário**;
  3. comparar com o banco atual e listar os registros criados ou alterados depois do dump;
  4. decisão do Ricardo;
  5. aplicar a correção registro a registro ou restaurar por inteiro, só com aprovação explícita;
  6. registrar tudo na auditoria.
  - O `restaurar-backup.sh` existe, mas exige o parâmetro `--confirmo-perda-de-dados-apos <data/hora>` e não roda dentro do `deploy.sh`.

---

## 17. Testes com números esperados (`shared/golden/*.json`, obrigatórios em TS **e** Python)

**Tolerâncias:** ±0,05 em L e kg, ±0,001 em índices, ±0,01 em MPa, salvo indicação. Todos os valores foram calculados de forma independente.

### P1 — Principal, modo planilha (aba "Dosagem ")

**Entradas:**
- ar 0,03; água 189; aglomerante 321, F = 0 (ρc 3,05);
- Targ 0,48;
- areias 0,2 / 0,8 em massa (ρ 2,63 / 2,68);
- britas 0,3 / 0,7 (ρ 2,69 / 2,69);
- aditivos 0,75 % (ρ 1,08), 0,40 % (1,10), 0,30 % (1,00);
- adições menores 1,0 % (3,00) e fibra 0,187 % (0,91);
- fck 30, sd 5.

**Esperado:**
- Vsól 781,0; Vareias 269,634; Vbritas 406,12;
- areias 143,976 / 575,906; britas 327,739 / 764,724;
- a/c 0,5888; α 0,4879; fcj 38,25;
- volume sem os menores 1000,0 L; **fora do balanço 6,089 L**;
- o traço **não pode ser aprovado** neste modo.

### P1b — Principal, balanço completo (mesmas entradas)

**Esperado:**
- V_menores **6,089 L**; Vsól **774,911**;
- areias **142,416 / 569,663**; britas **325,184 / 758,762**;
- volume total **1000,0 L**; α **0,4880**.

### P2 — Curva de Abrams ("AJUSTE DE ÁGUA", linhas 5–9)

**Pares (a/c, R28):** (1,000; 18,5) (0,864; 24,0) (0,760; 28,1) (0,633; 36,1) (0,543; 43,0)

**Esperado:**
- potência A **19,0964**, B **−1,36482**, R²(ln) 0,99406;
- exponencial k1 **115,172**, k2 **6,23232**, R²(ln) 0,99857.

**Tabela de projeto** (água pelos pares (1,0; 195) e (0,864…0,543; 190); sd conforme a linha):

| fck | sd | fcj | a/c | água | cimento | |
|---|---|---|---|---|---|---|
| 15 | 2,55 | 19,2075 | 0,9958 | 194 | 195 | sd < 4 só com sd calculado (n ≥ 20) |
| 20 | 2,85 | 24,7025 | 0,8281 | 190 | 230 | idem |
| 25 | 3,15 | 30,1975 | 0,7148 | 190 | 266 | idem |
| 30 | 4,0 | 36,60 | 0,6209 | 190 | 307 | |
| 35 | 4,0 | 41,60 | 0,5653 | 190 | 337 | |
| 40 | 5,0 | 48,25 | 0,5071 | 190 | **375** | **extrapolação** da água e da curva (a planilha tinha 195 digitado → 385) |

### P3 — Ajuste na betoneira (P1 em modo planilha, betonada 25 L, h = 0)

**Acréscimos:** cimento +0,5 kg, areia 2 +0,4 kg, água +0,3 kg.

**Esperado:**
- unit: 0,42222 / 1,73579 / 0,96111 / 2,24259 / água 0,58944;
- **Agl_corr 332,59**;
- massas 140,43 / 577,31 / 319,66 / 745,86 / água 196,04.

### P3b — Ajuste na betoneira em balanço completo (P1b, betonada 25 L, h = 0, aditivos sem acréscimo) **[novo na 4.1]**

**Acréscimos:** os mesmos do P3 (cimento +0,5 kg, areia 2 +0,4 kg, água +0,3 kg). Aditivos e menores ficam com a massa da betonada (8,025 kg de aglomerante × %), então a dosagem real por kg de aglomerante cai.

**Esperado (tolerância ±0,01):**
- **Agl_corr 332,590**;
- massas 138,903 / 571,219 / 317,164 / 740,049, água 196,043;
- aditivos corrigidos 2,348 / 1,252 / 0,939 kg/m³;
- V_menores corrigido **5,939 L** (era 6,089);
- volume 1000,0 L.

**Detecção do erro anterior:** com o V_menores fixo em 6,089 L, o resultado seria 332,538. O teste precisa **reprovar** essa implementação.

### P5 — Principal com metacaulim (balanço completo; P1b com F = 0,08 e ρad 2,55)

**Esperado:**
- C **295,32**; Ad **25,68**; Vareias **265,060**;
- areias **141,534 / 566,137**; britas 325,184 / 758,762;
- **a/c 0,6400**; **a/agl 0,5888**; α 0,4869;
- volume 1000,0 L.

**Teste do v_agl:** ajuste na betoneira **sem acréscimos** deve devolver Agl_corr = **321,00**. A média aritmética da planilha daria 321,08, e o teste precisa detectar essa diferença.

### P6 — Umidade e absorção (massas do A1 em SSS)

**Entradas:** areia 1 156 (h 11 %, a 1,0 %), areia 2 632 (h 10 %, a 0,8 %), brita 0 1037 (h 0,5 %, a 0,5 %), água efetiva 200.

**Esperado:**
- secas 154,455 / 626,984 / 1031,841;
- **a pesar 171,446 / 689,683 / 1037,000**;
- água livre dos agregados 73,128;
- **água dosada 126,872**.

Para conferência:
- modo planilha (m·(1 + h − a)): 171,60 / 690,14 / 1037,00 e água 126,256;
- referência "seca": a pesar 173,16 / 695,20 / 1042,185 e água 126,256.

Identidade obrigatória: água efetiva (200) = água dosada (126,872) + água livre (73,128) + água dos aditivos (0).

### P7 — Aditivo com água, sem dupla contagem (P1b com o aditivo 1 de teor de sólidos 0,30) **[novo na 4.1]**

**Entradas:** P1b, com o aditivo 1 = 2,4075 kg (ρ 1,08) e **sólidos 0,30**. Os aditivos 2 e 3 ficam sem teor de sólidos. Água efetiva 189.

**Esperado:**
- água do aditivo 1 **1,685 kg**; água líquida **187,315 L**;
- V_menores 6,089 L (volume integral dos aditivos e menores);
- Vsól **776,596**; Vareias **267,520**; Vbritas **403,830**;
- areias **142,848 / 571,391**; britas **325,891 / 760,412**;
- **volume físico 1000,0 L**;
- **a/c 0,5888** (com a água efetiva de 189, que já inclui a do aditivo);
- identidade: 189 = 187,315 + 1,685.

**Detecção do erro de dupla contagem:** somar a água efetiva (189) com o volume integral dos aditivos dá 1001,685 L. O teste de volume precisa **reprovar** essa implementação.

### A1 — Alternativo (aba "1.0 - TRAÇO ALTERNATIVO", modo planilha, a = 0)

**Esperado:**
- C **351**; Vbritas 370,5; brita 0 **1037**;
- Vfixos 683,949; Vareias 296,051; areias **156 / 632**;
- aditivo **2,176**;
- massa 2378,18; volume 999,97 L;
- a/agl 0,5698; α **0,5234**; miúdo/agregados 43,18 %; teor de água 9,19 %;
- **finos 385,23**.

**Betonada de 1000 L corrigida:** 173,16 / 695,20 / 1042,185, água **114,455**, aditivo 2176 g = **1996,33 mL**.

**Fresco** (recipiente de 1,00 kg, conjunto 4,69 kg):
- ρ 2,3491; rendimento **1,01144**;
- consumo real 347,03; **ar 3,11 %**.

### A2 — Bloqueio de frações (aba "R10 (2)")

Miúdo 0,868 → erro "frações do miúdo somam 86,8 %". Sem bloqueio, o volume seria 960,5 L.

### A3 — Traço de referência (bloco AI da aba 1.0)

**Massas:** 360 (3,09) / filler 0 / 156 (2,63) / 630 (2,65) / 1042 (2,99) / aditivo 2,2 (1,0) / água 190.

**Esperado:**
- miúdo 0,200 / 0,800; brita 0 **1,000** (planilha: 0,994);
- α 0,5238; a/c 0,5278; aditivo 0,611 %.

### I1 — Curva de idade (aba "Dosagem ", maiores CPs)

**Pontos:** (3; 15,0) (7; 28,0) (14; 36,1) (28; 42,8).

**Esperado:**
- **fc28 44,296**, **s 0,51323**, R²(ln) 0,99209;
- estimativas 12 h 1,59 · 18 h 3,22 · 24 h 4,90 MPa, **todas marcadas "extrapolação"**;
- tempo estimado para 15 MPa: **2,895 d (69,5 h)**.

### O1 — Otimização das areias (aba "Dosagem ", % retida das duas areias)

**Entradas:**
- areia 1 ret. 0,4 / 0,7 / 2 / 8,3 / 23,8 / 30,7 / 24,5 (6,3 → 0,15 mm);
- areia 2 ret. 0 / 2,9 / 16,6 / 14,1 / 17,8 / 23,4 / 14,5;
- alvo = centro da zona ótima (0 / 2,5 / 15 / 25 / 45 / 75 / 92,5).

**Esperado (grade com passo de 0,1 %):**
- proporção ótima **areia 1 = 33,5 %**; soma dos quadrados 21,486;
- atual (20 %): 41,588;
- MF 2,586 → **2,499**.

O teste roda com passo de 0,1 %; o padrão do app é 0,5 %.

### N1 — Normas

- C35 com a condição B → condição **indisponível**; C20 com a B → disponível; C20 com a C → indisponível.
- sd com 19 resultados → usa o sd da condição.
- sd com 20 resultados consecutivos **em 30 dias**, de sd 1,6 → usa **2,0**.
- sd com 20 resultados em 31 dias → **não** vale como normativo; usa o sd da condição.
- a/c 0,58 em classe III → bloqueio na aprovação.

### R1 — Regressão de ajustes (§9.4) **[novo na 4.1]**

- 3 ajustes → só histórico, sem recomendação.
- 8 ajustes com Δágua e Δaditivo de correlação 0,9 → **sem recomendação** ("água e aditivo variaram juntos").
- 8 ajustes com fatores independentes (correlação < 0,7) e R² ajustado ≥ 0,6 → recomendação com IC de 95 %.

### S1 — Snapshot e impacto (§15.5) **[novo na 4.1]**

- Aprovar o traço A1. Depois, alterar a ρ da areia 2 de 2,67 para 2,60.
- **Esperado:**
  - a versão aprovada continua com as massas 156 / 632 e a carta igual;
  - é criada uma avaliação de impacto "revisão necessária", porque o volume muda mais de 2 L;
  - a produção mostra a faixa de avaliação pendente e bloqueia a betonada;
  - um `UPDATE` direto no banco sobre a versão aprovada é recusado pelo trigger.

### D1 — Deploy seguro **[novo na 4.1]**

- O verificador reprova uma migração de teste com `DROP COLUMN`.
- O rollback de teste (falha simulada no smoke) volta só o código: os dados gravados depois da migração continuam no banco.
- A release N−1 funciona sobre o esquema N.

### X1 — Consistência

Para cada traço de teste, os valores são idênticos no painel, no comparador, na carta, na impressão e na resposta do servidor.

### 17.1 Unitários e integração

- **Vitest e pytest:** todos os casos acima, mais:
  - casos-limite (vazio, zero, negativo, ρ = 0, frações > 1);
  - `parseNumero`;
  - os dois modelos de Abrams;
  - Lyse dentro e fora do intervalo;
  - CAA (classes);
  - critérios de estado da §6.6.
- **pytest:**
  - autenticação (ticket de uso único + PKCE e os testes da §14.2, OIDC se for o caso, local, bloqueio, sessão expirada);
  - snapshot de materiais e trigger de imutabilidade (S1);
  - plano experimental: a aprovação é recusada com o plano incompleto ou um critério falho;
  - permissões por papel em chamada direta;
  - idempotência, conflito, `DIVERGENCIA_CALCULO`;
  - importação (simulação não grava; a efetiva não duplica).

### 17.2 Importadores (fixtures = planilhas da pasta `referencia/`)

- **Rica v4:** abas → traços do método Alternativo, em rascunho.
  - Aparece o aviso de volume para as abas R10, FILLER V2, MARCOS e TESTE AGREGADO V2.
  - As resistências 25,3 / 29,9 copiadas do modelo não são importadas (aviso "valor de modelo").
  - "Planilha5" é ignorada.
- **Udemy:** a aba "Dosagem " vira traço do método Principal, com resultados. "Em andamento" vira mistura experimental (aviso: volume de 1.025 L).
- **Curva de Abrams:** os blocos de "AJUSTE DE ÁGUA" viram curvas. A curva sem R28 fica "incompleta".
- **Legado:** JSON exportado e planilhas do Apps Script exportadas (.xlsx/.csv), com simulação primeiro.

### 17.3 E2E (Playwright: 1440×900, 820×1180, 1180×820, 390×844)

1. Login (ponte ou local).
2. Curva de Abrams com o P2 (G1–G3).
3. Traço Principal até a carta (P1b).
4. Traço Alternativo até a carta (A1).
5. Modo CAA com manutenção.
6. Resistências por idade (I1) e critério de desforma.
7. Otimização (O1) e "aplicar ao traço".
8. Produção: betonada do dia (P6) e registro do dosado.
9. Comparador de eficiência.
10. Aprovação bloqueada e liberada.
11. Offline e reconexão.
12. Conflito.
13. `axe` sem violações sérias.
14. Screenshots de todas as telas em `tests/e2e/__screenshots__/`.

---

## 18. Interface

### 18.1 Navegação pelos quatro ambientes

- **Sidebar (desktop):** grupos Engenharia · Laboratório · Produção · Gestão · Configurações. Os itens dependem do papel.
- **Tablet:** trilho de 76 px.
- **Celular:** tab bar Início · Traços · **(+)** · Laboratório · Mais. O papel `producao` tem a tab bar Produção · Betonada · Registro · Mais.
- **Início por papel:**
  - engenheiro: aprovações pendentes, desempenho e alertas;
  - laboratorista: misturas e rompimentos do dia, ensaios vencidos;
  - produção: traços aprovados e betonada do dia;
  - todos: "continuar de onde parou".

### 18.2 Percurso do traço (Engenharia)

**Objetivo → Materiais → Proporções → Validação → Carta**

| Etapa | Conteúdo |
|---|---|
| Objetivo | Tipo (convencional/CAA), produto, fck, condição de preparo filtrada, sd (calculado ou da condição), fcj, classe de agressividade, abatimento ou classes CAA, Dmáx, aplicação |
| Materiais | Do cadastro, com ensaios vigentes, condição de referência, h e a |
| Proporções | Seletor de método (Principal/Alternativo), entradas do método, balanço (completo/planilha), tabela de materiais, painel lateral de resultado e gráficos |
| Validação | Pendências por estado, misturas, ajustes, ajuste na betoneira, fresco, CAA, resistências por idade, comparação com a versão anterior |
| Carta | Prévia de impressão com traço seco, traço de obra (massa a pesar, água dosada), betonada, indicadores, estado, QR e aprovação |

### 18.3 Layouts e design system

Seguem os mockups (`docs/dosagem-v2/mockups/`) e as regras abaixo, que valem integralmente:

- **Tokens:** navy `#0A1530` / `#0E1F45`, vermelho `#DB0A40` **só para ação primária e item ativo** (texto sempre branco), amarelo `#FFC906` **nunca como texto sobre branco**. Estados: ok `#0B6B3A`, aviso `#7A4800`, crítico `#9F1239`, **sempre com ícone e palavra**.
- **Tipografia:** Inter com números tabulares; inputs de 44 px (desktop) e 48 px (tablet e celular); `inputmode="decimal"` nos campos numéricos.
- **Valor digitado** tem borda; **valor calculado** tem fundo cinza.
- **Acessibilidade:** `label` associado em todo controle, foco visível, operação completa por teclado no desktop, `aria-live` nos erros, contraste de 4,5:1.
- **Desktop:** sidebar de 252 px, recolhível. **Tablet retrato:** faixa de resultado fixa acima da barra de ações. **Celular:** uma etapa por tela, cartões no lugar de tabelas, KPIs fixos no topo.

---

## 19. Entregáveis e critérios de aceite

**Entregáveis:**
1. Código em `dosagem-concreto-v2/` (web, api, shared, deploy), com README.
2. Aplicação em `https://dosagem.concretrack.com.br`, ou portão reprovado e pacote pronto, com a explicação.
3. Documentos em `docs/dosagem-v2/`:
   - `00-RECONHECIMENTO.md` e `VPS-RECONHECIMENTO.md` (com a medição da F5);
   - `FORMULAS.md` (cada fórmula com a célula de origem e a lista de [CORREÇÃO]);
   - `API.md`;
   - `PARIDADE.md` (funções do legado → onde estão no v2);
   - `RELATORIO-EXECUCAO.md` (por fase: feito, decisões, portões, resultados dos testes, pendências e **checklist manual por ambiente e por tamanho de tela**).
4. Especificações antigas arquivadas em `docs/dosagem-v2/arquivado/`.

**Critérios de aceite:**
- [ ] F1: todos os casos da §17 passando em TS e Python, com paridade entre os núcleos.
- [ ] Os dois métodos, o modo CAA, as idades, a otimização, a produção e a gestão funcionando nos três layouts.
- [ ] Aprovação só com o recálculo do servidor e os critérios da §6.6.
- [ ] Nenhum "salvo" sem confirmação do servidor.
- [ ] Login conforme a §14 e conta de emergência ativa.
- [ ] F4 verde antes de qualquer deploy. F5 medido e registrado.
- [ ] Serviço com CPUQuota e MemoryMax; backup e tarefas com limites; role do PostgreSQL com timeouts e limites. Outros sites com o mesmo código HTTP.
- [ ] Rollback só de código testado (D1). Nenhuma restauração automática de banco. Verificador de migrações ativo.
- [ ] Snapshot de materiais, avaliação de impacto e trigger de imutabilidade funcionando (S1).
- [ ] Aprovação só com o plano experimental completo e atendido.
- [ ] Login sem token em URL ou log (§14.2).
- [ ] Todo acesso à VPS feito como `deploy-dosagem`, sem root; nenhum pacote instalado e nada compilado na VPS.
- [ ] Backup diário ativo e restauração testada **em banco temporário**.
- [ ] Nenhuma credencial em arquivo versionado.

---

## 20. Passos do Ricardo

**Antes de rodar o Codex (uma vez, como root na VPS):**
1. Trocar a senha de root da VPS antiga.
2. Copiar `deploy/preparar-vps.sh` (vem no pacote, em `docs/dosagem-v2/deploy/`) para a VPS. Ler o script e rodar:
   - primeiro `sudo bash preparar-vps.sh --simular`, que mostra tudo o que faria sem alterar nada;
   - depois `sudo bash preparar-vps.sh`.

   O script:
   - **não instala pacotes e não reinicia nada**;
   - para, sem alterar nada, se não houver PostgreSQL ou nginx;
   - cria os usuários `deploy-dosagem` e `ctdosagem`, a pasta `/opt/concretrack-dosagem`, o banco e a role com limites e a senha aleatória no `.env`;
   - cria o wrapper de instalação e a lista branca do sudo.
3. Colocar a **chave pública** do Codex em `/home/deploy-dosagem/.ssh/authorized_keys`. O script indica o comando. Configurar no Codex o alias `vps-antiga` → `deploy-dosagem@31.97.241.84` com a chave privada, que fica só no ambiente do Codex.
4. No DNS, criar o registro **A** `dosagem` → `31.97.241.84`.
5. Se quiser o login com a conta ConcreTrack, deixar no ambiente do Codex o acesso ao repositório do Hub, para a ponte da §14.2.

**Depois:**
1. Entrar como `admin` (senha provisória mostrada pelo Codex) e trocar a senha.
2. Cadastrar os usuários e os papéis.
3. Cadastrar os produtos e os critérios de desforma.
4. Conferir as tabelas da §6.5 e a tabela preliminar de idades com a engenharia.
5. Importar: Curva de Abrams → Rica v4 → Udemy → legado, sempre com a simulação primeiro.
6. Testar com o checklist do relatório.
