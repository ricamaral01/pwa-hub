import logging
from datetime import date
import re

from app.models.alocacao_formas import AlocacaoDia, AlocacaoForma, DadosProgramacaoSheets, ProgramacaoPoste
from app.models.mapeamento_forma_poste import MapeamentoFormaPoste
from app.core.database import SessionLocal
from app.repositories.google_sheets_repository import GoogleSheetsRepository

logger = logging.getLogger(__name__)

REGRA_FORMAS_CR_DATA_INICIAL = date(2026, 6, 23)
# Regra operacional: para estes postes, depois das formas compativeis,
# completar formas circulares vazias para nao deixar forma parada na programacao.
POSTES_PREENCHER_FORMAS_VAZIAS = {"12X400"}


def _norm_poste_key(value: str) -> str:
    return str(value or "").strip().upper().replace(",", ".").replace("  ", " ")


def _is_poste_cr(value: str) -> bool:
    text = _norm_poste_key(value)
    compact = re.sub(r"[^A-Z0-9]+", "", text)
    return bool(
        re.search(r"(^|[^A-Z0-9])CR($|[^A-Z0-9])", text)
        or compact.endswith("CR")
    )


def _deve_preencher_formas_vazias(value: str) -> bool:
    return _norm_poste_key(value) in POSTES_PREENCHER_FORMAS_VAZIAS


class AlocacaoFormasError(RuntimeError):
    """Erro de validacao ou processamento da alocacao de formas."""


class AlocacaoFormasService:
    """Service com a regra de alocacao automatica de formas."""

    def __init__(self, repository: GoogleSheetsRepository | None = None) -> None:
        self.repository = repository or GoogleSheetsRepository()

    def gerar_alocacao_formas(self, data_inicial: date, data_final: date, setor: int) -> dict:
        """
        Gera a alocacao de formas para o periodo informado.

        A regra replica o script original:
        - le a programacao circular;
        - le as formas capazes por poste;
        - para cada poste/data, aloca 1 unidade por forma ainda livre;
        - quando a quantidade excede as formas livres, registra falta de forma.
        """

        if data_final < data_inicial:
            raise AlocacaoFormasError("data_final deve ser maior ou igual a data_inicial")
        if setor not in (3, 4):
            raise AlocacaoFormasError("Neste modulo, somente Setor 3 ou Setor 4 estao disponiveis")

        dados = self.repository.carregar_dados_setor(
            setor=setor,
            data_inicial=data_inicial,
            data_final=data_final,
        )
        self._mesclar_mapeamento_local(dados, setor)
        formas_cr = self._coletar_formas_cr(dados.poste_para_formas)
        todas_formas = self._coletar_todas_formas(dados.poste_para_formas)
        dias = self._processar_periodo(dados, data_inicial, data_final, formas_cr, todas_formas)

        total_postes = sum(dia.total_postes for dia in dias)
        total_faltas = sum(
            item.quantidade
            for dia in dias
            for item in dia.alocacoes
            if item.forma == "FALTOU FORMA DISPONÍVEL"
        )

        return {
            "data_inicial": data_inicial.isoformat(),
            "data_final": data_final.isoformat(),
            "setor": setor,
            "total_datas": len(dias),
            "total_postes": total_postes,
            "total_faltas_forma": total_faltas,
            "datas": [self._serialize_dia(dia) for dia in dias],
        }

    def _processar_periodo(
        self,
        dados: DadosProgramacaoSheets,
        data_inicial: date,
        data_final: date,
        formas_cr: set[str] | None = None,
        todas_formas: set[str] | None = None,
    ) -> list[AlocacaoDia]:
        dias: list[AlocacaoDia] = []
        headers = dados.cabecalhos_programacao

        for col_idx, data_planilha in enumerate(headers[3:], start=3):
            if not data_planilha or str(data_planilha).strip() == "":
                continue

            data_coluna = self._parse_data_coluna(str(data_planilha).strip(), data_inicial.year)
            if not data_coluna or data_coluna < data_inicial or data_coluna > data_final:
                continue

            producao_do_dia = self._extrair_producao_do_dia(dados.linhas_programacao, col_idx)
            if not producao_do_dia:
                continue

            alocacoes = self._alocar_dia(
                producao_do_dia,
                dados.poste_para_formas,
                data_coluna,
                formas_cr or set(),
                todas_formas or set(),
            )
            if alocacoes:
                dias.append(AlocacaoDia(data=data_coluna, data_planilha=str(data_planilha), alocacoes=alocacoes))

            if len(dias) >= 31:
                break

        return dias

    @staticmethod
    def _mesclar_mapeamento_local(dados: DadosProgramacaoSheets, setor: int) -> None:
        """
        Complementa a matriz do Google Sheets com compatibilidades cadastradas
        no PCP. Assim correcoes operacionais em mapeamento_forma_postes entram
        imediatamente na alocacao automatica.
        """
        db = SessionLocal()
        try:
            rows = db.query(MapeamentoFormaPoste).filter(
                MapeamentoFormaPoste.setor_id == setor,
                MapeamentoFormaPoste.ativo == True,
            ).all()
            for row in rows:
                forma = str(row.codigo_forma or "").strip()
                poste = str(row.poste_circular or "").strip().upper()
                if not forma or not poste:
                    continue
                for key in {poste, _norm_poste_key(poste)}:
                    dados.poste_para_formas.setdefault(key, set()).add(forma)
        finally:
            db.close()

    @staticmethod
    def _coletar_formas_cr(poste_para_formas: dict[str, set[str]]) -> set[str]:
        formas: set[str] = set()
        for poste, formas_poste in poste_para_formas.items():
            for forma in formas_poste:
                forma_text = str(forma or "").strip()
                if not forma_text:
                    continue
                if _is_poste_cr(poste) or _is_poste_cr(forma_text):
                    formas.add(forma_text)
        return formas

    @staticmethod
    def _coletar_todas_formas(poste_para_formas: dict[str, set[str]]) -> set[str]:
        formas: set[str] = set()
        for formas_poste in poste_para_formas.values():
            for forma in formas_poste:
                forma_text = str(forma or "").strip()
                if forma_text:
                    formas.add(forma_text)
        return formas

    @staticmethod
    def _extrair_producao_do_dia(rows: list[list[str]], col_idx: int) -> list[ProgramacaoPoste]:
        producao_do_dia: list[ProgramacaoPoste] = []
        for row in rows:
            poste = str(row[0]).strip().upper() if row else ""
            if not poste or poste in {"NONE", "NAN"}:
                continue

            qtd = row[col_idx] if col_idx < len(row) else ""
            qtd_text = str(qtd).strip()
            if not qtd_text or qtd_text.upper() in {"NONE", "NAN", "0", "P"}:
                continue

            try:
                qtd_int = int(float(qtd_text.replace(",", ".")))
            except ValueError:
                logger.warning("Quantidade invalida ignorada: poste=%s quantidade=%s", poste, qtd_text)
                continue

            producao_do_dia.append(ProgramacaoPoste(poste=poste, quantidade=qtd_int))
        return producao_do_dia

    @staticmethod
    def _alocar_dia(
        producao_do_dia: list[ProgramacaoPoste],
        poste_para_formas: dict[str, set[str]],
        data_alocacao: date | None = None,
        formas_cr: set[str] | None = None,
        todas_formas: set[str] | None = None,
    ) -> list[AlocacaoForma]:
        alocacao_dia: list[AlocacaoForma] = []
        formas_usadas: set[str] = set()
        todas_formas = todas_formas or set()
        formas_cr = formas_cr or set()

        for item in producao_do_dia:
            if (
                data_alocacao
                and data_alocacao >= REGRA_FORMAS_CR_DATA_INICIAL
                and _is_poste_cr(item.poste)
            ):
                formas_capazes = sorted(formas_cr)
            else:
                formas_capazes = sorted(
                    list(
                        poste_para_formas.get(item.poste, [])
                        or poste_para_formas.get(_norm_poste_key(item.poste), [])
                    )
                )
            alocados = 0
            formas_alocadas: list[str] = []

            for forma in formas_capazes:
                if alocados >= item.quantidade:
                    break
                if forma not in formas_usadas:
                    formas_usadas.add(forma)
                    formas_alocadas.append(forma)
                    alocacao_dia.append(AlocacaoForma(forma=forma, poste=item.poste, quantidade=1))
                    alocados += 1

            formas_preenchimento: list[str] = []
            if alocados < item.quantidade and _deve_preencher_formas_vazias(item.poste):
                formas_fallback = sorted(
                    forma
                    for forma in todas_formas
                    if forma not in formas_usadas
                    and forma not in formas_capazes
                    and forma not in formas_cr
                )
                for forma in formas_fallback:
                    if alocados >= item.quantidade:
                        break
                    formas_usadas.add(forma)
                    formas_preenchimento.append(forma)
                    alocacao_dia.append(AlocacaoForma(forma=forma, poste=item.poste, quantidade=1))
                    alocados += 1

            if alocados < item.quantidade:
                formas_ocupadas = [forma for forma in formas_capazes if forma in formas_usadas and forma not in formas_alocadas]
                motivo = "sem_forma_mapeada" if not formas_capazes else "formas_insuficientes"
                alocacao_dia.append(
                    AlocacaoForma(
                        forma="FALTOU FORMA DISPONÍVEL",
                        poste=item.poste,
                        quantidade=item.quantidade - alocados,
                        motivo=motivo,
                        detalhes={
                            "quantidade_solicitada": item.quantidade,
                            "quantidade_alocada": alocados,
                            "quantidade_nao_alocada": item.quantidade - alocados,
                            "total_formas_capazes": len(formas_capazes),
                            "formas_capazes": formas_capazes,
                            "formas_alocadas_para_poste": formas_alocadas,
                            "formas_preenchimento_vazio": formas_preenchimento,
                            "formas_capazes_ocupadas": formas_ocupadas,
                        },
                    )
                )

        alocacao_dia.sort(key=lambda item: item.forma)
        return alocacao_dia

    @staticmethod
    def _parse_data_coluna(value: str, default_year: int) -> date | None:
        text = value.strip()
        if not text:
            return None

        try:
            return date.fromisoformat(text)
        except ValueError:
            pass

        parts = text.split("/")
        if len(parts) >= 2:
            try:
                day = int(parts[0])
                month = int(parts[1])
                year = int(parts[2]) if len(parts) >= 3 and parts[2] else default_year
                if year < 100:
                    year += 2000
                return date(year, month, day)
            except ValueError:
                logger.warning("Data de coluna invalida ignorada: %s", value)
                return None

        logger.warning("Formato de data de coluna nao reconhecido: %s", value)
        return None

    @staticmethod
    def _serialize_dia(dia: AlocacaoDia) -> dict:
        return {
            "data": dia.data.isoformat(),
            "data_planilha": dia.data_planilha,
            "total_postes": dia.total_postes,
            "alocacoes": [
                {
                    "forma": item.forma,
                    "poste": item.poste,
                    "quantidade": item.quantidade,
                    "motivo": item.motivo,
                    "detalhes": item.detalhes,
                }
                for item in dia.alocacoes
            ],
        }
