from copy import deepcopy

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..erros import ErroAPI
from ..modelos import LegadoId, Usuario
from ..validacao import validar_generico, validar_traco
from .documentos import auditar, gravar


TIPOS = {"tracos", "custos", "fornecedores", "materiais", "ensaios"}


def importar_legado(session: Session, dados: dict, usuario: Usuario) -> dict:
    registros = dados.get("registros")
    if not isinstance(registros, list) or len(registros) > 500:
        raise ErroAPI("LIMITE", "Envie até 500 registros por lote.")
    simular = dados.get("simulacao") is not False
    avisos: list[str] = []
    amostras: list[dict] = []
    convertidos = duplicados = gravados = 0
    for index, registro in enumerate(registros):
        try:
            if not isinstance(registro, dict):
                raise ErroAPI("VALIDACAO", "Registro inválido.")
            tipo = str(registro.get("tipo") or "")
            origem = str(registro.get("origem") or "")
            antigo = str(registro.get("id_antigo") or "")
            d = registro.get("documento")
            if tipo not in TIPOS or not origem or not antigo or not isinstance(d, dict):
                raise ErroAPI("VALIDACAO", "Tipo, origem, ID antigo e documento são obrigatórios.")
            d = deepcopy(d)
            d["unidade"] = str(d.get("unidade") or dados.get("unidadePadrao") or "")
            if tipo == "tracos":
                validar_traco(d)
            else:
                validar_generico(tipo, d)
            existente = session.scalar(select(LegadoId).where(LegadoId.origem == origem, LegadoId.id_antigo == antigo))
            convertidos += 1
            if existente:
                duplicados += 1
                continue
            if len(amostras) < 5:
                amostras.append({"tipo": tipo, "origem": origem, "id_antigo": antigo, "nome": d.get("nome") or d.get("nomeProduto")})
            if not simular:
                d["origem"] = origem
                d["idAntigo"] = antigo
                d["versao"] = 1
                d["revisao"] = 1
                if tipo == "tracos":
                    d["status"] = "rascunho"
                row = gravar(session, tipo, d)
                session.add(LegadoId(origem=origem, id_antigo=antigo, tipo=tipo, documento_chave=row.chave))
                auditar(session, usuario, "importacao.legado", tipo, d)
                gravados += 1
        except ErroAPI as erro:
            avisos.append(f"Linha {index + 1}: {erro.mensagem}")
    return {"id": "importacao.legado", "versao": 1, "revisao": 1, "simulacao": simular,
            "lidos": len(registros), "convertidos": convertidos, "duplicados": duplicados,
            "gravados": gravados, "avisos": avisos, "amostras": amostras}
