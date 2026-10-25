"""Add only the dedicated PWA static locations to a production vhost copy."""
import argparse
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    source = args.before.read_text(encoding="utf-8")
    marker = "    location = /unificado/mapa/operacao/sw.js {"
    if source.count(marker) != 1:
        raise SystemExit("Production vhost marker changed")
    addition = '''    location = /unificado/m/maodeobra/manifest.webmanifest {
        root /opt/concrefer-unificado/public;
        default_type application/manifest+json;
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    location = /unificado/m/maodeobra/sw.js {
        root /opt/concrefer-unificado/public;
        add_header Cache-Control "no-store" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

'''
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(source.replace(marker, addition + marker), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
