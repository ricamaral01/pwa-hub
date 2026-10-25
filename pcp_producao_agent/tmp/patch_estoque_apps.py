from pathlib import Path
import re

apps = ['main','ribe','noro']
for name in apps:
    p = Path(f'tmp/remote/{name}/entrada.html')
    s = p.read_text(encoding='utf-8')
    s = s.replace('Valor do Frete (R$)', 'Valor do Frete Unitário (R$/ton ou unidade)')
    s = s.replace('Valor ICMS Frete (R$)', '% ICMS do Frete')
    s = s.replace('id="fValorFrete" step="0.01" min="0" placeholder="0.00"', 'id="fValorFrete" step="0.01" min="0" placeholder="Ex.: 40,00"')
    s = s.replace('id="fIcmsFrete" step="0.01" min="0" placeholder="0.00"', 'id="fIcmsFrete" step="0.01" min="0" max="100" placeholder="Ex.: 12,00"')
    s = s.replace('<strong>Frete por Ton/Unidade (Líquido):</strong>', '<strong>Frete líquido por Ton/Unidade:</strong>')
    s = s.replace('<strong>Valor Total do Produto (Líquido):</strong>', '<strong>Total líquido com frete:</strong>')
    s = s.replace("const vFrete = parseFloat(document.getElementById('fValorFrete').value) || 0;\n  const icmsFrete = parseFloat(document.getElementById('fIcmsFrete').value) || 0;", "const vFreteUnitario = parseFloat(document.getElementById('fValorFrete').value) || 0;\n  const icmsFretePerc = parseFloat(document.getElementById('fIcmsFrete').value) || 0;")
    s = s.replace('if (qtd > 0 && (vNota > 0 || vFrete > 0)) {', 'if (qtd > 0 && (vNota > 0 || vFreteUnitario > 0)) {')
    s = s.replace('const freteLiquidoTotal = vFrete - icmsFrete;\n    const fretePerTon = freteLiquidoTotal / qtd;', 'const freteBrutoTotal = vFreteUnitario * qtd;\n    const valorIcmsFrete = freteBrutoTotal * (icmsFretePerc / 100);\n    const freteLiquidoTotal = freteBrutoTotal - valorIcmsFrete;\n    const fretePerTon = freteLiquidoTotal / qtd;')
    s = s.replace('const prodTotal = vNota - icmsNotaTotal + vFrete - icmsFrete;', 'const prodTotal = vNota - icmsNotaTotal + freteLiquidoTotal;')
    p.write_text(s, encoding='utf-8')

# Pederneiras gets Campinas layout with AI reader, adjusted to root deployment and local silo rules.
main = Path('tmp/remote/main/entrada.html').read_text(encoding='utf-8')
ped = main
ped = ped.replace('Entrada de Materiais • Estoque • ConcreTrack', 'Entrada de Materiais • Estoque • Concrefer Pederneiras')
ped = ped.replace('/concretrack/assets/js/auth.js', '/assets/js/auth.js')
ped = ped.replace('/concretrack/assets/img/PRINCIPAL@2x.png', '/assets/img/PRINCIPAL@2x.png')
ped = ped.replace('Estoque &bull; ConcreTrack', 'Estoque &bull; Concrefer Pederneiras')
ped = ped.replace('href="/concretrack/estoque/"', 'href="/estoque/"')
ped = ped.replace('&copy; 2026 <span>ConcreTrack</span> &mdash; Entrada de Materiais', '&copy; 2026 <span>Concrefer Pederneiras</span> &mdash; Entrada de Materiais')
ped = ped.replace("const API='/concretrack/api';", "const API='/api';")
ped = ped.replace("const COD_SILO=[];", "const COD_SILO=['ADD-FILL'];")
ped = ped.replace("const SILO_FIXO={'CIM-CP-II':3};", "const SILO_FIXO={'ADD-FILL':1,'CIM-CP-V':2,'CIM-CP-II':3};")
Path('tmp/remote/ped/entrada.html').write_text(ped, encoding='utf-8')

# Backend patches.
def patch_modern(path: Path):
    s = path.read_text(encoding='utf-8')
    s = s.replace('@field_validator("valor_nota", "valor_frete", "icms_frete")', '@field_validator("valor_nota", "valor_frete")')
    s = re.sub(r'\n    @model_validator\(mode="after"\)\n    def val_icms_frete\(self\):\n        if float\(self\.icms_frete or 0\) > float\(self\.valor_frete or 0\):\n            raise ValueError\("ICMS do frete não pode ser maior que o valor do frete"\)\n        return self\n', '\n    @field_validator("icms_frete")\n    @classmethod\n    def val_icms_frete_perc(cls, v: Optional[float]) -> float:\n        value = float(v or 0)\n        if value < 0 or value > 100:\n            raise ValueError("ICMS do frete deve estar entre 0 e 100%")\n        return value\n', s)
    s = s.replace('total_liquido = valor_nota * (1 - icms_perc / 100) + valor_frete - icms_frete', 'frete_bruto_total = valor_frete * quantidade\n    valor_icms_frete = frete_bruto_total * (icms_frete / 100)\n    frete_liquido_total = frete_bruto_total - valor_icms_frete\n    total_liquido = valor_nota * (1 - icms_perc / 100) + frete_liquido_total')
    path.write_text(s, encoding='utf-8')

for name in ['main','ribe','noro']:
    patch_modern(Path(f'tmp/remote/{name}/estoque.py'))

# Pederneiras backend: copy AI provider module and inject AI endpoints/calculation function from Campinas while keeping local silo mappings.
ped_path = Path('tmp/remote/ped/estoque.py')
ped_s = ped_path.read_text(encoding='utf-8')
ped_s = ped_s.replace('from fastapi import APIRouter, HTTPException, Query', 'from fastapi import APIRouter, BackgroundTasks, HTTPException, Query')
ped_s = ped_s.replace('from decimal import Decimal\n', 'from decimal import Decimal\nimport base64\n')
ped_s = ped_s.replace('from api.settings import settings\n', 'from api.ai_providers import AIProviderError, provider_status, read_invoice\nfrom api.settings import settings\n')
ped_s = ped_s.replace('from datetime import date, datetime\n', 'from datetime import date, datetime\nfrom uuid import uuid4\n')
# Add validators after quantidade validator block if absent.
if 'val_valores_financeiros' not in ped_s:
    marker = '''    @field_validator("quantidade")\n    @classmethod\n    def val_quantidade(cls, v: float) -> float:\n        if v == 0:\n            raise ValueError("quantidade não pode ser zero")\n        return v\n'''
    insert = marker + '''\n    @field_validator("valor_nota", "valor_frete")\n    @classmethod\n    def val_valores_financeiros(cls, v: Optional[float]) -> float:\n        value = float(v or 0)\n        if value < 0:\n            raise ValueError("valores financeiros não podem ser negativos")\n        return value\n\n    @field_validator("icms_perc", "icms_frete")\n    @classmethod\n    def val_percentuais(cls, v: Optional[float]) -> float:\n        value = float(v or 0)\n        if value < 0 or value > 100:\n            raise ValueError("percentual deve estar entre 0 e 100%")\n        return value\n\n    @field_validator("data")\n    @classmethod\n    def val_data(cls, v: str) -> str:\n        try:\n            date.fromisoformat(v)\n        except (TypeError, ValueError):\n            raise ValueError("data deve estar no formato YYYY-MM-DD")\n        return v\n'''
    ped_s = ped_s.replace(marker, insert)
# Extract AI block from main patched backend.
main_s = Path('tmp/remote/main/estoque.py').read_text(encoding='utf-8')
start = main_s.index('class DocumentoFiscalIn')
end = main_s.index('# ─── Materiais', start)
ai_block = main_s[start:end]
if 'class DocumentoFiscalIn' not in ped_s:
    ped_s = ped_s.replace('\n\n# ─── Materiais', '\n\n' + ai_block + '# ─── Materiais')
# Replace inline calculation in registrar_movimento.
ped_s = ped_s.replace('''            unit_price_raw = (item.valor_nota or 0) / quantidade\n            icms_val_per_unit = unit_price_raw * ((item.icms_perc or 0) / 100.0)\n            freight_net_total = (item.valor_frete or 0) - (item.icms_frete or 0)\n            valor_unitario_liquido = round(\n                unit_price_raw - icms_val_per_unit + (freight_net_total / quantidade),\n                4,\n            )''', '''            valor_unitario_liquido = _calcular_valor_unitario_liquido(\n                quantidade, item.valor_nota, item.icms_perc, item.valor_frete, item.icms_frete\n            )''')
ped_path.write_text(ped_s, encoding='utf-8')
Path('tmp/remote/ped/ai_providers.py').write_text(Path('tmp/remote/main/ai_providers.py').read_text(encoding='utf-8'), encoding='utf-8')
print('patched')
