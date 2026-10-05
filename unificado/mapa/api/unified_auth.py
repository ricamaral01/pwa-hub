"""Confirmed test-only identity links and dual password hashes.

This module never infers a link from a name. A link is inserted only after a
human confirmation. Passwords live in process memory for the current request;
only bcrypt/Argon2id hashes are persisted.
"""

from __future__ import annotations

import os

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from passlib.context import CryptContext
import psycopg
from psycopg.rows import dict_row


PCP_HASHER = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAPA_HASHER = PasswordHasher()


def pcp_connect():
    dsn = os.environ["UNIFICADO_PCP_DATABASE_URL"]
    for prefix in ("postgresql+psycopg://", "postgresql+psycopg2://"):
        if dsn.startswith(prefix):
            dsn = "postgresql://" + dsn[len(prefix):]
    connection = psycopg.connect(dsn, row_factory=dict_row, connect_timeout=5)
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database() AS name")
        if cursor.fetchone()["name"] != "pcp_unificado_teste":
            connection.close()
            raise RuntimeError("Unified auth PCP connection is not the test database")
    return connection


def map_connect():
    connection = psycopg.connect(os.environ["MAPA_AUTH_DATABASE_URL"],
                                 row_factory=dict_row, connect_timeout=5)
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database() AS name")
        if cursor.fetchone()["name"] != "mapa_unificado_teste":
            connection.close()
            raise RuntimeError("Unified auth Mapa connection is not the test database")
    return connection


def verify_map(password: str, digest: str) -> bool:
    try:
        return MAPA_HASHER.verify(digest, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def verify_pcp(password: str, digest: str) -> bool:
    try:
        return PCP_HASHER.verify(password, digest)
    except (ValueError, TypeError):
        return False


def pcp_user_by_login(login: str) -> dict | None:
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,username,nome,nivel_acesso,ativo,
                       trocar_senha_primeiro_acesso,senha_hash
                       FROM public.usuarios WHERE lower(username)=lower(%s)
                       ORDER BY id LIMIT 1""", (login,))
        return cur.fetchone()


def mapa_user_by_login(login: str) -> dict | None:
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome,perfil,ativo,setor,primeiro_acesso,senha_hash,updated_at
                       FROM public.usuarios WHERE lower(id)=lower(%s) OR lower(nome)=lower(%s)
                       ORDER BY CASE WHEN lower(id)=lower(%s) THEN 0 ELSE 1 END LIMIT 1""",
                    (login, login, login))
        return cur.fetchone()


def link_for(*, pcp_id: int | None = None, mapa_login: str | None = None) -> dict | None:
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT link.* FROM unificado_auth.identity_links link
                       JOIN public.usuarios mapa ON mapa.id=link.mapa_login
                       WHERE (%s::integer IS NOT NULL AND link.pcp_user_id=%s)
                          OR (%s::text IS NOT NULL AND link.mapa_login=%s)
                       ORDER BY (link.pcp_user_id=%s AND link.mapa_login=%s) DESC,
                                mapa.ativo DESC, mapa.primeiro_acesso ASC,
                                link.pcp_user_id DESC, link.id ASC LIMIT 1""",
                    (pcp_id, pcp_id, mapa_login, mapa_login, pcp_id, mapa_login))
        return cur.fetchone()


def linked_users(link: dict) -> tuple[dict | None, dict | None]:
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,username,nome,nivel_acesso,ativo,
                       trocar_senha_primeiro_acesso,senha_hash
                       FROM public.usuarios WHERE id=%s""", (link["pcp_user_id"],))
        pcp = cur.fetchone()
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT id,nome,perfil,ativo,setor,primeiro_acesso,senha_hash,updated_at
                       FROM public.usuarios WHERE id=%s""", (link["mapa_login"],))
        mapa = cur.fetchone()
    return pcp, mapa


def component_links(link_id: int) -> list[dict]:
    """All confirmed relations connected through a shared source account."""
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM unificado_auth.identity_links ORDER BY id")
        all_links = cur.fetchall()
    selected = {link_id}
    changed = True
    while changed:
        chosen = [link for link in all_links if link["id"] in selected]
        pcp_ids = {link["pcp_user_id"] for link in chosen}
        mapa_ids = {link["mapa_login"] for link in chosen}
        new = {link["id"] for link in all_links
               if link["pcp_user_id"] in pcp_ids or link["mapa_login"] in mapa_ids}
        changed = not new.issubset(selected)
        selected.update(new)
    return [link for link in all_links if link["id"] in selected]


def sync_component_password(link_id: int, password: str, *, first_access: bool = False) -> None:
    """Set one password across every confirmed account in a person's component."""
    links = component_links(link_id)
    if not links:
        raise ValueError("Identity link not found")
    pcp_ids = sorted({link["pcp_user_id"] for link in links})
    mapa_ids = sorted({link["mapa_login"] for link in links})
    pcp_digest = PCP_HASHER.hash(password)
    mapa_digest = MAPA_HASHER.hash(password)
    with map_connect() as map_conn, map_conn.cursor() as map_cur:
        map_cur.execute("""SELECT id,senha_hash,primeiro_acesso,updated_at FROM public.usuarios
                           WHERE id=ANY(%s) FOR UPDATE""", (mapa_ids,))
        old_mapa = map_cur.fetchall()
        if len(old_mapa) != len(mapa_ids):
            raise ValueError("Linked Mapa account missing")
        with pcp_connect() as pcp_conn, pcp_conn.cursor() as pcp_cur:
            pcp_cur.execute("""SELECT id,senha_hash,trocar_senha_primeiro_acesso
                               FROM public.usuarios WHERE id=ANY(%s) FOR UPDATE""", (pcp_ids,))
            old_pcp = pcp_cur.fetchall()
            if len(old_pcp) != len(pcp_ids):
                raise ValueError("Linked PCP account missing")
            pcp_cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                               trocar_senha_primeiro_acesso=%s WHERE id=ANY(%s)""",
                            (pcp_digest, first_access, pcp_ids))
            map_cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                               primeiro_acesso=%s,updated_at=now() WHERE id=ANY(%s)""",
                            (mapa_digest, first_access, mapa_ids))
            map_cur.execute("""UPDATE unificado_auth.identity_links
                               SET pcp_hash=%s,mapa_hash=%s,unified_password_set=true,
                                   requires_reset=%s,updated_at=now()
                               WHERE id=ANY(%s)""",
                            (pcp_digest, mapa_digest, first_access,
                             [link["id"] for link in links]))
            pcp_conn.commit()
            try:
                map_conn.commit()
            except Exception:
                with pcp_connect() as undo, undo.cursor() as cur:
                    for row in old_pcp:
                        cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                                       trocar_senha_primeiro_acesso=%s WHERE id=%s""",
                                    (row["senha_hash"], row["trocar_senha_primeiro_acesso"], row["id"]))
                raise


def confirm_link(pcp_id: int, mapa_login: str, *, mapa_base: bool = False) -> int:
    """Link one verified pair; mapa_base is reserved for exact login/name matches."""
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM public.usuarios WHERE id=%s", (pcp_id,))
        if not cur.fetchone():
            raise ValueError("PCP account does not exist")
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT id FROM public.usuarios WHERE id=%s", (mapa_login,))
        if not cur.fetchone():
            raise ValueError("Mapa account does not exist")
        cur.execute("""INSERT INTO unificado_auth.identity_links
                       (pcp_user_id,mapa_login,requires_reset) VALUES (%s,%s,%s) RETURNING id""",
                    (pcp_id, mapa_login, not mapa_base))
        return cur.fetchone()["id"]


def adopt_mapa_password(link_id: int, password: str) -> None:
    """On first linked login, hash the verified Mapa password for PCP without a reset."""
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM unificado_auth.identity_links WHERE id=%s", (link_id,))
        link = cur.fetchone()
    if not link or link["unified_password_set"] or link["requires_reset"]:
        raise ValueError("Identity is not awaiting Mapa adoption")
    pcp, mapa = linked_users(link)
    if not pcp or not mapa or not pcp["ativo"] or not verify_map(password, mapa["senha_hash"]):
        raise ValueError("Mapa credential invalid")
    sync_component_password(link_id, password)


def check_link_password(link: dict, password: str) -> tuple[bool, bool]:
    pcp, mapa = linked_users(link)
    return (bool(pcp and pcp["ativo"] and verify_pcp(password, pcp["senha_hash"])),
            bool(mapa and mapa["ativo"] and verify_map(password, mapa["senha_hash"])))


def mark_existing_shared_password(link_id: int) -> None:
    """Both old hashes already verified against the same input on this login."""
    with map_connect() as map_conn, map_conn.cursor() as map_cur:
        map_cur.execute("SELECT * FROM unificado_auth.identity_links WHERE id=%s FOR UPDATE",
                        (link_id,))
        link = map_cur.fetchone()
        if not link:
            raise ValueError("Identity link not found")
        pcp, mapa = linked_users(link)
        if not pcp or not mapa:
            raise ValueError("A linked account is missing")
        map_cur.execute("""UPDATE unificado_auth.identity_links
                           SET pcp_hash=%s,mapa_hash=%s,unified_password_set=true,
                               requires_reset=false,updated_at=now() WHERE id=%s""",
                        (pcp["senha_hash"], mapa["senha_hash"], link_id))


def set_unified_password(link_id: int, password: str) -> None:
    """Set fresh hashes in both test DBs, with compensation if the second write fails."""
    if not isinstance(password, str) or not 6 <= len(password) <= 128:
        raise ValueError("New password must have 6–128 characters")
    return sync_component_password(link_id, password)

def reapply_unified_hashes() -> int:
    """Reapply confirmed test hashes after the official snapshots are restored."""
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("""SELECT pcp_user_id,mapa_login,pcp_hash,mapa_hash,requires_reset
                       FROM unificado_auth.identity_links WHERE unified_password_set""")
        links = cur.fetchall()
    for link in links:
        with pcp_connect() as pcp_conn, pcp_conn.cursor() as pcp_cur:
            pcp_cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                             trocar_senha_primeiro_acesso=%s WHERE id=%s""",
                            (link["pcp_hash"], link["requires_reset"], link["pcp_user_id"]))
            if pcp_cur.rowcount != 1:
                raise ValueError("Confirmed PCP account missing after snapshot")
        with map_connect() as map_conn, map_conn.cursor() as map_cur:
            map_cur.execute("""UPDATE public.usuarios SET senha_hash=%s,
                             primeiro_acesso=%s,updated_at=now() WHERE id=%s""",
                            (link["mapa_hash"], link["requires_reset"], link["mapa_login"]))
            if map_cur.rowcount != 1:
                raise ValueError("Confirmed Mapa account missing after snapshot")
    return len(links)


def mirror_mapa_password(mapa_login: str, password: str) -> bool:
    """After a Mapa Users screen write, mirror its current hash to linked PCP."""
    link = link_for(mapa_login=mapa_login)
    if not link:
        return False
    if not 6 <= len(password) <= 128:
        raise ValueError("New password must have 6–128 characters")
    with map_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT primeiro_acesso FROM public.usuarios WHERE id=%s", (mapa_login,))
        source = cur.fetchone()
    if not source:
        raise ValueError("Linked Mapa account missing")
    sync_component_password(link["id"], password, first_access=source["primeiro_acesso"])
    return True

def mirror_pcp_password(pcp_id: int, password: str) -> bool:
    """After a PCP Users screen write, mirror its current hash to linked Mapa."""
    link = link_for(pcp_id=pcp_id)
    if not link:
        return False
    if not 6 <= len(password) <= 128:
        raise ValueError("New password must have 6–128 characters")
    with pcp_connect() as conn, conn.cursor() as cur:
        cur.execute("SELECT trocar_senha_primeiro_acesso FROM public.usuarios WHERE id=%s", (pcp_id,))
        source = cur.fetchone()
    if not source:
        raise ValueError("Linked PCP account missing")
    sync_component_password(link["id"], password,
                            first_access=source["trocar_senha_primeiro_acesso"])
    return True
