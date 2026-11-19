# Entrega final — Unificado 1.4.20 em homologação

Endereço: **https://concrefer.concretrack.com.br:18446/unificado/**.

As fases 1 a 7 foram implementadas na branch `feat/padrao-visual-unificado`, com registros por fase. A produção permanece na versão anterior, sem publicação, push ou PR. A entrega termina na homologação para o teste definitivo do usuário.

## Resultado e evidências

- [x] Fases 1–7 publicadas, com versão final **1.4.20**, URLs de assets atualizadas e cache do service worker correspondente. `deploy-results.json`, `service-deploy-results.json` e `final-release-audit.json` verificam a publicação, inclusive os 198 arquivos públicos acumulados e 65 assets isolados dos serviços.
- [x] Catálogo executado com os contextos existentes de gerência, PCP, produção, laboratório, qualidade, suprimentos e consulta, respeitando as concessões de cada conta. O catálogo possui 139 entradas e 138 identificadores distintos; `formasPorSetor` aparece em dois grupos. Os resultados completos e contagens finais estão em `matrix-summary.json` e `matrix-*.json`.
- [x] Verificação nas larguras **1440×900, 1024×768, 820×1180 e 390×844**, sem rolagem horizontal do corpo, página vazia, erro JavaScript ou recusa indevida nos casos aprovados. Não foram registradas requisições externas do navegador. Recusas previstas pelas permissões são testes negativos separados: negociação PCP para conta sem vínculo e acesso do Laboratório ao Suprimentos sem habilitação na API nativa. O 403 da autoridade `/api/suprimentos/me` é conferido antes desses casos e preservado; não foi concedido acesso para eliminar a recusa. `boundaries-laboratorio.json` identifica esse limite entre o catálogo central e a autorização nativa.
- [x] Solicitação de suprimentos criada, aprovada em dois níveis e concluída: **SOL-00084**. Programação da semana de teste **11/03/2030** salva, validada e publicada. Leitura de CP de teste persistida com **32,5 MPa**. Carta de Traço **12** mantida em Rascunho. NC **RNC-2026-825490** registrada, triada e tratada com contenção persistida até Análise de causa. As evidências originais estão nas fases 3, 4, 5 e 6; `final-flows.json` confirma a releitura final dos registros.
- [x] Login real com a conta fornecida pelo usuário e logout pelo botão **Sair**, sem alteração de senha/cadastro. Após sair, a sessão respondeu **401** e os tokens locais foram removidos. `login-logout.json`; a senha não foi gravada nos artefatos.
- [x] PDFs de armaduras e séries continuam byte a byte iguais às emissões da fase 4: `pdf-verification.json`. As comparações anteriores de impressão estão na fase 4. O CSS original de impressão foi preservado, inclusive os estilos inline convertidos.
- [x] Atualização do service worker **1.4.19 → 1.4.20**, sem limpar cache manualmente: `service-worker.json`.
- [x] Login de celular/tablet idêntico ao publicado 1.4.6, nas três larguras até 1024px, excluindo apenas os 28px inferiores que contêm a versão: `login-comparison.json`. O login desktop segue o novo padrão.
- [x] Gate **7/7**, 24 testes de Laboratório, 13 testes de interface/acessibilidade de Tarefas, quatro testes da trava visual, teste de contexto de setor e análise de sintaxe dos scripts alterados aprovados. `checks.json`, `style-guard.json` e `syntax-checks.json` registram a consolidação. A trava verifica **306 arquivos autorados**.
- [x] Auditoria de produção: **893 arquivos sem diferenças**, 23 serviços conferidos e nenhum processo persistente de produção alterado. Mudanças normais de jobs `oneshot` são separadas em `generation-production-audit.json`.
- [x] Perfis das **64 contas do Mapa e 24 do PCP**, **667 permissões de tela**, **21 permissões de ação** e **17 vínculos de identidade** iguais aos dumps anteriores: `phase7-iam-audit.json`. Nenhuma permissão foi atribuída para fazer um teste passar.

As larguras, páginas, chamadas e erros são medidos automaticamente; as capturas permitem a revisão visual final. A matriz cobre as entradas autorizadas do catálogo e não simula todas as combinações possíveis de dados ou ações de cada aplicação.

## Correções finais

O contexto explícito de setor do Mapa deixa de ser substituído por `HUB` durante a inicialização. Contas somente PCP não consultam antecipadamente Armação/acesso rápido. A entrada de convidados usa o cabeçalho atual sem erro JavaScript. Gráficos e filtros passaram a respeitar a largura disponível. A tela legada de teste de programação usa o bootstrap, o contexto e o encaminhamento já existentes no PCP. A ajuda do monitor não consulta dados de dispositivos. Uma injeção de assets dentro da string de impressão do relatório legado de consumo foi removida; a análise de sintaxe cobre também scripts inline.

A trava da fase 7 impede a reintrodução de fontes fora dos tokens, cores de interface fora da paleta, gradientes, títulos decorativos e emojis pictográficos. As exceções de impressão, login estreito, builds/bibliotecas e séries de gráficos estão delimitadas em [EXCECOES-VISUAIS.md](EXCECOES-VISUAIS.md).

## Paridade e isolamento

Os módulos publicados foram copiados para serviços próprios, preservando os contratos e as regras existentes. As dependências finais encontradas na matriz receberam cópias isoladas:

| Dependência | Destino exclusivo de teste | Origem e limite |
| --- | --- | --- |
| Fechamento Diário de Produção e PCP | serviço ERP 14189; `erp_visual_homolog_20261118` | Código publicado lido por SFTP; tabelas de backup offline de 29/08/2026; papel SQL somente SELECT. Integração Mapa/PCP aponta a 14152; fallback REST/planilhas aponta à infraestrutura local, sem chamada ao Supabase ou ao ERP de produção. |
| Dosagem nativa | serviço 14169; `dosagem_visual_homolog_20261118` | Dump offline de 22/10/2026, esquema público usado pelo código publicado, papel técnico próprio. Não usa o banco de produção nem o banco do Mapa como substituto. |
| Monitor térmico | serviço 14190; arquivos em `visual-full/monitor/data` | Snapshot de arquivos de configuração/histórico, sem chamada ao monitor de produção. Nenhuma rota de ingestão de dispositivos foi publicada. |
| CEC Noroeste | `cec_noroeste_visual_homolog_20261118` | As três tabelas analíticas vazias foram alinhadas às chaves por número de série já usadas pelos repositórios publicados. Dump anterior preservado; nenhuma leitura existente foi convertida. |

Os novos serviços aceitam rede somente em localhost. SMTP, integrações externas de escrita e workers de sincronização de produção não foram habilitados. As regras Nginx adicionadas estão somente no snippet da porta 18446, com backup e `nginx -t` antes da recarga. Não houve reinício de API ou banco de produção.

Armação tem instância própria e API de unidades alinhada, mas suas quatro unidades continuam com `enabled:false` na configuração existente da cópia de teste. Essa habilitação operacional não foi alterada nesta revisão, nem foram atribuídos papéis. As telas de programação/relatório de armaduras do PCP são outro fluxo e foram testadas normalmente.

**Os dados de teste são snapshots e registros identificados de homologação; não são uma réplica em tempo real.** As fontes externas não habilitadas continuam exibindo os avisos/fallbacks previstos no sistema. Os bancos, serviços, backups e adaptações estão em `phase6-erp.json` na fase 6 e nos arquivos `phase7-services.json`, `phase7-monitor-snapshot.json`, `phase7-dosagem-database.json` e `phase7-noro-schema.json` desta pasta.

## Capturas, arquivos e diferenças dos exemplos

- [Galeria de todas as telas](galeria.html). Imagens em `matriz-capturas/` e `casca/`. As imagens das revisões finais podem mostrar a versão candidata anterior; o login estreito e os últimos ajustes foram revalidados separadamente na versão final.
- Lista completa da entrega desde a base da branch: `arquivos-repositorio.txt`. Arquivos públicos e hashes: `final-public-manifest.json`. Assets de serviço: `service-manifest.json`. Os pacotes de implantação e resultados por fase permanecem nos respectivos diretórios.
- Os números e as opções de tela vêm dos dados e das permissões reais; diferem dos exemplos estáticos. Não foram criados valores fictícios para reproduzir o mockup.
- A versão efetivamente publicada antes da revisão já carregava `navigation.js` e já possuía barra inferior móvel. Essa estrutura foi preservada, conforme registrado na fase 2; não foi criada outra navegação.
- Tabelas agrupadas e de previsão mantêm suas relações e rolagem local. Listas simples recebem rótulos de campos no celular. A impressão conserva o formato anterior.
- O acesso rápido da conta principal estava desativado e não foi habilitado. Sua prévia de componentes, filtrada pelo IAM, está identificada na galeria da fase 2.

## Roteiro curto para o teste definitivo

1. Abra a porta **18446** e confirme a faixa **AMBIENTE DE TESTE** e a versão **1.4.20**. Entre e saia normalmente.
2. Confira Início, menu recolhido, busca e seleção de módulos em computador, tablet e celular. No celular/tablet, confira que o login continua com a aparência anterior.
3. Abra Suprimentos, programação da semana, números de série, Laboratório/Carta de Traço e Qualidade. Consulte os registros de teste identificados acima; não use os dados como posição atual de produção.
4. Abra Logística, Mapa/Liberação, Manutenção, os dois Fechamentos Diários, Dosagem e CEC Noroeste. Confira dados, estados vazios/avisos de fontes offline e ausência de rolagem lateral.
5. Gere uma impressão/PDF e atualize uma aba que já estava aberta. Compare as capturas da galeria se encontrar um ajuste visual.

**Próxima etapa:** aguardar o teste e o aval escrito do usuário. Nenhuma publicação em produção está autorizada por esta entrega.
