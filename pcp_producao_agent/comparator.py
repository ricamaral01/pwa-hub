import logging
from collections import defaultdict
from datetime import datetime
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
    text = str(code).strip().upper()
    compact = text.replace(".", "").replace(",", "")
    if compact.isdigit():
        return compact
    return text

def _row_date(row):
    return str(row.get("data_fabricacao") or row.get("data") or "")[:10]

def _volume(row):
    for key in ("volume_m3", "volume", "volume_estimado", "volume_estimado_m3"):
        try:
            return float(row.get(key) or 0)
        except (TypeError, ValueError):
            continue
    return 0.0

def _tipo_concreto(row):
    return str(row.get("tipo_concreto") or row.get("prod_tipo_concreto") or row.get("classificacao") or "Concreto Padrão").strip()

def _is_fora_padrao(row):
    if normalize_sector(row.get("setor")) == "Setor 3" and "vibrado" in _tipo_concreto(row).lower():
        return False
    return _is_fora_padrao_incluindo_setor3(row)

def _is_fora_padrao_incluindo_setor3(row):
    text = _tipo_concreto(row).lower()
    cls = str(row.get("classificacao") or "").lower()
    if cls and "pad" not in cls:
        return True
    return any(term in text for term in ("vibrado", "exsudado", "segregado", "defeito", "fora"))

def _sector_label(row):
    setor = normalize_sector(row.get("setor"))
    desc = row.get("setor_descricao") or row.get("setor_nome") or row.get("nome_setor")
    return f"{setor} · {desc}" if desc and str(desc).strip() not in setor else setor

def _forma_code(row):
    return str(row.get("codigo_forma") or row.get("forma_codigo") or row.get("forma") or row.get("forma_numero") or row.get("codigo_resolved") or "SEM FORMA").strip()

def _forma_desc(row):
    return str(row.get("descricao_curta") or row.get("forma_descricao") or row.get("descricao_forma") or row.get("modelo_resolved") or row.get("modelo") or "Sem descrição").strip()


def comparison_status(
    expected,
    actual,
    missing_expected_label,
    missing_actual_label,
    matched_label="CONFERE",
):
    """Classifica uma conferência de quantidades sem misturar as duas fontes."""
    if actual == expected:
        return matched_label
    if expected == 0:
        return missing_expected_label
    if actual == 0:
        return missing_actual_label
    if actual < expected:
        return "PARCIAL"
    return "EXCEDENTE"

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

            if qty_prog == 0 and qty_real_enc == 0 and qty_real == 0:
                continue
                
            diff_programado_realizado = qty_real_enc - qty_prog
            diff = qty_real - qty_real_enc

            # Dupla conferência, cada uma preservando claramente suas fontes:
            # 1) Programado (P) x Realizado informado na planilha (R).
            # 2) Realizado da planilha (R) x apontamento da Fábrica/Supabase.
            status_programado_realizado = comparison_status(
                qty_prog,
                qty_real_enc,
                "NÃO PROGRAMADO",
                "NÃO REALIZADO",
            )
            status_realizado_fabrica = comparison_status(
                qty_real_enc,
                qty_real,
                "NAO INFORMADO",
                "NAO APONTADO",
                matched_label="REALIZADO",
            )

            comparison_details.append({
                "setor": setor,
                "codigo": codigo,
                "modelo": modelo,
                "programado": qty_prog,
                "realizado_encarregado": qty_real_enc,
                "produzido": qty_real,
                "diferenca_programado_realizado": diff_programado_realizado,
                "diferenca": diff,
                "status_programado_realizado": status_programado_realizado,
                "status_realizado_fabrica": status_realizado_fabrica,
                # Mantido para consumidores antigos: representa R x Fábrica.
                "status": status_realizado_fabrica,
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
            s_diff = s_real - s_real_enc
            s_pct = (s_real / s_real_enc * 100) if s_real_enc > 0 else (100 if s_real > 0 else 0)
            
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
                
                if real_enc_val > 0 and real_val == 0:
                    desvio_text += f"Encarregado apontou {real_enc_val} (R), mas nenhuma peca aparece na Fabrica."
                elif real_enc_val > 0 and real_val < real_enc_val:
                    desvio_text += f"Encarregado apontou {real_enc_val} (R), Fabrica tem {real_val} (falta {abs(diff_val)} pc)."
                elif real_enc_val > 0 and real_val > real_enc_val:
                    desvio_text += f"Encarregado apontou {real_enc_val} (R), Fabrica tem {real_val} (excesso de {diff_val} pc)."
                elif real_enc_val == 0 and real_val > 0:
                    desvio_text += f"Sem Realizado (R) na planilha, mas Fabrica apontou {real_val} pecas."
                else:
                    desvio_text += f"Fabrica apontou {real_val} pecas."

                if prog_val != real_enc_val:
                    desvio_text += f" <i>(PCP programou {prog_val} (P)).</i>"
                
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
        diferenca_total = total_real - total_real_enc
        aderencia_pct = (total_real / total_real_enc * 100) if total_real_enc > 0 else (100 if total_real > 0 else 0)

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

    def build_quality_analysis(self, day_rows, month_rows, date_str):
        meta = config.META_FORA_PADRAO_DIARIA
        analyzed = datetime.strptime(date_str, "%Y-%m-%d")
        day_total = len(day_rows)
        day_bad_rows = [r for r in day_rows if _is_fora_padrao(r)]
        day_bad = len(day_bad_rows)
        day_ok = day_total - day_bad
        day_pct = (day_bad / day_total) if day_total else 0
        day_volume_bad = sum(_volume(r) for r in day_bad_rows)
        day_volume_total = sum(_volume(r) for r in day_rows)

        by_sector = {}
        for row in day_rows:
            sector = normalize_sector(row.get("setor"))
            item = by_sector.setdefault(sector, {
                "setor": sector,
                "label": _sector_label(row),
                "total": 0,
                "fora_padrao": 0,
                "volume_fora_padrao": 0.0,
                "formas": [],
            })
            item["total"] += 1
            if _is_fora_padrao(row):
                item["fora_padrao"] += 1
                item["volume_fora_padrao"] += _volume(row)
                item["formas"].append({
                    "codigo": _forma_code(row),
                    "descricao": _forma_desc(row),
                    "volume": _volume(row),
                })

        outlier = None
        if day_bad:
            candidate = max(by_sector.values(), key=lambda s: s["fora_padrao"])
            share = candidate["fora_padrao"] / day_bad
            if share >= 0.90:
                outlier = {**candidate, "share": share}

        visible_sectors = [
            {**s, "pct": (s["fora_padrao"] / s["total"]) if s["total"] else 0}
            for s in by_sector.values()
        ]
        visible_sectors.sort(key=lambda s: (s["fora_padrao"], s["pct"]), reverse=True)

        day_type_totals = defaultdict(lambda: {"tipo": "", "total": 0, "fora_padrao": 0, "volume": 0.0, "volume_fora_padrao": 0.0})
        month_type_totals = defaultdict(lambda: {"tipo": "", "total": 0, "fora_padrao": 0, "volume": 0.0, "volume_fora_padrao": 0.0})

        def add_type(target, row):
            tipo = _tipo_concreto(row)
            bucket = target[tipo]
            bucket["tipo"] = tipo
            bucket["total"] += 1
            bucket["volume"] += _volume(row)
            if _is_fora_padrao(row):
                bucket["fora_padrao"] += 1
                bucket["volume_fora_padrao"] += _volume(row)

        for r in day_rows:
            add_type(day_type_totals, r)
        for r in month_rows:
            add_type(month_type_totals, r)

        daily = {}
        daily_incluindo_setor3 = {}
        for r in month_rows:
            d = _row_date(r)
            if not d or d > date_str:
                continue
            parsed_day = datetime.strptime(d, "%Y-%m-%d").date()
            if parsed_day.weekday() >= 5:
                continue
            bucket = daily.setdefault(d, {"date": d, "total": 0, "fora_padrao": 0})
            bucket["total"] += 1
            if _is_fora_padrao(r):
                bucket["fora_padrao"] += 1

            bucket_with_s3 = daily_incluindo_setor3.setdefault(d, {"date": d, "total": 0, "fora_padrao": 0})
            bucket_with_s3["total"] += 1
            if _is_fora_padrao_incluindo_setor3(r):
                bucket_with_s3["fora_padrao"] += 1

        daily_points = []
        for d in sorted(daily):
            item = daily[d]
            pct = (item["fora_padrao"] / item["total"]) if item["total"] else 0
            daily_points.append({**item, "pct": pct, "label": datetime.strptime(d, "%Y-%m-%d").strftime("%d/%m")})
        daily_points_incluindo_setor3 = []
        for d in sorted(daily_incluindo_setor3):
            item = daily_incluindo_setor3[d]
            pct = (item["fora_padrao"] / item["total"]) if item["total"] else 0
            daily_points_incluindo_setor3.append({**item, "pct": pct, "label": datetime.strptime(d, "%Y-%m-%d").strftime("%d/%m")})

        month_total = sum(p["total"] for p in daily_points)
        month_bad = sum(p["fora_padrao"] for p in daily_points)
        month_pct = (month_bad / month_total) if month_total else 0
        first = daily_points[: max(1, len(daily_points) // 2)]
        second = daily_points[max(1, len(daily_points) // 2):] or first
        first_pct = sum(p["fora_padrao"] for p in first) / max(1, sum(p["total"] for p in first))
        second_pct = sum(p["fora_padrao"] for p in second) / max(1, sum(p["total"] for p in second))
        best = min(daily_points, key=lambda p: p["pct"], default={"pct": 0, "label": analyzed.strftime("%d/%m")})
        peak = max(daily_points, key=lambda p: p["pct"], default=None)
        days_on_meta = sum(1 for p in daily_points if p["pct"] <= meta)
        dominant = max(month_type_totals.values(), key=lambda t: t["fora_padrao"], default={"tipo": "", "fora_padrao": 0})
        dominant_share = dominant["fora_padrao"] / month_bad if month_bad else 0

        insights = []
        if days_on_meta:
            insights.append(f"{days_on_meta} dia(s) dentro da meta de {meta:.0%}.")
        else:
            insights.append(f"Nenhum dia atingiu a meta de {meta:.0%}.")
        insights.append(f"Menor valor foi {best['pct']:.1%} em {best['label']}.")
        trend_word = "melhora" if second_pct <= first_pct else "piora"
        insights.append(f"Tendência de {trend_word}: {first_pct:.1%} na 1ª metade → {second_pct:.1%} na 2ª metade.")
        if peak and peak["pct"] > 0.30:
            insights.append(f"Pico em {peak['label']} com {peak['pct']:.1%}.")
        if dominant["fora_padrao"]:
            insights.append(f"{dominant['tipo']} responde por {dominant_share:.1%} dos desvios do mês.")

        actions = []
        if outlier:
            actions.append(f"Auditar {outlier['setor']} e conferir classificação/parametrização dos lançamentos.")
        if peak and peak["pct"] > 0.30:
            actions.append(f"Investigar o pico de {peak['label']} cruzando turno, operador, receita e insumos.")
        if month_pct > meta * 5:
            actions.append(f"Revisar meta: realizado do mês está em {month_pct:.1%}, acima de 5x a meta diária.")

        title = f"{outlier['setor']} exige ação imediata" if outlier else (
            "Meta do dia atingida" if day_pct <= meta else "Desvios acima da meta diária"
        )

        return {
            "meta": meta,
            "titulo": title,
            "data": analyzed.strftime("%d/%m/%Y"),
            "data_curta": analyzed.strftime("%d/%m"),
            "mes_ano": analyzed.strftime("%B/%Y"),
            "day_total": day_total,
            "day_ok": day_ok,
            "day_bad": day_bad,
            "day_pct": day_pct,
            "day_volume_bad": day_volume_bad,
            "day_volume_total": day_volume_total,
            "outlier": outlier,
            "visible_sectors": visible_sectors,
            "day_types": sorted(day_type_totals.values(), key=lambda t: t["fora_padrao"], reverse=True),
            "month_types": sorted(month_type_totals.values(), key=lambda t: t["fora_padrao"], reverse=True),
            "daily_points": daily_points,
            "daily_points_incluindo_setor3": daily_points_incluindo_setor3,
            "month_total": month_total,
            "month_bad": month_bad,
            "month_pct": month_pct,
            "month_volume": sum(_volume(r) for r in month_rows),
            "productive_days": len(daily_points),
            "avg_day": month_total / max(1, len(daily_points)),
            "avg_bad_day": month_bad / max(1, len(daily_points)),
            "insights": insights,
            "actions": actions,
        }
