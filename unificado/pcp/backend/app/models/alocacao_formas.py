from dataclasses import dataclass, field
from datetime import date
from typing import Any


@dataclass(frozen=True)
class ProgramacaoPoste:
    """Quantidade programada para um tipo de poste em uma data."""

    poste: str
    quantidade: int


@dataclass(frozen=True)
class AlocacaoForma:
    """Resultado de alocacao de um poste em uma forma."""

    forma: str
    poste: str
    quantidade: int
    motivo: str | None = None
    detalhes: dict[str, Any] = field(default_factory=dict)


@dataclass
class AlocacaoDia:
    """Alocacao consolidada por data."""

    data: date
    data_planilha: str
    alocacoes: list[AlocacaoForma] = field(default_factory=list)

    @property
    def total_postes(self) -> int:
        return sum(item.quantidade for item in self.alocacoes)


@dataclass(frozen=True)
class DadosProgramacaoSheets:
    """Dados brutos ja estruturados vindos do Google Sheets."""

    cabecalhos_programacao: list[str]
    linhas_programacao: list[list[str]]
    poste_para_formas: dict[str, set[str]]
