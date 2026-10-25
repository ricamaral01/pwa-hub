"""Cria .env privado da Dosagem a partir da configuração pública do Hub.

Uso na VPS: python3 preparar_env.py /tmp/dosagem-auth-config.js [email@dominio]
Não imprime nem registra segredos. Não sobrescreve .env existente.
"""
from pathlib import Path
import re
import secrets
import sys
from urllib.parse import quote


def main() -> None:
    if len(sys.argv) not in (2, 3):
        raise SystemExit("Uso: preparar_env.py <auth/config.js> [admin_email]")
    fonte = Path(sys.argv[1]).read_text(encoding="utf-8")
    email = sys.argv[2].strip().lower() if len(sys.argv) == 3 else ""
    if email and not re.fullmatch(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", email):
        raise SystemExit("ADMIN_EMAIL inválido")
    url = re.search(r"supabaseUrl:\s*['\"]([^'\"]+)['\"]", fonte)
    chave = re.search(r"supabaseAnonKey:\s*['\"]([^'\"]+)['\"]", fonte)
    if not url or not chave:
        raise SystemExit("Configuração pública do Supabase não encontrada")
    destino = Path("/opt/concretrack-dosagem/shared/.env")
    destino.parent.mkdir(parents=True, exist_ok=True)
    senha = quote(secrets.token_urlsafe(32), safe="")
    conteudo = "\n".join([
        "AMBIENTE=prod",
        f"DATABASE_URL=postgresql+psycopg://dosagem_app:{senha}@127.0.0.1:5432/concretrack_dosagem",
        f"SUPABASE_URL={url.group(1)}",
        f"SUPABASE_ANON_KEY={chave.group(1)}",
        "JWT_SECRET=",
        "JWT_AUDIENCE=",
        f"ADMIN_EMAIL={email}",
        "PORTA=18300",
        "",
    ])
    with destino.open("x", encoding="utf-8") as arquivo:
        arquivo.write(conteudo)
    destino.chmod(0o600)
    print(f"Criado {destino} com permissão 600.")


if __name__ == "__main__":
    main()
