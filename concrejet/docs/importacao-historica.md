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

CSV e XLSX sao processados. XLS legado continua apenas identificado com aviso operacional; arquivos XLS protegidos ou binarios antigos devem ser convertidos para XLSX/CSV antes da importacao.

Fixtures validadas:

- `imports/historico/exemplos/apontamentos-exemplo.csv`
- `imports/historico/exemplos/apontamentos-uma-aba.xlsx`
- `imports/historico/exemplos/historico-multiplas-abas.xlsx`
