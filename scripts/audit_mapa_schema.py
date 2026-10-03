"""Compare Supabase OpenAPI (GET only) with isolated Mapa PostgreSQL columns."""

import json
from pathlib import Path
import subprocess


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "docs" / "diferencas-estrutura-mapa.md"
TABLES = ("usuarios", "programacao_pcp", "liberacao_formas", "producao",
          "montagem_poste", "formas_manutencao", "prog_s3_s4")
REMOTE = r'''
import json,subprocess
from pathlib import Path
import requests
values={}
for line in Path('/root/mapa-unificado-migration/supabase-source.env').read_text().splitlines():
    if '=' in line:
        key,value=line.split('=',1);values[key]=value.strip().strip('"').strip("'")
key=values['SUPABASE_SECRET_KEY']
url=values['SUPABASE_URL'].rstrip('/')+'/rest/v1/'
response=requests.get(url,headers={'apikey':key,'Authorization':'Bearer '+key,'Accept':'application/openapi+json'},timeout=30)
response.raise_for_status()
definitions=response.json()['definitions']
tables=['usuarios','programacao_pcp','liberacao_formas','producao','montagem_poste','formas_manutencao','prog_s3_s4']
source={table:{'columns':{name:{'type':prop.get('type'),'format':prop.get('format'),'default':prop.get('default'),'pk':'Primary Key' in prop.get('description','')} for name,prop in definitions[table]['properties'].items()},'required':definitions[table].get('required',[])} for table in tables}
sql="SELECT table_name||'|'||column_name||'|'||data_type||'|'||is_nullable||'|'||coalesce(column_default,'') FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('"+"','".join(tables)+"') ORDER BY table_name,ordinal_position"
result=subprocess.run(['sudo','-u','postgres','psql','-X','-A','-t','-d','mapa_unificado_teste','-c',sql],capture_output=True,text=True,check=True)
dest={table:{} for table in tables}
for line in result.stdout.splitlines():
    table,name,typ,nullable,default=line.split('|',4)
    dest[table][name]={'type':typ,'required':nullable=='NO','default':default or None}
print(json.dumps({'source':source,'destination':dest},ensure_ascii=False))
'''


def main():
    result = subprocess.run(["ssh", "vps-staging", "/root/mapa-unificado-migration/refresh-venv/bin/python", "-"],
                            input=REMOTE, text=True, capture_output=True, check=True)
    data = json.loads(result.stdout)
    lines = ["# Diferenças de estrutura do Mapa — 03/10/2026", "",
             "Origem: `GET /rest/v1/` com OpenAPI do Supabase, sem SQL nem escrita no oficial. Destino: `information_schema.columns` do PostgreSQL `mapa_unificado_teste`. A OpenAPI expõe colunas, obrigatoriedade, padrões e marcação de chave primária; ela não prova índices únicos adicionais, gatilhos ou sequências da origem. Esses itens ainda exigem fonte de catálogo autorizada ou teste de contrato isolado.", "",
             "| Tabela | Origem | Destino | Só na origem | Só no destino | Padrões/obrigatoriedade divergentes |", "|---|---:|---:|---|---|---|"]
    totals = {"source_only": 0, "destination_only": 0, "differences": 0}
    details = []
    for table in TABLES:
        source = data["source"][table]
        dest = data["destination"][table]
        s = set(source["columns"])
        d = set(dest)
        only_source = sorted(s-d)
        only_dest = sorted(d-s)
        changed = []
        for name in sorted(s & d):
            a,b = source["columns"][name],dest[name]
            source_default = str(a["default"] or "").lower()
            dest_default = str(b["default"] or "").lower()
            if (name in source["required"]) != b["required"] or source_default != dest_default:
                changed.append(name)
                details.append((table, name, name in source["required"], a["default"],
                                b["required"], b["default"]))
        totals["source_only"] += len(only_source)
        totals["destination_only"] += len(only_dest)
        totals["differences"] += len(changed)
        fmt = lambda values: ", ".join(f"`{name}`" for name in values) or "—"
        lines.append(f"| `{table}` | {len(s)} | {len(d)} | {fmt(only_source)} | {fmt(only_dest)} | {fmt(changed)} |")
    lines += ["", f"**Totais:** {totals['source_only']} colunas só na origem, {totals['destination_only']} só no destino e {totals['differences']} colunas comuns com padrão ou obrigatoriedade diferente.", "",
              "A troca intencional de `usuarios.senha` por `usuarios.senha_hash` e campos de primeiro acesso preserva a senha fora do PostgREST; seu contrato de login precisa ser reproduzido pelo serviço de autenticação. Os demais desvios precisam ser resolvidos ou demonstrados inofensivos antes da rota operacional.", "",
              "## Detalhe dos padrões e da obrigatoriedade", "",
              "A OpenAPI e o catálogo PostgreSQL podem escrever padrões equivalentes de maneiras diferentes; os valores abaixo ainda precisam de comparação semântica.", "",
              "| Coluna | Origem: obrigatória / padrão | Destino: obrigatória / padrão |", "|---|---|---|"]
    for table, name, src_required, src_default, dst_required, dst_default in details:
        fmt = lambda value: str(value).replace("|", "\\|") if value is not None else "—"
        lines.append(f"| `{table}.{name}` | {src_required} / `{fmt(src_default)}` | {dst_required} / `{fmt(dst_default)}` |")
    lines.append("")
    TARGET.write_text("\n".join(lines), encoding="utf-8")
    print(f"tables={len(TABLES)} source_only={totals['source_only']} destination_only={totals['destination_only']} common_differences={totals['differences']} output={TARGET}")


if __name__ == '__main__':
    main()
