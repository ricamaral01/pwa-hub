import logging
import re
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
import config

logger = logging.getLogger("pcp_producao_agent")

class GoogleSheetsClient:
    def __init__(self):
        self.creds_path = config.GOOGLE_CREDS_PATH
        self.spreadsheet_id = config.SPREADSHEET_ID
        self.scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive"
        ]

    def fetch_pcp_programacao(self, date_str):
        """
        Acessa a planilha e extrai o planejamento da aba 'PCP DIÁRIO - PADRÃO' para a data.
        Retorna tanto a quantidade programada (P) quanto a realizada apontada (R).
        """
        logger.info("Conectando ao Google Sheets...")
        try:
            creds = Credentials.from_service_account_file(self.creds_path, scopes=self.scopes)
            client = gspread.authorize(creds)
            
            logger.info(f"Abrindo planilha ID: {self.spreadsheet_id}...")
            spreadsheet = client.open_by_key(self.spreadsheet_id)
            
            # Localiza a aba correta com fallbacks
            ws_title = "PCP DIÁRIO - PADRÃO"
            try:
                worksheet = spreadsheet.worksheet(ws_title)
            except gspread.WorksheetNotFound:
                # Procura aba que contenha pcp e diário/diario
                match_ws = next((w for w in spreadsheet.worksheets() if 'pcp' in w.title.lower() and ('diár' in w.title.lower() or 'diar' in w.title.lower())), None)
                if match_ws:
                    worksheet = match_ws
                    ws_title = match_ws.title
                else:
                    # Fallback para a primeira aba
                    worksheet = spreadsheet.worksheets()[0]
                    ws_title = worksheet.title
            
            logger.info(f"Acessando aba '{ws_title}'...")
            values = worksheet.get_all_values()
            
            # Converte YYYY-MM-DD para o formato da aba (ex: 06/07/26)
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                target_header = dt.strftime("%d/%m/%y")
            except Exception:
                target_header = date_str
            
            logger.info(f"Procurando coluna da data: '{target_header}'...")
            
            headers = values[0]
            col_idx = None
            try:
                col_idx = headers.index(target_header)
            except ValueError:
                # Tenta formato flexível (sem zeros à esquerda: d/m/yy)
                try:
                    parts = target_header.split('/')
                    flex = f"{int(parts[0])}/{int(parts[1])}/{parts[2]}"
                    col_idx = next((i for i, h in enumerate(headers) if h == flex or target_header in h or flex in h), None)
                except Exception:
                    pass
            
            if col_idx is None:
                raise ValueError(f"Cabeçalho da data '{target_header}' não foi encontrado nos cabeçalhos.")
            
            logger.info(f"Coluna de data encontrada no índice: {col_idx}")

            # Identifica os índices das colunas de dados
            headers_lower = [str(h).lower() for h in headers]
            col_cod = next((i for i, h in enumerate(headers_lower) if 'montagem' in h), 1)
            col_desc = next((i for i, h in enumerate(headers_lower) if 'descri' in h), 2)
            col_setor = next((i for i, h in enumerate(headers_lower) if 'setor' in h), 5)

            filtered_rows = []
            
            # Os dados reais começam a partir da quarta linha (índice 3)
            for index, row in enumerate(values[3:]):
                if len(row) <= max(col_cod, col_desc, col_setor, col_idx + 1):
                    continue
                    
                codigo = str(row[col_cod]).strip()
                modelo = str(row[col_desc]).strip()
                setor = str(row[col_setor]).strip()
                
                if not codigo and not modelo:
                    continue
                
                # Lê a quantidade programada (P)
                qty_val = 0
                try:
                    qty_val = int(row[col_idx])
                except ValueError:
                    try:
                        qty_val = int(float(row[col_idx]))
                    except Exception:
                        pass

                # Lê a quantidade realizada pelo encarregado (R)
                real_enc_val = 0
                try:
                    real_enc_val = int(row[col_idx + 1])
                except ValueError:
                    try:
                        real_enc_val = int(float(row[col_idx + 1]))
                    except Exception:
                        pass
                
                filtered_rows.append({
                    "row_num": index + 4,
                    "date": date_str,
                    "setor": setor,
                    "modelo": modelo,
                    "codigo": codigo,
                    "quantidade_programada": qty_val,
                    "realizado_encarregado": real_enc_val
                })
                
            logger.info(f"Fim da leitura. Extraídas {len(filtered_rows)} linhas da planilha com colunas P e R.")
            return filtered_rows
            
        except Exception as e:
            logger.error(f"Falha ao processar o Google Sheets: {e}")
            raise e
