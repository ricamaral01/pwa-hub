"""Read the old Sheets web app using GET only; write an import file outside Git."""
import argparse
import json
import re
from pathlib import Path

import requests


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--old-index',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    html=args.old_index.read_text(encoding='utf-8')
    match=re.search(r'API_URL:\s*"([^"]+)',html)
    if not match: raise RuntimeError('Endpoint legado não encontrado.')
    url=match.group(1)
    response=requests.get(url,params={'action':'listar_certificados'},timeout=30)
    response.raise_for_status();listing=response.json()
    if listing.get('ok') is not True: raise RuntimeError('Listagem legada falhou.')
    rows=[]
    for item in listing.get('certificados',[]):
        response=requests.get(url,params={'action':'buscar_certificado','numCert':item['numCert']},timeout=30)
        response.raise_for_status();payload=response.json()
        if payload.get('ok') is not True: raise RuntimeError('Leitura legada incompleta.')
        rows.append(payload['certificado'])
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'{len(rows)} certificados exportados para {args.output}')


if __name__=='__main__':main()
