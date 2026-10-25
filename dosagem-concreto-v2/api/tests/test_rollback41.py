import subprocess
from pathlib import Path

from sqlalchemy import text


def test_d1_rollback_changes_only_release_pointer(ambiente, tmp_path):
    _, factory, _ = ambiente
    root = tmp_path / "dosagem"
    for name in ("N-1", "N"):
        (root / "releases" / name / "api").mkdir(parents=True)
        (root / "releases" / name / "web").mkdir(parents=True)
    script = Path(__file__).resolve().parents[2] / "deploy/scripts/rollback-code.sh"
    with factory.begin() as session:
        session.execute(text("INSERT INTO usuarios(email,nome,papel,unidades,ativo) VALUES ('retido@example.test','Retido','admin','[]'::jsonb,true)"))
    # The Linux container supplies the production symlink semantics on Windows.
    mounted = str(root.resolve())
    args = ["docker", "run", "--rm", "-v", f"{mounted}:/dosagem", "-v", f"{script.resolve()}:/rollback-code.sh:ro",
            "postgres:16", "bash", "-lc",
            "ln -s /dosagem/releases/N /dosagem/current && CTDOSAGEM_ROOT=/dosagem CTDOSAGEM_NO_RESTART=1 bash /rollback-code.sh /dosagem/releases/N-1 && test $(readlink -f /dosagem/current) = /dosagem/releases/N-1"]
    subprocess.run(args, check=True, capture_output=True, text=True)
    with factory() as session:
        assert session.execute(text("SELECT count(*) FROM usuarios WHERE email='retido@example.test'")).scalar_one() == 1
