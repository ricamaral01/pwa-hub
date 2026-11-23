"""Align empty Noro test analytics with serial keys used by published code."""
import json, subprocess
from pathlib import Path
DB='cec_noroeste_visual_homolog_20261118'
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
def sql(body):
    return subprocess.check_output(['sudo','-u','postgres','psql','-XAt','-v','ON_ERROR_STOP=1','-d',DB],input=body,text=True)
dump=B/(DB+'-before-serial-keys.dump')
if not dump.exists():
    with dump.open('wb') as out:
        subprocess.run(['sudo','-u','postgres','pg_dump','-Fc',DB],stdout=out,check=True)
    dump.chmod(0o600)
tables={'rompimentos_atuais':['data_moldagem','traco_id','numero_serie','idade_dias','cp'],
        'rompimentos_grupos':['data_moldagem','traco_id','numero_serie','idade_dias'],
        'fila_recalculo':['data_moldagem','traco_id','numero_serie','idade_dias']}
changes=[]
for table,cols in tables.items():
    if sql(f"SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='{table}' AND column_name='numero_serie';").strip()=='1':continue
    assert sql(f'SELECT count(*) FROM public.{table};').strip()=='0', 'Do not transform existing readings'
    # The published repositories already use exactly these conflict targets.
    old=[c for c in cols if c!='numero_serie']
    constraints=json.loads(sql(f"SELECT coalesce(json_agg(json_build_object('name',conname,'columns',(SELECT json_agg(a.attname ORDER BY u.n) FROM unnest(conkey) WITH ORDINALITY u(k,n) JOIN pg_attribute a ON a.attrelid=conrelid AND a.attnum=u.k))),'[]') FROM pg_constraint WHERE conrelid='public.{table}'::regclass AND contype='u';"))
    body=f'BEGIN; ALTER TABLE public.{table} ADD COLUMN numero_serie text NOT NULL DEFAULT \'\';\n'
    for constraint in constraints:
        if set(constraint['columns'])==set(old):
            name=constraint['name'].replace('"','""')
            body+=f'ALTER TABLE public.{table} DROP CONSTRAINT "{name}";\n'
    body+=f'CREATE UNIQUE INDEX visual_noro_{table}_serial_key ON public.{table} ({",".join(cols)}); COMMIT;'
    sql(body)
    changes.append({'table':table,'serial_type':'text NOT NULL DEFAULT empty','conflict_key':cols,'existing_rows':0})
result={'database':DB,'backup':str(dump),'aligned_with':'published cec-noroeste/src/repositories and analytics_service.js',
        'changes':changes,'production_database_connections':0,'application_permissions_changed':False}
(S/'phase7-noro-schema.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
