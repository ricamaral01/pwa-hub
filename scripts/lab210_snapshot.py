"""Read-only ERP snapshot -> H-only CEC schemas. No ERP write or persistent pool.

Import apply is explicit and requires a verified H backup receipt. This helper
does not create accounts, grants or sessions and does not activate the feature.
"""
import argparse,datetime,hashlib,json,os,subprocess
from decimal import Decimal,InvalidOperation
from pathlib import Path
from lab210_migration import EXPECTED_DATABASE,SCHEMAS

SOURCES={'pederneiras':'supervisorio_db_pede','ribeirao':'supervisorio_db_ribe'}


def normalize(row):
    required=['id','produto','formula','data','numero_serie']
    if any(row.get(key) is None or str(row[key]).strip()=='' for key in required):
        raise ValueError('campo obrigatório ausente: não fabricar produto, fórmula, data ou série')
    series=row['numero_serie']
    if isinstance(series,(int,float,Decimal)):
        number=Decimal(str(series))
        series=str(int(number)) if number==number.to_integral_value() else format(number,'f')
    series=str(series).strip();formula=str(row['formula']).strip()
    if len(series)>100 or len(formula)>100:raise ValueError('série/traço acima do contrato100')
    date=datetime.date.fromisoformat(str(row['data'])[:10])
    return {'id':int(row['id']),'produto':str(row['produto']),'formula':formula,
            'data':date.isoformat(),'hora':row.get('hora'),'numero_serie':series,'raw':row}


def extract():
    snapshots={}
    query="""BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout='10s';
SELECT json_build_object('database',current_database(),'captured_at',clock_timestamp(),
 'rows',(SELECT coalesce(json_agg(t ORDER BY id),'[]') FROM
  (SELECT * FROM public.tbl_massadas)t));
ROLLBACK;"""
    for unit,database in SOURCES.items():
        p=subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_snapshot_readonly',
            'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-d',database],input=query,text=True,capture_output=True,check=True)
        snapshots[unit]=json.loads(p.stdout)
    return snapshots


def verify_backup(receipt):
    path=Path(receipt).resolve()
    if not path.is_relative_to(Path('/opt/concrefer-unificado/backups')):
        raise RuntimeError('Backup deve estar fora do repositório, no diretório de backups da VPS')
    data=json.loads(path.read_text())
    if data.get('database')!=EXPECTED_DATABASE:raise RuntimeError('Backup não é do Laboratório H')
    dump=Path(data['dump']).resolve()
    if not dump.is_relative_to(path.parent) or not dump.is_file():raise RuntimeError('Dump não encontrado no backup H')
    with dump.open('rb') as fp:actual=hashlib.file_digest(fp,'sha256').hexdigest()
    if actual!=data['sha256']:raise RuntimeError('Hash do backup difere')
    subprocess.run(['pg_restore','-l',str(dump)],check=True,stdout=subprocess.DEVNULL)
    return data


def destination_connection():
    """Reuse the protected H Lab DSN; never print or export its credential."""
    import psycopg
    from urllib.parse import urlsplit
    pid=int(subprocess.check_output(['systemctl','show','unificado-visual-homolog-laboratorio.service','-p','MainPID','--value'],text=True))
    env=dict(v.decode().split('=',1) for v in Path('/proc/'+str(pid)+'/environ').read_bytes().split(b'\0') if b'=' in v)
    dsn=env['DATABASE_URL'].replace('postgresql+psycopg://','postgresql://').replace('postgresql+psycopg2://','postgresql://');url=urlsplit(dsn)
    if url.hostname not in ['127.0.0.1','localhost'] or url.path!='/'+EXPECTED_DATABASE:
        raise RuntimeError('Destino não é o banco exato da homologação')
    return psycopg.connect(dsn,application_name='lab210_seed_homolog')


def apply_homolog(snapshots,backup_receipt):
    verify_backup(backup_receipt)
    report=[]
    # Existing protected H DSN; the destination guard is checked inside the
    # transaction before any write. No role-wide/global settings.
    with destination_connection() as conn:
        assert conn.execute('SELECT current_database()').fetchone()[0]==EXPECTED_DATABASE
        for unit,snapshot in snapshots.items():
            schema=SCHEMAS[unit];assert snapshot['database']==SOURCES[unit];written=0;rejected=[]
            for raw in snapshot['rows']:
                try:row=normalize(raw)
                except (ValueError,TypeError,InvalidOperation) as error:
                    rejected.append({'source_id':raw.get('id'),'reason':str(error),'raw':raw});continue
                cursor=conn.execute(f'''INSERT INTO {schema}.massadas
                 (id,produto,formula,data,hora,numero_serie,source_database,source_payload)
                 VALUES (%s,%s,%s,%s,%s,%s,%s,%s::jsonb)
                 ON CONFLICT(id) DO UPDATE SET produto=excluded.produto,formula=excluded.formula,
                   data=excluded.data,hora=excluded.hora,numero_serie=excluded.numero_serie,
                   source_payload=excluded.source_payload,imported_at=now()
                 WHERE {schema}.massadas.test_marker IS NULL''',
                 [row['id'],row['produto'],row['formula'],row['data'],row['hora'],row['numero_serie'],snapshot['database'],json.dumps(raw,ensure_ascii=False)])
                written+=cursor.rowcount
            report.append({'unit':unit,'source_database':snapshot['database'],'source_captured_at':snapshot['captured_at'],
                           'source_count':len(snapshot['rows']),'imported_count':written,'rejected':rejected})
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--snapshot-file',required=True);parser.add_argument('--extract',action='store_true');parser.add_argument('--apply-homolog',action='store_true');parser.add_argument('--backup-receipt');args=parser.parse_args()
    path=Path(args.snapshot_file)
    if args.extract:
        if path.exists():raise SystemExit('Não sobrescrever snapshot existente')
        path.write_text(json.dumps(extract(),ensure_ascii=False,indent=2),encoding='utf-8');path.chmod(0o600)
    if args.apply_homolog:
        if not args.backup_receipt:raise SystemExit('Backup H verificado obrigatório antes de importar')
        report=apply_homolog(json.loads(path.read_text(encoding='utf-8')),args.backup_receipt)
        target=path.with_name('snapshot-import-report.json');target.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');target.chmod(0o600)
        print(json.dumps([dict(unit=r['unit'],source_count=r['source_count'],imported_count=r['imported_count'],rejected_count=len(r['rejected'])) for r in report]))
