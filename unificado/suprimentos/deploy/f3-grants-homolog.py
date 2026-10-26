"""Concessão S3B em homologação; snapshot e rollback por usuário/tela."""
import json,os,sys
from pathlib import Path
import psycopg
from psycopg.rows import dict_row
sys.path.insert(0,'/opt/concrefer-unificado/homolog-next/mapa-api')
from screen_access import MASTER_USER_IDS

mode,folder=sys.argv[1:]
folder=Path(folder).resolve()
assert str(folder).startswith('/opt/concrefer-unificado/homolog-next/backups/suprimentos-f3-')
screen='suprimentosRecebimento'
users=sorted(set(MASTER_USER_IDS)|{'ricardo.teste','e2e-suprimentos-almox',
    'e2e-suprimentos-compras','e2e-suprimentos-qualidade'})
snapshot=folder/'iam-recebimento-before.json'
with psycopg.connect(os.environ['MAPA_AUTH_DATABASE_URL'],row_factory=dict_row) as db:
    with db.cursor() as cur:
        if mode=='grant':
            cur.execute('SELECT user_id,screen_id,allowed,updated_by,updated_at FROM unificado_auth.user_screen_permissions WHERE user_id=ANY(%s) AND screen_id=%s',(users,screen))
            snapshot.write_text(json.dumps(cur.fetchall(),default=str,ensure_ascii=False),encoding='utf-8')
            snapshot.chmod(0o600)
            for user in users:
                cur.execute("""INSERT INTO unificado_auth.user_screen_permissions(user_id,screen_id,allowed,updated_by,updated_at)
                    VALUES (%s,%s,true,'deploy:suprimentos-F3',now()) ON CONFLICT(user_id,screen_id)
                    DO UPDATE SET allowed=true,updated_by=excluded.updated_by,updated_at=excluded.updated_at""",(user,screen))
        else:
            prior={row['user_id']:row for row in json.loads(snapshot.read_text(encoding='utf-8'))}
            for user in users:
                row=prior.get(user)
                if row:
                    cur.execute("""UPDATE unificado_auth.user_screen_permissions SET allowed=%s,updated_by=%s,updated_at=%s
                        WHERE user_id=%s AND screen_id=%s""",(row['allowed'],row['updated_by'],row['updated_at'],user,screen))
                else:
                    cur.execute('DELETE FROM unificado_auth.user_screen_permissions WHERE user_id=%s AND screen_id=%s',(user,screen))
    db.commit()
print('F3_IAM_'+mode.upper()+'_OK',len(users))
