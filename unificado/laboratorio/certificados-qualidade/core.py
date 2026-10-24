"""Pure certificate rules. The old statistical service is a read-only source."""
from collections import defaultdict
from datetime import date, timedelta
from statistics import mean


def summarize_day(day: str, rows: list[dict], fck: float = 35) -> dict:
    date.fromisoformat(day)
    groups = defaultdict(lambda: defaultdict(list))
    for row in rows:
        if row.get('data_moldagem') != day:
            continue
        try:
            age = int(row['idade_dias'])
            value = float(row['mpa'])
        except (TypeError, ValueError, KeyError):
            continue
        if age in (3, 7, 28) and value >= 0:
            groups[str(row.get('traco_id') or '')][age].append(value)
    if not groups:
        return dict(data_producao=day, resultado='sem_resultado', data_prevista=None)
    # Completed traces take precedence. The choice is persisted in the issue snapshot.
    trace, values = max(groups.items(), key=lambda item: (mean(item[1][28]) if item[1][28] else -1, item[0]))
    r28 = values[28]
    return dict(
        data_producao=day, traco=trace, n_cps=len({(str(r.get('traco_id')), int(r.get('cp') or 0)) for r in rows if r.get('data_moldagem') == day and str(r.get('traco_id') or '') == trace}),
        r3_media=round(mean(values[3]), 2) if values[3] else None,
        r7_media=round(mean(values[7]), 2) if values[7] else None,
        r28_media=round(mean(r28), 2) if r28 else None,
        r28_min=round(min(r28), 2) if r28 else None,
        resultado=('conforme' if mean(r28) > fck else 'nao_conforme') if r28 else 'aguardando_28_dias',
        data_prevista=(date.fromisoformat(day) + timedelta(days=28)).isoformat() if not r28 else None,
    )


def validate_items(items: list[dict]) -> list[str]:
    if not items or len(items) > 20:
        raise ValueError('Informe entre 1 e 20 itens.')
    days = sorted({str(item.get('data_producao') or '') for item in items})
    if len(days) > 10:
        raise ValueError('O limite é 10 datas de produção por certificado.')
    for day in days:
        date.fromisoformat(day)
    for item in items:
        if not str(item.get('modelo') or '').strip() or len(str(item.get('modelo'))) > 64:
            raise ValueError('Informe um modelo válido em cada item.')
        if not 1 <= int(item.get('quantidade') or 0) <= 10000:
            raise ValueError('Quantidade inválida.')
    return days


def can_issue(results: list[dict]) -> bool:
    return bool(results) and all(row['resultado'] == 'conforme' for row in results)
