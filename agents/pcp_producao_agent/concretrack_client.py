import logging
import requests
import config

logger = logging.getLogger("pcp_producao_agent")

class ConcretrackClient:
    def __init__(self):
        self.url = config.SUPABASE_URL
        self.key = config.SUPABASE_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json"
        }

    def fetch_production(self, date_str):
        """
        Busca os dados de produção do Supabase para uma data específica.
        Retorna uma lista de apontamentos deduplicados por (setor, forma).
        """
        if not self.url or not self.key:
            raise ValueError("Credenciais do Supabase não configuradas no ambiente.")

        endpoint = f"{self.url}/rest/v1/producao"
        params = {
            "data_fabricacao": f"eq.{date_str}",
            "select": "*"
        }

        logger.info(f"Buscando produção no Supabase para a data: {date_str}...")
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=15)
            if not response.ok:
                raise ValueError(f"HTTP {response.status_code}: {response.text}")
            
            rows = response.json()
            logger.info(f"Encontrados {len(rows)} registros brutos de produção no Supabase.")
            
            # Deduplicação por (setor, forma) no dia
            unique_records = {}
            for r in rows:
                setor = r.get("setor")
                forma = r.get("forma") or r.get("forma_numero")
                if not setor or not forma:
                    continue
                
                setor_norm = setor.strip()
                forma_norm = str(forma).strip().upper()
                key = (setor_norm, forma_norm)
                
                # Regras de preferência para a deduplicação
                # Preferência: CONCRETADO > LIBERADO > Outros
                status = str(r.get("status") or "").upper()
                
                if key not in unique_records:
                    unique_records[key] = r
                else:
                    curr_status = str(unique_records[key].get("status") or "").upper()
                    if status == "CONCRETADO" or (status == "LIBERADO" and curr_status != "CONCRETADO"):
                        unique_records[key] = r

            result = list(unique_records.values())
            logger.info(f"Produção deduplicada contém {len(result)} fôrmas apontadas.")
            return result
        except Exception as e:
            logger.error(f"Erro ao buscar produção no ConcreTrack: {e}")
            raise e
