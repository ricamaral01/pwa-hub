"""Read-only CP adapters. The new Campinas CEC is local to the Unificado VPS."""
import json
import os
from urllib.parse import urlencode
from urllib.request import urlopen

from core import summarize_day


OLD_URL = 'https://concretrack.com.br/api/controle-estatistico/rompimentos-grupos'
NEW_URL = 'http://127.0.0.1:3086/api/controle-estatistico/rompimentos-grupos'


def selected_source():
    choice = os.getenv('CQ_FONTE_CP', 'antigo').strip().lower()
    if choice not in ('novo', 'antigo'):
        raise ValueError('CQ_FONTE_CP deve ser novo ou antigo.')
    return choice


def fetch_rows(days, source=None):
    if not days:
        return []
    source = source or selected_source()
    if source not in ('novo', 'antigo'):
        raise ValueError('Fonte de CPs inválida.')
    url = os.getenv('CQ_CP_NEW_URL' if source == 'novo' else 'CQ_CP_OLD_URL',
                    NEW_URL if source == 'novo' else OLD_URL)
    rows = []
    offset = 0
    while True:
        params = {'data_inicio': min(days), 'data_fim': max(days), 'limit': 1000, 'offset': offset}
        with urlopen(url + '?' + urlencode(params), timeout=15) as response:
            payload = json.load(response)
        if payload.get('success') is not True or payload.get('source') not in ('database', 'server_cache'):
            raise ValueError('Fonte de CPs indisponível ou sem banco confirmado.')
        page = payload.get('rows') or []
        if not isinstance(page, list) or (payload.get('pagination', {}).get('has_more') and not page):
            raise ValueError('Paginação de CPs incompleta.')
        if any(not row.get('data_moldagem') for row in page):
            raise ValueError('Fonte sem data de moldagem.')
        rows.extend(page)
        if not payload.get('pagination', {}).get('has_more'):
            return rows
        offset += len(page)


def summarize_days(days, fck, source=None):
    rows = fetch_rows(days, source)
    return [summarize_day(day, rows, fck) for day in days]
