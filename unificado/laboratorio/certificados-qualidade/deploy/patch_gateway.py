"""Small idempotent CQ integration patch for the live Unificado gateway tree.

The homolog and production Mapa gateways contain unrelated environment changes;
this script preserves them instead of replacing entire files.
"""
import json
import sys
from pathlib import Path


def once(text, old, new):
    if old not in text:
        raise RuntimeError(f'Expected anchor missing: {old[:65]!r}')
    return text.replace(old,new,1)


def patch(root:Path):
    catalog=root/'screen_catalog.json'
    records=json.loads(catalog.read_text(encoding='utf-8'))
    if not any(row['id']=='labCertificados' for row in records):
        records.append(dict(id='labCertificados',module='laboratorio',label='Certificados de qualidade',
                            path='/unificado/laboratorio/certificados-qualidade/',query='',screen=None,require=None))
        raw=catalog.read_text(encoding='utf-8')
        raw=raw.rstrip()
        if not raw.endswith(']'): raise RuntimeError('Catalog format changed')
        raw=raw[:-1].rstrip().rstrip(',') + ',\n  ' + json.dumps(records[-1],ensure_ascii=False,separators=(',',':')) + '\n]\n'
        catalog.write_text(raw,encoding='utf-8')

    access=root/'screen_access.py'; raw=access.read_text(encoding='utf-8')
    if "return BY_ID.get('labCertificados')" not in raw:
        raw=once(raw,"    query = parse_qs(uri.query)\n",
                 "    query = parse_qs(uri.query)\n    if path.startswith('/unificado/laboratorio/certificados-qualidade/'):\n        return BY_ID.get('labCertificados')\n")
    section_start=raw.index('def allowed_screens('); section_end=raw.index('\ndef screen_for_uri(',section_start)
    section=raw[section_start:section_end]
    if "allowed.append('labCertificados')" not in section:
        section=once(section,"return [row['id'] for row in CATALOG if row['id'] not in GUEST_FORBIDDEN_SCREENS",
                     "allowed = [row['id'] for row in CATALOG if row['id'] != 'labCertificados' and row['id'] not in GUEST_FORBIDDEN_SCREENS")
        marker="                     role_allows(user, row, planning_role, lab_users))]"
        section=once(section,marker,marker+"\n        if user['id'] == 'philippe' or any(BY_ID[item]['module'] == 'laboratorio' for item in allowed):\n            allowed.append('labCertificados')\n        return allowed")
        if "    allowed = [row['id'] for row in CATALOG if role_allows" in section:
            section=once(section,"    allowed = [row['id'] for row in CATALOG if role_allows",
                         "    allowed = [row['id'] for row in CATALOG if row['id'] != 'labCertificados' and role_allows")
            last=section.rfind('    return allowed')
            section=section[:last]+"    if user['id'] == 'philippe' or any(BY_ID[item]['module'] == 'laboratorio' for item in allowed):\n        allowed.append('labCertificados')\n"+section[last:]
        else:
            section=once(section,"    return [row['id'] for row in CATALOG if role_allows",
                         "    allowed = [row['id'] for row in CATALOG if row['id'] != 'labCertificados' and role_allows")
            section=section.rstrip()+"\n    if user['id'] == 'philippe' or any(BY_ID[item]['module'] == 'laboratorio' for item in allowed):\n        allowed.append('labCertificados')\n    return allowed\n\n"
        raw=raw[:section_start]+section+raw[section_end:]
    access.write_text(raw,encoding='utf-8')

    app=root/'app.py';raw=app.read_text(encoding='utf-8')
    section_start=raw.index('def laboratorio_authorize(')
    section_end=raw.index('\n@app.',section_start+10)
    section=raw[section_start:section_end]
    if "accepted = {'labCertificados'}" not in section:
        idx=section.index('        postes_read_screens = ')
        first=section.index('        if ',idx)
        section=section[:first]+"        if path.startswith('/unificado/laboratorio/certificados-qualidade/'):\n            accepted = {'labCertificados'}\n"+section[first:].replace('        if ','        elif ',1)
        section=once(section,"guest_action_allowed(user, screen['id'], method, path)):",
                     "(path.startswith('/unificado/laboratorio/certificados-qualidade/')\n                                or guest_action_allowed(user, screen['id'], method, path))):")
        raw=raw[:section_start]+section+raw[section_end:]
    app.write_text(raw,encoding='utf-8')
    for path in (app,access):compile(path.read_text(encoding='utf-8'),str(path),'exec')
    json.loads(catalog.read_text(encoding='utf-8'))
    print('Gateway patched:',root)


def menu(path:Path):
    raw=path.read_text(encoding='utf-8')
    if "id:'labCertificados'" not in raw:
        raw=once(raw,"      { label: 'Postes', items: [",
                 "      { label: 'Postes', items: [\n        { id:'labCertificados', label:'Certificados de qualidade', path:'certificados-qualidade/' },")
        path.write_text(raw,encoding='utf-8')
    print('Menu patched:',path)


def model_a(path:Path):
    raw=path.read_text(encoding='utf-8')
    if '["labCertificados",' not in raw:
        raw=once(raw,'      ["labPole", "Ensaio de postes", "laboratorio/novo/postes", "post"],',
                 '      ["labCertificados", "Certificados de qualidade", "laboratorio/certificados-qualidade/", "doc"],\n      ["labPole", "Ensaio de postes", "laboratorio/novo/postes", "post"],')
        path.write_text(raw,encoding='utf-8')
    print('Modelo A menu patched:',path)


def router(path:Path):
    raw=path.read_text(encoding='utf-8')
    if "path === 'laboratorio/certificados-qualidade/'" not in raw:
        raw=once(raw,"if (path === 'laboratorio/' ||",
                 "if (path === 'laboratorio/' || path === 'laboratorio/certificados-qualidade/' ||")
        path.write_text(raw,encoding='utf-8')
    print('Router patched:',path)


if __name__=='__main__':
    if sys.argv[1]=='gateway':patch(Path(sys.argv[2]))
    elif sys.argv[1]=='menu':menu(Path(sys.argv[2]))
    elif sys.argv[1]=='model_a':model_a(Path(sys.argv[2]))
    elif sys.argv[1]=='router':router(Path(sys.argv[2]))
    else:raise SystemExit('usage: patch_gateway.py gateway DIRECTORY | menu FILE')
