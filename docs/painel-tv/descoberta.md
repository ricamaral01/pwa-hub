# Painel de TV da Produção — descoberta dos dados

**Data da inspeção:** 16/10/2026. **Estado:** descoberta concluída; [teste](conferencia-homologacao.md) e [publicação](publicacao-2026-10-16.md) registrados. **Definições recebidas de Ricardo:** “liberada” = liberada para concretar; programação oficial = tela Programação; dia produtivo vira às 00h00; usar o evento “Programada” do Mapa como complemento para S1/S2 e avisar quando divergir; manter as 86 formas cadastradas do S2 com aviso até identificar a 87ª. Referência visual aprovada: [mockup-painel-formas.html](mockup-painel-formas.html). As consultas aos bancos foram apenas de leitura, em transações `BEGIN READ ONLY` encerradas com `ROLLBACK`. Os nomes dos bancos em operação terminam em `_teste`, mas são os bancos usados pelos serviços da VPS nova; a inspeção não os alterou.

## Conclusão operacional

O Mapa/Produção registra a programação e a concretagem **por forma física** em `programacao_pcp` e `producao`. O PCP guarda o cadastro das formas e o volume por produto. A liberação **para concretar** é registrada em `liberacao_formas`, como Ricardo confirmou. Contudo, a programação por forma está incompleta nos dias recentes, especialmente nos setores 3 e 4, e não há volume efetivamente apontado por forma. A indicação de “Programação” como origem oficial ainda requer identificar qual das telas e como distribuir a programação por produto entre formas físicas sem inventar alocações.

## Fontes encontradas

| Origem | Tabela / API | Campos úteis | Observação |
|---|---|---|---|
| Mapa/Produção | `public.programacao_pcp` | `data_fabricacao`, `setor`, `forma`, `modelo`, `codigo_poste`, `descricao_poste`, `codigo_produto`, `quantidade`, `data_hora` | A ação **Programada** do apontamento grava aqui, uma linha por dia/setor/forma. Em 15 e 16/10, os campos de tipo/produto/modelo estavam vazios em todas as linhas examinadas. [Gravação no Mapa](../../mapa-concretagem/app.js). |
| Mapa/Produção | `public.producao` | `data_fabricacao`, `setor`, `forma`, `modelo`, `codigo_poste`, `descricao_poste`, `codigo_produto`, `tipo_concreto`, `status`, `data_hora` | É o apontamento por forma da concretagem. `status='LIBERADO'` nesta tabela representa o registro de produção, **não** desforma. Não há coluna de volume em m³, turno ou unidade. |
| Mapa/Produção | `public.liberacao_formas` | `data_fabricacao`, `setor`, `forma`, `colaborador`, `data_hora` | A tela grava a liberação **antes da concretagem**, inclusive com `tipo_concreto='Padrão'` provisório. Não é a liberação/desforma final. |
| Mapa/Produção | `api.vw_formas_status` | Chave dia/setor/forma; IDs e dados das três tabelas acima | [View](../../unificado/mapa/database/api_formas_status.sql) preparada para consulta de estado; a semântica de `liberacao_formas` permanece anterior à concretagem. A aplicação Mapa também possui [GET `/pcp/formas-por-setor`](../../unificado/mapa/api/app.py), que lê o catálogo do PCP. |
| PCP | `public.programacoes` | `data`, `setor_id`, `produto_id`, `codigo_forma`, `quantidade_programada`, `volume_m3_programado` | É a programação oficial do PCP. Nos setores 1/2 em outubro, `codigo_forma` está vazio: há quantidades por produto, não a escolha da forma física. |
| PCP/tela | [Programação Setor 1 e 2](../../unificado/pcp/programacao-alex/index.html); [Programação Setor 3 e 4](../../unificado/pcp/programacao/index.html) | S1/S2: programação por tipo/quantidade; S3/S4: quantidade por forma, gravada por `POST /api/programacao` | O próprio formulário S1/S2 chama o modo de “Programação por Poste” e envia `codigo_forma: null`. No S3/S4, usa “Programação por Forma” e envia o código físico. A indicação verbal “na programação” precisa ser vinculada à tela operacional exata se outra for usada. |
| PCP | `public.programacoes_circular_s3` e `public.programacoes_circular_s4` | Dia, `codigo_forma`, produto/modelo, volume previsto | As [APIs de programação circular](../../unificado/pcp/backend/app/api/routers/) expõem as linhas por forma. O último dia encontrado no S3 foi 09/10; S4 não tinha linhas. |
| PCP | `public.apontamentos_mega` e `public.producoes` | Apontamento de quantidade; `producoes.volume_m3_realizado` | `apontamentos_mega` tinha só **2 registros** no total, até 26/05; `producoes` tinha **0**. A [consulta do Apontamento Mega](../../unificado/pcp/backend/app/api/routers/pcp.py) usa primordialmente `producao` do Mapa, agregada por produto, e não resolve sozinha o estado de cada forma. |
| PCP | `public.mapeamento_formas` (S1/S2), `public.mapeamento_forma_postes` (S3/S4), `public.produtos` | `setor_id`, `codigo_forma`, `ativo`, `poste`/`produto_id`, `volume_m3` ou `volume` | Cadastro das formas e volume unitário. S3/S4 permitem vários tipos para a mesma forma. Há mapeamentos S3/S4 sem volume; `produtos.volume` também pode estar vazio. [Modelos de programação](../../unificado/pcp/backend/app/models/producao.py). |
| PCP/planilha | [GET `/api/pcp/alocacao-formas`](../../unificado/pcp/backend/app/api/routers/alocacao_formas.py) | Data, setor 3/4, forma compatível, poste | Distribui automaticamente quantidades da planilha entre formas livres. É uma **alocação calculada**, não comprovação de que aquela forma foi programada no chão de fábrica. A importação é uma operação separada de escrita; não será usada pelo painel. |
| Mapa/Usina externa | [GET `/usina/massadas`](../../unificado/mapa/api/app.py); relatório de [acompanhamento](../../mapa-concretagem/app.js) | Horário e quantidade da massada | A API repassa dados de `dautomacao.com`. O relatório apenas **sugere** associação temporal entre massadas e formas; não há vínculo persistido e confiável de volume real por forma. Não usar essa estimativa como “volume apontado” do painel. |

O `setor` é inteiro 1–4 nas fontes principais. Não foi encontrado campo de unidade nem de turno nessas tabelas; `data_fabricacao` é o dia declarado no apontamento. Há trechos de gravação com armazenamento local/offline no Mapa, inclusive programação S3/S4 em `localStorage` com sincronização para `prog_s3_s4`; essa tabela tinha **0 linhas** na inspeção. Um evento ainda não sincronizado pode não aparecer imediatamente no banco.

## Indicador → campo → regra possível

| Indicador/estado | Tabela.campo | Regra de cálculo e limite |
|---|---|---|
| Formas do setor | PCP `mapeamento_formas.setor_id,codigo_forma,ativo` (S1/S2); `mapeamento_forma_postes.setor_id,codigo_forma,ativo` (S3/S4) | `COUNT(DISTINCT forma normalizada)` entre formas ativas; nunca inventar sequência numérica como no mockup. |
| Programadas | Mapa `programacao_pcp.data_fabricacao,setor,forma`; quando completo, PCP `programacoes.data,setor_id,codigo_forma` | Contar formas físicas distintas com programação para o dia. A união/deduplicação entre fontes requer regra de precedência para não contar duas vezes. Programação apenas por quantidade/tipo, sem `codigo_forma`, não permite colorir uma forma específica. |
| Concretadas (realizado) | Mapa `producao.data_fabricacao,setor,forma` | Contar a **interseção** das formas programadas e das formas com concretagem apontada no dia. Concretagens sem programação ficam em diagnóstico separado; não entram no numerador nem criam programação fictícia. |
| Liberadas **para concretar** | Mapa `liberacao_formas.data_fabricacao,setor,forma` | Contar formas programadas com evento de liberação para concretar no dia. O evento permanece registrado depois da concretagem, então o KPI é cumulativo; no desenho de cada forma, **concretada** prevalece sobre **liberada**, que prevalece sobre **programada**. `producao.status='LIBERADO'` não é a fonte desse KPI. |
| Faltam / percentuais | Derivados dos dois indicadores acima | `faltam = max(0, programadas − concretadas)`, `% realizado = concretadas / programadas × 100`, `% falta = 100 − % realizado`; sem programação, mostrar `—` para os percentuais. Mostrar separadamente concretagens fora da programação. |
| Tipo/produto por forma | Mapa `programacao_pcp.codigo_produto,descricao_poste,modelo`; PCP `programacoes.produto_id` → `produtos`; PCP mapeamentos de formas | Preferir tipo registrado na programação por forma. S1/S2 podem herdar tipo do mapeamento unívoco. S3/S4 têm múltiplos tipos compatíveis por forma; não é seguro deduzir o tipo de uma forma **ainda não concretada** a partir do cadastro. |
| Volume previsto | PCP `programacoes.volume_m3_programado` ou mapeamento/produto `volume_m3`/`volume` | Somar o volume unitário do tipo **programado naquela forma**; só mostrar total exato quando todas as linhas tiverem tipo e m³ válidos. Não substituir falta de m³ por zero silenciosamente. |
| Volume realizado | Mapa `producao` + volume unitário do PCP | Não há volume de concreto apontado por forma. Se tipo e volume unitário forem conhecidos, `concretadas × m³ por peça`, marcado **“estimado”** na tela. `producoes.volume_m3_realizado` existe no PCP, porém a tabela está vazia. |
| Estado por forma | Cadastro + `programacao_pcp`/PCP + `liberacao_formas` + `producao` | `sem programação` → `programada` → `liberada para concretar` → `concretada`, com o estado mais avançado prevalecendo. Chave: dia local + setor + código de forma normalizado. Uma forma concretada sem programação não deve aparecer falsamente como programada. |
| Dia e última leitura | `data_fabricacao`; timestamps `data_hora`; relógio do servidor | Dia em `America/Sao_Paulo`, virada às **00h00**, confirmado por Ricardo. “Última leitura” deve ser o instante da consulta/cache, distinto do último apontamento. |
| Unidade | **Não encontrada nas tabelas examinadas** | Os registros não distinguem Pederneiras, Ribeirão e Noroeste. `?unidade=pederneiras` só pode ser aplicado com mapeamento/fonte confirmados; não se pode devolver os mesmos dados para outras unidades como se fossem próprios. |

## Conferência pontual de dados reais

Contagens abaixo são de **formas distintas** no Mapa, feitas em 16/10/2026. O dia 16 ainda estava em andamento. “Concretadas programadas” é a interseção, e não o total de concretagens.

| Dia | Setor | Programadas no Mapa | Formas com produção | Concretadas programadas | Leitura |
|---|---:|---:|---:|---:|---|
| 15/10 | 1 | 60 | 56 | 56 | Quatro programadas ainda sem produção. |
| 15/10 | 2 | 63 | 74 | 54 | Vinte concretagens em formas sem programação registrada para o dia. |
| 16/10 | 1 | 28 | 60 | 24 | Programação do dia está incompleta frente à produção. |
| 16/10 | 2 | 31 | 74 | 25 | Programação do dia está incompleta frente à produção. |
| 16/10 | 3 | 0 | 48 | 0 | Não havia programação por forma no Mapa. |
| 16/10 | 4 | 4 | 52 | 4 | A produção usa mais códigos/linhas de forma que o cadastro ativo de 37; investigar equivalências/repetições antes de apresentar capacidade. |

No período 01–16/10, o PCP tinha 64 linhas de programação S1 e 45 S2, porém **todas sem `codigo_forma`**. No S3, as 250 linhas de programação circular encontradas terminavam em 09/10; S4 não tinha linhas. Nas linhas do Mapa de 15 e 16/10, nenhum registro de `programacao_pcp` continha código do produto, descrição ou modelo preenchido. Assim, uma TV de “programação × realizado **por tipo e por forma**” não teria cobertura confiável para os quatro setores hoje.

## Cadastro de formas e volumes

| Setor | Ricardo confirmou | Formas distintas ativas no PCP | Diferença |
|---|---:|---:|---|
| 1 | 93 | 93 | 0 |
| 2 | 87 | **86** | **falta 1 no cadastro ativo** |
| 3 | 52 | 52 | 0 |
| 4 | 37 | 37 | 0 |
| **Total** | **269** | **268** | **−1** |

O acessório “Totem Medição indireta Elecktro” do S2 já consta também no mapeamento principal e não aumenta a contagem distinta. O cadastro S3/S4 possui múltiplas linhas por forma, conforme compatibilidade com postes. Há muitas combinações sem `volume_m3`, e parte dos produtos não tem `volume`; esses casos precisam aparecer como volume indisponível, não como zero.

**Identidade física adicional:** o PCP guarda códigos como `S1-4031-01`, enquanto o Mapa aponta `AE-01` para a mesma família. As listas estáticas do Mapa contêm 98 códigos no S1, 84 no S2, 52 no S3 e 61 no S4, também diferentes da capacidade confirmada/cadastro ativo em três setores. Um pareamento simples por prefixo e sequência encontrou apenas 77/93 correspondências S1 e 45/86 S2; portanto, não se pode presumir que todos os códigos sejam equivalentes. O protótipo deve expor a cobertura da identificação por forma e evitar pintar um código PCP como se fosse uma forma física do Mapa sem correspondência validada.

## O que não existe ou não está pronto para esta tela

1. Evento/coluna confiável de **desforma liberada** ou “forma disponível para nova programação” após concretagem; não é necessário para o indicador **liberada para concretar** confirmado por Ricardo.
2. Volume real de concreto no apontamento do Mapa; a tabela de produção com volume real do PCP está vazia.
3. Programação física diária completa para os quatro setores e tipo por forma, sobretudo S3/S4 e as linhas recentes do Mapa sem produto.
4. Identificador de unidade e turno nos registros principais; dados específicos de Ribeirão e Noroeste não foram localizados.
5. A 87ª forma ativa do S2 no cadastro do PCP.
6. Sessão exclusiva de TV de 30 dias/renovação automática pronta no fluxo atual: a sessão principal encontrada no Mapa é de 36 horas ([configuração](../../unificado/mapa/api/app.py)); a conta de serviço, catálogo e permissão exclusiva ainda precisariam ser construídos depois da aprovação.

## Decisões necessárias antes de construir

1. **87ª forma S2:** Ricardo ainda não sabe o código. No teste, mostrar as 86 cadastradas e avisar a diferença; não criar uma forma fictícia.
2. **Fonte por forma S1/S2:** Ricardo autorizou complementar a Programação oficial com `programacao_pcp` do Mapa e avisar divergências. Para o catálogo físico completo, falta validar um cruzamento de códigos PCP ↔ Mapa; as contagens das listas também divergem. A implementação de teste deve mostrar a cobertura e impedir que um código sem vínculo receba estado indevido.

A etapa 2 foi autorizada por “continue”. Construir primeiro no ambiente de teste `:18446`, comparar dois dias com consultas manuais, entregar capturas 1920×1080 e só então preparar a publicação na janela 20h–21h. A descoberta e suas consultas não alteraram os bancos nem a produção.
