"""Read-only index inventory for the TV queries."""
import subprocess

for db, tables in (
    ('mapa_unificado_teste', "'programacao_pcp','liberacao_formas','producao'"),
    ('pcp_unificado_teste', "'programacoes','programacoes_circular_s3','programacoes_circular_s4'"),
):
    sql = ("SELECT tablename,indexname FROM pg_indexes WHERE schemaname='public' "
           f"AND tablename IN ({tables}) ORDER BY tablename,indexname")
    result = subprocess.run(['sudo', '-u', 'postgres', 'psql', '-XAt', '-d', db,
                             '-c', sql], capture_output=True, text=True, check=True)
    print(db, result.stdout.strip())
