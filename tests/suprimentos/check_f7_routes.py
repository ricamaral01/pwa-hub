"""Inventário estático das rotas e do mecanismo de autorização de Suprimentos."""
from __future__ import annotations

import ast
import json
from pathlib import Path

ROOT = Path("unificado/suprimentos/service/suprimentos/api")
EXCEPTIONS = {"cadastros.health": "health sem dados de negócio",
              "cadastros.flags_for_gateway": "consulta de flags restrita ao gateway local",
              "integracao.receive_suggestion": "assertion assinada do Laboratório e flag S4",
              "integracao.laboratory_received": "assertion assinada do Laboratório e flag S4"}
rows = []
for path in sorted(ROOT.glob("*.py")):
    tree = ast.parse(path.read_text(encoding="utf-8"))
    for node in tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        routes = [ast.unparse(item) for item in node.decorator_list
                  if ast.unparse(item).startswith("router.")]
        if not routes:
            continue
        key = f"{path.stem}.{node.name}"
        signature = ast.unparse(node.args)
        protected = "current_actor" in signature or key in EXCEPTIONS
        rows.append({"rota": key, "linha": node.lineno, "mecanismo":
                    "identidade IAM" if "current_actor" in signature else EXCEPTIONS.get(key),
                    "protegida": protected})
        if not protected:
            raise AssertionError(f"Rota sem mecanismo de identidade: {key}")
out = Path("docs/porting/suprimentos/capturas/f7/rotas.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print("F7_ROUTES_OK", len(rows), "rotas; exceções técnicas", len(EXCEPTIONS))
