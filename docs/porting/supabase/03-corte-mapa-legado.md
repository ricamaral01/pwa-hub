# Corte do Mapa legado para a VPS nova — preparação

Decisão do usuário em 23/10/2026: **migrar o Mapa legado para a VPS nova**. O destino é o Mapa do Unificado em `https://concrefer.concretrack.com.br/unificado/`, cuja cópia publicada usa `/unificado/mapa/api` e PostgreSQL local. O Mapa antigo permanece publicado em `vps-rh` por `dautomacao.com`, `usina.concretrack.com.br` e `relatorios.concretrack.com.br`, nos caminhos `/mapa-concretagem/` e `/concretrack/mapa-concretagem/`. Nenhum redirecionamento ou bloqueio de escrita foi aplicado ainda.

## Estado dos dados antes do corte

Fotografia somente de leitura em 23/10, cerca de 14h30 BRT:

| Tabela | Supabase | PostgreSQL novo | IDs só na origem | IDs só no destino |
|---|---:|---:|---:|---:|
| `producao` | 23.416 | 24.963 | 8 | 1.555 |
| `montagem_poste` | 9.797 | 10.726 | 0 | 929 |
| `programacao_pcp` | 3.547 | 4.716 | 0 | 1.169 |
| `usuarios` | 38 | 59 | 0 | 21 |
| `formas_manutencao` | 2 | 2 | 0 | 0 |
| `liberacao_formas` | 5.866 | 6.269 | 13 pares de IDs equivalentes | 403 registros locais e 13 pares |
| `prog_s3_s4` | 52 | 52 | 0 | 0 |

Os oito IDs só da origem em `producao` são antigos (08/10 a 14/10), todos `LIBERADO`, e cada um tem exatamente uma linha no destino com a mesma chave `(data_fabricacao,setor,forma,status)`. Dois pares são iguais exceto pelo ID; três diferem em `data_hora` e `colaborador`; três diferem em `data_hora`, `modelo`, `descricao_poste` e `codigo_produto`. A revisão restrita está em `producao-source-only-review-20261023.json` na VPS nova. Essa correspondência não prova identidade física, pois a chave pode se repetir para produções legítimas. **Regra operacional para o corte:** preservar a linha local já em uso e o backup da origem; não inserir automaticamente esses oito IDs nem sobrescrever os registros compartilhados. A tabela `usuarios` tem três referências por chave estrangeira no destino; preservar IDs e senhas locais. As tabelas exclusivas de Auth/Edge Functions do Supabase exigem arquivo histórico, mas o Mapa operacional atual usa autenticação local.

O inventário restrito registra 9 IDs compartilhados divergentes em `producao` (campos de modelo/código/descrição), 3 em `montagem_poste` (checklist, etapa/status e horários) e 4 em `usuarios` (ativo, primeiro acesso ou setor). Nos 4 usuários, `updated_at` do destino é mais recente; na montagem, 1 é mais recente no destino e 2 têm horário igual. `data_hora` de produção não serve para ordenar as edições de modelo. Esses campos precisam de revisão operacional antes de qualquer sobrescrita; a cópia automática das duas tabelas legadas não altera esses registros.

## Portões objetivos

1. **Concluído em 23/10:** conexão PostgreSQL de leitura, catálogo interno e `pg_dump` histórico **Supabase → VPS nova**, com hash, permissões restritas e restauração isolada das 12 tabelas públicas. A restauração integral em PostgreSQL padrão depende da extensão gerenciada `supabase_vault`; o arquivo integral foi preservado.
2. Aguardar a nova janela estável do espelho até pelo menos **24/10 às 15h30 BRT**. O timer de aceite roda às **15h32min40s BRT** e verifica saúde, escrita real, prévia transacional e reconciliação independente. A janela anterior foi reiniciada após um ciclo interrompido por escrita simultânea na origem; o sincronizador agora descarta a paginação inconsistente e tenta novamente. Resultado não zero exige investigação antes do corte.
3. **Confirmado pelo usuário em 23/10:** não há pendências em nenhum aparelho que usa o Mapa antigo. A página [pendencias-migracao.html](../../../mapa-concretagem/pendencias-migracao.html) foi publicada no caminho `/mapa-concretagem/pendencias-migracao.html` da VPS antiga; ela lê apenas contagens locais do navegador, sem enviar dados. Repetir a conferência imediatamente antes do corte, pois novos lançamentos podem criar pendências. O armazenamento local pertence à origem antiga e não acompanha automaticamente um redirecionamento para o novo domínio.
4. **Regra definida para o corte:** o PostgreSQL novo permanece autoridade operacional para `producao`, `montagem_poste` e `usuarios`; preservar linhas só do destino e não sobrescrever IDs compartilhados divergentes. Os oito IDs antigos só da origem em `producao` ficam no backup histórico para eventual revisão individual. Não executar carga ampla por simples diferença de contagem.
5. **Confirmado pelo usuário em 23/10:** pessoas que usam o Mapa antigo entraram no Mapa do Unificado com as próprias contas e abriram as telas de setor e inspeção. Na janela do corte, repetir uma operação real por fluxo crítico e conferir a escrita no PostgreSQL local. O código publicado do Mapa novo usa API local.

## Sequência para a janela de corte

1. Comunicar janela de troca e esvaziar pendências locais dos aparelhos; impedir novos lançamentos no Mapa antigo durante o corte. Salvar cópia da configuração Nginx e dos arquivos `index.html`, `app.js` e `sw.js` da VPS antiga.
2. Fazer backup atualizado do banco de destino e fotografia final da origem. Rodar `sync.py --dry-run` e `audit.py`; registrar contagens, IDs e horário. Se houver escrita recente na origem, aguardar o próximo ciclo e repetir.
3. Publicar redirecionamento temporário **302** dos caminhos antigos para o Unificado, preservando os arquivos antigos para reversão. O service worker antigo usa cache de navegação; testar um navegador já registrado e um navegador novo. Manter a origem em modo de leitura ou impedir seus escritores somente depois de confirmar o novo caminho operacional.
4. Testar login, leitura, gravação e atualização por setor no novo Mapa; conferir uma linha de cada operação no PostgreSQL e verificar que a contagem do Supabase não aumenta. Testar PCP e relatórios dependentes. Não usar registros sintéticos no banco operacional sem uma limpeza comprovada.
5. Observar erros, divergências e acessos ao caminho antigo. Se o novo fluxo falhar, restaurar configuração Nginx anterior e reabrir o escritor antigo apenas depois de reconciliar as escritas realizadas na janela. Manter backup e logs.

O redirecionamento, o bloqueio de escrita na origem e a troca de escritor são ações da janela de corte. Esta preparação e o timer de aceite são somente de leitura.

Em 23/10, foi salva uma cópia restrita dos dois arquivos Nginx ativos e dos arquivos `index.html`, `app.js` e `sw.js` do Mapa antigo em `/opt/resultado-ensaios-usina/migration/mapa-cutover-20261023/` na `vps-rh`, com manifesto SHA-256, diretório modo `700` e arquivos modo `600`. Conferir se os arquivos ativos mudaram e refazer a cópia na janela do corte. Os blocos que servem o Mapa estão em `dashboard-usina` (domínios `dautomacao.com` e `usina.concretrack.com.br`, incluindo `/concretrack/mapa-concretagem/`) e `relatorios.concretrack.com.br` (caminho `/mapa-concretagem/`).

As configurações candidatas `candidate-sites-enabled/dashboard-usina` e `candidate-sites-enabled/relatorios.concretrack.com.br` estão no mesmo diretório restrito. Elas enviam os caminhos antigos por **302** à entrada `https://concrefer.concretrack.com.br/unificado/`, mas ainda servem `sw.js` e `pendencias-migracao.html` em seus caminhos exatos. O novo [service worker de transição](../../../deploy/nginx/mapa-legacy-handoff-sw.js) está preparado em `/var/www/mapa-legacy-handoff/sw.js`; ele limpa o cache antigo de navegação e redireciona navegações sob o escopo legado. `node --check` e `nginx -t` da configuração candidata passaram em 23/10. **Nada foi ativado**: os arquivos de `sites-enabled` continuam apontando para as configurações antigas. Antes de ativar, conferir novamente hashes, pendências, aceite do espelho e backup atualizado; substituir os arquivos em `sites-available`, testar `nginx -t` e recarregar, mantendo as cópias para reversão.

Foi feito também um backup prévio dos bancos de destino `mapa_unificado_teste` e `pcp_unificado_teste` em `/opt/concrefer-unificado/migration/mapa-cutover-20261023/` na VPS nova, com manifesto SHA-256 e arquivos modo `600`. Ambos passaram pela leitura de índice `pg_restore -l`. Esses backups são uma referência anterior ao corte; gerar novos arquivos imediatamente antes da troca.

### Credencial de origem

O usuário forneceu uma conexão válida pelo pooler Supabase em 23/10. A senha está apenas no arquivo `read.pgpass` da VPS nova, fora do Git, em diretório modo `700` e arquivo modo `600`. `connection.json` contém somente host, porta, banco, usuário e modo SSL. A consulta de leitura confirmou PostgreSQL 17.6. A senha não deve aparecer em comandos, logs ou documentação.

### Backup PostgreSQL e catálogo — 23/10/2026

O cliente PostgreSQL 17 executou `pg_dump --format=custom --no-owner --no-privileges` pela conexão SSL. O arquivo integral está em `/opt/concrefer-unificado/migration/supabase-db/supabase-20261023.dump` (modo `600`), com **56.993.459 bytes** e SHA-256 `07b9fe76aff95a2411a31d4ed69638bbd90ed843a25e6954694e2556d2041bc5`. `pg_restore --list` leu **583 entradas**. O catálogo restrito está em `catalog-20261023.json`, com relações, funções, gatilhos, políticas, publicações, extensões e event triggers. Foram identificadas 70 relações não sistêmicas (18 em `public`), 167 funções (64 em `public`, incluindo funções de extensão), 11 gatilhos não internos (3 em `public`), 20 políticas em `public`, 8 associações de tabelas a publicações e 6 extensões. A tabela `cron.job` não existe; nenhum gatilho HTTP/webhook foi identificado pela definição dos gatilhos. Consultas diretas confirmaram **0 buckets, 0 objetos Storage e 3 usuários Auth**.

A tentativa de restaurar tudo num PostgreSQL 17 padrão parou na extensão gerenciada `supabase_vault`, que não existe nessa imagem. Uma restauração separada das **12 tabelas públicas** em contêiner isolado, sem rede, concluiu sem erros e contou **42.926 linhas**; as contagens individuais estão em `backup-verification-20261023.json`. Esse total e cada tabela coincidiram com a fotografia REST anterior. O arquivo integral, o catálogo, as listas do arquivo e os logs da restauração permanecem em diretório restrito da VPS. A validação das tabelas públicas não demonstra que os schemas internos Auth, Storage, Realtime e Vault possam ser executados fora da plataforma Supabase; preservar o arquivo integral como histórico.

### Fotografia REST adicional — 23/10/2026

Antes de receber a conexão PostgreSQL, [export_supabase_rest_snapshot.py](../../../scripts/export_supabase_rest_snapshot.py) exportou as 12 tabelas expostas pelo REST para `/opt/concrefer-unificado/migration/supabase-rest-snapshot-20261023/` na VPS nova. Foram **42.926 linhas**, **57.144.729 bytes comprimidos**, com manifesto de contagens e SHA-256 por arquivo. SHA-256 do manifesto: `3cdc5bd26017f47904c0c455811df2a5b3c10b45b14279107267b2d200d50c14`. A verificação independente descomprimiu todos os arquivos e confirmou contagens e hashes; diretório em modo `700`, arquivos em modo `600`. O conteúdo contém dados operacionais e de contas e permanece fora do Git e do computador local. A extração valida contagem por página, mas não é transacional entre tabelas e não inclui catálogo interno, roles, políticas, triggers, dados de schemas privados nem backup do Supabase Auth. O `pg_dump` histórico acima cobre esse arquivo como backup do banco.
