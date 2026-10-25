# Matriz de paridade: ConcreTrack × Unificado

**Atualização em 25/10/2026:** custos (consulta), cartas, consumo, fechamento
mensal e diário, produção por período e exportação CSV de massadas de Campinas
agora leem o espelho da VPS nova no menu Usinas. As linhas abaixo preservam a
fotografia de 22/10; a comparação e os limites atuais estão em
[Relatórios e custos](execucao/RELATORIOS-CUSTOS-20261025.md). Ajustes de
custo e publicação de reports diários continuam sem escrita no Unificado.

Status em 22/10/2026. “Parcial” indica capacidade semelhante em outro domínio do Unificado ou ponte; não significa que a regra e os dados já foram validados. **Usinas consulta no Unificado oficial as cartas de traço de Campinas pelo espelho**, com tela, busca, sessão e permissão `usinasInicio`; as outras funcionalidades continuam conforme a matriz. Evidência local: `unificado/usinas/index.html`, `unificado/mapa/api/usinas_receitas.py`, `unificado/shell/menu.config.js:90-95`, `unificado/mapa/api/screen_catalog.json:538`. Nesta matriz, “portar” uma tela ou consulta significa lê-la do **espelho**; não transfere escrita ou fonte oficial. Edição de tabela MISTA exige aprovação e [write-through na VPS antiga](execucao/write-through-evidencia.md).

| Área/função do legado | Evidência de origem | No Unificado hoje | Status | Ação para paridade |
|---|---|---|---|---|
| Painel inicial da usina | `public/index.html`, Dashboard Flask | página inicial vazia em Usinas | não existe | painel nativo por unidade, KPIs e atualização |
| Sessão, troca de senha, perfis | `api/security.py`, `api/routers/auth.py` | IAM Unificado, ACL por tela | parcial | vínculo verificado de contas e matriz de ações |
| Usuários e alçadas ConcreTrack | `public/usuarios/`, `/auth/users` | usuários de Mapa/PCP | parcial | migrar identidade sem duplicar credencial; auditar alçadas |
| Massadas e filtros | `/massadas`, `tbl_massadas` | outros painéis leem produção | parcial | ingestão fiel, consulta e detalhe em Usinas |
| Exportação XLSX de massadas | `/massadas/xlsx` | exportações pontuais em outros módulos | não existe | exportação equivalente com colunas e ordenação |
| Produtos e agregados | `/produtos`, `/agregados` | cadastros PCP não equivalentes | não existe | catálogo de materiais/produtos por unidade |
| Cartas/traços e revisões | `/tracos`, `tbl_receitas` | lista, busca, detalhe, histórico e impressão com os campos/unidades da composição legada de Campinas em Usinas oficial; Dosagem no Laboratório é outro domínio | parcial | validar carta impressa com dados reais, integrar médias de resistência, validar vínculo traço operacional × Dosagem e testar com sessão autorizada |
| Mapeamento campos do traço | `/tracos/config-campos` | sem tela Usinas | não existe | configuração versionada por unidade |
| Mapeamento do misturador | `tbl_est_config_massada`, tela cadastro | sem tela Usinas | não existe | posição física, material e fator vigente |
| Programação PCP da usina | `/pcp`, `/pcp/ordens` | Planejamento/PCP | parcial | integrar ordens e status sem duplicar cadastro |
| Estoque: material, entrada, acerto | `/estoque/materiais`, `/movimentos` | fluxos PCP separados | não existe | ledger de movimentos, validações e auditoria |
| Saldo, silos e nível | `/estoque/saldo`, `/silos/nivel` | sem equivalente Usinas | não existe | saldo reproduzível e projeção por silo |
| Consumo real e sincronização | `/estoque/consumo-producao`, `/sync-consumo-producao` | sem equivalente Usinas | não existe | job idempotente, checkpoint, data de corte |
| Previsão/MRP de cimento | `/estoque/consumo-agregados/analise` | sem equivalente Usinas | não existe | fórmula e alertas com testes de referência |
| NF por IA | `/estoque/nota-fiscal/*` | sem equivalente Usinas | não existe | job persistido e revisão humana |
| Custos de concreto e ajustes | `/relatorios/custos*` | sem equivalente Usinas | não existe | custos por unidade/material, ajustes auditáveis |
| Comparação de traços e carta visual | `public/relatorios/custos/*` | Dosagem tem custos próprios | parcial | preservar simulação e visualização do legado |
| Fechamento gerencial mensal | `/relatorios/fechamento` | relatórios isolados | parcial | paridade das fórmulas e ajustes por competência |
| Fechamento diário | `/relatorios/fechamento-diario` | ponte em `unificado/relatorios/` e PCP | parcial | consolidar na navegação Usinas e validar fontes |
| Produção por período | `/relatorios/producao-periodo` | painéis de produção de outros módulos | parcial | filtro, total e exportação por unidade |
| Consumo gerencial | `/relatorios/consumo` | sem relatório Usinas | não existe | somatórios de materiais e conversões |
| Cartas de traço gerenciais | `/relatorios/cartas-traco` | Dosagem tem cartas próprias | parcial | cruzar custo, resistência e produção sem perda |
| Reports diários / PCP | `/reports-diarios/pcp-producao/run` | Planejamento tem relatórios | parcial | manter rotina e contrato, sem duplicar publisher |
| CEC: leitura QR/rompimentos | `/qrcp`, CEC 3086 | Laboratório tem ensaios distintos | não existe | UI nativa e API CEC com trilha de eventos |
| CEC: análise e relatórios | CEC Node, 8 tabelas | sem equivalente Usinas | não existe | agregações diária/mensal, recálculo e filtros |
| Etiquetas CP e QR | Etiquetas 5050 | etiquetas PCP de outros tipos | parcial | PDF, layout de impressão e fila de destino |
| Dashboard de produção em tempo real | Dashboard Flask 8000 | dashboard PCP/Mapa | parcial | KPIs Usinas com frequência e fonte auditáveis |
| Apontar paradas e NC | Dashboard Flask, tabelas apontadas | Qualidade e Produção têm fluxos próprios | parcial | contrato único, rastreio sem duplicidade |
| PWA e offline de leitura | `sw.js`, `cec/leitura/sw.js` | shell PWA e PWAs específicos | parcial | cache/atualização seguros por tela |
| Multiunidade Campinas/Pederneiras | bancos e APIs separados | unidade em alguns módulos, sem modelo Usinas | não existe | `unidade_id` obrigatório e regras versionadas |
| Arquivos de backup e `__EFMigrationsHistory` | dumps históricos | não são funções de usuário | não deve migrar ao runtime | manter arquivo de evidência e política de retenção |
| Conta técnica legada como login ativo | `ct_usuarios.senha_hash` | IAM Unificado | não deve migrar ao runtime | vincular identidade; não criar segundo login |

## Padrão de integração do Unificado

- Menu e rota: `unificado/shell/menu.config.js`, `router.js`, `screen_catalog.json`.
- Permissão: `screen_access.py` combina perfil, tela e overrides; ações do módulo devem ter autorização também no backend.
- Módulos portados usam camadas próprias: PCP em `unificado/pcp/backend`, Laboratório em `unificado/laboratorio/service`, GED em `unificado/ged-nativo`. A Dosagem já usa montagem nativa sob o shell; ela demonstra a navegação desejada, mas não substitui os traços operacionais do ERP.
- O esquema `usinas` existe nos bancos de homologação e produção do Unificado para `tbl_receitas` Campinas. O modelo de `unidade_id` é explícito nesse recorte e precisará ser imposto nas próximas tabelas, unidades e consultas.

Não há item de negócio com paridade completa comprovada em Usinas. A lista de receitas é um primeiro recorte de leitura; essa classificação exigirá testes de contrato, dados, cálculos e autorização descritos no plano.
