"""Real test-data flows. Only the isolated :18446 origin is reachable."""
import hashlib,json
from pathlib import Path
from urllib.parse import urlsplit
import requests
from visual_phase05_sessions import sessions

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/revisao-visual-unificado/homolog/fase-0.5'
BASE='https://concrefer.concretrack.com.br:18446'
assert urlsplit(BASE).port==18446
identity=sessions()['ADMIN']
s=requests.Session();s.headers['Authorization']='Bearer '+identity['token']
if identity.get('cookie'):s.cookies.set('mapa_unificado_homolog_session',identity['cookie'],domain='concrefer.concretrack.com.br',path='/unificado/')
trace=[]
def call(method,path,screen,body=None,expect=200):
    assert path.startswith('/') and not path.startswith('//')
    url=BASE+'/unificado/pcp/api'+path
    assert urlsplit(url).netloc==urlsplit(BASE).netloc
    r=s.request(method,url,headers={'X-Unificado-Screen':screen},json=body,timeout=35,allow_redirects=False)
    trace.append({'method':method,'path':path,'status':r.status_code})
    assert r.status_code==expect,(path,r.status_code,r.text[:700])
    return r
week='2030-01-07'
program=call('GET','/programacao-semanal?semana='+week,'programacaoSemanal12').json()
assert program['semana'] is None,'Test week already exists; do not overwrite it'
created=call('POST','/programacao-semana','programacaoSemanal12',{'semana_inicio':week,'origem':'vazia'},201).json()
week_id=created['id']
product=next(p for sec in program['setores'] for p in sec['produtos'] if p['formas']>0 and p.get('codigo') and p.get('vol_unit'))
item={'data':week,'setor_id':product['setor_id'],'produto_id':product['id'],'quantidade':1}
call('PUT',f'/programacao-semana/{week_id}/itens','programacaoSemanal12',[item])
saved=call('GET','/programacao-semanal?semana='+week,'programacaoSemanal12').json()
assert any(r['produto_id']==product['id'] and r['quantidade']==1 for r in saved['itens'])
validation=call('POST',f'/programacao-semana/{week_id}/validar','programacaoSemanal12').json()
assert not validation['bloqueios'],validation
call('POST',f'/programacao-semana/{week_id}/publicar','programacaoSemanal12',{'motivo':'Dados de teste da fase 0.5 — homologação isolada','avisar_producao':False})
print('Programação: criada, salva, validada e publicada em homologação.',flush=True)

preview=call('GET','/armaduras/relatorio?semana='+week+'&grupo=12','armadurasRelatorio').json()
assert not preview['pendencias'],preview['pendencias']
assert sum(g['total'] for g in preview['grupos'])==1
emission=call('POST','/armaduras/emissoes','armadurasRelatorio',{'semana':week,'grupo':'12','assinatura':preview['assinatura']},201).json()
arm_pdf=call('GET',f"/armaduras/emissoes/{emission['id']}/pdf",'armadurasRelatorio').content
arm_reprint=call('GET',f"/armaduras/emissoes/{emission['id']}/pdf",'armadurasRelatorio').content
assert arm_pdf.startswith(b'%PDF-') and arm_pdf==arm_reprint
(OUT/'armaduras-teste.pdf').write_bytes(arm_pdf)
print('Armaduras: emissão e reimpressão idênticas.',flush=True)

catalog=call('GET','/programacao-circular-s3/catalogo','circular3').json()
selection=next({'codigo_forma':form['codigo_forma'],'modelo':model['nome']} for form in catalog if form['codigo_forma']!='DT15' for model in form['modelos'] if model.get('produto_id') and model.get('codigo_produto') and model.get('peso'))
existing=call('GET','/programacao-circular-s3?data_inicio='+week+'&dias=1','circular3').json()
assert not existing,'Do not overwrite existing circular test programming'
call('POST','/programacao-circular-s3/periodo','circular3',{'data_inicio':week,'dias':1,'selecoes':[selection],'limpar_formas':[]})
series=call('GET','/postes-series/relatorio?semana='+week+'&escopo=semana&modo=previsao','postesNumerosSerie').json()
assert series['relatorio']['linhas'],'No series rows in test forecast'
series_emission=call('POST','/postes-series/emissoes','postesNumerosSerie',{'semana':week,'escopo':'semana','modo':'previsao','assinatura':series['relatorio']['assinatura']},201).json()
series_pdf=call('GET',f"/postes-series/emissoes/{series_emission['id']}/pdf",'postesNumerosSerie').content
series_reprint=call('GET',f"/postes-series/emissoes/{series_emission['id']}/pdf",'postesNumerosSerie').content
assert series_pdf.startswith(b'%PDF-') and series_pdf==series_reprint
(OUT/'series-teste.pdf').write_bytes(series_pdf)
sync=call('POST','/postes-series/sincronizar','postesNumerosSerie',{'inicio':'2026-11-09','fim':'2026-11-14'}).json()
result={'status':'ok','base':BASE,'test_week':week,'programming_week_id':week_id,'published_posts':1,
    'armaduras_emission':emission,'armaduras_pdf_sha256':hashlib.sha256(arm_pdf).hexdigest(),
    'series_emission':series_emission,'series_pdf_sha256':hashlib.sha256(series_pdf).hexdigest(),
    'reprints_byte_identical':True,'series_sync':sync,'test_form':selection,'trace':trace,'external_write_calls':0}
(OUT/'flows-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
