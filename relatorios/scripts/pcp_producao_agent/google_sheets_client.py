import logging
import unicodedata
from datetime import datetime

import gspread
from google.oauth2.service_account import Credentials

import config

logger = logging.getLogger("pcp_producao_agent")


def normalize_text(value):
    text = str(value or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def parse_int(value):
    text = str(value or "").strip()
    if not text:
        return 0
    try:
        return int(text)
    except ValueError:
        try:
            return int(float(text.replace(".", "").replace(",", ".")))
        except Exception:
            return 0


class GoogleSheetsClient:
    def __init__(self):
        self.creds_path = config.GOOGLE_CREDS_PATH
        self.spreadsheet_id = config.SPREADSHEET_ID
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

    def _select_worksheet(self, spreadsheet):
        worksheets = spreadsheet.worksheets()

        exact = next((w for w in worksheets if normalize_text(w.title) == "5 - pcp diario - padrao"), None)
        if exact:
            return exact

        candidates = [
            w
            for w in worksheets
            if "pcp" in normalize_text(w.title)
            and "diario" in normalize_text(w.title)
            and "padrao" in normalize_text(w.title)
        ]
        if candidates:
            return candidates[0]

        raise ValueError(
            "Aba PCP diário padrão não encontrada. Abas disponíveis: "
            + ", ".join(w.title for w in worksheets[:20])
        )

    def _find_date_column(self, headers, date_str):
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        candidates = {
            dt.strftime("%d/%m/%y"),
            f"{dt.day}/{dt.month}/{dt.strftime('%y')}",
            dt.strftime("%d/%m/%Y"),
            f"{dt.day}/{dt.month}/{dt.year}",
        }

        normalized_headers = [str(h or "").strip() for h in headers]
        for i, header in enumerate(normalized_headers):
            if header in candidates or any(candidate in header for candidate in candidates):
                return i

        date_headers = [h for h in normalized_headers if "/" in h and h.strip()]
        preview = ", ".join(date_headers[:8])
        if len(date_headers) > 8:
            preview += ", ..."
        raise ValueError(
            f"Cabeçalho da data '{dt.strftime('%d/%m/%y')}' não encontrado na linha 1. "
            f"Datas encontradas: {preview or 'nenhuma'}"
        )

    def fetch_pcp_programacao(self, date_str):
        """
        Acessa a planilha e extrai o planejamento da aba PCP DIÁRIO - PADRÃO para a data.
        Retorna a quantidade programada (P) e a realizada apontada (R).
        """
        logger.info("Conectando ao Google Sheets...")
        try:
            creds = Credentials.from_service_account_file(self.creds_path, scopes=self.scopes)
            client = gspread.authorize(creds)

            logger.info(f"Abrindo planilha ID: {self.spreadsheet_id}...")
            spreadsheet = client.open_by_key(self.spreadsheet_id)
            worksheet = self._select_worksheet(spreadsheet)

            logger.info(f"Acessando aba '{worksheet.title}'...")
            values = worksheet.get_all_values()
            if len(values) < 4:
                raise ValueError(f"Aba '{worksheet.title}' não possui linhas suficientes para leitura.")

            headers = values[0]
            col_idx = self._find_date_column(headers, date_str)
            logger.info(f"Coluna da data encontrada no índice zero-based: {col_idx}")

            headers_lower = [normalize_text(h) for h in headers]
            col_cod = next((i for i, h in enumerate(headers_lower) if "montagem" in h), 1)
            col_desc = next((i for i, h in enumerate(headers_lower) if "descri" in h), 2)
            col_setor = next((i for i, h in enumerate(headers_lower) if "setor" in h), 5)

            filtered_rows = []
            required_idx = max(col_cod, col_desc, col_setor, col_idx + 1)

            for index, row in enumerate(values[3:], start=4):
                if len(row) <= required_idx:
                    continue

                codigo = str(row[col_cod]).strip()
                modelo = str(row[col_desc]).strip()
                setor = str(row[col_setor]).strip()

                if not codigo and not modelo:
                    continue

                if normalize_text(setor) not in {"1", "2", "3", "4", "s1", "s2", "s3", "s4", "setor 1", "setor 2", "setor 3", "setor 4"}:
                    continue

                filtered_rows.append(
                    {
                        "row_num": index,
                        "date": date_str,
                        "setor": setor,
                        "modelo": modelo,
                        "codigo": codigo,
                        "quantidade_programada": parse_int(row[col_idx]),
                        "realizado_encarregado": parse_int(row[col_idx + 1]),
                    }
                )

            logger.info(f"Fim da leitura. Extraídas {len(filtered_rows)} linhas da planilha com colunas P e R.")
            return filtered_rows

        except Exception as e:
            logger.error(f"Falha ao processar o Google Sheets: {e}")
            raise
