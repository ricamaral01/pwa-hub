"""Detector de segredos: saída contém somente caminho, linha e tipo, nunca valor."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/porting/suprimentos/capturas/f7/segredos.json"
PATTERNS = {
    "chave_privada": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "aws_access_key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "token_provedor": re.compile(r"(?:ghp_|github_pat_|sk-)[A-Za-z0-9_\-]{20,}"),
    "dsn_com_senha": re.compile(r"(?:postgres(?:ql)?|mysql|mongodb)://[^\s:@]+:[^\s@]+@"),
    "atributo_sensivel": re.compile(r"(?i)(?:password|senha|secret|signing_key|api_key|token)\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
}


def git(*args):
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True).stdout


def main():
    files = [Path(x.decode()) for x in git("ls-files", "-z").split(b"\0") if x]
    findings = []
    for relative in files:
        name = relative.as_posix()
        if not name.startswith(("unificado/suprimentos/", "tests/suprimentos/", "docs/porting/suprimentos/")):
            continue
        if relative.suffix.lower() not in {".py", ".js", ".sh", ".json", ".md", ".mmd", ".sql", ".ini"}:
            continue
        if "/manual/img/" in name or name.endswith(("manual-suprimentos.html", "capturas.json")) or "/capturas/" in name:
            continue
        try:
            lines = (ROOT / relative).read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeError):
            continue
        for number, line in enumerate(lines, 1):
            for kind, pattern in PATTERNS.items():
                if pattern.search(line):
                    findings.append({"caminho": name, "linha": number,
                                     "tipo": "fixture_de_teste" if name.startswith("tests/") and kind == "atributo_sensivel" else kind})
    legacy = "dosagem-concreto-v2/.env.production"
    if legacy.encode() in git("ls-tree", "-r", "-z", "--name-only", "HEAD").split(b"\0"):
        body = git("show", "HEAD:" + legacy).decode("utf-8", errors="replace")
        lines = body.splitlines()
        for number, line in enumerate(lines, 1):
            if re.match(r"\s*(?:#|$)", line):
                continue
            if "=" in line:
                findings.append({"caminho": legacy, "linha": number, "tipo": "env_legado_rastreado_no_HEAD"})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(findings, ensure_ascii=False, indent=2), encoding="utf-8")
    counts = {}
    for row in findings:
        counts[row["tipo"]] = counts.get(row["tipo"], 0) + 1
    print("F7_SECRET_SCAN", counts, "arquivo=", OUT)


if __name__ == "__main__":
    main()
