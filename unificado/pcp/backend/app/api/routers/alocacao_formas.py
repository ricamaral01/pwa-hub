import logging
import re
import unicodedata
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_roles
from app.models.producao import Programacao
from app.models.produto import Produto
from app.models.usuario import NivelAcesso
from app.repositories.google_sheets_repository import GoogleSheetsRepositoryError
from app.services.alocacao_formas_service import AlocacaoFormasError, AlocacaoFormasService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pcp", tags=["pcp"])

_LEITURA = (NivelAcesso.ADMIN, NivelAcesso.PCP, NivelAcesso.PRODUCAO, NivelAcesso.CONSULTA)
_ESCRITA_PCP = (NivelAcesso.ADMIN, NivelAcesso.PCP)


def _norm_text(value: str | None) -> str:
    text = (value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", text)


@router.get("/alocacao-formas")
def listar_alocacao_formas(
    data_inicial: date = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    data_final: date = Query(..., description="Data final no formato YYYY-MM-DD"),
    setor: int = Query(3, description="Setor da programacao. Atualmente suportado: 3"),
    _=Depends(require_roles(*_LEITURA)),
) -> dict:
    """
    Retorna a alocacao automatica de formas do Google Sheets para JSON.

    A resposta nao grava HTML nem arquivos locais; ela apenas consulta a planilha,
    aplica a regra de distribuicao e devolve o resultado para o SaaS consumir.
    """

    try:
        service = AlocacaoFormasService()
        return service.gerar_alocacao_formas(data_inicial=data_inicial, data_final=data_final, setor=setor)
    except AlocacaoFormasError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GoogleSheetsRepositoryError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Erro inesperado ao gerar alocacao de formas")
        raise HTTPException(status_code=500, detail="Erro inesperado ao gerar alocacao de formas") from exc


@router.post("/alocacao-formas/importar")
def importar_alocacao_formas(
    data_inicial: date = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    data_final: date = Query(..., description="Data final no formato YYYY-MM-DD"),
    setor: int = Query(3, description="Setor da programacao. Atualmente suportado: 3"),
    substituir: bool = Query(True, description="Remove programacoes existentes do periodo/setor antes de importar"),
    db: Session = Depends(get_db),
    _=Depends(require_roles(*_ESCRITA_PCP)),
) -> dict:
    """
    Sincroniza a planilha Google e grava a alocacao na tabela oficial programacoes.

    Linhas sem produto cadastrado ou sem forma real nao sao gravadas; elas voltam
    em `ignorados` para analise do usuario.
    """

    try:
        service = AlocacaoFormasService()
        resultado = service.gerar_alocacao_formas(data_inicial=data_inicial, data_final=data_final, setor=setor)
    except AlocacaoFormasError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GoogleSheetsRepositoryError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Erro inesperado ao gerar alocacao de formas para importacao")
        raise HTTPException(status_code=500, detail="Erro inesperado ao gerar alocacao de formas") from exc

    produtos = db.query(Produto).filter(Produto.setor_id == setor).all()
    produtos_por_nome = {_norm_text(produto.nome): produto for produto in produtos}

    registros: list[Programacao] = []
    ignorados: list[dict] = []

    for dia in resultado.get("datas", []):
        data_prog = date.fromisoformat(dia["data"])
        for item in dia.get("alocacoes", []):
            forma = item.get("forma") or ""
            poste = item.get("poste") or ""
            quantidade = int(item.get("quantidade") or 0)

            if not forma or forma == "FALTOU FORMA DISPONÍVEL":
                motivo_alocacao = item.get("motivo") or "forma_indisponivel"
                ignorados.append({
                    "data": data_prog.isoformat(),
                    "forma": forma,
                    "poste": poste,
                    "quantidade": quantidade,
                    "motivo": motivo_alocacao,
                    "detalhes": item.get("detalhes") or {},
                })
                continue

            produto = produtos_por_nome.get(_norm_text(poste))
            if not produto:
                ignorados.append({
                    "data": data_prog.isoformat(),
                    "forma": forma,
                    "poste": poste,
                    "quantidade": quantidade,
                    "motivo": "produto_nao_cadastrado",
                    "detalhes": {},
                })
                continue

            volume_unitario = Decimal(str(produto.volume or 0))
            registros.append(Programacao(
                data=data_prog,
                setor_id=setor,
                produto_id=produto.id,
                codigo_forma=forma,
                quantidade_programada=quantidade,
                volume_m3_programado=volume_unitario * quantidade,
            ))

    removidos = 0
    if substituir:
        query = db.query(Programacao).filter(
            Programacao.data >= data_inicial,
            Programacao.data <= data_final,
            Programacao.setor_id == setor,
        )
        removidos = query.count()
        query.delete(synchronize_session=False)

    for registro in registros:
        db.add(registro)
    db.commit()

    return {
        "importados": len(registros),
        "removidos": removidos,
        "ignorados": ignorados,
        "total_ignorados": len(ignorados),
        "substituir": substituir,
        "alocacao": {
            "total_datas": resultado.get("total_datas", 0),
            "total_postes": resultado.get("total_postes", 0),
            "total_faltas_forma": resultado.get("total_faltas_forma", 0),
        },
    }
