"""Gera o índice estático das chamadas de dados do Mapa original.

O índice não executa app.js nem acessa a rede. A matriz de contratos é revisada
manualmente e complementada com capturas de navegador sem rede antes de liberar
qualquer gravação no unificado.
"""

from __future__ import annotations

from pathlib import Path
from collections import Counter
import json
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "mapa-concretagem" / "app.js"
TARGET = ROOT / "docs" / "matriz-chamadas-mapa.md"
CAPTURE = ROOT / ".work-mapa-unificado" / "requests-original.json"
FUNC = re.compile(r"^\s*(?:(?:async\s+)?function\s+|window\.)([\w$]+)\s*(?:=\s*(?:async\s+)?function\s*)?\(")
CALL = re.compile(r"(?:\.from\(|\.rpc\(|\.channel\(|\bfetch\(|\bpostToApi\(|\bpostToMontagemApi\()")
NAME = re.compile(r"\.(?:from|rpc|channel)\(\s*(['\"])(.*?)\1")
METHOD = re.compile(r"\.(select|insert|update|upsert|delete)\(")


def escape(value: str) -> str:
    return value.replace("|", "\\|").replace("`", "'").replace("\n", " ").strip()


def main() -> None:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    rows = []
    function = "inicialização/escopo global"
    for index, line in enumerate(lines):
        match = FUNC.match(line)
        if match:
            function = match.group(1)
        if not CALL.search(line):
            continue
        if "Array.from(" in line or "html2pdf()" in line or line.lstrip().startswith("//"):
            continue
        if re.search(r"(?:async function|window\.[\w$]+\s*=\s*async function)\s*\w*\s*\([^)]*\)\s*\{", line):
            continue
        kind = "fetch" if "fetch(" in line else "Supabase"
        if "postToApi(" in line:
            kind = "ação postToApi"
        elif "postToMontagemApi(" in line:
            kind = "ação postToMontagemApi"
        elif ".rpc(" in line:
            kind = "RPC"
        elif ".channel(" in line:
            kind = "Realtime"
        snippet = " ".join(part.strip() for part in lines[index:index + 12])
        target_snippet = " ".join(part.strip() for part in lines[index:index + 2])
        target = NAME.search(target_snippet)
        if kind.startswith("ação"):
            action = re.search(r"postTo(?:Montagem)?Api\(\s*(['\"])(.*?)\1", snippet)
            name = action.group(2) if action else "dinâmica"
        elif kind == "fetch":
            call = line.split("fetch(", 1)[1]
            name = call.split(",", 1)[0].strip()[:90]
        else:
            dynamic = re.search(r"\.(?:from|rpc|channel)\(\s*([\w.]+)", target_snippet)
            name = target.group(2) if target else (dynamic.group(1) if dynamic else "dinâmica")
        operation = "GET/indefinido" if kind == "fetch" else "—"
        if kind == "RPC":
            operation = "POST /rpc"
        elif kind == "Realtime":
            operation = "assinatura"
        elif kind.startswith("ação"):
            operation = "chamada interna"
        elif kind == "Supabase":
            op = METHOD.search(snippet)
            operation = op.group(1).upper() if op else "consulta montada depois"
        if kind == "fetch" and "fetch(photoBase64)" not in line:
            method = re.search(r"method:\s*['\"](GET|POST|PUT|PATCH|DELETE)['\"]", snippet)
            if method:
                operation = method.group(1)
        if "fetch(photoBase64)" in line:
            kind, name, operation = "recurso local", "photoBase64", "leitura de data URL"
        rows.append((index + 1, function, kind, name, operation))

    header = """# Matriz de chamadas do Mapa original

**Fonte:** `mapa-concretagem/app.js`. Gerada por `python scripts/inventory_mapa_calls.py`.

Este é o **índice estático inicial**. Cada linha aponta para uma chamada identificada no código original. As colunas, filtros, ordenação, chave de conflito, resposta, erro e fluxo precisam ser conferidos no código e por captura de navegador com toda a rede interceptada antes de considerar B1/B2 concluídos. Chamadas dinâmicas e métodos montados em variáveis exigem revisão manual.

| Linha | Função ou fluxo inicial | Tipo | Alvo/ação | Operação inicial |
|---:|---|---|---|---|
"""
    body = "".join(
        f"| {line} | `{escape(function)}` | {kind} | `{escape(target)}` | {operation} |\n"
        for line, function, kind, target, operation in rows
    )
    content = header + body + f"\n**Chamadas identificadas:** {len(rows)}.\n"
    if CAPTURE.is_file():
        capture = json.loads(CAPTURE.read_text(encoding="utf-8"))
        counts = Counter((item["flow"], item["method"], item["path_query"].split("?", 1)[0])
                         for item in capture["requests"])
        content += (
            "\n## Captura de navegador sem rede externa\n\n"
            "O script `scripts/capture_mapa_requests_offline.py` carregou o `app.js` original, "
            "bloqueou todas as solicitações externas e respondeu com dados sintéticos. "
            f"Foram testados {len(capture['modes'])} modos e interceptados "
            f"{capture['external_requests_blocked']} pedidos externos. "
            "O arquivo completo da captura fica fora do Git em `.work-mapa-unificado/requests-original.json`.\n\n"
            "| Fluxo | Método | Caminho | Pedidos |\n|---|---|---|---:|\n"
        )
        content += "".join(f"| {escape(flow)} | {method} | `{escape(path)}` | {count} |\n"
                           for (flow, method, path), count in sorted(counts.items()))
        content += (
            "\nA captura inclui navegação, programação e desprogramação por cartão, liberação "
            "e concretagem com tipo no Setor 3. Permanecem pendentes capturas de cancelamento "
            "Odin, manutenção, mandril, inspeção, montagem, fotos, segunda inspeção, retrabalho, "
            "relatórios, exportações e permissões por perfil. Esta matriz ainda não libera a "
            "implementação operacional.\n"
        )
    TARGET.write_text(content, encoding="utf-8")
    print(f"{len(rows)} referências registradas em {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
