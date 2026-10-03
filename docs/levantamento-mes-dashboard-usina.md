# Levantamento da Secao MES - Dashboard Usina

Origem analisada: `https://dautomacao.com/usina`

Ambiente inspecionado na VPS:

- Aplicacao: `/var/www/dashboard-usina`
- Servico: `dashboard-usina.service`
- Nginx: `/usina` e `/api/usina/` proxy para `127.0.0.1:8000`
- Backend: Flask/Gunicorn
- Blueprint: `app/routes_usina.py`
- Templates: `app/templates/usina.html` e `app/templates/usina_dashv2.html`
- Endpoint de dados: `GET /api/usina/dashboard`

## Objetivo da Secao

A secao `STATUS OPERACIONAL -- MES` mostra se a usina esta no prazo, atrasada ou adiantada em relacao ao volume programado do dia.

Ela cruza:

- producao real do dia, vinda de `tbl_massadas`;
- volume programado do dia, vindo de `tbl_pcpsetor`;
- hora da primeira massada do dia;
- hora final fixa do turno, hoje `17:00`;
- hora atual do servidor.

## Localizacao no Codigo

### Rotas

Arquivo: `/var/www/dashboard-usina/app/routes_usina.py`

Rotas HTML:

```python
@bp.get("/usina")
@bp.get("/usina/")
def usina_page():
    return render_template("usina.html", embed=False)

@bp.get('/dashv2')
@bp.get('/dashv2/')
def dashv2_page():
    return render_template('usina_dashv2.html', embed=False)
```

Rotas JSON:

```python
@bp.get("/api/usina/dashboard")
def api_dashboard():
    ...
```

Observacao: o card MES existe nos dois templates. O visual do print enviado corresponde ao bloco presente em `usina_dashv2.html`, e a tela `/usina` tambem possui o mesmo bloco funcional.

## Fontes de Dados

### Producao Real

Tabela principal: `tbl_massadas`

Modelo Flask: `app/models.py`, classe `Massada`.

Campos usados diretamente no MES:

- `qtd`: volume produzido da massada, em m3;
- `data`;
- `hora`;
- `data_hora`;
- `id`, usado como desempate de ordenacao em outras partes do endpoint.

O timestamp operacional usado no dashboard e:

```sql
COALESCE(tbl_massadas.data + tbl_massadas.hora, tbl_massadas.data_hora)
```

Motivo registrado no codigo: algumas importacoes antigas gravaram `data_hora` com deslocamento de 3 horas, enquanto `data` + `hora` ficaram corretos.

O filtro diario usa a data local `America/Sao_Paulo`:

```python
hoje = datetime.now(TZ_LOCAL).date()
start = datetime.combine(hoje, datetime.min.time())
end = start + timedelta(days=1)
```

### Meta / Programado

Tabela: `tbl_pcpsetor`

Consulta usada:

```sql
SELECT COALESCE(SUM(volume), 0)
FROM tbl_pcpsetor
WHERE data = :dt
  AND status = 'A'
```

Resultado: `total_programado`.

Essa soma vira a meta diaria do MES.

## Parametros Fixos

Arquivo: `app/routes_usina.py`

```python
PARADA_MINUTOS = 8
HORA_INI = 6
HORA_FIM = 17
HORA_FIM_SETOR = 16
TZ_LOCAL = ZoneInfo("America/Sao_Paulo")
```

Para o MES especificamente:

- inicio do calculo: hora da primeira massada do dia, ou `06:00` se nao houver massada;
- fim do turno: `17:00`, valor padrao da funcao `_calcular_mes`;
- tolerancia do status MES: `0,5 m3` de gap.

## Calculo do MES

Funcao principal:

```python
def _calcular_mes(meta, producao, hora_ini_str, fim_turno_str="17:00"):
```

Entradas:

- `meta`: volume programado do dia, vindo de `tbl_pcpsetor`;
- `producao`: volume produzido do dia, soma de `tbl_massadas.qtd`;
- `hora_ini_str`: primeira massada do dia em `HH:MM`, ou `06:00`;
- `fim_turno_str`: final do turno, padrao `17:00`.

Variaveis calculadas:

```python
dur_h  = max(0.01, (fim - ini).total_seconds() / 3600)
dec_h  = max(0.0,  (now - ini).total_seconds() / 3600)
rest_h = max(0.0,  (fim - now).total_seconds() / 3600)

taxa     = round(producao / dec_h, 2) if dec_h > 0 else 0.0
falta    = max(0.0, meta - producao)
prevista = taxa * rest_h
estimada = producao + prevista
gap      = falta - prevista

pct_meta  = round(producao / meta * 100, 1) if meta > 0 else 0.0
pct_turno = round(min(dec_h / dur_h, 1.0) * 100, 1)
```

Interpretacao:

- `taxa`: ritmo atual em m3/h desde a primeira massada;
- `falta`: quanto falta produzir para atingir a meta;
- `prevista`: quanto ainda deve ser produzido ate o fim do turno mantendo a taxa atual;
- `projecao`: producao final estimada no fim do turno;
- `gap`: diferenca entre o que falta e o que ainda e previsto produzir.

Formula do gap:

```text
gap = falta_produzir - producao_prevista_ate_17h
```

Leitura:

- `gap > 0`: falta mais volume do que o ritmo atual consegue entregar ate o fim do turno;
- `gap < 0`: ha folga, a projecao passa da meta;
- `gap ~= 0`: esta no prazo.

## Regras de Status

### Atrasado

Condicao:

```python
gap > 0.5
```

Retorno:

- `status`: `ATRASADO`
- `cor`: `#ef4444`
- `bg`: `rgba(239,68,68,0.10)`
- `icone`: circulo vermelho
- `tempo_extra_min`: `gap / taxa * 60`, se a taxa for maior que zero

### Adiantado

Condicao:

```python
gap < -0.5
```

Retorno:

- `status`: `ADIANTADO`
- `cor`: `#34d399`
- `bg`: `rgba(52,211,153,0.10)`
- `icone`: circulo verde
- `tempo_adiantado_min`: `abs(gap) / taxa * 60`, se a taxa for maior que zero

### No Prazo

Condicao:

```python
-0.5 <= gap <= 0.5
```

Retorno:

- `status`: `NO PRAZO`
- `cor`: `#38bdf8`
- `bg`: `rgba(56,189,248,0.10)`
- `icone`: circulo azul
- tempos em zero.

## Termino Previsto

Regra:

```python
if falta <= 0:
    termino = "META ATINGIDA"
elif taxa > 0:
    termino = (now + timedelta(hours=falta / taxa)).strftime("%H:%M")
else:
    termino = "--:--"
```

Ou seja:

- se a meta ja foi atingida, mostra `META ATINGIDA`;
- se ainda falta produzir e existe taxa, projeta o horario de conclusao;
- se nao existe taxa, mostra `--:--`.

## Payload JSON Consumido pelo Card

Dentro da resposta de `GET /api/usina/dashboard`, a secao MES vem em `data.mes`:

```json
{
  "mes": {
    "status": "NO PRAZO",
    "icone": "🔵",
    "cor": "#38bdf8",
    "bg": "rgba(56,189,248,0.10)",
    "taxa": 5.3,
    "falta": 0.0,
    "projecao": 52.0,
    "gap": 0.0,
    "tempo_extra_min": 0.0,
    "tempo_adiantado_min": 0.0,
    "pct_meta": 0.0,
    "pct_turno": 100.0,
    "tempo_restante_h": 0.0,
    "termino": "META ATINGIDA"
  }
}
```

Os valores acima sao exemplo no formato visto no print. A estrutura e os nomes de campo sao os pontos importantes para replicacao.

## Elementos Visuais do Card

Arquivo: `app/templates/usina_dashv2.html`

Container:

```html
<div class="mes-card" id="mesCard">
```

Cabecalho:

- titulo: `STATUS OPERACIONAL -- MES`;
- badge dinamico: `#mesStatusBadge`.

Mini KPIs:

| Indicador | Elemento | Campo JSON | Unidade |
| --- | --- | --- | --- |
| Taxa Atual | `#mesTaxa` | `mes.taxa` | `m3/h` |
| Falta Produzir | `#mesFalta` | `mes.falta` | `m3` |
| Projecao Final | `#mesProjecao` | `mes.projecao` | `m3 estimado` |
| Gap | `#mesGap` | `abs(mes.gap)` | `m3 (+ atraso / - folga)` |
| Tempo Extra / Adiantado / No Prazo | `#mesTempoValor` | `mes.tempo_extra_min` ou `mes.tempo_adiantado_min` | minutos |
| Termino Previsto | `#mesTermino` | `mes.termino` | texto/horario |

Rodape:

| Indicador | Elemento | Campo JSON |
| --- | --- | --- |
| Turno decorrido | `#mesPctTurno` | `mes.pct_turno` |
| Meta atingida | `#mesPctMeta` | `mes.pct_meta` |
| Tempo restante | `#mesTempoRest` | `mes.tempo_restante_h` |

## Logica de Renderizacao no Frontend

O frontend faz `fetch('/api/usina/dashboard')` e depois:

```javascript
const m = data.mes;

mesCard.style.borderLeftColor = m.cor;
mesCard.style.background = m.bg;

badge.textContent = m.icone + ' ' + m.status;

document.getElementById('mesTaxa').textContent = fmtBR(m.taxa, 1);
document.getElementById('mesFalta').textContent = fmtBR(m.falta, 1);
document.getElementById('mesProjecao').textContent = fmtBR(m.projecao, 1);

gapEl.textContent = fmtBR(Math.abs(m.gap), 1);
gapEl.style.color = m.cor;
```

A label do quinto KPI muda conforme o status:

```javascript
if (m.status === 'ATRASADO') {
  tempoLabel.innerHTML = 'Tempo Extra';
  tempoValor.textContent = fmtBR(m.tempo_extra_min, 0);
} else if (m.status === 'ADIANTADO') {
  tempoLabel.innerHTML = 'Adiantado';
  tempoValor.textContent = fmtBR(m.tempo_adiantado_min, 0);
} else {
  tempoLabel.innerHTML = 'No Prazo';
  tempoValor.textContent = '0';
}
```

Formatacao numerica:

```javascript
function fmtBR(v, decimals) {
  return v.toFixed(decimals).replace('.', ',');
}
```

Atualizacao automatica:

```javascript
loadDashboard();
setInterval(loadDashboard, AUTO_REFRESH);
```

O intervalo depende da constante `AUTO_REFRESH` definida no template.

## Dependencias Para Replicar Localmente

Para replicar a secao MES em outra aplicacao, sao necessarios estes dados minimos:

### Entrada Minima

```json
{
  "meta": 52.0,
  "producao": 52.0,
  "primeira_massada": "06:00",
  "fim_turno": "17:00",
  "agora": "data/hora atual"
}
```

### Saida Esperada

```json
{
  "status": "NO PRAZO",
  "cor": "#38bdf8",
  "bg": "rgba(56,189,248,0.10)",
  "taxa": 5.3,
  "falta": 0.0,
  "projecao": 52.0,
  "gap": 0.0,
  "tempo_extra_min": 0.0,
  "tempo_adiantado_min": 0.0,
  "pct_meta": 100.0,
  "pct_turno": 100.0,
  "tempo_restante_h": 0.0,
  "termino": "META ATINGIDA"
}
```

## Pseudocodigo Para Replicacao

```text
agora = hora_atual()
inicio = hoje + primeira_massada_ou_06h
fim = hoje + 17h

duracao_turno_h = max(0.01, horas(fim - inicio))
decorrido_h = max(0, horas(agora - inicio))
restante_h = max(0, horas(fim - agora))

taxa = producao / decorrido_h, se decorrido_h > 0
falta = max(0, meta - producao)
prevista = taxa * restante_h
projecao = producao + prevista
gap = falta - prevista

pct_meta = producao / meta * 100, se meta > 0
pct_turno = min(decorrido_h / duracao_turno_h, 1) * 100

se gap > 0.5:
    status = ATRASADO
    tempo_extra_min = gap / taxa * 60
senao se gap < -0.5:
    status = ADIANTADO
    tempo_adiantado_min = abs(gap) / taxa * 60
senao:
    status = NO PRAZO

se falta <= 0:
    termino = META ATINGIDA
senao se taxa > 0:
    termino = agora + falta / taxa horas
senao:
    termino = --:--
```

## Pontos de Atencao

- O calculo atual usa `datetime.now()` sem timezone dentro de `_calcular_mes`, enquanto o filtro diario usa `America/Sao_Paulo`. Na VPS isso funciona se o timezone do servidor estiver correto; em outra aplicacao, e melhor padronizar explicitamente para `America/Sao_Paulo`.
- A meta vem do PCP ativo (`status = 'A'`) por setor. Se a aplicacao local nao tiver `tbl_pcpsetor`, sera necessario fornecer a meta diaria por outra fonte.
- A taxa atual considera o tempo desde a primeira massada, nao desde 06:00, quando ja existe producao no dia.
- O fim do turno esta fixo em `17:00`. Para replicacao mais flexivel, transformar isso em configuracao.
- O `Gap` exibido no card usa valor absoluto, mas a decisao de cor/status usa o sinal original.
- Quando a meta e zero, `pct_meta` retorna zero para evitar divisao por zero.
- Quando nao existe producao, taxa e zero e o termino previsto fica `--:--`.

## Checklist Para Implementacao Local

1. Criar endpoint local que entregue `mes` no mesmo formato.
2. Calcular `meta` diaria.
3. Calcular `producao` diaria.
4. Identificar a primeira massada do dia.
5. Aplicar a funcao equivalente a `_calcular_mes`.
6. Renderizar os seis mini KPIs e os tres indicadores de rodape.
7. Atualizar automaticamente a cada intervalo definido pela aplicacao.
8. Validar cenarios: sem producao, meta zero, meta atingida, atrasado, adiantado e no prazo.
