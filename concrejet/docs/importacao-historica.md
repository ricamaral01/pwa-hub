# Importacao historica

A Fase 7 cria um framework robusto de importacao sem importar dados de dominio quando arquivos e mapeamentos reais ainda nao existem.

Estrutura esperada:

- `../imports/historico/entrada`
- `../imports/historico/processados`
- `../imports/historico/rejeitados`
- `../imports/historico/relatorios`
- `../imports/historico/mapeamentos`
- `../imports/historico/exemplos`

Fluxo:

1. criar lote;
2. analisar arquivos;
3. registrar arquivos, abas e linhas;
4. executar dry-run;
5. reconciliar;
6. executar;
7. reverter quando necessario.

CSV e processado. XLS/XLSX sao identificados e registrados com aviso ate existirem arquivos reais e dependencia de parser aprovada.

