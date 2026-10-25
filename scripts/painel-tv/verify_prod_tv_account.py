"""Read-only production TV account and GED link inspection."""
from pathlib import Path
import psycopg

env = {}
for line in Path('/etc/mapa-unificado/auth.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        env[key] = value.strip().strip('"').strip("'")
with psycopg.connect(env['MAPA_AUTH_DATABASE_URL']) as conn, conn.cursor() as cur:
    cur.execute("SELECT id,perfil,ativo,primeiro_acesso FROM public.usuarios WHERE id='tv-producao'")
    print('user', cur.fetchone())
    cur.execute("SELECT screen_id,allowed FROM unificado_auth.user_screen_permissions WHERE user_id='tv-producao' AND allowed ORDER BY screen_id")
    print('allowed_screens', cur.fetchall())
    cur.execute("SELECT to_regclass('unificado_auth.ged_identity_links')")
    exists = cur.fetchone()[0]
    if exists:
        cur.execute("SELECT count(*) FROM unificado_auth.ged_identity_links WHERE mapa_user_id='tv-producao' AND active")
        print('ged_links', cur.fetchone()[0])
    else:
        print('ged_links_table', 'absent')
