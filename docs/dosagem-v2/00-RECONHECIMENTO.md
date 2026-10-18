# 00 — Reconhecimento do legado e do ambiente

## Repositório e publicação

- Repositório: `https://github.com/ricamaral01/pwa-hub.git`; domínio definido no `CNAME`: `usina.concretrack.com.br`.
- A versão atual está em `dosagem-concreto/index.html`; os scripts de autenticação em `auth/`; o service worker do Hub em `sw.js`.
- Não há workflow `.github/workflows` rastreado nesta cópia. A presença de `CNAME` na raiz indica GitHub Pages, mas a configuração da fonte de publicação não está disponível localmente. Confirmar a branch em Settings → Pages.
- O build v2 sai em `dosagem-concreto/v2/`, preservando a aplicação atual. O Hub `sw.js` recebeu apenas a exceção para `/dosagem-concreto/v2/`.

## Autenticação do Hub

- `auth/config.js` configura Supabase Auth e, nesta cópia, `authEnabled: false`. Portanto o guard retira a tela de espera sem exigir sessão.
- `auth/client.js` usa `supabase.createClient` com persistência de sessão e renovação automática. `window.ConcretrackAuth.session()` devolve a sessão; o token de acesso está em `session.access_token`. O nome e e-mail podem vir de `session.user.user_metadata` e `session.user.email`; o contexto do Hub também fornece `ctx.user`.
- O algoritmo do **token de acesso do usuário** não pode ser inferido com segurança da chave pública anon. A validação v2 usa `/auth/v1/user` do Supabase; o caminho HS256 é alternativo somente se `JWT_SECRET` for configurado.
- Com autenticação ativa, `auth/guard.js` redireciona ausência de sessão para `/login.html?next=...`, redireciona primeiro acesso para troca de senha e bloqueia quem não tem permissão `dosagem-concreto`.
- **Decisão:** o v2 permite apenas rascunho local sem sessão. A API exige token em toda operação, independentemente do estado do guard do Hub.

## Inventário de telas

O arquivo `PARIDADE.md` lista as 24 seções `sec-*` e 119 controles de botão encontrados dentro delas. Os demais controles em modais e áreas externas, além de ações dinâmicas, ainda precisam de inventário manual.

## Esquemas das planilhas antigas

Os IDs das planilhas antigas ficam apenas nas Script Properties do backend v2. A ordem abaixo foi extraída das declarações de cabeçalho dos Apps Scripts legados.

### Dosagem — CartasTraco (48 colunas)

`1. ID`, `2. Data/Hora`, `3. Nome do Traço`, `4. Versão`, `5. Unidade`, `6. Ativa Automação`, `7. Nome Automação`, `8. Revisão`, `9. Cliente`, `10. Obra`, `11. Local`, `12. Aplicação`, `13. Engenheiro`, `14. Técnico`, `15. ART/RRT`, `16. Data Carta`, `17. FCK (MPa)`, `18. Flow (mm)`, `19. a/c`, `20. Cimento (kg)`, `21. Adição (kg)`, `22. Areia Nat (kg)`, `23. Areia Ind (kg)`, `24. Brita 0 (kg)`, `25. Brita 1/2 (kg)`, `26. Água (kg)`, `27. Aditivo (kg)`, `28. Aditivo 2 (kg)`, `29. % Aditivo/Lig`, `30. Ar (%)`, `31. Observações`, `32. Custo Total (R$/m³)`, `33. Custo Ligantes`, `34. Custo Agregados`, `35. Custo Quím./Água`, `36. MCC Snapshot`, `37. Volume Total (L)`, `38. Teor Argamassa Massa (%)`, `39. Teor Argamassa Volume (%)`, `40. Vol. Arg. (L)`, `41. ρ Cim (g/cm³)`, `42. ρ Adic (g/cm³)`, `43. ρ An (g/cm³)`, `44. ρ Ai (g/cm³)`, `45. ρ B0 (g/cm³)`, `46. ρ B½ (g/cm³)`, `47. ρ Adit (g/cm³)`, `48. ρ Adit 2 (g/cm³)`.

### Dosagem — Página1 (23 colunas)

`1. ID`, `2. Data e Hora`, `3. Nome do Traço`, `4. FCK (MPa)`, `5. Cimento (kg)`, `6. Adição (kg)`, `7. Areia Natural (kg)`, `8. Areia Industrial (kg)`, `9. Brita 0 (kg)`, `10. Brita 1/2 (kg)`, `11. Água (kg)`, `12. Aditivo SP (kg)`, `13. Aditivo 2 (kg)`, `14. Ar Incorporado (%)`, `15. Flow (mm)`, `16. a/c`, `17. a/agl`, `18. Consumo Cimento (kg/m³)`, `19. Massa Esp. Concreto (kg/m³)`, `20. Volume Total (L)`, `21. Teor Argamassa Massa (%)`, `22. Teor Argamassa Volume (%)`, `23. Observações`.

### Dosagem — Experimental (38 colunas)

`1. ID`, `2. Data e Hora`, `3. Nome do Traço`, `4. FCK (MPa)`, `5. Cimento (kg)`, `6. Adição (kg)`, `7. Areia Natural (kg)`, `8. Areia Industrial (kg)`, `9. Brita 0 (kg)`, `10. Brita 1/2 (kg)`, `11. Água (kg)`, `12. Aditivo SP (kg)`, `13. Ar Incorporado (%)`, `14. Volume Betonada (L)`, `15. Nº Betonadas`, `16. Umid. Areia Nat. (%)`, `17. Umid. Areia Ind. (%)`, `18. Umid. Brita 0 (%)`, `19. Umid. Brita 1/2 (%)`, `20. Tipo Consistência`, `21. Consistência (mm)`, `22. Temp. Ambiente (°C)`, `23. Temp. Concreto (°C)`, `24. a/c`, `25. a/agl`, `26. Consumo Cimento (kg/m³)`, `27. R24h CP1 (MPa)`, `28. R24h CP2 (MPa)`, `29. R3d CP1 (MPa)`, `30. R3d CP2 (MPa)`, `31. R7d CP1 (MPa)`, `32. R7d CP2 (MPa)`, `33. R28d CP1 (MPa)`, `34. R28d CP2 (MPa)`, `35. Consist. 10min (mm)`, `36. Consist. 20min (mm)`, `37. Consist. 30min (mm)`, `38. Observações`.

### Custos — custo (19 colunas)

`1. ID`, `2. Data Cadastro`, `3. Nome Produto`, `4. Tipo Material`, `5. Chave MCC`, `6. Fornecedor`, `7. Unidade (MCC)`, `8. Versão`, `9. Unidade Medida`, `10. Preço (R$/unid.)`, `11. ICMS (%)`, `12. Deduz ICMS`, `13. Frete (R$/unid.)`, `14. Unid. Frete`, `15. ICMS Frete (%)`, `16. Deduz ICMS Frete`, `17. Custo Líq. R$/kg`, `18. Ativo`, `19. Observações`.

### Fornecedores — fornecedor (21 colunas)

`1. id`, `2. fornecedor`, `3. contato`, `4. telefone`, `5. produtoTipo`, `6. produtoNome`, `7. valor`, `8. produtoIcmsPct`, `9. contribuinteIcms`, `10. freteCusto`, `11. freteIcmsPct`, `12. freteContato`, `13. freteTelefone`, `14. valorFinal`, `15. valorLiquido`, `16. endereco`, `17. tipoFrete`, `18. suporteTecnico`, `19. avaliacao`, `20. observacoes`, `21. dataCadastro`.

### Fornecedores — ensaios_granulometria (8 colunas)

`1. id`, `2. tipo`, `3. material`, `4. fornecedor`, `5. data_ensaio`, `6. responsavel`, `7. timestamp`, `8. payload_json`.

## Chaves de localStorage do legado

| Chave | Formato observado | Origem |
|---|---|---|
| `cadastroFornecedoresV1` | array de registros de fornecedor | `index.html:5120-5150` |
| `ensaiosME` | array de ensaios de massa específica | `index.html:6104-6110` |
| `ensaiosGranMiudo` | array de ensaios granulométricos miúdos | `index.html:6127-6147` |
| `ensaiosGranGraudo` | array de ensaios granulométricos graúdos | `index.html:6150-6170` |
| `ct_materiais_rho` | objeto de massas específicas | `index.html:6616-6635` |
| `ct_hub_insumos` | objeto de dados de insumos | `index.html:6644-6657` |
| `ct_cartas_traco` | array de cartas com massas, identificação, versão e custos | `index.html:9577-9730` |
| `ct_carta_traco_atual` | objeto da última carta | `index.html:9730` |
| `ctDosagemCompare_A/B/C` | objeto de cenário, incluindo massas, indicadores e custo | `index.html:9803-9815` |
| `concretrack_premium_bank_v4` | array do banco local de traços | `index.html:9919-9932` |
| `ctCustosAvancados_v1` | objeto de configurações de custo | `index.html:10472-10568` |
| `mccTracao_v1` | objeto de configuração MCC por traço | `index.html:10631-10935` |
| `mcctr_cartas_v1` | array de cartas MCC | `index.html:10944-10949` |
| `mccComp_v2` | objeto de comparação MCC | `index.html:11650-11656` |
| `ct_cartas_inativas` | array de IDs de cartas inativas | `index.html:12087-12097` |

## Exportação JSON

`index.html:8877-9008` monta um objeto de carta de traço e baixa um arquivo JSON. O conversor v2 deve aceitar esse objeto e o formato local da carta; campos ausentes ou ambíguos exigem aviso, sem preenchimento fictício de densidades.

## Referências visuais

Os cinco mockups aprovados foram encontrados em `dosagem-concreto/docs/dosagem-v2/mockups/` (pasta legada, não rastreada pelo Git nesta cópia), e permaneceram intocados. O caminho diverge do `docs/dosagem-v2/mockups/` indicado na especificação.

## Lacunas de entrada da especificação

- O Apêndice A informa apenas o objetivo C40, não traz massas, densidades, preços nem indicadores esperados completos.
- O Apêndice B informa MF e Dmáx esperados, mas não traz a tabela de massas retidas por peneira.
- Os limites completos das zonas por peneira e para graúdo não vieram no texto; não foram inventados.
