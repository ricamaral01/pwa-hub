"""Summarize distinct form labels by product code on Oct 16 from Mapa."""
import subprocess

sql = """SELECT coalesce(codigo_produto::text,'?'),count(DISTINCT forma),count(*)
FROM public.producao WHERE data_fabricacao='2026-10-16' AND setor='Setor 4'
GROUP BY 1 ORDER BY 1"""
print(subprocess.check_output(['sudo', '-u', 'postgres', 'psql', '-At',
                               '-d', 'mapa_unificado_teste', '-c', sql], text=True))
