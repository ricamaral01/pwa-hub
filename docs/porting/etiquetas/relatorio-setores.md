# Etiquetas: Padrão setores 1 e 2; SC setor 3

Data: 19/10/2026. Homologação `:18446` e produção em `concrefer.concretrack.com.br`.

## Alteração

- Padrão: o seletor oferece apenas Todos (setores 1 e 2), Setor 1 e Setor 2. O carregador da página filtra os registros; o endpoint `/api/etiquetas-padrao/programacao` também restringe a consulta a esses setores, inclusive quando a requisição pede outro setor explicitamente.
- SC: o seletor permanece travado em Setor 3. O carregador SC usa os saques e formas circulares do Setor 3 e gera linhas com `setor_id: 3`. Não houve alteração em `etiquetas-sc/index.html`.
- Nenhum registro foi alterado no banco.

## Publicação e validação

O diretório público efetivo da homologação é `/opt/concrefer-unificado/homolog-next/public`. A primeira cópia estática foi feita em `/opt/concrefer-unificado/homolog/public`, que não é servido pelo NGINX. A validação HTTP detectou essa diferença antes da publicação em produção. Os arquivos desse diretório antigo foram restaurados; os arquivos servidos foram copiados após comparar os originais com o estágio. A API de homologação estava no caminho correto desde a primeira publicação.

| Ambiente | Padrão validado com dados | Resultado | Serviços |
| --- | --- | --- | --- |
| Homologação | 15/10/2026 | 13 registros; setores 1 e 2 | `unificado-homolog-pcp.service` ativo |
| Produção | 16/10/2026 | 10 registros; setores 1 e 2 | `pcp-unificado-test.service` ativo |

O smoke autenticado confirmou, em ambos os ambientes: Padrão sem opções 3/4, SC fixo em 3, JS publicado, resposta vazia para `setor_id=3` e `setor_id=4`. O backend Python passou em `py_compile`; os dois JS preparados passaram em `node --check`. Somente o serviço PCP de cada ambiente foi reiniciado. SC não precisou de reinício ou mudança própria.

| Arquivo publicado | SHA-256 homologação e produção |
| --- | --- |
| `pcp-api/app/api/routers/pcp.py` | `0eb144ef93be6029944c2ff953c812c0890b1080f07e677b2b6dc4c0df025b87` |
| `public/unificado/pcp/etiquetas/index.html` | `951cddcc8b1aba3d1c1f7d544a7a96bc6d9dcf9f5b4000d76a3863bcc466fc44` |
| `public/unificado/pcp/static/js/etiquetas.js` | `022d43b4a8f1fd23c470f3506e74cc4b675417da68a4cba8390dc0da5ddd4c04` |
| `public/unificado/pcp/etiquetas-sc/index.html` (sem alteração) | `41624ed8876461f9cff3a556c2853179af82df2e78bdf4420e2f0bbb30dba702` |

Backups anteriores à alteração: `/opt/concrefer-unificado/backups/etiquetas-setores-20261019-homolog/` e `/opt/concrefer-unificado/backups/etiquetas-setores-20261019-prod/`. O primeiro também contém `served-before/`, cópia dos arquivos estáticos efetivamente servidos na homologação.

Os arquivos locais de PCP já tinham mudanças não commitadas de outros trabalhos. Esta publicação aplicou apenas o filtro e o seletor sobre os arquivos atuais de cada ambiente, preservando as demais mudanças. Os scripts desta pasta registram exatamente o procedimento.
