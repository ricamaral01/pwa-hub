"""Cálculos puros do estoque (sem banco)."""
import datetime as dt
from decimal import Decimal

from api.estoque_calculos import (Parcela, SiloNivel, custo_unit_liquido, dividir_valor, plano_ressuprimento,
                                  validar_rateio)


def test_custo_unitario_igual_ao_erp():
    # (valor_nota × (1 − ICMS) + frete_unit × qtd × (1 − ICMS frete)) / qtd
    assert custo_unit_liquido(Decimal("24480"), Decimal("40"), Decimal("12"), Decimal("13.6")) == Decimal("552.1600")
    assert custo_unit_liquido(Decimal("100"), Decimal("1"), Decimal("12"), Decimal("10"), Decimal("12")) == Decimal("96.8000")


def test_rateio():
    assert validar_rateio(Decimal(32), [Parcela(1, Decimal(12)), Parcela(2, Decimal(20))]) == []
    assert len(validar_rateio(Decimal(32), [Parcela(1, Decimal(32))])) == 1
    assert any("diferentes" in e for e in validar_rateio(Decimal(32), [Parcela(1, Decimal(16)), Parcela(1, Decimal(16))]))
    partes = dividir_valor(Decimal("100.00"), [Parcela(1, Decimal(1)), Parcela(2, Decimal(1)), Parcela(3, Decimal(1))])
    assert sum(partes) == Decimal("100.00") and partes == [Decimal("33.33"), Decimal("33.33"), Decimal("33.34")]


def test_previsao_sugere_carga_com_espaco():
    silos = [SiloNivel(1, "Silo 1", 30, 48), SiloNivel(2, "Silo 2", 20, 72)]
    p = plano_ressuprimento(silos, [10.0] * 30, dt.date(2026, 10, 23), carga_t=40)
    assert p.consumo_medio_dia == 10 and p.ponto_pedido == 50.0     # 10 × 3 dias + segurança 2 dias (σ = 0)
    assert p.autonomia_dias == 5.0
    assert p.cargas and p.cargas[0]["pedir_em"] == "2026-10-26"
    assert all(x["saldo_previsto"] >= 0 for x in p.projecao)


def test_previsao_seguranca_estatistica_com_consumo_irregular():
    irregular = [0, 25, 5, 30, 0, 20, 10, 30] * 4
    p = plano_ressuprimento([SiloNivel(1, "S", 100, 120)], irregular, dt.date(2026, 10, 23))
    assert p.estoque_seguranca > 2 * p.consumo_medio_dia             # variação pede mais que 2 dias


def test_previsao_avisa_quando_nao_cabe():
    p = plano_ressuprimento([SiloNivel(1, "S", 45, 48)], [10.0] * 30, dt.date(2026, 10, 23), carga_t=40)
    assert any("não há espaço" in a for a in p.alertas) or p.cargas
