"""VPS production 2.1.0: guarded backup, rehearsal, grant, migration and rollback.

Private staging and database dumps never enter Git. Existing tables, pools,
old Campinas/Noroeste sources and ERP writes are outside this change.
"""
import ast,hashlib,json,os,shutil,subprocess,sys,tarfile,time,urllib.request
from datetime import datetime,timezone
from pathlib import Path

S=Path('/opt/concrefer-unificado/staging/lab210-production-20261122')
INPUT=S/'input';sys.path.insert(0,str(INPUT/'scripts'))
from lab210_server_patch import central,laboratory
from lab210_module_fixes import desktop,mobile
from lab210_production_patch import backend as production_backend
from lab210_migration import ddl_for,SCHEMAS
from lab210_snapshot import extract,normalize,SOURCES

ROOT=Path('/opt/concrefer-unificado');P=ROOT/'public/unificado';M=ROOT/'mapa-api';L=ROOT/'laboratorio/service/server'
H=ROOT/'homolog-next';HM=H/'visual-full/mapa'
DB='concretrack_postes';IAM='mapa_unificado_teste';HIAM='mapa_visual_homolog_20261118'
DBS={DB,IAM,HIAM}
MASTERS=['alex','marcelo','philippe','user-ricardo']
OPERATORS={'francisco':'pederneiras','ricardogoncalvesrb':'ribeirao'}
EXCLUDED={70195,70990,70991,70992,70993,70994,70995,70996}

def sql(db,query,readonly=False):
    assert db in DBS or db.startswith('lab210_rehearsal_')
    source=('BEGIN READ ONLY;SET LOCAL statement_timeout=\'10s\';'+query+';ROLLBACK;') if readonly else query
    p=subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_production_release','psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d',db],input=source,text=True,capture_output=True)
    if p.returncode:raise RuntimeError(p.stderr[-2200:])
    out=p.stdout.lstrip();values=[];decoder=json.JSONDecoder()
    while out:
        value,end=decoder.raw_decode(out);values.append(value);out=out[end:].lstrip()
    return values
def quote(value):return "'"+str(value).replace("'","''")+"'"
def receipt():return json.loads((S/'release.json').read_text())
def store(r):
    data=json.dumps(r,ensure_ascii=False,indent=2)
    (S/'release.json').write_text(data)
    if r.get('backup'):
        mirror=Path(r['backup'])/'rollback/release.json'
        if mirror.parent.is_dir():mirror.write_text(data);mirror.chmod(0o600)
def digest(path):
    with Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def run(args):return subprocess.check_output(args,text=True)
def screens():return [x for x in json.loads((INPUT/'unificado/mapa/api/screen_catalog.json').read_text()) if x['id'].startswith(('labPedeCec','labRibCec'))]
def grant_pairs(homolog=False):
    users=MASTERS+(['user-alex'] if homolog else [])
    return [(u,s['id']) for u in users for s in screens()]+[(u,s['id']) for u,unit in OPERATORS.items() for s in screens() if '/'+unit+'/' in s['path']]
def grant_snapshot(db,homolog=False):
    users=sorted(set(u for u,s in grant_pairs(homolog)))
    return sql(db,"SELECT coalesce(json_agg(t),'[]') FROM(SELECT * FROM unificado_auth.user_screen_permissions WHERE user_id IN ("+','.join(quote(u) for u in users)+") AND (screen_id LIKE 'labPedeCec%' OR screen_id LIKE 'labRibCec%') ORDER BY user_id,screen_id)t",True)[0]
def write_grants(db,homolog=False):
    pairs=grant_pairs(homolog)
    commands=['BEGIN;SET LOCAL lock_timeout=\'3s\';']
    for user,screen in pairs:
        commands.append("INSERT INTO unificado_auth.user_screen_permissions(user_id,screen_id,allowed,updated_by,updated_at) VALUES("+quote(user)+','+quote(screen)+",true,'lab210-user-approved-20261122',now()) ON CONFLICT(user_id,screen_id) DO UPDATE SET allowed=true,updated_by=excluded.updated_by,updated_at=excluded.updated_at;")
    commands.append('COMMIT;');sql(db,'\n'.join(commands));return grant_snapshot(db,homolog)
def target_files():
    targets=[P/name for name in ['VERSION','index.html','login.html','sw.js','shell/shell.js','shell/menu.config.js','shell/icons.js','shell/module-pages.js','shell/module-pages-mobile.js']]
    targets += [M/name for name in ['app.py','screen_catalog.json','lab_cec_units.py']]+[L/name for name in ['app.py','cec_units.py']]
    for unit in SCHEMAS:
        root=INPUT/'unificado/laboratorio/service/server/static'/unit
        targets += [L/'static'/unit/p.relative_to(root) for p in root.rglob('*') if p.is_file()]
    return targets
def backup():
    assert not (S/'release.json').exists(),'Never replace a backup receipt'
    assert (P/'VERSION').read_text().strip()=='2.0.0'
    assert sql(DB,"SELECT count(*) FROM pg_namespace WHERE nspname IN ('lab_cec_pederneiras','lab_cec_ribeirao')",True)[0]==0
    b=ROOT/'backups'/('lab210-production-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'));b.mkdir(mode=0o700)
    r={'backup':str(b),'phase':'backup','version_before':'2.0.0','version_after':'2.1.0','files':[],'database_backups':[],'prod_grants_before':grant_snapshot(IAM),'homolog_grants_before':grant_snapshot(HIAM,True),'created_at_utc':datetime.now(timezone.utc).isoformat()}
    with tarfile.open(b/'release-2.0.0.tar.gz','w:gz') as tar:tar.add(P,arcname='public/unificado')
    r['release_tar']={'path':str(b/'release-2.0.0.tar.gz'),'sha256':digest(b/'release-2.0.0.tar.gz')}
    for target in target_files():
        assert target.resolve().is_relative_to(ROOT) and not target.resolve().is_relative_to(H)
        item={'path':str(target),'existed':target.is_file()}
        if item['existed']:
            dest=b/'files'/str(target).lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,dest);item.update(backup=str(dest),sha256=digest(target))
        r['files'].append(item)
    r['unit_states']={}
    for unit in ['mapa-unificado-auth.service','laboratorio-unificado.service','unificado-visual-homolog-mapa.service','unificado-visual-homolog-laboratorio.service']:
        state=dict(x.split('=',1) for x in run(['systemctl','show',unit,'-p','FragmentPath','-p','DropInPaths','-p','MainPID','-p','EnvironmentFiles']).splitlines());r['unit_states'][unit]=state
        import re
        paths=[state['FragmentPath'],*state['DropInPaths'].split(),*re.findall(r'(/[^ ]+) \(ignore_errors=',state.get('EnvironmentFiles',''))]
        for path in paths:
            src=Path(path)
            if src.is_file():dest=b/'config'/path.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
    nginx=run(['nginx','-T']);(b/'nginx-T.txt').write_text(nginx)
    for db,name in [(DB,'laboratorio.dump'),(IAM,'central.dump'),(HIAM,'central-homolog.dump')]:
        dump=b/name
        with dump.open('wb') as f:subprocess.run(['sudo','-u','postgres','pg_dump','-Fc','-d',db],stdout=f,check=True)
        subprocess.run(['pg_restore','-l',str(dump)],stdout=subprocess.DEVNULL,check=True)
        r['database_backups'].append({'database':db,'path':str(dump),'sha256':digest(dump),'size':dump.stat().st_size})
    for p in b.rglob('*'):
        if p.is_file():p.chmod(0o600)
    r['phase']='backed_up';store(r)
    return {'phase':r['phase'],'backup':str(b),'database_backups':r['database_backups'],'release_tar':r['release_tar']}
def rehearse():
    r=receipt();assert r['phase']=='backed_up';b=Path(r['backup']);results=[]
    root=b/'rollback-rehearsal';root.mkdir(mode=0o700,exist_ok=True)
    with tarfile.open(r['release_tar']['path']) as tar:tar.extractall(root,filter='data')
    for entry in r['files']:
        if Path(entry['path']).is_relative_to(P) and entry['existed']:
            restored=root/'public/unificado'/Path(entry['path']).relative_to(P);assert digest(restored)==entry['sha256']
    for item in r['database_backups']:
        assert digest(item['path'])==item['sha256']
        db='lab210_rehearsal_'+('lab' if item['database']==DB else 'central' if item['database']==IAM else 'homolog')+'_20261122'
        # Fixed allowlisted names, private postgres-owned rehearsal databases.
        subprocess.run(['sudo','-u','postgres','createdb',db],check=True,capture_output=True)
        try:
            sql(db,'REVOKE CONNECT,TEMPORARY ON DATABASE '+db+' FROM PUBLIC;')
            # The backup stays root-only. Supply its bytes through stdin instead
            # of granting the postgres OS user access to the private directory.
            with Path(item['path']).open('rb') as stream:
                restore=subprocess.run(['sudo','-u','postgres','pg_restore','--exit-on-error','--no-owner','--no-privileges','-d',db],stdin=stream,capture_output=True)
            if restore.returncode:raise RuntimeError('Restore rehearsal failed: '+restore.stderr.decode(errors='replace').splitlines()[0])
            q="SELECT count(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema')"
            counts=sql(db,q,True)[0];assert counts>0
            results.append({'original':item['database'],'restored_to':db,'restored_tables':counts,'dump_sha256_verified':True,'restore_passed':True})
        finally:subprocess.run(['sudo','-u','postgres','dropdb',db],check=True,capture_output=True)
    r['rehearsal']={'files_restored_and_verified':True,'databases':results,'temporary_databases_dropped':True};r['phase']='rollback_rehearsed';store(r)
    return r['rehearsal']
def homolog_grants():
    r=receipt();assert r['phase']=='rollback_rehearsed'
    private=[];public=[]
    for user,unit in OPERATORS.items():
        row=sql(IAM,'SELECT row_to_json(u) FROM public.usuarios u WHERE id='+quote(user)+' AND ativo AND deleted_at IS NULL',True)[0]
        before=sql(HIAM,'SELECT coalesce(json_agg(t),\'[]\') FROM(SELECT id,nome,perfil,ativo FROM public.usuarios WHERE id='+quote(user)+')t',True)[0]
        assert row['id']==user
        if not before:
            sql(HIAM,'BEGIN;INSERT INTO public.usuarios SELECT * FROM json_populate_record(NULL::public.usuarios,'+quote(json.dumps(row))+');COMMIT;')
        else:assert before[0]['nome']==row['nome'] and before[0]['ativo']
        scope=sql(IAM,'SELECT row_to_json(t) FROM(SELECT user_id,unit_code,alcada FROM unificado_auth.user_units WHERE user_id='+quote(user)+')t',True)[0];assert scope['unit_code']==unit
        sql(HIAM,'BEGIN;INSERT INTO unificado_auth.user_units(user_id,unit_code,alcada,updated_by) VALUES('+quote(user)+','+quote(unit)+','+quote(scope['alcada'])+",'lab210-approved-mirror') ON CONFLICT(user_id) DO UPDATE SET unit_code=excluded.unit_code,alcada=excluded.alcada,updated_by=excluded.updated_by;COMMIT;")
        if user=='ricardogoncalvesrb':sql(HIAM,"INSERT INTO unificado_auth.user_unit_extras(user_id,unit_code,granted_by) VALUES('ricardogoncalvesrb','noroeste','lab210-approved-mirror') ON CONFLICT DO NOTHING;")
        private.append({'id':user,'source_credential_hash_preserved':True,'new_password_created':False,'before':before})
        public.append({'id':user,'name':row['nome'],'unit':unit,'before':before,'existing_production_identity_mirrored_to_H':not bool(before)})
    r['homolog_identity_mirrors']=private;r['homolog_grants_after']=write_grants(HIAM,True);r['phase']='homolog_access_ready';store(r)
    return {'identities':public,'grant_rows':len(r['homolog_grants_after']),'operator_grants':[x for x in r['homolog_grants_after'] if x['user_id'] in OPERATORS],'production_permission_writes':0}
def atomic(target,data):
    assert target.resolve().is_relative_to(ROOT) and not target.resolve().is_relative_to(H)
    target.parent.mkdir(parents=True,exist_ok=True);temp=target.with_name(target.name+'.lab210.tmp');temp.write_bytes(data)
    if target.exists():shutil.copystat(target,temp)
    else:temp.chmod(0o644)
    os.replace(temp,target)
def homolog_role_parity():
    r=receipt();assert r['phase']=='prepared'
    before=sql(HIAM,"SELECT coalesce(json_agg(t),'[]') FROM(SELECT user_id,screen_id,allowed FROM unificado_auth.user_screen_permissions WHERE user_id='ricardogoncalvesrb' AND screen_id LIKE 'labNoro%')t",True)[0]
    source=sql(IAM,"SELECT coalesce(json_agg(t),'[]') FROM(SELECT user_id,screen_id,allowed FROM unificado_auth.user_screen_permissions WHERE user_id='ricardogoncalvesrb' AND screen_id LIKE 'labNoro%' AND allowed ORDER BY screen_id)t",True)[0]
    assert not before and any(x['screen_id']=='labNoroUsuarios' for x in source)
    commands=['BEGIN;']
    for x in source:
        commands.append("INSERT INTO unificado_auth.user_screen_permissions(user_id,screen_id,allowed,updated_by) VALUES('ricardogoncalvesrb',"+quote(x['screen_id'])+",true,'lab210-existing-production-LB-mirror');")
    commands.append('COMMIT;');sql(HIAM,'\n'.join(commands))
    r['homolog_existing_noro_grants']={'before':before,'after':source,'reason':'Mirror the confirmed existing production LB admin in Noroeste for the same central identity; no new production Noroeste grant.'};store(r)
    return r['homolog_existing_noro_grants']
def prepare():
    r=receipt();assert r['phase']=='homolog_access_ready';candidate={}
    assert digest(M/'app.py')=='dea6087456a81d16a9fe4416761a1695818a948cd085dc4580ed5ad3d260e9b7'
    assert digest(L/'app.py')=='31b8d9244384cc15cd25dccabbdcce27d72c0c9e060388e171e817c93c43ecfa'
    candidate[M/'app.py']=central((M/'app.py').read_text()).encode();candidate[L/'app.py']=laboratory((L/'app.py').read_text()).encode()
    candidate[L/'cec_units.py']=production_backend((INPUT/'unificado/laboratorio/service/server/cec_units.py').read_text()).encode()
    candidate[M/'lab_cec_units.py']=(INPUT/'unificado/mapa/api/lab_cec_units.py').read_bytes()
    old=json.loads((M/'screen_catalog.json').read_text());new=screens();assert not any(x['id'].startswith(('labPedeCec','labRibCec')) for x in old)
    candidate[M/'screen_catalog.json']=json.dumps(old+new,ensure_ascii=False,indent=2).encode()
    for name in ['VERSION','index.html','login.html','sw.js','shell/shell.js']:
        candidate[P/name]=(P/name).read_text().replace('2.0.0','2.1.0').encode()
    source=(INPUT/'unificado/shell/menu.config.js').read_text();start=source.index('MENU_CONFIG.laboratorio.groups.push(...');end=source.index('// Keep test definitions',start);block=source[start:end]
    # Strip the H-only flag from these fourteen approved entries alone.
    assert block.count('"ambiente": "homolog"')==14
    block=block.replace(',\n        "ambiente": "homolog"','')
    assert '"ambiente": "homolog"' not in block
    old=(P/'shell/menu.config.js').read_text();marker='// Keep test definitions in source, but exclude them from the production catalogue.';assert old.count(marker)==1 and 'labPedeCec' not in old
    candidate[P/'shell/menu.config.js']=old.replace(marker,block+marker).encode()
    descriptions=(INPUT/'unificado/shell/icons.js').read_text().split('\nObject.assign(window.UnificadoPresentation.descriptions,')[-1]
    assert 'labPedeCec' in descriptions
    candidate[P/'shell/icons.js']=((P/'shell/icons.js').read_text()+'\nObject.assign(window.UnificadoPresentation.descriptions,'+descriptions).encode()
    candidate[P/'shell/module-pages.js']=desktop((P/'shell/module-pages.js').read_text()).encode()
    candidate[P/'shell/module-pages-mobile.js']=mobile((P/'shell/module-pages-mobile.js').read_text()).encode()
    for unit in SCHEMAS:
        root=INPUT/'unificado/laboratorio/service/server/static'/unit
        for p in root.rglob('*'):
            if p.is_file():candidate[L/'static'/unit/p.relative_to(root)]=p.read_bytes()
    manifest=[]
    for target,data in candidate.items():
        saved=S/'candidate'/target.relative_to(ROOT);saved.parent.mkdir(parents=True,exist_ok=True);saved.write_bytes(data)
        if target.suffix=='.py':ast.parse(data.decode())
        if target.suffix=='.js':subprocess.run(['node','--check',str(saved)],check=True,capture_output=True)
        manifest.append({'path':str(target),'candidate':str(saved),'sha256':digest(saved)})
    r['manifest']=manifest;r['phase']='prepared';store(r)
    return {'phase':r['phase'],'files':len(manifest),'prod_database_guard':DB,'new_services':0,'new_workers':0,'new_pools':0}
def rollback_check():
    r=receipt();b=Path(r['backup']);checked=0
    for entry in r['files']:
        if entry['existed']:
            assert Path(entry['backup']).resolve().is_relative_to(b)
            assert digest(entry['backup'])==entry['sha256'];checked+=1
    for item in r['database_backups']:assert digest(item['path'])==item['sha256']
    assert r['rehearsal']['files_restored_and_verified'] and all(x['restore_passed'] for x in r['rehearsal']['databases'])
    return {'passed':True,'backup_files_sha256_verified':checked,'database_dumps_verified':len(r['database_backups']),'restore_rehearsal_passed':True,'mutations':0,'restores_version':'2.0.0'}
def bundle_rollback():
    r=receipt();assert r['phase']=='prepared';folder=Path(r['backup'])/'rollback';folder.mkdir(mode=0o700,exist_ok=True)
    original=Path(__file__).read_text();old="S=Path('/opt/concrefer-unificado/staging/lab210-production-20261122')";assert original.splitlines().count(old)==1
    (folder/'release.py').write_text(original.replace(old,'S=Path('+repr(str(folder))+')',1))
    dest=folder/'input/scripts';dest.mkdir(parents=True,mode=0o700)
    for name in ['lab210_server_patch.py','lab210_module_fixes.py','lab210_production_patch.py','lab210_migration.py','lab210_snapshot.py']:shutil.copy2(INPUT/'scripts'/name,dest/name)
    r['rollback_command']='python3 '+str(folder/'release.py')+' rollback';r['rollback_check_command']='python3 '+str(folder/'release.py')+' rollback_check';store(r)
    result=json.loads(run(['python3',str(folder/'release.py'),'rollback_check']));r['rollback_check']=result;store(r)
    return {'command':r['rollback_command'],'check_command':r['rollback_check_command'],'check':result}
def migrate():
    r=receipt();assert r['phase']=='prepared' and (S/'gate-homolog-approved.json').is_file()
    assert json.loads((S/'gate-homolog-approved.json').read_text())['passed']
    ddl="BEGIN;SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='30s';DO $$ BEGIN IF current_database()<>'concretrack_postes' THEN RAISE EXCEPTION 'Production Lab destination mismatch'; END IF;END $$;"+''.join(ddl_for(u) for u in SCHEMAS)+'COMMIT;'
    sql(DB,ddl);r['migration_applied']=True;store(r)
    data=extract();private=Path(r['backup'])/'source-snapshot.json';private.write_text(json.dumps(data));private.chmod(0o600)
    summary=[]
    for unit,snapshot in data.items():
        assert snapshot['database']==SOURCES[unit];rows=[];rejected=[]
        for raw in snapshot['rows']:
            if unit=='pederneiras' and int(raw['id']) in EXCLUDED:rejected.append({'id':raw['id'],'reason':'user explicitly excluded; never corrected or imported'});continue
            try:row=normalize(raw)
            except Exception as e:rejected.append({'id':raw.get('id'),'reason':str(e)});continue
            rows.append(row)
        normalized=[{'id':x['id'],'produto':x['produto'],'formula':x['formula'],'data':x['data'],'hora':x['hora'],'numero_serie':x['numero_serie'],'source_database':SOURCES[unit],'source_payload':x['raw']} for x in rows]
        q='BEGIN;INSERT INTO '+SCHEMAS[unit]+'.massadas(id,produto,formula,data,hora,numero_serie,source_database,source_payload) SELECT id,produto,formula,data,hora,numero_serie,source_database,source_payload FROM jsonb_to_recordset('+quote(json.dumps(normalized))+'::jsonb) AS x(id bigint,produto text,formula text,data date,hora text,numero_serie text,source_database text,source_payload jsonb);COMMIT;'
        sql(DB,q);summary.append({'unit':unit,'source_database':SOURCES[unit],'captured_at':snapshot['captured_at'],'source_count':len(snapshot['rows']),'imported':len(rows),'excluded':rejected,'automatic_sync':False})
    r['imports']=summary;r['grants_applied']=True;store(r)
    r['prod_grants_after']=write_grants(IAM);r['phase']='migrated';store(r)
    return {'phase':r['phase'],'imports':summary,'grant_rows':len(r['prod_grants_after']),'fixtures_imported':0}
def restart(unit,port):
    subprocess.run(['systemctl','restart',unit],check=True)
    for i in range(30):
        try:
            assert run(['systemctl','is-active',unit]).strip()=='active'
            with urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/health',timeout=5) as response:assert response.status==200
            return {'service':unit,'health':200}
        except Exception:
            if i==29:raise
            time.sleep(1)
def install():
    r=receipt();assert r['phase']=='migrated'
    for entry in r['manifest']:assert digest(entry['candidate'])==entry['sha256'],entry['candidate']
    for entry in r['files']:
        target=Path(entry['path'])
        assert (target.is_file() and digest(target)==entry['sha256']) if entry['existed'] else not target.exists(),str(target)
    r['backend_files_touched']=True;store(r)
    for entry in r['manifest']:
        target=Path(entry['path'])
        if not target.is_relative_to(P):atomic(target,Path(entry['candidate']).read_bytes())
    r['checks']=[]
    for unit,port in [('laboratorio-unificado.service',13064),('mapa-unificado-auth.service',13052)]:
        r['checks'].append(restart(unit,port));store(r)
    r['phase']='backend_ready';store(r);return {'phase':r['phase'],'health':r['checks']}
def publish():
    r=receipt();assert r['phase']=='backend_ready'
    for entry in r['manifest']:assert digest(entry['candidate'])==entry['sha256'],entry['candidate']
    r['public_files_touched']=True;store(r)
    for entry in r['manifest']:
        target=Path(entry['path'])
        if target.is_relative_to(P) and target.name!='VERSION':atomic(target,Path(entry['candidate']).read_bytes())
    atomic(P/'VERSION',b'2.1.0\n');r['phase']='published';r['published_at_utc']=datetime.now(timezone.utc).isoformat();store(r)
    return {'version':(P/'VERSION').read_text().strip(),'backup':r['backup'],'files':len(r['manifest']),'phase':r['phase']}
def rollback():
    r=receipt()
    for entry in r['files'] if r.get('backend_files_touched') or r.get('public_files_touched') else []:
        target=Path(entry['path'])
        if entry['existed']:
            assert digest(entry['backup'])==entry['sha256'];atomic(target,Path(entry['backup']).read_bytes())
        elif target.is_file():
            assert target.resolve().is_relative_to(ROOT) and not target.resolve().is_relative_to(H);target.unlink()
    if r.get('grants_applied'):
        users=sorted(set(u for u,s in grant_pairs()));q=['BEGIN;DELETE FROM unificado_auth.user_screen_permissions WHERE user_id IN ('+','.join(quote(u) for u in users)+") AND (screen_id LIKE 'labPedeCec%' OR screen_id LIKE 'labRibCec%');"]
        for row in r['prod_grants_before']:q.append('INSERT INTO unificado_auth.user_screen_permissions SELECT * FROM json_populate_record(NULL::unificado_auth.user_screen_permissions,'+quote(json.dumps(row))+');')
        q.append('COMMIT;');sql(IAM,'\n'.join(q))
    if r.get('backend_files_touched'):
        for unit,port in [('laboratorio-unificado.service',13064),('mapa-unificado-auth.service',13052)]:restart(unit,port)
    r['phase']='rolled_back';r['new_lab_data_preserved']=True;store(r)
    return {'phase':r['phase'],'version':(P/'VERSION').read_text().strip(),'new_lab_data_preserved':True}

if __name__=='__main__':
    action=sys.argv[1];assert action in ['backup','rehearse','homolog_grants','homolog_role_parity','prepare','bundle_rollback','rollback_check','migrate','install','publish','rollback']
    print(json.dumps(globals()[action]()))
