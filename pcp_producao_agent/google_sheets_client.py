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


def normalize_code(value):
    text = str(value or "").strip()
    compact = text.replace(".", "").replace(",", "")
    return compact if compact.isdigit() else text


# ---------------------------------------------------------------------------
# Detectores de layout de aba
# ---------------------------------------------------------------------------

def _is_tab18_layout(headers):
    """
    Retorna True se o cabeçalho corresponde ao layout '18 - Prod. S1 e S2':
    sem colunas P/R explícitas, datas como DD/MM a partir da coluna 4
    e colunas fixas: Descrição, SETOR, Cód. SMA, Cód. Pro.
    """
    if len(headers) < 5:
        return False
    norm = [normalize_text(h) for h in headers[:4]]
    has_setor = any("setor" in n for n in norm)
    has_cod = any("cod" in n or "cod" in n for n in norm)
    # Col 4+ devem ter datas DD/MM (até 5 chars)
    has_date_cols = any(
        "/" in str(headers[i]).strip() and len(str(headers[i]).strip()) <= 5
        for i in range(4, min(len(headers), 10))
    )
    return has_setor and has_cod and has_date_cols


def _is_padrao_layout(headers):
    """
    Retorna True se o cabeçalho corresponde ao layout antigo 'PCP DIÁRIO - PADRÃO'
    com colunas P e R explícitas por data.
    """
    norm = [normalize_text(h) for h in headers]
    has_montagem = any("montagem" in n for n in norm)
    has_descri = any("descri" in n for n in norm)
    return has_montagem and has_descri


class GoogleSheetsClient:
    def __init__(self):
        self.creds_path = config.GOOGLE_CREDS_PATH
        self.spreadsheet_id = config.SPREADSHEET_ID
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]

    # ------------------------------------------------------------------
    # Seleção de aba
    # ------------------------------------------------------------------

    def _select_worksheet(self, spreadsheet):
        worksheets = spreadsheet.worksheets()

        # 1. Prioridade: aba PCP DIARIO - PADRAO, pois contem P e R.
        exact = next(
            (w for w in worksheets if normalize_text(w.title) == "5 - pcp diario - padrao"),
            None,
        )
        if exact:
            logger.info(f"Aba selecionada (layout padrao P/R): '{exact.title}'")
            return exact

        candidates = [
            w
            for w in worksheets
            if "pcp" in normalize_text(w.title)
            and "diario" in normalize_text(w.title)
            and "padrao" in normalize_text(w.title)
        ]
        if candidates:
            logger.info(f"Aba selecionada (fallback padrao P/R): '{candidates[0].title}'")
            return candidates[0]

        # 2. Fallback: aba 18. Ela nao possui R explicito.
        tab18 = next(
            (w for w in worksheets if normalize_text(w.title) == normalize_text("18 - Prod. S1 e S2")),
            None,
        )
        if tab18:
            logger.info(f"Aba selecionada (layout sem R explicito): '{tab18.title}'")
            return tab18

        raise ValueError(
            "Nenhuma aba PCP encontrada. Abas disponiveis: "
            + ", ".join(w.title for w in worksheets[:20])
        )

    # ------------------------------------------------------------------
    # Localizadores de coluna de data
    # ------------------------------------------------------------------

    def _find_date_column_tab18(self, headers, date_str):
        """Localiza coluna de data no formato DD/MM (aba 18 - Prod. S1 e S2)."""
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        candidates = {
            dt.strftime("%d/%m"),
            f"{dt.day}/{dt.month:02d}",
            f"{dt.day}/{dt.month}",
        }

        normalized_headers = [str(h or "").strip() for h in headers]
        for i, header in enumerate(normalized_headers):
            if header in candidates:
                return i

        date_headers = [h for h in normalized_headers[4:] if "/" in h and h.strip()]
        preview = ", ".join(date_headers[:10])
        if len(date_headers) > 10:
            preview += ", ..."
        raise ValueError(
            f"Cabeçalho da data '{dt.strftime('%d/%m')}' não encontrado. "
            f"Datas encontradas: {preview or 'nenhuma'}"
        )

    def _find_date_column_padrao(self, headers, date_str):
        """Localiza coluna de data no formato DD/MM/AA (layout antigo)."""
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

    # ------------------------------------------------------------------
    # Parsers por layout
    # ------------------------------------------------------------------

    def _parse_tab18(self, values, date_str):
        """
        Extrai linhas no layout '18 - Prod. S1 e S2'.
        Cabeçalho na linha 9 (idx 8). Dados a partir da linha 10 (idx 9).
        Colunas: 0=Descrição, 1=SETOR, 2=Cód.SMA, 3=Cód.Pro., 4+=datas DD/MM.
        Só existe coluna P (programado). R é sempre 0 nesta fonte.
        """
        HEADER_IDX = 8   # linha 9 (0-indexed)
        DATA_START = 9   # linha 10 (0-indexed)

        if len(values) <= HEADER_IDX:
            raise ValueError("Aba '18 - Prod. S1 e S2' não possui linhas suficientes.")

        headers = values[HEADER_IDX]
        col_idx = self._find_date_column_tab18(headers, date_str)
        logger.info(f"Coluna da data '{date_str}' encontrada no índice zero-based: {col_idx}")

        filtered_rows = []
        for row_num, row in enumerate(values[DATA_START:], start=DATA_START + 1):
            if len(row) <= col_idx:
                continue

            descricao = str(row[0]).strip()
            setor_raw = str(row[1]).strip() if len(row) > 1 else ""
            cod_sma = str(row[2]).strip() if len(row) > 2 else ""
            cod_pro = str(row[3]).strip() if len(row) > 3 else ""

            if not descricao and not cod_sma:
                continue

            setor_norm = normalize_text(setor_raw)
            setor_map = {
                "setor 1": "1", "setor 2": "2", "setor 3": "3", "setor 4": "4",
                "s1": "1", "s2": "2", "s3": "3", "s4": "4",
                "1": "1", "2": "2", "3": "3", "4": "4",
            }
            setor = setor_map.get(setor_norm)
            if setor is None:
                continue  # Ignora linhas sem setor válido

            quantidade = parse_int(row[col_idx])

            filtered_rows.append(
                {
                    "row_num": row_num,
                    "date": date_str,
                    "setor": setor,
                    "modelo": descricao,
                    "codigo": cod_pro or cod_sma,  # Cód. Pro. bate com codigo_resolved do Supabase
                    "quantidade_programada": quantidade,
                    "realizado_encarregado": 0,  # Não existe nesta aba
                }
            )

        logger.info(f"Fim da leitura (layout tab18). Extraídas {len(filtered_rows)} linhas.")
        return filtered_rows

    def _parse_padrao(self, values, date_str):
        """
        Extrai linhas no layout antigo 'PCP DIÁRIO - PADRÃO'.
        Cabeçalho na linha 1 (idx 0). Dados a partir da linha 4 (idx 3).
        """
        if len(values) < 4:
            raise ValueError("Aba PCP DIÁRIO - PADRÃO não possui linhas suficientes.")

        headers = values[0]
        col_idx = self._find_date_column_padrao(headers, date_str)
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

        logger.info(f"Fim da leitura (layout padrão). Extraídas {len(filtered_rows)} linhas com colunas P e R.")
        return filtered_rows


    def _parse_pxr(self, values, date_str):
        """
        Extrai complementos da aba '6 - PxR'.
        Layout: linha de datas, linha P/E, e secoes por setor. A coluna E
        representa o Realizado informado na planilha pelo encarregado.
        """
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        date_candidates = {
            dt.strftime("%d/%m"),
            dt.strftime("%d/%m/%Y"),
            dt.strftime("%d/%m/%y"),
        }

        date_row_idx = None
        p_col = None
        e_col = None
        for i, row in enumerate(values):
            for j, cell in enumerate(row):
                if str(cell or "").strip() in date_candidates:
                    next_row = values[i + 1] if i + 1 < len(values) else []
                    p_label = normalize_text(next_row[j] if j < len(next_row) else "")
                    e_label = normalize_text(next_row[j + 1] if j + 1 < len(next_row) else "")
                    if p_label.startswith("p") and e_label.startswith("e"):
                        date_row_idx = i
                        p_col = j
                        e_col = j + 1
                        break
            if p_col is not None:
                break

        if p_col is None:
            logger.warning(f"Aba PxR sem coluna P/E para a data {date_str}.")
            return []

        rows = []
        current_setor = None
        for previous in reversed(values[:date_row_idx]):
            previous_first = normalize_text(previous[0] if previous else "")
            if previous_first in {"setor 3", "setor 4"}:
                current_setor = "3" if previous_first == "setor 3" else "4"
                break

        for row_num, row in enumerate(values[date_row_idx + 2 :], start=date_row_idx + 3):
            first = normalize_text(row[0] if row else "")
            if first in {"setor 1 e 2", "setor 1", "setor 2"}:
                current_setor = None
                continue
            if first in {"setor 3", "setor 4"}:
                current_setor = "3" if first == "setor 3" else "4"
                continue
            if current_setor not in {"3", "4"}:
                continue

            marker = normalize_text(row[2] if len(row) > 2 else "")
            if marker in {"totais", "aderencia %", "aderencia", "volume m"}:
                continue

            modelo = str(row[0]).strip() if len(row) > 0 else ""
            codigo = normalize_code(row[2] if len(row) > 2 else "")
            if not modelo or not codigo:
                continue

            quantidade_programada = parse_int(row[p_col] if len(row) > p_col else "")
            realizado_encarregado = parse_int(row[e_col] if len(row) > e_col else "")
            if quantidade_programada == 0 and realizado_encarregado == 0:
                continue

            rows.append({
                "row_num": row_num,
                "date": date_str,
                "setor": current_setor,
                "modelo": modelo,
                "codigo": codigo,
                "quantidade_programada": quantidade_programada,
                "realizado_encarregado": realizado_encarregado,
            })

        logger.info(f"Fim da leitura (layout PxR S3/S4). Extraidas {len(rows)} linhas com colunas P e E.")
        return rows

    # ------------------------------------------------------------------
    # Método público principal
    # ------------------------------------------------------------------

    def fetch_pcp_programacao(self, date_str):
        """
        Acessa a planilha e extrai o planejamento do PCP para a data informada.
        Detecta automaticamente o layout da aba e retorna:
        setor, modelo, codigo, quantidade_programada, realizado_encarregado.
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

            if len(values) > 8 and _is_tab18_layout(values[8]):
                logger.info("Layout detectado: aba '18 - Prod. S1 e S2' (DD/MM por coluna).")
                rows = self._parse_tab18(values, date_str)
            elif len(values) > 0 and _is_padrao_layout(values[0]):
                logger.info("Layout detectado: aba 'PCP DIARIO - PADRAO' (P e R por data).")
                rows = self._parse_padrao(values, date_str)
            else:
                if "18" in worksheet.title:
                    logger.warning("Layout nao identificado claramente, tentando parser tab18...")
                    rows = self._parse_tab18(values, date_str)
                else:
                    logger.warning("Layout nao identificado claramente, tentando parser padrao...")
                    rows = self._parse_padrao(values, date_str)

            if normalize_text(worksheet.title) != normalize_text("6 - PxR"):
                try:
                    pxr = spreadsheet.worksheet("6 - PxR")
                    rows.extend(self._parse_pxr(pxr.get_all_values(), date_str))
                except Exception as pxr_error:
                    logger.warning(f"Nao foi possivel ler complemento S3/S4 da aba PxR: {pxr_error}")

            return rows

        except Exception as e:
            logger.error(f"Falha ao processar o Google Sheets: {e}")
            raise
