"""Summarize possible Setor 4 planning tabs using the existing read-only service account."""
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
               if os.path.isfile(secret) else
               Credentials.from_service_account_info(json.loads(secret), scopes=scopes))
spreadsheet = gspread.authorize(credentials).open_by_key('17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM')
for sheet in spreadsheet.worksheets():
    title = sheet.title
    if not any(word in title.casefold() for word in ('prog', 'ent.', 'entrada', 's4')):
        continue
    print('\nTAB', sheet.id, title, sheet.row_count, sheet.col_count)
    values = sheet.get('A1:AH80')
    for index, row in enumerate(values[:12], start=1):
        print('HEADER', index, [(j + 1, str(value)[:30]) for j, value in enumerate(row)
                                if str(value).strip()][:15])
    matches = []
    for index, row in enumerate(values[12:], start=13):
        if any('entrada' in str(v).casefold() or '16/10' in str(v) for v in row):
            matches.append((index, [(j + 1, str(value)[:35]) for j, value in enumerate(row)
                                    if str(value).strip()][:12]))
    print('MATCHES', matches[:8], 'COUNT', len(matches))
