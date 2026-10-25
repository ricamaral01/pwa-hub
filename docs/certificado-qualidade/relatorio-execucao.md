# Execução — Certificados de qualidade no Laboratório

**Data:** 24/10/2026
**Estado final em 24/10/2026:** módulo publicado em **homologação** (`:18446`) e **produção** com `CQ_FONTE_CP=novo`. O critério substituído passou: par legado 1/1 e comparação independente por SQL 10/10. O PDF foi refeito conforme os mockups aprovados; três exemplos de 1, 3 e 10 datas foram comparados visualmente. A tentativa inicial de produção descrita abaixo foi revertida; uma nova tentativa autorizada passou com backup, importação de 8 certificados legados e gate geral 7/7. `main` não foi mesclada. A emissão permanece bloqueada até o preenchimento do laboratório calibrador/RBC da prensa.

**Evidência final:** [relatorio-fase2-fonte-nova.md](relatorio-fase2-fonte-nova.md) contém as comparações lado a lado, os PDFs de exemplo, os testes e os backups. [modelos-sem-peso.md](modelos-sem-peso.md) lista os 100 modelos sem peso cadastrado.

**Ajuste posterior em 24/10/2026:** no quadro da prensa, patrimônio, kN e classe vazios foram ocultados; o laboratório passou a aparecer como “Laboratório RBC: <nome>”. O exemplo de 3 datas foi regenerado em `:18446` e comparado ao mockup. Homologação e produção passaram no gate 7/7. Novo backup de produção: `/opt/concrefer-unificado/backups/cq-production-20261025T015744Z`. O bloqueio de emissão até o preenchimento do laboratório RBC permanece. Detalhes e links no relatório da Fase 2.

**Conferência posterior da assinatura:** em `:18446`, uma prensa identificada como TESTE com RBC “TESTE HOMOLOGAÇÃO” permitiu emitir certificados de 3 e 10 datas (`CQ-2026-0015` e `CQ-2026-0016`). A assinatura de Marcelo aparece acima da linha em 72 e 49,3 px a 96 dpi; as duas linhas estão alinhadas. Os rascunhos não mostram a imagem. PDFs, PNGs e medidas estão no [relatório da Fase 2](relatorio-fase2-fonte-nova.md). Em produção, **sem emitir**, confirmou-se que o PNG protegido já existia fora de `public`, com o mesmo hash, dono e modo 0400 da homologação, e que o serviço aponta para esse caminho. Não houve alteração de código nem reinstalação em produção nesta conferência.

**Deploy reiterado em 25/10/2026:** a árvore publicada corresponde ao commit `7806c114` da branch `feat/laboratorio-certificado-producao`, já enviado ao remoto. O procedimento de produção foi executado novamente com backup `/opt/concrefer-unificado/backups/cq-production-20261025T100059Z`, importação histórica idempotente (0 novos), Nginx válido, serviço ativo, `CQ_FONTE_CP=novo` e gate **7/7**. Após o deploy, bootstrap, página autenticada e configuração responderam **200**; há uma prensa oficial e nenhuma prensa TESTE em produção. A emissão segue bloqueada enquanto o laboratório RBC da prensa oficial constar como “Não informado no cadastro de origem”.

## Entrega e arquivos

- Módulo isolado em `unificado/laboratorio/certificados-qualidade/`: API FastAPI, regras em `core.py`, PDF de uma página em `report.py`, telas responsivas de emissão, histórico e cadastros em `static/`, exportação e importação legada somente por GET.
- IAM e navegação: `unificado/mapa/api/{app.py,screen_access.py,screen_catalog.json}` e `unificado/shell/{menu.config.js,router.js,modelo-a/menu.js}`. A entrada aparece no grupo Postes do Laboratório e abre dentro da casca do Unificado. O serviço oficial `laboratorio-unificado.service` não foi alterado.
- Migrações idempotentes e de adição: `migrations/001_schema.sql` cria `cq_certificados`, `cq_itens`, `cq_resultados_data`, `cq_prensas`, `cq_parametros`, `cq_modelos_poste` e `cq_sequencias`; `002_seed_modelos_existentes.sql` lê os modelos ativos em `ensaio_postes.poste_modelo`; `003_seed_prensa_existente.sql` copia a identificação da prensa existente, mantendo o laboratório calibrador como não informado; `999_rollback.sql` documenta a reversão destrutiva após backup.
- Implantação reproduzível: `deploy/deploy_homolog.sh`, `deploy/patch_gateway.py`, `deploy/insert_nginx.py`, unidades systemd e fragmentos Nginx. O módulo usa porta local 13075 na homologação; o proxy mantém a autenticação do Laboratório e envia uma afirmação HMAC curta ao serviço.
- Evidências: `evidencias/emitir-desktop.png`, `emitir-mobile.png`, `historico-desktop.png`, `historico-mobile.png`, `navegacao-unificado-desktop.png` e `comparacao-legado.json`. PDFs reais de teste: `exemplos/homolog-3-datas-CQ-2026-0013.pdf` e `exemplos/homolog-10-datas-CQ-2026-0014.pdf`; cada um tem **uma página A4**. Os exemplos têm identificação explícita de homologação e não têm valor comercial.

## Fontes e migração

- Controle Estatístico antigo: `https://concretrack.com.br/api/controle-estatistico/rompimentos-grupos`, GET somente leitura. Os campos confirmados são `data_moldagem`, `data_ruptura`, `traco_id`, `idade_dias`, `cp` e `mpa`. A consulta usa a data de produção como data de moldagem, pagina todos os resultados e bloqueia emissão se a fonte falhar. No levantamento havia 840 leituras de 140 datas entre 05/01 e 20/10/2026.
- O cálculo agrupa por traço e idade, escolhe a maior média de 28 dias e registra o traço; conformidade exige média **maior** que o fck, sem mínimo como critério. Média e mínimo ficam no snapshot. Rascunhos refazem a consulta; emitidos preservam resultados, prensa, PDF e SHA-256.
- A aba legada `certificado` do Google Sheets, acessada pelo Apps Script antigo **apenas por GET**, retornou **8 certificados**. Todos os 8 foram importados para `concretrack_postes_homolog` com número original, produtos, valores legados disponíveis e JSON de origem. Não houve gravação na planilha. O arquivo bruto foi guardado fora do Git com modo 0600.
- Prensa usada nos ensaios de homologação: registro já existente em `ensaio_postes.equipamento` (Kratos IK-14 A/P, série 2220879, certificado 2354/26, calibração 14/07/2026, validade calculada em 12 meses). O cadastro de origem **não informa laboratório calibrador/RBC**; foi gravado literalmente “Não informado no cadastro de origem”, sem criar esse dado. Desde a Fase 2, a emissão é bloqueada com HTTP 422 e mensagem para completar o cadastro quando o campo estiver vazio ou “Não informado”.
- Assinatura de Marcelo foi instalada fora da árvore pública em `/opt/concrefer-unificado/homolog/data/cq/assinatura-marcelo.png`, `monitorconcreto:monitorconcreto`, modo **0400**; não está no Git. Rascunhos não a exibem. O responsável de laboratório sai por nome; não foi inventada imagem de assinatura de Ricardo ou Philippe.

## Permissões e integridade

- Emissão: todos os perfis com acesso ao Laboratório. O usuário `philippe` recebeu acesso à tela de certificados para exercer a correção prevista; usuários sem acesso ao Laboratório continuam negados. Correção: IDs reais `user-ricardo`, `user-ricardo-do-amaral`, `alex`, `user-alex`, `philippe`, `marcelo`, validados no servidor. `phe` e `alexh` são contas distintas e não foram incluídas por semelhança de nome.
- A numeração `CQ-2026-NNNN` é atribuída em transação pelo banco. O último teste simultâneo produziu números distintos `CQ-2026-0011` e `CQ-2026-0012`. A revisão cria novo rascunho; o PDF anterior só passa a “Substituído” quando a nova revisão é emitida. O PDF antigo permaneceu idêntico byte a byte no teste.
- Homologação usa banco `concretrack_postes_homolog`; produção usa `concretrack_postes`. O backup completo e snapshot da última publicação em homologação estão em `/opt/concrefer-unificado/homolog/backups/cq-phase2-20261025T013445Z`. O backup da tentativa revertida em produção está em `/opt/concrefer-unificado/backups/cq-production-20261025T003053Z`; o da publicação concluída, em `/opt/concrefer-unificado/backups/cq-production-20261025T013559Z`. O gate geral passou 7/7 após o retorno inicial e novamente após a publicação final. Não foi criado caminho 777/666 na publicação.
- A senha fixa encontrada na trilha `db/*.py` do sistema antigo **não foi usada**. A rotação dessa senha no sistema legado fica pendente para o proprietário da integração.

## Testes e homologação

| Verificação | Resultado |
| --- | --- |
| `pytest` das regras, fonte nova, arredondamento, PDF 1/5/6/10 datas, acesso ao catálogo IAM | **17 passaram** após a revisão do PDF |
| Páginas autenticadas Emitir/Histórico, desktop 1440px e celular 390px | **Passaram**; capturas salvas |
| Menu do Unificado → Laboratório → Certificados → iframe | **Passou** |
| PDF emitido com 3 e 10 datas reais do Controle Estatístico | **1 página cada**, QR e assinatura conferidos visualmente |
| Emissão por conta de Laboratório, revisão negada a não autorizado, revisão permitida a Ricardo, PDF antigo preservado | **Passou** |
| Calibração vencida | **Emissão bloqueada (HTTP 422)** |
| Laboratório calibrador vazio/“Não informado” | **Emissão bloqueada (HTTP 422)** em homologação |
| PDF de calibração, upload e leitura protegida | **Passou** em prensa marcada como teste |
| Sequência concorrente | **Números distintos**, sem colisão |
| Gate geral homologação (`modelo_a_gate.py`, PCP anônimo esperado 401) | **7/7** após a última publicação |
| Sem sessão na rota do certificado | **302 para login** |
| Link público `/v/CQ-2026-0004` | **200**, informa “verificação em breve” conforme escopo |

As duas primeiras tentativas de publicação em homologação retornaram automaticamente ao gateway/menu/Nginx anteriores: faltava `requests` no ambiente e, depois, o usuário da aplicação não tinha permissão de criar tabelas. O serviço passou a usar biblioteca HTTP padrão e a migração passou a ser aplicada pelo papel de migração, com tabelas pertencendo a `postes_app`. Uma tentativa seguinte retornou por uma corrida na inicialização do serviço; o smoke passou a aguardar a saúde por até 20 segundos. As tentativas seguintes passaram.

## Verificação histórica e critério substituído

A comparação solicitada de **10 certificados antigos** é impossível com a fonte atual:

- A aba legada listou **8** certificados no total, sem paginação omitida no Apps Script.
- Desses 8, somente **1 par** tem valor de 28 dias tanto no legado quanto no Controle Estatístico: `CQ-20260326-153230`, 04/02/2026, **33,00 MPa em ambos**, não conforme para fck 35.
- Quatro certificados usam datas de produção de 2025, fora da cobertura observada no Controle Estatístico; outros registros têm resistência 28 dias ausente em uma das fontes. Detalhes por número em `evidencias/comparacao-legado.json`.
- Busca adicional nos arquivos locais: `C:\Users\Admin\Downloads\Organizado\002. Documentos\Certificado de Qualidade.xlsx` tem 53 abas (52 além de `dadoscec`). Em 40 dessas 52 abas há datas de produção preenchidas na coluna C: 271 células de data, todas de **2025**; as outras 12 abas não trouxeram data nessa coluna. Consulta direta ao endpoint de CPs com `data_inicio=2025-01-01` e `data_fim=2025-12-31` respondeu `success=true`, `source=database`, **0 linhas** e `has_more=false`. Os dois PDFs locais `Certificado_Qualidade.pdf` e `Certificado_Qualidade_assinado.pdf` representam o mesmo número `CQ-20260305-082518`, já presente entre os 8 do Sheets. A planilha amplia o acervo legado, mas não fornece dez pares verificáveis com a fonte de CPs da VPS antiga. Não substituí a fonte de CPs aprovada pela planilha nem tratei células de `dadoscec` como ensaios verificados.
- Auditoria somente leitura diretamente no banco `controle_est_concre_db` da VPS antiga confirmou a cobertura: `rompimentos` contém 874 linhas, `rompimentos_atuais` 840 e `rompimentos_grupos` 464; nas três tabelas a menor `data_moldagem` é **05/01/2026**, a maior é **20/10/2026** e a quantidade de registros de 2025 é **zero**. O CSV local `resistencias_2025.csv.csv` existe, mas não é a fonte de CPs da VPS antiga aprovada pela especificação; não foi importado ou usado para liberar o gate.

O requisito antigo de comparar dez certificados foi **cancelado** pela decisão de 24/10/2026. Seu substituto foi cumprido: o par legado disponível `CQ-20260326-153230` bateu **33,00 MPa** nas fontes antiga e nova; dez datas de 2026 com 28 dias bateram **10/10** contra agregação SQL direta em `controle_est_concre_campinas.rompimentos_atuais`, incluindo nº de CPs, médias 3/7/28d, traço e resultado. A Fase 2 comparou também as fontes antiga e nova nos últimos 90 dias: 222 leituras em cada uma, sem datas faltantes ou diferenças. Três exemplos de rascunho (1, 3 e 10 datas) foram gerados em `:18446`, todos com uma página e dados reais da fonte nova. A revisão manual não é gate.

A primeira tentativa de produção começou após esses gates. O importador histórico não pôde abrir `/etc/concrefer-unificado/laboratorio.env` como `monitorconcreto` porque o diretório protegido não permite atravessamento. O retorno automático restaurou gateway, menus e Nginx, parou o serviço e removeu as tabelas `cq_*` recém-criadas. O gate geral após retorno passou **7/7**. O importador e o script foram corrigidos fora de produção, e a correção passou com o ambiente de homologação (`importados: 0`, idempotente). Após a autorização posterior do Ricardo para nova tentativa, a publicação passou: backup `/opt/concrefer-unificado/backups/cq-production-20261025T013559Z`, importação de 8 certificados, `CQ_FONTE_CP=novo`, serviço ativo e gate **7/7**. O campo do laboratório calibrador permanece para preenchimento no cadastro; sem ele, nenhum certificado será emitido.

## Git e links

- Base de publicação identificada: `origin/feat/sistema-unificado` em `c38fe79f`; branch limpa `feat/laboratorio-certificado-producao`, com cherry-picks do módulo e commit da Fase 2 `a85416de`. `main` **não foi mesclada**. A reconciliação de `main` fica pendente, conforme decisão do Ricardo.
- Homologação: `https://concrefer.concretrack.com.br:18446/unificado/?view=laboratorio%2Fcertificados-qualidade%2F`.
- Produção: **publicada na nova tentativa autorizada** em `https://concrefer.concretrack.com.br/unificado/?view=laboratorio%2Fcertificados-qualidade%2F`. O acesso exige sessão do Unificado; sem sessão, retorna 302 para login.
