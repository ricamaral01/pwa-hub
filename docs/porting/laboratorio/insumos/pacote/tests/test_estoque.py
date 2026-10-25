"""Estoque no Laboratório: espelho do ERP, saldo por silo, contagem, baixa automática, entradas e NF."""
import datetime as dt
import time
from decimal import Decimal

import pytest

E = "/api/laboratorio/estoque"
NFE = """<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe><infNFe Id="NFe35261012345678000199550010000123451000123456" versao="4.00">
<ide><serie>1</serie><nNF>12345</nNF><dhEmi>2026-10-20T10:00:00-03:00</dhEmi></ide>
<emit><CNPJ>12345678000199</CNPJ><xNome>Votorantim Cimentos</xNome></emit>
<det nItem="1"><prod><xProd>CIMENTO CP V ARI RS GRANEL</xProd><uCom>T</uCom><qCom>32.0000</qCom><vProd>21760.00</vProd></prod>
<imposto><ICMS><ICMS00><pICMS>12.00</pICMS></ICMS00></ICMS></imposto></det>
<total><ICMSTot><vNF>21760.00</vNF></ICMSTot></total></infNFe></NFe></nfeProc>""".encode()


def _saldo(sql, data, codigo):
    return sql("""SELECT round(sum(saldo_contabil),4), round(sum(saldo_fisico),4) FROM estoque.saldo_em(%s) s
                  JOIN insumos.material m ON m.id = s.material_id WHERE m.codigo = %s""", data, codigo)[0]


def test_espelho_trouxe_regras_do_erp(sql, banco):
    assert sql("SELECT count(*) FROM estoque.movimento WHERE legado_id LIKE 'erp:%%'")[0][0] == 12
    cont = sql("SELECT quantidade FROM estoque.movimento WHERE legado_id = 'erp:7'")
    assert cont == [(Decimal("45.5000"),)] and sql("SELECT tipo FROM estoque.movimento WHERE legado_id='erp:7'")[0][0] == "contagem"
    assert sql("""SELECT m.codigo FROM estoque.silo_material sm JOIN insumos.material m ON m.id = sm.material_id
                  JOIN estoque.silo s ON s.id = sm.silo_id WHERE s.numero = 1 ORDER BY sm.desde""") == [("ADD-FILL",), ("CIM-CP-V",)]
    # material da Carta Traço e do ERP viraram um só cadastro
    assert sql("SELECT codigo FROM insumos.material WHERE nome = 'Cimento CP V-ARI'") == [("CIM-CP-V",)]
    # rodar de novo não duplica nem muda IDs
    antes = sql("SELECT id, legado_id FROM estoque.movimento ORDER BY id")
    sql("SELECT * FROM estoque.sincronizar_legado('Campinas')")
    assert sql("SELECT id, legado_id FROM estoque.movimento ORDER BY id") == antes


def test_saldo_por_silo_contagem_e_deficit(sql, banco):
    # silo 1: contagem 45,5 em 03/10 absorve o consumo do mesmo dia; 04/10 baixa 3 → 42,5
    # silo 2: 20 − 30 = −10 contábil, 0 físico (não reduz o silo 1)
    contabil, fisico = _saldo(sql, "2026-10-04", "CIM-CP-V")
    assert (contabil, fisico) == (Decimal("32.5000"), Decimal("42.5000"))
    assert _saldo(sql, "2026-10-04", "ARE-MED") == (Decimal("130.0000"), Decimal("130.0000"))  # futuro não entra
    # antes da troca do silo 1, o nível pertencia ao Filler
    assert _saldo(sql, "2026-06-20", "ADD-FILL") == (Decimal("5.0000"), Decimal("5.0000"))


def test_consumo_automatico_idempotente(sql, banco):
    calc = sql("SELECT m.codigo, c.quantidade FROM estoque.consumo_calculado('2026-06-15','2026-06-15') c "
               "JOIN insumos.material m ON m.id = c.material_id")
    assert calc == [("ADD-FILL", Decimal("0.3000"))]                    # silo 1 ainda era Filler em junho
    with pytest.raises(Exception, match="gerador de consumo ainda é o ERP"):
        sql("SELECT * FROM estoque.gerar_consumo('2026-10-05','2026-10-06','teste')")
    sql("UPDATE insumos.config SET valor = 'vps_nova' WHERE chave = 'consumo_gerador'")
    try:
        assert sql("SELECT * FROM estoque.gerar_consumo('2026-10-05','2026-10-06','teste')") == [(8, 0, 0)]       # 2 dias × 4 posições com leitura
        ids1 = sql("SELECT id, chave_natural, quantidade FROM estoque.movimento WHERE origem='producao_massadas' AND data >= '2026-10-05' ORDER BY id")
        assert sql("SELECT * FROM estoque.gerar_consumo('2026-10-05','2026-10-06','teste')") == [(0, 0, 0)]
        sql("UPDATE erp_espelho.tbl_massadas SET real_silo2 = 400 WHERE id = 3")
        assert sql("SELECT * FROM estoque.gerar_consumo('2026-10-05','2026-10-06','teste')") == [(0, 1, 0)]
        ids2 = sql("SELECT id, chave_natural FROM estoque.movimento WHERE origem='producao_massadas' AND data >= '2026-10-05' ORDER BY id")
        assert [i[:2] for i in ids1] == ids2                            # reprocessar não troca IDs
        sql("UPDATE erp_espelho.tbl_massadas SET real_silo2 = 390 WHERE id = 3")
        sql("SELECT * FROM estoque.gerar_consumo('2026-10-05','2026-10-06','teste')")
    finally:
        sql("UPDATE insumos.config SET valor = 'erp' WHERE chave = 'consumo_gerador'")


def test_consumo_teorico_real(cliente, sql, banco):
    sql("UPDATE carta_traco.carta SET codigo_traco = 'T25' WHERE nome = 'FCK 25 · Brita 1'")
    sql("UPDATE insumos.config SET valor = 'vps_nova' WHERE chave = 'consumo_gerador'")
    sql("SELECT * FROM estoque.gerar_consumo('2026-10-05','2026-10-06','teste')")
    sql("UPDATE insumos.config SET valor = 'erp' WHERE chave = 'consumo_gerador'")
    r = {x["material"]: x for x in cliente.get("/api/laboratorio/carta-traco/consumo-teorico-real",
                                               params={"de": "2026-10-05", "ate": "2026-10-06"}).json()}
    # produção de 05-06/10 usa a Rev. 2 (vigente na data): 4 m³ × 370 kg de cimento
    cim = r["Cimento CP V-ARI"]
    assert Decimal(str(cim["teorico_kg"])) == Decimal("1480.0") and Decimal(str(cim["real_kg"])) == Decimal("1540.0")
    assert Decimal(str(cim["desvio_pct"])) == Decimal("4.05")
    assert Decimal(str(r["Areia média"]["desvio_kg"])) == Decimal("86.0")


def test_escrita_bloqueada_no_modo_paralelo(cliente, ids):
    r = cliente.post(f"{E}/entradas", json={"unidade_id": ids["un"]["Campinas"], "material_id": ids["cod"]["ARE-MED"],
                                            "data": "2026-10-20", "quantidade": "10"})
    assert r.status_code == 409 and "ERP" in r.json()["detail"]


@pytest.fixture()
def escrita_liberada(sql):
    sql("UPDATE insumos.config SET valor = 'vps_nova' WHERE chave = 'estoque_fonte_oficial'")
    yield
    sql("UPDATE insumos.config SET valor = 'erp' WHERE chave = 'estoque_fonte_oficial'")


def test_entrada_rateada(cliente, ids, sql, escrita_liberada):
    base = {"unidade_id": ids["un"]["Campinas"], "material_id": ids["cod"]["CIM-CP-V"], "data": "2026-10-21",
            "quantidade": "32", "fornecedor_id": ids["forn"]["Votorantim"], "valor_nota": "21760", "icms_pct": "12",
            "frete_unit": "0"}
    silo = {n: sql("SELECT id FROM estoque.silo WHERE numero = %s", n)[0][0] for n in (1, 2, 3)}
    um_silo = cliente.post(f"{E}/entradas", json=base | {"rateio": [{"silo_id": silo[1], "quantidade": "32"}]})
    assert um_silo.status_code == 422 and "dois silos" in um_silo.text
    soma_errada = cliente.post(f"{E}/entradas", json=base | {"rateio": [{"silo_id": silo[1], "quantidade": "10"},
                                                                       {"silo_id": silo[2], "quantidade": "20"}]})
    assert soma_errada.status_code == 422
    proibido = cliente.post(f"{E}/entradas", json=base | {"silo_id": silo[3], "material_id": ids["cod"]["ADD-FILL"]})
    assert proibido.status_code == 409 and "silo" in proibido.text
    ok = cliente.post(f"{E}/entradas", json=base | {"rateio": [{"silo_id": silo[1], "quantidade": "12"},
                                                             {"silo_id": silo[2], "quantidade": "20"}]})
    assert ok.status_code == 201, ok.text
    assert Decimal(str(ok.json()["custo_unit_liquido"])) == Decimal("598.4000")
    vals = sql("SELECT valor_nota FROM estoque.movimento WHERE grupo_id = %s ORDER BY id", ok.json()["grupo_id"])
    assert sum(v[0] for v in vals) == Decimal("21760.00")
    # corrigir o rateio numa transação: o grupo antigo fica anulado no histórico
    novo = cliente.put(f"{E}/entradas/grupo/{ok.json()['grupo_id']}",
                       json=base | {"rateio": [{"silo_id": silo[1], "quantidade": "16"}, {"silo_id": silo[2], "quantidade": "16"}]})
    assert novo.status_code == 200, novo.text
    assert sql("SELECT count(*) FROM estoque.movimento WHERE grupo_id = %s AND anulado", ok.json()["grupo_id"])[0][0] == 2


def test_contagem_e_anulacao(cliente, ids, sql, escrita_liberada):
    silo1 = sql("SELECT id FROM estoque.silo WHERE numero = 1")[0][0]
    r = cliente.post(f"{E}/contagens", json={"unidade_id": ids["un"]["Campinas"], "material_id": ids["cod"]["CIM-CP-V"],
                                             "silo_id": silo1, "data": "2026-10-04", "quantidade_contada": "40"})
    assert r.status_code == 201, r.text
    assert Decimal(str(r.json()["diferenca"])) == Decimal("-2.5")      # saldo antes era 42,5
    a = cliente.post(f"{E}/movimentos/{r.json()['id']}/anular", json={"motivo": "contagem lançada no silo errado"})
    assert a.status_code == 200 and a.json()["anulados"] == 1
    gerado = sql("SELECT id FROM estoque.movimento WHERE origem = 'producao_massadas' LIMIT 1")[0][0]
    assert cliente.post(f"{E}/movimentos/{gerado}/anular", json={"motivo": "teste de bloqueio"}).status_code == 409


def _esperar(cliente, lid, alvo=("concluida", "erro"), t=10):
    fim = time.time() + t
    while time.time() < fim:
        st = cliente.get(f"{E}/nota-fiscal/leituras/{lid}").json()
        if st["status"] in alvo:
            return st
        time.sleep(0.1)
    raise AssertionError(st)


def test_nf_xml_sem_ia_e_bloqueio_de_duplicada(cliente, ids, sql, escrita_liberada):
    up = cliente.post(f"{E}/nota-fiscal/leituras", params={"unidade_id": ids["un"]["Campinas"]},
                      files={"arquivo": ("nfe.xml", NFE, "application/xml")})
    assert up.status_code == 202, up.text
    st = _esperar(cliente, up.json()["id"])
    assert st["status"] == "concluida" and st["resultado"]["chave_acesso"] == "35261012345678000199550010000123451000123456"
    assert st["resultado"]["itens"][0]["quantidade"] == "32.0000"
    silo2 = sql("SELECT id FROM estoque.silo WHERE numero = 2")[0][0]
    entrada = {"unidade_id": ids["un"]["Campinas"], "material_id": ids["cod"]["CIM-CP-V"], "data": "2026-10-20",
               "quantidade": "32", "silo_id": silo2, "valor_nota": "21760", "icms_pct": "12", "leitura_id": up.json()["id"],
               "nota": {"chave_acesso": st["resultado"]["chave_acesso"], "numero": "12345", "serie": "1",
                        "emitente_cnpj": "12345678000199", "data_emissao": "2026-10-20", "valor_total": "21760"}}
    ok = cliente.post(f"{E}/entradas", json=entrada)
    assert ok.status_code == 201, ok.text
    assert sql("SELECT origem FROM estoque.movimento WHERE id = %s", ok.json()["ids"][0])[0][0] == "nf_ia"
    # mesmo arquivo de novo: recusado; mesma chave por outro caminho: recusada pelo banco
    assert cliente.post(f"{E}/nota-fiscal/leituras", params={"unidade_id": ids["un"]["Campinas"]},
                        files={"arquivo": ("nfe.xml", NFE, "application/xml")}).status_code == 409
    dup = cliente.post(f"{E}/entradas", json=entrada | {"leitura_id": None})
    assert dup.status_code == 409


def test_nf_por_ia_fica_para_conferencia(cliente, ids, monkeypatch, escrita_liberada):
    from api import nf_leitura
    monkeypatch.setattr(nf_leitura, "extrair_com_ia", lambda b, m: {"numero": "999", "quantidade": "12.5"})
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 100
    up = cliente.post(f"{E}/nota-fiscal/leituras", params={"unidade_id": ids["un"]["Campinas"]},
                      files={"arquivo": ("foto.png", png, "image/png")})
    st = _esperar(cliente, up.json()["id"])
    assert st["status"] == "concluida" and st["resultado"] == {"origem": "ia", "numero": "999", "quantidade": "12.5"}
    assert cliente.post(f"{E}/nota-fiscal/leituras", params={"unidade_id": ids["un"]["Campinas"]},
                        files={"arquivo": ("x.exe", b"MZ\x90\x00", "application/octet-stream")}).status_code == 415


def test_leitura_pendente_e_retomada_apos_reinicio(cliente, ids, sql, app, monkeypatch):
    from api import nf_leitura
    from api.deps import fabrica_sessao
    monkeypatch.setattr(nf_leitura, "extrair_com_ia", lambda b, m: {"numero": "1"})
    lid = sql("""INSERT INTO estoque.nf_leitura (unidade_id, arquivo_sha256, anexo_caminho, anexo_mime, anexo_bytes,
                 criado_por, status, iniciado_em)
                 SELECT %s, repeat('a', 64), anexo_caminho, anexo_mime, anexo_bytes, 'teste', 'processando', now() - interval '1 hour'
                   FROM estoque.nf_leitura WHERE anexo_mime = 'image/png' LIMIT 1 RETURNING id::text""", ids["un"]["Campinas"])[0][0]

    class R:  # request mínimo para obter a fábrica de sessões
        pass
    R.app = app
    assert lid in nf_leitura.retomar_pendentes(fabrica_sessao(R))
    assert _esperar(cliente, lid)["status"] == "concluida"


def test_previsao_de_cimento(cliente, ids):
    r = cliente.get(f"{E}/previsao/cimento", params={"unidade_id": ids["un"]["Campinas"], "material_id": ids["cod"]["CIM-CP-V"]})
    assert r.status_code == 200, r.text
    assert set(r.json()) >= {"consumo_medio_dia", "ponto_pedido", "cargas", "silos", "projecao"}
