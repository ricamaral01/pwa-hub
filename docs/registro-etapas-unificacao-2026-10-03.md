# Registro de execução — continuação da unificação

**Data:** 03/10/2026. **Ambiente de testes:** VPS `2.25.163.32`. **Oficiais:** somente leitura. Nenhuma virada executada.

## Etapa A — organização e fotografia

### A1 — concluída

- Branch: `feat/sistema-unificado`.
- Commit de consolidação: `6db01c4d` (`feat: preserve unified test site, Mapa snapshot and PCP frontend copy`). Tag de retorno: `unificado-leitura-ok-20261003`.
- Somente arquivos do unificado, seus scripts, documentos e regras de exclusão foram incluídos. Arquivos temporários e alterações preexistentes de outros projetos não entraram no commit. O bytecode Python encontrado na área do unificado foi retirado do stage.
- Comandos locais principais: `git diff --stat`, `git add -- <caminhos do unificado>`, `git diff --cached --stat`, `git grep --cached` para padrões de credenciais, `python scripts/bump_unificado.py --check`, `python -m py_compile`, `git commit`, `git tag`.
- Resultado: verificação de versão `0.2.0` passou; sintaxe Python passou; nenhuma credencial com valor foi encontrada no conjunto incluído. O arquivo original importado do PCP tem espaços finais em várias linhas; ele não foi editado manualmente para preservar a cópia gerada.

### A2 — destino encontrado; decisão de pasta pendente

- Na VPS combinada, o site publicado está em `/var/www/concretrack-unificado-tests-root/unificado/`; a API de testes em `/root/mapa-unificado-migration/api/`. A pasta proposta `/opt/concrefer-unificado/` não existe.
- Comando remoto de leitura: `find /opt/concrefer-unificado /var/www/concretrack-unificado-tests-root /root/mapa-unificado-migration -maxdepth 2 -type d`.
- Nenhuma pasta foi movida. Foi solicitado ao usuário escolher entre manter os caminhos atuais e planejar uma migração de pasta.

### A3 — script preparado; execução pendente

- `scripts/refresh_mapa_snapshot.py` prepara exportação somente leitura do Supabase, conferência de contagens/hashes, importação em tabelas de estágio, backup privado `pg_dump` e troca transacional da fotografia no banco `mapa_unificado_teste`.
- O script preserva o hash de senha e o estado de primeiro acesso das contas que já existem no ambiente de testes, para que a atualização não desfaça senhas trocadas nesse ambiente.
- Comando local executado: `python -m py_compile scripts/refresh_mapa_snapshot.py`. A exportação **não foi executada**: o arquivo privado `/root/mapa-unificado-migration/supabase-source.env` ainda não estava disponível na VPS na última conferência. Nenhuma chave foi colocada no Git, nos comandos registrados ou neste relatório.

## Etapa B — chamadas do Mapa

- `scripts/inventory_mapa_calls.py` encontrou **84 referências estáticas** a Supabase, RPC, eventos, `fetch` e auxiliares de dados no `mapa-concretagem/app.js`. O índice está em `docs/matriz-chamadas-mapa.md`; contratos dinâmicos ainda exigem revisão manual.
- `scripts/capture_mapa_requests_offline.py` executou o **app.js original** em navegador local com sessão sintética e interceptação de toda chamada externa. Os 18 modos de navegação abriram. Foram bloqueados e capturados **31 pedidos externos**. Programação e desprogramação por cartão, liberação e concretagem com tipo no Setor 3 produziram os métodos REST esperados na captura sintética.
- Comandos locais: `python scripts/inventory_mapa_calls.py`, `python scripts/capture_mapa_requests_offline.py`. O JSON de pedidos ficou na pasta ignorada `.work-mapa-unificado/`; somente o resumo sem cabeçalhos e sem credenciais foi para a matriz.
- **Pendente:** capturar e comparar todos os demais fluxos listados na tarefa, preencher todos os filtros, colunas, retornos e erros da matriz. B1/B2 ainda não estão concluídas. Nenhum endpoint de escrita do unificado foi liberado.
- O código original usa Supabase Realtime para `producao` e `formas_manutencao`. O usuário autorizou reproduzir o mesmo efeito visível com eventos da API de testes; o mecanismo ainda não foi implementado.

## Leitura antecipada da Etapa E1 — dependência descoberta

Foi feito somente inventário, sem alterar a VPS oficial `31.97.241.84`:

- Comandos remotos de leitura: `psql --version`, `find /opt/pcp-concrefer -maxdepth 2 -type f`, `pg_lsclusters`, `cut -d= -f1 /opt/pcp-concrefer/.env`, `du -sh` em diretórios do aplicativo, e consultas SQL `SHOW server_version` e `pg_database_size` no banco PCP. Os valores das variáveis de ambiente não foram mostrados.
- O backend oficial é FastAPI; o banco `pcp_concrefer` é PostgreSQL **14.24**, com cerca de **16 MB** na data da leitura. Foram localizados código `app/`, frontend, `requirements.txt`, dados de layout, arquivo de credenciais Google e serviços de planilha.
- O backend consulta também Supabase `producao` e `producao_diaria` e planilhas Google. A fotografia atual do Mapa inclui `producao`, mas não `producao_diaria` nem as planilhas. Isso impede afirmar que uma cópia do backend, apontada apenas ao novo banco PCP, opera exclusivamente com dados PostgreSQL de testes.
- Esta leitura foi antecipada para verificar a condição explícita de parada da tarefa. Foi solicitada decisão sobre fotografar também essas fontes e oferecer equivalentes locais sem alterar o contrato percebido pelo usuário. E2 a E4 não foram executadas.

## Disponibilidade conferida antes de qualquer publicação nova

Comando local: `curl.exe --head --silent --show-error --max-time 12` para cada endereço. Resultado: as quatro rotas existentes do unificado retornaram **HTTP 200**; o Mapa oficial retornou **HTTP 200**; a raiz do PCP oficial retornou **HTTP 302** (redirecionamento de entrada). Nenhum arquivo ou serviço oficial foi reiniciado, modificado ou redirecionado.

## Pendências que dependem do usuário

1. Escolher o destino de pasta na VPS de testes, pois a publicação atual difere de `/opt/concrefer-unificado/`.
2. Criar o arquivo privado de origem Supabase na VPS para executar A3 sem expor a chave em comandos ou logs.
3. Definir o equivalente de testes para `producao_diaria` e planilhas Google do PCP. A autorização para eventos em tempo real do Mapa já foi recebida.

Nenhum backup ou recarga de Nginx foi necessário nesta continuação porque não houve publicação nova. Antes de qualquer publicação, serão feitos os três backups e `nginx -t` exigidos pela tarefa.
