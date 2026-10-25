"""Export the Dosagem projects and their build into one reviewable Markdown file."""

from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path


BASE = Path(__file__).resolve().parents[2]
OUTPUT = BASE / "docs/dosagem-v2/PROJETO-COMPLETO-CODIGO-HTML-20261021.md"
ROOTS = (
    BASE / "dosagem-concreto",
    BASE / "dosagem-concreto-v2",
    BASE / "docs/dosagem-v2",
)
EXCLUDED_PARTS = {
    ".git", "node_modules", "vendor", ".venv", "__pycache__",
    ".pytest_cache", "test-results", ".vite", ".mypy_cache",
    "src.bak-layout-20261021",
}
EXCLUDED_NAMES = {".env", ".env.production", ".env.local", "ADMIN_SENHA_INICIAL.txt"}
TEXT_SUFFIXES = {
    ".html", ".htm", ".css", ".js", ".mjs", ".ts", ".tsx",
    ".py", ".gs", ".md", ".json", ".sql", ".sh", ".ps1",
    ".yml", ".yaml", ".toml", ".ini", ".conf", ".nginx",
    ".service", ".timer", ".mako", ".txt", ".webmanifest",
    ".gitignore", ".example", ".hml",
}
EXCLUDED_SUFFIXES = {".log", ".tsbuildinfo", ".map", ".tag"}
LANGUAGES = {
    ".html": "html", ".htm": "html", ".css": "css", ".js": "javascript",
    ".mjs": "javascript", ".ts": "typescript", ".tsx": "tsx",
    ".py": "python", ".gs": "javascript", ".md": "markdown",
    ".json": "json", ".webmanifest": "json", ".sh": "bash",
    ".ps1": "powershell", ".sql": "sql", ".yml": "yaml", ".yaml": "yaml",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fence_for(source: str) -> str:
    # Four backticks are enough for most files; grow if source contains a longer run.
    longest = max((len(match.group(0)) for match in re.finditer(r"`+", source)), default=0)
    return "`" * max(4, longest + 1)


def main() -> None:
    included: list[Path] = []
    omitted: list[Path] = []
    for root in ROOTS:
        for path in root.rglob("*"):
            if not path.is_file() or path == OUTPUT:
                continue
            relative_parts = path.relative_to(BASE).parts
            if any(part in EXCLUDED_PARTS for part in relative_parts):
                continue
            if path.name in EXCLUDED_NAMES or path.name.startswith(".env.") and path.name != ".env.example":
                omitted.append(path)
                continue
            if path.suffix.lower() in TEXT_SUFFIXES and path.suffix.lower() not in EXCLUDED_SUFFIXES:
                try:
                    path.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    omitted.append(path)
                else:
                    included.append(path)
            else:
                omitted.append(path)

    included.sort(key=lambda p: p.relative_to(BASE).as_posix().lower())
    omitted.sort(key=lambda p: p.relative_to(BASE).as_posix().lower())
    lines = [
        "# Dosagem de concreto — código completo em Markdown",
        "",
        f"Exportado em {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} do workspace local.",
        "",
        "Este documento contém o código textual do legado, da Dosagem v2, o HTML de origem e o HTML e assets textuais gerados em `dist/`. "
        "Cada bloco reproduz o conteúdo UTF-8 do arquivo indicado. Para recuperar um arquivo, copie apenas o conteúdo do bloco correspondente.",
        "",
        "## Estado e acesso",
        "",
        "- Piloto: https://dosagem.concretrack.com.br/",
        "- Empacotamento: https://dosagem.concretrack.com.br/#/dosagem/empacotamento",
        "- Volume: https://dosagem.concretrack.com.br/#/dosagem/volume",
        "- O legado segue oficial; as cartas do piloto não estão liberadas para produção.",
        "- Comandos locais da v2: `npm ci`, `npm run build`, `npm run gates -- --perfil piloto`, `npm run gates`.",
        "- A implantação oficial depende dos portões F1–F4 da Release 1 e da decisão sobre os dados do piloto.",
        "",
        "## Manifesto do código incluído",
        "",
        f"{len(included)} arquivos textuais incluídos.",
        "",
        "| Arquivo | Bytes | SHA-256 |",
        "|---|---:|---|",
    ]
    for path in included:
        relative = path.relative_to(BASE).as_posix()
        lines.append(f"| `{relative}` | {path.stat().st_size} | `{sha256(path)}` |")
    lines.extend(["", "## Arquivos fora dos blocos de código", "", "Binários, planilhas, capturas, arquivos de log, cache, dependências instaladas e arquivos de ambiente não são convertidos em código Markdown. O manifesto abaixo permite identificar os artefatos existentes.", "", "| Arquivo | Bytes | SHA-256 |", "|---|---:|---|"])
    for path in omitted:
        relative = path.relative_to(BASE).as_posix()
        if path.name in EXCLUDED_NAMES or path.name.startswith(".env.") and path.name != ".env.example":
            lines.append(f"| `{relative}` | omitido | omitido (ambiente/segredo) |")
        else:
            lines.append(f"| `{relative}` | {path.stat().st_size} | `{sha256(path)}` |")
    lines.extend(["", "## Código por arquivo", ""])
    for path in included:
        relative = path.relative_to(BASE).as_posix()
        source = path.read_text(encoding="utf-8")
        fence = fence_for(source)
        language = LANGUAGES.get(path.suffix.lower(), "text")
        lines.extend([f"### `{relative}`", "", f"{fence}{language}", source.rstrip("\n"), fence, ""])
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{OUTPUT}: {len(included)} arquivos, {OUTPUT.stat().st_size} bytes, SHA-256 {sha256(OUTPUT)}")


if __name__ == "__main__":
    main()
