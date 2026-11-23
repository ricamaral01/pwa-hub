"""Compare central profiles and grants with the pre-parity homolog dumps."""
import json, re, shlex, subprocess
from pathlib import Path
from urllib.parse import urlsplit
import psycopg
S=Path('/opt/concrefer-unificado/homolog-next/staging/visual-completo')
B=Path(json.loads((S/'backup-ready.json').read_text())['backup'])
E=Path('/etc/concrefer-unificado/homolog')
results=[]
for name,variable,old_db in [('mapa','MAPA_AUTH_DATABASE_URL','mapa_unificado_homolog_20261016'),
                              ('pcp','DATABASE_URL','pcp_unificado_homolog_20261016')]:
    values={}
    for line in (E/('visual-'+name+'.env')).read_text().splitlines():
        parts=shlex.split(line)
        if len(parts)==1 and '=' in parts[0]:
            k,v=parts[0].split('=',1)
            values[k]=v
    dsn=values[variable]
    parsed=urlsplit(dsn)
    assert parsed.hostname in ('localhost','127.0.0.1') and parsed.path=='/'+name+'_visual_homolog_20261118'
    tables=[('public','usuarios')]
    if name=='mapa':tables += [('unificado_auth',t) for t in ('user_screen_permissions','user_action_permissions','identity_links')]
    with psycopg.connect(dsn) as db:
        db.execute('SET TRANSACTION READ ONLY')
        for schema,table in tables:
            raw=subprocess.check_output(['pg_restore','--data-only','-n',schema,'-t',table,'-f','-',str(B/(old_db+'.dump'))]).decode()
            match=re.search(r'^COPY [^\n]+? \(([^\n]+)\) FROM stdin;\n(.*?)\n\\\.',raw,re.M|re.S)
            assert match,table
            cols=[c.strip().strip('"') for c in match[1].split(',')]
            fields=cols if table!='usuarios' else [c for c in cols if c in ('id','username','perfil','nivel_acesso','ativo','setor','setor_id','unidade','deleted_at')]
            expected=sorted(tuple(row.split('\t')[cols.index(c)] for c in fields) for row in match[2].splitlines() if row)
            query='COPY (SELECT '+','.join('"'+c+'"' for c in fields)+' FROM '+schema+'.'+table+') TO STDOUT'
            with db.cursor().copy(query) as stream:
                body=b''.join(bytes(part) for part in stream).decode()
            current=sorted(tuple(row.split('\t')) for row in body.splitlines() if row)
            assert expected==current,(name,table,'Profile/grant differs from the original dump')
            results.append({'database':parsed.path[1:],'table':schema+'.'+table,'rows':len(current),'unchanged':True})
out={'status':'ok','checks':results,'production_database_connections':0,'permission_writes':0}
(S/'phase7-iam-audit.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out))
