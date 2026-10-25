"""Smoke HTTP do :18446 com contas sintéticas da homologação.

Uso: python smoke_e7_homolog.py <arquivo JSON protegido de logins> <saída JSON>
Não imprime nem grava senhas, cookies ou cabeçalhos de autenticação.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path
from uuid import uuid4
import requests

ROOT = "https://concrefer.concretrack.com.br:18446"
secrets = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
output = Path(sys.argv[2])
sessions = {}
results = []

def check(response, expected, label):
    results.append({"etapa":label,"http":response.status_code,"esperado":expected})
    if response.status_code != expected:
        raise RuntimeError(f"{label}: HTTP {response.status_code}, detalhe={response.text[:300]}")
    return response.json() if "application/json" in response.headers.get("Content-Type","") else response.text

def login(user):
    client=requests.Session()
    response=client.post(ROOT+"/unificado/mapa/api/login",json={"name":user,"password":secrets[user]},timeout=20)
    check(response,200,"login "+user)
    check(client.post(ROOT+"/unificado/mapa/api/unified/suprimentos-bootstrap",timeout=15),200,"bootstrap "+user)
    check(client.get(ROOT+"/api/suprimentos/me",timeout=15),200,"papel "+user)
    sessions[user]=client
    return client

sol=login("e2e-suprimentos-sol")
apr1=login("e2e-suprimentos-aprov1")
apr2=login("e2e-suprimentos-aprov2")
alm=login("e2e-suprimentos-almox")
buyer=login("e2e-suprimentos-compras")
quality=login("e2e-suprimentos-qualidade")

check(sol.get(ROOT+"/unificado/suprimentos/painel/",timeout=15),200,"tela painel")
check(sol.get(ROOT+"/unificado/suprimentos/pwa/",timeout=15),200,"PWA entrada")
manifest=check(sol.get(ROOT+"/unificado/suprimentos/pwa/manifest.webmanifest",timeout=15),200,"PWA manifesto")
check(sol.get(ROOT+"/unificado/suprimentos/pwa/sw.js",timeout=15),200,"PWA SW")
assert json.loads(manifest)["scope"]=="/unificado/suprimentos/pwa/"

cc=check(sol.get(ROOT+"/api/suprimentos/cadastros/centros-custo",timeout=15),200,"CC")["items"]
assert len(cc)==1 and cc[0]["codigo"]=="E2E-SUP"
un=check(sol.get(ROOT+"/api/suprimentos/cadastros/unidades-medida",timeout=15),200,"medidas")["items"]
measure=next(row["id"] for row in un if row["sigla"]=="un")
payload={"client_uuid":str(uuid4()),"cc_id":cc[0]["id"],"urgencia":"NORMAL",
         "justificativa":"Ensaio de homologação do fluxo Suprimentos",
         "itens":[{"descricao_livre":"Luva de teste E7","qtd":1,"un":measure}]}
created=check(sol.post(ROOT+"/api/suprimentos/pwa/solicitacoes",json=payload,timeout=15),200,"criar PWA")
rid=created["id"]; item=created["itens"][0]["id"]
for n in range(5):
    duplicate=check(sol.post(ROOT+"/api/suprimentos/pwa/solicitacoes",json=payload,timeout=15),200,f"reenvio {n+1}")
    assert duplicate["id"]==rid

check(quality.post(ROOT+f"/api/suprimentos/solicitacoes/{rid}/aprovar",json={},timeout=15),403,"qualidade sem aprovação")
check(buyer.post(ROOT+f"/api/suprimentos/itens/{item}/preco",json={"preco":"2500.01"},timeout=15),200,"preço para duas alçadas")
sent=check(sol.post(ROOT+f"/api/suprimentos/solicitacoes/{rid}/enviar",json={},timeout=15),200,"enviar")
assert sent["niveis_total"]==2
check(apr2.post(ROOT+f"/api/suprimentos/solicitacoes/{rid}/aprovar",json={},timeout=15),403,"nível 2 antes do 1")
check(apr1.post(ROOT+f"/api/suprimentos/solicitacoes/{rid}/aprovar",json={},timeout=15),200,"aprovar nível 1")
check(apr2.post(ROOT+f"/api/suprimentos/solicitacoes/{rid}/aprovar",json={},timeout=15),200,"aprovar nível 2")
check(alm.post(ROOT+f"/api/suprimentos/itens/{item}/separar",json={},timeout=15),200,"separar")
check(alm.post(ROOT+f"/api/suprimentos/itens/{item}/entregar",json={"qtd":1},timeout=15),200,"entregar")
check(sol.post(ROOT+f"/api/suprimentos/solicitacoes/{rid}/confirmar-recebimento",json={},timeout=15),200,"confirmar")
final=check(sol.get(ROOT+f"/api/suprimentos/solicitacoes/{rid}",timeout=15),200,"detalhe final")
assert final["status"]=="CONCLUIDA"

anonymous=requests.get(ROOT+"/api/suprimentos/me",timeout=15)
check(anonymous,401,"API sem sessão")
check(requests.get(ROOT+"/unificado/suprimentos/pwa/",timeout=15),403,"PWA sem sessão")
check(sol.get(ROOT+"/api/suprimentos/solicitacoes?unidade=pederneiras",timeout=15),403,"outra unidade")

output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({"ok":True,"solicitacao":final["numero"],"total_verificacoes":len(results),
                              "verificacoes":results},ensure_ascii=False,indent=2),encoding="utf-8")
print(f"SMOKE_OK verificacoes={len(results)} solicitacao={final['numero']}")
