Testes contra PostgreSQL real e DESCARTÁVEL (os schemas insumos, estoque, carta_traco e erp_espelho são apagados):

    export PG_TEST_DSN="postgresql://postgres@localhost:5432/lab_teste"
    pytest -q tests/

`erp_espelho_exemplo.sql` imita o espelho do ERP (colunas do inventário). A etapa 1 confirma as colunas reais.
