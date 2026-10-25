# 5S digital — Fase 1: análise, sem limpeza

**Data da coleta:** 17/10/2026 (horário de São Paulo). **Escopo:** repositório local `C:\Users\Admin\Documents\pwa-hub-fase1` e Unificado na VPS nova, produção em `/opt/concrefer-unificado/public/unificado` e teste `:18446` em `/opt/concrefer-unificado/homolog-next/public/unificado`, incluindo os serviços que os alimentam. A VPS antiga não foi examinada nem alterada. Nesta fase, somente este relatório foi criado; nenhuma permissão, configuração, arquivo de aplicação ou dado foi alterado.

## Método e limites da evidência

- Inventário local por caminhada de arquivos, `git ls-files`, `git status`, tamanho e data de modificação; buscas `rg` em código, HTML, menus, scripts e manifests.
- Na VPS: `nginx -T`, vhost do `:18446`, `systemctl show`, `find`, `stat`, `du`, SHA-256 dos arquivos públicos e contagem de caminhos nos logs de acesso. As consultas foram somente leitura. Datas da VPS aparecem em UTC.
- **Os logs de acesso disponíveis cobrem 04–18/10, não os 30 dias completos** (18/09–18/10). Portanto, ausência de acesso nesses logs não prova ausência de uso por 30 dias. Candidatos públicos sem referência ficam em **DÚVIDA**, não em “provavelmente não usado”. Acessos podem incluir bots, testes e cache; um hit tampouco prova necessidade funcional.
- A classificação de um diretório abrange seus descendentes **apenas quando a evidência indicada vale para toda a árvore**. Nos demais casos, as exceções estão separadas na tabela. Este relatório não afirma ter validado individualmente os 245 mil arquivos de dependências geradas. Para classificação conclusiva de cada arquivo será necessário um manifesto automatizado por arquivo, mais logs completos e revisão de chamadas dinâmicas antes da Fase 2.
- **EM USO** significa referência concreta de execução, build, deploy, menu, HTML, service worker, migração ou acesso recente. **PROVAVELMENTE NÃO USADO** exige ausência de referência; nos públicos exige também 30 dias completos sem acesso. **DÚVIDA** inclui evidência incompleta ou conflitante. “Manter” é uma ação sugerida, não uma afirmação de que o conteúdo de um backup foi restaurado com sucesso.

## Resumo quantitativo

| Conjunto / categoria operacional | Arquivos | Tamanho | Evidência e ressalva |
|---|---:|---:|---|
| Repositório local, exceto `.git` | 245.266 | 4.830.229.934 B (4,83 GB) | Varredura de arquivos; 10.642 caminhos rastreados pelo Git. Há 328 entradas de `git status --short` preexistentes. |
| Dependências `node_modules` (local) | 230.793 | 3.522.970.325 B (3,52 GB) | Árvore de instalação/geração; **9.637 arquivos já estão rastreados** no `node_modules` da raiz apesar do `.gitignore`. Utilidade para builds: **EM USO**; cópias individuais e sua remoção: **DÚVIDA** até reconstrução testada. |
| `__pycache__`, `dist`, `build`, `.pytest_cache` (local) | 650 | 10.340.861 B | 430 + 193 + 13 + 14 arquivos, respectivamente; gerados. **DÚVIDA** quanto a todos os `dist/build` até conferir o deploy; caches de Python/pytest são candidatos A. Seis arquivos de `__pycache__` estão rastreados. |
| Demais arquivos locais, inclusive fontes, documentos, snapshots e backups | 13.823 | 1.296.918.748 B | Mistura de **EM USO** e **DÚVIDA**; não atribuir o total inteiro a uma categoria de exclusão. |
| Público da produção | 159 | 11.832.306 B (`du -sb`, inclui diretórios) | Nginx `root /opt/concrefer-unificado/public`; **EM USO** para rotas atuais, com candidatos pontuais em **DÚVIDA**. |
| Público do teste `:18446` | 165 | 12.065.323 B (`du -sb`, inclui diretórios) | Nginx `root /opt/concrefer-unificado/homolog-next/public`; **EM USO** para rotas atuais, com candidatos pontuais em **DÚVIDA**. |
| Arquivos públicos com hash SHA-256 compartilhado entre produção e teste | 139 grupos | Não somar: são ambientes separados | Versões iguais são necessárias nos dois ambientes, **não** são duplicatas para exclusão. Nove grupos também contêm duplicatas *dentro* de um ambiente (fontes/logos); referências distintas precisam ser preservadas. |
| Backups/migração na VPS | Não enumerados internamente | `backups` 459.297.989 B; `migration` 5.972.521.878 B | **Manter**. Não há proposta de exclusão; inventário interno e política de retenção dependem de análise separada. |

Os números são por conjuntos, **não** uma partição conclusiva de “usado × não usado”: o critério de 30 dias não pôde ser aplicado integralmente e existem dependências dinâmicas. Não há volume classificado como “PROVAVELMENTE NÃO USADO” na árvore pública com a evidência disponível.

## SEIRI — inventário e evidência

Abreviações da tabela: `local/` = raiz do repositório; `prod/` = `/opt/concrefer-unificado/public/unificado/`; `teste/` = `/opt/concrefer-unificado/homolog-next/public/unificado/`; `VPS/` = `/opt/concrefer-unificado/`. A data é a última modificação observada dos arquivos da linha (ou a mais recente na árvore), no fuso do respectivo sistema. Tamanhos de árvores locais somam arquivos; tamanho de árvores da VPS vem de `du -sb` e inclui diretórios. “Candidato A/B/C” indica apenas eventual **quarentena após aprovação**, nunca exclusão direta.

| Caminho | Tamanho | Última modificação | Categoria | Evidência | Ação sugerida |
|---|---:|---|---|---|---|
| `local/unificado/shell/` | 600.444 B / 19 arquivos | 17/10 | EM USO | `index.html`, menu e roteador da casca; Nginx serve `/unificado/`; `shell/modelo-a/menu.js` integra o menu. | Manter. |
| `local/unificado/pcp/` | 2.856.398 B / 194 | 17/10 | EM USO | Menus/catálogo apontam para páginas PCP; `scripts/build_unificado_pcp_frontend.py` lista páginas; `/unificado/pcp/api/` vai ao serviço PCP. | Manter fontes e artefatos publicados; revisar arquivo a arquivo antes de reorganizar. |
| `local/unificado/m/maodeobra/` | 78.841 B / 13 | 17/10 | EM USO, com exceção | Entrada PWA, manifest e SW têm `location` específico em produção e teste; log registra 71 acessos à entrada. | Manter; ver protótipo separado. |
| `teste/m/maodeobra/prototipo/` | 26.236 B / 3 | 17/10 17:16 UTC | DÚVIDA | Não é entrada oficial; **63 acessos recentes** ao diretório e `prototype.js` é carregado pelo `index.html`. Pode servir a homologação visual. | Candidato C; decidir finalidade antes de qualquer quarentena. |
| `local/unificado/tv/`, `local/unificado/painel-tv/` | 87.922 B / 10 | 16/10 | EM USO | Nginx `painel-tv-prod.conf`/`painel-tv-homolog.conf`; serviço `unificado-tv.service` e rota `/unificado/tv/formas/`; 67 acessos registrados. | Manter. |
| `teste/tv/formas/index-v1.backup.html` | 10.578 B | 16/10 22:43 UTC | DÚVIDA | Nome de backup; a entrada atual é `index.html`; sem referência encontrada. Logs incompletos. **Backup: manter.** | Manter; classificar retenção em revisão de backups, fora dos níveis A/B. |
| `teste/tv/formas/tv-v1.backup.js` | 10.421 B | 16/10 22:43 UTC | DÚVIDA | Nome de backup; a entrada atual chama `tv.js`; sem referência encontrada. Logs incompletos. **Backup: manter.** | Manter; mesma restrição. |
| `prod/tv/formas/` | 22.322 B / 2 arquivos | 17/10 00:47 UTC | EM USO | `painel-tv-prod.conf`, `index.html` e `tv.js`; 67/40 acessos à página/script. | Manter. |
| `prod/m/maodeobra/` | 52.571 B / 10 arquivos | 17/10 23:30 UTC | EM USO | Manifest/SW dedicados no Nginx; logs com acessos à entrada, ícones, login, manifest e SW. | Manter. |
| `prod/pcp/maodeobra/index.html`, `prod/pcp/static/js/maodeobra-*.js`, `prod/pcp/static/css/maodeobra-mobile.css` | 78.577 B | 17/10 23:30 UTC | EM USO | Tela PCP publicada e scripts/CSS carregados por ela; menu/catálogo incluem Mão de Obra. | Manter. |
| `prod/qualidade/`, `teste/qualidade/` | ~1,3 MB cada | 16/10 | EM USO, com exceção | Snippets Nginx de Qualidade e `qualidade/index.html`; chunks CSS/JS Vite presentes nos HTML atuais. | Manter entrada e chunks ativos; ver versões antigas abaixo. |
| `prod/qualidade/assets/index-*.js/css` não presentes no `index.html` atual | ~1 MB | 15–16/10 | DÚVIDA | Hashes anteriores existem. Logs mostram acessos inclusive aos hashes antigos (ex.: 56 ao `index-CC0aBxvH.js`). PWA/caches/abas antigas podem solicitá-los. | Candidato C somente após janela de retenção e confirmação de cache/SW, nunca por nome. |
| `teste/qualidade/assets/index-*.js/css` anteriores | ~1 MB | 15–16/10 | DÚVIDA | Mesmo padrão de hashes e acessos; alguns arquivos diferem da produção. | Mesma decisão separada do ambiente de produção. |
| `prod/mapa/operacao/dashboard-defeitos-v4.css` | 33.210 B | 02/10 | EM USO | `scripts/build_unificado_mapa_operacao.py`/SW referenciam; 6.647 acessos nos logs. | Manter apesar do “v4”. |
| `prod/pcp/teste-programacao/index.html` | 21.203 B | 08/10 | EM USO | Menu Modelo A, catálogo de telas, router backend e 111 acessos. | Manter apesar do “teste” no nome. |
| `prod/pcp/static/js/_sidebar.html.txt` | 444 B | 03/10 | DÚVIDA | Não apareceu como import/script nas buscas pontuais; sem hit na amostra de logs; cobertura de 30 dias insuficiente. | Candidato C após busca completa por referência dinâmica. |
| `prod/` e `teste/` demais telas PCP/Mapa, shell, manifests, SW, fontes e vendors | ~10 MB por ambiente | ago–out/2026 | EM USO ou DÚVIDA individual | Nginx serve as árvores; HTML, menus e SW referenciam muitos arquivos. **Não** inferir uso de cada arquivo apenas pelo `root` genérico. | Manter nesta fase; cruzar cada caminho com referências e logs completos antes de propor B. |
| `local/unificado/sidebar-modelo-a/` | 54.679.185 B / 607 arquivos | 16/10 | EM USO, com gerados | `package.json` da raiz chama `npm --prefix unificado/sidebar-modelo-a run build/typecheck`; fonte do menu publicado. | Manter fontes; dependências e `dist` entram na revisão A de gerados. |
| `local/unificado/laboratorio/` | 96.453.638 B / 3.119 arquivos | 15/10 | EM USO, com gerados | Snippet Nginx do Laboratório e árvore de serviço/SPA; parte do tamanho é dependência/build. | Manter fontes e configuração; segmentar gerados antes de qualquer ação. |
| `local/unificado/qualidade/` | 67.584.303 B / 2.549 arquivos | 16/10 | EM USO, com gerados | Snippet Nginx de Qualidade, serviço e frontend publicado; migrations no módulo. | Manter fontes e **todas as migrações aplicadas**. |
| `local/infra/ged/` | 616.986.960 B / 35.748 arquivos | 16/10 | EM USO, com gerados | GED é servido por snippets `ged-unificado*.conf` e serviços próprios; frontend Next contém `node_modules` grande. | Manter fontes e dados; verificar dependências geradas em revisão A. |
| `local/node_modules/` | Parte dos 3,52 GB de `node_modules` | 09/10 | EM USO para builds; DÚVIDA para quarentena | `package.json` usa npm; **9.637 arquivos rastreados** nessa árvore. `.gitignore` atual não remove arquivos já rastreados. | Investigar por que foram versionados; discutir limpeza do índice Git em fase própria, sem apagar arquivos. |
| `local/**/__pycache__/`, `.pytest_cache/` | 7.543.799 B / 444 arquivos | até 15/10 | DÚVIDA; gerados | Bytecode/cache de ferramenta; seis bytecodes rastreados. Não são dados do usuário. | Candidato A para quarentena local após aprovação; não incluir fonte `.py`. |
| `local/**/dist/`, `local/**/build/` | 2.797.062 B / 206 arquivos | até 17/10 | DÚVIDA | Saídas geradas, porém alguns deploys podem copiá-las; 0 rastreados nos grupos medidos. | Candidato A **apenas** com prova de rebuild e referência de deploy resolvida. |
| `local/.codex-tmp*/`, `local/.work-*/`, `local/tmp/`, `local/output/` | Grandeza de centenas de MB; medição por pasta pendente | ago–out/2026 | DÚVIDA | Diretórios de execução, cópias e artefatos; alguns contêm snapshots de dados e backups. O status Git mostra muitos caminhos não rastreados. | Candidato C **por subpasta**, nunca quarentena em bloco; separar dados/backup de caches. |
| `local/.work-mapa-unificado/snapshot/montagem_poste.jsonl` | 86.393.875 B | out/2026 | DÚVIDA; **manter dados** | Snapshot de migração com potencial dado de usuário. | Manter; não incluir em exclusão. |
| `local/.work-mapa-migration/export-20261002/montagem_poste.csv` | 84.509.935 B | out/2026 | DÚVIDA; **manter dados** | Exportação de migração. | Manter; não incluir em exclusão. |
| `local/relatorios/defeitos-concreto/backups/montagem_poste_*.json` | 44.373.957 B (maior arquivo) | set/2026 | DÚVIDA; **manter backup** | Caminho de backup de dados. | Manter; nunca propor exclusão 5S. |
| `local/infra/ged/app/frontend/node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` | 136.842.752 B | out/2026 | EM USO para build Windows | Binário nativo do Next dentro de dependências. | Somente tratar com o conjunto de dependências, após rebuild. |
| `local/quality-layout-20261015*.tar`, `.codex-tmp-ged-*.tar*` | ~2,4 MB somados | 15–16/10 | DÚVIDA; **manter até revisar** | Pacotes nomeados como releases/cópias; podem ser evidência de retorno. | Candidato C por arquivo se houver cópia validada fora do repositório; não classificar como “seguro”. |
| `VPS/hub-api`, `VPS/pcp-api`, `VPS/mapa-api` | 57,5 MB; 359,9 MB; 43,8 MB | out/2026 | EM USO | Raízes/venvs de serviços e destinos `proxy_pass` da produção. | Manter. |
| `VPS/homolog-next/hub-api`, `VPS/homolog-next/pcp-api`, `VPS/homolog-next/qualidade` | 50,5 MB; 329,1 MB; serviço Qualidade | out/2026 | EM USO | `systemctl show ExecStart` aponta para essas árvores; Nginx `:18446` usa `homolog-next`. | Manter. |
| `VPS/homolog/`, `previous-*`, `releases/`, `staging/` | 126 MB; vários; 358 MB; 58 MB | out/2026 | DÚVIDA; **manter nesta fase** | Nomes sugerem versões/cópias, mas faltam mapa de deploy, rollback e jobs completos. `previous-root-migration` tem ~3,6 GB de possível histórico/dado. | Analisar por conjunto; nenhuma proposta de exclusão de backup, migração ou rollback antes de política formal. |
| `VPS/backups/`, `VPS/migration/`, `VPS/photo-storage/`, `VPS/homolog-next/ged/uploads/`, `VPS/homolog-next/qualidade/uploads/` | 459 MB; 5,97 GB; 5,4 MB; não medidos; não medidos | out/2026 | EM USO ou DÚVIDA; **manter** | Backups, migração, fotos e uploads/dados de usuários. | Manter. Não são candidatos A, B ou C de exclusão. |

### Duplicatas, versões, código morto e dependências

- SHA-256 dos 324 arquivos públicos (159 produção + 165 teste) encontrou **139 grupos idênticos entre ambientes**. Isso demonstra paridade parcial, não redundância removível. Dentro da produção há logos com hash idêntico em `assets/img/` e `pcp/static/img/`, e fontes Geist idênticas em `mapa/operacao/fonts/` e `shell/fonts/`. URLs distintas aparecem em HTML/CSS; eventual deduplicação exigiria alterar referências, então fica na proposta Seiton.
- `dashboard-defeitos-v4.css` é realmente usado. `pcp/teste-programacao/` é realmente usado. O protótipo mobile no teste também recebeu acessos. **Padrões `v1/v2`, `teste`, `backup`, `old` não equivalem a lixo.**
- Há pacotes de release/rollback locais (`quality-layout-*`, `.codex-tmp-*`), duas versões anteriores do painel TV guardadas dentro do público de teste e chunks Vite antigos no público. Estes devem sair da pasta pública **somente** após decisão de retenção, validação de caches e fase de quarentena; backups permanecem preservados.
- Busca por nomes e referências não basta para provar função/rota morta: JavaScript gerado, imports dinâmicos, templates e rotas FastAPI montadas indiretamente impedem conclusão confiável nesta fase. Nenhuma função ou endpoint foi indicado como “morto” para exclusão. Para próxima análise, gerar lista de rotas montadas em runtime e relatório de imports/cobertura, sem executar código de escrita.
- O `package.json` da raiz declara `@supabase/supabase-js`, `xlsx` e `@google/clasp`. Há referência ao Supabase via CDN nas páginas antigas e import de `xlsx` no backend `concrejet`, mas isso **não prova** uso da dependência da *raiz*. `@google/clasp` pode ser ferramenta de manutenção. Classificar as três dependências da raiz como **DÚVIDA** até verificar comandos executados e `require/import` resolvidos a partir da raiz; não remover agora.

## SEITON — reorganização proposta, aprovação separada

Estrutura alvo **conceitual**, sem mover nada nesta fase:

```text
unificado/
  shell/{src,static,docs}
  pcp/{backend,frontend,static,docs,migrations,tests}
  mapa/{backend,frontend,static,docs,migrations,tests}
  qualidade/{backend,frontend,static,docs,migrations,tests}
  ged/{backend,frontend,static,docs,migrations,tests}
  laboratorio/{backend,frontend,static,docs,migrations,tests}
  painel-tv/{backend,frontend,static,docs,tests}
  maodeobra-pwa/{frontend,static,docs,tests}
docs/{arquitetura,operacao,porting,5s}/
scripts/{build,deploy,migrate,verify}/
```

| Origem atual | Destino proposto | Impacto a resolver antes de mover |
|---|---|---|
| `unificado/shell/*` e `unificado/sidebar-modelo-a/*` | `unificado/shell/{src,static}` | `package.json` raiz, scripts de build, URLs de `/unificado/shell/`, SW e HTML. |
| `unificado/pcp/backend`, páginas `unificado/pcp/*`, `pcp/static/*` | `unificado/pcp/{backend,frontend,static}` | `root` Nginx, `systemd WorkingDirectory/ExecStart`, paths em HTML, scripts de cópia e permissões por tela. Não mudar URL pública sem redirects/compatibilidade. |
| `unificado/m/maodeobra/*` | `unificado/maodeobra-pwa/{frontend,static}` no código-fonte | Preservar **URL e escopo SW** `/unificado/m/maodeobra/`; mudar somente origem de build/deploy. |
| `unificado/qualidade/*`, `infra/ged/app/*`, `unificado/laboratorio/*` | módulos próprios `{backend,frontend,docs,migrations,tests}` | Serviços, imports, arquivos anexados e migrações aplicadas. Migrations e uploads continuam em local operacional protegido. |
| `scripts/*.py`, `scripts/*.sh`, `scripts/porting/*`, `scripts/painel-tv/*` | `scripts/{build,deploy,migrate,verify}` | Cron/timers/systemd, documentação, caminhos relativos e scripts de rollback. |
| documentação espalhada e artefatos de análise | `docs/<módulo>/` e `docs/operacao/` | Links relativos, referências em scripts e histórico Git. Backups/snapshots de dados **não** devem ser movidos para docs públicos. |

Padronizar nomes de fonte em minúsculas com hífen para rotas/pastas de tela e `snake_case` para módulos Python; manter identificadores de banco existentes. Publicação continua com diretórios distintos `public/unificado` e `homolog-next/public/unificado`. **Esta reorganização exige autorização própria**, depois de mapa completo de imports, Nginx, systemd, cron, SW, manifests, migrations e deploy.

## SEISO — higiene, segredos e permissões

- O `.gitignore` local já cobre `.env`, chaves `*.pem/*.key/*.crt`, `uploads/`, `backups/`, dumps, logs, `node_modules/` e `__pycache__/`. Faltam regras coerentes para `.codex-tmp*/`, `.work-*/` temporários **sem ocultar snapshots importantes**, `tmp/`, `.pytest_cache/`, `dist/`, `build/` e arquivos de editor. Proposta: regras por módulo e exceções explícitas para artefatos versionados. **Não alterar `.gitignore` nesta fase.**
- `.gitignore` não desversiona os **9.637 arquivos em `node_modules` e seis bytecodes já rastreados**. Uma futura retirada do índice Git é mudança separada, com revisão do diff e build; não corresponde a apagar arquivos da máquina.
- Busca por nomes no Git não revelou `.env` real, `.pem/.key/.crt` nem dump rastreado; há `.env.example` e `.env.demo` versionados. Uma busca heurística de conteúdo sinalizou alguns scripts/testes/SQL como **candidatos a revisão restrita**, mas pode ser falso positivo. Nenhum valor foi lido para este relatório. Antes de qualquer commit/publicação, usar detector de segredos com saída limitada a caminho/linha/tipo, nunca valor; verificar histórico Git à parte.
- Nas árvores públicas examinadas, a busca por nomes de `.env`, chave, dump, SQL, log ou backup encontrou **apenas** `teste/tv/formas/index-v1.backup.html` e `tv-v1.backup.js`. Não se examinou todo o vhost fora de `/unificado` para esta conclusão. Backups permanecem “manter”, mas sua exposição sob `public` deve ser avaliada e protegida em fase aprovada.
- `stat`: `/opt/concrefer-unificado/public` está `root:root 777`; entre as duas árvores `/unificado`, há **65 diretórios 777** e **158 arquivos 666** (versus 50 diretórios 755 e 166 arquivos 644). Concentrados em PCP, Mapa e fontes; são graváveis por qualquer usuário local. `www-data` precisa apenas de leitura/travessia. Recomendar normalizar a **755/644** após snapshot de permissões, ensaio em `:18446`, verificação `sudo -u www-data test -r` para casca/login/PWA e gate 7/7; avaliar exceções de upload fora do público. **Nenhuma permissão foi alterada.**

## SEIKETSU — padrões e verificação propostos

Cada módulo deve ter README curto com: responsável, fonte da verdade, URL/serviço, banco usado (sem credenciais), fluxo de build/deploy, migrações, smoke, dependências, rollback e pastas protegidas. Branches: `feat/<modulo>-<assunto>`, `fix/<modulo>-<assunto>`, `chore/5s-<assunto>`; commits no formato `tipo(modulo): descrição` (`feat`, `fix`, `chore`, `docs`, `test`). Não reescrever histórico existente.

Checklist de deploy futuro: snapshot/hashes e permissões atuais; backup do banco/anexos; teste primeiro em `:18446`; migration idempotente com reversão; build e hash do pacote; `nginx -t` se Nginx for afetado; deploy preservando dono/modo explícitos; `sudo -u www-data test -r` na casca, login, PWA e assets novos; smoke autenticado/anônimo; gate 7/7; comparação de permissões antes/depois; rollback imediato se falhar; registro da versão e links de evidência.

**Script de verificação proposto, não criado/executado:** `scripts/verify/orfaos.py` com modo somente leitura e saída JSON/Markdown. Deveria (1) inventariar caminho, tamanho, mtime, hash e status Git; (2) resolver referências estáticas de Nginx, systemd, cron, HTML, CSS, JS, manifests, SW, imports, menus, scripts de deploy e migrations; (3) cruzar caminhos públicos com **30 dias completos** de logs por vhost, sem armazenar IP/token/query; (4) marcar referência dinâmica como `DÚVIDA`; (5) bloquear automaticamente `.env`, segredos, backups, dumps, uploads, dados, certificados e migrações aplicadas; (6) emitir candidatos A/B/C **sem mover nem apagar**; (7) falhar com aviso de cobertura quando logs faltarem. O script não pode tratar acesso 404/bot como prova de uso sem revisão.

## SHITSUKE — rotina

Revisão mensal: inventário de novos arquivos grandes e de artefatos públicos, hashes repetidos, status Git, segredos por metadados, espaço livre, permissões de `public`, validade dos backups, cobertura dos logs de 30 dias, referências de Nginx/systemd/cron, caches e SW antigos, dependências sem import e documentação de deploy. Fazer revisão adicional após cada publicação ou migração. Cada decisão 5S deve guardar evidência, aprovador, data, hash, smoke e data mínima de saída da quarentena.

## Opções para a Fase 2 — sem execução nesta fase

| Nível | Candidatos | Condição antes de quarentena |
|---|---|---|
| **A — seguro/reproduzível** | `__pycache__/`, `.pytest_cache/`; `dist/build` **apenas** quando rebuild reproduzir bytes/função e deploy não depender do diretório local; cópias de dependências **apenas** após instalar/buildar em ambiente limpo. | Aprovar lista exata de caminhos; branch própria; preservar versão/hashes; começar no teste, smoke + gate 7/7. `node_modules` rastreado exige plano Git separado. |
| **B — provável** | **Nenhum público habilitado agora.** | Exige busca de referências completa **e logs de 30 dias** por vhost sem hit; a janela atual só cobre ~14 dias. |
| **C — dúvida** | Protótipo mobile do teste, `_sidebar.html.txt`, chunks Vite anteriores, pacotes de release locais e possíveis cópias `previous-*`. | Decisão **item a item** do Ricardo, com finalidade de rollback/caches e retenção explicitadas. Backups, snapshots/dados, uploads, migrações, certificados, `.env`/segredos e configs Nginx/systemd em uso **não entram em exclusão**. |

Se uma fase de limpeza for aprovada, **nada será apagado diretamente**: mover os caminhos aprovados para `_quarentena/AAAA-MM-DD/` preservando estrutura e metadados, em branch própria para o repositório, `:18446` primeiro, smoke + gate 7/7, depois produção com snapshot/permissões e retorno imediato se o smoke falhar. Manter quarentena por 30 dias. Exclusão definitiva depende de nova aprovação. A proposta Seiton tem aprovação separada da limpeza.
