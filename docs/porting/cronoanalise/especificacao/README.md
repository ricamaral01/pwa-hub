# Laboratório › Cronoanálise · pacote de especificação para o Codex

Submódulo do Unificado ConcreTrack/Concrefer (VPS nova 2.25.163.32): cronoanálise → dimensionamento de mão de obra → simulação da fábrica de postes.

**Comece por `PROMPT_CODEX.md`** — é o prompt para colar no Codex, com a pasta copiada para `docs/porting/cronoanalise/especificacao/` no repositório `pwa-hub-fase1`.

| Pasta | Conteúdo |
| --- | --- |
| `PROMPT_CODEX.md` | Instrução mestre: tarefas T0–T7 com evidência, regras, quando parar |
| `docs/` | Processo da fábrica, integração no Unificado, schema `cronoanalise`, API, permissões, telas, motor, aceite |
| `seeds/` | Catálogo de 40 atividades, layout dos 4 setores, parâmetros e listas |
| `reference/engine.js` | Motor de simulação de referência (porte 1:1 para TypeScript) |
| `reference/cronotrack_app_prototipo.html` | Protótipo funcional (abrir no navegador) |
| `reference/metodologia.html` | Página de metodologia e memória de cálculo |
| `reference/mockups/` | Conteúdo das telas PC, tablet e celular (`.dc.html`) |
| `reference/visual-referencia/` | Mockups ConcreTrack que definem a marca |
| `tests/` | `gerar_golden.js` e `golden.json` (paridade do motor e exemplos de cálculo) |
| `deploy/00_inventario.sh` | Inventário somente leitura da VPS, antes e depois do deploy |
