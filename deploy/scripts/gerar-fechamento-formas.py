"""Gera o cadastro de posições do fechamento a partir do Mapa operacional.

Execute na raiz do repositório: python deploy/scripts/gerar-fechamento-formas.py
Confira com a fábrica se a primeira linha de cada coluna continua próxima da monovia.
"""

import json
import re
import sys
from pathlib import Path

source = Path(sys.argv[1] if len(sys.argv) > 1 else 'mapa-concretagem/app.js').read_text(encoding='utf-8')
catalog_block = re.search(r'const POSTES_DUPLO_T_CATALOGO = \[(.*?)\];', source, re.S).group(1)
product_by_key = {}
for entry in re.findall(r'\{([^{}]+)\}', catalog_block):
    product = re.search(r'codigoProduto:\s*"([^"]+)"', entry)
    keys = re.search(r'chaves:\s*\[([^]]*)\]', entry)
    if product and keys:
        for catalog_key in re.findall(r'"([^"]+)"', keys.group(1)):
            product_by_key[catalog_key] = product.group(1)

def form_catalog_key(code):
    normalized = code.upper().replace(' ', '')
    for prefix, catalog_key in [('300-VR','300-VR'), ('300-VL','300-VL'),
                                ('SB-E1','SB-E1'), ('SBE-','SB-E1'),
                                ('100-','100'), ('200-','200'),
                                ('A-TOTEM','A-TOTEM'), ('TMIE','TMIE'),
                                ('BC','BC'), ('C-F1','C-F1'), ('R-G','R-G'),
                                ('DTBM','DTBM'), ('DTB','DTB'), ('DTD','DTD')]:
        if normalized.startswith(prefix):
            return catalog_key
    return normalized.split('-')[0]

layout = {}
names = [('Esquerda', 'LEFT'), ('Direita', 'RIGHT')]
for sector in range(1, 5):
    lanes = names if sector < 4 else [('Coluna 1', 'COL1'), ('Coluna 2', 'COL2'), ('Coluna 3', 'COL3')]
    groups = []
    for label, suffix in lanes:
        match = re.search(rf'const SETOR_{sector}_{suffix}_FORMS = \[(.*?)\];', source, re.S)
        if not match:
            raise RuntimeError(f'Missing Setor {sector} {suffix}')
        forms = []
        for entry in re.findall(r'\{([^{}]+)\}', match.group(1)):
            values = dict(re.findall(r'(forma|modelo|label):\s*"([^"]*)"', entry))
            if not values.get('forma'):
                raise RuntimeError(f'Bad form: {entry}')
            values['codigo_produto'] = product_by_key.get(form_catalog_key(values['forma']), '')
            forms.append(values)
        groups.append({'lado': label, 'formas': forms})
    layout[f'Setor {sector}'] = {'colunas': groups}

target = Path(sys.argv[2] if len(sys.argv) > 2 else 'unificado/mapa/api/fechamento_formas.json')
target.write_text(json.dumps(layout, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print({sector: [len(col['formas']) for col in data['colunas']] for sector, data in layout.items()})
