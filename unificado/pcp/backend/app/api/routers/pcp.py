from typing import List, Optional
from datetime import date, timedelta
import csv
import io
import json
import re
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.usuario import NivelAcesso
from app.models.producao import Programacao, ProgramacaoAlex, ApontamentoMega, Producao, MaoDeObra, MaoDeObraRateio, AtividadeMaoDeObra
from app.models.setor import Setor
from app.models.mapeamento_forma import MapeamentoForma
from app.models.mapeamento_forma_poste import MapeamentoFormaPoste
from app.models.produto import Produto
from app.schemas.producao import (
    ProgramacaoCreate, ProgramacaoOut,
    ProducaoCreate, ProducaoOut,
    MaoDeObraCreate, MaoDeObraOut,
    MaoDeObraLoteCreate,
    MaoDeObraComRateioOut, MaoDeObraRateioCreate,
    ArividadeMaoDeObraOut,
)
from app.services import sheets_service

router = APIRouter(prefix="/api", tags=["pcp"])

_LEITURA = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)
_ESCRITA_PCP = (NivelAcesso.ADMIN, NivelAcesso.PCP)
_ESCRITA_PROD = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO)

# Ordem operacional das formas carregadas pelo arquivo Mega para os setores 1 e 2.
_ORDEM_CODIGOS_MONTAGEM_SETOR12 = (
    "938", "935", "943", "941", "946", "945", "948", "947",
    "944", "942", "934", "931", "930", "932", "933", "949",
    "950", "5017", "4848", "4031", "4764", "4032", "4765", "4929",
    "957", "940", "937", "939", "936", "2017", "953", "954",
)
_ORDEM_CODIGOS_MONTAGEM_SETOR12_INDEX = {
    codigo: indice
    for indice, codigo in enumerate(_ORDEM_CODIGOS_MONTAGEM_SETOR12)
}


def _norm_text(value: Optional[str]) -> str:
    text = (value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", text)


def _ordem_codigo_montagem_setor12(codigo: Optional[str]) -> tuple:
    codigo_norm = _norm_text(codigo)
    prioridade = _ORDEM_CODIGOS_MONTAGEM_SETOR12_INDEX.get(codigo_norm)
    if prioridade is not None:
        return (0, prioridade)
    return (1, codigo_norm)


def _parse_decimal(value, default: Decimal = Decimal("0")) -> Decimal:
    if value is None:
        return default
    text = str(value).strip()
    if not text:
        return default
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    elif "." in text:
        parts = text.split(".")
        if len(parts) > 1 and all(part.isdigit() for part in parts) and len(parts[-1]) == 3:
            text = "".join(parts)
    try:
        return Decimal(text)
    except InvalidOperation:
        return default


def _parse_int_any(value, default: int = 0) -> int:
    try:
        return int(_parse_decimal(value))
    except Exception:
        return default


def _xlsx_col_index(cell_ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", (cell_ref or "").upper())
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch) - ord("A") + 1)
    return max(idx - 1, 0)


def _rows_from_matrix(parsed_rows: list[list]) -> list[dict]:
    if not parsed_rows:
        return []

    header_idx = None
    headers = []
    for i, row in enumerate(parsed_rows[:20]):
        normalized = [_norm_text(str(v)) for v in row]
        if "coditem" in normalized and "descricao" in normalized:
            header_idx = i
            headers = normalized
            break
    if header_idx is None:
        raise HTTPException(status_code=400, detail="Cabeçalho Mega não encontrado. Esperado: Identificador, Cód.Item, Descrição, Un., Qtde.Estoque, Qtde.Carteira, Saldo, Produção Diária, Dias Prev. Prod.")

    rows = []
    for values in parsed_rows[header_idx + 1:]:
        item = {}
        for idx, header in enumerate(headers):
            item[header] = values[idx] if idx < len(values) else ""
        rows.append(item)
    return rows


def _read_csv_rows(raw: bytes) -> list[dict]:
    text = None
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise HTTPException(status_code=400, detail="Arquivo CSV inválido")

    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,\t")
    except csv.Error:
        dialect = csv.excel
        dialect.delimiter = ";"
    parsed_rows = [row for row in csv.reader(io.StringIO(text), dialect) if any(str(v).strip() for v in row)]
    return _rows_from_matrix(parsed_rows)


class _TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_row = None
        self.current_cell = None
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == "tr":
            self.current_row = []
        elif tag in ("td", "th") and self.current_row is not None:
            self.current_cell = []
            self.in_cell = True

    def handle_data(self, data):
        if self.in_cell and self.current_cell is not None:
            self.current_cell.append(data)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in ("td", "th") and self.current_row is not None and self.current_cell is not None:
            self.current_row.append(" ".join("".join(self.current_cell).split()))
            self.current_cell = None
            self.in_cell = False
        elif tag == "tr" and self.current_row is not None:
            if any(str(v).strip() for v in self.current_row):
                self.rows.append(self.current_row)
            self.current_row = None


def _read_html_rows(raw: bytes) -> list[dict]:
    text = None
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            text = raw.decode(encoding, errors="strict")
            break
        except UnicodeDecodeError:
            continue
    if not text or "<table" not in text.lower():
        raise HTTPException(status_code=400, detail="Arquivo HTML inválido")
    parser = _TableParser()
    parser.feed(text)
    return _rows_from_matrix(parser.rows)


def _read_xls_rows(raw: bytes) -> list[dict]:
    try:
        import xlrd
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="Leitor XLS não instalado no servidor") from exc

    try:
        book = xlrd.open_workbook(file_contents=raw)
        sheet = book.sheet_by_index(0)
        parsed_rows = []
        for r in range(sheet.nrows):
            row = []
            for c in range(sheet.ncols):
                value = sheet.cell_value(r, c)
                if isinstance(value, float) and value.is_integer():
                    value = int(value)
                row.append(value)
            if any(str(v).strip() for v in row):
                parsed_rows.append(row)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Arquivo XLS inválido: {exc}")
    return _rows_from_matrix(parsed_rows)


def _read_mega_rows(raw: bytes, filename: str) -> list[dict]:
    readers = []
    if filename.endswith(".xlsx"):
        readers = [_read_xlsx_rows, _read_html_rows, _read_csv_rows]
    elif filename.endswith(".xls"):
        readers = [_read_xls_rows, _read_html_rows, _read_csv_rows]
    elif filename.endswith(".csv"):
        readers = [_read_csv_rows, _read_html_rows]
    else:
        raise HTTPException(status_code=400, detail="Selecione um arquivo Mega .xlsx, .xls ou .csv")

    errors = []
    for reader in readers:
        try:
            return reader(raw)
        except HTTPException as exc:
            errors.append(str(exc.detail))
    raise HTTPException(status_code=400, detail=f"Não foi possível ler o arquivo Mega. Verifique se o cabeçalho contém Cód.Item e Descrição. Detalhes: {' | '.join(errors[:2])}")


def _read_xlsx_rows(raw: bytes) -> list[dict]:
    ns = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            shared = []
            if "xl/sharedStrings.xml" in zf.namelist():
                root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
                for si in root.findall("a:si", ns):
                    parts = [t.text or "" for t in si.findall(".//a:t", ns)]
                    shared.append("".join(parts))

            sheet_name = "xl/worksheets/sheet1.xml"
            root = ET.fromstring(zf.read(sheet_name))
            parsed_rows = []
            for row in root.findall(".//a:sheetData/a:row", ns):
                values = []
                for cell in row.findall("a:c", ns):
                    idx = _xlsx_col_index(cell.attrib.get("r", "A1"))
                    while len(values) <= idx:
                        values.append("")
                    ctype = cell.attrib.get("t")
                    value_node = cell.find("a:v", ns)
                    inline_node = cell.find("a:is/a:t", ns)
                    raw_value = value_node.text if value_node is not None else (inline_node.text if inline_node is not None else "")
                    if ctype == "s" and raw_value != "":
                        raw_value = shared[int(raw_value)]
                    values[idx] = raw_value or ""
                if any(str(v).strip() for v in values):
                    parsed_rows.append(values)
    except (KeyError, zipfile.BadZipFile, ET.ParseError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Arquivo Excel inválido: {exc}")

    return _rows_from_matrix(parsed_rows)


# ─── Programação ───────────────────────────────────────────────────────────────

@router.get("/programacao", response_model=List[ProgramacaoOut])
def listar_programacao(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
#     _=Depends(require_roles(*_LEITURA)),
):
    q = db.query(Programacao)
    if data_inicio:
        q = q.filter(Programacao.data >= data_inicio)
    if data_fim:
        q = q.filter(Programacao.data <= data_fim)
    if setor_id:
        q = q.filter(Programacao.setor_id == setor_id)
    return q.order_by(Programacao.data.desc()).all()


@router.get('/etiquetas-padrao/programacao')
def programacao_etiquetas_padrao(
    data: date = Query(...),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """Provide the registered form type code for each standard label."""
    query = db.query(Programacao).filter(Programacao.data == data)
    if setor_id is not None:
        query = query.filter(Programacao.setor_id == setor_id)
    rows = query.order_by(Programacao.setor_id, Programacao.id).all()
    if not rows:
        return []

    product_ids = {row.produto_id for row in rows if row.produto_id is not None}
    sector_ids = {row.setor_id for row in rows}
    products = {item.id: item for item in db.query(Produto).filter(Produto.id.in_(product_ids)).all()}
    sectors = {item.id: item for item in db.query(Setor).filter(Setor.id.in_(sector_ids)).all()}
    catalog = {}
    for item in db.execute(text('''SELECT produto_id,codigo_tipo_forma
                                   FROM public.catalogo_tipos_forma
                                   WHERE produto_id IS NOT NULL''')).mappings():
        catalog.setdefault(item['produto_id'], set()).add(item['codigo_tipo_forma'])
    by_form = {}
    by_product_name = {}
    for item in db.query(MapeamentoForma).filter(MapeamentoForma.setor_id.in_(sector_ids)).all():
        if not item.codigo_tipo_forma:
            continue
        by_form.setdefault((item.setor_id, _norm_text(item.codigo_forma)), set()).add(item.codigo_tipo_forma)
        by_product_name.setdefault((item.setor_id, _norm_text(item.poste)), set()).add(item.codigo_tipo_forma)

    def unique_code(values):
        return next(iter(values)) if len(values) == 1 else None

    result = []
    for row in rows:
        product = products.get(row.produto_id)
        type_code = None
        if row.codigo_forma:
            type_code = unique_code(by_form.get((row.setor_id, _norm_text(row.codigo_forma)), set()))
        if not type_code and product:
            type_code = unique_code(catalog.get(product.id, set()))
        if not type_code and product:
            type_code = unique_code(by_product_name.get((row.setor_id, _norm_text(product.nome)), set()))
        result.append({
            'id': row.id, 'data': row.data.isoformat(), 'setor_id': row.setor_id,
            'codigo_forma': row.codigo_forma, 'quantidade_programada': row.quantidade_programada,
            'codigo_tipo_forma': type_code,
            'setor': {'nome': sectors[row.setor_id].nome} if row.setor_id in sectors else None,
            'produto': {'nome': product.nome, 'codigo': product.codigo} if product else None,
        })
    return result


@router.post("/programacao", response_model=ProgramacaoOut, status_code=201)
def criar_programacao(
    payload: ProgramacaoCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    prog = Programacao(**payload.model_dump())
    db.add(prog)
    db.commit()
    db.refresh(prog)
    return prog


@router.post("/programacao/lote")
def criar_programacao_lote(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    itens = payload.get("itens") or payload.get("items") or []
    if not isinstance(itens, list) or not itens:
        raise HTTPException(status_code=400, detail="Informe ao menos um item de programação")

    registros = []
    for idx, item in enumerate(itens, start=1):
        try:
            parsed = ProgramacaoCreate(**item)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Item {idx}: dados inválidos ({exc})")
        registros.append(Programacao(**parsed.model_dump()))

    for registro in registros:
        db.add(registro)
    db.commit()
    return {"criados": len(registros)}


@router.post("/programacao/atualizar-lote")
def atualizar_quantidades_programacao_lote(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    itens = payload.get("itens") or payload.get("items") or []
    if not isinstance(itens, list) or not itens:
        raise HTTPException(status_code=400, detail="Informe ao menos uma quantidade para atualizar")

    quantidades_por_id = {}
    for idx, item in enumerate(itens, start=1):
        try:
            prog_id = int(item.get("id"))
            quantidade_decimal = Decimal(str(item.get("quantidade_programada")))
        except (AttributeError, InvalidOperation, TypeError, ValueError):
            raise HTTPException(status_code=400, detail=f"Item {idx}: programação ou quantidade inválida")
        if not quantidade_decimal.is_finite() or quantidade_decimal != quantidade_decimal.to_integral_value():
            raise HTTPException(status_code=400, detail=f"Item {idx}: informe uma quantidade inteira")
        quantidade = int(quantidade_decimal)
        if prog_id <= 0 or quantidade < 0:
            raise HTTPException(status_code=400, detail=f"Item {idx}: programação ou quantidade inválida")
        quantidades_por_id[prog_id] = quantidade

    programacoes = db.query(Programacao).filter(Programacao.id.in_(quantidades_por_id)).all()
    if len(programacoes) != len(quantidades_por_id):
        raise HTTPException(status_code=404, detail="Uma ou mais programações não foram encontradas")

    for prog in programacoes:
        quantidade_atual = int(prog.quantidade_programada or 0)
        if quantidade_atual:
            volume_unitario = Decimal(str(prog.volume_m3_programado or 0)) / Decimal(quantidade_atual)
        elif prog.produto and prog.produto.volume is not None:
            volume_unitario = Decimal(str(prog.produto.volume))
        else:
            volume_unitario = Decimal("0")
        quantidade = quantidades_por_id[prog.id]
        prog.quantidade_programada = quantidade
        prog.volume_m3_programado = volume_unitario * Decimal(quantidade)

    db.commit()
    return {"atualizados": len(programacoes)}


@router.delete("/programacao/{prog_id}", status_code=204)
def excluir_programacao(
    prog_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    prog = db.query(Programacao).filter(Programacao.id == prog_id).first()
    if prog:
        db.delete(prog)
        db.commit()


@router.post("/programacao/excluir-lote")
def excluir_programacao_lote(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    ids = payload.get("ids") or []
    ids = [int(i) for i in ids if str(i).isdigit()]
    if not ids:
        raise HTTPException(status_code=400, detail="Selecione ao menos um registro")
    removidos = db.query(Programacao).filter(Programacao.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"removidos": removidos}


@router.get("/programacao-alex")
def listar_programacao_alex(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    q = db.query(ProgramacaoAlex)
    if data_inicio:
        q = q.filter(ProgramacaoAlex.data >= data_inicio)
    if data_fim:
        q = q.filter(ProgramacaoAlex.data <= data_fim)
    if setor_id:
        q = q.filter(ProgramacaoAlex.setor_id == setor_id)
    rows = q.order_by(ProgramacaoAlex.data.desc(), ProgramacaoAlex.codigo_item).all()
    return [{
        "id": r.id,
        "data": r.data.isoformat(),
        "setor_id": r.setor_id,
        "setor": {"id": r.setor.id, "nome": r.setor.nome} if r.setor else None,
        "produto_id": r.produto_id,
        "produto": {"id": r.produto.id, "codigo": r.produto.codigo, "nome": r.produto.nome} if r.produto else None,
        "identificador": r.identificador,
        "codigo_item": r.codigo_item,
        "descricao": r.descricao,
        "unidade": r.unidade,
        "qtde_estoque": float(r.qtde_estoque or 0),
        "qtde_carteira": float(r.qtde_carteira or 0),
            "saldo": float((r.qtde_estoque or 0) - (r.qtde_carteira or 0)),
        "producao_diaria": r.producao_diaria,
        "dias_prev_prod": r.dias_prev_prod,
        "volume_m3_programado": float(r.volume_m3_programado or 0),
    } for r in rows]


@router.post("/programacao-alex/limpar")
def limpar_programacao_alex(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    data_inicio_raw = payload.get("data_inicio")
    data_fim_raw = payload.get("data_fim")
    setor_ids = payload.get("setor_ids") or []
    setor_ids = [int(s) for s in setor_ids if str(s).isdigit()]
    if not data_inicio_raw and not data_fim_raw and not setor_ids:
        raise HTTPException(status_code=400, detail="Informe data ou setor para limpar a Programação Setor 1 e 2")

    q = db.query(ProgramacaoAlex)
    if data_inicio_raw:
        q = q.filter(ProgramacaoAlex.data >= date.fromisoformat(str(data_inicio_raw)))
    if data_fim_raw:
        q = q.filter(ProgramacaoAlex.data <= date.fromisoformat(str(data_fim_raw)))
    if setor_ids:
        q = q.filter(ProgramacaoAlex.setor_id.in_(setor_ids))

    removidos = q.delete(synchronize_session=False)
    db.commit()
    return {"removidos": removidos}


@router.delete("/programacao-alex/{prog_id}", status_code=204)
def excluir_programacao_alex(
    prog_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    prog = db.query(ProgramacaoAlex).filter(ProgramacaoAlex.id == prog_id).first()
    if prog:
        db.delete(prog)
        db.commit()


@router.post("/programacao-alex/importar-mega")
def importar_programacao_alex_mega(
    data: date = Form(...),
    setor_id: Optional[int] = Form(None),
    substituir: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    raw = file.file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    filename = (file.filename or "").lower()
    rows = _read_mega_rows(raw, filename)
    produtos_query = db.query(Produto)
    if setor_id:
        produtos_query = produtos_query.filter(Produto.setor_id == setor_id)
    produtos = produtos_query.all()
    produtos_por_codigo = {_norm_text(p.codigo): p for p in produtos if p.codigo}

    registros = []
    for idx, row in enumerate(rows, start=2):
        codigo = str(row.get("coditem") or row.get("codigoitem") or "").strip()
        descricao = str(row.get("descricao") or "").strip()
        if not codigo and not descricao:
            continue
        producao_diaria = _parse_int_any(row.get("producaodiaria"))

        produto = produtos_por_codigo.get(_norm_text(codigo))
        volume_unit = Decimal(str(produto.volume or 0)) if produto and produto.volume is not None else Decimal("0")
        qtde_estoque = _parse_decimal(row.get("qtdeestoque"))
        qtde_carteira = _parse_decimal(row.get("qtdecarteira"))
        registros.append(ProgramacaoAlex(
            data=data,
            setor_id=setor_id,
            produto_id=produto.id if produto else None,
            identificador=str(row.get("identificador") or "").strip() or None,
            codigo_item=codigo,
            descricao=descricao or codigo,
            unidade=str(row.get("un") or "").strip() or None,
            qtde_estoque=qtde_estoque,
            qtde_carteira=qtde_carteira,
            saldo=qtde_estoque - qtde_carteira,
            producao_diaria=producao_diaria,
            dias_prev_prod=_parse_int_any(row.get("diasprevprod")),
            volume_m3_programado=volume_unit * Decimal(producao_diaria),
        ))

    if not registros:
        raise HTTPException(status_code=400, detail="Nenhuma linha válida foi encontrada no arquivo Mega")

    removidos = 0
    if substituir:
        q = db.query(ProgramacaoAlex).filter(ProgramacaoAlex.data == data)
        if setor_id:
            q = q.filter(ProgramacaoAlex.setor_id == setor_id)
        removidos = q.count()
        q.delete(synchronize_session=False)

    for registro in registros:
        db.add(registro)
    db.commit()

    return {
        "importados": len(registros),
        "ignorados": 0,
        "removidos": removidos,
        "data": data.isoformat(),
        "setor_id": setor_id,
        "nao_vinculados": sum(1 for r in registros if r.produto_id is None),
    }


@router.post("/programacao/duplicar")
def duplicar_programacao(
    data_origem: date = Body(...),
    dias: int = Body(..., ge=1, le=31),
    setor_id: Optional[int] = Body(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    q = db.query(Programacao).filter(Programacao.data == data_origem)
    if setor_id:
        q = q.filter(Programacao.setor_id == setor_id)
    origem = q.order_by(Programacao.setor_id, Programacao.produto_id).all()
    if not origem:
        raise HTTPException(status_code=404, detail="Nenhuma programação encontrada na data de origem")

    criados = 0
    for offset in range(1, dias + 1):
        data_destino = data_origem + timedelta(days=offset)
        for item in origem:
            db.add(Programacao(
                data=data_destino,
                setor_id=item.setor_id,
                produto_id=item.produto_id,
                codigo_forma=item.codigo_forma,
                quantidade_programada=item.quantidade_programada,
                volume_m3_programado=item.volume_m3_programado,
            ))
            criados += 1
    db.commit()
    return {"criados": criados, "dias": dias}


# ─── Apontamento Mega ─────────────────────────────────────────────────────────

def _apontamento_payload(
    programacao: Programacao,
    apontamento: Optional[ApontamentoMega] = None,
    quantidade_realizada: int = 0,
):
    quantidade_apontada = int(apontamento.quantidade_apontada or 0) if apontamento else 0
    realizada = int(quantidade_realizada or quantidade_apontada or 0)
    return {
        "programacao_id": programacao.id,
        "data": programacao.data.isoformat(),
        "setor_id": programacao.setor_id,
        "setor": {"id": programacao.setor.id, "nome": programacao.setor.nome} if programacao.setor else None,
        "produto_id": programacao.produto_id,
        "produto_nome": programacao.produto.nome if programacao.produto else "-",
        "codigo": programacao.produto.codigo if programacao.produto else None,
        "forma": programacao.codigo_forma,
        "quantidade_programada": int(programacao.quantidade_programada or 0),
        "volume_m3_programado": float(programacao.volume_m3_programado or 0),
        "apontado": bool(apontamento),
        "quantidade_apontada": quantidade_apontada,
        "quantidade_realizada": realizada,
        "nome_apontador": apontamento.nome_apontador if apontamento else None,
        "apontado_em": apontamento.apontado_em.isoformat() if apontamento and apontamento.apontado_em else None,
    }


def _realizado_supabase_por_produto(db: Session, data_inicio: date, data_fim: date) -> dict:
    rows = sheets_service.get_producao_sheets(
        db,
        data_inicio=data_inicio.isoformat(),
        data_fim=data_fim.isoformat(),
        setor_id=None,
    )
    realizado = {}
    for row in rows:
        data_row = row.get("data")
        setor_id = row.get("setor_id")
        produto_id = row.get("produto_id")
        if not data_row or not setor_id or not produto_id:
            continue
        key = (data_row, int(setor_id), int(produto_id))
        realizado[key] = realizado.get(key, 0) + int(row.get("quantidade") or 0)
    return realizado


@router.get("/apontamento-mega")
def listar_apontamento_mega(
    data: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    programacoes = db.query(Programacao).filter(
        Programacao.data == data,
        Programacao.quantidade_programada > 0,
    ).order_by(Programacao.setor_id, Programacao.codigo_forma, Programacao.id).all()

    apontamentos = db.query(ApontamentoMega).filter(ApontamentoMega.data == data).all()
    por_programacao = {a.programacao_id: a for a in apontamentos}
    realizado_por_produto = _realizado_supabase_por_produto(db, data, data)
    return [
        _apontamento_payload(
            p,
            por_programacao.get(p.id),
            realizado_por_produto.get(
                (p.data.isoformat(), int(p.setor_id), int(p.produto_id or 0)),
                0,
            ),
        )
        for p in programacoes
    ]


@router.post("/apontamento-mega/{programacao_id}/apontar")
def apontar_programacao_mega(
    programacao_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*_ESCRITA_PROD)),
):
    nome = str(payload.get("nome_apontador") or "").strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Informe o nome de quem está apontando")

    programacao = db.query(Programacao).filter(Programacao.id == programacao_id).first()
    if not programacao:
        raise HTTPException(status_code=404, detail="Programação não encontrada")

    quantidade_raw = payload.get("quantidade_apontada")
    if quantidade_raw is None or str(quantidade_raw).strip() == "":
        quantidade = int(programacao.quantidade_programada or 0)
    else:
        quantidade = _parse_int_any(quantidade_raw)
    if quantidade <= 0:
        raise HTTPException(status_code=400, detail="Quantidade realizada deve ser maior que zero")

    apontamento = db.query(ApontamentoMega).filter(ApontamentoMega.programacao_id == programacao_id).first()
    if apontamento:
        apontamento.quantidade_apontada = quantidade
        apontamento.nome_apontador = nome
        apontamento.usuario_id = current_user.id
        apontamento.apontado_em = func.now()
    else:
        apontamento = ApontamentoMega(
            programacao_id=programacao.id,
            data=programacao.data,
            setor_id=programacao.setor_id,
            produto_id=programacao.produto_id,
            codigo_forma=programacao.codigo_forma,
            quantidade_apontada=quantidade,
            nome_apontador=nome,
            usuario_id=current_user.id,
        )
        db.add(apontamento)

    db.commit()
    db.refresh(apontamento)
    return _apontamento_payload(programacao, apontamento)


@router.get("/apontamento-mega/consulta")
def consultar_apontamento_mega(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    if data_fim < data_inicio:
        raise HTTPException(status_code=400, detail="Data final deve ser maior ou igual à inicial")

    programacoes = db.query(Programacao).filter(
        Programacao.data >= data_inicio,
        Programacao.data <= data_fim,
        Programacao.quantidade_programada > 0,
    ).order_by(Programacao.data, Programacao.setor_id, Programacao.codigo_forma, Programacao.id).all()

    apontamentos = db.query(ApontamentoMega).filter(
        ApontamentoMega.data >= data_inicio,
        ApontamentoMega.data <= data_fim,
    ).all()
    apontado_por_programacao = {a.programacao_id: int(a.quantidade_apontada or 0) for a in apontamentos}
    realizado_por_produto = _realizado_supabase_por_produto(db, data_inicio, data_fim)

    grupos = {}
    for prog in programacoes:
        key = (prog.data, prog.setor_id, prog.produto_id, prog.codigo_forma)
        item = grupos.setdefault(key, {
            "data": prog.data.isoformat(),
            "setor_id": prog.setor_id,
            "setor": prog.setor.nome if prog.setor else "-",
            "produto_nome": prog.produto.nome if prog.produto else "-",
            "codigo": prog.produto.codigo if prog.produto else None,
            "forma": prog.codigo_forma,
            "quantidade_programada": 0,
            "quantidade_realizada": 0,
        })
        item["quantidade_programada"] += int(prog.quantidade_programada or 0)
        realizado_supabase = realizado_por_produto.get((prog.data.isoformat(), int(prog.setor_id), int(prog.produto_id or 0)), 0)
        item["quantidade_realizada"] += realizado_supabase or apontado_por_programacao.get(prog.id, 0)

    rows = list(grupos.values())
    for row in rows:
        row["diferenca"] = row["quantidade_realizada"] - row["quantidade_programada"]
        row["atingimento"] = round((row["quantidade_realizada"] / row["quantidade_programada"] * 100), 1) if row["quantidade_programada"] else 0
    return rows


@router.get("/acompanhamento-mensal")
def consultar_acompanhamento_mensal(
    ano: int = Query(..., ge=2000, le=2100),
    mes: int = Query(..., ge=1, le=12),
    setor_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    data_inicio = date(ano, mes, 1)
    data_fim = date(ano + (1 if mes == 12 else 0), 1 if mes == 12 else mes + 1, 1) - timedelta(days=1)
    calendario = [data_inicio + timedelta(days=i) for i in range((data_fim - data_inicio).days + 1)]
    setor_ids = [int(s) for s in (setor_ids or []) if s]

    q = db.query(Programacao).filter(
        Programacao.data >= data_inicio,
        Programacao.data <= data_fim,
        Programacao.quantidade_programada > 0,
    )
    if setor_ids:
        q = q.filter(Programacao.setor_id.in_(setor_ids))
    programacoes = q.order_by(Programacao.setor_id, Programacao.data, Programacao.id).all()

    realizado_por_produto = _realizado_supabase_por_produto(db, data_inicio, data_fim)
    apontamentos = db.query(ApontamentoMega).filter(
        ApontamentoMega.data >= data_inicio,
        ApontamentoMega.data <= data_fim,
    ).all()
    apontado_por_programacao = {a.programacao_id: int(a.quantidade_apontada or 0) for a in apontamentos}

    linhas = {}
    totais_dia = {d.isoformat(): {"programado": 0, "realizado": 0} for d in calendario}

    for prog in programacoes:
        produto = prog.produto
        key = (int(prog.setor_id or 0), int(prog.produto_id or 0), prog.codigo_forma or "")
        item = linhas.setdefault(key, {
            "descricao": produto.nome if produto else "-",
            "setor_id": prog.setor_id,
            "setor": prog.setor.nome if prog.setor else f"SETOR {prog.setor_id}",
            "codigo": produto.codigo if produto else "",
            "codigo_forma": prog.codigo_forma or "",
            "dias": {d.isoformat(): {"programado": 0, "realizado": 0} for d in calendario},
            "total": 0,
        })
        data_key = prog.data.isoformat()
        qtd = int(prog.quantidade_programada or 0)
        realizado = 0
        if prog.produto_id:
            realizado = int(realizado_por_produto.get((data_key, int(prog.setor_id), int(prog.produto_id)), 0) or 0)
        if not realizado:
            realizado = int(apontado_por_programacao.get(prog.id, 0) or 0)

        item["dias"][data_key]["programado"] += qtd
        item["dias"][data_key]["realizado"] += realizado
        item["total"] += qtd
        totais_dia[data_key]["programado"] += qtd
        totais_dia[data_key]["realizado"] += realizado

    dias_visiveis = [
        d for d in calendario
        if d.weekday() < 5 or totais_dia[d.isoformat()]["programado"] > 0 or totais_dia[d.isoformat()]["realizado"] > 0
    ]

    dias_payload = [{
        "data": d.isoformat(),
        "rotulo": d.strftime("%d/%m"),
        "dia_semana": ["seg.", "ter.", "qua.", "qui.", "sex.", "sab.", "dom."][d.weekday()],
        "fim_semana": d.weekday() >= 5,
    } for d in dias_visiveis]

    linhas_payload = []
    for item in sorted(linhas.values(), key=lambda row: (int(row["setor_id"] or 99), str(row["descricao"]), str(row["codigo"]))):
        dias = {d["data"]: item["dias"][d["data"]] for d in dias_payload}
        linhas_payload.append({**item, "dias": dias})

    totais_payload = {
        d["data"]: totais_dia[d["data"]]
        for d in dias_payload
    }

    return {
        "ano": ano,
        "mes": mes,
        "data_inicio": data_inicio.isoformat(),
        "data_fim": data_fim.isoformat(),
        "setor_ids": setor_ids,
        "dias": dias_payload,
        "linhas": linhas_payload,
        "totais": totais_payload,
        "total_geral": sum(int(row["total"] or 0) for row in linhas_payload),
    }


@router.get("/pcp-diario")
def consultar_pcp_diario(
    data_inicio: date = Query(...),
    dias: int = Query(5, ge=1, le=31),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    data_fim = data_inicio + timedelta(days=dias - 1)
    calendario = [data_inicio + timedelta(days=i) for i in range(dias)]
    realizado_por_produto = _realizado_supabase_por_produto(db, data_inicio, data_fim)

    apontamentos = db.query(ApontamentoMega).filter(
        ApontamentoMega.data >= data_inicio,
        ApontamentoMega.data <= data_fim,
    ).all()
    apontado_por_programacao = {a.programacao_id: int(a.quantidade_apontada or 0) for a in apontamentos}

    linhas = {}

    def line_key(produto_id=None, codigo=None, descricao=None, setor_id=None):
        if produto_id:
            return f"produto:{produto_id}"
        return f"alex:{setor_id or 0}:{_norm_text(codigo)}:{_norm_text(descricao)}"

    def base_linha(key, produto=None, codigo=None, descricao=None, setor_id=None):
        item = linhas.setdefault(key, {
            "codigo_producao": produto.codigo if produto and produto.codigo else (codigo or ""),
            "codigo_montagem": codigo or (produto.codigo if produto and produto.codigo else ""),
            "descricao": produto.nome if produto else (descricao or "-"),
            "peso": float(produto.peso or 0) if produto and produto.peso is not None else 0,
            "volume_unitario": float(produto.volume or 0) if produto and produto.volume is not None else 0,
            "cod_forma": "",
            "setor": setor_id or (produto.setor_id if produto else None),
            "estoque_atual": 0,
            "saldo": 0,
            "qtde_formas": 0,
            "dias": {
                d.isoformat(): {
                    "programado": 0,
                    "realizado": 0,
                    "volume_programado": 0,
                    "volume_realizado": 0,
                    "_apontado": 0,
                    "_produtos": set(),
                }
                for d in calendario
            },
        })
        if produto:
            item["codigo_producao"] = produto.codigo or item["codigo_producao"]
            item["descricao"] = produto.nome or item["descricao"]
            item["peso"] = float(produto.peso or 0) if produto.peso is not None else item["peso"]
            item["volume_unitario"] = float(produto.volume or 0) if produto.volume is not None else item["volume_unitario"]
            item["setor"] = item["setor"] or produto.setor_id
        return item

    programacoes = db.query(Programacao).filter(
        Programacao.data >= data_inicio,
        Programacao.data <= data_fim,
        Programacao.quantidade_programada > 0,
    ).order_by(Programacao.data, Programacao.setor_id, Programacao.codigo_forma, Programacao.id).all()

    for prog in programacoes:
        produto = prog.produto
        key = line_key(produto_id=prog.produto_id, codigo=produto.codigo if produto else None, descricao=produto.nome if produto else None, setor_id=prog.setor_id)
        item = base_linha(key, produto=produto, setor_id=prog.setor_id)
        data_key = prog.data.isoformat()
        cell = item["dias"][data_key]
        qtd = int(prog.quantidade_programada or 0)
        cell["programado"] += qtd
        cell["volume_programado"] += float(prog.volume_m3_programado or 0)
        cell["_apontado"] += apontado_por_programacao.get(prog.id, 0)
        if prog.produto_id:
            cell["_produtos"].add((int(prog.setor_id), int(prog.produto_id)))
        formas = set(filter(None, [item["cod_forma"], prog.codigo_forma]))
        item["cod_forma"] = " / ".join(sorted(formas)) if formas else ""
        item["qtde_formas"] = max(int(item["qtde_formas"] or 0), qtd)

    alex_rows = db.query(ProgramacaoAlex).filter(
        ProgramacaoAlex.data >= data_inicio,
        ProgramacaoAlex.data <= data_fim,
        ProgramacaoAlex.producao_diaria > 0,
    ).order_by(ProgramacaoAlex.data, ProgramacaoAlex.setor_id, ProgramacaoAlex.codigo_item).all()

    for row in alex_rows:
        produto = row.produto
        key = line_key(produto_id=row.produto_id, codigo=row.codigo_item, descricao=row.descricao, setor_id=row.setor_id)
        item = base_linha(key, produto=produto, codigo=row.codigo_item, descricao=row.descricao, setor_id=row.setor_id)
        item["codigo_montagem"] = row.codigo_item or item["codigo_montagem"]
        item["estoque_atual"] = float(row.qtde_estoque or 0)
        item["saldo"] = float(row.saldo or 0)
        item["setor"] = item["setor"] or row.setor_id
        qtd = int(row.producao_diaria or 0)
        item["qtde_formas"] = max(int(item["qtde_formas"] or 0), qtd)
        cell = item["dias"][row.data.isoformat()]
        if cell["programado"] == 0:
            cell["programado"] = qtd
            cell["volume_programado"] = float(row.volume_m3_programado or 0)

    for item in linhas.values():
        for data_key, cell in item["dias"].items():
            realizado_supabase = 0
            for setor_id, produto_id in cell["_produtos"]:
                realizado_supabase += realizado_por_produto.get((data_key, setor_id, produto_id), 0)
            realizado = realizado_supabase if realizado_supabase else int(cell["_apontado"] or 0)
            cell["realizado"] = int(realizado or 0)
            volume_unit = float(item.get("volume_unitario") or 0)
            if volume_unit:
                cell["volume_realizado"] = round(cell["realizado"] * volume_unit, 3)
            cell.pop("_apontado", None)
            cell.pop("_produtos", None)

    efetivo_por_dia = {
        d.isoformat(): int(db.query(func.coalesce(func.sum(MaoDeObra.quantidade_pessoas), 0)).filter(MaoDeObra.data == d).scalar() or 0)
        for d in calendario
    }

    totais = {}
    for d in calendario:
        data_key = d.isoformat()
        programado = sum(int(item["dias"][data_key]["programado"] or 0) for item in linhas.values())
        realizado = sum(int(item["dias"][data_key]["realizado"] or 0) for item in linhas.values())
        volume_programado = sum(float(item["dias"][data_key]["volume_programado"] or 0) for item in linhas.values())
        volume_realizado = sum(float(item["dias"][data_key]["volume_realizado"] or 0) for item in linhas.values())
        totais[data_key] = {
            "programado": programado,
            "realizado": realizado,
            "volume_programado": round(volume_programado, 2),
            "volume_realizado": round(volume_realizado, 2),
            "eficiencia": round((realizado / programado * 100), 2) if programado else 0,
            "efetivo": efetivo_por_dia[data_key],
        }

    dias_payload = [{
        "data": d.isoformat(),
        "rotulo": d.strftime("%d/%m/%y"),
        "dia_semana": ["seg.", "ter.", "qua.", "qui.", "sex.", "sab.", "dom."][d.weekday()],
    } for d in calendario]

    linhas_payload = sorted(linhas.values(), key=lambda item: (
        int(item["setor"] or 99),
        str(item["codigo_producao"] or item["codigo_montagem"] or ""),
        str(item["descricao"] or ""),
    ))

    return {
        "data_inicio": data_inicio.isoformat(),
        "data_fim": data_fim.isoformat(),
        "dias": dias_payload,
        "linhas": linhas_payload,
        "totais": totais,
    }


def _read_import_file(file: UploadFile, raw: bytes) -> List[dict]:
    name = (file.filename or "").lower()
    text = raw.decode("utf-8-sig")
    if name.endswith(".json") or (file.content_type or "").lower().endswith("/json"):
        payload = json.loads(text)
        if isinstance(payload, dict):
            payload = payload.get("itens") or payload.get("items") or payload.get("programacao")
        if not isinstance(payload, list):
            raise HTTPException(status_code=400, detail="JSON deve ser uma lista ou conter a chave 'itens'")
        return [item for item in payload if isinstance(item, dict)]

    sample = text[:2048]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;")
    except csv.Error:
        dialect = csv.excel
        dialect.delimiter = ";"
    rows = list(csv.DictReader(io.StringIO(text), dialect=dialect))
    return rows


def _first_value(row: dict, *keys: str) -> str:
    norm = {_norm_text(k): v for k, v in row.items()}
    for key in keys:
        value = norm.get(_norm_text(key))
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return ""


def _parse_int(value: str, field: str, line: int) -> int:
    try:
        parsed = int(float(str(value).replace(",", ".")))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"Linha {line}: campo {field} inválido")
    if parsed <= 0:
        raise HTTPException(status_code=400, detail=f"Linha {line}: {field} deve ser maior que zero")
    return parsed


@router.post("/programacao/importar")
def importar_programacao(
    file: UploadFile = File(...),
    substituir: bool = Form(False),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
):
    raw = file.file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    try:
        rows = _read_import_file(file, raw)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Arquivo deve estar em UTF-8")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"JSON inválido: {exc}")

    if not rows:
        raise HTTPException(status_code=400, detail="Nenhuma linha encontrada no arquivo")

    produtos = db.query(Produto).filter(Produto.setor_id.in_([3, 4])).all()
    produtos_por_codigo = {
        (p.setor_id, _norm_text(p.codigo)): p
        for p in produtos
        if p.codigo
    }
    produtos_por_nome = {
        (p.setor_id, _norm_text(p.nome)): p
        for p in produtos
    }

    registros = []
    pares_substituir = set()
    for idx, row in enumerate(rows, start=2):
        data_raw = _first_value(row, "data", "data_programacao", "data_producao")
        setor_raw = _first_value(row, "setor_id", "setor")
        forma_raw = _first_value(row, "forma", "codigo_forma", "cod_forma")
        codigo_raw = _first_value(row, "produto_codigo", "codigo_produto", "cod_prod", "codigo", "cod")
        nome_raw = _first_value(row, "produto_nome", "produto", "descricao", "poste", "tipo_poste")
        qtd_raw = _first_value(row, "quantidade", "qtd", "qtd_programada", "quantidade_programada")

        if not any([data_raw, setor_raw, forma_raw, codigo_raw, nome_raw, qtd_raw]):
            continue

        try:
            data_prog = date.fromisoformat(data_raw)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Linha {idx}: data inválida, use YYYY-MM-DD")

        setor_text = setor_raw.upper().replace("SETOR", "").strip()
        setor_id = _parse_int(setor_text, "setor", idx)
        if setor_id not in (3, 4):
            raise HTTPException(status_code=400, detail=f"Linha {idx}: somente Setor 3 ou Setor 4")

        qtd = _parse_int(qtd_raw, "quantidade", idx)

        produto = None
        if codigo_raw:
            produto = produtos_por_codigo.get((setor_id, _norm_text(codigo_raw)))
        if not produto and nome_raw:
            produto = produtos_por_nome.get((setor_id, _norm_text(nome_raw)))
        if not produto:
            ref = codigo_raw or nome_raw or "sem referência"
            raise HTTPException(status_code=400, detail=f"Linha {idx}: produto não encontrado no Setor {setor_id}: {ref}")

        volume = round(float(produto.volume or 0) * qtd, 3)
        registros.append(Programacao(
            data=data_prog,
            setor_id=setor_id,
            produto_id=produto.id,
            codigo_forma=forma_raw.upper() if forma_raw else None,
            quantidade_programada=qtd,
            volume_m3_programado=volume,
        ))
        pares_substituir.add((data_prog, setor_id))

    if not registros:
        raise HTTPException(status_code=400, detail="Nenhum registro válido para importar")

    removidos = 0
    if substituir:
        for data_prog, setor_id in pares_substituir:
            q = db.query(Programacao).filter(
                Programacao.data == data_prog,
                Programacao.setor_id == setor_id,
            )
            removidos += q.count()
            q.delete(synchronize_session=False)

    for registro in registros:
        db.add(registro)
    db.commit()

    return {
        "importados": len(registros),
        "removidos": removidos,
        "substituir": substituir,
        "datas_setores": [
            {"data": data_prog.isoformat(), "setor_id": setor_id}
            for data_prog, setor_id in sorted(pares_substituir)
        ],
    }


@router.get("/programacao/setor3-formas")
def listar_programacao_setor3_formas(
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """
    Retorna formas SC do Setor 3 e produtos/postes compativeis por forma.
    Fonte: mapeamento_forma_postes + produtos do Setor 3.
    """
    produtos = db.query(Produto).filter(Produto.setor_id == 3).all()
    produtos_por_nome = {_norm_text(p.nome): p for p in produtos}

    formas = {}
    rows = db.query(MapeamentoFormaPoste).filter(
        MapeamentoFormaPoste.setor_id == 3,
        MapeamentoFormaPoste.ativo == True,
    ).order_by(MapeamentoFormaPoste.codigo_forma, MapeamentoFormaPoste.poste_circular).all()

    for row in rows:
        codigo = row.codigo_forma
        forma = formas.setdefault(codigo, {"codigo_forma": codigo, "produtos": []})
        produto = produtos_por_nome.get(_norm_text(row.poste_circular))
        if not produto:
            continue
        if any(item["id"] == produto.id for item in forma["produtos"]):
            continue
        forma["produtos"].append({
            "id": produto.id,
            "nome": produto.nome,
            "codigo": produto.codigo,
            "volume": float(produto.volume) if produto.volume is not None else 0,
            "poste_circular": row.poste_circular,
        })

    def sort_key(item):
        return [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", item["codigo_forma"])]

    result = sorted(formas.values(), key=sort_key)
    for item in result:
        item["produtos"].sort(key=lambda p: (p.get("codigo") or "", p["nome"]))
    return result


@router.get("/programacao/opcoes-formas")
def listar_programacao_opcoes_formas(
    setor_id: int = Query(...),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """
    Lista linhas de programacao por forma:
    - Setor 1/2: mapeamento_formas
    - Setor 3: mapeamento_forma_postes
    - Setor 4: DTB/DTBM/DTD por forma; demais agrupadas como Setor 1/2
    """
    produtos = db.query(Produto).filter(Produto.setor_id == setor_id).all()
    produtos_por_nome = {_norm_text(p.nome): p for p in produtos}
    produtos_por_codigo = {str(p.codigo): p for p in produtos if p.codigo}
    todos_produtos_por_nome = {_norm_text(p.nome): p for p in db.query(Produto).all()}

    def encontrar_produto(*nomes: Optional[str]):
        for nome in nomes:
            produto = produtos_por_nome.get(_norm_text(nome))
            if produto:
                return produto
        for nome in nomes:
            produto = todos_produtos_por_nome.get(_norm_text(nome))
            if produto:
                return produto
        return None

    def produto_payload(produto: Optional[Produto], fallback_nome: str, volume):
        return {
            "produto_id": produto.id if produto else None,
            "produto_nome": produto.nome if produto else fallback_nome,
            "produto_codigo": produto.codigo if produto else None,
            "volume": float(volume if volume is not None else (produto.volume if produto and produto.volume is not None else 0)),
        }

    def is_forma_especial_setor4(codigo: Optional[str]) -> bool:
        return bool(re.match(r"^(DTB|DTBM|DTD)\b", (codigo or "").strip(), re.I))

    rows = []
    if setor_id in (1, 2):
        agrupados = {}
        for item in db.query(MapeamentoForma).filter(
            MapeamentoForma.setor_id == setor_id,
            MapeamentoForma.ativo == True,
        ).order_by(MapeamentoForma.codigo_forma).all():
            codigo_forma = str(item.codigo_forma or "").strip().upper()
            produto_pl = produtos_por_codigo.get("934") if setor_id == 2 and re.match(r"^PL\s*[- ]\s*[1-6]$", codigo_forma) else None
            produto = produto_pl or encontrar_produto(item.poste, item.tipo_forma)
            payload = produto_payload(produto, item.poste, item.volume_m3)
            key = payload["produto_id"] or _norm_text(item.poste)
            current = agrupados.setdefault(key, {
                "modo": "poste",
                "forma": item.poste,
                "tipo_forma": item.tipo_forma,
                "poste": item.poste,
                "quantidade_formas": 0,
                **payload,
            })
            current["quantidade_formas"] += 1
        if setor_id == 2:
            # As seis formas PL atendem aos dois produtos; a programação distingue o destino.
            cpfl = next((row for row in agrupados.values() if row.get("produto_codigo") == "934"), None)
            elektro = produtos_por_codigo.get("15351")
            if cpfl and elektro and elektro.id not in agrupados:
                agrupados[elektro.id] = {
                    "modo": "poste",
                    "forma": elektro.nome,
                    "tipo_forma": cpfl["tipo_forma"],
                    "poste": elektro.nome,
                    "quantidade_formas": cpfl["quantidade_formas"],
                    **produto_payload(elektro, elektro.nome, elektro.volume),
                }
        if setor_id == 1:
            for produto in produtos:
                key = produto.id
                if key in agrupados:
                    continue
                agrupados[key] = {
                    "modo": "poste",
                    "forma": produto.nome,
                    "tipo_forma": None,
                    "poste": produto.nome,
                    "quantidade_formas": 0,
                    **produto_payload(produto, produto.nome, produto.volume),
                }
        rows = list(agrupados.values())
        rows.sort(key=lambda row: (
            0 if str(row.get("produto_codigo") or "").isdigit() else 1,
            int(row["produto_codigo"]) if str(row.get("produto_codigo") or "").isdigit() else str(row.get("produto_codigo") or ""),
            row.get("produto_nome") or "",
        ))
    elif setor_id == 4:
        agrupados = {}
        formas_especiais = {}
        for item in db.query(MapeamentoFormaPoste).filter(
            MapeamentoFormaPoste.setor_id == setor_id,
        ).order_by(MapeamentoFormaPoste.codigo_forma, MapeamentoFormaPoste.poste_circular).all():
            if is_forma_especial_setor4(item.codigo_forma):
                if not item.ativo:
                    continue
                produto = encontrar_produto(item.poste_circular)
                payload = produto_payload(produto, item.poste_circular, item.volume_m3)
                forma = formas_especiais.setdefault(item.codigo_forma, {
                    "modo": "forma",
                    "forma": item.codigo_forma,
                    "tipo_forma": None,
                    "poste": None,
                    "quantidade_formas": 1,
                    "produtos": [],
                })
                if produto and not any(p["produto_id"] == produto.id for p in forma["produtos"]):
                    forma["produtos"].append({
                        "poste": item.poste_circular,
                        **payload,
                    })
                elif not produto:
                    forma["produtos"].append({
                        "poste": item.poste_circular,
                        **payload,
                    })
                continue

            produto = encontrar_produto(item.poste_circular)
            payload = produto_payload(produto, item.poste_circular, item.volume_m3)
            key = payload["produto_id"] or _norm_text(item.poste_circular)
            current = agrupados.setdefault(key, {
                "modo": "poste",
                "forma": item.poste_circular,
                "tipo_forma": "",
                "poste": item.poste_circular,
                "quantidade_formas": 0,
                "codigos_formas": [],
                **payload,
            })
            current["quantidade_formas"] += 1
            if item.codigo_forma and item.codigo_forma not in current["codigos_formas"]:
                current["codigos_formas"].append(item.codigo_forma)

        for row in agrupados.values():
            row["tipo_forma"] = ", ".join(sorted(row["codigos_formas"], key=lambda value: [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", value)]))

        rows = list(agrupados.values())
        for row in formas_especiais.values():
            row["produtos"].sort(key=lambda p: (p.get("produto_codigo") or "", p.get("produto_nome") or ""))
            primeiro = next((p for p in row["produtos"] if p.get("produto_id")), row["produtos"][0] if row["produtos"] else None)
            if primeiro:
                row.update({
                    "poste": primeiro.get("poste"),
                    "produto_id": primeiro.get("produto_id"),
                    "produto_nome": primeiro.get("produto_nome"),
                    "produto_codigo": primeiro.get("produto_codigo"),
                    "volume": primeiro.get("volume"),
                })
            else:
                row.update({
                    "produto_id": None,
                    "produto_nome": None,
                    "produto_codigo": None,
                    "volume": 0,
                })
            rows.append(row)
    else:
        formas = {}
        for item in db.query(MapeamentoFormaPoste).filter(
            MapeamentoFormaPoste.setor_id == setor_id,
            MapeamentoFormaPoste.ativo == True,
        ).order_by(MapeamentoFormaPoste.codigo_forma, MapeamentoFormaPoste.poste_circular).all():
            produto = encontrar_produto(item.poste_circular)
            payload = produto_payload(produto, item.poste_circular, item.volume_m3)
            forma = formas.setdefault(item.codigo_forma, {
                "modo": "forma",
                "forma": item.codigo_forma,
                "tipo_forma": None,
                "poste": None,
                "produtos": [],
            })
            if produto and not any(p["produto_id"] == produto.id for p in forma["produtos"]):
                forma["produtos"].append({
                    "poste": item.poste_circular,
                    **payload,
                })
            elif not produto:
                forma["produtos"].append({
                    "poste": item.poste_circular,
                    **payload,
                })
        rows = list(formas.values())
        for row in rows:
            row["produtos"].sort(key=lambda p: (p.get("produto_codigo") or "", p.get("produto_nome") or ""))
            primeiro = next((p for p in row["produtos"] if p.get("produto_id")), row["produtos"][0] if row["produtos"] else None)
            if primeiro:
                row.update({
                    "poste": primeiro.get("poste"),
                    "produto_id": primeiro.get("produto_id"),
                    "produto_nome": primeiro.get("produto_nome"),
                    "produto_codigo": primeiro.get("produto_codigo"),
                    "volume": primeiro.get("volume"),
                })
            else:
                row.update({
                    "produto_id": None,
                    "produto_nome": None,
                    "produto_codigo": None,
                    "volume": 0,
                })

    def sort_key(row):
        if row.get("modo") == "poste":
            codigo = str(row.get("produto_codigo") or "")
            return (
                0,
                0 if codigo.isdigit() else 1,
                int(codigo) if codigo.isdigit() else codigo,
                row.get("produto_nome") or "",
            )
        return (
            1,
            [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", row["forma"])],
            row.get("produto_codigo") or "",
            row.get("produto_nome") or "",
        )

    return sorted(rows, key=sort_key)


@router.get("/programacao-alex/processado")
def processar_programacao_alex(
    setor_id: Optional[int] = Query(None),
    setor_ids: Optional[List[int]] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    setores_ids = []
    if setor_ids:
        setores_ids.extend(int(sid) for sid in setor_ids if sid)
    if setor_id:
        setores_ids.append(int(setor_id))
    setores_ids = list(dict.fromkeys(setores_ids))
    if not setores_ids:
        raise HTTPException(status_code=400, detail="Informe ao menos um setor")

    setores = {
        s.id: s.nome
        for s in db.query(Setor).filter(Setor.id.in_(setores_ids)).all()
    }
    opcoes = []
    for sid in setores_ids:
        for opcao in listar_programacao_opcoes_formas(setor_id=sid, db=db, _=None):
            opcao["setor_id"] = sid
            opcao["setor_nome"] = setores.get(sid, f"Setor {sid}")
            opcoes.append(opcao)

    q = db.query(ProgramacaoAlex)
    if data_inicio:
        q = q.filter(ProgramacaoAlex.data >= data_inicio)
    if data_fim:
        q = q.filter(ProgramacaoAlex.data <= data_fim)
    q = q.filter(or_(ProgramacaoAlex.setor_id.in_(setores_ids), ProgramacaoAlex.setor_id.is_(None)))
    importados = q.order_by(ProgramacaoAlex.data.desc(), ProgramacaoAlex.codigo_item).all()

    mega_por_codigo = {}
    for row in importados:
        key = _norm_text(row.codigo_item)
        if not key:
            continue
        atual = mega_por_codigo.setdefault(key, {
            "codigo_item": row.codigo_item,
            "descricao": row.descricao,
            "unidade": row.unidade,
            "qtde_estoque": float(row.qtde_estoque or 0),
            "qtde_carteira": float(row.qtde_carteira or 0),
            "saldo": float((row.qtde_estoque or 0) - (row.qtde_carteira or 0)),
            "producao_diaria": 0,
            "dias_prev_prod": row.dias_prev_prod or 0,
        })
        atual["producao_diaria"] += int(row.producao_diaria or 0)

    formas = []
    codigos_opcoes = set()
    for opcao in opcoes:
        produtos_opcao = opcao.get("produtos") or [opcao]
        for produto in produtos_opcao:
            codigo = produto.get("produto_codigo") or ""
            if codigo:
                codigos_opcoes.add(_norm_text(codigo))
            mega = mega_por_codigo.get(_norm_text(codigo))
            if not mega:
                continue
            volume_unit = float(produto.get("volume") or opcao.get("volume") or 0)
            qtd_formas = int(opcao.get("quantidade_formas") or produto.get("quantidade_formas") or 0)
            qtd_mega = int(mega.get("producao_diaria") or 0)
            qtd_inicial = 0 if opcao.get("setor_id") == 2 and codigo == "15351" and "934" in mega_por_codigo else qtd_formas
            formas.append({
                "setor_id": opcao.get("setor_id"),
                "setor_nome": opcao.get("setor_nome"),
                "forma": opcao.get("forma") or produto.get("poste") or "-",
                "produto_id": produto.get("produto_id"),
                "codigo": codigo,
                "produto_nome": produto.get("produto_nome") or produto.get("poste") or opcao.get("produto_nome") or opcao.get("poste") or "",
                "quantidade_formas": qtd_formas,
                "qtde_estoque": mega.get("qtde_estoque"),
                "qtde_carteira": mega.get("qtde_carteira"),
                "saldo": float(mega.get("qtde_estoque") or 0) - float(mega.get("qtde_carteira") or 0),
                "quantidade_produzir": qtd_inicial,
                "programacao": qtd_inicial,
                "producao_diaria_mega": qtd_mega,
                "volume_unitario": volume_unit,
                "volume_total": round(volume_unit * qtd_inicial, 3),
                "descricao_mega": mega.get("descricao"),
                "unidade": mega.get("unidade"),
                "dias_prev_prod": mega.get("dias_prev_prod"),
            })

    formas.sort(key=lambda row: (
        _ordem_codigo_montagem_setor12(row.get("codigo")),
        int(row.get("setor_id") or 0),
        [int(part) if part.isdigit() else part for part in re.split(r"(\d+)", str(row.get("forma") or ""))],
        str(row.get("codigo") or ""),
    ))

    registros = []
    for row in importados:
        if codigos_opcoes and _norm_text(row.codigo_item) not in codigos_opcoes:
            continue
        registros.append({
            "id": row.id,
            "data": row.data.isoformat(),
            "setor_id": row.setor_id,
            "setor": {"id": row.setor.id, "nome": row.setor.nome} if row.setor else None,
            "codigo_item": row.codigo_item,
            "descricao": row.descricao,
            "unidade": row.unidade,
            "qtde_estoque": float(row.qtde_estoque or 0),
            "qtde_carteira": float(row.qtde_carteira or 0),
            "saldo": float((row.qtde_estoque or 0) - (row.qtde_carteira or 0)),
            "producao_diaria": int(row.producao_diaria or 0),
            "dias_prev_prod": int(row.dias_prev_prod or 0),
        })

    return {
        "setor_ids": setores_ids,
        "formas": formas,
        "registros": registros,
        "total_formas": len(formas),
        "total_quantidade": sum(int(row["quantidade_produzir"] or 0) for row in formas),
        "total_volume": round(sum(float(row["volume_total"] or 0) for row in formas), 3),
    }


# ─── Produção ──────────────────────────────────────────────────────────────────

@router.get("/producao", response_model=List[ProducaoOut])
def listar_producao(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    q = db.query(Producao)
    if data_inicio:
        q = q.filter(Producao.data >= data_inicio)
    if data_fim:
        q = q.filter(Producao.data <= data_fim)
    if setor_id:
        q = q.filter(Producao.setor_id == setor_id)
    return q.order_by(Producao.data.desc()).all()


@router.post("/producao", response_model=ProducaoOut, status_code=201)
def criar_producao(
    payload: ProducaoCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PROD)),
):
    prod = Producao(**payload.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod


@router.delete("/producao/{prod_id}", status_code=204)
def excluir_producao(
    prod_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PROD)),
):
    prod = db.query(Producao).filter(Producao.id == prod_id).first()
    if prod:
        db.delete(prod)
        db.commit()


@router.get("/producao/sheets")
def listar_producao_sheets(
    data_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    data_fim: Optional[str] = Query(None, description="YYYY-MM-DD"),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """Producao realizada buscada do Supabase (status=LIBERADO)."""
    try:
        return sheets_service.get_producao_sheets(
            db,
            data_inicio=str(data_inicio) if data_inicio else None,
            data_fim=str(data_fim) if data_fim else None,
            setor_id=setor_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao ler Supabase: {exc}")


@router.get("/producao/supabase")
def listar_producao_supabase(
    data_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    data_fim: Optional[str] = Query(None, description="YYYY-MM-DD"),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """Producao realizada buscada do Supabase (status=LIBERADO)."""
    try:
        return sheets_service.get_producao_sheets(
            db,
            data_inicio=str(data_inicio) if data_inicio else None,
            data_fim=str(data_fim) if data_fim else None,
            setor_id=setor_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao ler Supabase: {exc}")


@router.get("/producao/circular-formas")
def listar_formas_circulares_s3(
    data_inicio: Optional[str] = Query(None, description="YYYY-MM-DD"),
    data_fim: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """Lista formas circulares do Setor 3 programadas e/ou ja enchidas."""
    try:
        return sheets_service.get_formas_circulares_s3(
            db,
            data_inicio=str(data_inicio) if data_inicio else None,
            data_fim=str(data_fim) if data_fim else None,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao ler formas circulares: {exc}")


# ─── Mão de Obra ───────────────────────────────────────────────────────────────

@router.get("/maodeobra", response_model=List[MaoDeObraOut])
def listar_maodeobra(
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    setor_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    q = db.query(MaoDeObra)
    if data_inicio:
        q = q.filter(MaoDeObra.data >= data_inicio)
    if data_fim:
        q = q.filter(MaoDeObra.data <= data_fim)
    if setor_id:
        q = q.filter(MaoDeObra.setor_id == setor_id)
    return q.order_by(MaoDeObra.data.desc()).all()


@router.post("/maodeobra", response_model=MaoDeObraOut, status_code=201)
def criar_maodeobra(
    payload: MaoDeObraCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PROD)),
):
    mdo = MaoDeObra(**payload.model_dump())
    db.add(mdo)
    db.commit()
    db.refresh(mdo)
    return mdo


@router.post("/maodeobra/lote", response_model=List[MaoDeObraOut], status_code=201)
def criar_maodeobra_lote(
    payload: MaoDeObraLoteCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PROD)),
):
    if not payload.itens:
        raise HTTPException(status_code=400, detail="Nenhum item informado")

    registros = []
    for item in payload.itens:
        if item.quantidade_pessoas <= 0:
            continue

        atividade = db.query(AtividadeMaoDeObra).filter(
            AtividadeMaoDeObra.id == item.atividade_id,
            AtividadeMaoDeObra.ativo == True,
        ).first()
        if not atividade:
            raise HTTPException(status_code=404, detail=f"Atividade {item.atividade_id} não encontrada")

        setor_id = item.setor_id
        if atividade.tipo == "MOI":
            setor_id = None
        elif atividade.tipo == "MOD":
            setor_id = atividade.setor_id or setor_id
            if not setor_id:
                raise HTTPException(status_code=400, detail=f"Setor obrigatório para atividade MOD {atividade.descricao}")

        mdo = MaoDeObra(
            data=payload.data,
            atividade_id=atividade.id,
            setor_id=setor_id,
            quantidade_pessoas=item.quantidade_pessoas,
        )
        db.add(mdo)
        registros.append(mdo)

    if not registros:
        raise HTTPException(status_code=400, detail="Informe ao menos um item com quantidade maior que zero")

    db.commit()
    for registro in registros:
        db.refresh(registro)
    return registros


@router.delete("/maodeobra/{mdo_id}", status_code=204)
def excluir_maodeobra(
    mdo_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PROD)),
):
    mdo = db.query(MaoDeObra).filter(MaoDeObra.id == mdo_id).first()
    if mdo:
        db.delete(mdo)
        db.commit()


# ─── Atividades de Mão de Obra ─────────────────────────────────────────────────

@router.get("/atividades-maodeobra", response_model=List[ArividadeMaoDeObraOut])
def listar_atividades_maodeobra(
    tipo: Optional[str] = Query(None, description="MOI ou MOD"),
    setor_id: Optional[int] = Query(None),
    grupo_setor: Optional[str] = Query(None, description="12 ou 34 para MOI agrupado"),
    ativo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """
    Lista atividades de mão de obra.
    
    - tipo: 'MOI' (indireta) ou 'MOD' (direta)
    - setor_id: Filtra por setor (apenas MOD)
    - ativo: Filtra por status
    """
    q = db.query(AtividadeMaoDeObra)
    if tipo:
        q = q.filter(AtividadeMaoDeObra.tipo == tipo.upper())
    if setor_id is not None:
        q = q.filter(AtividadeMaoDeObra.setor_id == setor_id)
    if grupo_setor is not None:
        q = q.filter(AtividadeMaoDeObra.grupo_setor == grupo_setor)
    if ativo is not None:
        q = q.filter(AtividadeMaoDeObra.ativo == ativo)
    
    return q.order_by(AtividadeMaoDeObra.tipo, AtividadeMaoDeObra.descricao).all()


@router.post("/atividades-maodeobra", response_model=ArividadeMaoDeObraOut, status_code=201)
def criar_atividade_maodeobra(
    tipo: str,
    descricao: str,
    setor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN, NivelAcesso.PCP)),
):
    """
    Criar nova atividade de mão de obra.
    
    - tipo: 'MOI' (sem setor específico) ou 'MOD' (com setor)
    - descricao: Nome da atividade
    - setor_id: Obrigatório para MOD, deve ser None para MOI
    """
    if tipo.upper() not in ("MOI", "MOD"):
        raise HTTPException(status_code=400, detail="tipo deve ser 'MOI' ou 'MOD'")
    
    if tipo.upper() == "MOD" and not setor_id:
        raise HTTPException(status_code=400, detail="setor_id é obrigatório para MOD")
    
    if tipo.upper() == "MOI" and setor_id:
        raise HTTPException(status_code=400, detail="setor_id deve ser None para MOI")
    
    # Validar se setor existe
    if setor_id:
        from app.models.setor import Setor
        setor = db.query(Setor).filter(Setor.id == setor_id).first()
        if not setor:
            raise HTTPException(status_code=404, detail=f"Setor {setor_id} não encontrado")
    
    # Verificar duplicata
    existing = db.query(AtividadeMaoDeObra).filter(
        AtividadeMaoDeObra.descricao == descricao
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Esta atividade já existe")
    
    atividade = AtividadeMaoDeObra(
        tipo=tipo.upper(),
        descricao=descricao,
        setor_id=setor_id,
        ativo=True
    )
    db.add(atividade)
    db.commit()
    db.refresh(atividade)
    return atividade


@router.delete("/atividades-maodeobra/{atividade_id}", status_code=204)
def excluir_atividade_maodeobra(
    atividade_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(NivelAcesso.ADMIN, NivelAcesso.PCP)),
):
    """Deletar atividade de mão de obra."""
    atividade = db.query(AtividadeMaoDeObra).filter(
        AtividadeMaoDeObra.id == atividade_id
    ).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    
    db.delete(atividade)
    db.commit()


# ─── Rateio de MOI ────────────────────────────────────────────────────────────

@router.post("/maodeobra-com-rateio", response_model=MaoDeObraComRateioOut, status_code=201)
def criar_maodeobra_com_rateio(
    payload: MaoDeObraRateioCreate,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PROD)),
):
    """
    Criar MOI consolidado com rateio para os setores do grupo.
    
    Exemplo:
    {
      "data": "2026-04-11",
      "atividade_id": 4,  # "Produção Setor 1 e 2" (grupo_setor='12')
      "quantidade_pessoas": 10,
      "rateio": [
        {"setor_id": 1, "quantidade_rateada": 6},
        {"setor_id": 2, "quantidade_rateada": 4}
      ]
    }
    """
    # Validar atividade
    atividade = db.query(AtividadeMaoDeObra).filter(
        AtividadeMaoDeObra.id == payload.atividade_id
    ).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    
    if atividade.tipo != "MOI":
        raise HTTPException(status_code=400, detail="Apenas MOI pode usar rateio")
    
    # Validar que tem rateio
    if not payload.rateio:
        raise HTTPException(status_code=400, detail="Rateio é obrigatório")
    
    # Validar soma do rateio
    total_rateado = sum(r.quantidade_rateada for r in payload.rateio)
    if total_rateado != payload.quantidade_pessoas:
        raise HTTPException(
            status_code=400,
            detail=f"Soma do rateio ({total_rateado}) deve ser igual à quantidade total ({payload.quantidade_pessoas})"
        )
    
    # Criar registro de MOI (sem setor_id)
    mdo = MaoDeObra(
        data=payload.data,
        atividade_id=payload.atividade_id,
        setor_id=None,  # MOI não tem setor
        quantidade_pessoas=payload.quantidade_pessoas
    )
    db.add(mdo)
    db.flush()  # Para obter o ID
    
    # Criar rateios
    for r in payload.rateio:
        # Validar setor
        from app.models.setor import Setor
        setor = db.query(Setor).filter(Setor.id == r.setor_id).first()
        if not setor:
            raise HTTPException(status_code=404, detail=f"Setor {r.setor_id} não encontrado")
        
        rateio = MaoDeObraRateio(
            maodeobra_id=mdo.id,
            setor_id=r.setor_id,
            quantidade_rateada=r.quantidade_rateada
        )
        db.add(rateio)
    
    db.commit()
    db.refresh(mdo)
    return mdo


@router.get("/maodeobra-com-rateio/{mdo_id}", response_model=MaoDeObraComRateioOut)
def obter_maodeobra_com_rateio(
    mdo_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """Obter MOI com seus rateios"""
    mdo = db.query(MaoDeObra).filter(MaoDeObra.id == mdo_id).first()
    if not mdo:
        raise HTTPException(status_code=404, detail="Registro de mão de obra não encontrado")
    return mdo


@router.get("/maodeobra-grupo/{grupo_setor}", response_model=List[MaoDeObraComRateioOut])
def listar_maodeobra_grupo(
    grupo_setor: str,
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_LEITURA)),
):
    """
    Listar MOI consolidado de um grupo de setores ('12' ou '34').
    
    Exemplo: /api/maodeobra-grupo/12?data_inicio=2026-04-01&data_fim=2026-04-11
    """
    if grupo_setor not in ('12', '34'):
        raise HTTPException(status_code=400, detail="grupo_setor deve ser '12' ou '34'")
    
    # Buscar atividades do grupo
    atividades = db.query(AtividadeMaoDeObra).filter(
        AtividadeMaoDeObra.tipo == "MOI",
        AtividadeMaoDeObra.grupo_setor == grupo_setor
    ).all()
    
    if not atividades:
        return []
    
    atividade_ids = [a.id for a in atividades]
    
    # Buscar MOI com esses IDs
    q = db.query(MaoDeObra).filter(
        MaoDeObra.atividade_id.in_(atividade_ids),
        MaoDeObra.setor_id.is_(None)  # MOI consolidado
    )
    
    if data_inicio:
        q = q.filter(MaoDeObra.data >= data_inicio)
    if data_fim:
        q = q.filter(MaoDeObra.data <= data_fim)
    
    return q.order_by(MaoDeObra.data.desc()).all()
