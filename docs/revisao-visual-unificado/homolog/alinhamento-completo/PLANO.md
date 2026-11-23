# Paridade funcional antes das fases 3–7

Autorização: pedido de 18/11/2026 para concluir todas as fases e disponibilizar
na homologação todas as funções/módulos publicados. Produção permanece somente
como origem de leitura de arquivos; nenhuma conexão a banco de produção.

## Origem publicada

Interface publicada 1.4.6 e código efetivamente usado pelos serviços, capturados
em `inventory.json` e `published-source-manifest.json`. Os caminhos e hashes
permitem distinguir arquivos efetivamente publicados de fontes locais antigas.
O inventário inicial de rotas é candidato: inclui arquivos auxiliares e precisa
ser confrontado com as instâncias reais de Laboratório/CQ em `homolog/`.

Referência de estrutura: backups privados **já existentes**, sem executar
`pg_dump` contra produção:

- `/var/backups/concrefer-unificado/20261118T200240Z/mapa_unificado_teste.dump`
- `/var/backups/concrefer-unificado/20261118T200240Z/pcp_unificado_teste.dump`
- `/var/backups/concrefer-ged-qualidade/20261118T053935Z/qualidade.dump`

Serão usados bancos vazios de referência, exclusivos da homologação, para
inspecionar essas estruturas: `mapa_ref_homolog_20261118`,
`pcp_ref_homolog_20261118`, `qualidade_ref_homolog_20261118`.
**Somente DDL**, sem contas ou senhas importadas. Servidores FDW e mapeamentos
de usuário serão excluídos; tabelas estrangeiras viram tabelas locais vazias.
Nenhum serviço da aplicação usará esses bancos de referência.

### Correção de isolamento antes de aplicar o plano

O ensaio revelou colisão entre os esquemas de estoque de Carta Traço e Noroeste.
A inspeção do serviço de Carta Traço publicado em produção confirmou que ele
usa `mapa_unificado_homolog_20261016`, apesar do nome de teste. O banco original
e o serviço publicado não serão alterados. A revisão passa a usar exclusivamente
as seis cópias `*_visual_homolog_20261118` listadas no documento do ambiente.
As contas/concessões das cópias são as da homologação anterior. O esquema de
estoque antigo é preservado na Carta Traço e arquivado na cópia do Mapa.
Essa separação substitui a tentativa de converter os identificadores antigos.
Nenhuma migração de paridade foi aplicada aos bancos originais de aplicação.

## Alinhamento previsto

- Mapa: módulos publicados de fechamento, layouts, etiquetas, manutenção de
  usina, usuários/unidades, Logística e Usinas/Noroeste; preservar cookies e
  destinos próprios da homologação. Tabelas/colunas ausentes serão adicionadas
  a partir das definições do backup; funções e views usarão a definição publicada.
- Logística: API própria na 13179, esquema `logistica` no PCP de homologação,
  IAM no Mapa de homologação. Código/migrações publicados l001–l004. Sem seed
  de permissões individuais; usuários Master seguem a regra já publicada.
- Dosagem: API própria na 13169, banco Mapa de homologação e esquema publicado,
  gateway com chave de teste. Migrações publicadas 20261017_01–20261018_04.
- Qualidade: alinhar código publicado, incluindo RNC revisão 3, com a estrutura
  registrada no dump de 18/11. Banco `qualidade_homolog_20261016`.
- Laboratório/CQ: alinhar código e DDL publicados de slump, flow, umidade e
  certificados em `concretrack_postes_homolog`; criar Python próprio de teste
  para não modificar o ambiente Python compartilhado com produção.
- Suprimentos: alinhar código e história de migrações com o publicado; banco
  `suprimentos_homolog_20261025`, atualmente em sup_0018.
- Usinas: serviços locais de relatórios/carta/CEC e dados de espelho próprios;
  retirar dependências de serviços de produção. Fontes externas não serão
  acessadas para simular uma paridade inexistente.
- GED/Hub/TV/Armação: conferir rotas, código e destinos, reaproveitando as
  instâncias isoladas existentes quando equivalentes.

## Proteções e validação

Antes de alterar bancos de aplicação: dump privado verificado de Mapa, PCP,
Qualidade, Laboratório e Suprimentos, mais backup de arquivos/configurações.
DDL aplicado somente aos bancos de homologação documentados. Migração não
importa contas, concessões de ações/telas ou vínculos individuais de produção.
Não excluir tabelas ou colunas existentes para forçar uma comparação limpa.

Adaptar somente parâmetros de isolamento: nome de banco, portas locais,
origem 18446, cookies, chaves próprias, armazenamento. Sem funcionalidade nova.
E-mails, push externo e integrações externas de escrita permanecem desativados.
Nenhum timer apontando a fonte de produção será usado para carregar dados.

Nginx: somente vhost/snippets exclusivos da 18446, quando necessário, com
backup e `nginx -t` antes de recarregar. Nenhum vhost/serviço de produção alterado.

Depois da paridade, cada fase visual terá versão, commit, backup, implantação,
capturas nas quatro larguras e testes apropriados. A validação final inclui
catálogo de telas, perfis, fluxos, PDFs e gate 7/7. Produção só será publicada
com a autorização escrita específica já combinada.
