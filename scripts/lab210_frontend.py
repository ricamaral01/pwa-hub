"""Build new H unit screens from frozen Noroeste; never modifies the templates."""
import hashlib,json,posixpath,re
from pathlib import Path
from lab210_series import transform as preserve_series

R=Path(__file__).resolve().parents[1];U=R/'unificado';L=U/'laboratorio/service/server/static';SOURCE=L/'noroeste/cec'
UNITS={'pederneiras':('Pederneiras','labPedeCec'),'ribeirao':('Ribeirão Preto','labRibCec')}
PAGES=[('', 'Visão geral',''),('Etiquetas','Etiquetas QR','etiquetas/'),('Leitura','Leitura de CP','leitura/'),
       ('Resultados','Resultados dos corpos de prova','analise/resultado-cp.html'),
       ('RompimentosMes','Rompimentos por mês','rompimentos-mes/'),
       ('Analise','Análise estatística','analise/'),('Relatorio','Relatório CEC','analise/relatorio.html')]


def patch_once(text,before,after):
    assert text.count(before)==1,(before[:100],text.count(before))
    return text.replace(before,after)


def asset_url(value,relative,unit):
    if 'assets/' not in value or '://' in value or value.startswith('data:'):return value
    value=value.replace('/unificado/laboratorio/'+unit+'/cec/','/unificado/laboratorio/noroeste/cec/')
    return value if value.startswith('/') else posixpath.normpath('/unificado/laboratorio/noroeste/cec/'+str(relative.parent)+'/'+value)


def reading_queue(text,unit):
    text=patch_once(text,f"const QUEUE_KEY = 'concretrack_qrcp_queue_{unit}';",f'''
let QUEUE_KEY = null;
let queueActorId = null;
function setQueueActor(id) {{
  queueActorId=id;
  QUEUE_KEY='unificado-cec-{unit}-queue:'+id;
}}
async function identifyQueueActor() {{
  try {{
    const response=await fetch(API_BASE+'/auth/me',{{credentials:'same-origin',cache:'no-store'}});
    if(!response.ok)return false;
    const actor=await response.json();
    if(!actor.id)return false;
    if(queueActorId&&queueActorId!==actor.id){{currentQR=null;currentReadingId=null;}}
    setQueueActor(actor.id);return true;
  }}catch{{return false;}}
}}
''')
    text=patch_once(text,"document.addEventListener('DOMContentLoaded', () => {","document.addEventListener('DOMContentLoaded', async () => {\n  if(!await identifyQueueActor()){showToast('Conecte-se ao Uni para identificar a conta e abrir as leituras.', 'error');return;}")
    text=patch_once(text,'function onOnline() {','async function onOnline() {\n  if(!await identifyQueueActor())return;')
    text=patch_once(text,'function getQueue() {','function getQueue(key=QUEUE_KEY) {\n  if(!key)return [];')
    text=patch_once(text,"localStorage.getItem(QUEUE_KEY) || '[]'","localStorage.getItem(key) || '[]'")
    text=patch_once(text,'function addToQueue(item) {',"function addToQueue(item) {\n  if(!QUEUE_KEY||!queueActorId){showToast('Abra a tela conectado ao Uni antes de guardar leituras.', 'error');return false;}\n  item.queued_by=queueActorId;")
    start=text.index('async function syncQueue() {');end=text.index('\n/*',start);part=text[start:end]
    part=patch_once(part,'const q = getQueue();','const batchQueueKey=QUEUE_KEY;\n  const batchActorId=queueActorId;\n  const q = getQueue(batchQueueKey);')
    part=patch_once(part,'if (!authRes.ok) return;',"if (!authRes.ok) return;\n    const actor=await authRes.json();\n    if(actor.id!==batchActorId){setQueueActor(actor.id);return;}")
    part=part.replace('getQueue().filter','getQueue(batchQueueKey).filter').replace('localStorage.setItem(QUEUE_KEY,','localStorage.setItem(batchQueueKey,')
    text=text[:start]+part+text[end:]
    text=patch_once(text,'id: currentReadingId,','id: currentReadingId,\n    queued_by: queueActorId,')
    text=patch_once(text,'function displayResult(text) {\n  const d = parseQR(text);',f'''function displayResult(text) {{
  const d = parseQR(text);
  if(d.unidade!=={json.dumps(unit)}){{currentQR=null;currentReadingId=null;document.getElementById('btnSalvar').disabled=true;showToast('Este QR pertence a outra unidade.', 'error');return;}}''')
    return text.replace('next=laboratorio/cec/leitura/',f'next=laboratorio/{unit}/cec/leitura/')


def build():
    before={str(p.relative_to(SOURCE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in SOURCE.rglob('*') if p.is_file()}
    outputs=[]
    for unit,(name,prefix) in UNITS.items():
        target=L/unit/'cec';target.mkdir(parents=True,exist_ok=True)
        for source in SOURCE.rglob('*'):
            if not source.is_file():continue
            rel=source.relative_to(SOURCE)
            if 'assets' in rel.parts:continue
            if source.suffix not in ['.html','.js','.json','.svg']:continue
            text=source.read_text(encoding='utf-8').replace('noroeste',unit).replace('Noroeste',name).replace('NOROESTE',name.upper())
            text=preserve_series(text,rel)
            text=re.sub(r'([\x27\x22])([\w./@-]*assets/[\w./@-]+)(\1)',lambda m:m[1]+asset_url(m[2],rel,unit)+m[1],text)
            text=text.replace('/unificado/laboratorio/noroeste/cec/analise/assets/img/concre.png','/unificado/assets/img/logo-concrefer.png')
            if source.suffix=='.html':
                banner=f'<p class="lab-unit-name{ " no-print" if rel.parts[0]=="etiquetas" else ""}">Laboratório · {name}</p>'
                text=re.sub(r'<body(?:\s[^>]*)?>',lambda m:m[0]+'\n'+banner,text,count=1)
                text=text.replace('</head>','<style>.lab-unit-name{margin:12px 24px;font:600 13px/1.5 system-ui;color:#193744}</style>\n</head>')
                text=re.sub(r'<title>(.*?)</title>',lambda m:'<title>'+m[1]+' · '+name+'</title>',text,count=1,flags=re.S)
                if rel.as_posix()=='etiquetas/index.html':
                    text=patch_once(text,"document.getElementById('btnGerar').disabled = false;","document.getElementById('btnGerar').disabled = !m.numero_serie || !m.formula || !m.produto;")
                    text=text.replace("if (!m) return alert('Selecione uma massada.');", "if (!m) return alert('Selecione uma massada.');\n  if(!m.numero_serie||!m.formula||!m.produto)return alert('Cadastro de origem incompleto. Confirme os dados da fábrica.');")
                    assert text.count('|rupt=${ruptDDMMYY}`')==2
                    text=text.replace('|rupt=${ruptDDMMYY}`',f'|rupt=${{ruptDDMMYY}}|unidade={unit}`')
                    text=patch_once(text,'<div class="etq-traco">',f'<div style="font-size:10px;font-weight:700">{name}</div><div class="etq-traco">')
                    text=patch_once(text,'// Idade (grande)',f"// Unidade, dentro da etiqueta de 90×40 mm\n      pdf.setFont('helvetica','bold');pdf.setFontSize(7);\n      pdf.text(caberTextoPDF(pdf,{json.dumps(name,ensure_ascii=False)},47),x0,20.5);\n\n      // Idade (grande)")
                    text=text.replace('`etiquetas_${traco',f'`etiquetas_{unit}_${{traco')
                    text=patch_once(text,'pdf.setTextColor(90, 98, 112);\n      pdf.text(caberTextoPDF(pdf, `NS ${nSerie}`, 29)', 'pdf.setTextColor(90, 98, 112);\n      pdf.setFontSize(7);\n      pdf.text(caberTextoPDF(pdf, `NS ${nSerie}`, 29)')
                    text=patch_once(text,'pdf.text(caberTextoPDF(pdf, `NS ${nSerie}`, 29), x0 + 18, 10);','pdf.text(caberTextoPDF(pdf, `NS ${nSerie}`, 35), x0 + 12, 10);')
                    text=text.replace('${idade} DIAS',"${idade} ${idade===1?'DIA':'DIAS'}")
                elif rel.as_posix()=='leitura/index.html':text=reading_queue(text,unit)
            if rel.as_posix()=='analise/api-client.js':
                begin=text.index('  function readCache(');end=text.index('  function mapGroupsToLegacyRows(',begin)
                text=text[:begin]+'  // Protected results are never restored from a previous central session.\n  function readCache(){return null;}\n  function writeCache(){}\n\n'+text[end:]
            if source.name=='sw.js':
                area=rel.parts[0];cache=f'unificado-cec-{unit}-{area}-2.1.0';own=f'unificado-cec-{unit}-{area}-'
                text=f'''const CACHE={json.dumps(cache)},PREFIX={json.dumps(own)};
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();}})()));
self.addEventListener('fetch',e=>{{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/cec-api/')||!(/\\.(?:js|css|woff2?|png|svg|ico)$/.test(u.pathname)))return;e.respondWith(fetch(e.request).then(r=>{{if(r.ok){{const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}}return r;}}).catch(()=>caches.match(e.request).then(r=>r||Response.error())));}});
'''
            if source.name=='manifest.json':
                manifest=json.loads(text)
                for icon in manifest.get('icons',[]):icon['src']=asset_url(icon['src'],rel,unit)
                manifest['name']=manifest.get('name','Laboratório CEC')+' · '+name
                text=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
            text='\n'.join(line.rstrip() for line in text.splitlines())+'\n'
            dest=target/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(text,encoding='utf-8');outputs.append(str(dest.relative_to(R)))
    # Keep the six approved synonym pairs and the existing column/search code.
    menu=U/'shell/menu.config.js';text=menu.read_text(encoding='utf-8');marker='// Keep test definitions in source, but exclude them from the production catalogue.'
    groups=[]
    for unit,(name,prefix) in UNITS.items():
        items=[{'id':prefix+suffix,'label':label+' · '+name,'path':unit+'/cec/'+path,'ambiente':'homolog'} for suffix,label,path in PAGES]
        groups.extend([{'label':'Corpos de Prova','unitName':name,'unitCode':unit,'items':[i for i in items if i['id'].endswith(('Etiquetas','Leitura','Resultados'))]},
                       {'label':'Controle estatístico','unitName':name,'unitCode':unit,'items':[i for i in items if not i['id'].endswith(('Etiquetas','Leitura','Resultados'))]}])
    assert not any(prefix in text for _,prefix in UNITS.values())
    text=patch_once(text,marker,'MENU_CONFIG.laboratorio.groups.push(...'+json.dumps(groups,ensure_ascii=False,indent=2)+');\n\n'+marker);menu.write_text(text,encoding='utf-8')
    module=U/'shell/module-pages.js';text=module.read_text(encoding='utf-8');text=text.replace("code === 'noroeste' ? 'Noroeste' : 'Campinas'","({campinas:'Campinas',noroeste:'Noroeste',pederneiras:'Pederneiras',ribeirao:'Ribeirão Preto'})[code] || code").replace("selectedUnit==='noroeste'?'Noroeste':'Campinas'","({campinas:'Campinas',noroeste:'Noroeste',pederneiras:'Pederneiras',ribeirao:'Ribeirão Preto'})[selectedUnit] || selectedUnit");module.write_text(text,encoding='utf-8')
    catalog=U/'mapa/api/screen_catalog.json';rows=json.loads(catalog.read_text(encoding='utf-8'))
    for unit,(name,prefix) in UNITS.items():
        rows.extend({'id':prefix+suffix,'module':'laboratorio','label':label+' · '+name,'path':'/unificado/laboratorio/'+unit+'/cec/'+path,'query':'','screen':None,'require':None,'ambiente':'homolog'} for suffix,label,path in PAGES)
    catalog.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    descriptions={'':'Consultar os indicadores do concreto','Etiquetas':'Emitir etiquetas QR de corpos de prova','Leitura':'Registrar a ruptura dos corpos de prova','Resultados':'Consultar os resultados dos corpos de prova','RompimentosMes':'Consultar os rompimentos por mês','Analise':'Analisar os resultados de resistência','Relatorio':'Emitir o relatório estatístico do concreto'}
    icons=U/'shell/icons.js';text=icons.read_text(encoding='utf-8');text+='\nObject.assign(window.UnificadoPresentation.descriptions,'+json.dumps({prefix+suffix:descriptions[suffix] for unit,(name,prefix) in UNITS.items() for suffix,_,_ in PAGES},ensure_ascii=False)+');\n';icons.write_text(text,encoding='utf-8')
    # Shell release identifiers only; the old Lab HTML/PDF templates remain exact.
    for rel in ['VERSION','index.html','login.html','sw.js','manifest.webmanifest','shell/shell.js']:
        p=U/rel
        if p.exists():p.write_text(p.read_text(encoding='utf-8').replace('2.0.0','2.1.0'),encoding='utf-8')
    after={str(p.relative_to(SOURCE)):hashlib.sha256(p.read_bytes()).hexdigest() for p in SOURCE.rglob('*') if p.is_file()};assert before==after
    out={'version':'2.1.0','new_files':outputs,'noroeste_template_hashes_preserved':True,'new_pools':0,'applied_to_server':False,'reference_queries':[q+' '+name for name,_ in UNITS.values() for q in ['leitura CP','etiqueta','rompimento','análise CEC','relatório laboratório']]}
    (R/'docs/revisao-visual-unificado/homolog/laboratorio-210-build.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'files':len(outputs),'version':'2.1.0','noroeste_unchanged':True}))


if __name__=='__main__':build()
