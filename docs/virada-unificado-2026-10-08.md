# Virada do PCP e Mapa unificados — 08/10/2026

## Cadastro de formas

- Fonte de dados: `C:\Users\Admin\Desktop\FORMAS.xlsx`, SHA-256 `f42c3808a33cb6817f719b01ad195dc0dbb722eccec90beac0e86ff1a6b3cf8f`, 34 linhas úteis; colunas A = código do modelo Mega, B = descrição, C = código do tipo de forma. O conteúdo da planilha foi tratado somente como dado.
- O banco `pcp_unificado_teste` recebeu `catalogo_tipos_forma` (34 modelos), `mapeamento_formas.codigo_tipo_forma` e `mapeamento_formas.codigo_modelo_mega`. A descrição antiga de `tipo_forma` foi preservada.
- 28 modelos tiveram correspondência exata com `produtos`; 349 das 355 formas físicas dos Setores 1 e 2 receberam código do tipo e modelo. Seis formas `S2-934-01` a `S2-934-06` ficaram sem código Mega porque o cadastro não distingue CPFL de Elektro. Nenhum vínculo ambíguo foi inventado.
- A tela publicada **Planejamento → Formas por Setor** e seu CSV mostram os dois códigos novos. Exemplo verificado por clique: A-33 → tipo A → modelo Mega 969.

## Dados para o Mapa novo

- A origem oficial do Mapa foi exportada somente por leitura em 08/10/2026 às 22:00:11 UTC. Seis tabelas operacionais do banco novo foram sincronizadas e verificadas por contagem e hash dos IDs: `programacao_pcp` 3.547; `liberacao_formas` 5.346; `producao` 23.190; `montagem_poste` 9.528; `formas_manutencao` 2; `prog_s3_s4` 0.
- `usuarios`, permissões e vínculos de identidade do unificado foram preservados. Registros exclusivamente sintéticos das tabelas operacionais novas estão no backup anterior à sincronização.
- Em navegador com toque simulado, na URL publicada, Setor 3 e Setor 4 gravaram um apontamento de teste (HTTP 201); os registros de teste foram apagados. O service worker do Mapa e o shell foram atualizados para 0.6.46. A ponte PCP do Setor 4 passou a enviar a identificação da tela: na URL publicada, a programação DTB 01 foi lida (HTTP 200) e destacada na célula por toque simulado. Respostas 403 de Setor 3 na mesma sessão são esperadas para um Apontador restrito ao Setor 4.

## PCP de amanhã

- No PCP antigo, a programação comum e o Mega vão apenas até **07/10** (12 linhas oficiais: 58 postes/12,620 m³ no Setor 1; 80 postes/19,913 m³ no Setor 2; 249 linhas Mega). A Circular S3 já contém 49 linhas datadas de 09/10. Em 08/10 não foi localizada programação nova para 09/10 nos Setores 1 e 2. Não se colocou uma programação inexistente no PCP novo.
- Uma cópia integral somente leitura do PCP oficial está no servidor novo como backup. O PCP antigo não recebeu alteração ou reinício.
- O arquivo Mega `docs/validacao-pcp/Gd_FUP (79).xls` foi importado por clique na URL publicada com perfil PCP de teste: 252 linhas, 144 sem vínculo de produto. O PCP antigo também tem 143 sem vínculo em 249 linhas da última importação; os 34 códigos da planilha FORMAS não aparecem nesse Mega. Em data futura de teste, a tela salvou 26 linhas oficiais, alterou uma quantidade e o Mapa novo leu as 26 pela ponte PCP; todos os registros de teste foram apagados.
- Diego deve cadastrar a programação real de 09/10 no PCP unificado antes do primeiro apontamento. A última sincronização do Mapa antigo deve ocorrer antes do primeiro registro no Mapa novo caso o antigo receba alterações após o retrato acima. Não sincronizar o Mapa antigo sobre apontamentos já feitos no novo.

## Backups e volta

Os dumps verificados estão em `/var/backups/concrefer-unificado/cutover-20261008/` na VPS `vps-staging`, a mesma máquina do unificado. Arquivos privados (diretório 700, dumps 600): `pcp_concrefer_oficial_readonly.dump`, `pcp_unificado_teste.preformas.dump`, `mapa_unificado_teste.premapasyn.dump`, e `*.final.dump`. Os dumps finais foram refeitos em 08/10 às 22:35 UTC, depois dos testes. A versão anterior dos arquivos publicados está em `/opt/concrefer-unificado/releases/0.6.45-before-pcp-header/`.

Para voltar a operar, usar as URLs do PCP e Mapa antigos, que permaneceram disponíveis. Não misturar gravações nos dois Mapas no mesmo turno. A restauração dos bancos novos exige o dump correspondente e janela operacional; não foi feita cópia fora da VPS.
