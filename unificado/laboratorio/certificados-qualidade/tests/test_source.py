import io
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import source
from core import summarize_day


def test_new_source_uses_local_read_only_endpoint(monkeypatch):
    called = []
    class Reply(io.BytesIO):
        def __enter__(self): return self
        def __exit__(self, *_): self.close()
    def open_url(url, timeout):
        called.append(url)
        return Reply(json.dumps({'success': True, 'source': 'database', 'rows': [
            {'data_moldagem':'2026-06-01','traco_id':'A','idade_dias':28,'cp':1,'mpa':36.0}],
            'pagination':{'has_more':False}}).encode())
    monkeypatch.setattr(source, 'urlopen', open_url)
    monkeypatch.setenv('CQ_FONTE_CP','novo')
    result = source.summarize_days(['2026-06-01'],35)
    assert called[0].startswith('http://127.0.0.1:3086/')
    assert result[0]['resultado']=='conforme'
    assert result[0]['traco']=='A'


def test_new_source_requires_molding_date(monkeypatch):
    class Reply(io.BytesIO):
        def __enter__(self): return self
        def __exit__(self, *_): self.close()
    monkeypatch.setattr(source,'urlopen',lambda *_args,**_kwargs: Reply(json.dumps({
        'success':True,'source':'database','rows':[{'idade_dias':28,'mpa':40}],
        'pagination':{'has_more':False}}).encode()))
    with pytest.raises(ValueError,match='data de moldagem'):
        source.fetch_rows(['2026-06-01'],'novo')


def test_calibrator_must_be_identified():
    from app import calibrator_recorded
    assert not calibrator_recorded('')
    assert not calibrator_recorded('Não informado no cadastro de origem')
    assert not calibrator_recorded('nao informado')
    assert calibrator_recorded('Laboratório ABC')


def test_decimal_rounding_matches_sql_numeric():
    rows=[{'data_moldagem':'2026-08-01','traco_id':'A','idade_dias':28,'cp':i,'mpa':v}
          for i,v in enumerate(('40.67','40.68'),1)]
    assert summarize_day('2026-08-01',rows,35)['r28_media']==40.68
