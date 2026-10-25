"""Create and remove two pilot traces using the production server calculation."""
import json
from pathlib import Path
from uuid import uuid4

from sqlalchemy import delete, select

from app.acoes.documentos import salvar_traco
from app.db import get_sessionmaker
from app.modelos import Auditoria, Documento, Usuario

root = Path(__file__).resolve().parents[2]
shared = Path('/opt/concretrack-dosagem/shared')
request = shared / 'pilot-smoke-request'
result_file = shared / 'pilot-smoke-result.json'
principal = json.loads((root / 'api/golden/principal-4.1.json').read_text(encoding='utf-8'))
alternative = json.loads((root / 'api/golden/alternative-4.1.json').read_text(encoding='utf-8'))
factory = get_sessionmaker()
ids = []
results = []


def payload(case, method, mode, inputs):
    return {
        'id': str(uuid4()), 'codigo': '', 'nome': f'PILOTO-SMOKE-{case}', 'unidade': 'campinas',
        'versao': 0, 'revisao': 0, 'status': 'rascunho', 'metodo': method, 'balanco': mode,
        'metodoDados': inputs, 'custosRsKg': {'m0': .78, 'm2': .085, 'm3': .07, 'm4': .075, 'm5': .07, 'm7': 9.5},
        'objetivo': {'fckMPa': 30, 'sdMPa': 4, 'classe': 'II', 'estrutura': 'armado',
                     'abatimentoMm': 100, 'toleranciaMm': 20},
        'arIncorporadoPct': inputs['airFraction'] * 100, 'normalizarPara1m3': False,
        'itens': [], 'experimentais': [], 'auditoria': {},
    }


try:
    with factory.begin() as session:
        admin = session.get(Usuario, 'admin@dosagem.local')
        if admin is None or admin.papel != 'admin':
            raise RuntimeError('Emergency admin account is missing')
        users = session.scalars(select(Usuario)).all()
        if len(users) != 1 or users[0].email != admin.email:
            raise RuntimeError('Pilot must start with the emergency admin as its sole user')
        scenarios = [
            ('P1b', 'principal_abrams', 'complete', principal['base'], 1000, 321),
            ('A1', 'alternativo_concrefer', 'spreadsheet', alternative['a1'], 999.97, 351),
        ]
        for case, method, mode, inputs, volume, cement in scenarios:
            doc = salvar_traco(session, payload(case, method, mode, inputs), admin)['documento']
            ids.append(doc['id'])
            computed = doc['resultadoCalculado']
            assert abs(computed['physicalVolumeL'] - volume) <= .05, (case, computed['physicalVolumeL'])
            assert abs(computed['cementKg'] - cement) <= .05, (case, computed['cementKg'])
            assert doc['piloto'] is True
            results.append({'case': case, 'volumeL': computed['physicalVolumeL'],
                            'cementKg': computed['cementKg'], 'piloto': doc['piloto']})
    with factory() as session:
        rows = session.scalars(select(Documento).where(Documento.id.in_(ids))).all()
        assert len(rows) == 2 and all(row.piloto for row in rows)
finally:
    if ids:
        with factory.begin() as session:
            session.execute(delete(Auditoria).where(Auditoria.documento_id.in_(ids)))
            session.execute(delete(Documento).where(Documento.id.in_(ids), Documento.tipo == 'tracos'))
    request.unlink(missing_ok=True)

with factory() as session:
    remaining = session.scalars(select(Documento).where(Documento.id.in_(ids))).all()
    assert not remaining
result_file.write_text(json.dumps({'ok': True, 'users': 1, 'results': results, 'removed': len(ids)}, ensure_ascii=False), encoding='utf-8')
result_file.chmod(0o640)
print('Pilot production smoke passed; two test traces removed.')
