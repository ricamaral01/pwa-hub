# A1 — Backup atual e restauração testada

**Executado:** 15/10/2026. **Origem:** VPS `31.97.241.84` (`vps-rh`). **Restauração de ensaio:** VPS `2.25.163.32` (`vps-staging`), contêiner descartável sem rede e sem portas publicadas. **Estado:** evidência para aprovação G-A1. O plano v2 deve ser lido com as [decisões de 15/10/2026](../decisoes-2026-10-15.md).

## Cópia e proteção

| Artefato | Método | Tamanho original | SHA-256 do conteúdo original |
|---|---|---:|---|
| Banco `ged_concrefer` | `docker exec ged_postgres pg_dump -U ged_user -Fc ged_concrefer` | 132.709 bytes | `df348b81be2cd0d297a909f833f2250059227b905fd525e3568c03f13d1fb9fd` |
| `backend/uploads` | `tar --numeric-owner` preservando proprietário, grupo, modo e mtime | 18.135.040 bytes | `5f621a471b68ec9ce9d2b66c1dc196c569799cc4d52fbf2e61143bc51eb0cb54` |
| `.env` e `backend/google-credentials.json` | `tar --numeric-owner` | 10.240 bytes | `516201e43364048fc964995b962e6344f0056eefdaf7f89a6b3cf0c102309aa9` |

Os três artefatos foram cifrados individualmente com AES-256-GCM e nonce aleatório; a chave foi protegida com Windows DPAPI `CurrentUser`. Local privado, **fora do repositório**: `C:\Users\Admin\.codex\private-backups\ged-a1-2026-10-15\`. O manifesto e a comparação detalhada também estão cifrados nesse diretório (`evidence_private.json.aesgcm`). A restauração exige o mesmo perfil Windows que protegeu a chave. Não foram copiados segredos para `docs/`, nem exibidos seus valores. Na origem foram executados apenas `pg_dump`, leitura de metadados/contagens e cópia dos arquivos; não houve alteração na aplicação ou no banco vivo.

## Integridade dos arquivos

- **52 arquivos** em `backend/uploads`; SHA-256 de cada arquivo no tar igual ao calculado na origem após a cópia.
- Para os 52 arquivos, proprietário, grupo, modo, tamanho e `mtime` do tar iguais aos do manifesto da origem. A granularidade de `mtime` conferida foi de segundos.
- O arquivo tar preserva a árvore, incluindo diretórios vazios, e pode ser extraído com os metadados preservados na A2. Nenhum arquivo foi apagado.

## Restauração e banco

O dump foi restaurado com `pg_restore` em PostgreSQL **16.15** (`postgres:16`) em um contêiner temporário com `--network none` e volume de dados `tmpfs`, sem publicação de porta. Foram comparados origem e restauração: nomes das tabelas, contagens por tabela, view, nomes e valores de enum, extensões, triggers, funções e sequências. **Todos iguais.** O contêiner foi removido ao fim do ensaio.

| Checagem | Origem | Restauração | Resultado |
|---|---:|---:|---|
| Tabelas públicas | 29 | 29 | Igual |
| Registros somados | 656 | 656 | Igual por tabela |
| Views | 1 (`rbac_manual_review_users`) | 1 | Igual |
| Extensões | `pgcrypto`, `plpgsql` | As mesmas | Igual |
| Valores de enum | 133 em 17 tipos | 133 em 17 tipos | Igual valor a valor |
| Triggers de `information_schema` | 6 | 6 | Igual por nome e tabela |
| Funções públicas | 37, incluindo `update_updated_at_column()` | 37 | Igual por nome |
| Sequências públicas | 0 | 0 | Igual |

Contagens relevantes: `documents` 32, `versions` 35, `calibration_certificates` 5, `rnc_reports` 3, `rnc_history` 9, `rnc_attachments` 0, `users` 4. As demais 22 contagens por tabela estão no manifesto privado cifrado. A verificação comparou inventário e nomes de funções/triggers, mas não os corpos SQL individualmente; o `pg_restore` concluiu sem erro e o dump completo foi usado.

## Referências aos anexos

Foram cruzados `versions.drive_file_id`, `calibration_certificates.file_url`, `calibration_certificates.qr_code_url` e `rnc_attachments.storage_path` com o manifesto. Caminhos `/uploads/` foram normalizados para o diretório relativo antes da comparação.

| Origem da referência | Referências não vazias | Sem arquivo no caminho gravado |
|---|---:|---:|
| Versões | 35 | 2 |
| Certificados, `file_url` | 4 | 0 |
| Certificados, `qr_code_url` | 5 | 0 |
| RNC, `storage_path` | 0 | 0 |
| **Total** | **44** | **2** |

As duas referências ausentes apontam para `vigentes/`, mas há arquivos com os mesmos nomes-base em `obsoletos/`. Isso sugere movimentação sem atualização do caminho na versão; **não foi corrigido nesta tarefa**. Identificadores SHA-256 dos caminhos gravados: `85bdcdab5ff43c12be223b35ce692245f26960e86fb10f42d7662aab4cf33fa9` e `5af6682147584785160c60cf73ebae654426b112e304e7cb9533d3b7771e4e3b`.

Há **10 arquivos sem referência direta** nessas colunas: 3 em `calibrations/`, 2 em `em_revisao/`, 5 em `obsoletos/`. Os SHA-256 dos caminhos, na ordem do manifesto, são:

| Pasta | SHA-256 do caminho relativo |
|---|---|
| `calibrations/` | `29b4bd769ce71cb8b2cbf683b2b5bc42cc42cd0e1c5335ee546953f39d02a2b6` |
| `calibrations/` | `ec81db0847aeaa804d002dc9d4bd28123e94ae2859d439a69d7002bacd292e58` |
| `calibrations/` | `bbdcd499969163ef70af03984f3d7dd76cee79ec790461a75c415bf681761ccd` |
| `em_revisao/` | `649ec228639dc82bd064088a665be283298167ad88bc5c1774d2374d322a0871` |
| `em_revisao/` | `3e552c26db5c75187d63ff04b2b8eff326ea2bc067b71fd13df0bb202362bb38` |
| `obsoletos/` | `f69e24b35c6960ec82193366ea90174943075e800dc3b904736004fe36c8cae2` |
| `obsoletos/` | `ded2bf9c5607aa063b90bc4e998c1d13c125de766ad85001e623f47c41879d3d` |
| `obsoletos/` | `589dc3fc3a56d1984ae802f547a54e3a7809b2f1faa4469d1974fe91fed30956` |
| `obsoletos/` | `079bad00a77e67a6d25208525965233de4aba90c4726e4b1c6de210a2dff9006` |
| `obsoletos/` | `8d396477b9044d6fa39713a1cd29b90ee804c033100ee663e9927e0834b641dd` |

“Sem referência” significa somente ausência nas três fontes de caminho solicitadas; pode haver outros usos. Na A5, testar abertura das duas versões pelos fluxos do GED. Os dez arquivos serão preservados na A2; investigar uso antes de qualquer descarte.

## Gate G-A1

**Critérios técnicos atendidos:** dump restaurado, 29 tabelas/view/enums/contagens equivalentes e 52 hashes de arquivo iguais. As duas referências ausentes e os dez arquivos sem referência estão registrados, sem exclusão. **A2 aguarda aprovação desta evidência**, conforme o plano v2.
