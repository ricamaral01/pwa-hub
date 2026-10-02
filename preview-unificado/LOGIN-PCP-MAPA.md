# Como funcionam os logins do PCP e do Mapa de Concretagem

**Levantamento:** 2 de outubro de 2026. **Tipo:** leitura do código e de páginas públicas, sem tentar autenticar, alterar usuários, banco ou serviços. Este documento descreve o comportamento observado; pontos não confirmados estão identificados.

## Resumo executivo

| Assunto | PCP Concrefer | Mapa de Concretagem |
|---|---|---|
| Endereço | `pcp.concretrack.com.br` | `usina.concretrack.com.br/mapa-concretagem/` |
| Tela de entrada | `/pages/login.html` | `loginScreen` dentro de `index.html` |
| Verificação da senha | `POST /api/login` no backend do PCP | Consulta direta do navegador à tabela Supabase `usuarios` |
| Resultado guardado no navegador | `pcp_token` e `pcp_user` no `localStorage` | `pwa_mapa_auth_session_v1` no `localStorage` |
| Credencial enviada nas operações | `Authorization: Bearer <token>` | Cliente Supabase com chave pública `anon`; a sessão própria do Mapa não é um token Supabase Auth |
| Primeiro acesso | Página `/pages/primeiro-acesso/`; exige senha atual | Modal dentro do Mapa; exige nova senha e confirmação |
| Perfis | `ADMIN`, `PCP`, `PRODUCAO`, `CONSULTA` | `GERENCIA`, `GESTOR`, `MONTADOR`, `APONTADOR` |
| Saída | Remove token e usuário locais, volta ao login | Remove a sessão própria local, volta à tela de login do Mapa |
| Sessão compartilhada entre os dois | **Não** | **Não** |

Os nomes, senhas, perfis e sessões dos dois sistemas têm modelos diferentes. A prévia de layout não faz login em nenhum deles.

## 1. Login do PCP

### 1.1 Entrada e autenticação

1. O usuário abre [`/pages/login.html`](https://pcp.concretrack.com.br/pages/login.html), que contém campos **usuário** e **senha**, botão para mostrar a senha, mensagem de erro e indicador de carregamento.
2. Se já existir `pcp_token` no `localStorage`, a página redireciona diretamente para `/pages/dashboard/`. Essa decisão inicial verifica **a presença** do token, não sua validade. Uma chamada posterior à API pode receber `401` e devolver o usuário ao login.
3. Ao enviar o formulário, o navegador faz `POST /api/login` com JSON `{ "username": "…", "senha": "…" }`.
4. Em caso de sucesso, grava `access_token` como `pcp_token` e o objeto `usuario` como `pcp_user` no `localStorage`.
5. Se `usuario.trocar_senha_primeiro_acesso` for verdadeiro, abre `/pages/primeiro-acesso/`; caso contrário, abre `/pages/dashboard/`.
6. Em falha, a página mostra o `detail` devolvido pela API ou uma mensagem genérica.

O backend do PCP é servido por FastAPI/Uvicorn atrás do Nginx; `/api/` é encaminhado ao serviço. A cópia local disponível contém o frontend e o ponto de montagem do roteador de autenticação, mas **não contém a implementação do roteador**. Portanto, este levantamento não confirma o algoritmo de hash da senha, a duração ou renovação do token, os limites de tentativas, nem todas as regras de autorização aplicadas pelo backend.

### 1.2 Uso da sessão e proteção das páginas

O JS global do PCP lê `pcp_token` e `pcp_user`. `requireAuth()` redireciona ao login quando não há token e redireciona à troca de senha quando `pcp_user.trocar_senha_primeiro_acesso` está ativo. As chamadas feitas pelo helper `API` acrescentam `Authorization: Bearer <token>`. Ao receber `401`, o helper limpa os dois valores e volta ao login.

O menu usa `nivel_acesso` para esconder opções: somente `ADMIN` vê Usuários; `CONSULTA` perde itens de edição indicados por `data-require`; `PRODUCAO` não vê itens marcados como `PCP`. `checkRole()` também compara o nível do usuário para ações do frontend. **Esconder um botão no navegador não substitui a autorização da API**; a aplicação dessa regra no backend precisa ser conferida no roteador que não está nesta cópia.

### 1.3 Primeiro acesso e saída

Na página [`/pages/primeiro-acesso/`](https://pcp.concretrack.com.br/pages/primeiro-acesso/), o usuário informa senha atual, nova senha e confirmação. O HTML exige pelo menos **6 caracteres** na nova senha. O formulário compara confirmação e chama `POST /api/usuarios/trocar-senha-primeiro-acesso` pelo helper autenticado, enviando `senha_atual` e `nova_senha`. A resposta substitui `pcp_user` no `localStorage` e leva ao Dashboard. Não há, nesta página, indicação de que o `pcp_token` seja substituído após a troca.

O botão **Sair** chama `API.clearSession()`, remove `pcp_token` e `pcp_user` e redireciona ao login. Não foi encontrada chamada de revogação de token no fluxo de saída do frontend; a revogação no servidor não pôde ser confirmada.

### 1.4 O que o usuário vê

O login é uma página separada, com fundo em gradiente azul, cartão branco, marca “PCP Concrefer”, campos com ícones Bootstrap, botão de mostrar senha e aviso de erro. A tela de primeiro acesso usa outro cartão simples. O login carrega CSS e ícones por CDN; por isso, seu visual depende desses recursos externos.

## 2. Login do Mapa de Concretagem

### 2.1 Há duas camadas no HTML, mas uma está suspensa

O `index.html` do Mapa carrega o `guard.js` do Hub ConcreTrack e declara `data-app-key="mapa-concretagem"`. Em tese, esse guard poderia exigir uma sessão Supabase Auth do Hub, verificar usuário ativo, primeiro acesso, permissão para o aplicativo e idade máxima de **8 horas**.

Entretanto, tanto a configuração local quanto a configuração pública consultada em 02/10/2026 têm **`authEnabled: false`**. Nessa condição o guard remove o bloqueio visual e termina sem exigir login do Hub. O formulário de login que o usuário encontra é o **login próprio do Mapa**, descrito abaixo. O valor público pode mudar posteriormente; este documento registra o estado observado na data do levantamento.

### 2.2 Entrada e consulta de credenciais

1. O Mapa exibe, na mesma página, um formulário “Acesso ao Mapa” com **usuário** e **senha**.
2. `loginWithRole()` exige que os dois campos não estejam vazios e chama `authenticateUserInApi()`.
3. A função usa o cliente Supabase no navegador para consultar a tabela `usuarios`, filtrando `ativo = true`, nome **ou** `id` do usuário e `senha = senha digitada`. O resultado é limitado a uma linha.
4. Se não houver resultado, mostra “Usuário ou senha incorretos”. Se o perfil não existir em `ROLE_PERMISSIONS`, mostra “Perfil inválido”.
5. Se `primeiro_acesso` for verdadeiro, abre o modal de troca de senha. Caso contrário, monta `state.authUser`, calcula telas permitidas, grava a sessão local e abre a tela Início (`HUB`).

O código também permite cadastrar usuários pela interface do Mapa. Esse cadastro usa `upsert` na mesma tabela, com `senha` recebendo o valor informado no formulário e `primeiro_acesso: true`. A consulta compara esse campo diretamente com a senha digitada. **Isso indica armazenamento/comparação de senha em texto legível no modelo implementado pelo frontend.** Não foi possível confirmar se há alguma transformação adicional no banco, nem as políticas RLS efetivamente instaladas; nada no fluxo observado mostra hash no cliente.

### 2.3 Sessão local, recarga e saída

Depois de entrar, o Mapa salva apenas `{ id, name, role, setor }` na chave `pwa_mapa_auth_session_v1` do `localStorage`. Não salva um token de autenticação próprio nessa chave. Ao recarregar, `readAuthSession()` aceita o objeto se tiver um perfil conhecido e reconstrói o acesso às telas **sem repetir a verificação da senha**. Não há expiração da sessão própria no código observado.

Ao clicar **Sair**, o Mapa limpa `state.authUser`, remove essa chave local, esconde as telas e reabre seu formulário. Esse botão não chama o logout do Hub/Supabase Auth; com o guard do Hub suspenso, o fluxo normal não usa essa sessão.

### 2.4 Primeiro acesso

Se `primeiro_acesso` estiver ativo, o Mapa guarda o usuário temporariamente em memória e abre um modal. A nova senha precisa ter **pelo menos 4 caracteres** e coincidir com a confirmação. O frontend chama `alterar_senha_primeiro_acesso`, que atualiza `usuarios.senha` e marca `primeiro_acesso = false` pelo `id` recebido. O modal **não pede a senha antiga**; a proteção depende de o fluxo anterior ter autenticado o usuário e das regras do banco. Após o retorno, o app cria a sessão local e abre Início.

### 2.5 Perfis e telas

| Perfil | Acesso definido no frontend |
|---|---|
| `GERENCIA` | Quase todas as telas, incluindo Inspeção e Usuários |
| `GESTOR` | Quase todas as telas, mas sem Inspeção e Usuários na lista base |
| `MONTADOR` | Inspeção, Montagem Postes, Sequência S3, Manutenção e Tratativa |
| `APONTADOR` | Setores 1–4 de Produção/Liberação, Mandril, Manutenção e Tratativa |

Há exceções codificadas por identidade: determinados IDs ganham acesso a Mandril/Inspeção; o nome “ricardo” ganha a tela Usuários. O botão “Refazer apontamento errado” (modo ODIN) aparece para `GERENCIA`, `GESTOR` ou nomes que contenham “ricardo” ou “philippe”. Essas decisões usam os dados da sessão no navegador. O Mapa esconde itens de menu e impede `setMode()` para telas não permitidas, mas **isso é controle no frontend**; a autorização de leituras e gravações na API/Supabase depende das políticas e serviços externos, que não foram auditados aqui.

### 2.6 Produção e teste

Os trechos de definição de perfis, restauração da sessão e `loginWithRole()` em `mapa-concretagem/` e `mapa-concretagem-teste/` estão iguais na cópia local examinada. Essa comparação **não comprova** que bancos, políticas RLS ou versões publicadas dos dois ambientes estejam iguais.

## 3. Por que um login não abre automaticamente o outro

| Diferença | Efeito prático |
|---|---|
| Domínios diferentes | O `localStorage` do PCP não é compartilhado com `usina.concretrack.com.br`. |
| Credenciais diferentes | O PCP envia usuário/senha ao backend e recebe token; o Mapa consulta `usuarios` via cliente Supabase. |
| Perfis diferentes | Não existe correspondência automática entre `ADMIN/PCP/PRODUCAO/CONSULTA` e `GERENCIA/GESTOR/MONTADOR/APONTADOR`. |
| Primeiro acesso diferente | PCP pede senha atual e mínimo de 6 caracteres; Mapa usa modal e mínimo de 4. |
| Saídas separadas | Sair de um sistema não encerra necessariamente a sessão do outro. |
| Guard do Hub suspenso | O código do Hub existe no Mapa, mas atualmente não integra o login próprio do Mapa. |

Assim, uma casca visual comum pode abrir links para ambos, mas **não representa login único**. O usuário pode precisar entrar novamente ao passar de um sistema para o outro.

## 4. Pontos que precisam ser decididos antes de unificar

1. **Fonte de identidade:** escolher qual serviço autentica o usuário e como contas existentes do PCP e do Mapa serão relacionadas, sem assumir que nomes iguais são a mesma pessoa.
2. **Credenciais do Mapa:** verificar estrutura real da tabela `usuarios`, políticas RLS e possíveis acessos diretos; planejar migração segura para senhas com hash ou para um provedor de identidade. A consulta atual por `senha` não deve ser transportada para a casca unificada.
3. **Sessão e saída:** definir validade, renovação, revogação e logout entre os domínios. Um objeto de perfil em `localStorage` não deve ser tratado como prova de autenticação.
4. **Permissões:** mapear cada perfil e exceção nominal para permissões explícitas aplicadas **também no servidor/banco**, inclusive criação de usuários, inspeção, apontamentos e correções.
5. **Primeiro acesso e recuperação:** estabelecer uma política única de senha, troca obrigatória e recuperação; prever migração de contas sem revelar ou transportar senhas existentes.
6. **Validação:** testar login, sessão expirada, usuário desativado, primeiro acesso, troca de perfil, acesso direto a tela/API sem permissão e logout em cada domínio, primeiro em teste e depois em produção.

Nenhum desses passos foi executado neste levantamento.

## 5. Fontes e limites da verificação

- PCP: páginas públicas atuais de [login](https://pcp.concretrack.com.br/pages/login.html) e [primeiro acesso](https://pcp.concretrack.com.br/pages/primeiro-acesso/) consultadas em leitura; cópia local de [`app.js`](../.work-pcp-report/app.js); [panorama do PCP](../docs/panorama-visual-pcp-concretrack.md). A implementação do roteador `auth` do backend e as configurações de tokens **não estavam disponíveis localmente**. Não foi feito login real.
- Mapa: [`index.html`](../mapa-concretagem/index.html) e [`app.js`](../mapa-concretagem/app.js), incluindo `ROLE_PERMISSIONS`, `postToApi()`, `loginWithRole()`, `readAuthSession()` e `logoutUser()`; [guard do Hub](../auth/guard.js) e [configuração](../auth/config.js). A configuração pública `/auth/config.js` também foi lida para confirmar `authEnabled: false`. Não foram consultados dados de usuários nem políticas ativas no Supabase.
- Nenhuma senha, token de sessão, chave pública completa ou dado pessoal foi incluído neste documento.
