"""Normalize inline presentation; retain its original print declarations."""
import hashlib, re, sys
from pathlib import Path
import tinycss2
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from visual_style_guard import U, SKIP, css_errors
from visual_css_tokens import declarations

preserved = {}
changed = []
for p in U.rglob('*'):
    if not p.is_file() or p.suffix not in ('.html', '.js', '.tsx'): continue
    if any(x in SKIP for x in p.relative_to(U).parts) or p.name.endswith('.min.js') or p.name == 'login.html': continue
    original = p.read_text(encoding='utf-8')
    def normalize(match):
        quote, body = match.groups()
        if not css_errors('x{' + body + '}'): return match[0]
        key = hashlib.sha256(body.encode()).hexdigest()[:12]
        # Only declarations affected by normalization need print overrides.
        rules = []
        for d in tinycss2.parse_declaration_list(body, skip_comments=True, skip_whitespace=True):
            if d.type != 'declaration': continue
            value = tinycss2.serialize(d.value).strip()
            if '${' in value: continue
            if d.lower_name in ('font-family', 'font', 'color', 'background', 'background-color', 'border', 'border-color', 'border-radius', 'box-shadow', 'text-transform', 'transform') or '#' in value:
                rules.append(d.name + ':' + value + '!important;')
        if rules: preserved[key] = ''.join(rules)
        return 'data-visual-print="' + key + '" style=' + quote + declarations(body, 'inline') + quote
    current = re.sub(r'\bstyle=([\x22\x27])(.*?)\1', normalize, original, flags=re.S)
    if current != original:
        p.write_text(current, encoding='utf-8')
        changed.append(p.relative_to(U).as_posix())

if preserved:
    p = U / 'shell/tokens.css'
    source = p.read_text(encoding='utf-8')
    source += '\n/* Original inline print presentation; screen tokens do not affect it. */\n@media print {\n'
    source += '\n'.join('[data-visual-print="' + key + '"]{' + value + '}' for key, value in sorted(preserved.items()))
    p.write_text(source + '\n}\n', encoding='utf-8')
print('Inline presentation normalized in', len(changed), 'files; print overrides:', len(preserved))
