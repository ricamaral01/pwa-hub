"""Summarize the current private GET contract without copying response bodies."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / ".work-mapa-unificado" / "contract-read-tables-current.json"
OUT = ROOT / "docs" / "contrato-leituras-mapa-2026-10-04.md"

# Final UI outcomes were verified with compare_order_render.py on the same
# source snapshot. The pagination exception is checked by its own script.
OUTCOMES = {
    32: "Relatório: mesmos 415 registros; texto e total iguais (app agrega/ordena).",
    48: "Cartões: mesmas 209 chaves data/setor/forma; estado, cor e texto iguais.",
    57: "Página 1 do empate por data: 39 IDs mudam de página; avaliar junto à 58.",
    58: "Página 2: 1.056 IDs únicos no percurso, mesma coleção e indicadores.",
    60: "Acompanhamento S1: 67 linhas e resultado exibido iguais; app ordena por horário.",
    61: "Acompanhamento S2: 76 linhas e resultado exibido iguais; app ordena por horário.",
    62: "Acompanhamento S3: 46 linhas, cartões e texto iguais.",
    64: "Relatório S3: mesmos 46 registros; texto final igual.",
    70: "Dashboard S3: mesmas 46 formas, totais e cartões iguais.",
    74: "Helper de pendências: 46 registros iguais; sem tela chamadora no app atual.",
    76: "Mesmo helper com filtros invertidos: 46 registros iguais; sem tela chamadora.",
}


def main() -> None:
    cases = json.loads(REPORT.read_text(encoding="utf-8"))["cases"]
    diffs = [(i, case) for i, case in enumerate(cases, 1) if not case["equal"]]
    assert len(cases) == 78 and [i for i, _ in diffs] == list(OUTCOMES)
    lines = [
        "# Contrato de leituras brutas do Mapa — fotografia de 04/10/2026", "",
        "GET apenas na origem oficial. 67/78 corpos exatos. As 11 diferenças abaixo foram classificadas individualmente; os corpos completos ficam fora do repositório. `compare_order_render.py` compara a saída final do mesmo `app.js` nas duas respostas.", "",
        "| Chamada | Recurso e filtro | Registros oficial/teste | SHA-256 oficial | SHA-256 teste | Resultado final |",
        "|---:|---|---:|---|---|---|",
    ]
    for number, case in diffs:
        path = case["path_query"]
        resource = path.split("/rest/v1/", 1)[1].split("?", 1)[0]
        shape = case["difference_shape"] or {}
        count = "/".join(str(n) for n in shape.get("rows", []))
        label = resource + ("; paginação" if number in (57, 58) else "; ordem sem desempate")
        lines.append(f"| {number} | {label} | {count} | `{case['official_sha256']}` | `{case['test_sha256']}` | {OUTCOMES[number]} |")
    lines += [
        "", "As chamadas 57 e 58 não são iguais página a página: 39 IDs mudam de página por empate em `data_fabricacao`. O contrato só fica justificado se a varredura completa tiver 1.056 IDs únicos sem perda nem repetição; executar `contract_producao_pagination.py` sem gravações concorrentes após cada fotografia.", "",
        "As outras nove diferenças têm os mesmos registros em outra ordem. A comparação de renderização após esta fotografia encontrou igualdade nos sete grupos de estado, cartões, acompanhamento, relatório e inspeção, com 8/8 consultas correspondentes em cada lado. A chamada 73 sem HTTP está documentada em `docs/comportamentos-atuais-suspeitos.md`.", "",
    ]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"documented={len(diffs)} exact={len(cases)-len(diffs)}/{len(cases)} output={OUT}")


if __name__ == "__main__":
    main()
