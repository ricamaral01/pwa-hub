"""
Leitura de nota fiscal por IA — com estado persistido no banco (o ERP guardava o job em memória).

Fluxo:
  1. POST arquivo → valida tamanho/tipo, guarda em disco (nome = SHA-256), cria estoque.nf_leitura 'pendente'.
  2. Processamento em segundo plano: XML de NF-e é lido sem IA; foto/PDF vai para o provedor de IA
     (o mesmo do ERP, portado para `extrair_com_ia`).
  3. Resultado fica em nf_leitura.resultado para CONFERÊNCIA HUMANA. Nada entra no estoque sozinho.
  4. Confirmar = criar a entrada (estoque_api) com os campos conferidos; a leitura vira 'confirmada'.
Na subida do serviço, `retomar_pendentes` reprocessa o que ficou pela metade.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import re
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutTimeout
from pathlib import Path

from sqlalchemy import text

TIPOS = {
    "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
    "application/xml": ".xml", "text/xml": ".xml",
}
ASSINATURAS = {b"%PDF": "application/pdf", b"\xff\xd8\xff": "image/jpeg", b"\x89PNG": "image/png", b"RIFF": "image/webp"}
_fila = ThreadPoolExecutor(max_workers=2, thread_name_prefix="nf-fila")      # leituras
_ia = ThreadPoolExecutor(max_workers=2, thread_name_prefix="nf-ia")          # chamadas ao provedor (com timeout)


def pasta_anexos() -> Path:
    return Path(os.environ.get("NF_UPLOAD_DIR", "/var/lib/concrefer-lab/nf_uploads"))


def detectar_mime(conteudo: bytes, declarado: str | None) -> str:
    for assinatura, mime in ASSINATURAS.items():
        if conteudo.startswith(assinatura):
            return mime
    inicio = conteudo[:200].lstrip()
    if inicio.startswith(b"<?xml") or inicio.startswith(b"<nfeProc") or inicio.startswith(b"<NFe"):
        return "application/xml"
    raise ValueError("Arquivo não reconhecido: envie PDF, JPG, PNG, WEBP ou XML da NF-e.")


def guardar_arquivo(conteudo: bytes, mime: str) -> tuple[str, str]:
    sha = hashlib.sha256(conteudo).hexdigest()
    hoje = dt.date.today()
    destino = pasta_anexos() / f"{hoje:%Y}" / f"{hoje:%m}" / f"{sha}{TIPOS[mime]}"
    destino.parent.mkdir(parents=True, exist_ok=True)
    if not destino.exists():
        tmp = destino.with_suffix(destino.suffix + ".tmp")
        tmp.write_bytes(conteudo)
        os.replace(tmp, destino)
    return sha, str(destino)


# ----------------------------------------------------------------- NF-e em XML (sem IA)
def _txt(no, caminho, ns):
    el = no.find(caminho, ns)
    return el.text.strip() if el is not None and el.text else None


def ler_xml_nfe(conteudo: bytes) -> dict:
    ns = {"n": "http://www.portalfiscal.inf.br/nfe"}
    raiz = ET.fromstring(conteudo)
    inf = raiz.find(".//n:infNFe", ns)
    if inf is None:
        raise ValueError("XML não é uma NF-e.")
    chave = re.sub(r"\D", "", inf.get("Id", ""))[-44:] or None
    itens = []
    for det in inf.findall("n:det", ns):
        p = det.find("n:prod", ns)
        icms = det.find(".//n:ICMS/*", ns)
        itens.append({
            "descricao": _txt(p, "n:xProd", ns), "quantidade": _txt(p, "n:qCom", ns), "unidade": _txt(p, "n:uCom", ns),
            "valor_total": _txt(p, "n:vProd", ns), "frete": _txt(p, "n:vFrete", ns),
            "icms_pct": _txt(icms, "n:pICMS", ns) if icms is not None else None,
        })
    return {
        "origem": "xml",
        "chave_acesso": chave,
        "numero": _txt(inf, "n:ide/n:nNF", ns),
        "serie": _txt(inf, "n:ide/n:serie", ns),
        "data_emissao": (_txt(inf, "n:ide/n:dhEmi", ns) or _txt(inf, "n:ide/n:dEmi", ns) or "")[:10] or None,
        "emitente_cnpj": _txt(inf, "n:emit/n:CNPJ", ns),
        "emitente_nome": _txt(inf, "n:emit/n:xNome", ns),
        "valor_total": _txt(inf, "n:total/n:ICMSTot/n:vNF", ns),
        "itens": itens,
    }


# ----------------------------------------------------------------- IA (provedor do ERP)
def extrair_com_ia(conteudo: bytes, mime: str) -> dict:
    """
    PORTAR do ERP antigo (/var/www/concretrack-erp/api/routers/estoque.py, rotas /estoque/nota-fiscal/*):
    o mesmo provedor, o mesmo prompt e o mesmo formato de resposta. Credenciais vêm do ambiente.
    Deve devolver um dict com os campos que a tela de entrada pré-preenche.
    """
    raise NotImplementedError("Provedor de IA ainda não portado do ERP")


def provedor() -> str:
    return os.environ.get("NF_IA_PROVIDER", "nao-configurado")


# ----------------------------------------------------------------- processamento
def enfileirar(factory, leitura_id: str, timeout_s: int = 120) -> None:
    _fila.submit(processar, factory, leitura_id, timeout_s)


def processar(factory, leitura_id: str, timeout_s: int = 120) -> None:
    """Roda fora da requisição. Usa sessão própria. Estado sempre gravado no banco."""
    with factory() as s:
        row = s.execute(text("""
            UPDATE estoque.nf_leitura SET status = 'processando', iniciado_em = now(), tentativas = tentativas + 1
             WHERE id = :id AND status IN ('pendente','processando')
            RETURNING anexo_caminho, anexo_mime"""), {"id": leitura_id}).first()
        s.commit()
        if row is None:
            return
        try:
            conteudo = Path(row.anexo_caminho).read_bytes()
            if row.anexo_mime == "application/xml":
                resultado = ler_xml_nfe(conteudo)
            else:
                resultado = _ia.submit(extrair_com_ia, conteudo, row.anexo_mime).result(timeout=timeout_s)
                resultado = {"origem": "ia", **resultado}
            s.execute(text("""UPDATE estoque.nf_leitura SET status = 'concluida', resultado = CAST(:r AS jsonb),
                                     erro = NULL, concluido_em = now() WHERE id = :id"""),
                      {"id": leitura_id, "r": json.dumps(resultado, default=str)})
        except FutTimeout:
            s.execute(text("""UPDATE estoque.nf_leitura SET status = 'erro', erro = :e, concluido_em = now() WHERE id = :id"""),
                      {"id": leitura_id, "e": f"Leitura passou de {timeout_s} s"})
        except Exception as e:  # noqa: BLE001 — qualquer falha vira estado visível na tela
            s.execute(text("""UPDATE estoque.nf_leitura SET status = 'erro', erro = :e, concluido_em = now() WHERE id = :id"""),
                      {"id": leitura_id, "e": f"{type(e).__name__}: {e}"[:500]})
        s.commit()


def retomar_pendentes(factory, timeout_s: int = 120) -> list[str]:
    """Chamar no startup do serviço: devolve à fila o que ficou parado por reinício."""
    with factory() as s:
        ids = [r[0] for r in s.execute(text("""
            SELECT id::text FROM estoque.nf_leitura
             WHERE status = 'pendente'
                OR (status = 'processando' AND iniciado_em < now() - make_interval(secs => :t))
             ORDER BY criado_em"""), {"t": timeout_s * 2})]
    for i in ids:
        _fila.submit(processar, factory, i, timeout_s)
    return ids
