# A0 — Revalidação somente leitura do GED

**Executado:** 15/10/2026, 07:44–07:45 BRT. **Estado:** evidência para revisão de Ricardo; nenhuma escrita, reinício ou alteração nas VPS. Referências: [mapa técnico](00-mapa-tecnico-ged.md), [esquema RNC](00-esquema-rnc-ged.md) e plano v2 fornecido por Ricardo.

## A0.1 — Hosts e papel

| Acesso SSH local | Hostname real | IP público observado na própria VPS | Papel | Registro de rede |
|---|---|---|---|---|
| `vps-rh` | `servidortesteConcreTrack` | `31.97.241.84` | GED oficial atual; compartilha host com outros serviços | [RIPE RDAP](https://rdap.db.ripe.net/ip/31.97.241.84): faixa `HOSTINGER-HOSTING` |
| `vps-staging` | `srv1725681` | `2.25.163.32` | VPS do Unificado, destino proposto | [RIPE RDAP](https://rdap.db.ripe.net/ip/2.25.163.32): faixa `HOSTINGER-HOSTING` |

Os nomes `vps-rh` e `vps-staging` são **aliases SSH**, não hostnames. O RDAP confirma a titularidade da faixa de rede Hostinger; não prova qual conta contratou cada VPS.

## A0.2 — Versões e Compose efetivos

| Componente | Lockfile na VPS | Imagem em execução | Observação |
|---|---:|---:|---|
| Next.js | 16.2.4 | 16.2.4 | `frontend/package.json` usa `^16.2.4` |
| React | 18.3.1 | 18.3.1 | O plano v2 aponta possível incompatibilidade com Next 16; a imagem está rodando. **Rebuild ainda não foi testado**. |
| Node.js | — | 20.20.2 no frontend e backend | Dockerfiles usam `node:20-alpine` sem digest fixo |
| Express | 4.22.1 | 4.22.1 | `backend/package.json` usa `^4.19.2` |
| PostgreSQL | — | 16.13 | `ged_postgres` |

`docker compose config --services` no diretório atual lista `postgres`, `backend`, `frontend` e o volume `postgres_data`. Há dois arquivos Compose. Os rótulos de implantação dos contêineres mostram:

| Contêiner | Início UTC | Política real | Arquivos usados na criação |
|---|---|---|---|
| `ged_frontend` | 27/07/2026 18:43 | `always` | base + `docker-compose.prod.yml` |
| `ged_backend` | 08/09/2026 13:22 | `unless-stopped` | somente base |
| `ged_postgres` | 08/09/2026 13:22 | `unless-stopped` | somente base |

Portas atuais: frontend `127.0.0.1:3000`, backend `127.0.0.1:4000`, banco sem publicação de 5432. **Divergência confirmada:** o conjunto foi criado com composições diferentes. No transporte, fixar um Compose revisado e registrar a versão de imagem, sem pressupor que `docker-compose.prod.yml` esteja aplicado aos três serviços.

## A0.3 — Esquema e volume RNC

Novo `pg_dump --schema-only -t 'public.rnc_*'` foi comparado com o DDL usado em `00-esquema-rnc-ged.md`: **tabelas, índices, constraints e triggers iguais**. Os oito enums `rnc_*` e `document_area` mantêm os mesmos valores documentados, inclusive os 20 valores de `document_area`.

| Medida | 00-esquema (15/10) | Recontagem (15/10, 07:44 BRT) | Diferença |
|---|---:|---:|---:|
| `rnc_reports` | 3 | 3 | 0 |
| `rnc_history` | 9 | 9 | 0 |
| Causa, ação, eficácia, anexo | 0 cada | 0 cada | 0 |
| Status `ABERTA` | não detalhado | 2 | — |
| Status `ENCERRADA` | não detalhado | 1 | — |
| Gravidade `ALTA` | não detalhada | 1 | — |
| Gravidade `MEDIA` | não detalhada | 2 | — |

`backend/uploads/rnc/` **não existe** neste momento; com zero anexos na tabela, isso é coerente. Recontar na A1 e no corte porque o GED continua oficial e pode receber anexos.

## A0.4 — Permissões do RNC

Consulta às 31 chaves de `permissions`, `role_permissions` e `user_permissions`: **nenhuma chave contém `rnc`**, logo há **0 papéis e 0 usuários com grant RBAC específico do RNC**. O acesso é implementado por `canUseRnc`, `canManageRnc` e `assertAccess` em `backend/src/controllers/rncController.js`:

- `ADMIN`, `ADMIN_MASTER`, `QUALIDADE`: gestão.
- `ENGENHARIA`, `LABORATORIO`: acesso a RNCs abertas por si, atribuídas a si ou da área gerenciada.
- Demais papéis: sem leitura/criação pelo controlador.

Isso corrige a hipótese de que exista um bloco de permissões `rnc*` para apenas “marcar como obsoleto” na C2. A C2 precisará preservar as regras existentes de leitura e bloquear as rotas de escrita explicitamente; não há grants RNC no banco para desativar.

## A0.5 — Documentos e arquivos

| Medida | Mapa técnico | Recontagem | Diferença |
|---|---:|---:|---:|
| `documents` | 32 | 32 | 0 |
| `versions` | 35 | 35 | 0 |
| `calibration_certificates` | 5 | 5 | 0 |
| Arquivos em `backend/uploads` | 52 | 52 | 0 |
| Tamanho `backend/uploads` | 18 MB (`du -sh`) | 18 MB (`du -sh`) | 0 aparente |

As medidas de tamanho são arredondadas pelo `du -h`. O manifesto de arquivos com bytes e SHA-256 pertence à A1.

## A0.6 — VPS nova e portas propostas

Na `srv1725681`, `ss -ltn` mostrou Nginx em 80/443; PostgreSQL 16 local em `127.0.0.1:5432`; APIs do Unificado e serviços relacionados em diversas portas, inclusive 13051–13065; Docker instalado. O bloco Nginx de `concrefer.concretrack.com.br` serve `/unificado/` de `/opt/concrefer-unificado/public`, já contém regras específicas de Mapa/PCP/Laboratório e usa `/api/` para o hub. O menu atual não contém GED.

| Recurso | Leitura em 15/10 | Proposta |
|---|---|---|
| Disco raiz | 387 GB, 34 GB usados, 353 GB livres | Suficiente para o tamanho atual; dimensionar crescimento e backups antes da A2 |
| RAM | 31 GiB, cerca de 27 GiB disponíveis | Validar consumo/carga no ensaio |
| Frontend GED | `13070` não estava escutando nem referenciado em Nginx/systemd | Vincular somente a `127.0.0.1:13070`, reconferindo no dia |
| Backend GED | `13071` não estava escutando nem referenciado em Nginx/systemd | Vincular somente a `127.0.0.1:13071`, reconferindo no dia |
| PostgreSQL GED | Não publicar porta | Rede Docker isolada e volume próprio |

**Trecho lógico a implementar na A3, não aplicado agora:** `/unificado/ged/api/` → API GED, `/unificado/ged/uploads/` → arquivos conforme regra de segurança da A4, `/unificado/ged/` → Next. As localizações precisam preceder a regra genérica `/unificado/`. `/api/` global já pertence ao hub.

## A0.7 — Propostas para decisão

| Decisão | Proposta concreta | Motivo |
|---|---|---|
| D2 Calibrações | Permanecem no GED nesta fase | 5 certificados existentes e QR/etiquetas dependem das rotas do GED |
| D3 Tarefas | Permanecem no GED; ações de NC serão próprias da Qualidade | Módulo de tarefas tem 0 registros no snapshot; objetos são distintos |
| D7 URLs antigas | Manter domínio GED com alias/redirecionamento por rota por pelo menos 12 meses. Usar 302 na validação inicial; trocar para 301 após confirmar QR impresso, documentos e links diretos. | Evita cache permanente de um redirecionamento não testado |

## Conclusão da tarefa

A0 está documentada e **sem alterações de produção**. Não houve divergência de contagens ou esquema. Há duas diferenças de arquitetura que devem acompanhar as etapas seguintes: **Next 16 + React 18 na imagem atual** e **ausência de permissões RBAC específicas do RNC**. As propostas D2, D3 e D7 aguardam decisão de Ricardo; o plano v2 exige aprovação da evidência antes de avançar para tarefa dependente.
