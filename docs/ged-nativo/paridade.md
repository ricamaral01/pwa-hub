# GED nativo — paridade de Documentos

**15/10/2026. Estado:** protótipo local para gate visual. A frente nativa não foi publicada. O GED Next em `/unificado/ged/` continua como sistema em uso.

## Base conferida

O GED destino tem 32 documentos e 35 versões no dump final. A tela de ensaio usa metadados de `IT-CQC-03` (revisões 1 e 2, `.doc`) e `FL-SGQ-01` (revisão 1, `.xls`), além de uma linha claramente demonstrativa. Os estados de ciência e as linhas de leitura no protótipo são demonstrações e não representam ações ou registros do banco. Nenhuma requisição do protótipo alcança produção.

| Recurso | GED em uso | Exigência para paridade nativa |
|---|---|---|
| Lista e busca | `GET /api/documents`, com filtros por nome, área e situação | Preservar escopo de empresa, visibilidade, ordenação, estados e permissões por usuário. |
| Detalhe | `GET /api/documents/:id` | Mostrar metadados e revisão atual sem expor documento de outra empresa ou sem permissão. |
| Versões | `GET /api/documents/:id/versions` | Preservar número da revisão, arquivo, formato, histórico e caminho obsoleto; conferir SHA-256 dos arquivos amostrados. |
| Prévia Office | `GET /api/documents/:id/versions/:versionId/preview-link` | Solicitar URL HMAC temporária somente após autorização; nunca gravar token em URL de navegação, captura ou log. |
| Ciência | `GET /api/read-logs/:id/my-status`, `POST /api/read-logs` | Vincular ciência à versão vigente e ao usuário GED; confirmar escrita, idempotência e auditoria antes de habilitar o botão. |
| Leituras | `GET /api/read-logs/:documentId` | Mostrar pessoas e horários segundo o RBAC do GED, inclusive negação 401/403. |

## Gate visual entregue

O [protótipo de Documentos](../../unificado/ged-nativo/teste/index.html) oferece lista com busca e filtro, detalhe, histórico de versões, estado de ciência e leituras. O botão de confirmação fica desabilitado até integrar autenticação, escrita e auditoria. Seis capturas do ensaio local:

| Tela | Desktop | Celular |
|---|---|---|
| Lista | [Captura](capturas/documentos-lista-desktop.png) | [Captura](capturas/documentos-lista-celular.png) |
| Detalhe | [Captura](capturas/documentos-detalhe-desktop.png) | [Captura](capturas/documentos-detalhe-celular.png) |
| Ciência e leituras de demonstração | [Captura](capturas/documentos-ciencia-leituras-desktop.png) | [Captura](capturas/documentos-ciencia-leituras-celular.png) |

`node --check` passou. O [smoke visual](../../tests/unificado/ged_nativo_visual_smoke.py) passou em 1440 × 900 e 390 × 844: três linhas, detalhe com duas versões, estados de ciência pendente e confirmada, leitura de demonstração, botão desabilitado, sem rolagem horizontal e **zero chamadas à produção**.

## Falta para a troca futura

1. Conectar a lista e o detalhe à ponte de identidade aprovada e à API real, sem segundo login.
2. Aplicar integralmente o RBAC GED existente, inclusive exceções por documento e empresa.
3. Integrar prévia e download com os links assinados já usados pelo GED, além de ciência e leituras com auditoria.
4. Comparar os quatro usuários reais, as 32 linhas e 35 versões, uma amostra de arquivos por SHA-256, a navegação no tablet/celular e os erros 401/403/404.
5. Planejar publicação e retorno em janela separada após aprovação visual. O protótipo não muda Nginx, banco, frontend Next ou shell de produção.
