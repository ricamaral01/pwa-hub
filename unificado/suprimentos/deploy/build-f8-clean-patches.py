"""Monta patches só de Suprimentos sobre cópia lida da produção atual.

Uso: python build-f8-clean-patches.py <diretório com app.py, shell.js,
router.js, menu.config.js, menu.js, screen_catalog.json>
"""
from __future__ import annotations

import difflib
import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "docs/porting/suprimentos/pacote-producao/patches"


def once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise AssertionError(f"Âncora não única: {old[:80]!r}, ocorrências={text.count(old)}")
    return text.replace(old, new, 1)


def patch(old: str, new: str, name: str) -> str:
    return "".join(difflib.unified_diff(old.splitlines(True), new.splitlines(True),
        fromfile="a/" + name, tofile="b/" + name, n=3))


def main(prod_dir: Path):
    prod_dir = prod_dir.resolve()
    mapping = {
        "app.py": "unificado/mapa/api/app.py",
        "shell.js": "unificado/shell/shell.js",
        "router.js": "unificado/shell/router.js",
        "menu.config.js": "unificado/shell/menu.config.js",
        "menu.js": "unificado/shell/modelo-a/menu.js",
        "screen_catalog.json": "unificado/mapa/api/screen_catalog.json",
    }
    original = {target: (prod_dir / short).read_text(encoding="utf-8")
                for short, target in mapping.items()}
    target = dict(original)

    # Mapa: somente bootstrap/assertion/flags do Suprimentos. GED e outras frentes
    # presentes no app.py local ficam fora desta série.
    path = "unificado/mapa/api/app.py"
    text = target[path]
    text = once(text,
        "    return allowed_screens(user, planning_role, overrides, lab_users), planning_role\n",
        "    allowed = allowed_screens(user, planning_role, overrides, lab_users)\n"
        "    if any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in allowed) and not supply_flags().get('S1'):\n"
        "        allowed = [item for item in allowed if SCREENS_BY_ID[item]['module'] != 'suprimentos']\n"
        "    return allowed, planning_role\n")
    text = once(text,
        "    response = jsonify(ok=True, screens=allowed, preview_modules=preview_modules)\n",
        "    suprimentos_enabled = any(SCREENS_BY_ID[item]['module'] == 'suprimentos' for item in allowed)\n"
        "    response = jsonify(ok=True, screens=allowed, preview_modules=preview_modules,\n"
        "                       suprimentos_flags=supply_flags() if suprimentos_enabled else {},\n"
        "                       suprimentos_enabled=suprimentos_enabled)\n")
    text = once(text,
        '    response.delete_cookie(LAB_COOKIE_NAME, path="/unificado/laboratorio/")\n',
        '    response.delete_cookie(LAB_COOKIE_NAME, path="/unificado/laboratorio/")\n'
        '    response.delete_cookie(SUPRIMENTOS_COOKIE_NAME, path="/api/suprimentos/")\n'
        '    response.delete_cookie(SUPRIMENTOS_COOKIE_NAME, path="/unificado/suprimentos/")\n'
        '    response.delete_cookie(SUPRIMENTOS_REFRESH_COOKIE_NAME, path="/unificado/suprimentos/")\n')
    local_app = (ROOT / path).read_text(encoding="utf-8")
    supply_block = local_app.split("# Suprimentos: extensão isolada do gateway.", 1)[1].split(
        "from usina_integration import register as register_usina_integration", 1)[0]
    text = once(text, "from usina_integration import register as register_usina_integration",
                "# Suprimentos: extensão isolada do gateway." + supply_block +
                "from usina_integration import register as register_usina_integration")
    target[path] = text

    path = "unificado/mapa/api/screen_catalog.json"
    local_lines = (ROOT / path).read_text(encoding="utf-8").splitlines()
    supply_lines = [line for line in local_lines if '"module":"suprimentos"' in line]
    assert len(supply_lines) == 10
    assert not any('"module":"suprimentos"' in line for line in target[path].splitlines())
    target[path] = once(target[path], "\n]\n", ",\n" + "\n".join(supply_lines) + "\n]\n")
    json.loads(target[path])

    path = "unificado/shell/menu.config.js"
    text = once(target[path], "const USINAS_BASE = new URL('usinas/', UNIFICADO_BASE);\n",
        "const USINAS_BASE = new URL('usinas/', UNIFICADO_BASE);\n"
        "const SUPRIMENTOS_BASE = new URL('suprimentos/', UNIFICADO_BASE);\n")
    local_menu = (ROOT / path).read_text(encoding="utf-8")
    start = local_menu.index("  suprimentos: {")
    end = local_menu.index("\n  }\n};\n\nconst MENU_ITEMS", start) + len("\n  }")
    supply_menu = local_menu[start:end]
    text = once(text, "\n  }\n};\n\nconst MENU_ITEMS",
                "\n  },\n" + supply_menu + "\n};\n\nconst MENU_ITEMS")
    text = once(text, "      : module === 'qualidade'\n",
        "      : module === 'suprimentos'\n"
        "      ? new URL(item.path, SUPRIMENTOS_BASE).href\n"
        "      : module === 'qualidade'\n")
    target[path] = text

    path = "unificado/shell/router.js"
    text = target[path]
    text = once(text, "    return null;\n  }\n\n  function screenFor(route)",
        "    if (/^suprimentos\\/(?:painel|solicitacoes|solicitacao|nova|fornecedores|cotacoes|recebimento|analises|almoxarifado|inventario|cadastros)\\/$/.test(path))\n"
        "      return {url, module:'suprimentos', path};\n"
        "    return null;\n  }\n\n  function screenFor(route)")
    text = once(text,
        "    const found = Object.entries(MENU_ITEMS).find(([, item]) => item.url === route.url.href);",
        "    if (route.module === 'suprimentos' && route.path === 'suprimentos/solicitacao/') return 'suprimentosSolicitacoes';\n"
        "    if (route.module === 'suprimentos' && route.path === 'suprimentos/fornecedores/') return 'suprimentosFornecedores';\n"
        "    if (route.module === 'suprimentos' && route.path === 'suprimentos/cotacoes/') return 'suprimentosCotacoes';\n"
        "    if (route.module === 'suprimentos' && route.path === 'suprimentos/recebimento/') return 'suprimentosRecebimento';\n"
        "    if (route.module === 'suprimentos' && route.path === 'suprimentos/analises/') return 'suprimentosIndicadores';\n"
        "    const found = Object.entries(MENU_ITEMS).find(([, item]) => item.url === route.url.href);")
    text = once(text, "    if (route.module === 'qualidade' && !hasMapa) return;\n",
        "    if (route.module === 'qualidade' && !hasMapa) return;\n"
        "    if (route.module === 'suprimentos' && !hasMapa) return;\n")
    local_router = (ROOT / path).read_text(encoding="utf-8")
    supply_bootstrap = local_router.split("    if (route.module === 'suprimentos') {\n", 1)[1].split(
        "    if (ticket !== pending) return;", 1)[0]
    text = once(text, "    if (ticket !== pending) return;\n    if (route.path === 'laboratorio/dosagem/')",
        "    if (route.module === 'suprimentos') {\n" + supply_bootstrap +
        "    if (ticket !== pending) return;\n    if (route.path === 'laboratorio/dosagem/')")
    target[path] = text

    path = "unificado/shell/shell.js"
    a = target[path].splitlines(True)
    b = (ROOT / path).read_text(encoding="utf-8").splitlines(True)
    ops = difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
    selected = [op for op in ops if op[0] != "equal" and
                "suprimentos" in "".join(b[op[3]:op[4]]).lower()]
    assert len(selected) == 8, len(selected)
    for tag, i1, i2, j1, j2 in reversed(selected):
        a[i1:i2] = b[j1:j2]
    target[path] = "".join(a)

    path = "unificado/shell/modelo-a/menu.js"
    text = once(target[path], '  ged: "#9B7BF0"\n',
        '  ged: "#9B7BF0",\n  suprimentos: "#2DD4BF"\n')
    local_bundle = (ROOT / path).read_text(encoding="utf-8")
    start = local_bundle.index('  { id: "suprimentos", label: "Suprimentos"')
    end = local_bundle.index('\n  ] }\n], qf = [', start) + len('\n  ] }')
    supply_bundle = local_bundle[start:end].replace("cn.suprimentos", "Dn.suprimentos").replace("pe(", "xe(")
    text = once(text, "  ] }\n], qf = [",
        "  ] },\n" + supply_bundle + "\n], qf = [")
    target[path] = text

    OUT.mkdir(parents=True, exist_ok=True)
    groups = {
        "01-gateway-catalog.patch": ("unificado/mapa/api/app.py", "unificado/mapa/api/screen_catalog.json"),
        "02-shell-rotas.patch": ("unificado/shell/menu.config.js", "unificado/shell/router.js", "unificado/shell/shell.js"),
        "03-modelo-a-bundle.patch": ("unificado/shell/modelo-a/menu.js",),
    }
    for filename, names in groups.items():
        body = "".join(patch(original[name], target[name], name) for name in names)
        (OUT / filename).write_text(body, encoding="utf-8", newline="\n")
        print(filename, len(body.splitlines()), "linhas")

    audit = []
    for short, name in mapping.items():
        before = original[name].splitlines()
        after = (ROOT / name).read_text(encoding="utf-8").splitlines()
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, before, after,
                                                                autojunk=False).get_opcodes():
            if tag == "equal":
                continue
            block = "\n".join(after[j1:j2]).lower()
            supply = "suprimentos" in block or "sup_" in block
            other = any(word in block for word in ("ged_", "ged-access", "usinas_", "dosagem", "pcp_"))
            kind = "misto — separado no patch" if supply and other else (
                "suprimentos" if supply else "outra frente ou rebuild")
            audit.append((name, f"{i1+1}-{i2}", f"{j1+1}-{j2}", tag, kind,
                "bundle gerado" if short == "menu.js" else "comparação de bytes com produção"))
    audit_path = OUT.parent / "auditoria-trechos.csv"
    with audit_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(("arquivo", "linhas_producao", "linhas_branch", "operacao", "classe", "observacao"))
        writer.writerows(audit)
    print("AUDITORIA_TRECHOS", len(audit), "hunks")

    # A fonte React não reside na VPS. A base verificável é o pai do commit E3;
    # o bundle 03 acima cobre os bytes efetivamente publicados em produção.
    source_name = "unificado/sidebar-modelo-a/src/components/sidebar/navConfig.ts"
    baseline = subprocess.run(["git", "show", "4cdb7286^:" + source_name],
        cwd=ROOT, check=True, capture_output=True).stdout.decode("utf-8")
    current = (ROOT / source_name).read_text(encoding="utf-8")
    a, b = baseline.splitlines(True), current.splitlines(True)
    selected = [op for op in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
                if op[0] != "equal" and "suprimentos" in "".join(b[op[3]:op[4]]).lower()]
    assert len(selected) == 2, len(selected)
    for tag, i1, i2, j1, j2 in reversed(selected):
        a[i1:i2] = b[j1:j2]
    source_target = "".join(a)
    source_audit = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, baseline.splitlines(),
            current.splitlines(), autojunk=False).get_opcodes():
        if tag == "equal":
            continue
        supply = "suprimentos" in "\n".join(current.splitlines()[j1:j2]).lower()
        source_audit.append((source_name, f"{i1+1}-{i2}", f"{j1+1}-{j2}", tag,
                             "suprimentos" if supply else "outra frente ou rebuild",
                             "base Git anterior à E3; fonte ausente na VPS"))
    with audit_path.open("a", encoding="utf-8", newline="") as handle:
        csv.writer(handle).writerows(source_audit)
    print("AUDITORIA_TOTAL", len(audit) + len(source_audit), "hunks")
    source_patch = OUT / "04-modelo-a-fonte.patch"
    source_patch.write_text(patch(baseline, source_target, source_name),
                            encoding="utf-8", newline="\n")
    print(source_patch.name, len(source_patch.read_text(encoding="utf-8").splitlines()), "linhas")

    # Copia de teste com os bytes de produção: git apply valida contexto e conteúdo.
    work = prod_dir / "aplicacao-teste"
    work.mkdir(exist_ok=True)
    for name, body in original.items():
        dst = work / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(body, encoding="utf-8", newline="\n")
    for filename in groups:
        file = OUT / filename
        subprocess.run(["git", "apply", "--check", str(file)], cwd=work, check=True)
        subprocess.run(["git", "apply", str(file)], cwd=work, check=True)
    for name, body in target.items():
        assert (work / name).read_text(encoding="utf-8") == body, name
    subprocess.run(["python", "-m", "py_compile", str(work / "unificado/mapa/api/app.py")], check=True)
    for name in ("menu.config.js", "router.js", "shell.js", "modelo-a/menu.js"):
        subprocess.run(["node", "--check", str(work / "unificado/shell" / name)], check=True)
    source_work = prod_dir / "aplicacao-fonte-teste"
    dst = source_work / source_name
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(baseline, encoding="utf-8", newline="\n")
    subprocess.run(["git", "apply", "--check", str(source_patch)], cwd=source_work, check=True)
    subprocess.run(["git", "apply", str(source_patch)], cwd=source_work, check=True)
    assert dst.read_text(encoding="utf-8") == source_target
    print("F8_PATCH_APPLY_OK", len(target), "arquivos de produção e fonte Modelo A")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Uso: build-f8-clean-patches.py <cópia da produção>")
    main(Path(sys.argv[1]))
