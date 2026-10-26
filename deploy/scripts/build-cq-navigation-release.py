"""Build the small CQ navigation release from a snapshot of the live shell.

The shell in this working branch predates the production navigation changes.
Using a production snapshot avoids replacing unrelated live menu behavior.
"""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path


VERSION = '1.0.98'


def replace_once(value: str, old: str, new: str, label: str) -> str:
    count = value.count(old)
    if count != 1:
        raise ValueError(f'{label}: expected exactly one anchor, found {count}')
    return value.replace(old, new, 1)


def write(target: Path, content: str) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8', newline='\n')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    snapshot, output = args.snapshot, args.output

    screen = (snapshot / 'screen_access.py').read_text(encoding='utf-8')
    screen = replace_once(screen,
        "    if path.startswith('/unificado/laboratorio/dosagem/'):\n        return BY_ID.get('labDosagem')\n",
        "    if path.startswith('/unificado/laboratorio/dosagem/'):\n        return BY_ID.get('labDosagem')\n"
        "    if path.startswith('/unificado/laboratorio/certificados-qualidade/'):\n"
        "        return BY_ID.get('labCertificados')\n", 'CQ screen mapping')
    write(output / 'mapa-api/screen_access.py', screen)

    menu = (snapshot / 'menu.config.js').read_text(encoding='utf-8')
    menu = replace_once(menu,
        "        { id:'labCertificados', label:'Certificados de qualidade', path:'/unificado/laboratorio/certificados-qualidade/' },",
        "        { id:'labCertificados', label:'Emitir certificado de qualidade', path:'/unificado/laboratorio/certificados-qualidade/' },\n"
        "        { id:'labCertificadosHistorico', label:'Histórico de certificados', path:'/unificado/laboratorio/certificados-qualidade/?tab=historico', permissionId:'labCertificados' },\n"
        "        { id:'labCertificadosCadastros', label:'Cadastros de certificados', path:'/unificado/laboratorio/certificados-qualidade/?tab=cadastros', permissionId:'labCertificados' },",
        'Quality root menu')
    write(output / 'public/unificado/shell/menu.config.js', menu)

    model = (snapshot / 'modelo-menu.js').read_text(encoding='utf-8')
    model = replace_once(model,
        ',xe("CERTIFICADOS", [\n      ["labCertificados", "Certificados de qualidade", "laboratorio/certificados-qualidade/", "doc"],',
        ',xe("CERTIFICADOS", [\n      ["labCertificados", "Emitir certificado de qualidade", "laboratorio/certificados-qualidade/", "doc"],\n'
        '      ["labCertificadosHistorico", "Histórico de certificados", "laboratorio/certificados-qualidade/?tab=historico", "history"],\n'
        '      ["labCertificadosCadastros", "Cadastros de certificados", "laboratorio/certificados-qualidade/?tab=cadastros", "database"],',
        'Quality model A menu')
    write(output / 'public/unificado/shell/modelo-a/menu.js', model)

    for name, destination in (
        ('shell.js', 'public/unificado/shell/shell.js'),
        ('modelo-a-loader.js', 'public/unificado/shell/modelo-a-loader.js'),
        ('shell-index.html', 'public/unificado/index.html'),
        ('sw.js', 'public/unificado/sw.js'),
    ):
        source = (snapshot / name).read_text(encoding='utf-8')
        if name == 'modelo-a-loader.js':
            source = replace_once(source, "import('./modelo-a/menu.js?v=1.0.58')",
                                  f"import('./modelo-a/menu.js?v={VERSION}')", name)
        else:
            if '1.0.97' not in source:
                raise ValueError(f'{name}: expected version 1.0.97')
            source = source.replace('1.0.97', VERSION)
        write(output / destination, source)
    write(output / 'public/unificado/VERSION', VERSION + '\n')

    static = root / 'unificado/laboratorio/certificados-qualidade/static'
    for name in ('index.html', 'app.css', 'app.js'):
        target = output / 'cq/static' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(static / name, target)


if __name__ == '__main__':
    main()
