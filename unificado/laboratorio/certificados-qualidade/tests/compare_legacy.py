"""Compare every available legacy certificate with read-only CP results."""
import argparse
import json
import sys
from pathlib import Path

import requests

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from core import summarize_day


def main():
    p=argparse.ArgumentParser();p.add_argument('--legacy',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path);args=p.parse_args()
    old=json.loads(args.legacy.read_text(encoding='utf-8'))
    dates=sorted({date for row in old for date in [row.get('dataProducao')] if date})
    url='https://concretrack.com.br/api/controle-estatistico/rompimentos-grupos'
    rows=[];offset=0
    while True:
        payload=requests.get(url,params={'data_inicio':min(dates),'data_fim':max(dates),'limit':1000,'offset':offset},timeout=30).json()
        if payload.get('success') is not True or payload.get('source') not in ('database','server_cache'):
            raise RuntimeError('Fonte de CPs indisponível')
        page=payload.get('rows') or [];rows.extend(page);offset+=len(page)
        if not payload.get('pagination',{}).get('has_more'):break
        if not page:raise RuntimeError('Paginação incompleta')
    comparison=[]
    for legacy in old:
        day=legacy.get('dataProducao')
        current=summarize_day(day,rows,35) if day else {'resultado':'sem_resultado'}
        previous=legacy.get('res28')
        comparison.append({'numero':legacy['numCert'],'data_producao':day,
                           'antigo_r28':previous,'novo_r28':current.get('r28_media'),
                           'novo_status':current['resultado'],'comparavel':previous is not None and current.get('r28_media') is not None,
                           'delta_mpa':round(current['r28_media']-float(previous),2)
                           if previous is not None and current.get('r28_media') is not None else None})
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps({'total_legado':len(old),'comparaveis':sum(r['comparavel'] for r in comparison),
                                      'registros':comparison},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'total_legado':len(old),'comparaveis':sum(r['comparavel'] for r in comparison),
                      'statuses':{status:sum(r['novo_status']==status for r in comparison)
                                  for status in {r['novo_status'] for r in comparison}}},ensure_ascii=False))


if __name__=='__main__':main()
