# Produção Ribeirão

Publicado em 27/10/2026 no Sistema Unificado, usando o domínio de produção por unidade já empregado por Pederneiras.

## Telas

- Desktop: `/unificado/?view=producao%2Fribeirao%2F%3Ftab%3Dapontamento` ou `/unificado/producao/ribeirao/`.
- PWA de produção: `/unificado/producao/ribeirao/app/`.
- PWA de mão de obra: `/unificado/producao/ribeirao/mao-de-obra/app/`.
- Abas: apontamento, mão de obra, produção mensal, indicadores e cadastro de produtos.

Cada PWA tem manifesto, ícone Ribeirão, escopo, service worker e fila local separados dos aplicativos de Pederneiras. O desktop e as APIs usam a autenticação do Unificado.

## Banco e carga inicial

- Unidade `ribeirao`, id 3, com passo de mão de obra de 0,01. Campinas e Pederneiras mantêm 0,25.
- 99 produtos importados da planilha enviada. Nenhum lançamento diário de produção ou mão de obra foi importado.
- Cinco áreas: Usina de Concreto, Produção, Fabricação Armação, Fabricação Estribo e Sacador núcleo. Produção e Sacador núcleo são MOD; as demais são MOI.
- Os volumes por peça não constam da planilha e ficam vazios. Dois produtos não têm Código Pro. O código `13.683` foi preservado como texto e marcado para conferência.
- Ricardo, Marcelo, Philippe e Alex têm acesso administrativo. Operadores futuros podem receber acesso por unidade e tela no cadastro de usuários.

## Reproduzir e conferir

`python scripts/build_ribeirao_seed.py <arquivo TSV>` gera somente o catálogo. `python scripts/seed_ribeirao.py` faz prévia; `--apply` exige `DATABASE_URL` e catálogo vazio.

`npm ci` e `npm run build` em `unificado/producao/ribeirao/frontend` geram as três interfaces. `python scripts/prune_ribeirao_build.py` remove hashes antigos. `python scripts/package_ribeirao.py` cria o pacote de runtime em `%TEMP%`.

Os scripts `deploy_production.sh`, `deploy_migration.sql`, `smoke_api.py` e `smoke_gateway.py` registram a publicação e os testes. O backup anterior à migração está em `/opt/concrefer-unificado/backups/ribeirao-20261027T172134Z/` no servidor.
