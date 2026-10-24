"""Generate an explicitly synthetic LT-PRO-04 PDF for layout review."""
from datetime import date
from decimal import Decimal
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "unificado/pcp/backend"))
from app.services.pederneiras_exports import pdf  # noqa: E402

products = [
    {"id": 1, "descricao": "Poste padrao 9m", "cod_pro": "PRO-001", "cod_sma": "SMA-001"},
    {"id": 2, "descricao": "Poste circular 11m", "cod_pro": "PRO-002", "cod_sma": "SMA-002"},
]
days = [
    {"data": date(2026, 10, 21), "postes": 25, "homens": Decimal("5"), "mod": Decimal("4"), "moi": Decimal("1"),
     "postes_homem": Decimal("5"), "volume_m3": Decimal("8.75"),
     "itens": [{"produto_id": 1, "quantidade": 20}, {"produto_id": 2, "quantidade": 5}]},
    {"data": date(2026, 10, 22), "postes": 30, "homens": Decimal("5"), "mod": Decimal("4"), "moi": Decimal("1"),
     "postes_homem": Decimal("6"), "volume_m3": Decimal("10.50"),
     "itens": [{"produto_id": 1, "quantidade": 20}, {"produto_id": 2, "quantidade": 10}]},
]
month = {"unidade": {"nome": "EXEMPLO SINTETICO - NAO OPERACIONAL"}, "mes": "2026-10",
         "dias": days, "postes": 55, "homens": Decimal("10")}
target = ROOT / "docs/porting/producao-pederneiras/prints/08-lt-pro-04-exemplo.pdf"
target.write_bytes(pdf(month, products))
print(target)
