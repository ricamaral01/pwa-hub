# T0 — Mapeamento de Produção Pederneiras

Levantamento somente leitura feito no código e no PostgreSQL da VPS nova em 23/10/2026. Nenhuma tabela ou dado operacional foi alterado.

## Produção Campinas hoje

- O menu do Unificado está em `unificado/shell/menu.config.js`, módulo `producao`. Contém Produção, Montagem, Controle e Indicadores. As telas são modos de `unificado/mapa/operacao/`; a navegação do shell usa `?view=mapa/operacao/?tela=...`.
- O catálogo autorizativo fica em `unificado/mapa/api/screen_catalog.json`, com verificações em `screen_access.py` e `/unified/screen-access/me`. Mover rótulos de menu não pode mudar IDs de tela nem URLs antigas. `unificado-bridge.js` também mantém menu interno do Mapa.
- Não há agrupamento por unidade no modelo atual de Produção. A unidade Campinas é implícita. A operação de Pederneiras não deve gravar nas tabelas atuais sem `unidade_id` e isolamento de permissão.

## Mão de Obra Campinas

- Front desktop: `unificado/pcp/maodeobra/index.html`. PWA dedicado: `unificado/m/maodeobra/`, com `manifest.webmanifest`, `sw.js`, `entry.js` e componentes compartilhados `unificado/pcp/static/js/maodeobra-core.js` e `maodeobra-mobile.js`.
- API: `unificado/pcp/backend/app/api/routers/pcp.py`, rotas `/maodeobra`, `/maodeobra/dia`, `/maodeobra/resumo`, `/maodeobra/grupo`, `/maodeobra/grupo/confirmar` e `/atividades-maodeobra`.
- Modelo: `AtividadeMaoDeObra`, `MaoDeObra`, `MaoDeObraRateio` e `MaoDeObraDia` em `app/models/producao.py`. Os grupos `12` e `34` são parte da chave do dia; registros usam `data` e `atividade_id`. As migrations atuais são arquivos SQL versionados, com rollback para confirmação e metadados móveis.
- A consulta somente leitura a `pcp_unificado_teste` confirmou que `maodeobra`, `maodeobra_dias` e `produtos` estão no schema `public`; nenhuma coluna `unidade_id` foi encontrada nesse banco. Não foi encontrado catálogo central de unidades em `pcp_unificado_teste`, `concretrack_auth` nem `concretrack_postes_unificado` por nome de tabela.

## Seed e dados faltantes

- `seed/seed_produtos_pederneiras.csv` já existe: 112 produtos em 9 famílias; 23 linhas com pendência, 85 sem letra, 1 código Pro vazio e letra `P` duplicada. O arquivo não tem `volume_m3`; importar volume exige cadastro posterior ou tabela validada.
- A planilha LT-PRO-04 de outubro/2026 não está no repositório nem nos anexos recebidos. A paridade T11 depende dela. A classificação inicial MOD/MOI e o gestor de Pederneiras seguem pendentes de confirmação conforme o documento de requisitos.

## Auditoria, IAM e proposta de modelo

- O Mapa usa `public.mapa_operation_audit` para algumas ações; o PCP não oferece uma auditoria genérica de alterações de Mão de Obra ou produtos. A nova produção precisa registrar entidade, campo, valor anterior e novo, autor, origem e instante em transação única com a alteração.
- Criar catálogo `producao.unidade` com chave estável e vincular usuários por unidade e perfil. Começar com Campinas e Pederneiras. A API deve validar a unidade autorizada no servidor; o parâmetro da URL não concede acesso.
- Criar `producao.produto`, `apontamento_dia`, `apontamento_item`, `meta_producao` e `auditoria` com `unidade_id`, como no requisito, mas adiar a unicidade de `letra` até a limpeza do seed. Usar índice único parcial em `(unidade_id,cod_pro)` quando presente. Registrar volume como `NULL` até validado.
- Para Mão de Obra, expandir as tabelas existentes com `unidade_id` e backfill Campinas; introduzir área por unidade com tipo MOD/MOI configurável. Preservar IDs e respostas da API Campinas. Só aplicar `NOT NULL` e novas chaves compostas após verificar paridade do backfill e adaptar todos os escritores.
- As migrations de PCP hoje não usam Alembic. Antes de T2, integrar Alembic ao serviço existente ou documentar formalmente uma migração SQL reversível equivalente; misturar dois controles sem estado comum aumentaria o risco de divergência.

## Evidências verificáveis

- Código: `unificado/shell/menu.config.js`, `unificado/mapa/api/screen_access.py`, `unificado/pcp/backend/app/models/producao.py`, `unificado/pcp/backend/app/api/routers/pcp.py`, `unificado/m/maodeobra/manifest.webmanifest` e `unificado/m/maodeobra/sw.js`.
- Banco: consultas somente leitura a `information_schema.tables` e `information_schema.columns` em `pcp_unificado_teste`, `concretrack_auth` e `concretrack_postes_unificado`.
- Seed: leitura CSV UTF-8, contagem por família e verificação de duplicidade de letra/códigos.
