"""
Cálculos do estoque que não dependem do banco (testáveis isoladamente).

- custo unitário líquido da NF (paridade com o ERP)
- validação e divisão do rateio de cimento entre silos
- previsão de ressuprimento de cimento (ponto de pedido e plano de cargas)
"""
from __future__ import annotations

import datetime as dt
import math
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from statistics import NormalDist, mean, pstdev

Q4 = Decimal("0.0001")


# ----------------------------------------------------------------- custo
def custo_unit_liquido(valor_nota: Decimal, quantidade: Decimal, icms_pct: Decimal = Decimal(0),
                       frete_unit: Decimal = Decimal(0), icms_frete_pct: Decimal = Decimal(0)) -> Decimal:
    """Regra do ERP: (valor_nota×(1−ICMS) + frete_unit×qtd×(1−ICMS_frete)) / qtd, 4 casas.
    É a mesma de insumos.custo_liquido_unit(valor_nota/qtd, ...)."""
    if quantidade <= 0:
        raise ValueError("quantidade deve ser positiva")
    bruto = valor_nota * (1 - icms_pct / 100) + frete_unit * quantidade * (1 - icms_frete_pct / 100)
    return (bruto / quantidade).quantize(Q4, ROUND_HALF_UP)


# ----------------------------------------------------------------- rateio
@dataclass
class Parcela:
    silo_id: int
    quantidade: Decimal


def validar_rateio(total: Decimal, parcelas: list[Parcela], tolerancia: Decimal = Decimal("0.001")) -> list[str]:
    """Regras do ERP: ≥ 2 silos, silos distintos, parcelas positivas, soma = total."""
    erros = []
    if len(parcelas) < 2:
        erros.append("O rateio exige pelo menos dois silos.")
    silos = [p.silo_id for p in parcelas]
    if len(silos) != len(set(silos)):
        erros.append("Os silos do rateio devem ser diferentes.")
    if any(p.quantidade <= 0 for p in parcelas):
        erros.append("Cada parcela deve ser maior que zero.")
    soma = sum((p.quantidade for p in parcelas), Decimal(0))
    if abs(soma - total) > tolerancia:
        erros.append(f"A soma das parcelas ({soma}) difere do total da nota ({total}).")
    return erros


def dividir_valor(valor_total: Decimal, parcelas: list[Parcela]) -> list[Decimal]:
    """Divide o valor da NF proporcionalmente às quantidades; centavos de arredondamento vão para a última parcela,
    de modo que a soma bate exatamente com a nota e o custo unitário fica igual em todos os silos."""
    total_q = sum((p.quantidade for p in parcelas), Decimal(0))
    partes = [(valor_total * p.quantidade / total_q).quantize(Decimal("0.01"), ROUND_HALF_UP) for p in parcelas]
    partes[-1] += valor_total - sum(partes)
    return partes


# ----------------------------------------------------------------- previsão
@dataclass
class SiloNivel:
    silo_id: int
    nome: str
    nivel: float                 # t disponível (físico, ≥ 0)
    capacidade_operacional: float


@dataclass
class Plano:
    consumo_medio_dia: float
    desvio_dia: float
    estoque_seguranca: float
    ponto_pedido: float
    disponivel: float
    capacidade: float
    autonomia_dias: float | None
    projecao: list[dict] = field(default_factory=list)
    cargas: list[dict] = field(default_factory=list)
    alertas: list[str] = field(default_factory=list)


def dias_uteis(inicio: dt.date, n: int, sabado: bool = False) -> list[dt.date]:
    out, d = [], inicio
    while len(out) < n:
        if d.weekday() < 5 or (sabado and d.weekday() == 5):
            out.append(d)
        d += dt.timedelta(days=1)
    return out


def plano_ressuprimento(silos: list[SiloNivel], consumo_diario: list[float], hoje: dt.date, *,
                        lead_time: int = 3, seguranca_dias: float = 2, nivel_servico: float = 0.95,
                        carga_t: float = 40, horizonte: int = 10, sabado: bool = False) -> Plano:
    """
    consumo_diario: consumo de cada dia ÚTIL da janela (zeros incluídos), mais antigo primeiro.
    Melhorias sobre o ERP (que usa média simples e segurança fixa de 2 dias):
      * estoque de segurança = maior entre (segurança_dias × média) e (z × σ × √lead_time);
      * ponto de pedido = média × lead_time + estoque de segurança;
      * a carga só é sugerida se couber no espaço operacional livre na data de chegada (regra do ERP).
    """
    media = mean(consumo_diario) if consumo_diario else 0.0
    desvio = pstdev(consumo_diario) if len(consumo_diario) > 1 else 0.0
    z = NormalDist().inv_cdf(nivel_servico)
    es = max(seguranca_dias * media, z * desvio * math.sqrt(lead_time))
    pp = media * lead_time + es
    disp = sum(s.nivel for s in silos)
    cap = sum(s.capacidade_operacional for s in silos)
    p = Plano(round(media, 3), round(desvio, 3), round(es, 2), round(pp, 2), round(disp, 2), round(cap, 2),
              round(disp / media, 1) if media > 0 else None)
    if media <= 0:
        p.alertas.append("Sem consumo na janela: previsão não calculada.")
        return p

    dias = dias_uteis(hoje + dt.timedelta(days=1), horizonte, sabado)
    saldo = disp
    chegadas: dict[dt.date, float] = {}
    pedido_aberto_ate: dt.date | None = None
    for d in dias:
        saldo += chegadas.pop(d, 0.0)
        saldo -= media
        p.projecao.append({"data": d.isoformat(), "saldo_previsto": round(saldo, 2)})
        if saldo < 0:
            p.alertas.append(f"Ruptura prevista em {d:%d/%m}.")
            break
        aberto = pedido_aberto_ate is not None and d < pedido_aberto_ate
        if saldo <= pp and not aberto:
            chegada = dias_uteis(d + dt.timedelta(days=1), lead_time, sabado)[-1]
            saldo_na_chegada = saldo - media * lead_time
            espaco = cap - max(saldo_na_chegada, 0)
            if espaco >= carga_t:
                p.cargas.append({"pedir_em": d.isoformat(), "chegada": chegada.isoformat(), "toneladas": carga_t,
                                 "saldo_na_chegada": round(saldo_na_chegada, 2)})
                chegadas[chegada] = chegadas.get(chegada, 0.0) + carga_t
                pedido_aberto_ate = chegada
            else:
                p.alertas.append(f"Em {d:%d/%m} o ponto de pedido foi atingido, mas não há espaço para {carga_t:g} t na chegada.")
                pedido_aberto_ate = chegada
    return p
