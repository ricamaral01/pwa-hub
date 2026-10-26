# Correção dos acentos no ensaio de postes — 26/10/2026

## Diagnóstico

O pacote estático de `unificado/laboratorio/service/server/static/novo/postes/` continha uma mistura de texto UTF-8 correto e sequências recodificadas. O mesmo campo aparecia no pacote como `Número de série do poste` e `NÃºmero de sÃ©rie do poste`; a segunda ocorrência era usada na tela mostrada pelo usuário. A resposta do serviço declara `text/javascript; charset=utf-8`, portanto o defeito estava no conteúdo do pacote, e não no cabeçalho HTTP.

## Correção

- Corrigidas 225 sequências de codificação no pacote de ensaio de postes, incluindo o rótulo, mensagens, menus e símbolos. Nenhum caractere de substituição `U+FFFD` foi introduzido.
- Criado `novo-40b0590a4035.js`, com nome derivado do SHA-256 do conteúdo, e atualizado `novo.html` para usá-lo. O antigo pacote deixa de ser referenciado.
- Casca, service worker e `VERSION` atualizados de `1.0.102` para `1.0.103`, de modo que o PWA detecte a atualização.

## Verificação

| Checagem | Resultado |
| --- | --- |
| `node --check` do novo pacote, `shell.js` e `sw.js` | Aprovado |
| Varredura do novo pacote | Zero sequências de recodificação restantes; duas ocorrências corretas do rótulo |
| Chrome local com respostas de API simuladas | Formulário renderizado com “Número de série do poste”; sem erro de página |
| Captura visual | [Ensaio de postes corrigido](capturas/ensaio-postes-acento-corrigido.png) |
| Homologação `:18446` | `1.0.103`; nginx válido; serviço e pacote acessíveis |
| Produção | `1.0.103`; Home HTTP 200; serviços ativos; HTML e pacote acessíveis |
| SHA-256 do pacote | Local, homologação e produção: `40b0590a40352f8007c20e300c9525faf18ccb07340ed759eb936ca6c6fb5828` |
| Permissões instaladas | `www-data:www-data`, modo `644` para HTML e novo pacote |

O primeiro ensaio da publicação em homologação usou uma URL interna incorreta no smoke do HTML. O retorno automático restaurou o backup. Após corrigir a URL para `/novo/postes`, a homologação passou e a produção recebeu o mesmo pacote. Backups: `/opt/concrefer-unificado/backups/lab-postes-encoding-stage-20261026T124029Z` e `/opt/concrefer-unificado/backups/lab-postes-encoding-production-20261026T124044Z`.

Arquivos alterados: `unificado/VERSION`, `unificado/index.html`, `unificado/sw.js`, `unificado/shell/shell.js`, `unificado/laboratorio/service/server/static/novo/postes/novo.html`, pacote JavaScript renomeado, script de deploy e este relatório/captura.
