# Laboratório — referências dimensionais A.1 e A.2

**Data:** 26/10/2026
**Ambientes:** homologação `:18446` e produção
**Versão do Unificado:** `1.0.104`

## Fontes e padronização

| Fonte recebida | Linhas | Variantes registradas | SHA-256 |
| --- | ---: | ---: | --- |
| `postes_circulares_tabela_A1.xlsx` | 47 | 94 (conicidades A e B) | `099d4af72bb42a480ed9a61dc3b2ff3f51dd4bc186ab41c7941fff58b4131af5` |
| `postes_DT_tabela_A2.xlsx` | 38 | 76 (faces A e B) | `75d75f68e3e81db68878b7684ca802a1fb3a877de40d00b09b3edc8dac2c51fd` |

As cópias em `unificado/laboratorio/dimensionais/fontes/` são idênticas, byte a byte, aos anexos recebidos. O importador `gerar_importacao.py` gera a migração SQL de forma reproduzível e valida contagem, sequência dos itens e unicidade das chaves.

O banco armazena a referência em `ensaio_postes.referencia_dimensional`, identificada por tabela, item, tipo, face, conicidade, comprimento e carga. Cada registro contém dimensões nominais em **mm**, comprimento comercial em **m**, carga em **daN**, massa aproximada em **kg**, tolerâncias, linha original completa e hash da planilha. O catálogo de modelos recebe apenas os modelos ausentes. Os 101 modelos preexistentes, seus valores manuais e ensaios foram preservados; 72 modelos DT foram acrescentados. O catálogo passou a ter **173 modelos**.

Para postes circulares, topo e base são diâmetros. Para DT, topo e base têm largura da face A e espessura da face B; a carga de cada face é mantida separadamente. A correspondência é exata por tipo, face, conicidade, comprimento e carga. Modelo fora das tabelas continua sem referência automática, com medida **N/A** em vez de uma dimensão inferida de outro modelo. Um valor nominal já cadastrado manualmente no modelo prevalece sobre o da referência.

## Uso na inspeção

A API `/api/postes` devolve as dimensões padronizadas e a procedência A.1/A.2. Ao registrar um ensaio, o servidor resolve o modelo exato e grava o retrato das dimensões usado na avaliação. A tela de inspeção agora oferece **comprimento do poste** além de topo e base.

O critério dimensional ativo usa os limites informados nas planilhas: comprimento nominal ±50 mm, seções de topo/base ±5 mm e cota de engastamento ±15 mm. F e J estão armazenados na referência, mas a sua verificação não foi ativada nesta entrega. A massa é aproximada e serve como dado de catálogo, sem julgamento de conformidade. Medições históricas que não registraram comprimento continuam como N/A.

## Implantação e verificação

1. Homologação: backup em `/opt/concrefer-unificado/backups/dimensionais-stage-20261026T133841Z`; migração, serviço e versão publicados. Teste autenticado da API: **173 modelos**, critérios ativos e amostras A.1/A.2 corretas.
2. Produção: backup em `/opt/concrefer-unificado/backups/dimensionais-production-20261026T134147Z`; mesma migração e pacote publicados. Teste autenticado da API: **173 modelos**, critério dimensional ativo. `/unificado/`, `/unificado/VERSION`, tela do ensaio e novo JavaScript responderam HTTP 200. `nginx -t` passou; os dois serviços do Laboratório estão ativos.
3. Banco de produção ativo `concretrack_postes`: **94 referências A.1 + 76 A.2**, 173 modelos, critério versão 4 com `usar_nominais_modelo=true`.
4. Banco isolado usado no teste de importação: a migração foi executada duas vezes para confirmar idempotência. Os cinco testes unitários de referência e avaliação passaram.

Na primeira tentativa de homologação, faltou `SELECT` para `postes_app` na nova tabela; a migração recebeu a concessão e o teste passou. A primeira tentativa de produção apontou para o banco inativo `concretrack_postes_unificado`; o script restaurou os arquivos, e as 72 linhas e duas versões de critério criadas nesse banco foram removidas em transação após confirmar que nenhum ensaio as utilizava. O banco inativo voltou a **101 modelos, critério versão 4 e sem a tabela nova**. O script foi corrigido para `concretrack_postes` e a implantação seguinte passou.

## Arquivos

- `unificado/laboratorio/dimensionais/`: planilhas fonte, gerador, SQL de importação, ativação do critério, testes e smoke.
- `unificado/laboratorio/service/server/postes_api.py`, `postes_rules.py`: leitura da referência, correspondência exata e avaliação.
- `unificado/laboratorio/service/server/static/novo/postes/`: tela e pacote JavaScript.
- `unificado/VERSION`, `index.html`, `sw.js`, `shell/shell.js`: versão `1.0.104` alinhada ao cache.
- `deploy/scripts/deploy-lab-dimensionais-20261026.sh`: backup, publicação, smoke e retorno automático.

**Limite:** a estimativa de que as tabelas cobrem 90% dos modelos operados não foi mensurada contra o histórico de produção. Os demais modelos permanecem no catálogo sem dimensões inventadas.
