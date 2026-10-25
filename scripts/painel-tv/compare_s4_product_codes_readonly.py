"""Compare October 16 Setor 4 plan and realized product codes, without writes."""
import json
import os
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

env = dict(line.split('=', 1) for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines()
           if '=' in line and not line.startswith('#'))
secret = env['GOOGLE_CREDENTIALS'].strip().strip('"').strip("'")
scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
credentials = (Credentials.from_service_account_file(secret, scopes=scopes)
               if os.path.isfile(secret) else Credentials.from_service_account_info(json.loads(secret), scopes=scopes))
book = gspread.authorize(credentials).open_by_key('17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM')
for label, gid, rng, col in [('PLAN', 1385950632, 'A4:S150', 18),
                             ('ACTUAL', 1778448785, 'A155:R226', 17)]:
    rows = book.get_worksheet_by_id(gid).get(rng)
    total = 0
    print(label)
    for i, row in enumerate(rows, start=int(rng.split(':')[0][1:])):
        row += [''] * (col + 1 - len(row))
        if row[0].strip().casefold() == 'total':
            continue
        raw = row[col].strip()
        try:
            quantity = int(float(raw.replace(',', '.')))
        except ValueError:
            continue
        if quantity:
            print(i, repr(row[0][:48]), repr(row[1]), quantity)
            total += quantity
    print('TOTAL', total)
