import logging
import pandas as pd
import config

logger = logging.getLogger("pcp_producao_agent")

def normalize_sector(sector):
    if not sector:
        return "Desconhecido"
    sec = str(sector).strip().upper()
    if sec in ("S1", "SETOR 1", "SETOR1"):
        return "Setor 1"
    if sec in ("S2", "SETOR 2", "SETOR2"):
        return "Setor 2"
    if sec in ("S3", "SETOR 3", "SETOR3"):
        return "Setor 3"
    if sec in ("S4", "SETOR 4", "SETOR4"):
        return "Setor 4"
    return sector.strip()

def normalize_model(model):
    if not model:
        return "SEM MODELO"
    return str(model).strip().upper()

class Comparator:
    def compare(self, pcp_rows, prod_rows):
        """
        Compara o planejado (PCP) com o realizado (Produção).
        Aplica regras de status e gera métricas globais e por setor.
        """
        logger.info("Iniciando comparação entre PCP e Produção...")

        # 1. Agrupar produção por (Setor, Modelo)
        prod_map = {}
        for r in prod_rows:
            setor = normalize_sector(r.get("setor"))
            
            # Tenta pegar modelo, depois produto, depois código do produto
            modelo = r.get("modelo") or r.get("codigo_produto") or "SEM MODELO"
            modelo_norm = normalize_model(modelo)
            
            key = (setor, modelo_norm)
            if key not in prod_map:
                prod_map[key] = []
            prod_map[key].append(r)

        comparison_details = []
        matched_keys = set()

        # 2. Processar itens programados (PCP)
        for p in pcp_rows:
            setor = normalize_sector(p["setor"])
            modelo = p["modelo"] or p["produto"] or "SEM MODELO"
            modelo_norm = normalize_model(modelo)
            
            key = (setor, modelo_norm)
            matched_keys.add(key)
            
            qty_prog = p["quantidade_programada"]
            realized_items = prod_map.get(key, [])
            qty_real = len(realized_items)

            # Regras de Status
            if qty_real == qty_prog:
                status = "REALIZADO"
            elif qty_real > qty_prog:
                status = "EXCEDENTE"
            elif qty_real > 0 and qty_real < qty_prog:
                status = "PARCIAL"
            else:
                status = "NÃO PRODUZIDO"

            diff = qty_real - qty_prog

            comparison_details.append({
                "setor": setor,
                "produto": p["produto"] or "Poste",
                "modelo": p["modelo"] or "SEM MODELO",
                "programado": qty_prog,
                "produzido": qty_real,
                "diferenca": diff,
                "status": status,
                "detalhes_producao": realized_items
            })

        # 3. Processar itens realizados não programados (NÃO PROGRAMADO)
        for key, realized_items in prod_map.items():
            if key not in matched_keys:
                setor, modelo_norm = key
                qty_real = len(realized_items)
                
                # Para itens não programados
                status = "NÃO PROGRAMADO"
                diff = qty_real

                # Tenta pegar o nome amigável do produto do primeiro item
                first_item = realized_items[0]
                produto_name = first_item.get("codigo_produto") or "Poste"

                comparison_details.append({
                    "setor": setor,
                    "produto": produto_name,
                    "modelo": modelo_norm,
                    "programado": 0,
                    "produzido": qty_real,
                    "diferenca": diff,
                    "status": status,
                    "detalhes_producao": realized_items
                })

        # 4. Calcular métricas resumidas
        total_prog = sum(c["programado"] for c in comparison_details)
        total_real = sum(c["produzido"] for c in comparison_details)
        diferenca_total = total_real - total_prog
        aderencia_pct = (total_real / total_prog * 100) if total_prog > 0 else 0

        itens_nao_produzidos = sum(1 for c in comparison_details if c["status"] == "NÃO PRODUZIDO")
        itens_nao_programados = sum(1 for c in comparison_details if c["status"] == "NÃO PROGRAMADO")

        # 5. Análise de aderência por setor
        setores = ["Setor 1", "Setor 2", "Setor 3", "Setor 4"]
        setor_stats = {}
        
        for s in setores:
            rows_s = [c for c in comparison_details if c["setor"] == s]
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

        # 6. Geração do Resumo Executivo e Recomendações
        principais_diferencas = []
        produtos_criticos = []
        
        for c in comparison_details:
            if c["status"] in ("NÃO PRODUZIDO", "PARCIAL"):
                produtos_criticos.append(f"{c['modelo']} no {c['setor']} (Falta: {abs(c['diferenca'])} pç)")
            if abs(c["diferenca"]) > 0:
                dir_label = "acima" if c["diferenca"] > 0 else "abaixo"
                principais_diferencas.append(f"{c['modelo']} no {c['setor']} ({abs(c['diferenca'])} pç {dir_label})")

        # Setores melhor/pior
        setores_validos = {s: stats for s, stats in setor_stats.items() if stats["programado"] > 0}
        
        if setores_validos:
            setor_melhor = max(setores_validos.keys(), key=lambda x: setores_validos[x]["aderencia_pct"])
            setor_pior = min(setores_validos.keys(), key=lambda x: setores_validos[x]["aderencia_pct"])
        else:
            setor_melhor = "N/A"
            setor_pior = "N/A"

        recomendacoes = [
            "Priorizar os moldes dos produtos críticos que ficaram pendentes hoje.",
            "Readequar a programação de formas no PCP do dia seguinte para evitar gargalos.",
            "Acompanhar os desvios e verificar se houve falta de matéria-prima ou quebra de maquinário nos setores afetados."
        ]

        logger.info("Comparação concluída com sucesso.")

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
