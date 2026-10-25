"""Read-only production gate: compare both CEC APIs and independent SQL aggregates."""
import argparse
import json
import subprocess
import sys
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from source import fetch_rows
from core import summarize_day


def decimal2(value):
    return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def sql_results(start, end):
    sql = f"""
      WITH per_age AS (
        SELECT data_moldagem::text AS dia, traco_id, idade_dias,
               AVG(mpa) AS media, MIN(mpa) AS minimo
        FROM rompimentos_atuais
        WHERE data_moldagem BETWEEN DATE '{start}' AND DATE '{end}'
          AND idade_dias IN (3,7,28) AND mpa >= 0
        GROUP BY data_moldagem,traco_id,idade_dias
      ), per_trace AS (
        SELECT data_moldagem::text AS dia, traco_id,
               COUNT(DISTINCT cp::integer) AS n_cps
        FROM rompimentos_atuais
        WHERE data_moldagem BETWEEN DATE '{start}' AND DATE '{end}'
        GROUP BY data_moldagem,traco_id
      )
      SELECT a.dia,a.traco_id,a.idade_dias,a.media,a.minimo,t.n_cps
      FROM per_age a JOIN per_trace t USING (dia,traco_id)
      ORDER BY a.dia,a.traco_id,a.idade_dias;
    """
    run = subprocess.run(['sudo','-u','postgres','psql','-d','controle_est_concre_campinas',
                          '-At','-F','|','-c',sql],capture_output=True,text=True,check=True)
    grouped = defaultdict(lambda: defaultdict(dict))
    for line in run.stdout.splitlines():
        day, trace, age, avg, minimum, count = line.split('|')
        grouped[day][trace][int(age)] = (Decimal(avg), Decimal(minimum), int(count))
    output = {}
    for day, traces in grouped.items():
        trace, values = max(traces.items(), key=lambda pair:
                            (pair[1][28][0] if 28 in pair[1] else Decimal('-1'), pair[0]))
        r28 = values.get(28)
        output[day] = {
            'data_producao':day,'traco':trace,
            'n_cps':next(iter(values.values()))[2],
            'r3_media':decimal2(values[3][0]) if 3 in values else None,
            'r7_media':decimal2(values[7][0]) if 7 in values else None,
            'r28_media':decimal2(r28[0]) if r28 else None,
            'r28_min':decimal2(r28[1]) if r28 else None,
            'resultado':'conforme' if r28 and r28[0] > 35 else
                        ('nao_conforme' if r28 else 'aguardando_28_dias'),
        }
    return output


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    end=date(2026,10,24)
    start=end-timedelta(days=90)
    first,last=start.isoformat(),end.isoformat()
    old_rows=fetch_rows([first,last],'antigo')
    new_rows=fetch_rows([first,last],'novo')
    sql=sql_results(first,last)
    old_days={row['data_moldagem'] for row in old_rows}
    new_days={row['data_moldagem'] for row in new_rows}
    common=sorted(old_days|new_days)
    keys=('n_cps','r3_media','r7_media','r28_media','traco','resultado')
    comparison=[]
    for day in common:
        old=summarize_day(day,old_rows)
        new=summarize_day(day,new_rows)
        different=[key for key in keys if old.get(key)!=new.get(key)]
        if different:
            comparison.append({'data':day,'campos':different,'antigo':old,'novo':new})
    candidates=sorted(day for day,record in sql.items() if record['r28_media'] is not None)
    selected=candidates[:10]
    if len(selected)<10:
        raise RuntimeError(f'Somente {len(selected)} datas com 28 dias no SQL.')
    gate=[]
    for day in selected:
        calculated=summarize_day(day,new_rows)
        independent=sql[day]
        differences={key:[calculated.get(key),independent.get(key)] for key in keys
                     if calculated.get(key)!=independent.get(key)}
        gate.append({'data':day,'modulo':{key:calculated.get(key) for key in keys},
                     'sql':{key:independent.get(key) for key in keys},'diferencas':differences})
    result={'periodo':[first,last], 'fonte_antiga_linhas':len(old_rows),
            'fonte_nova_linhas':len(new_rows),'datas_antigas_sem_nova':sorted(old_days-new_days),
            'datas_novas_sem_antiga':sorted(new_days-old_days),
            'diferencas_antiga_nova':comparison,'gate_10_datas':gate,
            'gate_10_10':len(gate)==10 and all(not row['diferencas'] for row in gate)}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'periodo':result['periodo'],'antigo':len(old_rows),'novo':len(new_rows),
                      'datas_antigas_sem_nova':len(result['datas_antigas_sem_nova']),
                      'datas_novas_sem_antiga':len(result['datas_novas_sem_antiga']),
                      'datas_com_diferenca':len(comparison),'gate_10_10':result['gate_10_10']},ensure_ascii=False))
    if not result['gate_10_10']:
        raise SystemExit(2)


if __name__=='__main__':main()
