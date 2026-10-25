"""Check status distribution of October 16 Mapa production rows."""
import subprocess

sql = """SELECT setor,coalesce(status,'?'),count(DISTINCT forma),count(*)
FROM public.producao WHERE data_fabricacao='2026-10-16' AND setor IN ('Setor 3','Setor 4')
GROUP BY 1,2 ORDER BY 1,2"""
print(subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-At',
                               '-d', 'mapa_unificado_teste', '-c', sql], text=True))
