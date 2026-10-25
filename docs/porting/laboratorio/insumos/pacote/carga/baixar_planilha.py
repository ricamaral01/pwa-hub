#!/usr/bin/env python3
"""
Baixa a planilha da Carta Traço como .xlsx usando uma conta de serviço do Google
(usada só no modo espelho, antes do corte).

Pré-requisitos:
  pip install google-auth requests
  1. Criar conta de serviço no Google Cloud, baixar a chave JSON para /etc/concretrack/google-sa.json (chmod 600)
  2. Compartilhar a planilha com o e-mail da conta de serviço, como LEITOR
  3. Ativar a Google Drive API no projeto

Uso:
  python baixar_planilha.py --planilha-id <ID> --chave /etc/concretrack/google-sa.json --saida /var/lib/carta-traco/legado.xlsx
"""
import argparse
import os
import tempfile

import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--planilha-id", default=os.environ.get("CARTA_TRACO_SHEET_ID"), required=False)
    ap.add_argument("--chave", default=os.environ.get("GOOGLE_SA_JSON", "/etc/concretrack/google-sa.json"))
    ap.add_argument("--saida", required=True)
    a = ap.parse_args()
    if not a.planilha_id:
        ap.error("informe --planilha-id ou CARTA_TRACO_SHEET_ID")
    cred = service_account.Credentials.from_service_account_file(
        a.chave, scopes=["https://www.googleapis.com/auth/drive.readonly"])
    cred.refresh(Request())
    r = requests.get(f"https://www.googleapis.com/drive/v3/files/{a.planilha_id}/export",
                     params={"mimeType": XLSX}, headers={"Authorization": f"Bearer {cred.token}"}, timeout=60)
    r.raise_for_status()
    pasta = os.path.dirname(os.path.abspath(a.saida))
    os.makedirs(pasta, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=pasta, delete=False, suffix=".xlsx") as f:   # troca atômica
        f.write(r.content)
    os.replace(f.name, a.saida)
    print(f"ok {len(r.content)} bytes → {a.saida}")


if __name__ == "__main__":
    main()
