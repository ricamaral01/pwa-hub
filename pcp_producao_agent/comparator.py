import logging
import config

logger = logging.getLogger("pcp_producao_agent")

def normalize_sector(sector):
    if not sector:
        return "Desconhecido"
    sec = str(sector).strip().upper()
    if sec in ("S1", "SETOR 1", "SETOR1", "1"):
        return "Setor 1"
    if sec in ("S2", "SETOR 2", "SETOR2", "2"):
        return "Setor 2"
    if sec in ("S3", "SETOR 3", "SETOR3", "3"):
        return "Setor 3"
    if sec in ("S4", "SETOR 4", "SETOR4", "4"):
        return "Setor 4"
    return sector.strip()

def normalize_code(code):
    if not code:
        return "SEM CODIGO"
    return str(code).strip().upper()

class Comparator:
    def compare(self, pcp_rows, prod_rows):
        """
        Compara o planejado (PCP) com o realizado (Produção) pelo código do poste.
        Calcula as diferenças e totaliza os setores.
        """
        logger.info("Iniciando comparação pelo Código do Poste...")

        # 1. Agrupar produção por (Setor, Código do Poste)
        prod_map = {}
        for r in prod_rows:
            setor = normalize_sector(r.get("setor"))
            codigo = normalize_code(r.get("codigo_resolved"))
            
            key = (setor, codigo)
            if key not in prod_map:
                prod_map[key] = []
            prod_map[key].append(r)

        # 2. Agrupar programação por (Setor, Código)
        pcp_map = {}
        for p in pcp_rows:
            setor = normalize_sector(p.get("setor"))
            codigo = normalize_code(p.get("codigo"))
            
            key = (setor, codigo)
            qty = p.get("quantidade_programada", 0)
            modelo = p.get("modelo") or "SEM MODELO"
            
            if key not in pcp_map:
                pcp_map[key] = {"modelo": modelo, "qty_prog": 0}
            
            pcp_map[key]["qty_prog"] += qty
            # Se tiver modelo mais detalhado, prefere
            if modelo != "SEM MODELO":
                pcp_map[key]["modelo"] = modelo

        # 3. Cruzar todas as chaves únicas
        all_keys = set(pcp_map.keys()) | set(prod_map.keys())
        comparison_details = []

        for key in all_keys:
            setor, codigo = key
            
            # Dados programados
            pcp_item = pcp_map.get(key)
            qty_prog = pcp_item["qty_prog"] if pcp_item else 0
            
            # Dados produzidos
            prod_items = prod_map.get(key, [])
            qty_real = len(prod_items)
            
            # Resolve Modelo
            modelo = "SEM MODELO"
            if pcp_item and pcp_item["modelo"] != "SEM MODELO":
                modelo = pcp_item["modelo"]
            elif prod_items:
                # Fallback para o modelo salvo na produção
                modelo = prod_items[0].get("modelo_resolved") or "SEM MODELO"
                
            diff = qty_real - qty_prog

            # Definição de Status
            if qty_real == qty_prog:
                status = "REALIZADO"
            elif qty_real > qty_prog:
                if qty_prog == 0:
                    status = "NÃO PROGRAMADO"
                else:
                    status = "EXCEDENTE"
            else: # qty_real < qty_prog
                if qty_real == 0:
                    status = "NÃO PRODUZIDO"
                else:
                    status = "PARCIAL"

            comparison_details.append({
                "setor": setor,
                "codigo": codigo,
                "modelo": modelo,
                "programado": qty_prog,
                "produzido": qty_real,
                "diferenca": diff,
                "status": status
            })

        # 4. Totalização por Setor
        setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"]
        setor_stats = {}
        
        for s in setores:
            rows_s = [c for c in comparison_details if c["setor"] == s]
            
            # Ordena por código para visualização limpa
            rows_s.sort(key=lambda x: x["codigo"])
            
            s_prog = sum(r["programado"] for r in rows_s)
            s_real = sum(r["produzido"] for r in rows_s)
            s_diff = s_real - s_prog
            s_pct = (s_real / s_prog * 100) if s_prog > 0 else (100 if s_real > 0 else 0)
            
            setor_stats[s] = {
                "programado": s_prog,
                "produzido": s_real,
                "diferenca": s_diff,
                "aderencia_pct": s_pct,
                "rows": rows_s
            }

        # 5. Calcular métricas resumidas globais
        total_prog = sum(c["programado"] for c in comparison_details)
        total_real = sum(c["produzido"] for c in comparison_details)
        diferenca_total = total_real - total_prog
        aderencia_pct = (total_real / total_prog * 100) if total_prog > 0 else 0

        itens_nao_produzidos = sum(1 for c in comparison_details if c["status"] == "NÃO PRODUZIDO")
        itens_nao_programados = sum(1 for c in comparison_details if c["status"] == "NÃO PROGRAMADO")

        # 6. Geração do Resumo Executivo e Recomendações
        principais_diferencas = []
        produtos_criticos = []
        
        for c in comparison_details:
            if c["status"] in ("NÃO PRODUZIDO", "PARCIAL"):
                produtos_criticos.append(f"{c['codigo']} ({c['modelo']}) no {c['setor']} (Falta: {abs(c['diferenca'])} pç)")
            if abs(c["diferenca"]) > 0:
                dir_label = "acima" if c["diferenca"] > 0 else "abaixo"
                principais_diferencas.append(f"{c['codigo']} ({c['modelo']}) no {c['setor']} ({abs(c['diferenca'])} pç {dir_label})")

        # Setores melhor/pior
        setores_validos = {s: stats for s, stats in setor_stats.items() if stats["programado"] > 0}
        if setores_validos:
            setor_melhor = max(setores_validos.keys(), key=lambda x: setores_validos[x]["aderencia_pct"])
            setor_pior = min(setores_validos.keys(), key=lambda x: setores_validos[x]["aderencia_pct"])
        else:
            setor_melhor = "N/A"
            setor_pior = "N/A"

        recomendacoes = [
            "Priorizar os moldes dos postes críticos que ficaram pendentes hoje.",
            "Readequar a programação de formas no PCP do dia seguinte para evitar gargalos.",
            "Acompanhar os desvios e verificar se houve falta de matéria-prima ou quebra de maquinário nos setores afetados."
        ]

        logger.info("Comparação por poste concluída com sucesso.")

        return {
            "total_programado": total_prog,
            "total_produzido": total_real,
            "diferenca_total": diferenca_total,
            "aderencia_pct": aderencia_pct,
            "itens_nao_produzidos": itens_nao_produzidos,
            "itens_nao_programados": itens_nao_programados,
            "details": comparison_details,
            "setores": setor_stats,
            "analise": {
                "principais_diferencas": principais_diferencas[:5],
                "produtos_criticos": produtos_criticos[:5],
                "setor_melhor": setor_melhor,
                "setor_pior": setor_pior,
                "recomendacoes": recomendacoes
            }
        }
