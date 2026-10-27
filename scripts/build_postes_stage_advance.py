"""Fix the mechanical stage action in the published pole-test bundle."""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'unificado/laboratorio/service/server/static/novo/postes/assets'
HTML = ASSETS.parent / 'novo.html'
SOURCE = 'novo-norm-9d72b9aff8fb.js'
BEFORE = 'onClick:()=>{fn().catch(()=>{}),le(c=>Math.min(4,c+1))},children:"Registrar e avan'
AFTER = 'onClick:async()=>{try{await fn();m<4?le(c=>Math.min(4,c+1)):h(3)}catch{}},children:"Registrar e avan'


def main():
    source = (ASSETS / SOURCE).read_text(encoding='utf-8')
    assert source.count(BEFORE) == 1, source.count(BEFORE)
    updated = source.replace(BEFORE, AFTER)
    name = f'novo-stage-{sha256(updated.encode()).hexdigest()[:12]}.js'
    (ASSETS / name).write_text(updated, encoding='utf-8')
    html = HTML.read_text(encoding='utf-8')
    assert html.count(SOURCE) == 1
    HTML.write_text(html.replace(SOURCE, name), encoding='utf-8')
    print(name)


if __name__ == '__main__':
    main()
