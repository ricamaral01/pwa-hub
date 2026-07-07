import logging
import requests
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
    Usa a mesma regra do PWA (forma -> codigoProduto) para resolver o Código de Montagem correto
    e a Descrição oficial dos postes no Setor 1 e Setor 2.
    """
    codigo_poste = r.get("codigo_poste") or r.get("codigo_produto")
    forma = r.get("forma") or r.get("forma_numero")
    
    # Se já tem código de produto vindo do Supabase (geralmente Setores 3 e 4)
    if codigo_poste and str(codigo_poste).strip():
        cod_str = str(codigo_poste).strip()
        for item in POSTES_DUPLO_T_CATALOGO:
            if item["codigoProduto"] == cod_str:
                return item["codigoProduto"], item["descricao"]
        return cod_str, r.get("modelo") or "SEM MODELO"
        
    # Senão tenta resolver a partir do nome da fôrma
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
