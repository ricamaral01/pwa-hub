"""Inspect copied catalog codes against physical IDs in the Mapa layout (read only)."""
import csv
import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[2]
source = (root / "mapa-concretagem/app.js").read_text(encoding="utf-8")
rows = list(csv.DictReader((pathlib.Path(__file__).parent / "catalogo-homologacao.csv").open(encoding="utf-8-sig")))

def key(value):
    match = re.match(r"^(.*?)[\s-]*(\d+)\s*$", value.strip().upper())
    if not match:
        return re.sub(r"[^A-Z0-9]", "", value.upper()), None
    return re.sub(r"[^A-Z0-9]", "", match.group(1)), int(match.group(2))

for sector in (1, 2):
    forms = []
    for side in ("LEFT", "RIGHT"):
        name = f"SETOR_{sector}_{side}_FORMS"
        body = re.search(rf"const {name} = \[(.*?)\];", source, re.S).group(1)
        forms.extend(re.findall(r'forma:\s*"([^"]+)"', body))
    mapa = {key(form): form for form in forms}
    hits, missing = [], []
    for row in rows:
        if int(row["setor_id"]) != sector:
            continue
        prefix = row["codigo_tipo_forma"] or ""
        suffix = re.search(r"(\d+)$", row["codigo_forma"])
        candidate = key(f"{prefix}-{suffix.group(1)}") if suffix else ("", None)
        (hits if candidate in mapa else missing).append((row["codigo_forma"], mapa.get(candidate), candidate))
    mapped = {physical for _, physical, _ in hits}
    print(f"S{sector}: PCP {len(hits)+len(missing)}, Mapa {len(forms)}, matches {len(hits)}, PCP-only {len(missing)}, Mapa-only {len(forms)-len(mapped)}")
    print("PCP-only", missing[:20])
    print("Mapa-only", sorted(set(forms)-mapped)[:30])
