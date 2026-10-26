"""Build the nonstandard-pole UI from the published manual-limits bundle."""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'unificado/laboratorio/service/server/static/novo/postes/assets'
HTML = ASSETS.parent / 'novo.html'
SOURCE = 'novo-manual-97fb4b7443d2.js'

replacements = [
    ('if(limit.aplicavel)return[key,{...limit,origem:"tabela"}];const expected=',
     'if(h.nao_normatizado_8451&&(key.endsWith("_base")||key.endsWith("_topo")))limit={...limit,nominal_mm:"",min_mm:"",max_mm:"",aplicavel:false};if(limit.aplicavel)return[key,{...limit,origem:"tabela"}];const expected=', 1),
    ('poste:{tipo:"DT",', 'poste:{tipo:"DT",nao_normatizado_8451:!1,', 2),
    ('poste:{tipo:G.tipo,', 'poste:{tipo:G.tipo,nao_normatizado_8451:G.nao_normatizado_8451===!0,', 1),
    ('poste:{tipo:q.tipo,', 'poste:{tipo:q.tipo,nao_normatizado_8451:q.nao_normatizado_8451===!0,', 1),
    ('poste:{tipo:d.tipo,', 'poste:{tipo:d.tipo,nao_normatizado_8451:z.poste.nao_normatizado_8451===!0,', 1),
    ('poste:{tipo:c.tipo,', 'poste:{tipo:c.tipo,nao_normatizado_8451:F.poste.nao_normatizado_8451===!0,', 1),
    ('r.jsx(Tm,{inspection:',
     'r.jsxs("label",{className:"check",children:[r.jsx("input",{type:"checkbox",checked:!!g.poste.nao_normatizado_8451,disabled:R==="finalizado",onChange:d=>ge(z=>({...z,poste:{...z.poste,nao_normatizado_8451:d.target.checked}}))})," Poste não normatizado conforme ABNT NBR 8451 · informar limites de topo e base manualmente"]}),r.jsx(Tm,{inspection:', 1),
    ('r.jsx(Um,{inspection:',
     'r.jsxs("label",{className:"check",children:[r.jsx("input",{type:"checkbox",checked:!!E.poste.nao_normatizado_8451,disabled:I==="finalizado",onChange:c=>Pe(F=>({...F,poste:{...F.poste,nao_normatizado_8451:c.target.checked}}))})," Poste não normatizado conforme ABNT NBR 8451 · informar limites de topo e base manualmente"]}),r.jsx(Um,{inspection:', 1),
]


def main():
    source = (ASSETS / SOURCE).read_text(encoding='utf-8')
    for before, after, expected in replacements:
        assert source.count(before) == expected, (before[:70], source.count(before), expected)
        source = source.replace(before, after)
    name = f'novo-norm-{sha256(source.encode()).hexdigest()[:12]}.js'
    (ASSETS / name).write_text(source, encoding='utf-8')
    html = HTML.read_text(encoding='utf-8')
    assert html.count(SOURCE) == 1
    HTML.write_text(html.replace(SOURCE, name), encoding='utf-8')
    print(name)


if __name__ == '__main__':
    main()
