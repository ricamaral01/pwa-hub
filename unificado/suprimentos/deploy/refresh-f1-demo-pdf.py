"""Regenera o PDF de demonstração F1 da homologação, sem criar pedido."""
import json
import sys
from pathlib import Path
import requests

root="https://concrefer.concretrack.com.br:18446"
tokens=json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
state=json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
session=requests.Session()
session.cookies.set("mapa_unificado_homolog_session",tokens["e2e-suprimentos-compras"],
    domain="concrefer.concretrack.com.br",path="/unificado/")
assert session.post(root+"/unificado/mapa/api/unified/suprimentos-bootstrap",timeout=20).status_code==200
response=session.get(root+f"/api/suprimentos/compras/pedidos/{state['pedido']}/pdf",timeout=20)
assert response.status_code==200 and response.content.startswith(b"%PDF-")
out=Path(state["pdf"])
out.write_bytes(response.content)
out.chmod(0o600)
print("DEMO_F1_PDF_OK",len(response.content))
