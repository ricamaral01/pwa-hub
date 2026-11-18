# Homologação do sistema unificado

## Revisão visual em 18/11/2026 — fases 1 e 2

A porta **18446** está na versão **1.4.8**, com a base compartilhada e a casca
revistas. A execução parou ao concluir a fase 2 para revisão do usuário.
As fases 3–7 não foram iniciadas e não houve publicação em produção.

- Antes da fase 1, os endpoints publicados de acesso rápido e unidades de
  Armação foram alinhados em etapa separada. Armação tem instância própria em
  `homolog-next/armacao-api`, serviço `unificado-homolog-armacao.service`, porta
  **13168**, bancos PCP/Mapa de homologação e armazenamento próprio.
- Quatro migrações publicadas de Armação somente no PCP de homologação, DDL
  de duas tabelas de acesso rápido e de `user_units` no Mapa de homologação.
  Dumps prévios dos dois bancos em
  `homolog-next/backups/visual-endpoints-20261118T175103Z`.
  Não foram importadas configurações pessoais, atribuídas unidades ou semeadas
  permissões. Relatório: [pré-fase 1](revisao-visual-unificado/homolog/pre-fase-1/RELATORIO.md).
- Somente o vhost 18446 recebeu o encaminhamento para Armação. Houve backup,
  `nginx -t` aprovado e recarga; o vhost de produção permaneceu inalterado.
- Fase 1: **1.4.7**, tokens e Geist local, build React aprovado e gate 7/7.
- Fase 2: **1.4.8**, Início/menu/listas de módulos/login desktop; 24 capturas
  finais nas larguras 1440, 1024, 820 e 390, incluindo a prévia identificada
  do componente de acesso rápido. Login estreito preservado.
- Fases visuais publicadas por cópia de arquivos estáticos com backups,
  conferência de hashes e retorno em caso de erro, sem reinício de APIs/bancos.
- Gate final **7/7**, quatro perfis conferidos e reimpressões PDF idênticas.
  Service worker atualizou 1.4.7 → 1.4.8 sem limpeza manual de cache.
- Auditoria: 394 arquivos de produção e PIDs/vhost preservados; contas,
  concessões e vínculos de identidade iguais aos backups.

Relatório e roteiro: [fase 2](revisao-visual-unificado/homolog/fase-2/RELATORIO.md).
Capturas antes/depois: [galeria](revisao-visual-unificado/homolog/fase-2/galeria.html).
Os textos abaixo registram o histórico anterior desta montagem.

## Atualização funcional de 18/11/2026 — fase 0.5

A casca e os arquivos necessários do Planejamento na porta **18446** foram
sincronizados com os arquivos efetivamente publicados da versão **1.4.6**,
sem iniciar a revisão visual. O PCP de homologação passou a fornecer as APIs
de Números de série do Setor 3, Programação da semana S1/S2 e Programação de
armaduras/relatórios.

- Código PCP: `/opt/concrefer-unificado/homolog-next/pcp-api`, serviço
  `unificado-homolog-pcp.service`, porta **13154**.
- Catálogo de telas: `screen_access.py` e `screen_catalog.json` publicados,
  em `homolog-next/mapa-api`, serviço `unificado-homolog-mapa.service`, porta
  **13152**. O `app.py`, cookies e configurações isoladas foram preservados.
- Banco alterado: **somente** `pcp_unificado_homolog_20261016`. Foram aplicadas
  as 19 revisões publicadas de `20261023_01` até **`20261111_04`**.
- Banco Mapa: `mapa_unificado_homolog_20261016`, sem migração nesta etapa.
- Backups verificados de ambos os bancos e dos arquivos substituídos:
  `/opt/concrefer-unificado/homolog-next/backups/padrao-visual-fase-0.5-20261118T171811Z`.
  Há também o backup da primeira tentativa em `...-20261118T171548Z`.
- Bibliotecas adicionadas somente ao Python de homologação, nas versões
  publicadas: Alembic 1.14.1, Mako 1.4.3, MarkupSafe 3.0.4, ReportLab 4.4.4,
  Pillow 12.3.0, openpyxl 3.1.5 e et_xmlfile 2.0.0.
- Nenhuma configuração Nginx foi alterada ou recarregada. Somente os dois
  serviços de homologação acima foram parados/iniciados.
- Perfis de usuários, 667 concessões de telas, 21 concessões de ações e
  17 vínculos de identidade foram comparados com os dumps e preservados.
- Os testes só usam a origem **18446**. O endpoint legado de leitura do Mapa
  continua local em **13153**; os DSNs conferidos apontam aos bancos de
  homologação. Não houve conexão a banco de produção ou integração externa
  de escrita. Os hashes e PIDs dos serviços de produção não mudaram.

Foram validadas as três telas nos perfis ADMIN/gerência, PCP, produção e
consulta, com recusa das escritas não permitidas. A semana **07/01/2030** foi
criada como dado de teste, salva, validada e publicada com um poste. Foram
emitidos PDFs de armaduras e séries; as reimpressões devolveram bytes
idênticos. Não houve atribuição de número definitivo a produção real.

O gate continua sendo:

```powershell
$env:UNIFICADO_BASE_URL='https://concrefer.concretrack.com.br:18446'
$env:PCP_ANON_EXPECTED='401'
python tests/unificado/modelo_a_gate.py
```

Resultado: **7/7**. O 401 anônimo é o comportamento já existente da camada
de proteção da homologação, não uma flexibilização do gate.

Relatório, migrações, inventário, capturas e limites restantes:
[`docs/revisao-visual-unificado/homolog/fase-0.5/RELATORIO.md`](revisao-visual-unificado/homolog/fase-0.5/RELATORIO.md).
As fases visuais 1–7 aguardam o ok do usuário. Os parágrafos históricos abaixo
descrevem a montagem anterior; não indicam que toda a homologação já esteja
equiparada à produção em todos os módulos.

## Endereços

- Homologação: `https://concrefer.concretrack.com.br:18446/unificado/`
- Produção: `https://concrefer.concretrack.com.br/unificado/`

A porta 18446 é uma origem separada. O service worker e o armazenamento do
navegador da homologação não controlam nem compartilham o cache da produção.
A cópia atual da casca e dos módulos fica em
`/opt/concrefer-unificado/homolog-next/public/unificado`. As telas de entrada e
início exibem uma faixa de ambiente de teste. A árvore anterior em
`/opt/concrefer-unificado/homolog` permanece como referência do Laboratório.

O Laboratório de homologação usa `laboratorio-homolog.service` na porta local
13065, código em `/opt/concrefer-unificado/homolog/laboratorio/service`, banco
`concretrack_postes_homolog` e uploads em
`/opt/concrefer-unificado/homolog/data/postes_uploads`. O banco foi clonado do
banco realmente usado pelo processo de produção em 08/10/2026,
`concretrack_postes`. O acesso às leituras do monitor de cura é somente leitura;
as rotas de ingestão de dispositivos não são publicadas na homologação.

Em 16/10/2026, a homologação foi completada com serviços, dados e caminhos
próprios na mesma VPS. O vhost da porta 18446 usa apenas os serviços locais
13115 (hub), 13152 (Mapa e autenticação), 13154 (PCP), 13160 (realtime),
13166 (Qualidade), 13170/13171 (GED) e 13065 (Laboratório). As regras do Nginx
foram copiadas da produção com destinos de teste. O `nginx -t` passou antes da
troca do vhost.

| Módulo | Banco de homologação | Arquivos de homologação |
| --- | --- | --- |
| Mapa | `mapa_unificado_homolog_20261016` | `homolog-next/mapa-api`, armazenamento de fotos próprio |
| PCP | `pcp_unificado_homolog_20261016` | `homolog-next/pcp-api` |
| Qualidade | `qualidade_homolog_20261016` | `homolog-next/qualidade/service` e `homolog-next/qualidade/uploads` |
| GED | `ged_concrefer_homolog` em Postgres Docker próprio | `homolog-next/ged/uploads` |
| Hub | `concretrack_auth_homolog_20261016` e três bancos `supervisorio_db_*_homolog_20261016` | `homolog-next/hub-api` |
| Laboratório | `concretrack_postes_homolog` | `homolog/laboratorio/service` e `homolog/data/postes_uploads` |

Os bancos GED e Qualidade foram restaurados de cópias da produção feitas para
esta montagem; o vínculo GED ativo na cópia é somente o de `user-ricardo`.
Os dumps ficam em `homolog/backups/20261016` na VPS. As strings de conexão
auditadas apontam para os bancos acima, sem imprimir credenciais. O serviço
Qualidade usa o papel exclusivo `qualidade_homolog_app`, restrito no
`pg_hba.conf` ao banco de teste. O SMTP do GED está desativado (porta local 9),
e nenhuma rotina de envio de e-mail da Qualidade foi iniciada. Integrações
externas de escrita do PCP/Mapa foram esvaziadas ou direcionadas a destinos
locais sem serviço. As chamadas do navegador são limitadas à origem de teste.
As cópias de arquivos têm o mesmo hash de árvore da produção: SPA Qualidade
`9df1fd13c11a531c4c2c…` (9 arquivos), anexos Qualidade vazios em ambas as
origens, uploads GED `606fa55cd954775af29f…` (52 arquivos) e fotos Mapa
`7fa9483a70b38a9c56f6…` (87 arquivos).

O frontend e o backend GED da homologação e os publicados em produção após a
correção do pisca usam os mesmos digests Docker, respectivamente
`sha256:1093e3dc5d3f…` e `sha256:ea49fecc2071…`. A configuração da
homologação fornece endereços e cookies de teste a essas imagens. O serviço
Qualidade da homologação tem adaptação de configuração para o banco isolado;
seu hash ainda difere do publicado em produção. A
casca de produção está em 1.0.11; a 1.0.12 candidata, com quadro oculto até
o evento `unificado-ged-ready`, está somente na porta 18446 para a janela das
20h–21h. Os demais arquivos estáticos foram copiados da versão publicada antes
das alterações candidatas. O gate de sete casos executado com
`UNIFICADO_BASE_URL=https://concrefer.concretrack.com.br:18446` passou 7/7.
O SPA Qualidade autenticado e `/api/contexto` responderam 200; o WebSocket
realtime do Mapa abriu autenticado pela origem de teste.

## Fluxo de publicação

1. Implementar no repositório e incrementar `unificado/VERSION`, as URLs com
   `?v=` no HTML/roteador e o identificador de cache em `unificado/sw.js`.
2. Copiar somente os arquivos alterados para a árvore `homolog-next` e aplicar
   `scripts/mark_unificado_homolog.py` após copiar `index.html` ou `login.html`.
3. Validar a interface, a atualização do service worker, as permissões e os
   fluxos do módulo alterado na porta 18446. Executar o gate 7/7 com
   `UNIFICADO_BASE_URL` apontando para a porta 18446.
4. Fazer backup dos arquivos de produção afetados. Publicar exatamente os
   arquivos validados na homologação, sem a faixa de teste, na árvore
   `/opt/concrefer-unificado/public/unificado` e verificar a URL de produção.

Após os testes, publicar exatamente a versão aprovada e repetir smoke e gate
na produção. Qualquer falha exige retorno aos arquivos, imagens e configuração
de Nginx salvos antes da troca.
