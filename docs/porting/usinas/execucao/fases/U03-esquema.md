# U03 — Esquema e permissões do espelho

**Resultado:** as migrações `001_receitas_homolog.sql` e `002_outbox_guard_homolog.sql` foram aplicadas em `mapa_unificado_homolog_20261016` na VPS nova. `usinas.receitas` conserva as 42 colunas de `tbl_receitas`, origem, unidade, ID, hash e instante de coleta. `usinas_write` está separado e com despacho desligado. O sincronizador possui DML no espelho; `mapa_api_login` possui apenas `SELECT` nas tabelas de leitura. Na VPS antiga, `usinas_mirror_ro` possui `SELECT` em `tbl_receitas`, sem DML nela, com acesso TLS restrito à VPS nova. A API, o CLP e a tabela oficial permanecem com o mesmo código/estrutura.

**Limite:** o esquema cobre somente `tbl_receitas` Campinas, em bancos separados de homologação e produção. O papel de origem herda `CREATE` no schema `public` pelo grant global a `PUBLIC`; os processos impõem transação somente leitura, mas o grant herdado exige revisão própria. Nenhuma tabela adicional recebeu `SELECT`.

**Publicação de leitura:** `003_receitas_producao_leitura.sql` criou o mesmo espelho em `mapa_unificado_teste`, banco da instância oficial. `mapa_api_login` tem SELECT e nenhum DML; `usinas-sync` faz o sync. Os dados da origem antiga não foram modificados. [Evidência](../DEPLOY-LEITURA-20261022.md).

## Pendências para aprovação

- Escolher tabela e unidade do próximo recorte de leitura para preparar migração/grants específicos. Isso não inclui escrita.
- Decidir após auditoria separada se o grant global `CREATE` em `public` pode ser revogado sem afetar aplicações legadas.
