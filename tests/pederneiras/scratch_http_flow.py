"""Explicitly run only against disposable pcp_pederneiras_t4_test on the VPS."""
from datetime import datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo
import os

from fastapi.testclient import TestClient
from sqlalchemy import text

assert os.environ.get("PDR_SCRATCH_DB_URL", "").endswith("/pcp_pederneiras_t4_test"), "Scratch DB required"
os.environ["DATABASE_URL"] = os.environ["PDR_SCRATCH_DB_URL"]

from app.core.database import SessionLocal, get_db  # noqa: E402
from app.core.security import get_current_user  # noqa: E402
from app.main import app  # noqa: E402
from app.models.usuario import NivelAcesso, Usuario  # noqa: E402

today = datetime.now(ZoneInfo("America/Sao_Paulo")).date()
user = Usuario(id=9001, nome="Teste isolado", username="Ricardo", nivel_acesso=NivelAcesso.ADMIN, ativo=True)


def db_override():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = db_override
app.dependency_overrides[get_current_user] = lambda: user
client = TestClient(app, base_url="http://localhost")
base = "/api/producao/pederneiras"


def expect(response, status=200):
    assert response.status_code == status, (response.status_code, response.text[:600])
    return response.json() if "application/json" in response.headers.get("content-type", "") else response.content


with SessionLocal() as db:
    for statement in (
        "DELETE FROM producao.auditoria WHERE unidade_id=2",
        "DELETE FROM public.maodeobra WHERE unidade_id=2",
        "DELETE FROM public.maodeobra_dias WHERE unidade_id=2",
        "DELETE FROM public.atividades_mao_de_obra WHERE unidade_id=2",
        "DELETE FROM producao.apontamento_item i USING producao.apontamento_dia d WHERE i.apontamento_dia_id=d.id AND d.unidade_id=2",
        "DELETE FROM producao.apontamento_dia WHERE unidade_id=2",
        "DELETE FROM producao.produto WHERE unidade_id=2",
    ):
        db.execute(text(statement))
    db.execute(text("""
      INSERT INTO public.usuarios(id,nome,username,email,senha_hash,nivel_acesso,ativo,trocar_senha_primeiro_acesso)
      VALUES (9001,'Teste isolado','Ricardo','scratch@example.invalid','scratch','ADMIN',true,false)
      ON CONFLICT (id) DO NOTHING
    """))
    db.commit()

product = expect(client.post(base + "/produtos", json={"familia": "Teste", "descricao": "Poste sintético",
                                                 "cod_pro": "PDR-SCRATCH-1", "volume_m3": ".1250"}), 201)
assert product["id"] > 0
area = expect(client.post(base + "/areas", json={"descricao": "Equipe sintética", "tipo": "MOD", "ordem": 1}), 201)
assert area["id"] > 0
day = today.isoformat()
future = (today + timedelta(days=1)).isoformat()
expect(client.put(base + f"/apontamentos/{future}", json={"itens": []}), 422)
production = expect(client.put(base + f"/apontamentos/{day}", json={
    "itens": [{"produto_id": product["id"], "quantidade": 5}], "acao": "enviar", "origem": "desktop"}))
assert production["postes"] == 5 and Decimal(str(production["volume_m3"])) == Decimal("0.6250")
expect(client.post(base + f"/apontamentos/{day}/confirmar"), 409)
expect(client.put(base + f"/mao-de-obra/{day}", json={
    "areas": [{"atividade_id": area["id"], "homens": ".25"}], "origem": "pwa"}))
expect(client.post(base + f"/mao-de-obra/{day}/confirmar"))
expect(client.post(base + f"/apontamentos/{day}/confirmar"))
month = expect(client.get(base + f"/mensal?mes={day[:7]}"))
assert month["postes"] == 5 and Decimal(str(month["postes_homem"])) == Decimal("20.00")
assert month["dias"][0]["data"] == day and month["dias"][0]["mod"] == .25
assert expect(client.get("/api/maodeobra", params={"data_inicio": day, "data_fim": day})) == []
assert expect(client.get("/api/atividades-maodeobra")) == []
assert expect(client.get(base + f"/exportar/lt-pro-04.pdf?mes={day[:7]}"))[:5] == b"%PDF-"
assert expect(client.get(base + f"/exportar/lt-pro-04.xlsx?mes={day[:7]}"))[:2] == b"PK"
with SessionLocal() as db:
    audit = db.execute(text("SELECT count(*) FROM producao.auditoria WHERE unidade_id=2 AND campo IN ('quantidade','quantidade_pessoas')")).scalar_one()
    assert audit >= 2, audit
print(f"scratch HTTP flow OK: {day}, 5 posts, 0.25 people, {audit} quantity audits")
