# Fase 0 ? reconhecimento

- Branch: feat/padrao-visual-unificado, criada a partir de origin/main 77534fd0.
- Worktree isolada: C:\Users\Admin\Documents\pwa-hub-padrao-visual
- Diret?rio original preservado; 1.040 entradas em git status no in?cio.
- Vers?es: diret?rio original 1.4.2; publicado 1.4.6; homolog-next 1.1.10.
- 394 arquivos publicados trazidos para a c?pia isolada; diff por arquivo em sincronizacao-publicado.json. A main n?o continha esses arquivos de unificado/.
- Fontes dos frontends n?o presentes em main copiadas do diret?rio original, sem .env, node_modules ou dist. Nenhum arquivo original sobrescrito.
- Produ??o: 394 hashes registrados antes do trabalho. Homologa??o: 361 hashes registrados.
- Gate: UNIFICADO_BASE_URL=https://concrefer.concretrack.com.br:18446 PCP_ANON_EXPECTED=401 python tests/unificado/modelo_a_gate.py ? 7/7. O 401 ? a resposta existente de homologa??o, documentada antes de altera??es.

## Capturas e limites

- 26 telas capturadas nas quatro larguras solicitadas, al?m do login: 108 capturas de antes.
- Bloqueios funcionais anteriores ao trabalho registrados em BLOQUEIOS.md. A revis?o visual ainda n?o foi iniciada e nenhum arquivo de homologa??o foi substitu?do.
- Verifica??o final da fase 0: os 394 arquivos de produ??o permanecem com os mesmos hashes.

## Diff da sincroniza??o

A c?pia de main n?o tinha os arquivos publicados de `unificado/`. O diff preparado cont?m os 394 arquivos p?blicos e as fontes necess?rias copiadas separadamente, al?m da documenta??o e das capturas. O invent?rio completo est? em `arquivos-reconhecidos.txt`. N?o h? altera??es de comportamento ou visual nesta fase. Nenhuma publica??o, push ou PR foi feita.
