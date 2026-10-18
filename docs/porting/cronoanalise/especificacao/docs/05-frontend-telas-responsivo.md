# 05 · Frontend: telas do submódulo dentro da casca do Unificado

O submódulo **usa a casca do Unificado**: menu lateral modelo A (módulos em lista) no PC e no tablet, logos Concrefer e "C" ConcreTrack, bolinha amarela do Laboratório, cabeçalho, seletor de unidade, usuário e modo PWA do Unificado. Não criar menu lateral, logotipo, login ou cabeçalho próprios.

Os mockups em `reference/mockups/*.dc.html` foram desenhados com uma barra lateral "CronoTrack" provisória: **use deles só a área de conteúdo** (cards, tabelas, cronômetros, painéis). A barra lateral e o cabeçalho vêm do Unificado.

Referências:
- `reference/mockups/*.dc.html` — conteúdo das telas (desktop 1440, tablet 1194×834, celular 390×844). Abrir no navegador.
- `reference/visual-referencia/*.jpg` — padrão de marca ConcreTrack.
- `reference/cronotrack_app_prototipo.html` — protótipo funcional (comportamento da coleta, fila offline, telas).
- `reference/metodologia.html` — conteúdo da tela Metodologia (mesmo texto).

## Tokens de design

Se o Unificado já tem tokens/tema, use os dele; os abaixo são a referência de cores do submódulo e batem com a marca ConcreTrack.

```css
:root{
  --navy:#0E1B33;      /* menu lateral, cabeçalhos escuros, cards de destaque */
  --navy-2:#16264A;    /* avatar, superfícies sobre navy */
  --red:#C8102E;       /* ação primária, item ativo do menu, códigos de atividade */
  --red-ink:#A50D26;   /* hover, texto vermelho sobre claro */
  --amber:#F2B300;     /* ícones, bordas de filtro, número em destaque sobre navy */
  --amber-soft:#FFF4D1;/* fundo de ícone, avisos */
  --bg:#EDF1F6;        /* fundo da aplicação */
  --surface:#FFFFFF;   /* cards */
  --surface-2:#F5F7FA; /* cabeçalho de tabela, caixas internas */
  --line:#DCE3EC;      /* bordas */
  --fg:#101828; --muted:#5B6779;
  --good:#1F8A4C; --good-soft:#E3F4EA;   /* válida, ok, iniciar cronômetro */
  --warn-soft:#FFF4D1; --warn:#8A6300;   /* faltam poucas, pausado */
  --crit-soft:#FDE4E8; --crit:#A50D26;   /* faltam muitas, invalidada */
}
```
Fontes: **Manrope** (interface, 500–800) e **IBM Plex Mono** (números, cronômetros, tabelas numéricas, `font-variant-numeric: tabular-nums`). Raio 10–14 px. Se o Unificado usa outras fontes, prevalecem as do Unificado. Sem logotipo próprio: o título da tela é "Cronoanálise".

## Três modos

Seguir os modos do Unificado:

| Modo | Navegação | Uso típico |
| --- | --- | --- |
| Celular (PWA do Unificado) | Mesmo padrão das telas PWA que já existem; dentro do submódulo, barra inferior com Início, Coletar, Medições, Simular | Cronometrista no pátio |
| Tablet | Menu lateral do Unificado (recolhível, só ícones) | Tablet fixo no setor, vários cronômetros |
| PC | Menu lateral do Unificado aberto | Engenharia, análise, simulação |

Regras: alvos de toque ≥ 44 px (botões de cronômetro ≥ 48 px); nenhum scroll horizontal da página (tabelas largas rolam no próprio contêiner); cronômetros em fonte mono grande (44 px tablet, 72 px na tela de finalizar no celular); pedir `screen.wakeLock` durante cronômetros ativos e ignorar recusa (só funciona com HTTPS). Não alterar as telas PWA de outros módulos.

## Telas

1. **Início** — KPIs (medições válidas, atividades com amostra suficiente x/40, cronômetros ativos, fim da concretagem da última simulação salva), atalhos (Cronometrar, Dimensionar, Simular, Metodologia), tabela "Onde a amostra mais falta", mini gráfico de fim por sequência.
2. **Coletar** — contexto (etapa em botões-pílula, setor, forma, tipo de poste com lista dos já usados, equipamento, batelada, cronometrista); lista de atividades da etapa com código, nome, selo de amostra (medidas/necessárias; vermelho < 10, amarelo faltando, verde ok), ponto de início/fim, seletor de pessoas (−/+), botão verde **Iniciar**; painel **Em andamento** com vários cronômetros: Pausar (exige motivo da lista), Retomar, Finalizar → painel de finalizar (distância obrigatória em deslocamentos, observação, Salvar, Voltar ao cronômetro, Descartar com 2º toque). No tablet: lista à esquerda e cronômetros à direita. No celular: cronômetro ativo vira cartão no topo; finalizar abre tela própria.
3. **Medições** — filtros (etapa em pílulas, atividade, setor, dia, situação), tabela, painel lateral de detalhe com histórico e **Invalidar** (motivo obrigatório) / **Restaurar**; exportar CSV/XLSX.
4. **Catálogo** — tabela editável por etapa (nome, tipo, pessoas, estimativa, por caçamba, começa quando, termina quando, ativo). Salvar grava auditoria.
5. **Dimensionar** — parâmetros à esquerda (expediente, intervalos, demanda, pessoas hoje, tolerâncias, η, confiança, erro, regra de anormais); resultado (pessoas necessárias em destaque navy/amarelo, takt, conteúdo de trabalho, capacidade); carga por etapa; tabela por atividade (usar, n, TO, CV, amostra, pessoas, ritmo editável, TN, TP, frequência editável, homem-min/forma) agrupada por etapa.
6. **Simular** — abas: **Base × cenário** (parâmetros lado a lado; campo do cenário diferente da base destacado), **Sequências** (6 sequências com recomendação), **Layout** (tabela dos 4 setores + velocidades medidas/estimadas), **Tempos** (origem medido/estimativa de cada atividade), **Histórico** (rodadas salvas). Resultado: fim da concretagem com IC 95% e diferença para a base, fim da montagem, hora extra, última forma liberada, esperas de acabamento/carimbo, pinos fora do horário, interferência; linha do tempo por setor (desforma, montagem, concretagem, pinos); ocupação por recurso (barra vermelha > 85%). Rodar num **Web Worker** com barra de progresso; salvar rodada (permissão analisar).
7. **Metodologia** — conteúdo de `reference/metodologia.html`, com índice lateral (desktop) ou no topo (celular).
8. **Fila offline** — acessível pelo chip de sincronização: medições ainda no aparelho, reenviar, versão do app.

Login, perfil e usuários são os do Unificado (caixas de permissão do submódulo em `docs/04`).

## Indicador de sincronização (todas as telas)

Chip no topo: "sincronizado · N" (verde), "N enviando…" (amarelo), "sem conexão · N no aparelho" (vermelho). Ao tocar, mostra a fila.

## PWA

Usar o manifesto e o service worker do Unificado; acrescentar ao cache a tela de coleta e a metodologia do submódulo. API nunca em cache. IndexedDB (banco próprio `cronoanalise`, para não misturar com outros módulos): `cronometros_ativos`, `fila_envio`, `contexto`, `pessoas_por_atividade`. Ao reabrir, cronômetros ativos continuam (tempo = agora − início − pausas).
