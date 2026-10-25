"""Print bounded daily totals and section labels from the referenced October sheet."""
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
sheet = gspread.authorize(credentials).open_by_key('17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM').get_worksheet_by_id(1778448785)
rows = sheet.get('A205:AI260')
for number, row in enumerate(rows, start=205):
    row += [''] * (35 - len(row))
    if any(str(x).strip() for x in row[:3]) or row[18].strip():
        print(number, row[:3], 'oct16', row[18], 'other', row[17:21])
