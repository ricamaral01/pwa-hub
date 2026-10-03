import logging
import requests
from datetime import datetime, timezone, timedelta
import config

logger = logging.getLogger("pcp_producao_agent")

POSTES_DUPLO_T_CATALOGO = [
    { "codigo": "C", "descricao": "Padrao Completo 2 cx VR", "setor": "Setor 2", "codigoProduto": "943", "chaves": ["C"] },
    { "codigo": "D", "descricao": "Padrao Completo 2 cx VL", "setor": "Setor 1", "codigoProduto": "941", "chaves": ["D"] },
    { "codigo": "B", "descricao": "Padrao Completo 1 cx VL", "setor": "Setor 2", "codigoProduto": "935", "chaves": ["B"] },
    { "codigo": "A", "descricao": "Padrao Completo 1 cx VR", "setor": "Setor 2", "codigoProduto": "938", "chaves": ["A"] },
    { "codigo": "BD", "descricao": "Padrao Completo 1 cx VL (EDP)", "setor": "Setor 1", "codigoProduto": "957", "chaves": ["BD"] },
    { "codigo": "CE", "descricao": "Padrao Completo 2 cx VR Elektro", "setor": "Setor 1", "codigoProduto": "4032", "chaves": ["CE"] },
    { "codigo": "DE", "descricao": "Padrao Completo 2 cx VL Elektro", "setor": "Setor 1", "codigoProduto": "4765", "chaves": ["DE"] },
    { "codigo": "AE", "descricao": "Padrao Completo 1 cx VR Elektro", "setor": "Setor 1", "codigoProduto": "4031", "chaves": ["AE"] },
    { "codigo": "BE", "descricao": "Padrao Completo 1 cx VL Elektro", "setor": "Setor 1", "codigoProduto": "4764", "chaves": ["BE"] },
    { "codigo": "IE", "descricao": "Padrao Completo 3cxs VL Elektro", "setor": "Setor 1", "codigoProduto": "4929", "chaves": ["IE"] },
    { "codigo": "L", "descricao": "Padrao Completo 4 cx VR", "setor": "Setor 1", "codigoProduto": "948", "chaves": ["L"] },
    { "codigo": "J", "descricao": "Padrao Completo 4 cx VL", "setor": "Setor 1", "codigoProduto": "947", "chaves": ["J"] },
    { "codigo": "H", "descricao": "Padrao Completo 3 cx VR", "setor": "Setor 1", "codigoProduto": "946", "chaves": ["H"] },
    { "codigo": "I", "descricao": "Padrao Completo 3 cx VL", "setor": "Setor 1", "codigoProduto": "945", "chaves": ["I"] },
    { "codigo": "300-VR", "descricao": "Poste 2 cx VR (7,5 x 300)", "setor": "Setor 1", "codigoProduto": "944", "chaves": ["300-VR"] },
    { "codigo": "300-VL", "descricao": "Poste 2 cx VL (7,5 x 300)", "setor": "Setor 1", "codigoProduto": "942", "chaves": ["300-VL"] },
    { "codigo": "CM", "descricao": "Padrao Cemig 1 cx VL - 7,0 x150", "setor": "Setor 1", "codigoProduto": "953", "chaves": ["CM", "BC"] },
    { "codigo": "N", "descricao": "Poste 7,5 X 600 VL", "setor": "Setor 1", "codigoProduto": "936", "chaves": ["N"] },
    { "codigo": "M", "descricao": "Poste 7,5 X 600 VR", "setor": "Setor 1", "codigoProduto": "939", "chaves": ["M"] },
    { "codigo": "TCL", "descricao": "Poste 7,5 X 600 VL c/", "setor": "Setor 2", "codigoProduto": "937", "chaves": ["TCL"] },
    { "codigo": "TCR", "descricao": "Poste 7,5 X 600 VR c/", "setor": "Setor 2", "codigoProduto": "940", "chaves": ["TCR"] },
    { "codigo": "100", "descricao": "Poste Subterraneo 100 A", "setor": "Setor 1", "codigoProduto": "949", "chaves": ["100"] },
    { "codigo": "SB-E1", "descricao": "Poste Subterraneo 100 A - Elektro", "setor": "Setor 1", "codigoProduto": "4848", "chaves": ["SB-E1"] },
    { "codigo": "200", "descricao": "Poste Subterraneo 200 A - TC", "setor": "Setor 1", "codigoProduto": "5017", "chaves": ["200"] },
    { "codigo": "TOTEM", "descricao": "Totem de medicao indireta Elektro", "setor": "Setor 2", "codigoProduto": "13570", "chaves": ["TOTEM", "A-TOTEM", "TMIE"] },
    { "codigo": "PL", "descricao": "Poste Visor Aereo 1 cx VL (7,5x300)", "setor": "Setor 2", "codigoProduto": "934", "chaves": ["PL"] },
    { "codigo": "CEMIG-5X150", "descricao": "Padrao Cemig 1CX - 5,0 x 150", "setor": "Setor 4", "codigoProduto": "952", "chaves": ["C-F1"] },
    { "codigo": "CEMIG-1VL", "descricao": "Padrao Cemig 1 cx VL - 7,0 x150", "setor": "Setor 4", "codigoProduto": "953", "chaves": ["R-G"] },
    { "codigo": "CEMIG-2VL", "descricao": "Padrao Cemig 2 cx VL - 7,0 x150", "setor": "Setor 4", "codigoProduto": "954", "chaves": [] },
    { "codigo": "E", "descricao": "Poste Economico 1CX VR", "setor": "Setor 1", "codigoProduto": "931", "chaves": ["E"] },
    { "codigo": "F", "descricao": "Poste Economico 1CX VL", "setor": "Setor 1", "codigoProduto": "930", "chaves": ["F"] },
    { "codigo": "G", "descricao": "Poste Economico 2CX VR", "setor": "Setor 1", "codigoProduto": "932", "chaves": ["G"] },
    { "codigo": "P", "descricao": "Poste Economico 3 CXS VR", "setor": "Setor 1", "codigoProduto": "933", "chaves": ["P"] },
    { "codigo": "DTB", "descricao": "Poste Duplo T Barreiras", "setor": "Setor 4", "codigoProduto": "13580", "chaves": ["DTB"] },
    { "codigo": "DTBM", "descricao": "Poste Duplo T Barreiras Médio", "setor": "Setor 4", "codigoProduto": "13581", "chaves": ["DTBM"] },
    { "codigo": "DTD", "descricao": "Poste Duplo T Especial D", "setor": "Setor 4", "codigoProduto": "13582", "chaves": ["DTD"] }
]

POSTES_DUPLO_T_BY_CHAVE = {}
for item in POSTES_DUPLO_T_CATALOGO:
    for key in item["chaves"]:
        POSTES_DUPLO_T_BY_CHAVE[key.upper()] = item

def get_forma_catalog_key(forma):
    if not forma:
        return ""
    normalized = str(forma).strip().upper().replace(" ", "")
    if normalized.startswith("300-VR"): return "300-VR"
    if normalized.startswith("300-VL"): return "300-VL"
    if normalized.startswith("SB-E1"): return "SB-E1"
    if normalized.startswith("SBE-"): return "SB-E1"
    if normalized.startswith("100-"): return "100"
    if normalized.startswith("200-"): return "200"
    if normalized.startswith("A-TOTEM"): return "A-TOTEM"
    if normalized.startswith("TMIE"): return "TMIE"
    if normalized.startswith("BC"): return "BC"
    if normalized.startswith("C-F1"): return "C-F1"
    if normalized.startswith("R-G"): return "R-G"
    if normalized.startswith("DTBM"): return "DTBM"
    if normalized.startswith("DTB"): return "DTB"
    if normalized.startswith("DTD"): return "DTD"
    return normalized.split("-")[0]

def resolve_poste_data(r):
    """
    Resolve o codigo usado na comparacao com o PCP.
    O PCP usa codigo de produto numerico; o Supabase pode trazer a chave curta
    da forma em codigo_poste (A, B, AE, TCL...), entao codigo_produto tem prioridade.
    """
    codigo_poste = r.get("codigo_poste")
    codigo_produto = r.get("codigo_produto")
    forma = r.get("forma") or r.get("forma_numero")

    if codigo_produto and str(codigo_produto).strip():
        cod_str = str(codigo_produto).strip()
        for item in POSTES_DUPLO_T_CATALOGO:
            if item["codigoProduto"] == cod_str:
                return item["codigoProduto"], item["descricao"]
        return cod_str, r.get("modelo") or "SEM MODELO"

    if codigo_poste and str(codigo_poste).strip():
        cod_str = str(codigo_poste).strip().upper()
        for item in POSTES_DUPLO_T_CATALOGO:
            if item["codigoProduto"] == cod_str:
                return item["codigoProduto"], item["descricao"]

        catalog = POSTES_DUPLO_T_BY_CHAVE.get(cod_str)
        if catalog:
            return catalog["codigoProduto"], catalog["descricao"]

        return cod_str, r.get("modelo") or "SEM MODELO"

    catalog_key = get_forma_catalog_key(forma)
    catalog = POSTES_DUPLO_T_BY_CHAVE.get(catalog_key)
    if catalog:
        return catalog["codigoProduto"], catalog["descricao"]

    return "SEM CODIGO", r.get("modelo") or "SEM MODELO"

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
                
                status = str(r.get("status") or "").upper()
                
                if key not in unique_records:
                    unique_records[key] = r
                else:
                    curr_status = str(unique_records[key].get("status") or "").upper()
                    if status == "CONCRETADO" or (status == "LIBERADO" and curr_status != "CONCRETADO"):
                        unique_records[key] = r

            # Aplica a resolução do código de montagem e modelo para cada fôrma deduplicada
            result = []
            for key, r in unique_records.items():
                codigo_res, modelo_res = resolve_poste_data(r)
                r["codigo_resolved"] = codigo_res
                r["modelo_resolved"] = modelo_res
                result.append(r)

            logger.info(f"Produção deduplicada e mapeada contém {len(result)} fôrmas apontadas.")
            return result
        except Exception as e:
            logger.error(f"Erro ao buscar produção no ConcreTrack: {e}")
            raise e

    def fetch_production_month(self, date_str):
        """
        Busca os apontamentos do mês corrente até a data analisada.
        Usa a mesma regra de deduplicação da consulta diária.
        """
        if not self.url or not self.key:
            raise ValueError("Credenciais do Supabase nÃ£o configuradas no ambiente.")

        end_date = datetime.strptime(date_str, "%Y-%m-%d")
        start_str = end_date.replace(day=1).strftime("%Y-%m-%d")
        endpoint = f"{self.url}/rest/v1/producao"
        params = {
            "and": f"(data_fabricacao.gte.{start_str},data_fabricacao.lte.{date_str})",
            "select": "*",
            "order": "data_fabricacao.asc",
        }

        logger.info(f"Buscando produÃ§Ã£o mensal no Supabase de {start_str} a {date_str}...")
        try:
            rows = []
            offset = 0
            page_size = 1000
            while True:
                response = requests.get(
                    endpoint,
                    headers={**self.headers, "Range": f"{offset}-{offset + page_size - 1}"},
                    params=params,
                    timeout=20,
                )
                if not response.ok:
                    raise ValueError(f"HTTP {response.status_code}: {response.text}")

                page = response.json()
                rows.extend(page)
                if len(page) < page_size:
                    break
                offset += page_size

            unique_records = {}
            for r in rows:
                setor = r.get("setor")
                forma = r.get("forma") or r.get("forma_numero")
                data_fabricacao = str(r.get("data_fabricacao") or "")[:10]
                if not setor or not forma or not data_fabricacao:
                    continue

                key = (data_fabricacao, str(setor).strip(), str(forma).strip().upper())
                status = str(r.get("status") or "").upper()
                if key not in unique_records:
                    unique_records[key] = r
                else:
                    curr_status = str(unique_records[key].get("status") or "").upper()
                    if status == "CONCRETADO" or (status == "LIBERADO" and curr_status != "CONCRETADO"):
                        unique_records[key] = r

            result = []
            for r in unique_records.values():
                codigo_res, modelo_res = resolve_poste_data(r)
                r["codigo_resolved"] = codigo_res
                r["modelo_resolved"] = modelo_res
                result.append(r)

            logger.info(f"ProduÃ§Ã£o mensal deduplicada contÃ©m {len(result)} fÃ´rmas apontadas.")
            return result
        except Exception as e:
            logger.warning(f"Erro ao buscar produÃ§Ã£o mensal; usando apenas o dia analisado: {e}")
            return self.fetch_production(date_str)

    def fetch_massada_problems(self, date_str):
        """
        Busca formas/massadas produzidas sem liberação correspondente na view vw_formas_status.
        Problema considerado: existe produção apontada (prod_id), mas não existe liberação registrada (lib_id).
        """
        endpoint = f"{self.url}/rest/v1/vw_formas_status"
        params = {
            "data_fabricacao": f"eq.{date_str}",
            "select": "*",
            "order": "prod_data_hora.asc",
        }

        logger.info(f"Buscando formas/massadas com problemas para a data: {date_str}...")
        try:
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=15)
            if not response.ok:
                logger.warning(f"Não foi possível consultar vw_formas_status: HTTP {response.status_code}: {response.text}")
                return []

            problems = []
            for r in response.json():
                if not r.get("prod_id") or r.get("lib_id"):
                    continue

                prod_dt = r.get("prod_data_hora")
                hora = ""
                if prod_dt:
                    try:
                        dt = datetime.fromisoformat(prod_dt.replace("Z", "+00:00"))
                        hora = dt.astimezone(timezone(timedelta(hours=-3))).strftime("%H:%M")
                    except Exception:
                        hora = str(prod_dt)

                problems.append(
                    {
                        "hora": hora,
                        "setor": r.get("setor") or "",
                        "forma": r.get("forma") or "",
                        "modelo": r.get("prod_modelo") or "",
                        "tipo_concreto": r.get("prod_tipo_concreto") or "",
                        "apontador": r.get("prod_colaborador") or "",
                        "problema": "Produzida sem liberação registrada",
                    }
                )

            logger.info(f"Encontradas {len(problems)} formas/massadas com problema.")
            return problems
        except Exception as e:
            logger.warning(f"Erro ao buscar formas/massadas com problemas: {e}")
            return []
