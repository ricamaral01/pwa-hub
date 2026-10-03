# Relatorio Gerencial de Fechamento - ConcreTrack

Este documento descreve o que foi implementado no relatorio **Fechamento** do ERP ConcreTrack em `https://dautomacao.com/concretrack/relatorios/fechamento/`, para servir como referencia de implementacao em outra aplicacao.

## Objetivo

Criar um relatorio gerencial chamado **Fechamento**, com mes de referencia **Julho/2026**, contendo:

- Grafico mensal de volume de concreto em Campinas.
- Grafico diario de volume de concreto em Julho.
- Cards de classificacao do concreto: Normal, Especial e Obra.
- Comparativo mes a mes.
- Comparativo anual.
- Dias trabalhados.
- Indicadores da usina:
  - Media global vs mes referencia.
  - Mes anterior vs mes referencia.

## Arquivos Alterados no VPS

Aplicacao real no VPS:

- Backend FastAPI:
  - `/var/www/concretrack-erp/api/routers/relatorios.py`
- Frontend estatico:
  - `/var/www/concretrack-erp/public/relatorios/fechamento/index.html`
  - `/var/www/concretrack-erp/public/relatorios/index.html`

Servico reiniciado apos alteracoes:

```bash
systemctl restart concretrack-api.service
```

## Endpoint Criado/Ajustado

Endpoint:

```http
GET /concretrack/api/relatorios/fechamento?ano=2026&mes=7
```

No router FastAPI, o endpoint retorna JSON com esta estrutura:

```json
{
  "nome": "Fechamento",
  "unidade": "Campinas",
  "ano": 2026,
  "mes": 7,
  "mes_nome": "Julho",
  "monthly": [],
  "daily": [],
  "averages": {},
  "mix": {},
  "comparisons": {},
  "indicator_panels": {},
  "source": "analise_mensal_MARCELO_FECHAMENTO.py",
  "atualizado_em": "..."
}
```

## Fonte dos Dados

Dados reais usados do banco PostgreSQL:

Tabela:

```sql
tbl_massadas
```

Campos usados:

- `data`: data da massada.
- `hora`: horario da massada.
- `qtd`: volume produzido em m3.
- `formula`: formula/traco usado.

Filtro base:

```sql
WHERE data >= :inicio
  AND data < :fim
  AND qtd IS NOT NULL
  AND qtd > 0
```

## Logica Baseada no Python Original

Arquivo usado como referencia:

```text
G:\Outros computadores\Meu laptop\Concrefer\Relatórios Automatizados\003. FECHAMENTO MARCELO\Indicadores Usina\analise_mensal_MARCELO_FECHAMENTO.py
```

Regras replicadas:

- Horas trabalhadas = dias unicos com producao x `8.8`.
- Volume medio diario = volume total / dias unicos com producao.
- Produtividade media = volume total / horas trabalhadas.
- Mediana do ciclo = mediana das diferencas entre horarios consecutivos por dia, considerando diferencas `> 0` e `<= 30` minutos.
- Media global = media das metricas mensais de meses completos.

## Tratamento de Meses Incompletos

Para o grafico mensal, quando nao ha dados suficientes no banco, usar os valores enviados na imagem de referencia.

Regra aplicada:

- Se o mes tiver menos de `10` dias trabalhados no banco e existir valor de referencia, usar o valor da imagem.
- Se o mes tiver pelo menos `10` dias trabalhados, usar o banco.

Mapa de referencia:

```python
MONTHLY_REFERENCE_VOLUMES = {
    (2025, 7): 1389.40,
    (2025, 8): 1421.60,
    (2025, 9): 1363.90,
    (2025, 10): 1193.40,
    (2025, 11): 1247.20,
    (2025, 12): 672.40,
    (2026, 1): 870.80,
    (2026, 2): 1186.10,
    (2026, 3): 1399.90,
    (2026, 4): 1121.80,
    (2026, 5): 1210.85,
    (2026, 6): 1345.05,
    (2026, 7): 1352.55,
}
```

Exemplo validado:

- `Jul/25`: `1389.40`, fonte `referencia_imagem`.
- `Fev/26`: `1186.10`, fonte `referencia_imagem`.
- `Jul/26`: `1352.55`, fonte `banco`.

## Grafico Mensal

Janela do grafico:

- 13 meses.
- De `Jul/25` ate `Jul/26` quando referencia for Julho/2026.

Dados de cada ponto:

```json
{
  "label": "Jul/25",
  "volume": 1389.4,
  "source": "referencia_imagem"
}
```

Regras visuais:

- Barras azul escuro quando o volume fica acima ou igual a media.
- Barras azul claro quando fica abaixo da media.
- Linha pontilhada da media deve sobrepor as colunas.
- O rotulo vertical do eixo Y deve ser removido.
- A media deve aparecer como texto abaixo do titulo do grafico, nao na lateral direita.

## Grafico Diario

Mes de referencia:

- Julho/2026.

Agrupamento:

```sql
GROUP BY dia(data)
SUM(qtd)
```

Regras visuais:

- Todos os dias devem caber sem rolagem lateral.
- Usar SVG responsivo com `width: 100%` e sem `min-width` grande.
- Reduzir fonte dos rotulos no grafico diario.
- Alternar verticalmente os rotulos dos valores para evitar sobreposicao.
- Remover rotulo vertical do eixo Y.
- Exibir a media abaixo do titulo.
- Linha da media deve ser desenhada depois das barras no SVG para ficar por cima.

Ordem correta no SVG:

```js
svg.innerHTML = ticks + bars + averageLine;
```

## Classificacao do Concreto

Cards:

- Concreto Normal
- Concreto Especial
- Concreto Obra

Regras:

```text
formula comeca com "7.1" => Concreto Especial
formula comeca com "7.2" => Concreto Obra
demais formulas          => Concreto Normal
```

Percentual:

```text
percentual = volume_categoria / volume_total_mes * 100
```

## Comparativos

### Comparativo Mes a Mes

Para Julho/2026:

- Esquerda: Junho/2026
- Direita: Julho/2026

Formula:

```text
variacao = (volume_atual / volume_anterior - 1) * 100
```

Validado:

- Jun/26: `1345.05 m3`
- Jul/26: `1352.55 m3`
- Variacao: `+0.6%`

### Comparativo Anual

Para Julho/2026:

- Esquerda: Julho/2025
- Direita: Julho/2026

Regra importante:

- Se Julho/2025 nao existir no banco, usar o valor da imagem.

Validado:

- Jul/25: `1389.40 m3`
- Jul/26: `1352.55 m3`
- Variacao: `-2.7%`

### Dias Trabalhados

Comparar quantidade de dias unicos com producao:

```text
dias_trabalhados = count(distinct data)
diferenca = dias_atual - dias_anterior
```

Validado:

- Jun/26: `21 dias`
- Jul/26: `22 dias`
- Diferenca: `+1`

## Indicadores da Usina

Metricas:

- Horas Trabalhadas
- Vol. Medio Diario
- Produtividade Media
- Mediana do Ciclo

### Media Global

Comparativo:

- Esquerda: Media Global `(2025 + Jan-Jun/26)`
- Direita: Julho/2026

Regra para media global:

- Calcular metricas mes a mes.
- Descartar meses com menos de `10` dias trabalhados.
- Tirar media das metricas mensais restantes.

Motivo:

- O banco tinha Fevereiro/2026 com apenas 2 dias e 2.70 m3, distorcendo horas e produtividade.
- A produtividade global incorreta chegou a `36.34 m3/h` quando o calculo usava volume total do periodo dividido por media mensal de horas.
- O calculo correto usa media mensal de produtividade.

Valores validados apos correcao:

- Horas globais: `171.60 h`
- Horas Jul/26: `193.60 h`
- Volume medio global: `65.83 m3`
- Volume medio Jul/26: `61.48 m3`
- Produtividade global: `7.48 m3/h`
- Produtividade Jul/26: `6.99 m3/h`
- Ciclo global: `4.27 min`
- Ciclo Jul/26: `3.98 min`

### Mes Anterior

Comparativo:

- Esquerda: Junho/2026
- Direita: Julho/2026

Valores validados:

- Horas: `184.80 h` vs `193.60 h`
- Volume medio diario: `64.05 m3` vs `61.48 m3`
- Produtividade: `7.28 m3/h` vs `6.99 m3/h`
- Mediana do ciclo: `3.91 min` vs `3.98 min`

## Regras de Cor dos Indicadores

Essa foi uma correcao importante.

Regra correta:

- Horas Trabalhadas maior: verde.
- Horas Trabalhadas menor: vermelho.
- Volume Medio Diario maior: verde.
- Volume Medio Diario menor: vermelho.
- Produtividade Media maior: verde.
- Produtividade Media menor: vermelho.
- Mediana do Ciclo menor: verde.
- Mediana do Ciclo maior: vermelho.

Implementacao conceitual:

```python
def _indicator(name, unit, left, right, lower_is_better=False):
    change = ((right / left - 1) * 100) if left else 0
    better = change <= 0 if lower_is_better else change >= 0
    return {
        "name": name,
        "unit": unit,
        "left": round(left, 2),
        "right": round(right, 2),
        "change": round(change, 1),
        "arrow": "↑" if change >= 0 else "↓",
        "better": better,
    }
```

Uso:

```python
_indicator("Horas Trabalhadas", "h", left, right)
_indicator("Vol. Medio Diario", "m3", left, right)
_indicator("Produtividade Media", "m3/h", left, right)
_indicator("Mediana do Ciclo", "min", left, right, lower_is_better=True)
```

## Frontend

A pagina e HTML estatico com JavaScript puro.

Principais funcoes:

- `loadReport()`: busca o JSON no endpoint.
- `chart(...)`: renderiza graficos SVG.
- `renderCalculated(data)`: preenche cards, comparativos e indicadores calculados.
- `indicatorRows(...)`: renderiza linhas dos indicadores com classe verde/vermelha.

Endpoint consumido:

```js
fetch('/concretrack/api/relatorios/fechamento?ano=2026&mes=7', {
  credentials: 'same-origin',
  cache: 'no-store'
})
```

## Regras Visuais Finais

- Titulo do grafico mensal: `Volume de Concreto - Campinas`.
- Titulo do grafico diario: `Volume de Concreto - Campinas - Julho`.
- Media aparece abaixo do titulo.
- Linha da media pontilhada em vermelho.
- Linha da media sobrepoe as barras.
- Nao exibir rotulo vertical do eixo Y.
- Grafico diario sem rolagem lateral.
- Cards de indicadores com cores:
  - Verde para melhor.
  - Vermelho para pior.

## Validacoes Feitas

Comandos/checagens usados:

```bash
python -m py_compile api/routers/relatorios.py
systemctl restart concretrack-api.service
systemctl is-active concretrack-api.service
curl -k -s -o /tmp/fechamento.html -w '%{http_code} %{content_type}\n' https://dautomacao.com/concretrack/relatorios/fechamento/
```

Resultados:

- API ativa.
- Pagina respondeu `200 text/html`.
- Comparativo anual passou a usar `Jul/25 = 1389.40 m3`.
- Grafico diario compactado sem rolagem lateral.
- Linha da media sobreposta as barras.

## Observacoes Para Reuso

Ao implementar em outra aplicacao:

1. Garanta uma tabela equivalente a `tbl_massadas` com data, hora, volume e formula.
2. Replique as funcoes de metricas no backend, nao no frontend.
3. Mantenha fallback para meses historicos ausentes ou incompletos.
4. Nao inclua meses com menos de 10 dias trabalhados na media global.
5. Para graficos SVG, desenhe a linha da media depois das barras.
6. Renderize a media fora do SVG, abaixo do titulo.
7. Use o frontend apenas para exibicao do JSON calculado.
