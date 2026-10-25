"""D1: run the repository's previous API code on the newly migrated schema."""
import io
import os
import subprocess
import tarfile
import tempfile
from pathlib import Path

from app.modelos import Usuario


def test_n_minus_one_code_reads_new_schema(ambiente):
    _, factory, _ = ambiente
    with factory.begin() as session:
        session.add(Usuario(email="old@example.test", nome="Old", papel="admin", unidades=["*"], ativo=True))
    repo = Path(__file__).resolve().parents[3]
    archive = subprocess.check_output(["git", "archive", "HEAD", "dosagem-concreto-v2/api/app"], cwd=repo)
    with tempfile.TemporaryDirectory() as tmp:
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            tar.extractall(tmp, filter="data")
        old_api = Path(tmp) / "dosagem-concreto-v2/api"
        code = """
import json, time, jwt
from fastapi.testclient import TestClient
from app.config import Config
from app.main import create_app
cfg=Config(database_url=__import__('os').environ['DATABASE_URL'],ambiente='dev',jwt_secret='previous-release-test-secret-32-bytes',jwt_audience='old-test',admin_email='old@example.test')
client=TestClient(create_app(cfg))
health=client.get('/api/v1/saude')
token=jwt.encode({'email':'old@example.test','exp':int(time.time())+60,'aud':'old-test'},cfg.jwt_secret,algorithm='HS256')
request_id='6ad51610-a5f8-4fc6-bff6-cc9a2b9b9276'
listing=client.post('/api/v1/rpc',headers={'Authorization':'Bearer '+token,'Idempotency-Key':request_id},json={'acao':'tracos.listar','requestId':request_id,'dados':{}})
print(json.dumps({'health':health.status_code,'listing':listing.status_code,'ok':listing.json().get('ok')}))
"""
        env = {**os.environ, "DATABASE_URL": ambiente[2].database_url, "PYTHONPATH": str(old_api)}
        run = subprocess.run([os.sys.executable, "-c", code], cwd=old_api, env=env,
                             text=True, encoding="utf-8", capture_output=True, timeout=30)
        assert run.returncode == 0, run.stderr
        assert '"health": 200' in run.stdout and '"listing": 200' in run.stdout and '"ok": true' in run.stdout
