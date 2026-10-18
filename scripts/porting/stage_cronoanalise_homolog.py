"""Compose the Cronoanálise delta over a read-only homologation snapshot.

The snapshot must be downloaded afresh from the target. This keeps homologation
settings, ports and unrelated pending changes instead of copying local app.py.
"""
from __future__ import annotations

import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOCAL = ROOT / 'unificado'
COPIES = {
    'mapa/screen_access.py': LOCAL / 'mapa/api/screen_access.py',
    'mapa/screen_catalog.json': LOCAL / 'mapa/api/screen_catalog.json',
    'mapa/action_catalog.json': LOCAL / 'mapa/api/action_catalog.json',
    'mapa/users-unificado.js': LOCAL / 'mapa/operacao/users-unificado.js',
    'shell/menu.config.js': LOCAL / 'shell/menu.config.js',
    'shell/router.js': LOCAL / 'shell/router.js',
    'shell/shell.js': LOCAL / 'shell/shell.js',
    'shell/sw.js': LOCAL / 'sw.js',
    'lab/app.py': LOCAL / 'laboratorio/service/server/app.py',
    'lab/postes_api.py': LOCAL / 'laboratorio/service/server/postes_api.py',
}


def segment(source: str, start: str, end: str) -> str:
    assert source.count(start) == 1, start
    tail = source.split(start, 1)[1]
    assert tail.count(end) >= 1, end
    return start + tail.split(end, 1)[0]


def replace_once(source: str, old: str, new: str) -> str:
    assert source.count(old) == 1, (old[:80], source.count(old))
    return source.replace(old, new, 1)


def stage_gateway(remote: str, local: str) -> str:
    remote = replace_once(remote,
        'QUALITY_ACTION_CATALOG = json.loads((Path(__file__).parent / "action_catalog.json").read_text(encoding="utf-8"))\n'
        'QUALITY_ACTION_IDS = frozenset(item["id"] for item in QUALITY_ACTION_CATALOG)\n',
        segment(local, 'ACTION_CATALOG = json.loads(', 'QUALITY_AREA_CATALOG ='))
    remote = replace_once(remote, segment(remote, 'def quality_actions(user_id):', 'def quality_areas(user_id):'),
                          segment(local, 'def quality_actions(user_id):', 'def quality_areas(user_id):'))
    remote = replace_once(remote,
        "if not any(item.startswith('lab') for item in screens):",
        "if not any(item.startswith('lab') or item.startswith('cronoanalise.') for item in screens):")
    remote = replace_once(remote,
        '        if not role or not (asset or neutral_api or screen and\n',
        segment(local, "        crono_prefix = '/unificado/laboratorio/api/laboratorio/cronoanalise/'",
                '        if not role or not (asset or neutral_api or crono_allowed or crono_document or screen and\n') +
        '        if not role or not (asset or neutral_api or crono_allowed or crono_document or screen and\n')
    remote = replace_once(remote,
        '            "id": user["id"], "name": user["nome"], "role": role,\n            "exp": int(time.time()) + 20,',
        '            "id": user["id"], "name": user["nome"], "role": role,\n'
        '            "crono_screens": [item for item in allowed if item.startswith(\'cronoanalise.\')],\n'
        '            "crono_actions": crono_actions(user[\'id\']) if crono_allowed else [],\n'
        '            "exp": int(time.time()) + 20,')
    remote = replace_once(remote, '@app.get("/unified/quality-actions")',
                          segment(local, '@app.get("/unified/users/<user_id>/crono-actions")',
                                  '@app.get("/unified/quality-actions")') + '@app.get("/unified/quality-actions")')
    assert "mapa_unificado_homolog_session" in remote
    assert '13154/api/login' in remote
    assert remote.count('def crono_actions(') == 1
    assert remote.count('def update_user_crono_actions(') == 1
    return remote


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--before', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    remote_app = (args.before / 'mapa/app.py').read_text(encoding='utf-8')
    local_app = (LOCAL / 'mapa/api/app.py').read_text(encoding='utf-8')
    for path, source in COPIES.items():
        (args.before / path).read_text(encoding='utf-8')
        after = source.read_text(encoding='utf-8')
        target = args.out / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(after, encoding='utf-8', newline='\n')
    gateway = stage_gateway(remote_app, local_app)
    target = args.out / 'mapa/app.py'
    target.write_text(gateway, encoding='utf-8', newline='\n')
    print(f'STAGED {len(COPIES) + 1} arquivos; gateway mantém configuração de homologação')


if __name__ == '__main__':
    main()
