"""Inspect Setor 4 entries in October's monthly standard-post schedule."""
import json
import os
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

env = dict(line.split('=', 1) for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines()
           if '=' in line and not line.startswith('#'))
secret = env['GOOGLE_CREDENTIALS'].strip().strip('"').strip("'")
credentials = (Credentials.from_service_account_file(secret, scopes=['https://www.googleapis.com/auth/spreadsheets.readonly'])
               if os.path.isfile(secret) else
               Credentials.from_service_account_info(json.loads(secret), scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']))
sheet = gspread.authorize(credentials).open_by_key('17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM').get_worksheet_by_id(697993091)
rows = sheet.get('A4:AJ160')
print('day16_header', [(i+1, v) for i, v in enumerate(rows[0]) if str(v).strip() == '16/10'])
sector_counts = {}
for number, row in enumerate(rows[1:], start=5):
    row += [''] * (36 - len(row))
    sector = row[4].strip()
    if sector:
        sector_counts[sector] = sector_counts.get(sector, 0) + 1
    if sector.upper() == 'SETOR 4':
        print('S4', number, row[0], row[1], 'oct16', row[20], 'other', row[18:23])
print('sectors', sector_counts)
