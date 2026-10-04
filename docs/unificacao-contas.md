# Unificação de contas — revisão de identidades

Inventário dos bancos de testes em 03/10/2026 21:31 Hora oficial do Brasil. Nenhuma senha ou hash foi consultado para gerar este documento.

**Pares confirmados: 1.** Somente o par com login e nome iguais foi vinculado automaticamente. Os demais permanecem separados até confirmação individual do Ricardo.

PCP: 15 contas; Mapa: 38 contas. Só PCP: 6; só Mapa: 30; pares candidatos pendentes: 9; logins iguais com nomes diferentes: 1.

## Contas só do PCP (sem par candidato)

| Login | Nome | Perfil | Situação |
|---|---|---|---|
| `Diego` | Diego | PCP | ativa, acesso normal |
| `Phellipe` | Phellipe Augusto | ADMIN | ativa, acesso normal |
| `consulta` | Consulta | CONSULTA | ativa, primeiro acesso |
| `pcp` | Analista PCP | PCP | ativa, acesso normal |
| `producao` | Operador | PRODUCAO | ativa, primeiro acesso |
| `tmpuser1775946201` | Teste Primeiro Acesso | CONSULTA | ativa, acesso normal |

## Contas só do Mapa (sem par candidato)

| Login | Nome | Perfil | Situação |
|---|---|---|---|
| `alexh` | Alex Henrique | MONTADOR | ativa, acesso normal |
| `caraujo` | Cicero Araújo dos Santos | MONTADOR | inativa, acesso normal |
| `cgomes` | Cicero Gomes da Silva | MONTADOR | ativa, acesso normal |
| `dhenrique` | Douglas Henrique Caridade Cogo | MONTADOR | ativa, acesso normal |
| `diegobat` | Diego Carimno | MONTADOR | ativa, acesso normal |
| `diegom` | Diego Medes | GERENCIA | ativa, acesso normal |
| `gustavod` | Gustavo Diego | MONTADOR | ativa, acesso normal |
| `jcarlos` | José Carlos da Silva | GESTOR | ativa, acesso normal |
| `jose1` | josé | MONTADOR | inativa, primeiro acesso |
| `joseg` | José Aparecido Gonçalves | MONTADOR | inativa, primeiro acesso |
| `joses` | José Aparecido dos Santos | MONTADOR | ativa, acesso normal |
| `josue` | josue | GESTOR | ativa, acesso normal |
| `jpereira` | Julianderson Gonçalves Pereira | MONTADOR | ativa, acesso normal |
| `marcio1` | Marcio | GESTOR | inativa, primeiro acesso |
| `marcios` | Marcio Angelo de Souza | GESTOR | ativa, acesso normal |
| `phe` | Phillipe | GERENCIA | inativa, acesso normal |
| `rafaels` | Rafael Agnaldo dos Santos | MONTADOR | ativa, acesso normal |
| `setor1` | Setor1 | APONTADOR | ativa, acesso normal |
| `setor2` | Setor2 | APONTADOR | ativa, acesso normal |
| `setor3` | Setor 3 | APONTADOR | ativa, acesso normal |
| `setor4` | Setor 4 | APONTADOR | ativa, acesso normal |
| `sgaspar` | Sidinei Gaspar da Silva | MONTADOR | ativa, acesso normal |
| `teste` | teste | GERENCIA | ativa, acesso normal |
| `user-admin-teste` | admin_teste | GERENCIA | inativa, primeiro acesso |
| `user-apontador` | Apontador | MONTADOR | ativa, primeiro acesso |
| `user-elizeu` | Elizeu | MONTADOR | ativa, primeiro acesso |
| `user-jose-carlos` | Jose Carlos | GESTOR | inativa, primeiro acesso |
| `user-julianderson` | Julianderson | MONTADOR | ativa, primeiro acesso |
| `user-marcos1` | Marcos1 | GERENCIA | inativa, primeiro acesso |
| `user-setor-2` | Setor 2 | MONTADOR | inativa, primeiro acesso |

## Pares candidatos — confirmar um a um

| Nº | PCP: login, nome, perfil, situação | Mapa: login, nome, perfil, situação | Motivo | Decisão |
|---:|---|---|---|---|
| 1 | `Alex`<br>Alex<br>ADMIN<br>ativa, primeiro acesso | `user-alex`<br>Alex<br>GERENCIA<br>ativa, acesso normal | same full name | pendente |
| 2 | `Alex51`<br>Alex<br>ADMIN<br>ativa, acesso normal | `user-alex`<br>Alex<br>GERENCIA<br>ativa, acesso normal | same full name | pendente |
| 3 | `Marcelo`<br>Marcelo<br>ADMIN<br>ativa, acesso normal | `marcelo`<br>Marcelo<br>GERENCIA<br>ativa, acesso normal | same full name and login | confirmado automaticamente; Mapa é a base |
| 4 | `Marcos`<br>Marcos<br>ADMIN<br>ativa, acesso normal | `user-marcos`<br>Marcos<br>GESTOR<br>inativa, primeiro acesso | same full name | pendente |
| 5 | `Philippe`<br>Philippe Augusto<br>ADMIN<br>ativa, acesso normal | `philippe`<br>Philippe<br>GERENCIA<br>ativa, acesso normal | PCP login matches Mapa display name | pendente |
| 6 | `Ricardo`<br>Ricardo Do Amaral<br>ADMIN<br>ativa, acesso normal | `user-ricardo`<br>Ricardo<br>GERENCIA<br>ativa, acesso normal | PCP login matches Mapa display name | pendente |
| 7 | `Ricardo`<br>Ricardo Do Amaral<br>ADMIN<br>ativa, acesso normal | `user-ricardo-do-amaral`<br>Ricardo Do Amaral<br>GERENCIA<br>inativa, primeiro acesso | same full name | pendente |
| 8 | `admin`<br>Administrador<br>ADMIN<br>ativa, acesso normal | `user-admin`<br>admin<br>GERENCIA<br>inativa, primeiro acesso | PCP login matches Mapa display name | pendente |
| 9 | `jgaby`<br>João Gabriel<br>ADMIN<br>ativa, acesso normal | `jgabriel`<br>João Gabriel<br>GERENCIA<br>ativa, acesso normal | same full name | pendente |
| 10 | `marcos`<br>Marcos<br>PCP<br>ativa, primeiro acesso | `user-marcos`<br>Marcos<br>GESTOR<br>inativa, primeiro acesso | same full name | pendente |

## Mesmo login, nomes diferentes — revisar antes de unir

| Login | PCP: nome, perfil, situação | Mapa: nome, perfil, situação | Decisão |
|---|---|---|---|
| `Philippe` | Philippe Augusto, ADMIN, ativa | Philippe, GERENCIA, ativa | pendente |

## Ricardo

O login literal `Ricardo` existe no PCP de testes com perfil ADMIN, ativo e fora de primeiro acesso. No Mapa de testes, o cadastro ativo de nome `Ricardo` tem login `user-ricardo`, perfil GERENCIA e não está em primeiro acesso. Não há login literal `Ricardo` no Mapa. Há ainda `user-ricardo-do-amaral`, inativo e em primeiro acesso; o nome coincide com o cadastro PCP, mas isto não confirma identidade. Nenhuma senha do Ricardo foi acessada para esta auditoria.

## Regras até confirmação

- Cada conta mantém seu próprio login, senha, perfil e situação.
- Vincular automaticamente somente login e nome iguais, únicos dos dois lados; nos demais, não unir sem confirmação.
- Após confirmação, registrar a identidade no serviço de autenticação de testes e preservar os perfis específicos de cada módulo.

## Implementação no ambiente de testes

A tela de login existente envia a credencial ao serviço do unificado. Contas só do PCP recebem sessão PCP; contas só do Mapa recebem sessão Mapa; o logout encerra as duas. A página `/unificado/testar/` exige uma dessas sessões. Primeiro acesso de cada sistema usa o mesmo formulário visual, com senha nova de no mínimo seis caracteres; senhas antigas mais curtas continuam aceitas até a troca.

`unificado_auth.identity_links` no PostgreSQL Mapa de testes guarda somente pares confirmados e hashes, sem texto de senha. O par exato Marcelo foi vinculado; no primeiro login válido com a credencial do Mapa, o serviço gravará o hash compatível no PCP e abrirá ambos os módulos sem troca forçada. Os demais pares seguem pendentes. A nova senha gera bcrypt para o PCP e Argon2id para o Mapa. `scripts/refresh_unificado_snapshots.py` chama `scripts/reapply_unified_auth.py` depois de restaurar as fotografias.

O teste sintético de ambos os bancos passou para: só-PCP, só-Mapa, par com senhas iguais, par com senhas diferentes, mesma grafia de login sem vínculo, senha incorreta, troca dos dois hashes, mínimo de seis, inativação de um lado e reaplicação após simular uma fotografia. O login e primeiro acesso também passaram no navegador para contas temporárias dos dois módulos; todas foram removidas.

Em 04/10/2026, `tests/unificado/pair_browser_smoke.py` confirmou o par sintético Mapa-base pelo navegador na rota publicada: uma credencial abriu as duas sessões, Início leu as APIs PCP e Mapa com HTTP 200, as duas páginas abriram sem novo login e Sair removeu o token PCP e bloqueou a página protegida (HTTP 401). O vínculo e as duas contas sintéticas foram removidos; restou apenas o par real exato já confirmado.

As duas rotas públicas de Usuários passam pelo serviço unificado. O fluxo PCP é encaminhado ao backend PCP original e, se o cadastro estiver vinculado, a nova senha é refletida no Mapa; o fluxo Mapa já é atendido pelo serviço e reflete a alteração no PCP. Um par sintético confirmou as duas direções pela URL pública. O backend PCP original permanece idêntico (47 arquivos). A tela de login, primeiro acesso e logout foram testados em navegador com contas removidas ao final.

**Limite:** as telas completas de administração de usuários ainda não tiveram comparação visual e de permissões por perfil. O par exato está confirmado, mas sua senha Mapa somente será adotada no primeiro login válido. Os hashes são reaplicados após a fotografia; a rotina passou no teste sintético de restauração de hashes e flags, mas ainda não houve uma fotografia integral após esse primeiro login.
