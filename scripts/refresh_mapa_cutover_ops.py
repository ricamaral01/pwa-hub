"""One-time Mapa cutover: replace six operational snapshot tables, preserving users.

Run on staging as root, after exporting the official Mapa with the read-only
exporter and taking a complete destination backup. Never contacts old services
with a write request.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import uuid

import requests


MIGRATION = Path('/opt/concrefer-unificado/migration')
sys.path.insert(0, str(MIGRATION))
from refresh_mapa_snapshot import (psql, require_complete_destination_schema,
                                   source_environment, verified_manifest)
from export_mapa_supabase import get_count

SOURCE = MIGRATION / 'snapshots/20261008-cutover-source'
TABLES = ('programacao_pcp', 'liberacao_formas', 'producao',
          'montagem_poste', 'formas_manutencao', 'prog_s3_s4')
BACKUP = Path('/var/backups/concrefer-unificado/cutover-20261008/mapa_unificado_teste.premapasyn.dump')


def digest_ids(table: str) -> str:
    query = f'COPY (SELECT id::text FROM {table} ORDER BY id) TO STDOUT'
    result = subprocess.run(['sudo','-u','postgres','psql','-X','-q','-v','ON_ERROR_STOP=1',
                             '-d','mapa_unificado_teste','-c',query],capture_output=True,check=True)
    return hashlib.sha256(result.stdout).hexdigest()


def main() -> None:
    if not BACKUP.is_file():
        raise RuntimeError('Backup completo anterior à sincronização não encontrado')
    manifest = verified_manifest(SOURCE)
    require_complete_destination_schema(manifest)
    env = source_environment()
    session = requests.Session()
    session.headers['apikey'] = env['SUPABASE_SECRET_KEY']
    base = env['SUPABASE_URL'].rstrip('/')+'/rest/v1'
    entries = {entry['table']: entry for entry in manifest['tables']}
    for name in TABLES:
        live = get_count(session, base, name)
        if live != entries[name]['source_count']:
            raise RuntimeError(f'{name}: origem mudou após exportação; exporte novamente')
    stage = 'mapa_cutover_' + uuid.uuid4().hex[:12]
    psql(f'CREATE SCHEMA {stage}')
    try:
        for name in TABLES:
            entry = entries[name]
            psql(f'CREATE TABLE {stage}.{name} (LIKE public.{name} INCLUDING DEFAULTS)')
            if entry['source_count']:
                cols = ', '.join(entry['columns'])
                psql(f"COPY {stage}.{name} ({cols}) FROM STDIN WITH (FORMAT csv, HEADER true, NULL '\\N')",
                     input_file=SOURCE/entry['file'])
            actual = int(psql(f'SELECT count(*) FROM {stage}.{name}'))
            if actual != entry['source_count'] or digest_ids(f'{stage}.{name}') != entry['id_sha256']:
                raise RuntimeError(f'{name}: staging divergiu da origem')
            print('stage',name,actual,flush=True)
        tables = ', '.join('public.'+name for name in TABLES)
        statements = ['BEGIN', f'TRUNCATE {tables}']
        statements.extend(f'INSERT INTO public.{name} SELECT * FROM {stage}.{name}' for name in TABLES)
        for name in TABLES:
            entry = entries[name]
            statements.append(f"DELETE FROM public.migration_audit WHERE table_name='{name}'")
            statements.append(
                "INSERT INTO public.migration_audit "
                "(table_name,source_count,imported_count,exported_at,source_id_sha256) "
                f"VALUES ('{name}',{entry['source_count']},{entry['source_count']},"
                f"'{manifest['exported_at']}','{entry['id_sha256']}')"
            )
        statements.append('COMMIT')
        psql(';\n'.join(statements)+';')
        for name in TABLES:
            entry = entries[name]
            count = int(psql(f'SELECT count(*) FROM public.{name}'))
            if count != entry['source_count'] or digest_ids(f'public.{name}') != entry['id_sha256']:
                raise RuntimeError(f'{name}: conferência final falhou; restaure {BACKUP}')
            print('verified',name,count,flush=True)
        info = MIGRATION.parent/'mapa-api/snapshot-info.json'
        info.write_text(json.dumps({'snapshot_at':manifest['exported_at']})+'\n',encoding='utf-8')
        print('snapshot_at',manifest['exported_at'])
    finally:
        psql(f'DROP SCHEMA IF EXISTS {stage} CASCADE')


if __name__ == '__main__':
    main()
