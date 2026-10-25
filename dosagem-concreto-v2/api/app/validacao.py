import math
from typing import Any

from .erros import ErroAPI


def numero(valor: Any, nome: str, *, minimo: float | None = None, maximo: float | None = None) -> float:
    if isinstance(valor, bool) or valor is None or valor == "":
        raise ErroAPI("VALIDACAO", f"{nome} é obrigatório e numérico.")
    try:
        n = float(valor)
    except (ValueError, TypeError):
        raise ErroAPI("VALIDACAO", f"{nome} inválido.") from None
    if not math.isfinite(n) or (minimo is not None and n < minimo) or (maximo is not None and n > maximo):
        raise ErroAPI("VALIDACAO", f"{nome} fora da faixa permitida.")
    return n


def sem_nao_finitos(valor: Any) -> None:
    if isinstance(valor, float) and not math.isfinite(valor):
        raise ErroAPI("VALIDACAO", "Número não finito.")
    if isinstance(valor, dict):
        for x in valor.values():
            sem_nao_finitos(x)
    elif isinstance(valor, list):
        for x in valor:
            sem_nao_finitos(x)


def validar_traco(t: dict) -> None:
    sem_nao_finitos(t)
    if not str(t.get("id") or "").strip() or not str(t.get("nome") or "").strip() or not str(t.get("unidade") or "").strip():
        raise ErroAPI("VALIDACAO", "ID, nome e unidade são obrigatórios.")
    objetivo = t.get("objetivo") or {}
    numero(objetivo.get("fckMPa"), "Fck", minimo=0.000001)
    numero(objetivo.get("sdMPa"), "Desvio padrão", minimo=0)
    numero(t.get("arIncorporadoPct"), "Ar incorporado", minimo=0, maximo=99.999)
    itens = t.get("itens")
    if not isinstance(itens, list) or not itens:
        raise ErroAPI("VALIDACAO", "Informe materiais.")
    cimento = 0.0
    adicao = 0.0
    agua = 0.0
    umidade = 0.0
    for i in itens:
        if not isinstance(i, dict) or not str(i.get("nome") or "").strip():
            raise ErroAPI("VALIDACAO", "Nome do material obrigatório.")
        categoria = i.get("categoria")
        numero(i.get("massaEspecificaKgDm3"), "Massa específica", minimo=0.000001)
        massa = i.get("massaKgM3")
        if massa is None and categoria == "aditivo" and i.get("dosagemPct") is not None:
            numero(i["dosagemPct"], "Dosagem percentual", minimo=0, maximo=100)
            massa_n = 0.0
        else:
            massa_n = numero(massa, "Massa", minimo=0)
        if i.get("custoRsKg") is not None:
            numero(i["custoRsKg"], "Custo", minimo=0)
        if categoria in ("areia", "brita"):
            pct = numero(i.get("umidadeLivrePct", 0), "Umidade", minimo=0, maximo=100)
            umidade += massa_n * pct / 100
        if categoria == "cimento":
            cimento += massa_n
        elif categoria == "adicao":
            adicao += massa_n
        elif categoria == "agua":
            agua += massa_n
    if cimento <= 0:
        raise ErroAPI("VALIDACAO", "Informe cimento acima de zero.")
    if umidade > agua:
        raise ErroAPI("VALIDACAO", "Água de obra negativa.")


def validar_generico(tipo: str, d: dict) -> None:
    sem_nao_finitos(d)
    if not str(d.get("id") or "").strip() or not str(d.get("unidade") or "").strip():
        raise ErroAPI("VALIDACAO", "ID e unidade são obrigatórios.")
    if tipo in ("materiais", "fornecedores", "produtos", "equipamentos") and not str(d.get("nome") or "").strip():
        raise ErroAPI("VALIDACAO", "Nome obrigatório.")
    if tipo == "produtos":
        numero(d.get("desformaMinMPa"), "Resistencia minima de desforma", minimo=0.000001)
        numero(d.get("desformaIdadeAlvoH"), "Idade-alvo de desforma", minimo=0.000001)
    for campo in ("massaEspecificaKgDm3", "custoRsKg", "custoLiq", "preco", "frete"):
        if d.get(campo) is not None:
            numero(d[campo], campo, minimo=0)
