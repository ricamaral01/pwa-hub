"""Provision the explicitly requested TV kiosk credential in a single database.

Run as the postgres OS user with the Mapa API virtualenv. Never print the hash.
"""
import sys

import psycopg
from argon2 import PasswordHasher


def main(database: str) -> None:
    with psycopg.connect(f"dbname={database} user=postgres host=/var/run/postgresql") as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM public.usuarios WHERE id = 'tv'")
            if cur.fetchone():
                raise SystemExit("tv account already exists; no changes made")
            cur.execute("""SELECT screen_id FROM unificado_auth.user_screen_permissions
                           WHERE user_id = 'tv-producao' AND allowed""")
            if cur.fetchall() != [('tvFormas',)]:
                raise SystemExit("TV template screen grants differ; no changes made")
            cur.execute("""SELECT screen_id, action FROM unificado_auth.guest_action_permissions
                           WHERE user_id = 'tv-producao'""")
            if cur.fetchall() != [('tvFormas', 'view')]:
                raise SystemExit("TV template action grants differ; no changes made")
            cur.execute("""INSERT INTO public.usuarios
                           (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                           VALUES ('tv','tv','CONVIDADO',%s,true,'Todos',false)""",
                        (PasswordHasher().hash('tv'),))
            cur.execute("""INSERT INTO unificado_auth.user_screen_permissions
                           (user_id,screen_id,allowed,updated_by)
                           VALUES ('tv','tvFormas',true,'user-ricardo')""")
            cur.execute("""INSERT INTO unificado_auth.guest_action_permissions
                           (user_id,screen_id,action,updated_by)
                           VALUES ('tv','tvFormas','view','user-ricardo')""")
    print(f"{database}: tv account created with tvFormas/view only")


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in {
        'mapa_unificado_homolog_20261016', 'mapa_unificado_teste'
    }:
        raise SystemExit('specify isolated test or production Mapa database')
    main(sys.argv[1])
