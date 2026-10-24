# Execução — Certificados de qualidade no Laboratório

**Data:** 24/10/2026
**Estado:** implementado e publicado em **homologação** (`:18446`). **Produção não publicada** e `main` não mesclada: a verificação histórica exigida de 10 certificados não pode ser concluída com os dados existentes. O módulo de homologação mostra o aviso de fonte histórica insuficiente.

## Entrega e arquivos

- Módulo isolado em `unificado/laboratorio/certificados-qualidade/`: API FastAPI, regras em `core.py`, PDF de uma página em `report.py`, telas responsivas de emissão, histórico e cadastros em `static/`, exportação e importação legada somente por GET.
- IAM e navegação: `unificado/mapa/api/{app.py,screen_access.py,screen_catalog.json}` e `unificado/shell/{menu.config.js,router.js,modelo-a/menu.js}`. A entrada aparece no grupo Postes do Laboratório e abre dentro da casca do Unificado. O serviço oficial `laboratorio-unificado.service` não foi alterado.
- Migrações idempotentes e de adição: `migrations/001_schema.sql` cria `cq_certificados`, `cq_itens`, `cq_resultados_data`, `cq_prensas`, `cq_parametros`, `cq_modelos_poste` e `cq_sequencias`; `002_seed_modelos_existentes.sql` leu 100 modelos ativos já cadastrados em `ensaio_postes.poste_modelo`; `999_rollback.sql` documenta a reversão destrutiva após backup.
- Implantação reproduzível: `deploy/deploy_homolog.sh`, `deploy/patch_gateway.py`, `deploy/insert_nginx.py`, unidades systemd e fragmentos Nginx. O módulo usa porta local 13075 na homologação; o proxy mantém a autenticação do Laboratório e envia uma afirmação HMAC curta ao serviço.
- Evidências: `evidencias/emitir-desktop.png`, `emitir-mobile.png`, `historico-desktop.png`, `historico-mobile.png`, `navegacao-unificado-desktop.png` e `comparacao-legado.json`. PDFs reais de teste: `exemplos/homolog-3-datas-CQ-2026-0013.pdf` e `exemplos/homolog-10-datas-CQ-2026-0014.pdf`; cada um tem **uma página A4**. Os exemplos têm identificação explícita de homologação e não têm valor comercial.

## Fontes e migração

- Controle Estatístico antigo: `https://concretrack.com.br/api/controle-estatistico/rompimentos-grupos`, GET somente leitura. Os campos confirmados são `data_moldagem`, `data_ruptura`, `traco_id`, `idade_dias`, `cp` e `mpa`. A consulta usa a data de produção como data de moldagem, pagina todos os resultados e bloqueia emissão se a fonte falhar. No levantamento havia 840 leituras de 140 datas entre 05/01 e 20/10/2026.
- O cálculo agrupa por traço e idade, escolhe a maior média de 28 dias e registra o traço; conformidade exige média **maior** que o fck, sem mínimo como critério. Média e mínimo ficam no snapshot. Rascunhos refazem a consulta; emitidos preservam resultados, prensa, PDF e SHA-256.
- A aba legada `certificado` do Google Sheets, acessada pelo Apps Script antigo **apenas por GET**, retornou **8 certificados**. Todos os 8 foram importados para `concretrack_postes_homolog` com número original, produtos, valores legados disponíveis e JSON de origem. Não houve gravação na planilha. O arquivo bruto foi guardado fora do Git com modo 0600.
- Prensa usada nos ensaios de homologação: registro já existente em `ensaio_postes.equipamento` (Kratos IK-14 A/P, série 2220879, certificado 2354/26, calibração 14/07/2026, validade calculada em 12 meses). O cadastro de origem **não informa laboratório RBC**; foi gravado literalmente “Não informado no cadastro de origem”, sem criar esse dado. Esse campo precisa ser confirmado antes de uso comercial.
- Assinatura de Marcelo foi instalada fora da árvore pública em `/opt/concrefer-unificado/homolog/data/cq/assinatura-marcelo.png`, `monitorconcreto:monitorconcreto`, modo **0400**; não está no Git. Rascunhos não a exibem. O responsável de laboratório sai por nome; não foi inventada imagem de assinatura de Ricardo ou Philippe.

## Permissões e integridade

- Emissão: todos os perfis com acesso ao Laboratório. O usuário `philippe` recebeu acesso à tela de certificados para exercer a correção prevista; usuários sem acesso ao Laboratório continuam negados. Correção: IDs reais `user-ricardo`, `user-ricardo-do-amaral`, `alex`, `user-alex`, `philippe`, `marcelo`, validados no servidor. `phe` e `alexh` são contas distintas e não foram incluídas por semelhança de nome.
- A numeração `CQ-2026-NNNN` é atribuída em transação pelo banco. O último teste simultâneo produziu números distintos `CQ-2026-0011` e `CQ-2026-0012`. A revisão cria novo rascunho; o PDF anterior só passa a “Substituído” quando a nova revisão é emitida. O PDF antigo permaneceu idêntico byte a byte no teste.
- Homologação usa banco `concretrack_postes_homolog`; produção não recebeu tabelas nem código. Backup completo pré-implantação e snapshot de permissões da última publicação: `/opt/concrefer-unificado/homolog/backups/cq-20261024T220334Z`. Foram verificados: código 0750, dados 0700, assinatura 0400, arquivos do menu/gateway 0644, leitura do menu por `www-data` e ausência de novos caminhos 777/666. `nginx -t` passou.
- A senha fixa encontrada na trilha `db/*.py` do sistema antigo **não foi usada**. A rotação dessa senha no sistema legado fica pendente para o proprietário da integração.

## Testes e homologação

| Verificação | Resultado |
| --- | --- |
| `pytest` das regras, PDF 1/5/6/10 datas, acesso ao catálogo IAM | **11 passaram** |
| Páginas autenticadas Emitir/Histórico, desktop 1440px e celular 390px | **Passaram**; capturas salvas |
| Menu do Unificado → Laboratório → Certificados → iframe | **Passou** |
| PDF emitido com 3 e 10 datas reais do Controle Estatístico | **1 página cada**, QR e assinatura conferidos visualmente |
| Emissão por conta de Laboratório, revisão negada a não autorizado, revisão permitida a Ricardo, PDF antigo preservado | **Passou** |
| Calibração vencida | **Emissão bloqueada (HTTP 422)** |
| PDF de calibração, upload e leitura protegida | **Passou** em prensa marcada como teste |
| Sequência concorrente | **Números distintos**, sem colisão |
| Gate geral homologação (`modelo_a_gate.py`, PCP anônimo esperado 401) | **7/7** após a última publicação |
| Sem sessão na rota do certificado | **302 para login** |
| Link público `/v/CQ-2026-0004` | **200**, informa “verificação em breve” conforme escopo |

As duas primeiras tentativas de publicação em homologação retornaram automaticamente ao gateway/menu/Nginx anteriores: faltava `requests` no ambiente e, depois, o usuário da aplicação não tinha permissão de criar tabelas. O serviço passou a usar biblioteca HTTP padrão e a migração passou a ser aplicada pelo papel de migração, com tabelas pertencendo a `postes_app`. Uma tentativa seguinte retornou por uma corrida na inicialização do serviço; o smoke passou a aguardar a saúde por até 20 segundos. As tentativas seguintes passaram.

## Verificação histórica e bloqueio de produção

A comparação solicitada de **10 certificados antigos** é impossível com a fonte atual:

- A aba legada listou **8** certificados no total, sem paginação omitida no Apps Script.
- Desses 8, somente **1 par** tem valor de 28 dias tanto no legado quanto no Controle Estatístico: `CQ-20260326-153230`, 04/02/2026, **33,00 MPa em ambos**, não conforme para fck 35.
- Quatro certificados usam datas de produção de 2025, fora da cobertura observada no Controle Estatístico; outros registros têm resistência 28 dias ausente em uma das fontes. Detalhes por número em `evidencias/comparacao-legado.json`.

Assim, o requisito de comparação **10/10 falhou por ausência de dados**, mesmo com a API de CPs de 2026 operacional. A homologação continua acessível com aviso claro; **não houve merge em `main` nem deploy em produção**. Para liberar produção, é necessário disponibilizar dez certificados históricos verificáveis e os CPs correspondentes, completar a identificação RBC da prensa e repetir comparação, smoke e gate. Nenhum dado foi criado para completar a amostra.

## Git e links

- Base: `origin/main` em `acda605f`; branch `feat/laboratorio-certificado-qualidade`.
- `main` não continha o diretório `unificado/`. O commit `18bd19eb` trouxe a árvore já implantada de `origin/feat/sistema-unificado` para a branch baseada em `main`; isso cria uma diferença grande que deve ser reconciliada antes do merge final. Commit do módulo e relatório: `e843934c45864cdf299ca60dcb25b12667c48ad8`.
- Homologação: `https://concrefer.concretrack.com.br:18446/unificado/?view=laboratorio%2Fcertificados-qualidade%2F`.
- Produção: **não publicada**; a URL de produção não foi ativada.
