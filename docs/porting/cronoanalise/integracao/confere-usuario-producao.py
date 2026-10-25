"""Read-only account and Cronoanálise grant inspection for production."""
import sys

sys.path.insert(0, '/opt/concrefer-unificado/mapa-api')
from app import connect  # noqa: E402

with connect() as conn, conn.cursor() as cur:
    cur.execute("""
      SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='usuarios'
    """)
    cols = {row['column_name'] for row in cur.fetchall()}
    names = [name for name in ('nome', 'nome_completo', 'name') if name in cols]
    name_col = names[0] if names else None
    if not name_col:
        raise SystemExit(f'No known name column; columns={sorted(cols)}')
    cur.execute(f"""
      SELECT id, {name_col} AS nome, ativo
      FROM public.usuarios
      WHERE {name_col} ILIKE %s OR id ILIKE %s
      ORDER BY id
    """, ('%joaog%', '%joaog%'))
    for row in cur.fetchall():
        print('USUARIO', row['id'], row['nome'], 'ativo=' + str(row['ativo']))
    cur.execute("""
      SELECT user_id, count(*) AS telas
      FROM unificado_auth.user_screen_permissions
      WHERE screen_id LIKE 'cronoanalise.%' AND allowed = true
      GROUP BY user_id ORDER BY user_id
    """)
    for row in cur.fetchall():
        print('TELAS', row['user_id'], row['telas'])
    cur.execute("""
      SELECT user_id, count(*) AS acoes
      FROM unificado_auth.user_action_permissions
      WHERE action_id LIKE 'laboratorio.cronoanalise.%'
      GROUP BY user_id ORDER BY user_id
    """)
    for row in cur.fetchall():
        print('ACOES', row['user_id'], row['acoes'])
    cur.execute("""
      SELECT screen_id, allowed, updated_by, updated_at
      FROM unificado_auth.user_screen_permissions
      WHERE user_id='osmar' AND screen_id LIKE 'cronoanalise.%'
      ORDER BY screen_id
    """)
    for row in cur.fetchall():
        print('OSMAR_TELA', row['screen_id'], row['allowed'], row['updated_by'], row['updated_at'])
    cur.execute("""
      SELECT action_id, granted_by
      FROM unificado_auth.user_action_permissions
      WHERE user_id='osmar' AND action_id LIKE 'laboratorio.cronoanalise.%'
      ORDER BY action_id
    """)
    for row in cur.fetchall():
        print('OSMAR_ACAO', row['action_id'], row['granted_by'])
