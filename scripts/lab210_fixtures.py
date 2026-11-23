"""Explicit, removable TESTE-LAB fixtures; exact H database, no real account creation."""
import argparse,datetime,json,subprocess
from zoneinfo import ZoneInfo
from lab210_migration import EXPECTED_DATABASE,SCHEMAS
from lab210_snapshot import destination_connection,verify_backup
MARKERS={'pederneiras':('TESTE-LAB-PEDE',9002100001),'ribeirao':('TESTE-LAB-RIB',9002100002)}


def apply(backup_receipt):
    verify_backup(backup_receipt);report=[]
    with destination_connection() as c:
        assert c.execute('SELECT current_database()').fetchone()[0]==EXPECTED_DATABASE
        for unit,(marker,identity) in MARKERS.items():
            schema=SCHEMAS[unit]
            reference=c.execute(f'SELECT id,formula FROM {schema}.massadas WHERE test_marker IS NULL ORDER BY data DESC,id DESC LIMIT 1').fetchone()
            if not reference:raise RuntimeError('Não há fórmula de origem para a unidade '+unit+'; confirmar cadastro antes de criar o teste')
            date=datetime.datetime.now(ZoneInfo('America/Sao_Paulo')).date()-datetime.timedelta(days=1)
            source={'kind':'synthetic-homolog-fixture','marker':marker,'formula_reference_massada_id':reference[0],'release':'2.1.0','qtd':0.25}
            c.execute(f'''INSERT INTO {schema}.massadas
              (id,produto,formula,data,hora,numero_serie,source_database,source_payload,test_marker)
              VALUES(%s,%s,%s,%s,'10:00',%s,'synthetic-homolog',%s::jsonb,%s)
              ON CONFLICT(id) DO NOTHING''',[identity,marker,reference[1],date,marker+'-001',json.dumps(source),marker])
            report.append({'unit':unit,'id':identity,'marker':marker,'series':marker+'-001','molded_at':date.isoformat(),'formula_source_id':reference[0]})
    return report


def cleanup_sql():
    sql="BEGIN; DO $$ BEGIN IF current_database() <> '"+EXPECTED_DATABASE+"' THEN RAISE EXCEPTION 'Destino deve ser Laboratório H'; END IF; END $$;\n"
    for unit,(marker,identity) in MARKERS.items():
        schema=SCHEMAS[unit];pattern=marker+'-%'
        # All identifiers and literals here are fixed release constants.
        sql+=f"DELETE FROM {schema}.rompimentos_eventos WHERE rompimento_id IN (SELECT id FROM {schema}.rompimentos WHERE numero_serie LIKE '{pattern}');\n"
        sql+=f"DELETE FROM {schema}.rompimentos WHERE numero_serie LIKE '{pattern}';\n"
        sql+=f"DELETE FROM public.laboratorio_cp_moldagem WHERE unidade_codigo='{unit}' AND numero_serie LIKE '{pattern}';\n"
        sql+=f"DELETE FROM {schema}.massadas WHERE id={identity} AND test_marker='{marker}';\n"
    return sql+'COMMIT;\n'


def cleanup(perform=False,backup_receipt=None):
    report=[]
    with destination_connection() as c:
        assert c.execute('SELECT current_database()').fetchone()[0]==EXPECTED_DATABASE
        for unit,(marker,identity) in MARKERS.items():
            schema=SCHEMAS[unit];pattern=marker+'-%'
            count=c.execute(f'SELECT count(*) FROM {schema}.rompimentos WHERE numero_serie LIKE %s',[pattern]).fetchone()[0]
            report.append({'unit':unit,'fixture_readings':count,'marker':marker,'performed':perform})
    if perform:
        if not backup_receipt:raise RuntimeError('Backup H obrigatório para remover fixtures')
        verify_backup(backup_receipt)
        # The runtime role deliberately has no DELETE privilege on history.
        # Cleanup is an explicit admin operation, restricted to fixed markers.
        subprocess.run(['sudo','-u','postgres','env','PGAPPNAME=lab210_cleanup_homolog',
                        'psql','-X','-v','ON_ERROR_STOP=1','-d',EXPECTED_DATABASE],
                       input=cleanup_sql(),text=True,capture_output=True,check=True)
    return report


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--create',action='store_true');p.add_argument('--backup-receipt');p.add_argument('--cleanup',action='store_true');p.add_argument('--apply-cleanup',action='store_true');a=p.parse_args()
    if a.create:
        if not a.backup_receipt:raise SystemExit('Backup H obrigatório')
        print(json.dumps(apply(a.backup_receipt),ensure_ascii=False))
    elif a.cleanup:print(json.dumps(cleanup(a.apply_cleanup,a.backup_receipt),ensure_ascii=False))
    else:raise SystemExit('Escolha --create ou --cleanup (apenas contagem por padrão)')
