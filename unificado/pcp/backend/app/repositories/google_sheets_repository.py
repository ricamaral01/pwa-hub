from datetime import date
import json
import logging
import os
from typing import Any

import gspread
from google.oauth2.service_account import Credentials

from app.core.config import settings
from app.models.alocacao_formas import DadosProgramacaoSheets

logger = logging.getLogger(__name__)


class GoogleSheetsRepositoryError(RuntimeError):
    """Erro de leitura ou configuracao do Google Sheets."""


class GoogleSheetsRepository:
    """Repositorio responsavel por ler a programacao e formas no Google Sheets."""

    SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
    ]

    PROGRAMACAO_WORKSHEET = "Prog Circular modelo mensal"
    PROGRAMACAO_RANGE = "A4:AH151"
    PROGRAMACAO_SETOR4_WORKSHEET = "Prog DT Rede mensal"
    PROGRAMACAO_SETOR4_RANGE = "A4:AH69"
    FORMAS_RANGE = "A1:BA39"
    FORMAS_SETOR4_WORKSHEET = "SETOR 4"
    FORMAS_SETOR4_RANGE = "A1:BA120"

    def __init__(self, credentials_value: str | None = None, spreadsheet_id: str | None = None) -> None:
        self.credentials_value = credentials_value or settings.GOOGLE_CREDENTIALS
        self.spreadsheet_id = spreadsheet_id or settings.SPREADSHEET_ID

    def carregar_dados_setor3(
        self,
        data_inicial: date | None = None,
        data_final: date | None = None,
    ) -> DadosProgramacaoSheets:
        """Carrega do Google Sheets as abas usadas para alocar formas do Setor 3."""

        return self.carregar_dados_setor(setor=3, data_inicial=data_inicial, data_final=data_final)

    def carregar_dados_setor(
        self,
        setor: int,
        data_inicial: date | None = None,
        data_final: date | None = None,
    ) -> DadosProgramacaoSheets:
        """Carrega do Google Sheets as abas usadas para alocar formas do setor informado."""

        if not self.credentials_value:
            raise GoogleSheetsRepositoryError("GOOGLE_CREDENTIALS nao configurado")
        spreadsheet_id = self._spreadsheet_id_para_periodo(data_inicial, data_final)
        if not spreadsheet_id:
            raise GoogleSheetsRepositoryError("SPREADSHEET_ID nao configurado")

        try:
            spreadsheet = self._abrir_spreadsheet(spreadsheet_id)
            worksheet_name, worksheet_range = self._programacao_config(setor)
            aba_programacao = self._selecionar_aba_por_nome(spreadsheet, worksheet_name)
            valores_prog = aba_programacao.get(worksheet_range)
            cabecalhos_prog, linhas_prog = self._split_header(valores_prog, header_index=0)

            if setor == 4:
                aba_formas = spreadsheet.worksheet(self.FORMAS_SETOR4_WORKSHEET)
                valores_formas = aba_formas.get(self.FORMAS_SETOR4_RANGE)
                poste_para_formas = self._mapear_postes_para_formas_setor4(valores_formas)
            else:
                aba_formas = self._selecionar_aba_formas(spreadsheet)
                valores_formas = aba_formas.get(self.FORMAS_RANGE)
                cabecalhos_formas, linhas_formas = self._split_header(valores_formas, header_index=1)
                poste_para_formas = self._mapear_postes_para_formas(cabecalhos_formas, linhas_formas)

            return DadosProgramacaoSheets(
                cabecalhos_programacao=cabecalhos_prog,
                linhas_programacao=linhas_prog,
                poste_para_formas=poste_para_formas,
            )
        except GoogleSheetsRepositoryError:
            raise
        except Exception as exc:
            logger.exception("Falha ao carregar dados do Google Sheets")
            raise GoogleSheetsRepositoryError("Falha ao carregar dados do Google Sheets") from exc

    def _spreadsheet_id_para_periodo(
        self,
        data_inicial: date | None = None,
        data_final: date | None = None,
    ) -> str:
        if (
            data_inicial
            and data_final
            and data_inicial.year == data_final.year
            and data_inicial.month == data_final.month == 9
            and settings.SPREADSHEET_ID_09
        ):
            return settings.SPREADSHEET_ID_09
        return self.spreadsheet_id

    def _abrir_spreadsheet(self, spreadsheet_id: str) -> Any:
        credentials = self._build_credentials()
        client = gspread.authorize(credentials)
        return client.open_by_key(spreadsheet_id)

    def _programacao_config(self, setor: int) -> tuple[str, str]:
        if setor == 3:
            return self.PROGRAMACAO_WORKSHEET, self.PROGRAMACAO_RANGE
        if setor == 4:
            return self.PROGRAMACAO_SETOR4_WORKSHEET, self.PROGRAMACAO_SETOR4_RANGE
        raise GoogleSheetsRepositoryError("Somente Setor 3 ou Setor 4")

    @staticmethod
    def _selecionar_aba_por_nome(spreadsheet: Any, nome_base: str) -> Any:
        """Aceita o nome historico e abas mensais com prefixo numerico."""
        nome_normalizado = nome_base.strip().casefold()
        worksheets = spreadsheet.worksheets()
        exata = next(
            (worksheet for worksheet in worksheets if worksheet.title.strip().casefold() == nome_normalizado),
            None,
        )
        if exata:
            return exata

        por_sufixo = next(
            (worksheet for worksheet in worksheets if worksheet.title.strip().casefold().endswith(nome_normalizado)),
            None,
        )
        if por_sufixo:
            return por_sufixo

        raise GoogleSheetsRepositoryError(f"Aba do Google Sheets nao encontrada: {nome_base}")

    def _build_credentials(self) -> Credentials:
        value = self.credentials_value.strip()
        if os.path.isfile(value):
            return Credentials.from_service_account_file(value, scopes=self.SCOPES)

        try:
            payload = json.loads(value)
        except json.JSONDecodeError as exc:
            raise GoogleSheetsRepositoryError(
                "GOOGLE_CREDENTIALS deve ser caminho de arquivo JSON ou conteudo JSON da service account"
            ) from exc

        if not isinstance(payload, dict):
            raise GoogleSheetsRepositoryError("GOOGLE_CREDENTIALS JSON invalido")
        return Credentials.from_service_account_info(payload, scopes=self.SCOPES)

    @staticmethod
    def _split_header(values: list[list[Any]], header_index: int) -> tuple[list[str], list[list[str]]]:
        if len(values) <= header_index:
            return [], []

        headers = [str(value).strip() for value in values[header_index]]
        data_rows = values[header_index + 1 :]
        normalized_rows = []
        for row in data_rows:
            normalized_rows.append([str(value).strip() if value is not None else "" for value in row])
        return headers, normalized_rows

    @staticmethod
    def _selecionar_aba_formas(spreadsheet: Any) -> Any:
        titulos = [worksheet.title for worksheet in spreadsheet.worksheets()]
        aba_nome = next((title for title in titulos if "S3" in title and "Programa" in title), None)
        if not aba_nome:
            aba_nome = next((title for title in titulos if "S3" in title), "S3 Programação")
        return spreadsheet.worksheet(aba_nome)

    @staticmethod
    def _mapear_postes_para_formas(headers: list[str], rows: list[list[str]]) -> dict[str, set[str]]:
        poste_para_formas: dict[str, set[str]] = {}
        for col_idx, forma in enumerate(headers):
            if not forma:
                continue
            for row in rows:
                value = row[col_idx] if col_idx < len(row) else ""
                if value and str(value).strip():
                    poste = str(value).strip().upper()
                    poste_para_formas.setdefault(poste, set()).add(str(forma).strip())
        return poste_para_formas

    @classmethod
    def _mapear_postes_para_formas_setor4(cls, values: list[list[Any]]) -> dict[str, set[str]]:
        poste_para_formas: dict[str, set[str]] = {}
        for row in values:
            for idx, cell in enumerate(row):
                if str(cell).strip().lower() != "n forma":
                    continue

                modelo_idx = idx + 1
                for data_row in values:
                    forma = str(data_row[idx]).strip() if idx < len(data_row) else ""
                    modelo = str(data_row[modelo_idx]).strip() if modelo_idx < len(data_row) else ""
                    if not forma or not modelo or forma.lower() == "n forma" or modelo.lower() == "modelo":
                        continue
                    if forma.startswith("#") or modelo.startswith("#"):
                        continue
                    forma_label = f"F{forma}"
                    for key in cls._modelo_variantes_setor4(modelo):
                        poste_para_formas.setdefault(key, set()).add(forma_label)
        for modelo, formas in cls._mapa_estatico_formas_setor4().items():
            for key in cls._modelo_variantes_setor4(modelo):
                poste_para_formas.setdefault(key, set()).update(formas)
        return poste_para_formas

    @staticmethod
    def _modelo_variantes_setor4(modelo: str) -> set[str]:
        clean = str(modelo).strip().upper().replace(",", ".")
        compact = clean.replace(" ", "")
        variants = {clean, compact}
        variants.add(f"{compact} DT")
        variants.add(f"{compact.replace('.', ',')} DT")
        variants.add(compact.replace(".", ","))
        return {item.strip().upper() for item in variants if item.strip()}

    @staticmethod
    def _mapa_estatico_formas_setor4() -> dict[str, set[str]]:
        mapa: dict[str, set[str]] = {}

        def add(forma: str, modelos: list[str]) -> None:
            for modelo in modelos:
                mapa.setdefault(modelo.upper(), set()).add(forma)

        modelos_dtb_01_09 = [
            "12X600", "11X600", "10X600", "9X600", "8X600", "7X600",
            "12X400", "11X400", "10X400", "9X400", "8X400", "7X400",
            "12X300", "11X300", "10X300", "9X300", "8X300", "7X300", "9X1000",
        ]
        for forma in [f"DTB-{idx:02d}" for idx in range(1, 10)]:
            add(forma, modelos_dtb_01_09)

        add("DTB-10", [
            "13.5X600", "12X1000", "11X1000", "9X1000",
            "12X600", "11X600", "10X600", "9X600", "8X600", "7X600",
            "13X400", "12X400", "11X400", "10X400", "9X400", "8X400", "7X400",
            "13X300", "12X300", "11X300", "10X300", "9X300", "8X300", "7X300",
        ])

        add("DTBM-01", ["12X1000", "11X1000", "9X1000"])

        modelos_dtd = ["12X200", "11X200", "10X200", "9X200", "8X200", "7X200"]
        for forma in ["DTD-01", "DTD-02", "DTD-03"]:
            add(forma, modelos_dtd)

        add("DTBM-02", [
            "25X600", "24X600", "23X600", "22X600", "21X600", "20X600",
            "19X600", "18X600", "17X600", "16X600", "15X600", "14X600",
            "12X1000", "11X1000",
        ])

        return mapa
