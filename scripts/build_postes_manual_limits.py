"""Patch the published Poste bundle until its original React source is available."""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'unificado/laboratorio/service/server/static/novo/postes/assets'
HTML = ASSETS.parent / 'novo.html'
SOURCE = 'novo-16d78bdbc677.js'

helper = '''function cqManualLimits(o,h,p){const circular=["C","R"].includes(String(h.tipo).toUpperCase());return Object.fromEntries(Object.entries(p).map(([key,limit])=>{if(limit.aplicavel)return[key,{...limit,origem:"tabela"}];const expected=key==="comprimento"||key==="engastamento"||(circular?key.startsWith("diametro_"):key.startsWith("largura_")||key.startsWith("espessura_"));if(!expected)return[key,limit];const previous=o.medidas?.[key]||{},min=previous.min_mm??"",max=previous.max_mm??"",reading=previous.leitura_mm??"",has=[min,max,reading].some(value=>String(value).trim()!=="");return[key,{...limit,min_mm:min,max_mm:max,leitura_mm:reading,aplicavel:has,origem:"manual"}]}))}'''

replacements = [
    ('function Rr(o,h,p){', helper + 'function Rr(o,h,p){', 1),
    ('return{checklist:o.checklist,medidas:Q,fonte_limites:$}',
     'return{checklist:o.checklist,medidas:cqManualLimits(o,h,Q),fonte_limites:$}', 1),
    ('["comprimento","engastamento","furacao_f","furacao_j"].includes(g)?C.medidas[g]?.aplicavel',
     '["comprimento","engastamento"].includes(g)?true:["furacao_f","furacao_j"].includes(g)?C.medidas[g]?.aplicavel', 2),
    ('$=(g,O)=>w({...o,medidas:{...o.medidas,[g]:{...o.medidas[g],leitura_mm:O}}})',
     '$=(g,O,F="leitura_mm")=>w({...o,medidas:{...o.medidas,[g]:{...o.medidas[g],[F]:O}}})', 2),
    ('value:O.aplicavel===!1?"N/A":O.min_mm,readOnly:!0',
     'value:O.origem==="manual"?O.min_mm:O.aplicavel===!1?"N/A":O.min_mm,readOnly:O.origem!=="manual"||_,onChange:L=>$(g,L.target.value,"min_mm")', 2),
    ('value:O.aplicavel===!1?"N/A":O.max_mm,readOnly:!0',
     'value:O.origem==="manual"?O.max_mm:O.aplicavel===!1?"N/A":O.max_mm,readOnly:O.origem!=="manual"||_,onChange:L=>$(g,L.target.value,"max_mm")', 2),
    ('disabled:O.aplicavel===!1,onChange:L=>$(g,L.target.value)',
     'disabled:O.aplicavel===!1&&O.origem!=="manual"||_,onChange:L=>$(g,L.target.value)', 2),
    (' Modelos sem referência exibem N/A.',
     ' Sem referência, informe mínimo, máximo e leitura manualmente.', 2),
]


def main():
    source = (ASSETS / SOURCE).read_text(encoding='utf-8')
    for before, after, expected in replacements:
        assert source.count(before) == expected, (before[:65], source.count(before), expected)
        source = source.replace(before, after)
    name = f'novo-manual-{sha256(source.encode()).hexdigest()[:12]}.js'
    (ASSETS / name).write_text(source, encoding='utf-8')
    html = HTML.read_text(encoding='utf-8')
    assert html.count(SOURCE) == 1
    HTML.write_text(html.replace(SOURCE, name), encoding='utf-8')
    print(name)


if __name__ == '__main__':
    main()
