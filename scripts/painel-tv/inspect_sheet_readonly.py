"""Read spreadsheet metadata and bounded cells with existing PCP read-only Google scope."""
import json
import os
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

env = {}
for line in Path('/etc/pcp-unificado/pcp.env').read_text().splitlines():
    if '=' in line and not line.startswith('#'):
        key, value = line.split('=', 1)
        env[key] = value.strip().strip('"').strip("'")
value = env['GOOGLE_CREDENTIALS']
scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/drive.readonly']
credentials = (Credentials.from_service_account_file(value, scopes=scopes)
               if os.path.isfile(value) else
               Credentials.from_service_account_info(json.loads(value), scopes=scopes))
client = gspread.authorize(credentials)
print('service_account_email', credentials.service_account_email)
for id_ in (env['SPREADSHEET_ID'], '17KBJUSCwfZhyqYGik0WHTX86bRxcqZqFHWZLo_w8ERM'):
    try:
        spreadsheet = client.open_by_key(id_)
        print('spreadsheet', id_, spreadsheet.title)
        if id_ != env['SPREADSHEET_ID']:
            print('relevant_tabs', [(s.id, s.title) for s in spreadsheet.worksheets()
                                    if any(k in s.title.casefold() for k in ('prog', 'forma', 's3', 's4', 'entrada'))])
        for sheet in spreadsheet.worksheets():
            if sheet.id == 1778448785 or (
                'Circular modelo mensal' in sheet.title or 'DT Rede mensal' in sheet.title
                or 'Padrão mensal' in sheet.title
            ):
                print('sheet', sheet.id, sheet.title, sheet.row_count, sheet.col_count)
                for row in sheet.get('A4:AH6'):
                    print('sample', row[:10], 'tail', row[25:34])
                if id_ != env['SPREADSHEET_ID']:
                    values = sheet.get('A1:BT1098' if sheet.id == 1778448785 else 'A1:AH160')
                    matches = []
                    for row_number, row in enumerate(values, start=1):
                        if any('16/10' in str(cell) or '2026-10-16' in str(cell) for cell in row):
                            matches.append((row_number, [(i+1, cell) for i, cell in enumerate(row)
                                                         if '16/10' in str(cell) or '2026-10-16' in str(cell)][:5]))
                    print('date_matches', matches[:20], 'total', len(matches))
                    nonempty = [(i+1, sum(bool(str(c).strip()) for c in row)) for i, row in enumerate(values)
                                if any(str(c).strip() for c in row)]
                    print('last_nonempty', nonempty[-10:])
                    if sheet.id == 1778448785:
                        for start, end in ((7, 32), (218, 250)):
                            for number, row in enumerate(sheet.get(f'A{start}:BT{end}'), start=start):
                                populated = [(i+1, str(cell)[:45]) for i, cell in enumerate(row)
                                             if str(cell).strip()]
                                if populated:
                                    print('actual_row', number, populated[:14], 'date_window',
                                          [(i+1, row[i]) for i in range(15, min(22, len(row))) if row[i]])
                    elif any(k in sheet.title for k in ('modelo mensal', 'DT Rede mensal', 'Padrão mensal')):
                        planned = []
                        for number, row in enumerate(sheet.get('A5:S151' if 'Circular' in sheet.title else 'A5:S69'), start=5):
                            amount = row[18].strip() if len(row) > 18 else ''
                            if amount and amount.upper() not in {'P', '0'}:
                                planned.append((number, row[:3], amount))
                        print('planned_oct16', planned[:75], 'total_rows', len(planned))
    except Exception as exc:
        print('spreadsheet_error', id_, type(exc).__name__, str(exc)[:180])
