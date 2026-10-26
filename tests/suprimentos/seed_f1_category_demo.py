"""Cria cenário DEMO-F1 de filtro categoria/situação só em :18446."""
from __future__ import annotations
import json
import os
import time
from datetime import datetime
from pathlib import Path
import requests

ROOT='https://concrefer.concretrack.com.br:18446'
API=ROOT+'/api/suprimentos'
IDS=json.loads(Path(__import__('os').environ['TEMP'],'sup-f1-demo-ids.json').read_text(encoding='utf-8'))
CREDS=json.loads(Path('C:/Users/Admin/Downloads/suprimentos-homolog-logins-20261025.json').read_text(encoding='utf-8'))
TOKENS_PATH=Path(os.environ['TEMP'],'sup-f1-smoke-sessions.json')
TOKENS=json.loads(TOKENS_PATH.read_text(encoding='utf-8')) if TOKENS_PATH.exists() else {}

def session(name):
    s=requests.Session()
    if name in TOKENS:
        s.cookies.set('mapa_unificado_homolog_session',TOKENS[name],
            domain='concrefer.concretrack.com.br',path='/unificado/')
    else:
        for attempt in range(5):
            r=s.post(ROOT+'/unificado/mapa/api/login',json={'name':name,'password':CREDS[name]},timeout=30)
            if r.status_code!=503:break
            time.sleep(attempt+1)
        r.raise_for_status()
    r=s.post(ROOT+'/unificado/mapa/api/unified/suprimentos-bootstrap',timeout=30)
    r.raise_for_status()
    return s

def call(s,method,path,body=None):
    r=s.request(method,API+path,json=body,timeout=30)
    if not r.ok:raise RuntimeError(f'{method} {path}: HTTP {r.status_code} {r.text[:240]}')
    return r.json()

def cnpj(prefix):
    digits=[int(c) for c in prefix]
    for weights in ((5,4,3,2,9,8,7,6,5,4,3,2),(6,5,4,3,2,9,8,7,6,5,4,3,2)):
        rem=sum(a*b for a,b in zip(digits,weights))%11
        digits.append(0 if rem<2 else 11-rem)
    return ''.join(map(str,digits))

def main():
    buyer=session('e2e-suprimentos-compras')
    sol=session('e2e-suprimentos-sol')
    apr=session('e2e-suprimentos-aprov1')
    alm=session('e2e-suprimentos-almox')
    unit=call(buyer,'GET','/cadastros/unidades-medida?q=un')['items'][0]['id']
    original=call(buyer,'GET','/solicitacoes/'+IDS['solicitacao'])
    cc=original['cc_id']
    suffix=datetime.utcnow().strftime('%H%M%S')
    material=call(buyer,'POST','/cadastros/materiais',{
        'codigo':'DEMO-F1-CAT-'+suffix,'descricao':'DEMO-F1 disco abrasivo para filtro',
        'categoria':'ABRASIVO','un_estoque':unit,'dominio':'almoxarifado'})
    wrong=call(buyer,'POST','/compras/fornecedores',{
        'cnpj':cnpj('481936'+suffix),'razao':'DEMO-F1 Fornecedor EPI (fora da categoria)',
        'categorias':['EPI']})
    req=call(sol,'POST','/solicitacoes',{'cc_id':cc,'justificativa':'DEMO-F1 categoria e situação',
        'itens':[{'material_id':material['id'],'qtd':1,'un':unit}]})
    item=req['itens'][0]['id']
    call(buyer,'POST','/itens/'+item+'/preco',{'preco':'50'})
    call(sol,'POST','/solicitacoes/'+req['id']+'/enviar',{})
    call(apr,'POST','/solicitacoes/'+req['id']+'/aprovar',{})
    call(alm,'POST','/compras/itens/'+item+'/destino',{'destino':'COMPRA'})
    quote=call(buyer,'POST','/compras/cotacoes',{'itens':[item]})
    assert quote['itens'][0]['categoria']=='ABRASIVO'
    result={'material':material['id'],'fornecedor_epi':wrong['id'],
            'solicitacao':req['id'],'cotacao':quote['id']}
    Path(__import__('os').environ['TEMP'],'sup-f1-category-demo-ids.json').write_text(
        json.dumps(result,indent=2),encoding='utf-8')
    print('F1_CATEGORY_DEMO_OK',result)

if __name__=='__main__':main()
