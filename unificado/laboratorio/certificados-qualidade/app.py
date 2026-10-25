"""Isolated CQ service behind the Unificado laboratory auth_request gateway."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError

import psycopg
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, Response
from psycopg.rows import dict_row
from pydantic import BaseModel, Field

from core import can_issue, summarize_day, validate_items
from report import make_pdf
from source import summarize_days, selected_source

HERE = Path(__file__).resolve().parent
DATA = Path(os.getenv('CQ_DATA_DIR', '/var/lib/concrefer-cq'))
VERIFY = os.getenv('CQ_VERIFY_BASE', 'https://concrefer.concretrack.com.br')
SIGNATURE = os.getenv('CQ_ENGINEER_SIGNATURE', str(DATA / 'assinatura-marcelo.png'))
LOGO = os.getenv('CQ_LOGO_PATH', str(HERE.parent.parent / 'assets' / 'img' / 'logo-concrefer.png'))
CORRECTORS = {v.strip() for v in os.getenv('CQ_REVISION_USER_IDS', '').split(',') if v.strip()}
RESPONSAVEIS_LABORATORIO = ('Ricardo Do Amaral', 'Philippe Augusto')
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


def db():
    dsn = os.environ['DATABASE_URL'].replace('postgresql+psycopg://', 'postgresql://', 1)
    return psycopg.connect(dsn, row_factory=dict_row)


def user(request: Request):
    if request.client is None or request.client.host != '127.0.0.1':
        raise HTTPException(401, 'Acesso somente pelo Unificado.')
    secret = os.getenv('LAB_GATEWAY_SIGNING_KEY', '')
    assertion = request.headers.get('x-lab-assertion', '')
    if len(secret) < 32 or assertion.count('.') != 1 or len(assertion) > 2048:
        raise HTTPException(401, 'Sessão inválida.')
    try:
        encoded, signature = assertion.split('.', 1)
        expected = base64.urlsafe_b64encode(hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
        if not hmac.compare_digest(expected, signature):
            raise ValueError('assinatura')
        payload = json.loads(base64.urlsafe_b64decode(encoded + '=' * (-len(encoded) % 4)))
        if (not isinstance(payload.get('id'), str) or not isinstance(payload.get('name'), str)
            or payload.get('role') not in ('tecnico', 'engenheiro', 'admin')
            or not isinstance(payload.get('exp'), int)
            or not 0 <= payload['exp'] - int(datetime.now(timezone.utc).timestamp()) <= 30):
            raise ValueError('payload')
        return {'id': payload['id'], 'name': payload['name'].strip(), 'role': payload['role']}
    except (ValueError, TypeError, KeyError):
        raise HTTPException(401, 'Sessão inválida.')


def mutating(request: Request, actor=Depends(user)):
    origin = request.headers.get('origin')
    if origin and origin != os.getenv('CQ_ALLOWED_ORIGIN', VERIFY):
        raise HTTPException(403, 'Origem não autorizada.')
    return actor


class Item(BaseModel):
    modelo: str
    altura_m: float | None = Field(default=None,ge=0)
    carga_dan: float | None = Field(default=None,ge=0)
    peso_kg: float | None = Field(default=None,ge=0)
    quantidade: int = Field(ge=1, le=10000)
    data_producao: date


class Draft(BaseModel):
    cliente: str = Field(min_length=1, max_length=200)
    endereco: str = Field(default='', max_length=300)
    nota_fiscal: str = Field(default='', max_length=100)
    data_emissao: date = Field(default_factory=date.today)
    resp_laboratorio: str
    observacoes: str = Field(default='', max_length=2000)
    prensa_id: int | None = None
    itens: list[Item]


class Press(BaseModel):
    fabricante: str
    modelo: str
    serie: str
    patrimonio: str = ''
    capacidade_kn: float | None = None
    classe: str = ''
    certificado_calibracao: str
    laboratorio_rbc: str
    data_calibracao: date
    validade: date
    ativa: bool = True


class Model(BaseModel):
    modelo: str
    altura_m: float | None = None
    carga_dan: float | None = None
    peso_kg: float | None = None
    ativo: bool = True


def source_days(days: list[str], fck: float):
    if not days:
        return []
    try:
        return summarize_days(days, fck)
    except (HTTPError, URLError, TimeoutError, ValueError, TypeError) as exc:
        raise HTTPException(503, 'Fonte de CPs indisponível. Emissão bloqueada.') from exc


def calibrator_recorded(value):
    name = str(value or '').strip().casefold()
    return bool(name) and not name.startswith(('não informado', 'nao informado'))


def _row(row):
    return json.loads(json.dumps(row, default=str))


def _load(cur, cert_id: int):
    cert = cur.execute('SELECT * FROM cq_certificados WHERE id=%s', (cert_id,)).fetchone()
    if not cert:
        raise HTTPException(404, 'Certificado não encontrado.')
    items = cur.execute('SELECT * FROM cq_itens WHERE certificado_id=%s ORDER BY id', (cert_id,)).fetchall()
    results = cur.execute('SELECT * FROM cq_resultados_data WHERE certificado_id=%s ORDER BY data_producao', (cert_id,)).fetchall()
    return cert, items, results


@app.get('/')
def home(_: dict = Depends(user)):
    return FileResponse(HERE / 'static' / 'index.html', media_type='text/html', headers={'Cache-Control':'no-store'})


@app.get('/app.css')
def css(_: dict = Depends(user)):
    return FileResponse(HERE / 'static' / 'app.css', media_type='text/css')


@app.get('/app.js')
def js(_: dict = Depends(user)):
    return FileResponse(HERE / 'static' / 'app.js', media_type='application/javascript')


@app.get('/api/config')
def config(actor: dict = Depends(user)):
    with db() as conn:
        with conn.cursor() as cur:
            params = cur.execute('SELECT * FROM cq_parametros WHERE id=1').fetchone()
            models = cur.execute('SELECT * FROM cq_modelos_poste WHERE ativo ORDER BY modelo').fetchall()
            presses = cur.execute('SELECT * FROM cq_prensas WHERE ativa ORDER BY fabricante,modelo').fetchall()
    return _row({'params':params,'models':models,'presses':presses,
                 'responsaveis_laboratorio':RESPONSAVEIS_LABORATORIO,'user':actor,
                 'can_correct':actor['id'] in CORRECTORS,
                 'fonte_cp':selected_source(),
                 'validation_notice':os.getenv('CQ_VALIDATION_NOTICE','')})


@app.post('/api/resultados')
def results(body: Draft, _: dict = Depends(mutating)):
    if body.resp_laboratorio not in RESPONSAVEIS_LABORATORIO:
        raise HTTPException(422, 'Responsável inválido.')
    days = validate_items([item.model_dump(mode='json') for item in body.itens])
    with db() as conn:
        with conn.cursor() as cur:
            fck = float(cur.execute('SELECT fck_mpa FROM cq_parametros WHERE id=1').fetchone()['fck_mpa'])
    return {'rows':source_days(days,fck),'fck_mpa':fck}


def _save_items(cur, cert_id, items):
    cur.execute('DELETE FROM cq_itens WHERE certificado_id=%s', (cert_id,))
    for item in items:
        d=item.model_dump()
        day=d['data_producao']
        cur.execute('''INSERT INTO cq_itens(certificado_id,modelo,altura_m,carga_dan,peso_kg,quantidade,data_producao,lote)
          VALUES (%s,%s,%s,%s,%s,%s,%s,%s)''',
          (cert_id,d['modelo'].strip(),d['altura_m'],d['carga_dan'],d['peso_kg'],d['quantidade'],day,'L'+day.strftime('%Y%m%d')))


def _check_models(cur, items):
    chosen={item.modelo.strip() for item in items}
    existing={row['modelo'] for row in cur.execute('SELECT modelo FROM cq_modelos_poste WHERE ativo').fetchall()}
    if not chosen <= existing:
        raise HTTPException(422,'Selecione modelos ativos do cadastro de postes.')


@app.post('/api/certificados')
def create_draft(body: Draft, actor: dict = Depends(mutating)):
    validate_items([item.model_dump(mode='json') for item in body.itens])
    if body.resp_laboratorio not in RESPONSAVEIS_LABORATORIO:
        raise HTTPException(422, 'Responsável inválido.')
    with db() as conn:
        with conn.cursor() as cur:
            params=cur.execute('SELECT * FROM cq_parametros WHERE id=1').fetchone()
            _check_models(cur,body.itens)
            row=cur.execute('''INSERT INTO cq_certificados(status,cliente,endereco,nota_fiscal,data_emissao,resp_laboratorio,
              observacoes,fck_mpa,criado_por) VALUES ('rascunho',%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id''',
              (body.cliente.strip(),body.endereco,body.nota_fiscal,body.data_emissao,body.resp_laboratorio,
               body.observacoes or params['observacoes'],params['fck_mpa'],actor['id'])).fetchone()
            _save_items(cur,row['id'],body.itens)
            if body.prensa_id:
                press=cur.execute('SELECT * FROM cq_prensas WHERE id=%s AND ativa', (body.prensa_id,)).fetchone()
                if not press: raise HTTPException(422,'Prensa não encontrada.')
                cur.execute('UPDATE cq_certificados SET prensa_snapshot=%s WHERE id=%s',(json.dumps(_row(press)),row['id']))
    return {'id':row['id'],'status':'rascunho'}


@app.put('/api/certificados/{cert_id}')
def update_draft(cert_id:int, body:Draft, actor:dict=Depends(mutating)):
    validate_items([item.model_dump(mode='json') for item in body.itens])
    if body.resp_laboratorio not in RESPONSAVEIS_LABORATORIO:
        raise HTTPException(422,'Responsável inválido.')
    with db() as conn:
        with conn.cursor() as cur:
            cert=cur.execute('SELECT * FROM cq_certificados WHERE id=%s FOR UPDATE',(cert_id,)).fetchone()
            if not cert or cert['status']!='rascunho': raise HTTPException(409,'Este certificado não é um rascunho.')
            if cert['anterior_id'] and actor['id'] not in CORRECTORS:
                raise HTTPException(403,'Correção restrita aos responsáveis autorizados.')
            _check_models(cur,body.itens)
            press=None
            if body.prensa_id:
                press=cur.execute('SELECT * FROM cq_prensas WHERE id=%s AND ativa',(body.prensa_id,)).fetchone()
                if not press: raise HTTPException(422,'Prensa não encontrada.')
            cur.execute('''UPDATE cq_certificados SET cliente=%s,endereco=%s,nota_fiscal=%s,data_emissao=%s,
              resp_laboratorio=%s,observacoes=%s,prensa_snapshot=%s WHERE id=%s''',
              (body.cliente.strip(),body.endereco,body.nota_fiscal,body.data_emissao,body.resp_laboratorio,
               body.observacoes,json.dumps(_row(press)) if press else None,cert_id))
            _save_items(cur,cert_id,body.itens)
            cur.execute('DELETE FROM cq_resultados_data WHERE certificado_id=%s',(cert_id,))
    return {'id':cert_id,'status':'rascunho'}


@app.get('/api/certificados')
def history(q: str='', actor: dict=Depends(user)):
    with db() as conn:
        with conn.cursor() as cur:
            rows=cur.execute('''SELECT id,numero,revisao,status,cliente,data_emissao,criado_em,origem FROM cq_certificados
             WHERE (%s='' OR cliente ILIKE %s OR numero ILIKE %s) ORDER BY criado_em DESC,id DESC LIMIT 200''',
             (q,'%'+q+'%','%'+q+'%')).fetchall()
    return _row(rows)


@app.get('/api/certificados/{cert_id}')
def detail(cert_id:int, actor:dict=Depends(user)):
    with db() as conn:
        with conn.cursor() as cur: cert,items,results=_load(cur,cert_id)
    output={'certificado':cert,'itens':items,'resultados':results}
    if cert['status']=='rascunho':
        days=sorted({str(item['data_producao']) for item in items})
        output['resultados_atuais']=source_days(days,float(cert['fck_mpa']))
    return _row(output)


@app.post('/api/certificados/{cert_id}/emitir')
def issue(cert_id:int, actor:dict=Depends(mutating)):
    with db() as conn:
        with conn.cursor() as cur:
            cert,items,_=_load(cur,cert_id)
    if cert['status']!='rascunho': raise HTTPException(409,'Somente rascunho pode ser emitido.')
    if not cert['prensa_snapshot']: raise HTTPException(422,'Cadastre e selecione uma prensa.')
    with db() as conn:
        with conn.cursor() as cur:
            selected=cur.execute('SELECT * FROM cq_prensas WHERE id=%s AND ativa',
                                 (cert['prensa_snapshot'].get('id'),)).fetchone()
    if not selected: raise HTTPException(422,'Prensa indisponível; selecione outra.')
    press=_row(selected)
    if not calibrator_recorded(press.get('laboratorio_rbc')):
        raise HTTPException(422,'Complete o laboratório calibrador no cadastro da prensa antes de emitir.')
    if date.fromisoformat(str(press['validade'])[:10]) < date.today():
        raise HTTPException(422,'Calibração vencida; emissão bloqueada.')
    days=sorted({str(item['data_producao']) for item in items})
    rows=source_days(days,float(cert['fck_mpa']))
    if not can_issue(rows): raise HTTPException(422,'Há datas pendentes, não conformes ou sem resultado. Emissão bloqueada.')
    if not Path(SIGNATURE).is_file(): raise HTTPException(503,'Assinatura do engenheiro indisponível.')
    with db() as conn:
        with conn.cursor() as cur:
            current=cur.execute('SELECT * FROM cq_certificados WHERE id=%s FOR UPDATE',(cert_id,)).fetchone()
            if current['status']!='rascunho': raise HTTPException(409,'Certificado já emitido.')
            locked_items=cur.execute('SELECT modelo,altura_m,carga_dan,peso_kg,quantidade,data_producao FROM cq_itens WHERE certificado_id=%s ORDER BY id',(cert_id,)).fetchall()
            original_items=[{key:item[key] for key in ('modelo','altura_m','carga_dan','peso_kg','quantidade','data_producao')} for item in items]
            if locked_items!=original_items:
                raise HTTPException(409,'Rascunho alterado durante a consulta; atualize os resultados.')
            if current['anterior_id'] and actor['id'] not in CORRECTORS:
                raise HTTPException(403,'Correção restrita aos responsáveis autorizados.')
            if current['numero']:
                number=current['numero']
            else:
                year=date.today().year
                nextrow=cur.execute('''INSERT INTO cq_sequencias(ano,ultimo) VALUES (%s,1)
                 ON CONFLICT (ano) DO UPDATE SET ultimo=cq_sequencias.ultimo+1 RETURNING ultimo''',(year,)).fetchone()
                number=f"CQ-{year}-{nextrow['ultimo']:04d}"
            current['numero']=number
            current['prensa_snapshot']=press
            issued_at=datetime.now(timezone.utc)
            current['emitido_em']=issued_at
            current['emitido_por_nome']=actor['name']
            pdf=make_pdf(current,items,rows,issued=True,signature_path=SIGNATURE,logo_path=LOGO,verify_base=VERIFY)
            digest=hashlib.sha256(pdf).hexdigest()
            folder=DATA/'pdf'; folder.mkdir(parents=True,exist_ok=True,mode=0o700)
            path=folder/f'{cert_id}-{number}-r{current["revisao"]}.pdf'
            temp=path.with_suffix('.tmp')
            temp.write_bytes(pdf); temp.chmod(0o600); temp.replace(path)
            cur.execute('''UPDATE cq_certificados SET numero=%s,status='emitido',prensa_snapshot=%s,pdf_path=%s,pdf_hash=%s,
              emitido_por=%s,emitido_em=%s WHERE id=%s''',(number,json.dumps(press),str(path),digest,actor['id'],issued_at,cert_id))
            if current['anterior_id']:
                cur.execute("UPDATE cq_certificados SET status='substituido' WHERE id=%s AND status='emitido'",(current['anterior_id'],))
            for row in rows:
                cur.execute('''INSERT INTO cq_resultados_data(certificado_id,data_producao,traco,n_cps,r3_media,r7_media,r28_media,r28_min,resultado,data_prevista)
                 VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)''',(cert_id,row['data_producao'],row.get('traco'),row.get('n_cps'),row.get('r3_media'),row.get('r7_media'),row.get('r28_media'),row.get('r28_min'),row['resultado'],row.get('data_prevista')))
    return {'id':cert_id,'numero':number,'pdf_hash':digest}


@app.post('/api/certificados/{cert_id}/revisar')
def revise(cert_id:int, actor:dict=Depends(mutating)):
    if actor['id'] not in CORRECTORS: raise HTTPException(403,'Correção restrita aos responsáveis autorizados.')
    with db() as conn:
        with conn.cursor() as cur:
            cert=cur.execute('SELECT * FROM cq_certificados WHERE id=%s FOR UPDATE',(cert_id,)).fetchone()
            if not cert: raise HTTPException(404,'Certificado não encontrado.')
            items=cur.execute('SELECT * FROM cq_itens WHERE certificado_id=%s ORDER BY id',(cert_id,)).fetchall()
            if cert['status']!='emitido': raise HTTPException(409,'Somente certificado emitido pode ser revisado.')
            if cur.execute('SELECT 1 FROM cq_certificados WHERE anterior_id=%s',(cert_id,)).fetchone():
                raise HTTPException(409,'Já existe uma revisão para este certificado.')
            row=cur.execute('''INSERT INTO cq_certificados(numero,revisao,status,cliente,endereco,nota_fiscal,data_emissao,
              resp_laboratorio,observacoes,fck_mpa,prensa_snapshot,criado_por,anterior_id)
              VALUES (%s,%s,'rascunho',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id''',
              (cert['numero'],cert['revisao']+1,cert['cliente'],cert['endereco'],cert['nota_fiscal'],
               cert['data_emissao'],cert['resp_laboratorio'],cert['observacoes'],cert['fck_mpa'],
               json.dumps(_row(cert['prensa_snapshot'])),actor['id'],cert_id)).fetchone()
            for item in items:
                cur.execute('''INSERT INTO cq_itens(certificado_id,modelo,altura_m,carga_dan,peso_kg,quantidade,data_producao,lote)
                  VALUES (%s,%s,%s,%s,%s,%s,%s,%s)''',
                  (row['id'],item['modelo'],item['altura_m'],item['carga_dan'],item['peso_kg'],item['quantidade'],item['data_producao'],item['lote']))
    return {'id':row['id'],'revisao':cert['revisao']+1}


@app.get('/api/certificados/{cert_id}/pdf')
def pdf(cert_id:int, actor:dict=Depends(user)):
    with db() as conn:
        with conn.cursor() as cur: cert,items,results=_load(cur,cert_id)
    if cert['status'] in ('emitido','substituido'):
        path=Path(cert['pdf_path'] or '')
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=cert['pdf_hash']:
            raise HTTPException(503,'PDF indisponível ou com integridade inválida.')
        return FileResponse(path,media_type='application/pdf',filename=f'{cert["numero"]}-r{cert["revisao"]}.pdf')
    if cert['status']=='legado': raise HTTPException(404,'PDF legado não armazenado.')
    days=sorted({str(item['data_producao']) for item in items})
    rows=source_days(days,float(cert['fck_mpa']))
    return Response(make_pdf(cert,items,rows,issued=False,logo_path=LOGO,verify_base=VERIFY),media_type='application/pdf')


@app.post('/api/prensas')
def add_press(body:Press, actor:dict=Depends(mutating)):
    _check_press(body)
    with db() as conn:
        with conn.cursor() as cur:
            row=cur.execute('''INSERT INTO cq_prensas(fabricante,modelo,serie,patrimonio,capacidade_kn,classe,
              certificado_calibracao,laboratorio_rbc,data_calibracao,validade,ativa)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id''',tuple(body.model_dump().values())).fetchone()
    return row


def _check_press(body:Press):
    if not all(value.strip() for value in (body.fabricante, body.modelo, body.serie,
                                           body.certificado_calibracao, body.laboratorio_rbc)):
        raise HTTPException(422,'Preencha a identificação, o certificado de calibração e o laboratório RBC.')
    if body.validade < body.data_calibracao:
        raise HTTPException(422,'A validade não pode ser anterior à data da calibração.')


@app.put('/api/prensas/{press_id}')
def update_press(press_id:int, body:Press, actor:dict=Depends(mutating)):
    _check_press(body)
    with db() as conn:
        with conn.cursor() as cur:
            row=cur.execute('''UPDATE cq_prensas SET fabricante=%s,modelo=%s,serie=%s,
              patrimonio=%s,capacidade_kn=%s,classe=%s,certificado_calibracao=%s,
              laboratorio_rbc=%s,data_calibracao=%s,validade=%s,ativa=%s
              WHERE id=%s RETURNING id''',tuple(body.model_dump().values())+(press_id,)).fetchone()
    if not row: raise HTTPException(404,'Prensa não encontrada.')
    return row


@app.post('/api/prensas/{press_id}/calibracao')
async def upload_calibration(press_id:int, file:UploadFile=File(...), actor:dict=Depends(mutating)):
    if file.content_type != 'application/pdf': raise HTTPException(422,'Envie um PDF.')
    data=await file.read(8*1024*1024+1)
    if not data.startswith(b'%PDF-') or len(data)>8*1024*1024:
        raise HTTPException(422,'PDF inválido ou maior que 8 MB.')
    with db() as conn:
        with conn.cursor() as cur:
            if not cur.execute('SELECT 1 FROM cq_prensas WHERE id=%s',(press_id,)).fetchone():
                raise HTTPException(404,'Prensa não encontrada.')
            directory=DATA/'calibracoes';directory.mkdir(parents=True,exist_ok=True,mode=0o700)
            digest=hashlib.sha256(data).hexdigest()
            path=directory/f'{press_id}-{digest}.pdf';path.write_bytes(data);path.chmod(0o600)
            cur.execute('UPDATE cq_prensas SET arquivo_certificado=%s WHERE id=%s',(str(path),press_id))
    return {'sha256':digest}


@app.get('/api/prensas/{press_id}/calibracao')
def download_calibration(press_id:int, actor:dict=Depends(user)):
    with db() as conn:
        with conn.cursor() as cur:
            row=cur.execute('SELECT arquivo_certificado FROM cq_prensas WHERE id=%s',(press_id,)).fetchone()
    if not row or not row['arquivo_certificado']:raise HTTPException(404,'Calibração não cadastrada.')
    path=Path(row['arquivo_certificado'])
    if not path.is_file() or DATA not in path.parents:raise HTTPException(503,'Arquivo indisponível.')
    return FileResponse(path,media_type='application/pdf',filename=f'calibracao-prensa-{press_id}.pdf')


@app.post('/api/modelos')
def add_model(body:Model, actor:dict=Depends(mutating)):
    with db() as conn:
        with conn.cursor() as cur:
            row=cur.execute('''INSERT INTO cq_modelos_poste(modelo,altura_m,carga_dan,peso_kg,ativo)
             VALUES (%s,%s,%s,%s,%s) ON CONFLICT(modelo) DO UPDATE SET altura_m=EXCLUDED.altura_m,
             carga_dan=EXCLUDED.carga_dan,peso_kg=EXCLUDED.peso_kg,ativo=EXCLUDED.ativo RETURNING id''',tuple(body.model_dump().values())).fetchone()
    return row


@app.post('/api/parametros')
def update_params(fck_mpa:float, observacoes:str='',
                  resp_laboratorio_padrao:str|None=None, actor:dict=Depends(mutating)):
    if actor['id'] not in CORRECTORS: raise HTTPException(403,'Parâmetros restritos aos responsáveis autorizados.')
    if not 1 <= fck_mpa <= 200: raise HTTPException(422,'fck inválido.')
    if resp_laboratorio_padrao is not None and resp_laboratorio_padrao not in RESPONSAVEIS_LABORATORIO:
        raise HTTPException(422,'Responsável pelo laboratório inválido.')
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('''UPDATE cq_parametros SET fck_mpa=%s,observacoes=%s,
              resp_laboratorio_padrao=COALESCE(%s,resp_laboratorio_padrao),updated_at=now()
              WHERE id=1''',(fck_mpa,observacoes,resp_laboratorio_padrao))
    return {'ok':True}


@app.get('/health')
def health():
    try:
        with db() as conn:
            with conn.cursor() as cur: cur.execute('SELECT 1 FROM cq_parametros WHERE id=1').fetchone()
        return {'ok':True}
    except Exception:
        raise HTTPException(503,'Banco indisponível.')


@app.get('/v/{number}')
def verify_soon(number:str):
    if not re.fullmatch(r'CQ-[A-Z0-9-]{4,40}',number): raise HTTPException(404)
    return HTMLResponse('<!doctype html><html lang="pt-br"><meta charset="utf-8"><title>Certificado</title><body>Verificação pública em breve.</body></html>')
