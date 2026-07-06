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

    def _normalize_date(self, date_val):
        """
        Normaliza datas do tipo DD/MM/YYYY ou YYYY-MM-DD para YYYY-MM-DD.
        """
        if not date_val:
            return ""
        date_str = str(date_val).strip()
        
        # Formato YYYY-MM-DD
        if re.match(r"^\d{4}-\d{2}-\d{2}", date_str):
            return date_str[:10]
        
        # Formato DD/MM/YYYY
        match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})", date_str)
        if match:
            dd, mm, yyyy = match.groups()
            return f"{yyyy}-{mm.zfill(2)}-{dd.zfill(2)}"
        
        return date_str

    def fetch_pcp_programacao(self, date_str):
        """
        Acessa o Google Sheets e filtra a programação para a data informada.
        """
        logger.info("Conectando ao Google Sheets...")
        try:
            creds = Credentials.from_service_account_file(self.creds_path, scopes=self.scopes)
            client = gspread.authorize(creds)
            
            logger.info(f"Abrindo planilha ID: {self.spreadsheet_id}...")
            spreadsheet = client.open_by_key(self.spreadsheet_id)
            
            logger.info("Acessando aba 'PCP - DIÁRIO'...")
            worksheet = spreadsheet.worksheet("PCP - DIÁRIO")
            
            # Obtém todos os dados
            rows = worksheet.get_all_records()
            logger.info(f"Lidas {len(rows)} linhas na aba PCP - DIÁRIO.")

            # Filtra e normaliza
            target_date = self._normalize_date(date_str)
            filtered_rows = []
            
            for index, r in enumerate(rows):
                # Identifica colunas de data (tentativas comuns: 'Data', 'Data de Fabricação', 'Data Fabricação')
                date_key = next((k for k in r.keys() if 'data' in k.lower()), None)
                if not date_key:
                    continue
                
                row_date = self._normalize_date(r[date_key])
                if row_date == target_date:
                    # Tenta capturar colunas comuns
                    sector_key = next((k for k in r.keys() if 'setor' in k.lower()), 'Setor')
                    product_key = next((k for k in r.keys() if 'produto' in k.lower() or 'codigo' in k.lower()), 'Produto')
                    model_key = next((k for k in r.keys() if 'modelo' in k.lower() or 'forma' in k.lower()), 'Modelo')
                    qty_key = next((k for k in r.keys() if 'quant' in k.lower() or 'prog' in k.lower() or 'volume' in k.lower()), 'Quantidade')
                    
                    qty_val = 0
                    try:
                        qty_val = int(r.get(qty_key) or 0)
                    except ValueError:
                        try:
                            qty_val = int(float(r.get(qty_key) or 0))
                        except Exception:
                            pass

                    filtered_rows.append({
                        "row_num": index + 2, # 1-indexed header + data
                        "date": row_date,
                        "setor": str(r.get(sector_key) or "").strip(),
                        "produto": str(r.get(product_key) or "").strip(),
                        "modelo": str(r.get(model_key) or "").strip(),
                        "quantidade_programada": qty_val
                    })

            logger.info(f"Filtradas {len(filtered_rows)} linhas programadas para a data {date_str}.")
            return filtered_rows
            
        except Exception as e:
            logger.error(f"Falha ao acessar o Google Sheets: {e}")
            raise e
