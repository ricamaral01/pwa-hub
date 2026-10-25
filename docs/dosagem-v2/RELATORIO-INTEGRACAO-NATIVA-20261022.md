# Dosagem v2 nativa no Unificado — 22/10/2026

## Estado publicado

- URL: `https://concrefer.concretrack.com.br/unificado/?view=laboratorio%2Fdosagem%2F`
- Versão da casca: `1.0.35`.
- A Dosagem é montada no documento do Unificado, sem iframe e sem abrir outro site. O menu Laboratório apresenta 14 destinos da Dosagem, incluindo Empacotamento, Volume, Comparação, Traços, cadastros, Produção, Importação e Configurações.
- A sessão e a autorização passam pelo gateway do Unificado. O papel da Dosagem é assinado pelo gateway: superusuários do Unificado recebem `admin`; responsáveis de engenharia recebem `engenheiro`; demais pessoas autorizadas no Laboratório recebem `laboratorista`.
- API própria em `concrefer-dosagem-native.service`, vinculada somente a `127.0.0.1:13067`. Nginx exige `auth_request` do Laboratório antes de servir o pacote nativo ou encaminhar a API; a API verifica assinatura HMAC, prazo e escopo.
- O PostgreSQL é o mesmo do Unificado, banco `mapa_unificado_teste`, esquema `dosagem`, com role exclusiva `dosagem_native_app` e `search_path=dosagem`.

## Dados

Foi restaurado um dump novo do banco `concretrack_dosagem` da VPS antiga. A restauração conservou as colunas `piloto` e todos os registros. Contagens importadas: 2 usuários, 2 eventos de auditoria, 2 credenciais locais, 14 sessões, 4 fluxos de autenticação; as demais tabelas, inclusive `documentos`, `material_versoes` e `traco_versoes`, estavam vazias. Após o acesso nativo, há um terceiro usuário no esquema: a identidade de Ricardo vinculada ao Unificado. A conferência posterior encontrou 0 documentos na origem e no destino, e as contagens de usuários e auditoria da origem permaneceram iguais às do dump.

O dump de origem permanece protegido em `/root/dosagem-native-source.dump` na VPS nova. O esquema vazio antes da importação foi salvo em `/tmp/dosagem-native-empty-before-import.dump`. Nenhuma tabela de outros módulos foi modificada pela restauração.

## Validação

| Verificação | Resultado |
| --- | --- |
| `npx tsc --noEmit` e `npx vite build --config vite.native.config.ts` | passaram |
| `npm run build` do menu Modelo A | passou |
| `pytest` do gateway e do modo piloto | 7 testes passaram |
| `nginx -t` e serviços `mapa-unificado-auth`/`concrefer-dosagem-native` | configuração válida; ambos ativos |
| Navegador autenticado, desktop | 14 links, visão geral, Empacotamento, Volume e Traços; 0 iframes ativos; sem erros de página |
| Navegação pelo conteúdo e pelo menu | rota e item ativo sincronizados |
| API autenticada | sessão HTTP 200, papel `admin`, `usuarios.listar` HTTP 200 |
| API sem sessão | redirecionamento para login HTTP 302 |
| Impressão | menu do Unificado oculto; carta visível; área da Dosagem sem corte por rolagem |
| Celular, 390 px | tela Volume abriu dentro do Unificado |

Capturas: [visão geral](capturas/nativo-unificado-20261022/visao-geral.png), [empacotamento](capturas/nativo-unificado-20261022/empacotamento.png), [volume](capturas/nativo-unificado-20261022/volume.png) e [volume no celular](capturas/nativo-unificado-20261022/volume-celular.png). Roteiro de conferência: `dosagem-concreto-v2/tests/e2e/native-unificado-smoke.mjs`.

## Retorno e limites

O arquivo `/root/unificado-before-dosagem-native-20261022.tar.gz` contém a casca anterior à primeira publicação nativa. Há também backups incrementais da casca em `/root/unificado-before-dosagem-native-20261022T*.tar.gz`, do gateway Mapa ao lado dos arquivos alterados (`*.before-dosagem-native-*` e `*.before-dosagem-role-*`) e do snippet Nginx em `/etc/nginx/snippets/laboratorio-unificado.conf.before-dosagem-native-20261022`. A aplicação independente em `dosagem.concretrack.com.br` continua disponível como referência e rollback. Nenhum rollback foi executado.

Rascunhos mantidos somente no IndexedDB da origem `dosagem.concretrack.com.br` não podem aparecer automaticamente na origem `concrefer.concretrack.com.br`; o banco do servidor foi migrado. A aplicação antiga continua acessível e deve ser tratada como legado durante a transição para evitar gravações em bancos diferentes.
