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
        Calcula as diferenças, gera resumos explicativos por setor, incluindo R da planilha.
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

        # 2. Agrupar programação e realizado da planilha por (Setor, Código)
        pcp_map = {}
        for p in pcp_rows:
            setor = normalize_sector(p.get("setor"))
            codigo = normalize_code(p.get("codigo"))
            
            key = (setor, codigo)
            qty_prog = p.get("quantidade_programada", 0)
            qty_real_enc = p.get("realizado_encarregado", 0)
            modelo = p.get("modelo") or "SEM MODELO"
            
            if key not in pcp_map:
                pcp_map[key] = {"modelo": modelo, "qty_prog": 0, "qty_real_enc": 0}
            
            pcp_map[key]["qty_prog"] += qty_prog
            pcp_map[key]["qty_real_enc"] += qty_real_enc
            if modelo != "SEM MODELO":
                pcp_map[key]["modelo"] = modelo

        # 3. Cruzar todas as chaves únicas
        all_keys = set(pcp_map.keys()) | set(prod_map.keys())
        comparison_details = []

        for key in all_keys:
            setor, codigo = key
            
            pcp_item = pcp_map.get(key)
            qty_prog = pcp_item["qty_prog"] if pcp_item else 0
            qty_real_enc = pcp_item["qty_real_enc"] if pcp_item else 0
            
            prod_items = prod_map.get(key, [])
            qty_real = len(prod_items)
            
            modelo = "SEM MODELO"
            if pcp_item and pcp_item["modelo"] != "SEM MODELO":
                modelo = pcp_item["modelo"]
            elif prod_items:
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
            else:
                if qty_real == 0:
                    status = "NÃO PRODUZIDO"
                else:
                    status = "PARCIAL"

            comparison_details.append({
                "setor": setor,
                "codigo": codigo,
                "modelo": modelo,
                "programado": qty_prog,
                "realizado_encarregado": qty_real_enc,
                "produzido": qty_real,
                "diferenca": diff,
                "status": status
            })

        # 4. Totalização e Narrativa de Desvios por Setor
        setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"]
        setor_stats = {}
        
        for s in setores:
            rows_s = [c for c in comparison_details if c["setor"] == s]
            rows_s.sort(key=lambda x: x["codigo"])
            
            s_prog = sum(r["programado"] for r in rows_s)
            s_real_enc = sum(r["realizado_encarregado"] for r in rows_s)
            s_real = sum(r["produzido"] for r in rows_s)
            s_diff = s_real - s_prog
            s_pct = (s_real / s_prog * 100) if s_prog > 0 else (100 if s_real > 0 else 0)
            
            # Gera narrativas de desvio
            desvios_detalhes = []
            for r in rows_s:
                if r["diferenca"] == 0 and r["realizado_encarregado"] == r["produzido"]:
                    continue
                
                mod_str = r["modelo"]
                cod_str = r["codigo"]
                prog_val = r["programado"]
                real_enc_val = r["realizado_encarregado"]
                real_val = r["produzido"]
                diff_val = r["diferenca"]
                
                desvio_text = f"<strong>{mod_str} (Cód. {cod_str})</strong>: "
                
                if prog_val > 0 and real_val == 0:
                    desvio_text += f"Programado {prog_val} (P), mas nenhuma peça foi concretada."
                elif prog_val > 0 and real_val < prog_val:
                    desvio_text += f"Programado {prog_val} (P), concretado pelo operador {real_val} (falta {abs(diff_val)} pç)."
                elif prog_val > 0 and real_val > prog_val:
                    desvio_text += f"Programado {prog_val} (P), concretado pelo operador {real_val} (excesso de {diff_val} pç)."
                elif prog_val == 0 and real_val > 0:
                    desvio_text += f"Não programado, mas operador concretou {real_val} peças."
                else:
                    desvio_text += f"Concretado {real_val} peças."

                if real_enc_val != real_val:
                    desvio_text += f" <i>(Nota: Encarregado apontou {real_enc_val} como Realizado (R) na planilha).</i>"
                
                desvios_detalhes.append(desvio_text)

            resumo_geral = (
                f"O encarregado planejou {s_prog} peças (P) e apontou {s_real_enc} peças como Realizado (R) na planilha. "
                f"O operador apontou {s_real} peças no sistema Supabase."
            )
            
            setor_stats[s] = {
                "programado": s_prog,
                "realizado_encarregado": s_real_enc,
                "produzido": s_real,
                "diferenca": s_diff,
                "aderencia_pct": s_pct,
                "resumo_geral": resumo_geral,
                "desvios_detalhes": desvios_detalhes,
                "rows": rows_s
            }

        # 5. Calcular métricas resumidas globais e listas detalhadas
        total_prog = sum(c["programado"] for c in comparison_details)
        total_real_enc = sum(c["realizado_encarregado"] for c in comparison_details)
        total_real = sum(c["produzido"] for c in comparison_details)
        diferenca_total = total_real - total_prog
        aderencia_pct = (total_real / total_prog * 100) if total_prog > 0 else 0

        itens_nao_produzidos_detalhes = []
        itens_nao_programados_detalhes = []
        
        for c in comparison_details:
            if c["status"] == "NÃO PRODUZIDO":
                itens_nao_produzidos_detalhes.append({
                    "codigo": c["codigo"],
                    "modelo": c["modelo"],
                    "setor": c["setor"],
                    "quantidade": c["programado"]
                })
            elif c["status"] == "NÃO PROGRAMADO":
                itens_nao_programados_detalhes.append({
                    "codigo": c["codigo"],
                    "modelo": c["modelo"],
                    "setor": c["setor"],
                    "quantidade": c["produzido"]
                })

        itens_nao_produzidos = len(itens_nao_produzidos_detalhes)
        itens_nao_programados = len(itens_nao_programados_detalhes)

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
            "total_realizado_encarregado": total_real_enc,
            "total_produzido": total_real,
            "diferenca_total": diferenca_total,
            "aderencia_pct": aderencia_pct,
            "itens_nao_produzidos": itens_nao_produzidos,
            "itens_nao_programados": itens_nao_programados,
            "itens_nao_produzidos_detalhes": sorted(itens_nao_produzidos_detalhes, key=lambda x: (x["setor"], x["codigo"])),
            "itens_nao_programados_detalhes": sorted(itens_nao_programados_detalhes, key=lambda x: (x["setor"], x["codigo"])),
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
