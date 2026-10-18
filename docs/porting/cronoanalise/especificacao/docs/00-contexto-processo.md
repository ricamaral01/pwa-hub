# 00 · Contexto: o processo da fábrica de postes (Concrefer)

Este documento descreve a fábrica que o CronoTrack mede e simula. Tudo aqui foi confirmado pelo Ricardo (gestor) e é a fonte de verdade das regras do motor de simulação. Se algo no código contradizer este documento, este documento vence.

## Objetivo do sistema

1. **Cronoanálise:** levantar os tempos reais de cada operação, no celular/tablet, com várias pessoas cronometrando ao mesmo tempo, gravando num banco central.
2. **Dimensionamento:** a partir dos tempos, calcular tempo padrão e quantas pessoas cada processo realmente precisa (método clássico de engenharia de métodos).
3. **Simulação:** reproduzir o dia de produção (simulação de eventos discretos) para responder: por qual setor começar a concretagem, em que ordem concretar as formas, onde está o gargalo, quanto adianta mais uma dupla/caçamba/ponte.

## Recursos físicos

| Recurso | Quantidade | Detalhe |
| --- | --- | --- |
| Usina | 1 | Pesa, bate e descarrega 0,9 m³ por vez numa caçamba sobre o carrinho |
| Monovia | 1 trilho | Ordem no trilho: **setor 4 · usina · setor 3 · setor 2 · setor 1** |
| Carrinhos da monovia | 2 | Cada um leva 2 caçambas. Não se ultrapassam. Carrinho 2 fica do lado da usina/S4; carrinho 1 do lado do S1 |
| Pontes rolantes | 3 por setor | No mesmo trilho do setor, sem se sobrepor |
| Corredor | 1 por setor | No meio do trilho do setor; cabe 25 postes (5 lado a lado × 5 camadas) |

Distâncias da monovia (usina → parada do carrinho no setor): S4 = 2 m, S3 = 20 m, S2 = 25 m, S1 = 60 m.

Atendimento dos carrinhos: **carrinho 1 → S1, S2, S3**; **carrinho 2 → S2, S3, S4**; com os dois livres, S2/S3 vão para o carrinho 2. Um carrinho parado num setor esperando a ponte bloqueia o outro (ex.: carrinho 2 parado no S2 prende o carrinho 1 do lado do S1 e deixa S3/S4 sem carrinho).

Troca de caçamba: o carrinho chega com a caçamba cheia e um lugar livre; a ponte abaixa a caçamba vazia no lugar livre, troca o gancho e sobe a cheia; o carrinho fica parado até a ponte voltar e só então volta à usina com a vazia.

## Layout dos setores

| Setor | Filas | Formas por fila | 1ª forma (m) | Última forma (m) | Caçambas por forma | Lançamento por forma |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2 | 40 | 4 | 60 | 1/3 (uma caçamba enche 3 formas) | 2 min |
| 2 | 2 | 40 | 4 | 60 | 1/3 | 2 min |
| 3 | 1 | 52 | 3 | 100 | formas 1–20: 1/2 · 21–40: 1 · 41–52: 1,5 | 3 min |
| 4 | 2 | 40 | 4 | 60 | 1/3 | 2 min |

Total: **292 formas por dia, 129 caçambas** (todas as formas são concretadas todos os dias). Distância medida a partir da parada do carrinho na ponta do setor; formas intermediárias igualmente espaçadas. Uma caçamba atende formas seguidas na mesma viagem; a forma que precisa de mais de uma caçamba recebe o resto na viagem seguinte.

## Equipes

| Equipe | Pessoas | Horário | Faz |
| --- | --- | --- | --- |
| Concretagem | 2 por setor | 06:30–16:18 | 06:30–08:30: desforma (abrir, raspar abas, frisar, varrer, engatar). Depois: lançador + acabador (acabamento 4ª fase com concreto fresco, pelo 2º homem) |
| Montagem | 4 por setor (2 duplas) | 08:30–16:18 | Limpeza, soprador, desmoldante, armadura, fechamento, acessórios, inspeção. Pode montar uma forma enquanto a vizinha é concretada |
| Colaborador de outro departamento | 1 por setor | a partir das 09:00 | Continua a desforma (abrir/varrer/engatar) |
| Carimbo e pinos | 2 no total (todos os setores) | 11:00–21:00 | Carimbo (gravação) com concreto fresco; sacar pinos 4 h após a concretagem, no mesmo dia |

Expediente geral termina às 16:18. Trabalho que passa disso é hora extra.

## O dia de um setor

| Horário | Ponte 1 | Ponte 2 | Ponte 3 |
| --- | --- | --- | --- |
| 06:30–08:30 | Retira o poste da forma (perto do carrinho primeiro) e leva ao corredor | Leva do corredor ao setor de montagem | — |
| a partir de 08:30 | Concreta (começa perto do carrinho, onde já foi desformado) | Retira postes do meio do setor para o fundo | Leva do corredor ao setor de montagem |

Regras de tempo:
- **Desforma: 16 h após a concretagem.** Começa às 06:30, pelas formas mais perto do carrinho.
- **Sacar pinos: 4 h após a concretagem**, no mesmo dia.
- **Carimbo:** com o concreto fresco; a dupla só entra às 11:00, então as formas da manhã esperam (o concreto ainda aceita).
- **Ordem do ciclo da forma:** desforma (abrir, varrer, ponte iça) → montagem → inspeção → concretagem → acabamento → carimbo → pinos (4 h) → cura → desforma (16 h).
- A concretagem segue a montagem: só se concreta forma montada. A ordem de concretagem de hoje é a ordem da desforma de amanhã.
- Concretagem começa ~08:30 e deve terminar ~16:00 (meta de validação do modelo).

Sequência praticada hoje: **alternando setores, da forma mais perto do carrinho para a mais longe.** A simulação compara 6 sequências (setor mais distante / mais próximo / alternando × forma perto→longe / longe→perto).

## Catálogo de operações

40 operações em 4 etapas, cada operação em uma única etapa (sem duplicidade). Arquivo: `seeds/catalogo.json`. Códigos:
- **Desforma e retirada:** P01, P02 (varrer, antes do içamento), R01–R12 (pontes 1 e 2, esperas).
- **Preparação e montagem:** P03–P06, P08–P14.
- **Usina e monovia:** U01–U04 (por caçamba).
- **Concretagem e acabamento:** U05–U07 (troca no carrinho), C02–C04, C06–C07 (por caçamba), P16 acabamento, P17 carimbo, P18 sacar pinos.

Removidos por duplicidade (não recriar): P07, P15, C01, C05.
