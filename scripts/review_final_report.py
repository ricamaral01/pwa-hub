"""Build honest coverage, galleries and visual review sheets from browser evidence."""
import argparse,collections,hashlib,html,json,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[1];O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
p=argparse.ArgumentParser();p.add_argument('--approve-pages',nargs='*');a=p.parse_args()
def read(path,default=None):return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default
def write(name,value):(O/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
inventory=read(O/'inventario.json');definitions={r['id']:r for r in inventory}
rows=[];profiles=[];missing=[]
for role in ['GERENCIA','LABORATORIO','PCP','PRODUCAO','QUALIDADE','SUPRIMENTOS','CONSULTA']:
    actual=[row for row in read(O/('matrix-'+role.lower()+'.json'),[]) if not definitions[row['screen']].get('inactive')]
    for row in actual:
        expected_hash=definitions[row['screen']].get('query','')
        if expected_hash.startswith('#') and not row.get('native_route_proof'):
            row.update(ok=False,native_route_unverified=expected_hash)
        if row['screen']!='shell-login':
            redirects=[frame['url'] for layout in row.get('layout',[]) for frame in layout['frames'] if '/unificado/login.html' in frame['url']]
            if redirects:row.update(ok=False,unexpected_central_login_redirects=redirects)
    expected=read(O/('profile-access-'+role.lower()+'.json'))
    absent=sorted(set(expected['eligible_screens'])-{r['screen'] for r in actual}) if expected else ['profile_not_run']
    missing.extend({'profile':role,'screen':screen} for screen in absent)
    profiles.append({'profile':role,'cases':len(actual),'expected':len(expected['eligible_screens']) if expected else None,'missing':len(absent),'failed':sum(not r.get('ok') for r in actual),'widths':sum(len(r.get('layout',[])) for r in actual)})
    for row in actual:
        row={**row,'module':definitions[row['screen']]['module'],'label':definitions[row['screen']].get('label',row['screen'])};rows.append(row)
summary={'version':'1.4.26','inventory':len(inventory),'profiles':profiles,'cases':len(rows),'viewports':sum(len(r.get('layout',[])) for r in rows),'failures':sum(not r.get('ok') for r in rows),'missing':missing,'candidate_assets':True}
write('matriz.json',{'summary':summary,'cases':rows});write('resumo-matriz.json',summary)
old={r['key']:r for r in read(O/'revisao-visual.json',[])};reviews=[]
for row in rows:
    key=row['profile']+':'+row['screen'];captures={str(w):f'capturas/{row["profile"].lower()}/{row["screen"]}-{w}.png' for w in [1440,390]}
    hashes={w:digest(O/path) for w,path in captures.items() if (O/path).exists()}
    prior=old.get(key,{})
    status=prior.get('status','pendente') if prior.get('capture_sha256')==hashes else 'pendente'
    review={'key':key,'screen':row['screen'],'profile':row['profile'],'module':row['module'],'label':row['label'],'status':status,'captures':captures,'capture_sha256':hashes,'matrix_ok':row.get('ok',False),'automatic_problems':[i for m in row.get('layout',[]) for f in m['frames'] for i in f['audit'].get('issues',[])]}
    if prior.get('reviewed_sheet') and status!='pendente':review['reviewed_sheet']=prior['reviewed_sheet'];review['review_note']=prior.get('review_note','')
    reviews.append(review)
(O/'folhas/qa').mkdir(parents=True,exist_ok=True);(O/'recortes').mkdir(exist_ok=True)
try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
except OSError:font=ImageFont.load_default()
def tile(draw,canvas,row,x,y,width=520,height=310):
    label=row['profile']+' · '+row['screen']
    draw.text((x+8,y+6),label[:65],fill='#0b1730',font=font)
    for w,px,pw,ph in [(1440,x+8,350,225),(390,x+370,140,270)]:
        path=O/f'capturas/{row["profile"].lower()}/{row["screen"]}-{w}.png'
        if not path.exists():
            draw.text((px,y+30),str(w)+' ausente',fill='#6b7280',font=font)
            continue
        with Image.open(path) as source:
            thumb=source.convert('RGB');thumb.thumbnail((pw,ph));canvas.paste(thumb,(px,y+30))
    draw.rectangle((x,y,x+width-1,y+height-1),outline='#e1e5eb')
by_module=collections.defaultdict(list)
for row in rows:by_module[row['module']].append(row)
qa_index={}
for module,items in sorted(by_module.items()):
    representatives={}
    for row in sorted(items,key=lambda r:(r['profile']!='GERENCIA',not r.get('ok'),r['screen'])):representatives.setdefault(row['screen'],row)
    selected=list(representatives.values());cols=3;sheet=Image.new('RGB',(520*cols,310*math.ceil(len(selected)/cols)),'#f4f5f7');draw=ImageDraw.Draw(sheet)
    for index,row in enumerate(selected):tile(draw,sheet,row,(index%cols)*520,(index//cols)*310)
    sheet.save(O/f'folhas/{module}.png')
    for offset in range(0,len(items),8):
        group=items[offset:offset+8];name=f'folhas/qa/{module}-{offset//8+1:03}.png';qa=Image.new('RGB',(1560,310*math.ceil(len(group)/3)),'#f4f5f7');draw=ImageDraw.Draw(qa)
        for index,row in enumerate(group):tile(draw,qa,row,(index%3)*520,(index//3)*310)
        qa.save(O/name);qa_index[name]=[r['profile']+':'+r['screen'] for r in group]
for review in reviews:
    for width,rel in review['captures'].items():
        source=O/rel
        if not source.exists():continue
        dest=f'recortes/{review["profile"].lower()}-{review["screen"]}-{width}.png'
        with Image.open(source) as im:
            crop=im.crop((256 if width=='1440' else 0,31,im.width,min(im.height,770)));crop.save(O/dest)
        review.setdefault('recortes',{})[width]=dest
if a.approve_pages:
    requested=set(a.approve_pages)
    assert requested<=qa_index.keys(),requested-qa_index.keys()
    for review in reviews:
        page=next((page for page in requested if review['key'] in qa_index[page]),None)
        if page and review['matrix_ok']:
            review.update(status='aprovado',reviewed_sheet=page,review_note='Capturas 1440 e 390 conferidas na folha, com recorte vinculado e auditoria de geometria e texto. Acesso nativo recusado, quando previsto, permanece identificado na matriz.')
write('qa-index.json',qa_index);write('revisao-visual.json',reviews)
parts=['<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisão final · 1.4.26</title><style>body{font:14px/1.5 system-ui;background:#f4f5f7;color:#0b1730;margin:24px}a{color:#15416f}nav{display:flex;gap:12px;margin:16px 0}select,input{padding:8px}table{background:white;border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #e1e5eb;padding:10px}small{color:#5b6779}</style><h1>Revisão final · candidata 1.4.26</h1><p>Somente homologação 18446. A matriz registra os resultados reais; pendências não são aprovadas automaticamente.</p><p><a href="RELATORIO.html">Relatório</a> · <a href="matriz.json">Matriz</a> · <a href="revisao-visual.json">Revisão visual</a></p><nav><input id="q" placeholder="Buscar tela"><select id="module"><option value="">Todos os módulos</option>']
for module in sorted(by_module):parts.append(f'<option>{html.escape(module)}</option>')
parts.append('</select><select id="profile"><option value="">Todos os perfis</option>')
for role in profiles:parts.append(f'<option>{role["profile"]}</option>')
parts.append('</select></nav><p>Folhas por módulo: '+ ' · '.join(f'<a href="folhas/{html.escape(m)}.png">{html.escape(m)}</a>' for m in sorted(by_module))+'</p><table><thead><tr><th>Módulo</th><th>Tela</th><th>Perfil</th><th>Resultado</th><th>Capturas</th></tr></thead><tbody>')
review_map={r['key']:r for r in reviews}
for row in rows:
    review=review_map[row['profile']+':'+row['screen']];links=' · '.join(f'<a href="capturas/{row["profile"].lower()}/{html.escape(row["screen"])}-{w}.png">{w}</a>' for w in [1440,1024,820,390] if (O/f'capturas/{row["profile"].lower()}/{row["screen"]}-{w}.png').exists()) or 'Captura indisponível'
    parts.append(f'<tr data-module="{row["module"]}" data-profile="{row["profile"]}"><td>{row["module"]}</td><td>{html.escape(row["label"])}<br><small>{html.escape(row["screen"])}</small></td><td>{row["profile"]}</td><td>{"Matriz aprovada" if row.get("ok") else "Problema na matriz"} · visual {review["status"]}</td><td>{links}</td></tr>')
parts.append('''</tbody></table><script>function filter(){const q=document.querySelector('#q').value.toLocaleLowerCase('pt-BR');document.querySelectorAll('tbody tr').forEach(r=>r.hidden=!r.textContent.toLocaleLowerCase('pt-BR').includes(q)||['module','profile'].some(id=>document.getElementById(id).value&&r.dataset[id]!==document.getElementById(id).value))}document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',filter));</script></html>''')
(O/'galeria.html').write_text(''.join(parts),encoding='utf-8')
print(json.dumps({'cases':len(rows),'failed':summary['failures'],'missing':len(missing),'visual_pending':sum(r['status']!='aprovado' for r in reviews),'qa_sheets':len(qa_index)}))
