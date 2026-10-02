# Mapa de Concretagem — mapeamento funcional da produção

**Versão:** v5.29 · **Data:** 01/10/2026 · **Endereço:** https://usina.concretrack.com.br/mapa-concretagem/

## Arquitetura e armazenamento

O Mapa de Concretagem é uma aplicação web instalável (PWA) publicada no GitHub Pages. A interface usa `index.html`, `app.js`, `styles.css`, `manifest.json` e `sw.js`. Dados operacionais são consultados e gravados no projeto Supabase PostgreSQL `fbvvdyirhtgvycullsqy`. Programação e saques do mandril também usam a API do PCP. O navegador mantém sessão, cache e alguns controles locais; o cache não substitui a confirmação do banco.

| Camada | Origem ou destino | Uso |
|---|---|---|
| Produção | Supabase `programacao_pcp`, `liberacao_formas`, `producao`; leitura `vw_formas_status` | Programar, liberar e registrar concretagem, forma, modelo, concreto e horários. |
| Inspeção e montagem | Supabase `montagem_poste` | Checklist, resultado, fotos incorporadas ao checklist e segunda inspeção. |
| Sequência Setor 3 | Supabase `prog_s3_s4` | Modelos selecionados por forma e data. |
| Manutenção | Supabase `formas_manutencao` | Formas paradas, liberadas e histórico. |
| Usuários | Supabase `usuarios` e `/auth/` | Contas, permissões e autenticação. |
| PCP | `https://pcp.concretrack.com.br/api/programacao` | Consulta da programação por data e setor. |
| Saque do mandril | `https://pcp.concretrack.com.br/api/saques-mandril` | Consulta, registro, remoção e importação de saques entre aparelhos. |
| Navegador | `localStorage` | Sessão, estado offline, preferências, notas de acompanhamento e tratativas locais. |

## Início e menu lateral

O início oferece 18 ícones de seção. O menu lateral oferece 19 links, incluindo **Início**. O acesso depende do perfil do usuário. **Voltar** retorna à lista anterior ou ao início; **Voltar ao Hub** retorna à página inicial do portal. O botão de menu oculta ou mostra a barra lateral; a preferência fica no navegador em `sidebarCollapsed`. Os grupos do início sem itens permitidos ficam ocultos.

| Seção ou link | O que faz | Leitura e gravação |
|---|---|---|
| Início | Abre o hub e resume formas em manutenção. | Lê manutenção; não grava pelo link. |
| Produção / Liberação | Mostra o mapa de formas, programação, liberação e concretagem. | Lê/grava `programacao_pcp`, `liberacao_formas` e `producao`; cache local. |
| Produção Setor 1 | Abre o mapa no quiosque do Setor 1, com sincronização e tela cheia. | Mesmas tabelas de produção. |
| Produção Setor 2 | Abre o quiosque do Setor 2. | Mesmas tabelas de produção. |
| Produção Setor 3 | Abre o quiosque do Setor 3; consulta modelos previstos no PCP. | Mesmas tabelas e API PCP. |
| Produção Setor 4 | Abre o quiosque do Setor 4. | Mesmas tabelas e API PCP quando aplicável. |
| Mandril Circular | Lista SC01–SC52, modelo previsto e produzido, hora de concretagem, previsão +3h e saque real. | Lê `producao` e PCP; modelo produzido atualiza `producao.modelo`; saque é gravado na API PCP e sincronizado a cada 30 s. |
| Inspeção Setor 3 e 4 | Lista postes produzidos e abre primeira ou segunda inspeção, checklist e fotos. | Lê `producao` e `montagem_poste`; decisões gravam `montagem_poste`. |
| Montagem Postes | Lista montagem/inspeção, KPIs, checklist, fotos e segunda inspeção. | Lê `producao` e `montagem_poste`; grava `montagem_poste`. |
| Sequência Setor 3 | Seleciona modelos por forma e data; salva a sequência. | Lê/grava `prog_s3_s4`; cache `pwa_prog_s3_s4_v1`. |
| Dashboard montagem | Mostra indicadores e gráficos de montagem, qualidade e produtividade. | Lê `montagem_poste` e `producao`; exporta arquivos no dispositivo. |
| Dashboard Defeitos | Analisa defeitos por período, setor e escopo; oferece CSV e apresentação 4:3. | Lê `montagem_poste` e `producao`; exporta no dispositivo. |
| Produtividade | Mostra resumo, produção, qualidade, produtividade e dados, com CSV, Excel e PDF. | Lê `producao` e `montagem_poste`; exporta no dispositivo. |
| Relatório Enc. Produção | Gera relatório diário ou setorial para imprimir ou compartilhar. | Lê produção, programação e liberação; saída local. |
| Histórico | Filtra eventos por data, setor e forma. | Lê dados operacionais remotos e cache local. |
| Acmp. Concretagem | Acompanha concretagem, permite carregar, anotar e imprimir. | Lê `producao`; observações locais em `pwa_acmp_notas_v1`. |
| Manutenção Formas | Consulta formas paradas e liberadas, histórico e PDF. | Lê/grava `formas_manutencao`; cache `mapa_formas_manutencao_v1`. |
| Tratativa Defeitos | Consolida ocorrências, registra tratativas e imprime PDF. | Lê inspeções/montagens; tratativas locais em `mapa_tratativa_defeitos_v1`. |
| Usuários | Lista, cria, atualiza e desativa contas conforme a permissão. | Supabase `usuarios`; sessão local `pwa_mapa_auth_session_v1`; guarda `/auth/`. |

## Controles principais por fluxo

- **Produção e quiosques:** tocar numa forma programa, libera ou registra a concretagem conforme o modo ativo. O quiosque oferece sincronização, tela cheia e saída. O modal de concreto registra tipo e operador.
- **Mandril Circular:** selecionar a data carrega formas e saques do banco. **Sacar Mandril** grava data e hora na API PCP; **Limpar Saque** remove o registro; **Atualizar saques** força a consulta. A tela atualiza os horários automaticamente a cada 30 segundos enquanto estiver aberta. Registros antigos do navegador são importados quando ainda faltam no banco.
- **Inspeção Setor 3 e 4:** filtros de data, setor, forma e resultado. **Carregar postes produzidos** consulta as formas. Clicar num poste pendente abre a primeira inspeção; clicar num finalizado abre checklist, fotos e eventual segunda inspeção. **Salvar** registra checklist, fotos e resultado em `montagem_poste`.
- **Montagem Postes:** filtros e KPIs. Clicar num poste pendente abre a montagem; clicar num finalizado abre detalhes, fotos e eventual segunda inspeção. **Salvar** grava a primeira avaliação em `montagem_poste`.
- **Sequência Setor 3:** selecionar data e modelos por forma; o botão flutuante **Salvar Programação** grava `prog_s3_s4`.
- **Dashboards:** filtros e abas recarregam consultas; CSV, XLSX, Excel e PDF geram arquivos no dispositivo. A apresentação 4:3 é uma visualização do Dashboard Defeitos.
- **Relatórios e histórico:** filtros alteram a consulta; imprimir e compartilhar geram saída no dispositivo. Notas de acompanhamento e tratativas ficam no `localStorage` indicado na tabela.
- **Manutenção e usuários:** ações de salvar, liberar ou atualizar gravam nas tabelas indicadas; o acesso depende do perfil.

## Fluxo de inspeção dos postes

A primeira avaliação oferece **Aprovado** (`A`) ou **Reprovado** (`R`). Um poste reprovado e finalizado abre segunda inspeção ao clicar na linha ou no botão de fotos. A segunda inspeção oferece **Segregado** (permanece `R`) e **Aprovado e Retrabalhado** (`RR`). O resultado, a data, o responsável e o código original `R` ficam em `montagem_poste.checklists.__segunda_inspecao`. Os códigos `A`, `R` e `RR` continuam sendo usados pelas métricas existentes. A atualização no banco exige que o registro ainda esteja em `R`, para evitar sobrescrever outra decisão simultânea.

As fotos das falhas novas ficam no JSON `checklists` de `montagem_poste`, em campos terminados em `_photo`. Ao abrir um poste finalizado, as miniaturas aparecem no checklist; clicar amplia a foto na própria página. A API legada de fotos separadas usa HTTP e não pode ser consultada diretamente por esta página HTTPS. Quando não há foto no checklist, a tela informa essa limitação.

## Publicação e verificação

O código de produção fica em `/mapa-concretagem/`, versão v5.29. O Service Worker usa cache próprio desta versão. A navegação dos 18 ícones e dos 19 links, o menu lateral, a visualização de fotos, a persistência simulada das duas opções da segunda inspeção e os contratos do mandril foram verificados por testes automatizados. Nenhum registro operacional real foi alterado na verificação.
