# Relatório da unificação no ambiente de testes

Atualizado em 04/10/2026 (fotografia dos dados: 04/10/2026 03:02:17 UTC). **A certificação final ainda não foi alcançada.** Este documento registra o que está publicado e os critérios que ainda faltam, sem autorizar a virada.

## Publicado

VPS de testes: `2.25.163.32`. As rotas abaixo são exclusivas do ambiente de testes; a virada não foi executada.

| Parte | Endereço | Situação |
|---|---|---|
| Início, menu e login único | `https://concrefer.concretrack.com.br/unificado/` | Dados do dashboard PCP e da RPC de produção do Mapa por setor; contas só-PCP e só-Mapa testadas no navegador. |
| Mapa operacional | `https://concrefer.concretrack.com.br/unificado/mapa/operacao/` | Banco de testes, faixa de ambiente, casca desktop; certificação E2E incompleta. |
| Mapa histórico | `https://concrefer.concretrack.com.br/unificado/mapa/` | Leitura no PostgreSQL de testes. |
| PCP | `https://concrefer.concretrack.com.br/unificado/pcp/` | 24 rotas publicadas e API no PostgreSQL de testes; E2E de todas as telas incompleto. |
| Página de avaliação | `https://concrefer.concretrack.com.br/unificado/testar/` | Exige login, fora do menu, apresenta estados por parte. |

Os sistemas oficiais `https://pcp.concretrack.com.br/` e `https://usina.concretrack.com.br/mapa-concretagem/` responderam HTTP 200 após as publicações. Nenhum teste de gravação usou os sistemas oficiais. A cópia do backend PCP mantém os 47 arquivos de código iguais ao oficial; o `app.js` do Mapa e os conteúdos das planilhas não foram alterados.

## Definição de pronto

| Critério | Sim/não | Evidência e limite |
|---|---|---|
| 24/24 fluxos do Mapa IGUAL; 73/73 chamadas no contrato | **não** | 73/73 ocorrências de código cobertas, incluindo a chamada inatingível `CONFIG.API_URL`. Só 1/24 fluxo tem certificação E2E integral. A rodada de funções executou 30/31 roteiros; vários apresentam chamadas faltantes/extras e precisam de comparação por ação, linha e cartão. |
| 24/24 páginas PCP abrindo, lendo e gravando; API 63/63 idêntica | **não** | Quatro perfis sintéticos (ADMIN, PCP, PRODUCAO, CONSULTA) abriram as 24 rotas com HTTP 200, sem erro de página, requisição externa ou escrita inesperada. Primeiro acesso redirecionou para dashboard em sessão normal; PCP/PRODUCAO/CONSULTA também foram redirecionados em Teste Programação e Usuários. A página Formas por Setor recebeu a casca desktop e foi idêntica ao HTML original em 390×844 (zero pixels diferentes). Leitura da API 63/63 conforme `docs/auditoria-paridade-pcp-2026-10-03.md`. Escritas de API sintéticas passaram e foram limpas; E2E completo de tela e papel por perfil segue pendente. |
| Impressões e exportações iguais às originais | **não** | FL-PRO-15, PCP Diário e um par de etiquetas 95×40 mm geraram PDFs com hashes de texto e imagem iguais. Dois CSV foram iguais byte a byte e o XLSX de montagem teve conteúdo lógico igual entre o HTML original e a cópia, na mesma fotografia de testes. Faltam demais períodos/opções e conferência direta de arquivos baixados dos domínios oficiais. |
| Desktop novo em todas as telas; tablet, celular e quiosque idênticos por imagem | **não** | Início, Relatório Enc. Produção e Histórico do Mapa capturados antes/depois em 1366×768 e 1920×1080; demais telas recebem a casca geral, sem revisão individual. A página PCP Formas por Setor também recebeu a casca desktop; sua imagem em celular 390×844 foi idêntica ao HTML original. Na repetição da matriz Mapa de 18 modos × 3 condições, **54/54** capturas foram idênticas pixel a pixel. Faltam celular do Mapa e revisão individual das demais telas. |
| Login único para só-PCP, só-Mapa e par | **sim** | Contas sintéticas só-PCP e só-Mapa abriram apenas seu módulo. Um par sintético Mapa-base abriu os dois módulos em uma tela, leu as duas APIs, abriu PCP e Mapa sem segundo login e, após Sair, perdeu o acesso à página protegida. As contas e o vínculo sintéticos foram removidos. Nove pares reais candidatos continuam separados até decisão individual do Ricardo. |
| Nenhuma página do unificado chama Supabase ou domínios oficiais para dados | **não** | Navegação Mapa 288/288, PCP 24 rotas e Início das duas contas não geraram requisição externa. Falta varredura dinâmica de todas as ações. O backend PCP lê as mesmas planilhas Google, somente leitura, como o oficial. |
| Nenhum serviço como root; nada em `/root/` | **sim** | Mapa API, tempo real e hub usam `www-data`; PCP API usa `pcp-unificado`; contêiner de fotos usa UID 33 e PostgREST usa UID 1000. Código, frontend, fotos e scripts de fotografia ativos estão em `/opt/concrefer-unificado/`. Os antigos caminhos do unificado em `/root/`, `/var/www/` e `/opt/` não existem mais; cópias de retorno permanecem dentro de `/opt/concrefer-unificado/`. Credenciais 600 ficam em `/etc/` e arquivos de backup em `/var/backups/`. Backups diários dos dois bancos e das fotos tiveram restauração de prova; ambos os timers estão ativos. |
| Sistemas oficiais respondendo e logando como antes | **não** | Ambos responderam HTTP 200 após as alterações de testes; login oficial ainda não foi conferido sem usar credencial real ou escrita. |
| Tudo em commits; nenhum segredo no repositório | **não** | Mudanças do unificado desta sessão estão em commits e nenhuma credencial ou dump foi adicionado ao Git; arquivos privados permanecem no servidor com modo 600. A árvore de trabalho contém alterações antigas de outros projetos e a auditoria final de segredos de todo o histórico ainda falta. |

## Comportamentos originais preservados

`docs/comportamentos-atuais-suspeitos.md` mantém evidências de: Liberação do Setor 4 abrir a escolha de concreto; a chamada antiga `CONFIG.API_URL` falhar antes do fetch; outubro selecionar a planilha de agosto; e o botão Redefinir senha do PCP não enviar requisição por erro no atributo `onclick` original. A tabela `producao_diaria` permanece vazia, conforme decisão do Ricardo. Nenhum desses comportamentos foi mudado para fazer um teste passar.

## Pendências de execução

1. Certificar os 23 fluxos do Mapa restantes por perfil e setor, incluindo inspeção/fotos, montagem, RR, offline, tempo real, CSV e XLSX. Uma sessão recebeu evento `producao` via WebSocket e atualizou o cartão do segundo tablet em 0,39 s; a matriz completa de eventos/perfis continua pendente. Corrigir somente o servidor de testes quando o resultado final diferir.
2. Concluir a matriz de telas PCP por perfil e todas as impressões/exportações restantes. A tela Usuários tem o defeito original do botão Redefinir senha documentado.
3. Confirmar ou rejeitar individualmente os nove pares de contas ainda candidatos; só um par de login e nome iguais foi confirmado automaticamente. O fluxo de par Mapa-base passou no navegador com conta sintética, sem expor credenciais.
4. Completar a revisão visual de todas as telas e tamanhos pedidos.
5. Atualizar a página de testes para “pronto para testar” somente depois da certificação funcional e visual. A infraestrutura de testes já foi consolidada em `/opt/concrefer-unificado/`, com serviços sem root, backups diários e restauração de prova de PostgreSQL e fotos.

## Refazer a fotografia

No computador com acesso SSH a `vps-rh` e `vps-staging`, executar `python scripts/refresh_unificado_snapshots.py --apply`. O script verifica previamente os esquemas e a origem, gera backup privado dos bancos de testes, restaura uma cópia temporária do PCP, confere contagens e só então substitui os dados dos bancos de testes. A migração do Mapa reaplica os vínculos de identidade confirmados. Após a execução, conferir o carimbo exibido em `/unificado/testar/`, repetir `tests/unificado/home_smoke.py` com contas sintéticas e validar as rotas. Não usar esse comando durante uma rodada de gravação ainda não encerrada.

O roteiro da virada, **apenas descritivo**, está em `docs/roteiro-virada.md`.
