# Plano de unificação PCP Concrefer + Mapa de Concretagem

**Fase 0 — levantamento e decisão.** Data: 02/10/2026. Branch: `feat/sistema-unificado`. Tag de retorno: `pre-unificacao-20261002` no commit `0b029f5b`. Nenhuma tela do sistema unificado foi implementada, nenhum serviço foi alterado e nenhum dado de produção foi gravado.

## 1. Objetivo e limites

Criar `https://pcp.concretrack.com.br/unificado/` em paralelo aos endereços atuais, com casca e login visual únicos e **duas sessões independentes**. Os sistemas antigos permanecem acessíveis. Esta fase entrega somente o plano; a implementação depende de resolver os impedimentos da seção 7.

As fontes lidas foram `docs/panorama-visual-mapa-concretagem.md`, `docs/panorama-visual-pcp-concretrack.md`, `preview-unificado/LOGIN-PCP-MAPA.md`, a pasta `preview-unificado/`, as cópias locais do Mapa e do frontend PCP em `.work-pcp-report/`, e páginas públicas do PCP. Nenhuma consulta à tabela `usuarios` nem login real foi feita.

### Estado do Git antes desta fase

As alterações de código e documentação pendentes foram preservadas em quatro commits locais (`38872ee9`, `14ce90fc`, `016f373b`, `0b029f5b`). `mapa-concretagem/` e `mapa-concretagem-teste/` estão limpos. Permanecem fora dos commits arquivos gerados e temporários, inclusive perfis de navegador, logs, `__pycache__`, relatórios e cópias de trabalho. Eles **não** devem ser adicionados em massa ao Git. A condição literal de `git status` mostrar somente `unificado/`, `scripts/bump_unificado.py` e `docs/` ainda não é atendida no diretório atual; a conferência de cada fase precisará distinguir o diff rastreado da sujeira preexistente ou usar uma área de trabalho limpa autorizada.

## 2. Mapa de rotas proposto

As novas rotas abaixo são um **contrato proposto**, ainda inexistente. O prefixo `/unificado/` será servido na origem do PCP. As rotas antigas não mudam.

### Casca e autenticação

| Destino | Rota proposta |
|---|---|
| Início | `/unificado/` ou `/unificado/index.html` |
| Login único visual | `/unificado/login.html` |
| Primeiro acesso PCP | `/unificado/primeiro-acesso/` |
| Mapa copiado, tela Início | `/unificado/mapa/index.html` |

### PCP

| Tela atual em `pcp.concretrack.com.br` | Nova cópia |
|---|---|
| `/pages/dashboard/` | `/unificado/pcp/dashboard/` |
| `/pages/comparacao/` | `/unificado/pcp/comparacao/` |
| `/pages/producao/` | `/unificado/pcp/producao/` |
| `/pages/maodeobra/` | `/unificado/pcp/maodeobra/` |
| `/pages/maodeobra-rateio/` (oculta) | `/unificado/pcp/maodeobra-rateio/` (continua oculta) |
| `/pages/apontamento-mega/` | `/unificado/pcp/apontamento-mega/` |
| `/pages/programacao-alex/` (Setor 1 e 2) | `/unificado/pcp/programacao-alex/` |
| `/pages/programacao/` (Setor 3 e 4) | `/unificado/pcp/programacao/` |
| `/pages/programacao-circular-s3/` | `/unificado/pcp/programacao-circular-s3/` |
| `/pages/programacao-circular-s4/` (DT S4) | `/unificado/pcp/programacao-circular-s4/` |
| `/pages/programacao-final/` | `/unificado/pcp/programacao-final/` |
| `/pages/teste-programacao/` (ADMIN) | `/unificado/pcp/teste-programacao/` |
| `/pages/relatorio-producao/` (S1/2) | `/unificado/pcp/relatorio-producao/` |
| `/pages/relatorio-programacao-s3/` | `/unificado/pcp/relatorio-programacao-s3/` |
| `/pages/relatorio-programacao-s4/` | `/unificado/pcp/relatorio-programacao-s4/` |
| `/pages/etiquetas/` | `/unificado/pcp/etiquetas/` |
| `/pages/etiquetas-sc/` | `/unificado/pcp/etiquetas-sc/` |
| `/pages/etiquetas-armaduras/` | `/unificado/pcp/etiquetas-armaduras/` |
| `/pages/pcp-diario/` | `/unificado/pcp/pcp-diario/` |
| `/pages/acompanhamento-mensal/` | `/unificado/pcp/acompanhamento-mensal/` |
| `/pages/acompanhamento-mensal-setor-34/` | `/unificado/pcp/acompanhamento-mensal-setor-34/` |
| `/pages/usuarios/` | `/unificado/pcp/usuarios/` |
| `/pages/formas-por-setor/` (isolada) | `/unificado/pcp/formas-por-setor/` |

`/pages/login.html` é substituída **apenas na cópia** por `/unificado/login.html`; `/pages/primeiro-acesso/` por `/unificado/primeiro-acesso/`. O PCP usa links e caminhos absolutos `/pages/` e `/static/` em HTML/JS: **copiar arquivos não basta**. A reescrita das referências nas cópias terá de ser inventariada por tela, mantendo `/api/` na raiz da origem. `guia-pcp.html`, `relatorio_completo_*.html`, `msgbox.*` e backups `.bak` ficam fora conforme o pedido.

### Mapa

O Mapa atual é uma única página em `https://usina.concretrack.com.br/mapa-concretagem/index.html`; os botões chamam `setMode()` e **não há rota direta para cada tela**. Proposta para o novo sistema: `/unificado/mapa/?tela=<MODO>`, interpretada pela ponte `unificado-bridge.js` somente após a sessão local estar disponível. A ponte chamaria o `setMode()` existente, preservando seu bloqueio por perfil. Sem sessão ou sem permissão, o destino é Início.

| Tela | Modo existente | Rota proposta |
|---|---|---|
| Início | `HUB` | `/unificado/mapa/` |
| Produção / Liberação | `LIBERACAO` | `/unificado/mapa/?tela=LIBERACAO` |
| Setores 1–4 | `LIBERACAO_S1` a `LIBERACAO_S4` | `/unificado/mapa/?tela=LIBERACAO_S1` a `S4` |
| Mandril Circular | `MANDRIL_CIRCULAR` | `/unificado/mapa/?tela=MANDRIL_CIRCULAR` |
| Inspeção | `INSPECAO` | `/unificado/mapa/?tela=INSPECAO` |
| Montagem Postes | `MONTAGEM_POSTES` | `/unificado/mapa/?tela=MONTAGEM_POSTES` |
| Sequência S3 | `SEQUENCIA_S3` | `/unificado/mapa/?tela=SEQUENCIA_S3` |
| Relatório Enc. Produção | `RELATORIO` | `/unificado/mapa/?tela=RELATORIO` |
| Histórico | `HISTORICO` | `/unificado/mapa/?tela=HISTORICO` |
| Acmp. Concretagem | `ACMP_CONCRETAGEM` | `/unificado/mapa/?tela=ACMP_CONCRETAGEM` |
| Manutenção Formas | `RELATORIO_MANUTENCAO` | `/unificado/mapa/?tela=RELATORIO_MANUTENCAO` |
| Tratativa Defeitos | `TRATATIVA_DEFEITOS` | `/unificado/mapa/?tela=TRATATIVA_DEFEITOS` |
| Dashboard Montagem | `MONTAGEM_INDICADORES` | `/unificado/mapa/?tela=MONTAGEM_INDICADORES` |
| Dashboard Defeitos | `DASHBOARD_DEFEITOS` | `/unificado/mapa/?tela=DASHBOARD_DEFEITOS` |
| Produtividade | `PROD_ANALISE` | `/unificado/mapa/?tela=PROD_ANALISE` |
| Usuários | `USUARIOS` | `/unificado/mapa/?tela=USUARIOS` |

Detalhes de Inspeção e Montagem são estados internos abertos a partir das respectivas listas. Não se propõe URL direta para eles nesta fase. O modo `DASHBOARD` legado é remapeado pelo próprio `setMode()` para `PROD_ANALISE`.

## 3. Armazenamento no navegador e cache

### Chaves conhecidas

| Sistema | Chaves / prefixos verificados no código | Uso |
|---|---|---|
| PCP | `pcp_token`, `pcp_user` | Autenticação e perfil |
| PCP | `pcp_sidebar_hidden` | Preferência visual |
| Prévia | `preview_unificado_modulo` | Módulo escolhido; não deve ser reutilizada sem decisão |
| Mapa | `pwa_mapa_auth_session_v1` | Sessão própria sem token |
| Mapa | `pwa_liberacao_inspecao_v1`, `pwa_liberacao_submit_locks_v1`, `pwa_formas_clicadas_hoje` | Cache e controle local de apontamentos |
| Mapa | `pwa_montagem_postes_v1`, `pwa_prog_s3_s4_v1`, `mapa_concretagem_programacao` | Montagem/programação locais |
| Mapa | `mapa_formas_manutencao_v1`, `mapa_tratativa_defeitos_v1`, `pwa_acmp_notas_v1` | Manutenção, defeitos e notas |
| Mapa | `pwa_mandril_modelos_produzidos_v1`, `pwa_saque_mandril_v1`, `pwa_saque_mandril_db_migrated_v1/v2` | Mandril e migração local |
| Mapa | `mapa_concretagem_report_cache_v1:<chave>`, `mapa_dashboard_filtros_<tipo>_v1` | Cache de relatórios e filtros |
| Mapa | `sidebarCollapsed` | Preferência visual genérica |

O levantamento cobre as chamadas explícitas de `localStorage` no `app.js` do Mapa e no JS global do PCP. **Antes da Fase 2, procurar novamente em todos os scripts de cada página copiada**, pois há JS inline e por tela. O helper do Hub pode criar chaves adicionais de Supabase Auth se permanecer carregado.

### Risco de mesma origem

`localStorage` e CacheStorage são isolados por **origem, não por pasta**. Em `/unificado/`, `pcp_token` e `pcp_user` serão os mesmos do PCP antigo no mesmo domínio: login ou logout em um afetará a sessão local do outro. Isso preserva os nomes pedidos, mas precisa ser aceito como comportamento. As chaves do Mapa antigo, em `usina.concretrack.com.br`, **não** acompanham o usuário para a nova origem; no novo domínio serão criadas novas sessões e caches. As chaves de nomes diferentes não colidem diretamente, mas operações amplas como `localStorage.clear()` ou exclusão de caches por prefixo genérico poderiam afetar módulos vizinhos; não usá-las.

### Service workers e HTTP cache

- O Mapa teste registra `./sw.js?v=v5.31` e seu SW usa `CACHE_NAME` baseado no caminho. Copiado para `/unificado/mapa/`, o identificador atual cairia no nome de produção (`mapa-concretagem-v5.31`), não em um nome próprio. A cópia do SW deve usar prefixo `unificado-mapa-` e apagar **somente** versões desse prefixo. Escopo explícito `/unificado/mapa/`.
- O SW copiado pré-carrega caminhos `../assets/*` e `/auth/*`. No domínio do PCP essas URLs podem não existir ou apontar para recursos errados; se um item falhar, `cache.addAll()` rejeita a instalação. Todos os recursos da cópia devem ser locais sob `/unificado/` e resolvidos antes de registrar o SW.
- O SW da casca, se criado, deve usar cache `unificado-shell-<VERSION>`, registro e escopo `/unificado/`, filtro de requisições limitado ao prefixo e exclusão somente de `unificado-shell-*`. Nunca registrar escopo `/` nem excluir caches do Mapa antigo.
- O `manifest.json` da cópia do Mapa usa `scope: "./"`, mas ícone em `../assets/`; terá de apontar para cópia dentro de `/unificado/`.
- O PCP não mostrou registro de SW no frontend examinado. O Nginx do PCP aplica cache de sete dias `immutable` a `/static/`; novos assets sob `/unificado/` precisam de versão própria e cabeçalho definido no bloco novo. HTML deve ter `no-store`. A troca de `?v=` deve cobrir HTML, CSS e JS copiados.

## 4. Viabilidade da Fase 4: login visual único

**Conclusão:** duas sessões na mesma origem são possíveis em princípio, mas **a Fase 4 não é executável exatamente como escrita com o código atual e todas as restrições simultâneas**.

1. **PCP:** `POST /api/login` é acessível da nova página na mesma origem; o contrato observado recebe `username` e `senha`, devolve `access_token` e `usuario`. O frontend usa `pcp_token` e `pcp_user`. A implementação do backend não foi lida, portanto não se promete validade do token além do comportamento atual (limpeza em `401`).
2. **Mapa:** `loginWithRole()` e `authenticateUserInApi()` vivem no `app.js` de aproximadamente 15 mil linhas e dependem de elementos do `index.html`, `state`, `supabaseClient`, modal de primeiro acesso e funções de pós-login. Uma página separada `/unificado/login.html` **não consegue simplesmente importar/chamar essa função** sem carregar o runtime inteiro do Mapa. Duplicar a consulta em `shell/auth.js` não seria “a MESMA função”. Extrair um adaptador comum na **cópia** do Mapa, preservando exatamente a consulta e o fluxo, ou criar uma ponte de mensagens para uma página do Mapa carregada em quadro isolado, exigiria uma decisão de arquitetura. A ponte por quadro carregaria o app operacional durante o login e precisa de análise de efeitos colaterais.
3. **Primeiro acesso do Mapa:** o modal depende de `state.paTempUser` no runtime do Mapa. A página de login separada não pode completar esse fluxo apenas gravando a sessão local. É necessário encaminhar o fluxo para a cópia do Mapa ou extrair a lógica compartilhada na cópia, sem mudar regra de senha/perfil.
4. **PCP primeiro:** para a mesma identificação com senhas distintas, a tentativa PCP tem prioridade como pedido; o usuário ainda poderá entrar no Mapa pelo diálogo específico. Erros de rede/`5xx` do PCP **não** devem ser tratados como senha recusada, para não produzir resultado enganoso nem tentar o Mapa sem necessidade. A diferença entre `401` de credencial e falha operacional precisa ser especificada.
5. **Permissões:** a sessão local do Mapa contém `id/name/role/setor` sem assinatura e é restaurada sem revalidar senha. Reproduzir isso mantém o comportamento atual, mas não fornece prova segura para liberar APIs. A correção de senha em texto legível e de autorização do banco é tarefa separada, como exigido.
6. **Origem compartilhada:** `pcp_token` e `pcp_user` serão compartilhados com o PCP antigo. O logout único limpará também a sessão local do PCP antigo. Isso não muda os arquivos antigos, mas muda a experiência de quem usa as duas páginas no mesmo navegador.

**Decisão necessária antes de implementar:** autorizar uma extração/ponte de autenticação **somente nas cópias em `unificado/`**, mantendo a consulta e os perfis do Mapa, ou reformular o requisito “mesma função”. Nenhuma alternativa foi implementada.

## 5. Supabase a partir da origem do PCP

Em 02/10/2026 foi feito apenas um `OPTIONS` de pré-voo para `https://<projeto>.supabase.co/rest/v1/` com `Origin: https://pcp.concretrack.com.br`, método `GET` e cabeçalhos `apikey,authorization,content-type`. A resposta foi **HTTP 200**, `Access-Control-Allow-Origin: *` e permitiu esses cabeçalhos. Isso indica que a origem do PCP **passa pelo CORS** para chamadas REST padrão. **Não prova** que uma consulta real à tabela `usuarios` ou às tabelas de produção será aceita por RLS; por regra, nenhuma delas foi executada neste levantamento.

## 6. Início: programado e realizado, somente leitura

- **Programado:** quando existir sessão PCP válida, usar `GET /api/programacao` com `setor_id`, `data_inicio` e `data_fim` para cada setor. As telas PCP atuais já usam esse endpoint. Agregar `quantidade` de cada item para obter **peças/formas programadas** por setor na data escolhida. Validar o formato real da resposta sem gravar nada. Alternativamente, `GET /api/dashboard?data_inicio=...&data_fim=...` fornece `por_setor`, mas os campos vistos na tela são volumes em m³ (`vol_programado_m3`), que não devem ser misturados com contagem de peças.
- **Realizado:** quando existir sessão Mapa de teste, consultar **somente leitura** os registros de produção da configuração de teste por `data_fabricacao` e `setor`, agregando formas/peças realizadas de acordo com uma definição operacional ainda a confirmar (`status`, duplicatas e lançamentos corrigidos). Não usar o Supabase de produção durante o desenvolvimento. Não consultar `usuarios` para calcular os cartões.
- **Unidade e denominador:** mostrar a mesma unidade nos dois lados. A barra será `realizado / programado` quando ambos forem números comparáveis; sem sessão, erro, resposta vazia ou denominador zero, mostrar `—` e uma indicação discreta. Capacidade fixa das formas (90/80/52/86) é metadado, não denominador automático da programação.
- **Nada de escrita:** somente `GET` na API PCP e `SELECT` do ambiente Mapa isolado. Formulários copiados do PCP precisam ter escrita bloqueada no desenvolvimento sem alterar o contrato da API original.

## 7. Impedimentos verificados antes da Fase 1

### I1 — O “Mapa teste” local não aponta para banco de teste

Os blocos `SUPABASE_CONFIG` de `mapa-concretagem/app.js` e `mapa-concretagem-teste/app.js` são **idênticos**, inclusive URL e chave pública. `getBackendUrl()` também é idêntico e aponta para a API operacional fora de `localhost`. Portanto, copiar `mapa-concretagem-teste/` e chamá-lo de ambiente de teste **não isola login nem gravações**. A regra R4 (“mesma configuração de teste, inclusive login; nenhum dado de produção gravado”) não pode ser garantida com essa cópia. Como R2 proíbe criar/alterar banco ou políticas, é preciso receber uma configuração de teste **já isolada** e confirmar seus endpoints antes de ativar o módulo.

### I2 — Fonte completa do frontend PCP

O panorama descreve 25 telas na VPS; `.work-pcp-report/` contém apenas cópias selecionadas, não o frontend completo com todas as rotas e assets. Para preservar conteúdo e impressão em todas as telas, é necessária uma **cópia completa, revisável e somente leitura** do frontend atual antes da Fase 2. O plano não autoriza editar `/opt/pcp-concrefer` nem fazer mudanças na VPS. Uma exportação fornecida pelo usuário ou uma obtenção pública somente leitura pode servir, sujeita à revisão de integridade e rotas.

### I3 — A Fase 4 requer uma ponte ou extração na cópia

O login próprio do Mapa não é um módulo isolado reutilizável. A regra de chamar a **mesma função** a partir de `shell/auth.js` precisa de uma decisão técnica explícita (seção 4). Alterar o Mapa original ou duplicar silenciosamente a consulta violaria o pedido.

### I4 — Mesmo navegador, mesma origem PCP

Compartilhar `pcp_token`/`pcp_user` com o PCP antigo é consequência inevitável das chaves e da origem exigidas. Deve ser aceito expressamente no desenho da saída única; caso contrário, as chaves ou o domínio precisam mudar, o que conflita com a Fase 4 como escrita.

## 8. Fases, riscos e retorno

| Fase | Entrega planejada | Risco principal | Verificação / retorno |
|---|---|---|---|
| 0 — Plano | Este documento e tag de retorno | Interpretar “teste” como banco isolado sem prova | Parar; nenhuma implantação. Ajustar o plano antes de seguir. |
| 1 — Esqueleto | `unificado/` com casca, login visual, fontes e vendor locais; versão própria | Links absolutos, CSS quebrado, cache fora do escopo | Servidor local; remover somente arquivos da nova pasta ou voltar ao commit da fase. |
| 2 — PCP | Cópias completas com casca, rotas e impressão preservada | Escrita acidental na API produtiva; diferença visual/impresso | Guard de desenvolvimento bloqueando escrita; teste só leitura; comparar PDFs; reverter apenas commit da fase. |
| 3 — Mapa | Cópia apontada a ambiente **realmente isolado**; ponte desktop | Gravação em produção, SW amplo, regressão em tablet/quiosque | Confirmar URL de teste antes de carregar; testar 800/1000 px e quiosque por capturas; reverter commit. |
| 4 — Login | Uma tela, duas sessões preservadas | Mudança de permissões, senhas/IDs duplicados, primeiro acesso incompleto | Contas de teste fornecidas pelo usuário; nunca registrar credenciais; reverter commit, sem tocar contas. |
| 5 — Início real | Agregação somente leitura com estados de falha | Mistura de unidades ou dados de produção/teste | Conferir contrato e amostra autorizada; desligar os cartões/reverter commit. |
| 6 — Paralelo | Novo bloco Nginx e pasta nova na VPS | Queda das rotas antigas, cache incorreto | Antes: diff exato e arquivos; backup do conf, `nginx -t`, reload sem restart. Retorno: restaurar backup, `nginx -t`, reload; apagar somente pasta nova após verificação. **Exige OK explícito para essa fase.** |

Não fazem parte desta tarefa a virada dos domínios antigos, o uso de dados de produção no módulo Mapa do unificado, a correção do armazenamento das senhas do Mapa nem a fusão de cadastros.

## 9. Checklist da Fase 0

| Critério | Estado |
|---|---|
| Código dos Mapas preservado em commit, sem alteração adicional | **OK** |
| Tag `pre-unificacao-20261002` criada | **OK** |
| Branch `feat/sistema-unificado` criada | **OK** |
| Mudanças desta fase restritas a `docs/` | **OK** |
| `git status` global somente com pastas permitidas | **Não atende:** artefatos preexistentes fora do escopo continuam no diretório |
| Sem CDN / console / menu / tablet / impressão | **Não aplicável:** nenhuma nova tela foi construída nesta fase |
| Nenhum usuário, senha, perfil ou produção alterado | **OK** — leitura de código, páginas públicas e pré-voo CORS; sem login ou gravação |
| Sistemas antigos preservados | **OK quanto aos arquivos locais**; nenhum teste de login real foi feito pela regra R5 |

**Ponto de parada da Fase 0:** não ativar módulos operacionais ou login antes de resolver I1 e I3. A autorização geral para avançar permite construir a estrutura local sem operações, mas não elimina a proibição de gravar em produção nem a exigência de preservar a função de login do Mapa. Não há publicação ou push nesta fase.

## 10. Relatório da Fase 1 — estrutura local sem operações

Após o pedido de avançar, foi construída somente a parte da Fase 1 que não depende de I1/I3: `unificado/index.html`, `login.html` visual, `shell/` derivada da prévia, fontes locais, `vendor/` com versões fixas e licenças, `VERSION` e `scripts/bump_unificado.py`. O menu único gera rotas internas propostas, mas todos os destinos operacionais têm `aria-disabled="true"` e a navegação é bloqueada. `shell/auth.js` declara autenticação inativa e não recebe credenciais. Não há cópia do PCP nem do Mapa nesta fase.

| Critério | Estado / evidência |
|---|---|
| Mudanças da fase só em `unificado/`, `scripts/bump_unificado.py`, `docs/` | **OK** para o diff da fase; sujeira preexistente fora dessas pastas permanece |
| Abre sem internet/CDN/API | **OK**: teste em navegador capturou zero requisições externas ao servidor local |
| Console sem erros | **OK** em Início e login visual |
| Menu único, item ativo e módulo persistente | **OK** na casca; telas operacionais ainda indisponíveis |
| 800px, 1000px e quiosque iguais ao Mapa atual | **Não aplicável**: a cópia do Mapa ainda não existe; a casca mostra somente o aviso abaixo de 1025px |
| Etiquetas e FL-PRO-15 idênticas | **Não aplicável**: as cópias do PCP ainda não existem |
| Nenhum usuário/perfil/senha alterado | **OK**: formulário desativado, sem envio |
| Nenhum dado de produção gravado | **OK**: nenhuma chamada a API/Supabase |
| Sistemas antigos operacionais | Arquivos originais intactos; não foi feito login real por R5 |

**Pendências:** I1 (ambiente Mapa isolado), I2 (frontend PCP completo), I3 (ponte da função de login) e I4 (efeito do logout sobre a sessão antiga do PCP). A Fase 2 não deve ativar formulários PCP contra a API produtiva durante o desenvolvimento. A Fase 3 não deve copiar a configuração atual de `mapa-concretagem-teste/` como se fosse isolada.

## 11. Avanço local após a Fase 1 — 02/10/2026

O frontend PCP completo foi obtido da VPS por acesso **somente leitura**: 24 pastas em
`frontend/pages/` e os assets de `frontend/static/`. A cópia de trabalho está em
`.work-unificado-pcp-source/`; o importador `scripts/import_unificado_pcp.py` gerou
as rotas em `unificado/pcp/`. O importador exclui backups e `msgbox.*`, redireciona
o login para a casca nova, ajusta `/pages/` e `/static/` e usa bibliotecas locais.
Cada página carrega `readonly-guard.js` antes dos demais scripts. As 24 rotas e os
26 assets referenciados por HTML responderam HTTP 200 no servidor local; seis arquivos
JS passaram em `node --check`. Uma requisição `POST` simulada no navegador foi
bloqueada antes de chegar à rede. Isso valida a **preparação local da cópia**, não
homologa conteúdo, impressão, autenticação ou operações.

O usuário informou que **ainda não possui ambiente Supabase de teste isolado** e
indicou uma VPS separada para a API de testes (`2.25.163.32`). O acesso somente
leitura confirmou Ubuntu 24.04, Docker instalado e espaço livre; nenhum serviço foi
alterado. As chaves fornecidas depois pertencem ao **mesmo projeto Supabase de
produção** usado pelo Mapa, portanto não satisfazem I1 e não devem ser usadas na
cópia. É necessário acesso de gerenciamento para criar um projeto separado; as
chaves de API do projeto existente não concedem essa capacidade. O Mapa não foi
copiado nem ativado; login e menu operacional permanecem desativados. A Fase 2 segue
parcial até integrar a casca nas telas, comparar impressão e verificar os fluxos
com sessão de teste. Fases 3 a 6 não foram executadas. Há um trecho Nginx de
revisão em `docs/unificado-nginx-draft.conf`, ainda não aplicado.

## 12. Migração Supabase → PostgreSQL isolado — 02/10/2026

O pedido posterior do usuário ampliou o escopo para incluir os dados históricos de
produção. Foi criada a base `mapa_unificado_teste` na VPS de testes `2.25.163.32`.
A exportação leu o Supabase de produção sem alterá-lo, converteu as senhas dos 38
usuários para Argon2id e importou as sete tabelas operacionais. O importador conferiu
SHA-256 de cada CSV, contagem de linhas e hash ordenado dos IDs em origem/destino.

| Tabela | Linhas importadas |
|---|---:|
| `usuarios` | 38 |
| `programacao_pcp` | 3.280 |
| `liberacao_formas` | 5.307 |
| `producao` | 22.523 |
| `montagem_poste` | 8.990 |
| `formas_manutencao` | 2 |
| `prog_s3_s4` | 0 |

O PostgREST de leitura usa o schema `api`, com uma visão de usuários que exclui
`senha_hash`. O serviço de login verifica Argon2 com conta SQL limitada às colunas
necessárias e oferece proxy de leitura autenticado para as sete tabelas. Ambos
escutam somente em `127.0.0.1` na VPS, portas 13051 e 13052.
O serviço de login está em `mapa-unificado-auth.service`, habilitado para reiniciar.
Teste de integração: login válido de usuário sintético retornou 200, senha errada
retornou 401, a sessão assinada permitiu `/me` (200) e leitura (200), a ausência
de cookie gerou 401, a seleção de `senha_hash` recebeu 400, o usuário sintético
foi removido e a contagem
final de usuários voltou a 38. O POST ao PostgREST de leitura retorna 401.

Essa base é uma fotografia da origem; não há sincronização de mudanças feitas após
a exportação. O Mapa operacional ainda usa Supabase e APIs externas no código fonte.
Faltam autorização de gravações por perfil, adaptação dos RPCs e
interfaces, teste de fotos e dashboard, e publicação HTTPS antes da virada. Nenhuma
rota pública do Mapa foi alterada nesta etapa.

## 13. Serviço histórico disponível — 02/10/2026

O usuário autorizou avançar até o serviço ficar disponível. Foi publicado um caminho
separado no domínio já configurado na VPS de testes:
`https://concrefer.concretrack.com.br/unificado/`. A página de login tem as marcas
Concrefer e ConcreTrack e autentica contas do Mapa contra a cópia PostgreSQL.
`/unificado/mapa/` apresenta resumo, filtros por data/setor e paginação para seis
tabelas operacionais. A interface usa apenas GET/HEAD; o proxy de leitura exige
cookie de sessão assinado, e a coluna `senha_hash` não é exposta. Primeiro acesso
permite definir nova senha no banco de testes.

Nginx foi alterado apenas para as novas rotas `/unificado/`, com backup da configuração
anterior em `/root/mapa-unificado-migration/concrefer.nginx.before-unificado.conf`.
`nginx -t` passou antes/depois e foi feito reload. Testes externos: início, login,
Mapa e assets HTTP 200; `/me` e a tabela `producao` sem sessão HTTP 401; fluxo
externo com usuário temporário confirmou login, primeiro acesso, troca de senha,
leitura, rejeição da senha antiga e remoção da conta de teste (38 usuários ao final).
O domínio principal e `/api/health` continuaram respondendo 200.

Este serviço é um **visualizador histórico de testes**, não a versão operacional
integral do Mapa. As gravações, fotos e RPCs da interface original ainda não estão
conectados ao PostgreSQL. PCP continua preparado localmente com bloqueio de escrita,
sem publicação no caminho novo. Nenhum domínio antigo foi redirecionado.

## 14. Primeira escrita operacional isolada — 03/10/2026

Antes de permitir escrita, foi criado um backup completo da base de testes em
`/root/mapa-unificado-migration/before-operational-writes.dump` (arquivo privado,
formato `pg_dump -Fc`, listagem validada). A nova conta `mapa_api_writer` só pode
selecionar, inserir e atualizar `programacao_pcp`, `liberacao_formas` e `producao`;
não pode alterar `usuarios` nem excluir registros. A tabela
`mapa_operation_audit` registra ator, perfil, fase, resultado e identificação da
forma em cada gravação.

`/unificado/mapa/operacoes.html` oferece três ações de teste: programar forma,
liberar forma e registrar concretagem. A API aceita apenas sessão assinada,
origem HTTPS do domínio de testes e perfis `GERENCIA`, `GESTOR` ou `APONTADOR`.
Apontadores ficam limitados ao próprio setor. A forma é localizada por data,
setor e número; se houver mais de um registro correspondente, a API recusa a
atualização. A tela pede confirmação antes de criar ou atualizar.

O teste externo criou três registros sintéticos, atualizou um, verificou quatro
eventos de auditoria, recebeu 403 ao tentar outro setor e origem inválida e
removeu os dados sintéticos. As contagens das tabelas voltaram aos valores de
antes do teste. A conta de escrita não tem privilégio de `UPDATE` em `usuarios`
nem `DELETE` em `producao`.

A interface operacional original do Mapa, montagem, inspeção, fotos, RPCs e
sincronização com a produção ainda não foram migrados. Esta tela deve ser usada
somente para validar o fluxo na base isolada.

## 15. Montagem e inspeção no banco isolado — 03/10/2026

Foi salvo o backup privado `before-montagem-writes.dump` da base de testes antes
de ampliar o privilégio da conta de escrita para `montagem_poste`. A tela
`/unificado/mapa/montagem.html` permite buscar uma forma de produção liberada ou
inspecionada por data e setor, iniciar inspeção visual ou montagem final e
finalizar como aprovada ou reprovada. Os 43 itens de checklist foram extraídos
do código do Mapa atual e publicados em `checklists.json`.

A API confere sessão, origem, perfil, setor, estado do registro de produção,
respostas e motivo de reprovação. Ela impede nova finalização do mesmo checklist
e registra início e fim na auditoria. O teste externo confirmou inspeção
aprovada, montagem reprovada por falha crítica, rejeição de aprovação com falha
crítica, bloqueio de outro setor e de origem ausente, e quatro eventos de
auditoria. Todos os registros e o usuário sintéticos foram removidos; as
contagens das tabelas retornaram ao ponto inicial. HTML e checklist responderam
HTTP 200 no domínio de testes; a API sem sessão respondeu 401.

Fotos, retrabalho e a interface operacional completa do Mapa ainda precisam de
adaptação e validação. A fotografia histórica do banco não sincroniza mudanças
posteriores da produção.

## 16. Correção de escopo: paridade do Mapa — 03/10/2026

O usuário definiu que a unificação altera somente o layout e o backend. Todas
as funções e a forma de operar do Mapa devem permanecer. Em particular,
programação, liberação e apontamento das formas usam cartões e modos de toque
em tablets na produção; não devem ser trocados por formulários. Inspeção,
montagem, fotos e retrabalho também devem conservar o fluxo existente.

Os protótipos de formulários das seções 14 e 15 foram retirados do site de
testes. As páginas diretas respondem 404 e as rotas de escrita do protótipo
foram desativadas. Login e consulta histórica continuam disponíveis. A fonte
funcional atual é `mapa-concretagem/`, que inclui modos de quiosque, cartões de
formas, relatórios, usuários, inspeção, montagem, fotos, retrabalho e API de
fotos. `current-mapa/` é uma cópia anterior. A adaptação deve preservar os
eventos e estados dessa fonte, substituindo as chamadas ao Supabase pelo
PostgreSQL isolado antes de publicar novamente qualquer operação.

## 17. Base para portar os cartões atuais — 03/10/2026

A visão `api.vw_formas_status` foi criada no PostgreSQL de testes com os campos
que a interface atual usa para reconstruir os estados dos cartões por data,
setor e forma. Ela reúne programação, liberação e produção, selecionando o
registro mais recente de cada origem quando há duplicatas. A API autenticada
expõe a visão em modo somente leitura. No teste externo, login, troca de senha,
consulta da visão e bloqueio sem sessão passaram; o usuário temporário foi
removido (38 contas ao final).

O script `scripts/build_unificado_mapa_tablet.py` prepara uma cópia local da
interface atual fora da árvore publicada. O código mantém o fluxo dos cartões,
usa a sessão unificada, reconhece `?tela=` para os atalhos e não contém os
endereços dos serviços operacionais de produção. A página inicial do unificado
não foi alterada nesta etapa. A cópia ainda não foi publicada porque as
escritas, fotos, RPCs e integrações do PCP precisam ter equivalentes no backend
de testes e passar por comparação funcional no tablet.

## 18. Prévia de consulta no tablet — 03/10/2026

Foi publicada a rota separada `/unificado/mapa/consulta/`, gerada a partir do
Mapa atual. Ela usa a sessão unificada, não contém os endereços operacionais de
produção e lê a cópia PostgreSQL de testes. A data inicial é 02/10/2026,
última data de produção na fotografia importada. Um aviso explica o alcance
da prévia; a captura de cliques nos cartões e o guard de rede bloqueiam
apontamentos. Login pela rota da prévia retorna à mesma rota após autenticação.

O navegador foi verificado nos tamanhos 1024×768 e 768×1024: 52 cartões do
Setor 3 apareceram, clique em cartão não enviou gravação e o fluxo de login
retornou à prévia. As respostas da API no teste visual foram simuladas; o
acesso autenticado à visão de estados do PostgreSQL já havia sido validado
separadamente. A publicação é somente para consulta e não substitui o Mapa
operacional existente. A página inicial do unificado não foi alterada.
