# Módulo Suprimentos — Plano de implantação no Unificado (v2)

**Data:** 25/10/2026 · **Dono:** Ricardo Do Amaral · **Execução:** Codex, no formato “uma tarefa, uma evidência”
**Sugestão de local no repositório:** `docs/porting/suprimentos/00-plano-suprimentos.md`
**Base:** inventário `Controle de Estoque — inventário completo de Campinas` (25/10/2026) e mockups do canvas *Suprimentos — Mockups*.

> **O que mudou da v1:** (1) **Campinas entra primeiro**; (2) o Controle de Estoque atual do ERP cobre **só os insumos da usina** (agregados, cimento, aditivo). Ele **não** entra no Suprimentos: vai para o módulo **Laboratório** como “Estoque da usina”, junto com a Carta Traço. O Suprimentos cuida da solicitação, das compras, dos fornecedores e do **almoxarifado geral**, que é novo e não tem legado.
>
> Valores entre colchetes, como `[2.500]`, são parâmetros a confirmar e ficam em tabela de configuração, não no código.

---

## 1. Objetivo e fronteira

```
                ┌──────────────────────── SUPRIMENTOS (novo) ────────────────────────┐
Solicitação ──▶ │ Aprovação por alçada ─▶ Atendimento                                 │
(PWA / web)     │   ├─ item de almoxarifado com saldo ─▶ Reserva ─▶ Separação ─▶ Entrega│
                │   └─ sem saldo / insumo da usina   ─▶ Cotação ─▶ Pedido de compra    │
                │ Recebimento do ALMOXARIFADO (NF por IA, conferência, inspeção)        │
                │ Almoxarifado geral: saldo, reservas, entregas, inventário             │
                │ Fornecedores: qualificação e avaliação                                │
                └───────────────▲──────────────────────────────┬──────────────────────┘
                                │ sugestão de ressuprimento     │ pedido de compra de insumo
                                │ (previsão de cimento/agreg.)  ▼
                ┌──────────── LABORATÓRIO › Estoque da usina (migração do ERP) ───────┐
                │ Entrada com NF por IA + rateio por silo · saldo por silo ·          │
                │ baixa automática pelas massadas · mapeamento das caixas · acerto    │
                └──────────────────────────────────────────────────────────────────────┘
```

| Tema | Fica onde | Observação |
|---|---|---|
| Solicitação, aprovação, PWA | **Suprimentos** | Para qualquer material, inclusive insumo da usina |
| Cotação, pedido de compra, fornecedores | **Suprimentos** | Inclui compras de cimento, agregados e aditivo |
| Estoque e recebimento de EPI, ferramentas, abrasivos, consumíveis de produção, manutenção, limpeza | **Suprimentos › Almoxarifado** | Novo, sem legado: escrita nativa desde o início |
| Estoque, silos, entrada e baixa de agregados, cimento e aditivo | **Laboratório › Estoque da usina** | Migração própria a partir do inventário do ERP; o legado segue oficial até o gate dela |

**Integração entre os dois** (contrato pequeno e estável):
1. **Ressuprimento:** o Estoque da usina publica sugestões (material, quantidade, data limite, silo de destino). O Suprimentos as exibe no Painel e o comprador transforma a sugestão em solicitação com um clique.
2. **Pedido → entrada:** a entrada de insumo no Estoque da usina pode apontar o `pedido_id` do Suprimentos. Com isso, o pedido fica “recebido” e entra na avaliação do fornecedor (prazo e quantidade).
3. **Fornecedor único:** o cadastro de fornecedores é do Suprimentos e o Estoque da usina o reutiliza.

## 2. O que já existe

| Item | Situação |
|---|---|
| Controle de Estoque do ERP (8 telas, `tbl_est_*`, cron 00:01, NF por IA) | **Somente insumos da usina de Campinas**. Vai para o Laboratório (fora deste plano) |
| Solicitação, aprovação, compras, fornecedores, almoxarifado geral | **Não existem** em nenhum sistema: nascem no Suprimentos |
| PWA de Mão de Obra no Unificado | Padrão a copiar para o PWA de Solicitação (instalador próprio, iPhone/Android) |
| Módulo de Não Conformidade | Destino das reprovações na inspeção de recebimento |

Consequência prática: **o Suprimentos não tem migração nem coexistência de dados com a VPS antiga**. Tudo é nativo na VPS nova, e o risco fica concentrado no processo (adoção), não nos dados.

## 3. Lógica proposta (melhorias aplicadas no Suprimentos)

| # | Regra | Por quê |
|---|---|---|
| 1 | **Livro de movimentos imutável**: corrigir = estorno (`estorno_de_id`) + novo lançamento; não existe DELETE | Trilha de auditoria (ISO 9001 7.5); lição tirada do ERP |
| 2 | Recebimento é um **documento** (cabeçalho + itens); corrigir = estornar o documento e lançar a versão 2, com vínculo entre elas | Evita o “excluir e refazer” do legado |
| 3 | **Reserva**: `disponível = saldo − reservado`. A reserva nasce na aprovação e é baixada na entrega | Duas solicitações não “pegam” o mesmo saldo |
| 4 | **Cross-docking:** item comprado para uma solicitação entra e já sai para separação, sem ficar “livre” no estoque | Não some no meio do caminho |
| 5 | Conferência **pedido × NF × contado**; diferença ou preço acima do pedido → pendência com o comprador + avaliação do fornecedor | Recebimento cego e mensurável |
| 6 | **Custo médio ponderado móvel** por material e unidade. Uso e consumo: custo = item na NF + IPI + frete rateado por valor (sem crédito de ICMS) | Valor de estoque consistente. *Validar com a contabilidade.* |
| 7 | **EPI**: guarda CA e validade; não entrega EPI com CA vencido; entrega registrada por colaborador (ficha de EPI); diferença de EPI no inventário sempre pede aprovação | NR-6 |
| 8 | **Contagem cíclica cega**: o registro tem quantidade contada, horário de corte e quem contou; a diferença vira ajuste ligado à contagem; aprovação acima de R$ `[200]` ou para EPI | Substitui o texto `[Contagem fisica: X]` do legado |
| 9 | **NF por IA persistida** (fila `procrastinate`, ADR-011): anexo e resultado em JSON guardados; nada é gravado sem conferência humana | O legado perdia o status do job ao reiniciar |
| 10 | **Inspeção de recebimento**: checklist por categoria (EPI: CA; químico: FDS, lote e validade); reprovado → devolução + NC | ISO 9001 8.4 / 8.6 |
| 11 | **Ressuprimento sugerido**: ponto de pedido = consumo médio × (lead time + segurança). Gera uma solicitação `SUGERIDA`, e o comprador confirma | Nada é comprado sozinho |
| 12 | Pedido de compra com valor acima do aprovado em mais de `[10%]` volta para aprovação | Fecha a brecha entre a alçada e o preço real |

## 4. Estrutura do módulo

Menu (modelo A, bolinha teal `#2DD4BF`): **Painel · Solicitações · Cotações e pedidos · Recebimento · Almoxarifado · Inventário · Fornecedores · Cadastros e alçadas**.

**PWA Solicitação:** Início · Nova solicitação (itens → detalhes) · Minhas / confirmar recebimento · **Aprovar** (só para quem tem alçada).

| Papel | Pode |
|---|---|
| Solicitante | Criar, acompanhar e confirmar o recebimento das próprias solicitações |
| Aprovador (nível 1, 2…) | Aprovar, devolver ou reprovar dentro da alçada e do centro de custo |
| Almoxarife | Reservar, separar, entregar, receber, contar |
| Comprador | Cotar, emitir pedido, cadastrar fornecedor, confirmar ressuprimento |
| Qualidade | Qualificar fornecedor, decidir inspeção, ver NC |
| Administrador | Tudo, incluindo alçadas e parâmetros |

## 5. Estados

**Solicitação:** `RASCUNHO → EM_APROVACAO(n) → APROVADA → EM_ATENDIMENTO → ENTREGUE → CONCLUIDA` · `DEVOLVIDA` (volta ao solicitante) · `REPROVADA` · `CANCELADA` (enquanto nada estiver em atendimento) · `SUGERIDA` (ressuprimento → o comprador confirma ou descarta) · fecha sozinha `[48 h]` depois da entrega sem resposta.
Urgência: normal / urgente (SLA de aprovação `[4 h]`) / parou produção (avisa o aprovador e o almoxarife na hora; justificativa obrigatória).

**Item:** `PENDENTE → RESERVADO | EM_COTACAO → PEDIDO_EMITIDO → RECEBIDO → SEPARADO → ENTREGUE` · `ATENDIDO_PARCIAL` · `CANCELADO`. Item de insumo da usina termina em `RECEBIDO` (a entrada é feita no Estoque da usina).

**Pedido:** `RASCUNHO → EMITIDO → ENVIADO → PARCIAL → RECEBIDO → ENCERRADO` · `CANCELADO`.
**Recebimento:** `RASCUNHO → CONFERIDO → CONFIRMADO` · `ESTORNADO`. Inspeção `LIBERADO | CONDICIONAL | REPROVADO`.

## 6. Modelo de dados (schema `suprimentos`, todas as tabelas com `unidade_id`)

```sql
-- Cadastros
sup_unidade_medida(id, sigla, descricao) · sup_conversao(material_id, de_un, para_un, fator)
sup_material(id, codigo UNIQUE, descricao, categoria, un_estoque, controla_estoque,
             dominio[almoxarifado|insumo_usina], ponto_pedido, estoque_minimo, lote_economico,
             lead_time_dias, seguranca_dias, exige_ca, patrimoniado, ativo)
sup_epi_ca(material_id, numero_ca, validade)
sup_local(id, unidade_id, tipo[almoxarifado|deposito_inflamaveis|patio], nome)
sup_endereco(id, local_id, codigo)                          -- ex.: A-03-2
sup_centro_custo(id, unidade_id, codigo, nome, setor)
sup_alcada(id, unidade_id, cc_id NULL, categoria NULL, valor_ate, nivel, papel_aprovador)
sup_parametro(chave, valor, unidade_id NULL)

-- Solicitação
sup_solicitacao(id uuid, numero, unidade_id, cc_id, solicitante_id, origem[pwa|web|ressuprimento],
                urgencia, precisa_em, justificativa, status, valor_estimado, client_uuid UNIQUE NULL)
sup_solicitacao_item(id, solicitacao_id, material_id NULL, descricao_livre NULL, qtd, un,
                     qtd_reservada, qtd_comprar, qtd_entregue, status)
sup_solicitacao_anexo · sup_aprovacao(alvo_tipo, alvo_id, nivel, aprovador_id, decisao, comentario, em)
sup_reserva(id, solicitacao_item_id, material_id, endereco_id, qtd, status)
sup_sugestao_ressuprimento(id, origem[almoxarifado|estoque_usina], material_id, qtd, data_limite,
                           destino_ref NULL, status, solicitacao_id NULL)

-- Compras
sup_fornecedor(id, cnpj UNIQUE, razao, categorias[], situacao[em_qualificacao|qualificado|bloqueado], iqf)
sup_cotacao · sup_cotacao_item · sup_cotacao_preco(..., escolhido, justificativa)
sup_pedido(id, numero, fornecedor_id, status, valor_total, entrega_prevista)
sup_pedido_item(pedido_id, material_id, qtd, preco_unit, qtd_recebida, solicitacao_item_id)
sup_avaliacao_fornecedor(fornecedor_id, origem_ref, nota_prazo, nota_quantidade, nota_qualidade, nota_documentos)

-- Recebimento do almoxarifado
sup_recebimento(id, chave_nfe UNIQUE NULL, numero_nf, serie, emissao, fornecedor_id, pedido_id NULL,
                chegada_em, status, versao, substitui_id NULL, nf_job_id NULL)
sup_recebimento_item(id, recebimento_id, material_id, qtd_pedido, qtd_nf, qtd_contada,
                     valor_item, ipi, frete_rateado, custo_unit, lote, validade, endereco_id)
sup_inspecao(recebimento_id, checklist jsonb, decisao, nc_id NULL, por, em)
sup_nf_job(id, arquivo, status, provedor, resultado jsonb, erro, criado_em, concluido_em)

-- Almoxarifado (livro imutável)
sup_movimento(id bigint, unidade_id, material_id, endereco_id, data_mov,
              tipo[entrada|entrega|ajuste|transferencia|estorno], qtd_assinada, custo_unit,
              origem, origem_ref, chave_idempotencia UNIQUE, estorno_de_id NULL, colaborador_id NULL)
sup_saldo_snapshot(material_id, endereco_id, ate_data, saldo, custo_medio)
sup_inventario(id, numero, tipo[ciclico|geral], horario_corte, status)
sup_inventario_item(inventario_id, material_id, endereco_id, qtd_sistema, qtd_contada, diferenca,
                    valor, motivo, requer_aprovacao, aprovado_por, movimento_id)
```

`sup_material.dominio = insumo_usina` serve só para solicitar e comprar. O saldo desses materiais é lido do Estoque da usina (Laboratório) pela API de integração, nunca deste livro.

## 7. API (prefixo `/api/suprimentos`, sessão do Unificado)

| Grupo | Rotas |
|---|---|
| Solicitações | `GET/POST /solicitacoes`, `GET/PATCH /solicitacoes/{id}`, `POST …/enviar`, `/aprovar`, `/devolver`, `/reprovar`, `/cancelar`, `/confirmar-recebimento`, `POST /solicitacoes/aprovar-lote` |
| PWA | `GET /pwa/inicio`, `GET /pwa/catalogo?q=`, `POST /pwa/solicitacoes` (exige `client_uuid`; repetir o envio devolve a mesma solicitação) |
| Atendimento | `POST /itens/{id}/reservar`, `/separar`, `/entregar`, `/enviar-cotacao` |
| Compras | `/cotacoes` (+ `/precos`, `/gerar-pedidos`), `/pedidos` (+ `/pdf`, `/cancelar`) |
| Recebimento | `POST /recebimentos`, `POST /recebimentos/{id}/nf`, `GET /nf-jobs/{id}`, `POST …/confirmar`, `POST …/estornar` |
| Almoxarifado | `GET /saldo`, `GET /movimentos`, `POST /entregas` (sem solicitação, com motivo), `/inventarios` (+ `/confirmar`, `/aprovar`) |
| Integração | `POST /integracao/sugestoes` (o Estoque da usina publica), `POST /integracao/pedidos/{id}/recebido` (o Estoque da usina avisa a entrada), `GET /fornecedores` (reuso) |
| Cadastros | `/materiais`, `/locais`, `/enderecos`, `/fornecedores`, `/alcadas`, `/parametros`, `/centros-custo` |

## 8. PWA Solicitação

- Instalador próprio (manifest e escopo em `/unificado/suprimentos/pwa/`), no mesmo padrão do PWA de Mão de Obra; testar em iPhone e Android.
- Sessão do Unificado com cookie longo e renovação silenciosa (ADR-014); sem tela de login própria.
- **Offline:** catálogo e “minhas solicitações” em IndexedDB; a solicitação criada sem sinal vai para uma fila com `client_uuid` e é reenviada quando a conexão volta. O servidor é idempotente, então não duplica.
- Foto comprimida no celular (≤ 1600 px). Leitura de QR para etiquetas de material.
- O solicitante **não vê** saldo nem preço; quem decide estoque × compra é o atendimento.
- A aba Aprovar só aparece para quem tem alçada. Notificação push fica como etapa opcional depois.

## 9. Fases (todas em Campinas)

| Fase | Entrega | Gate para avançar |
|---|---|---|
| **S0 · Fundação** | Schema, cadastros (materiais do almoxarifado e catálogo dos insumos da usina para compra), endereços, centros de custo de Campinas, alçadas, papéis, item de menu | Cadastros conferidos pelo Ricardo |
| **S1 · Solicitação + aprovação + PWA** | Painel, Solicitações, Detalhe + PWA (5 telas). Atendimento manual (entregar e confirmar) | 2 semanas de uso em 1–2 setores de Campinas; zero solicitação duplicada pelo offline |
| **S2 · Almoxarifado** | Carga inicial (inventário geral de abertura), saldo, reservas, entregas, ficha de EPI, inventário cíclico | Inventário de abertura conferido; primeiro cíclico fechado |
| **S3 · Compras e recebimento** | Cotação, pedido (PDF), fornecedores, recebimento com NF por IA e inspeção | Primeira OC real recebida e avaliada |
| **S4 · Integração com o Estoque da usina** | Sugestões de ressuprimento de cimento/agregados → solicitação; pedido de insumo ligado à entrada no Laboratório | Depende da migração do Estoque da usina para o Laboratório |
| **S5 · Análises** | Curva ABC, consumo por setor/CC, lead time real, IQF | — |

Como o Suprimentos não substitui nada do ERP, **não há corte nem rollback de dados**. Cada fase entra com feature flag por unidade.

## 10. Testes de aceite (evidências em `docs/testes-paridade/suprimentos/`)

1. Mesma solicitação enviada 5 vezes offline → 1 registro.
2. Alçada na borda (= limite e limite + 0,01) → nível correto.
3. Reserva: duas solicitações disputando o último saldo → a segunda vai para compra.
4. Estorno de recebimento → saldo e custo médio voltam ao valor anterior.
5. Inventário: movimento depois do horário de corte não é absorvido pelo ajuste.
6. EPI com CA vencido → entrega bloqueada.
7. Permissões: cada papel só vê e faz o que a tabela da seção 4 permite.
8. PWA instalado em iPhone e Android: criar, enviar sem sinal, sincronizar, confirmar recebimento.

## 11. Prompts para o Codex (um por vez, sem avançar sem aprovação)

**S0.1 · Descoberta**
> Leia um módulo nativo pronto do Unificado (Mão de Obra e GED), o registro de módulos do menu lateral e o PWA de Mão de Obra (manifest, service worker, escopo, sessão). Entregue `docs/porting/suprimentos/01-descoberta.md` com: padrão de pastas back/front, como registrar um módulo e a cor da bolinha, como funcionam as permissões por caixas, como o PWA de Mão de Obra é instalado e como replicá-lo em `/unificado/suprimentos/pwa/`. Não altere código.

**S0.2 · Schema e cadastros**
> Com base em `docs/porting/suprimentos/00-plano-suprimentos.md` seção 6, crie a migration Alembic do schema `suprimentos` **somente com cadastros** (unidade de medida, conversão, material, CA de EPI, local, endereço, centro de custo, alçada, parâmetro, fornecedor) e as telas de Cadastros e alçadas. Unidade inicial: Campinas. Evidência: `02-schema-cadastros.md` com o diff, o upgrade/downgrade testado em staging e capturas.

**S1.1 · Solicitação (back)**
> Implemente solicitação, item, anexo, aprovação e reserva com os estados da seção 5, alçada por `sup_alcada` e as rotas Solicitações + PWA da seção 7, com idempotência por `client_uuid`. Testes para as transições e os itens 1, 2, 3 e 7 da seção 10. Evidência: `03-solicitacao-backend.md`.

**S1.2 · Telas desktop**
> Implemente Painel, Solicitações e Detalhe conforme os artboards 1–3 do canvas “Suprimentos — Mockups”, dentro da casca do Unificado (menu modelo A), em PC e tablet. Enquanto a S4 não existir, o cartão “Silos da usina” do Painel fica oculto. Evidência: capturas em 1440 e 820 px em `04-telas-solicitacao.md`.

**S1.3 · PWA Solicitação**
> Crie o PWA de Solicitação conforme os artboards PWA 1–5, no padrão do PWA de Mão de Obra: fila offline com reenvio, foto comprimida e aba Aprovar só para quem tem alçada. Teste em iPhone e Android. Evidência: `05-pwa-solicitacao.md` com o teste de envio duplicado offline.

(Prompts de S2–S5 serão gerados depois da aprovação de S1.)

## 12. Decisões pendentes

1. **Alçadas de Campinas:** valores e aprovadores por nível (mockup: nível 1 até `[R$ 2.500]` supervisor; acima, gerência).
2. **Quem atende em Campinas:** almoxarife e comprador dedicados? Compras é central ou por unidade?
3. **Compras de insumos da usina** (cimento, agregados, aditivo): passam pelo Suprimentos desde a S1 ou só na S4? Hoje são contratos ou pedidos recorrentes?
4. **Item fora do catálogo** no PWA: liberar ou bloquear?
5. **Inventário de abertura do almoxarifado de Campinas:** data e quem faz.
6. **Parâmetros:** fechamento automático `[48 h]`, ajuste de inventário sem aprovação até `[R$ 200]`, 3 cotações acima de `[R$ 1.000]`, tolerância de preço da OC `[10%]`.
7. **Custo do uso e consumo:** confirmar com a contabilidade o tratamento de ICMS e IPI.

---

### Anexo — recomendações para a migração do Estoque da usina (Laboratório)

Não fazem parte deste plano, mas saíram da análise do inventário do ERP e valem para a migração no Laboratório:
- Contagem física como registro estruturado (não texto na observação).
- Livro imutável com estorno no lugar de DELETE; recebimento rateado como documento com versões.
- Baixa pelas massadas com upsert idempotente por `(unidade, dia, posição, material)` + checkpoint diário, e um único gerador de baixas (desligar o cron 00:01 só depois de 14 dias de sombra com diferença zero).
- Material do silo e mapeamento das caixas com vigência (a troca do silo 1 em 30/06 vira dado, não código).
- Job da NF por IA persistido; conferência NF × balança.
- Publicar as sugestões de ressuprimento e ler o `pedido_id` do Suprimentos (seção 1).
