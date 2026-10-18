# 07 · Testes e critérios de aceite

Pronto só quando **todos** os itens passam. Cada tarefa do `PROMPT_CODEX.md` entrega sua evidência em `docs/porting/cronoanalise/` (saída de teste, print, comando). No fim, `docs/porting/cronoanalise/relatorio-aceite.md` reúne tudo.

## Automatizados

- [ ] pytest (backend do Unificado): permissões (sem sessão = 401; sem permissão = 403; cronometrista não edita catálogo), medições (lote idempotente, validações, invalidar/restaurar com auditoria, importar CSV do protótipo), estatística e dimensionamento batendo com `tests/golden.json → estatistica`.
- [ ] vitest: paridade do motor TypeScript com `tests/golden.json → casos` (18 casos, tolerância 1e−9); `parseRegra('1-20: 1/2; 21-40: 1; 41-52: 1,5')`; `formasSetor` gera 292 formas e 129 caçambas no layout padrão.
- [ ] Playwright com rede desligada: cronometrar 3 atividades, religar, conferir 3 linhas no banco e nenhuma duplicada ao reenviar.
- [ ] A suíte de testes que já existia no Unificado continua passando inteira.

## Funcionais (com print)

- [ ] Laboratório › Cronoanálise aparece no menu do Unificado (PC e tablet) com a bolinha amarela do Laboratório; no celular, as telas PWA do submódulo funcionam.
- [ ] PC 1440×900, tablet 1194×834 e celular 390×844: Início, Coletar, Medições, Dimensionar, Simular, Metodologia sem scroll horizontal e com o conteúdo dos mockups.
- [ ] Usuário só com "Cronoanálise: coletar" vê o Laboratório apenas com esse submódulo e consegue cronometrar; não vê as outras telas do Laboratório.
- [ ] Dois aparelhos cronometrando ao mesmo tempo; as medições aparecem para os dois, com o autor certo.
- [ ] Cronômetro continua certo após fechar e reabrir o app.
- [ ] Pausa exige motivo e é descontada; deslocamento exige distância.
- [ ] Invalidar exige motivo; medição invalidada sai da estatística e continua visível; restaurar volta.
- [ ] Importar o CSV do protótipo: medições aparecem, reimportar não duplica.
- [ ] Exportar CSV abre certo no Excel (acentos, vírgula decimal, `;`).
- [ ] Dimensionar sem medições mostra o resultado com aviso "estimativa".
- [ ] Simular: 6 sequências com 8 replicações em menos de 10 s num celular intermediário; base × cenário mostra diferença e IC; rodada salva aparece no Histórico.

## Não interferência (VPS 2.25.163.32)

- [ ] `deploy/00_inventario.sh` antes e depois: mesmos serviços, mesmas portas, mesmo status HTTP; Alembic avançou só pelas revisões do submódulo.
- [ ] PCP, Mapa, GED e as outras telas do Laboratório abrem e funcionam como antes (roteiro rápido com print de cada um).
- [ ] Nenhum usuário perdeu ou ganhou permissão fora das caixas novas do Cronoanálise.
- [ ] O backup do banco do Unificado inclui o schema `cronoanalise` (restaurar num banco temporário e contar as tabelas).
- [ ] Nada foi instalado ou alterado na VPS antiga 31.97.241.84.
