# Mapeamento de importacao

Tabela principal: `import_mappings`.

O mapeamento guarda:

- nome do mapeamento;
- entidade de destino;
- versao;
- definicao em JSON;
- flag `ativo`.

Como nao ha arquivo historico real no repositorio, nenhum mapeamento definitivo de dominio foi aplicado. O framework mantem staging completo para validar formatos e reconciliar antes da importacao real.

