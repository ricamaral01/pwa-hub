"""Remove remaining authored visual regressions, without changing print rules."""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tests/unificado'))
from visual_style_guard import scan, EMOJI, U, SKIP
from visual_css_tokens import rules

changed = []
for rel, errors in scan()[1].items():
    p = U / rel
    original = source = p.read_text(encoding='utf-8')
    if p.suffix == '.css':
        source = rules(source)
    elif p.suffix == '.html':
        source = re.sub(r'<style([^>]*)>(.*?)</style>',
                        lambda m: '<style' + m[1] + '>' + rules(m[2]) + '</style>', source, flags=re.S)
    source = re.sub(r'<(?:p|span) class(?:Name)?="[^"]*eyebrow[^\"]*">.*?</(?:p|span)>', '', source)
    if source != original:
        p.write_text(source, encoding='utf-8')
        changed.append(rel)

# Pictographic decorations are redundant with their adjacent labels. Retain
# meaningful state marks (monochrome check/cross/dot), and label standalone ones.
for p in U.rglob('*'):
    if not p.is_file() or p.suffix not in ('.html', '.js', '.tsx'): continue
    rel = p.relative_to(U)
    if any(x in SKIP for x in rel.parts) or p.name.endswith('.min.js') or p.name == 'login.html': continue
    original = source = p.read_text(encoding='utf-8')
    if not EMOJI.search(source): continue
    source = source.replace('✅', '✓').replace('❌', '×').replace('🔴', '●')
    source = source.replace('icon.textContent = "📲"', 'icon.textContent = "Abrir"')
    # The defect code and description already identify every checklist option.
    source = re.sub(r'(const DEFEITO_ICONES = \{)(.*?)(\n\};)',
                    lambda m: m[1] + re.sub(r'"(?:\\u[0-9a-fA-F]{4})+"', '""', m[2]) + m[3], source, flags=re.S)
    source = re.sub(r'\\u2705', '✓', source, flags=re.I)
    source = re.sub(r'\\u274c', '×', source, flags=re.I)
    source = EMOJI.sub('', source).replace('\ufe0f', '')
    # Explicit captions preserve camera-only upload buttons.
    if rel.as_posix() == 'suprimentos/frontend/app.js':
        source = source.replace('aria-label="Adicionar foto">', 'aria-label="Adicionar foto">Foto')
    if source != original:
        p.write_text(source, encoding='utf-8')
        changed.append(rel.as_posix())

out = ROOT / 'docs/revisao-visual-unificado/homolog/fase-7'
out.mkdir(parents=True, exist_ok=True)
(out / 'prepared-files.json').write_text(json.dumps(sorted(set(changed)), indent=2))
print('Prepared', len(set(changed)), 'authored files')
