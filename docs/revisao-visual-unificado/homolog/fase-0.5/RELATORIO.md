# Fase 0.5 — atualização funcional da homologação

**Estado:** as três telas solicitadas estão disponíveis e foram validadas na
porta **18446**. A fase 1 não foi iniciada e aguarda o ok do usuário.

## Versão e origem

- Casca e arquivos necessários do Planejamento: **1.4.6**, a versão publicada
  usada como origem desta sincronização.
- PCP: revisão de banco **`20261111_04`**, após as 19 migrações publicadas.
- Origem exata: `backend-hashes.json` e `release-manifest.json`.
- 205 arquivos copiados/conferidos; **139 arquivos de homologação têm conteúdo
  novo ou diferente** do estado anterior. A lista completa está em
  [`arquivos-alterados.txt`](arquivos-alterados.txt).
- Os arquivos da aplicação e das migrações são os publicados. As diferenças
  de HTML permitidas são apenas a faixa oficial de homologação. Os arquivos
  de ambiente de homologação foram preservados, incluindo bancos, portas,
  cookies, segredos próprios e integrações desativadas.
- Não houve push nem PR.

## Telas e serviços

| Tela | Resultado |
| --- | --- |
| Números de série dos postes — Setor 3 | Página abre; catálogo, previsão, saldos, execução e APIs de PDF respondem |
| Programação da semana — Setores 1 e 2 | Página abre; rascunho, salvamento, validação e publicação testados |
| Programação de armaduras e relatório | Página abre; programação derivada, calendário, emissão e reimpressão testados |

Foram atualizados `homolog-next/pcp-api` e os arquivos de interface necessários.
No Mapa, somente `screen_access.py` e `screen_catalog.json` foram sincronizados
com os publicados, para reconhecer os IDs das telas. O `app.py` isolado do
Mapa foi mantido. Foram reiniciados apenas `unificado-homolog-pcp.service`
(13154) e `unificado-homolog-mapa.service` (13152).

**Nginx não foi alterado nem recarregado.** Não houve reinício de serviço de
produção, alteração do vhost de produção ou conexão a banco de produção.

## Bancos, migrações e backups

Migrações somente em `pcp_unificado_homolog_20261016`:
`20261023_01`, `20261023_02`, `20261023_03`, `20261024_01`, `20261027_04`,
`20261029_01` a `20261029_07`, `20261103_01`, `20261105_01`, `20261105_02`,
`20261111_01` a `20261111_04`.

O [plano enviado antes da execução](PLANO-ANTES-DA-EXECUCAO.md) descreve o efeito
de cada migração. Os hashes dos 19 arquivos estão em
[`migration-manifest.json`](migration-manifest.json).

O Mapa `mapa_unificado_homolog_20261016` recebeu apenas um dump preventivo;
nenhuma migração foi aplicada nele. Os demais bancos não foram alterados.

Backup final anterior à execução bem-sucedida:

`/opt/concrefer-unificado/homolog-next/backups/padrao-visual-fase-0.5-20261118T171811Z`

| Dump | Tamanho | SHA-256 |
| --- | ---: | --- |
| `pcp.dump` | 445.832 bytes | `70458ac8148523ead6100f1f90000ae794e9eb29e6cd092ba7efc9c156276b02` |
| `mapa.dump` | 114.547.061 bytes | `a308b5fa919e01fcb348bb03985d719a7d84b8112dddb32ae7efb1d3d85d42d0` |

Os dois dumps foram verificados com `pg_restore -l`, permanecem em diretório
privado na VPS e não foram incluídos no Git. O mesmo diretório contém o
backup dos arquivos substituídos e o inventário de hashes.

### Ocorrência da primeira tentativa e correção

A primeira tentativa foi interrompida antes de executar Alembic: o usuário
de sistema `postgres` não podia executar o Python localizado no diretório
privado da homologação. A restauração automática também encontrou a ausência
do esquema padrão `public`. O esquema foi recriado e o dump original foi
restaurado; a homologação voltou a passar no gate 7/7 antes da nova tentativa.

A execução corrigida usou o usuário de banco já configurado para o PCP de
homologação, com DSN explicitamente limitado ao banco de homologação. As 19
migrações foram executadas sem modificar seus arquivos ou suas pré-condições.
O procedimento de retorno foi corrigido para recriar `public` antes de
restaurar. O backup da primeira tentativa foi mantido em
`.../padrao-visual-fase-0.5-20261118T171548Z`.

## Preservação de perfis e isolamento

A [verificação final](verification-results.json) comparou os dados com os dumps:

- 24 contas PCP: mesmos IDs, logins, perfis, estado e setor.
- 64 contas do Mapa: mesmos perfis, estados, setores e unidades.
- 667 concessões individuais de telas: inalteradas.
- 21 concessões individuais de ações: inalteradas.
- 17 vínculos de identidade: inalterados.

Nenhum perfil ou concessão foi escrito para fazer um teste passar. A conta de
produção que não tem vínculo Mapa foi testada pela sessão própria do PCP,
conforme o fluxo já existente, sem criar vínculo novo.

O [inventário de isolamento](isolation-audit.json) contém somente hosts,
portas e nomes de bancos, sem credenciais. A leitura do Mapa usa o endpoint
local **13153** e os DSNs apontam aos bancos de homologação. As integrações
Google de escrita permanecem vazias. Nenhum teste usou a origem de produção
ou envio de e-mail. A sincronização de séries consultou o Mapa local e
retornou zero execuções para o intervalo testado; não houve atribuição de
número definitivo nem edição de apontamento no Mapa.

Os hashes dos arquivos publicados e os PIDs/horários de início dos serviços
de produção foram comparados antes e depois e permaneceram iguais.

## Validação

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Três APIs principais | 200 | `api-smoke.json` |
| Três telas em 1440×900, 1024×768, 820×1180 e 390×844 | Abrem, sem erros de JavaScript e sem rolagem lateral no corpo da casca | `smoke-results.json`, `capturas/` |
| ADMIN/gerência, PCP, produção e consulta | Três telas abertas e três leituras 200 em cada perfil | `profiles-results.json` |
| Produção e consulta tentando editar semana, calendário e saldo de séries | 403, sem alteração de dados | `profiles-results.json` |
| PCP criando e salvando uma semana própria de teste | 201/200 | `profiles-pcp-results.json` |
| Criar, salvar, validar e publicar uma semana de teste | Passou | `flows-results.json` |
| PDF de armaduras e reimpressão | Mesmo SHA-256/bytes | `armaduras-teste.pdf`, `flows-results.json` |
| PDF de séries e reimpressão | Mesmo SHA-256/bytes | `series-teste.pdf`, `flows-results.json` |
| Sincronização do Mapa local | Passou; zero execuções no intervalo | `flows-results.json` |
| Gate básico | **7/7**, com a resposta anônima 401 já existente | `gate-final.txt` |
| Código publicado e perfis preservados | Passou | `verification-results.json` |
| Sintaxe dos arquivos copiados | 36 JavaScript e 81 Python verificados | `syntax-results.json` |

As bibliotecas adicionadas ao Python de homologação têm as mesmas versões do
ambiente publicado. O `pip check` passou. As credenciais de teste geradas
ficaram somente em memória; não foram salvas nos relatórios ou no Git.

### Dados de teste que permanecem na homologação

- Semana **07 a 11/01/2030**, ID **1**, com um poste dos setores 1/2,
  identificada no motivo como teste da fase 0.5.
- Programação circular de **07/01/2030**, forma **SC01**, modelo **9X200**.
- Rascunho de **14/01/2030**, criado e salvo pelo perfil PCP com um poste para
  comprovar a escrita permitida, sem publicação.
- Emissão de armaduras **1**, revisão **1**, e emissão de séries **1**,
  revisão **1**, referentes a essa semana de teste.

Não se copiou produção operacional ou usuários novos de um banco de produção.
Os saldos de referência são os definidos pela migração publicada aprovada.

## Limites observados fora das três telas

Esta fase não certifica todos os módulos do Unificado. O teste registrou dois
404 da casca que não impediram as três telas nem causaram erro de JavaScript:

- `/unificado/armacao/api/armacao/unidades`: já estava ausente na fase 0.
- `/unificado/mapa/api/unified/quick-access/me`: a casca 1.4.6 possui o cliente
  de Meu acesso rápido, mas esse endpoint não existe no `app.py` anterior da
  homologação. O cliente trata a falha sem bloquear as telas. Esse backend
  não foi alterado além dos dois arquivos previamente listados.

Essas dependências devem ser alinhadas antes de declarar o sistema inteiro
validado e antes de validar as respectivas fases visuais. Não foram ocultadas
por respostas simuladas, concessões novas ou alterações de regra. As próximas
etapas dependem da análise do usuário deste relatório.

## Roteiro curto para conferência

1. Abrir `https://concrefer.concretrack.com.br:18446/unificado/` e conferir a
   faixa de teste e a versão 1.4.6.
2. Em Planejamento, abrir **Programação da semana** e selecionar 07/01/2030.
   Conferir a semana publicada com um poste e o motivo de teste.
3. Abrir **Armaduras → Programação semanal / Relatório de produção** na mesma
   semana, grupo Setores 1 e 2. Conferir uma armadura e reimprimir a emissão 1.
4. Abrir **Números de série**, selecionar 07/01/2030, Setor 3, e conferir a
   forma SC01/9X200. A previsão não confirma nem reserva uma série. Reimprimir
   o PDF de teste no histórico.
5. Com produção ou consulta, conferir que as telas abrem e que editar a
   programação, o calendário ou o saldo inicial não é permitido.

**Parada solicitada:** nenhuma fase visual foi iniciada. Aguardar o ok do
usuário para começar a fase 1; não publicar em produção.
