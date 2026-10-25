# Homologação do sistema unificado

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
