# 06 · Motor de cálculo e simulação

A explicação completa, com o porquê e exemplos numéricos, está em `reference/metodologia.html`. Este documento diz **onde** cada cálculo vive e **como validar**.

## 1. Estatística (backend do Unificado, `<módulo>/calc/estatistica.py`)

Para cada atividade, só medições `valido = true`:

```
d = duracao_s / 60                         # minutos efetivos
x̄, s (n−1), CV = s/x̄
anormais: se n > 3 e k > 0, ignora |d − x̄| > k·s  (x̄ e s de todas)
recalcula x̄, s, CV com as restantes
n' = ceil( (z·s / (e·x̄))² ), mínimo exibido max(10, n')
pessoas_media = Σ(d·pessoas)/Σ d  ... equivalente a  média(d·pessoas)/x̄
por_setor / por_tipo_poste: mesmos cálculos por estrato
velocidade (deslocamentos com distância): v = Σ distancia / Σ minutos (≥3 medições)
```
Testes (pytest): os valores de `tests/golden.json → estatistica` (média 1,343; desvio 0,16540; CV 0,12316; n' = 24; faixa 1,0122–1,6738).

## 2. Dimensionamento (backend do Unificado, `<módulo>/calc/dimensionamento.py`)

```
p  = (pessoais + fadiga + esperas)/100 ;  FT = 1/(1−p)
para cada atividade com usar=true (padrão: tipo ≠ 'espera'):
  TO = x̄ medido, ou estimativa_min se n = 0 (marcar "estimativa")
  pessoas = pessoas_media medida, ou pessoas_padrao
  TN = TO·ritmo/100 ;  TP = TN·FT
  freq = over.freq, senão (por_cacamba ? caçambas_por_forma : 1)
  HMf = TP·pessoas·freq
caçambas_por_forma = Σ caçambas de todas as formas do layout / nº de formas  (= 129/292 = 0,442)
HM = Σ HMf ; T_disp = turno − intervalos ; takt = T_disp/D
N_teorico = HM·D/T_disp ; N = N_teorico/η ; N_arred = ceil(N − 1e−9)
capacidade = disponiveis·T_disp·η/HM
alertas: atividade medida com n < max(10,n'); TP·freq > takt
```
Teste: `tests/golden.json → estatistica.tempo_padrao` e `.dimensionamento` (N = 26,36 → 27; capacidade com 26 = 288).

## 3. Simulação de eventos discretos (frontend TypeScript, Web Worker)

**Port 1:1** de `reference/engine.js` para TypeScript estrito, dentro da pasta do submódulo no frontend do Unificado (ex.: `frontend/src/modules/laboratorio/cronoanalise/engine/`), mantendo:
- o gerador `mulberry32(seed)` e a **mesma ordem de chamadas** de sorteio;
- `Env` (fila de eventos em heap binário, desempate por sequência), `CRes` (recurso com expediente e prioridade), `Store`, `Track` (reserva de trecho do trilho das pontes), `makeRail` (monovia de trilho único com 2 carrinhos, empurrar/ceder passagem), `formasSetor`, `parseRegra`, `planoViagens`, `diaProducao`;
- a lista de políticas `POL_LIST` e o formato do resultado.

Entradas de `diaProducao(cfg, lay, pol, T, seed)`:
- `cfg` = `config_simulacao.dados` + velocidades (`vCarr`, `vVazia`, `vMono`: medidas pela API ou estimadas);
- `lay` = `layout_setores` convertido para `{dm, filas, nf, d1, dn, tl, regra, cor, dest}` por setor;
- `pol` = `{setor:'longe'|'perto'|'alternado', dentro:'longe'|'perto'}`;
- `T(id, setor, rnd)` = sorteio lognormal com média/CV de `/simulacao/tempos` (estrato do setor se n ≥ 3); `T.med(id)` = true se o tempo é medido;
- `seed` = 1000+i (base × cenário) ou 2000+i (6 sequências), i = replicação.

Resultado por replicação: `total, nConc, fimConc, fimMont, fimLivre, extra, acab, acabMax, car, carMax, pinosLate, pinosFim, inter, bloq, pass, idade, esperaPronta, res[]{name, util, wait}` (minutos do dia; média dos dias após o aquecimento).

Agregação (no frontend): média e IC 95% com t de Student (`meanCI`); diferença cenário − base replicação a replicação; recomendação = sequência que concreta todas as formas com menor hora extra; selo "passa sobre forma fresca" se `pass ≥ 0,5`.

### Paridade obrigatória

`tests/gerar_golden.js` roda o motor de referência com as estimativas do catálogo, o layout e os parâmetros dos seeds, 6 políticas × sementes 101–103, e grava `tests/golden.json`. O port TypeScript deve ter um teste (Vitest) que roda as mesmas entradas e compara **todos** os campos com tolerância 1e−9. Qualquer diferença = bug de port.

Depois da paridade, melhorias no motor são permitidas, mas cada uma regenera o golden e vira um item do changelog (`motor_versao`).

## 4. Regras do modelo (resumo; detalhe em `docs/00` e na metodologia, seção 13)

Desforma 16 h após concretagem a partir de 06:30, pela forma mais perto do carrinho; troca de função das pontes às 08:30; colaborador extra às 09:00; montagem em duplas a partir de 08:30; concretagem segue a montagem na ordem da sequência; uma caçamba atende várias formas; troca de caçamba no carrinho; monovia de trilho único; pontes por trecho de trilho; corredor de 25 postes; acabamento pelo 2º homem; carimbo (prioridade) e pinos 4 h depois pela dupla 11:00–21:00; trabalho além das 16:18 = hora extra; primeiro dia descartado.
