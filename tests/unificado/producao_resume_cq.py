"""CQ history and PDF preview at FCK25. At most one marked draft, homolog only."""
import hashlib,json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from modulos_runtime import actors,start,count,BASE,R
from producao_resume_runtime import O
source=(R/'scripts/producao_inventory_readonly.py').read_text(encoding='utf-8');prefix=source[:source.index("result={'version'")]
def query(sql):
 code=prefix+'\nprint(json.dumps(sql(\'laboratorio_visual_homolog_20261118\','+repr(sql)+')))'
 p=subprocess.run(['ssh','vps-concrefer','python3','-'],input=code.encode(),capture_output=True);assert p.returncode==0,p.stderr.decode();return json.loads(p.stdout)
def snapshot():
 tables=query("SELECT json_agg(tablename) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'cq_%'")
 return query('SELECT json_build_object('+','.join("'"+t+"',(SELECT json_build_object('rows',count(*),'md5',md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'[]'))) FROM public.\""+t+'" t)' for t in tables)+')')
count();before=snapshot();actor=next(a for a in actors() if a['id']=='alex');created=False
with sync_playwright() as pw:
 b=pw.chromium.launch(channel='msedge',headless=True);ctx,page,errors=start(b,actor);root=BASE+'/unificado/laboratorio/certificados-qualidade';assert ':18446/' in root
 config=ctx.request.get(root+'/api/config');assert config.status==200,(config.status,config.text()[:300]);conf=config.json();assert float(conf['params']['fck_mpa'])==25
 history=ctx.request.get(root+'/api/certificados');assert history.status==200;hist=history.json()
 existing=query("SELECT coalesce(json_agg(t),'[]') FROM (SELECT id FROM public.cq_certificados WHERE status='rascunho' AND fck_mpa=25 ORDER BY id DESC LIMIT 1)t")
 if existing:cert_id=existing[0]['id']
 else:
  item=query("SELECT row_to_json(t) FROM (SELECT modelo,altura_m,carga_dan,peso_kg,quantidade,data_producao FROM public.cq_itens ORDER BY id LIMIT 1)t");assert item
  body={'cliente':'TESTE-RETOMADA-FCK25','endereco':'Homologação 18446','nota_fiscal':'TESTE','resp_laboratorio':'Ricardo Do Amaral','observacoes':'TESTE-RETOMADA-FCK25. Rascunho apenas; prévia sem emissão.','itens':[item]}
  # This single explicit homolog-only POST is authorized by the resume prompt.
  result=ctx.request.post(root+'/api/certificados',data=body,headers={'Origin':BASE});assert result.status==200,(result.status,result.text()[:500]);cert_id=result.json()['id'];created=True
 detail=ctx.request.get(root+'/api/certificados/'+str(cert_id));detail_error=detail.json() if detail.status!=200 else None;record=query('SELECT row_to_json(t) FROM (SELECT id,status,cliente,fck_mpa,criado_por,numero,pdf_path,pdf_hash,emitido_em FROM public.cq_certificados WHERE id='+str(cert_id)+')t');assert record['status']=='rascunho' and float(record['fck_mpa'])==25
 after_draft=snapshot();response=ctx.request.get(root+'/api/certificados/'+str(cert_id)+'/pdf');data=response.body()
 if response.status==200:
  assert data.startswith(b'%PDF') and len(data)>4000
  (O/'cq-preview-fck25.pdf').write_bytes(data)
 after_preview=snapshot();assert after_draft==after_preview,'PDF preview changed stored CQ rows'
 archived=next((row for row in hist if row['status'] in ['emitido','substituido']),None);archive_status=None
 if archived:
  archive=ctx.request.get(root+'/api/certificados/'+str(archived['id'])+'/pdf');archive_status=archive.status
  if archive.status==200:
   assert archive.body().startswith(b'%PDF');(O/'cq-historical-existing.pdf').write_bytes(archive.body())
 page.goto(root+'/',wait_until='domcontentloaded');page.wait_for_timeout(700)
 history_button=page.get_by_role('button',name='Histórico',exact=True)
 if history_button.count():history_button.click();page.wait_for_timeout(500)
 page.screenshot(path=str(O/'cq-history-fck25.png'),full_page=True);ctx.close();b.close()
 result={'origin':BASE,'fck':25,'history_status':history.status,'history_records':len(hist),'created_marked_draft_this_invocation':created,'marked_draft_created_for_this_task':record['cliente']=='TESTE-RETOMADA-FCK25','draft_id':cert_id,'draft_record':record,'draft_status':'rascunho','issued_new_certificate':False,'source_cp':conf['fonte_cp'],'detail_status':detail.status,'detail_error':detail_error,'historical_pdf_status':archive_status,'pdf_status':response.status,'pdf_error':json.loads(data) if response.status!=200 else None,'pdf_bytes':len(data) if response.status==200 else 0,'pdf_sha256':hashlib.sha256(data).hexdigest() if response.status==200 else None,'snapshot_before_probe':before,'snapshot_after_draft':after_draft,'snapshot_after_preview':after_preview,'preview_did_not_change_rows':True,'production_changes':0,'connections':count(),'ok':response.status==200};(O/'cq-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(result))
 if not result['ok']:raise SystemExit(1)
