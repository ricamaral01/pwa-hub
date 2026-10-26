"""Concede as telas S2 somente a contas de ensaio na homologação."""
import json,os
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

target=Path(os.environ['SUPRIMENTOS_F2_GRANTS_BACKUP'])
assert '/homolog-next/backups/suprimentos-f2-' in str(target)
grants={
  'e2e-suprimentos-almox':('suprimentosAlmoxarifado','suprimentosInventario'),
  'e2e-suprimentos-compras':('suprimentosAlmoxarifado',),
  'ricardo.teste':('suprimentosAlmoxarifado','suprimentosInventario'),
}
with psycopg.connect(os.environ['MAPA_AUTH_DATABASE_URL'],row_factory=dict_row) as db:
  with db.cursor() as cur:
    cur.execute("SELECT user_id,screen_id,allowed,updated_by,updated_at FROM unificado_auth.user_screen_permissions WHERE user_id=ANY(%s) AND screen_id=ANY(%s)",
      (list(grants),['suprimentosAlmoxarifado','suprimentosInventario']))
    target.write_text(json.dumps(cur.fetchall(),ensure_ascii=False,default=str),encoding='utf-8');target.chmod(0o600)
    for user,screens in grants.items():
      for screen in screens:
        cur.execute("""INSERT INTO unificado_auth.user_screen_permissions(user_id,screen_id,allowed,updated_by,updated_at)
          VALUES (%s,%s,true,'deploy:suprimentos-F2',now()) ON CONFLICT(user_id,screen_id)
          DO UPDATE SET allowed=true,updated_by=excluded.updated_by,updated_at=excluded.updated_at""",(user,screen))
  db.commit()
print('F2_GRANTS_OK',sum(map(len,grants.values())))
