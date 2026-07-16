import logging
from datetime import datetime
from pathlib import Path
from jinja2 import Template
import config

logger = logging.getLogger("pcp_producao_agent")

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Diário PCP x Produção — ConcreTrack</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            --card-bg: #ffffff;
            --card-border: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            
            --color-realizado: #10b981;
            --color-realizado-bg: #ecfdf5;
            --color-parcial: #f59e0b;
            --color-parcial-bg: #fffbeb;
            --color-nao-produzido: #ef4444;
            --color-nao-produzido-bg: #fef2f2;
            --color-excedente: #3b82f6;
            --color-excedente-bg: #eff6ff;
            --color-nao-programado: #8b5cf6;
            --color-nao-programado-bg: #f5f3ff;
            
            --radius-lg: 20px;
            --radius-md: 14px;
            --transition: all 0.25s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        body {
            background: var(--bg-gradient);
            color: var(--text-main);
            min-height: 100vh;
            padding: 2.5rem 2rem;
            line-height: 1.6;
        }

        .container {
            max-width: 1240px;
            margin: 0 auto;
        }

        /* --- HEADER --- */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 2rem;
            margin-bottom: 2.5rem;
        }

        .brand h1 {
            font-size: 2.25rem;
            font-weight: 900;
            letter-spacing: -0.04em;
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .brand p {
            color: var(--text-muted);
            font-size: 1rem;
            font-weight: 500;
            margin-top: 0.25rem;
        }

        .timestamp {
            text-align: right;
            font-size: 0.85rem;
            color: var(--text-muted);
            font-weight: 600;
        }

        /* --- KPI CARD ROW --- */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2.5rem;
        }

        .kpi-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-md);
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            transition: var(--transition);
        }

        .kpi-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
        }

        .kpi-label {
            color: var(--text-muted);
            font-size: 0.72rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .kpi-value {
            font-size: 2.1rem;
            font-weight: 900;
            margin: 0.4rem 0;
            letter-spacing: -0.04em;
            color: var(--text-main);
        }

        .kpi-sub {
            font-size: 0.8rem;
            font-weight: 700;
        }

        /* --- EXECUTIVE SUMMARY --- */
        .summary-card {
            background: #1e293b;
            color: #f8fafc;
            border-radius: var(--radius-lg);
            padding: 2rem;
            margin-bottom: 2.5rem;
            box-shadow: 0 10px 25px -5px rgba(30, 41, 59, 0.3);
        }

        .summary-card h2 {
            font-size: 1.5rem;
            font-weight: 800;
            margin-bottom: 1.25rem;
            letter-spacing: -0.02em;
            color: #3b82f6;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        @media (min-width: 768px) {
            .summary-grid {
                grid-template-columns: 1fr 1fr;
            }
        }

        .summary-section h3 {
            font-size: 1.05rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            color: #94a3b8;
            border-bottom: 1px solid #334155;
            padding-bottom: 0.25rem;
        }

        .summary-list {
            list-style: none;
        }

        .summary-list > li {
            font-size: 0.95rem;
            margin-bottom: 0.75rem;
            position: relative;
            padding-left: 1.25rem;
            list-style-type: none;
        }

        .summary-list > li::before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            font-size: 1.25rem;
            position: absolute;
            left: 0;
            top: -2px;
        }

        .summary-nested-list {
            list-style-type: none;
            padding-left: 0.75rem;
            margin-top: 0.35rem;
            border-left: 2px solid #334155;
        }

        .summary-nested-list li {
            font-size: 0.85rem;
            color: #cbd5e1;
            margin-bottom: 0.25rem;
            position: relative;
            padding-left: 1rem;
            list-style-type: none;
        }

        .summary-nested-list li::before {
            content: "◦";
            color: #94a3b8;
            font-size: 1rem;
            position: absolute;
            left: 0;
            top: -1px;
            font-weight: bold;
        }

        /* --- SECTIONS BY SECTOR --- */
        .sector-section {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: var(--radius-lg);
            padding: 2rem;
            margin-bottom: 2.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .sector-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
        }

        .sector-title {
            font-size: 1.35rem;
            font-weight: 800;
            letter-spacing: -0.02em;
        }

        .sector-badge {
            background: #f1f5f9;
            color: #475569;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.78rem;
            font-weight: 800;
        }

        /* --- TABLE --- */
        .table-container {
            overflow-x: auto;
            border: 1px solid var(--card-border);
            border-radius: var(--radius-md);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.92rem;
        }

        th {
            background: #f8fafc;
            color: var(--text-muted);
            font-weight: 800;
            text-transform: uppercase;
            font-size: 0.72rem;
            letter-spacing: 0.08em;
            padding: 1rem 1.1rem;
            border-bottom: 2px solid #e2e8f0;
        }

        td {
            padding: 1rem 1.1rem;
            border-bottom: 1px solid #f1f5f9;
            font-weight: 600;
        }

        /* Status colors mapping */
        .status-REALIZADO {
            background: var(--color-realizado-bg);
            border-left: 5px solid var(--color-realizado);
            color: #065f46;
        }
        .status-PARCIAL {
            background: var(--color-parcial-bg);
            border-left: 5px solid var(--color-parcial);
            color: #92400e;
        }
        .status-NÃO\\ PRODUZIDO {
            background: var(--color-nao-produzido-bg);
            border-left: 5px solid var(--color-nao-produzido);
            color: #991b1b;
        }
        .status-EXCEDENTE {
            background: var(--color-excedente-bg);
            border-left: 5px solid var(--color-excedente);
            color: #1e40af;
        }
        .status-NÃO\\ PROGRAMADO {
            background: var(--color-nao-programado-bg);
            border-left: 5px solid var(--color-nao-programado);
            color: #5b21b6;
        }

        .badge-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.68rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .badge-REALIZADO { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge-PARCIAL { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-NÃO\\ PRODUZIDO { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .badge-EXCEDENTE { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
        .badge-NÃO\\ PROGRAMADO { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; }

        .text-diff {
            font-weight: 700;
        }
        .text-diff.negative { color: var(--color-nao-produzido); }
        .text-diff.positive { color: var(--color-excedente); }
        .text-diff.zero { color: var(--text-muted); }

        /* Footer totals styling */
        tfoot tr {
            background: #f8fafc;
            border-top: 3px double #cbd5e1;
            font-weight: 800;
            color: var(--text-main);
        }

        tfoot td {
            padding: 1.15rem 1.1rem;
            font-size: 0.92rem;
            border-bottom: none;
        }

        /* Narrative Summary Box */
        .sector-narrative {
            margin-top: 1.5rem;
            padding: 1.25rem 1.5rem;
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            border-radius: 8px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
        }

        .sector-narrative h4 {
            font-size: 0.95rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #1e3a8a;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .sector-narrative .desc-geral {
            font-size: 0.9rem;
            color: #334155;
            font-weight: 600;
            margin-bottom: 0.75rem;
        }

        .sector-narrative ul {
            list-style-type: none;
            padding-left: 0;
        }

        .sector-narrative li {
            font-size: 0.88rem;
            color: #475569;
            margin-bottom: 0.4rem;
            position: relative;
            padding-left: 1.25rem;
            font-weight: 500;
            line-height: 1.5;
        }

        .sector-narrative li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #3b82f6;
            font-weight: 800;
        }

        /* --- FILTERS & ACTIONS FOR TABLES --- */
        .table-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
            background: #f8fafc;
            padding: 0.75rem 1.25rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--card-border);
        }

        .search-box input {
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: 1px solid var(--card-border);
            font-size: 0.85rem;
            width: 250px;
            outline: none;
            transition: var(--transition);
        }

        .search-box input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .status-filters {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .filter-label {
            font-size: 0.8rem;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-right: 0.25rem;
        }

        .filter-btn {
            background: #ffffff;
            border: 1px solid var(--card-border);
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            transition: var(--transition);
            color: var(--text-muted);
        }

        .filter-btn:hover {
            border-color: #cbd5e1;
            color: var(--text-main);
        }

        .filter-btn.active {
            background: #3b82f6;
            border-color: #3b82f6;
            color: #ffffff;
        }

        .btn-restore-hidden {
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #b45309;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        }

        .btn-restore-hidden:hover {
            background: #fef3c7;
        }

        .btn-hide-row {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1rem;
            cursor: pointer;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .btn-hide-row:hover {
            background: #fee2e2;
            color: #ef4444;
        }

        .manually-hidden {
            display: none !important;
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <div class="brand">
            <h1>Relatório Diário PCP x Produção</h1>
            <p>Comparativo Executivo — Mapa de Concretagem vs. Planilha PCP - DIÁRIO</p>
        </div>
        <div class="timestamp">
            <div>Data Analisada: <strong>{{ data_analisada }}</strong></div>
            <div style="margin-top:0.25rem;">Gerado em: <strong>{{ data_geracao }} às {{ hora_geracao }}</strong></div>
        </div>
    </header>

    <!-- KPI ROW -->
    <section class="kpi-grid">
        <div class="kpi-card">
            <span class="kpi-label">PCP Programado (P)</span>
            <div class="kpi-value">{{ total_programado }}</div>
            <span class="kpi-sub" style="color:var(--text-muted)">Meta planejada (Planilha)</span>
        </div>
        <div class="kpi-card">
            <span class="kpi-label">PCP Realizado (R)</span>
            <div class="kpi-value" style="color: #1e3a8a;">{{ total_realizado_encarregado }}</div>
            <span class="kpi-sub" style="color:var(--text-muted)">Apontado Encarregado</span>
        </div>
        <div class="kpi-card">
            <span class="kpi-label">Realizado Fábrica</span>
            <div class="kpi-value">{{ total_produzido }}</div>
            <span class="kpi-sub" style="color:var(--text-muted)">Concretado (Supabase)</span>
        </div>
        <div class="kpi-card">
            <span class="kpi-label">Desvio Fábrica (vs P)</span>
            <div class="kpi-value" style="color: {% if diferenca_total >= 0 %}var(--color-excedente){% else %}var(--color-nao-produzido){% endif %}">
                {{ "%+d" | format(diferenca_total) }}
            </div>
            <span class="kpi-sub" style="color:var(--text-muted)">Diferença no dia</span>
        </div>
        <div class="kpi-card">
            <span class="kpi-label">Aderência Geral</span>
            <div class="kpi-value" style="color: {% if aderencia_pct >= 95 %}var(--color-realizado){% elif aderencia_pct >= 80 %}var(--color-parcial){% else %}var(--color-nao-produzido){% endif %}">
                {{ "%.1f" | format(aderencia_pct) }}%
            </div>
            <span class="kpi-sub" style="color:var(--text-muted)">Atendimento real</span>
        </div>
    </section>

    <!-- EXECUTIVE SUMMARY -->
    <section class="summary-card">
        <h2>Resumo Executivo & Recomendações</h2>
        <div class="summary-grid">
            <div class="summary-section">
                <h3>Principais Pontos de Aderência</h3>
                <ul class="summary-list">
                    <li>Setor com melhor aderência: <strong>{{ analise.setor_melhor }}</strong></li>
                    <li>Setor com maior desvio: <strong>{{ analise.setor_pior }}</strong></li>
                    <li>
                        Itens planejados não produzidos: <strong>{{ itens_nao_produzidos }}</strong>
                        {% if itens_nao_produzidos_detalhes %}
                            <ul class="summary-nested-list">
                                {% for item in itens_nao_produzidos_detalhes %}
                                    <li>Cód. {{ item.codigo }} ({{ item.modelo }}) no {{ item.setor }} - Prog: {{ item.quantidade }} pç</li>
                                {% endfor %}
                            </ul>
                        {% endif %}
                    </li>
                    <li>
                        Itens produzidos fora do planejamento: <strong>{{ itens_nao_programados }}</strong>
                        {% if itens_nao_programados_detalhes %}
                            <ul class="summary-nested-list">
                                {% for item in itens_nao_programados_detalhes %}
                                    <li>Cód. {{ item.codigo }} ({{ item.modelo }}) no {{ item.setor }} - Real: {{ item.quantidade }} pç</li>
                                {% endfor %}
                            </ul>
                        {% endif %}
                    </li>
                </ul>
            </div>
            <div class="summary-section">
                <h3>Pendências Críticas (PCP Não Atendido)</h3>
                <ul class="summary-list">
                    {% if analise.produtos_criticos %}
                        {% for item in analise.produtos_criticos %}
                            <li>{{ item }}</li>
                        {% endfor %}
                    {% else %}
                        <li style="color:var(--color-realizado);">Nenhum desvio crítico pendente. Aderência de 100%!</li>
                    {% endif %}
                </ul>
            </div>
        </div>
        
        <div class="summary-section" style="margin-top: 1.5rem;">
            <h3 style="color:#3b82f6;">Recomendações Operacionais</h3>
            <ul class="summary-list">
                {% for rec in analise.recomendacoes %}
                    <li>{{ rec }}</li>
                {% endfor %}
            </ul>
        </div>
    </section>

    <!-- TABLES BY SECTOR -->
    {% for setor_nome, stats in setores.items() %}
    <section class="sector-section">
        <div class="sector-header">
            <h2 class="sector-title">{{ setor_nome }}</h2>
            <div class="sector-badge">
                Prog (P): <strong>{{ stats.programado }}</strong> | 
                Real (R): <strong>{{ stats.realizado_encarregado }}</strong> | 
                Fábrica: <strong>{{ stats.produzido }}</strong> | 
                Aderência: <strong>{{ "%.1f" | format(stats.aderencia_pct) }}%</strong>
            </div>
        </div>

        <!-- CONTROLES DE FILTRO -->
        {% if stats.rows %}
        <div class="table-controls" data-sector="{{ setor_nome }}">
            <div class="search-box">
                <input type="text" placeholder="Filtrar por modelo ou código..." oninput="applyFilters('{{ setor_nome }}')">
            </div>
            <div class="status-filters">
                <span class="filter-label">Filtrar Status:</span>
                <button class="filter-btn active" data-status="ALL" onclick="toggleFilter(this, 'ALL', '{{ setor_nome }}')">Todos</button>
                <button class="filter-btn" data-status="REALIZADO" onclick="toggleFilter(this, 'REALIZADO', '{{ setor_nome }}')">Realizado</button>
                <button class="filter-btn" data-status="PARCIAL" onclick="toggleFilter(this, 'PARCIAL', '{{ setor_nome }}')">Parcial</button>
                <button class="filter-btn" data-status="NÃO PRODUZIDO" onclick="toggleFilter(this, 'NÃO PRODUZIDO', '{{ setor_nome }}')">Não Produzido</button>
                <button class="filter-btn" data-status="EXCEDENTE" onclick="toggleFilter(this, 'EXCEDENTE', '{{ setor_nome }}')">Excedente</button>
                <button class="filter-btn" data-status="NÃO PROGRAMADO" onclick="toggleFilter(this, 'NÃO PROGRAMADO', '{{ setor_nome }}')">Não Programado</button>
            </div>
            <div>
                <button class="btn-restore-hidden" id="restore-{{ setor_nome }}" onclick="restoreHiddenRows('{{ setor_nome }}')" style="display: none;">
                    Mostrar Ocultados (<span class="hidden-count">0</span>)
                </button>
            </div>
        </div>
        {% endif %}

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Modelo</th>
                        <th>Código do Poste</th>
                        <th style="text-align: center; width: 150px;">Programado (Planilha - P)</th>
                        <th style="text-align: center; width: 150px;">Realizado (Planilha - R)</th>
                        <th style="text-align: center; width: 160px;">Produzido (Fábrica - Supabase)</th>
                        <th style="text-align: center; width: 100px;">Desvio</th>
                        <th style="width: 150px;">Status</th>
                        <th style="width: 60px; text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {% if stats.rows %}
                        {% for row in stats.rows %}
                        <tr class="status-{{ row.status }}" data-status="{{ row.status }}" data-model="{{ row.modelo | lower }}" data-code="{{ row.codigo | lower }}">
                            <td>{{ row.modelo }}</td>
                            <td><strong>{{ row.codigo }}</strong></td>
                            <td class="cell-prog" style="text-align: center;">{{ row.programado }}</td>
                            <td class="cell-real-enc" style="text-align: center;">{{ row.realizado_encarregado }}</td>
                            <td class="cell-prod" style="text-align: center;">{{ row.produzido }}</td>
                            <td class="cell-diff text-diff {% if row.diferenca > 0 %}positive{% elif row.diferenca < 0 %}negative{% else %}zero{% endif %}" style="text-align: center;">
                                {{ "%+d" | format(row.diferenca) if row.diferenca != 0 else "0" }}
                            </td>
                            <td>
                                <span class="badge-status badge-{{ row.status }}">{{ row.status }}</span>
                            </td>
                            <td style="text-align: center;">
                                <button class="btn-hide-row" onclick="hideRow(this, '{{ setor_nome }}')" title="Ocultar item">✕</button>
                            </td>
                        </tr>
                        {% endfor %}
                        <tr class="no-results-row" style="display: none;">
                            <td colspan="8" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 2rem;">
                                Nenhum item corresponde aos filtros selecionados.
                            </td>
                        </tr>
                    {% else %}
                        <tr>
                            <td colspan="8" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 2rem;">
                                Nenhuma atividade ou planejamento registrado para este setor nesta data.
                            </td>
                        </tr>
                    {% endif %}
                </tbody>
                {% if stats.rows %}
                <tfoot>
                    <tr class="table-totals">
                        <td colspan="2" style="text-align: right; text-transform: uppercase;">Total (Filtrado):</td>
                        <td class="total-prog" style="text-align: center;">{{ stats.programado }}</td>
                        <td class="total-real-enc" style="text-align: center;">{{ stats.realizado_encarregado }}</td>
                        <td class="total-prod" style="text-align: center;">{{ stats.produzido }}</td>
                        <td class="total-diff text-diff {% if stats.diferenca > 0 %}positive{% elif stats.diferenca < 0 %}negative{% else %}zero{% endif %}" style="text-align: center;">
                            {{ "%+d" | format(stats.diferenca) if stats.diferenca != 0 else "0" }}
                        </td>
                        <td colspan="2"></td>
                    </tr>
                </tfoot>
                {% endif %}
            </table>
        </div>

        <!-- Local narrative summary -->
        {% if stats.rows %}
        <div class="sector-narrative">
            <h4>📋 Resumo de Desvios — Apontamento vs. Planejamento</h4>
            <p class="desc-geral">{{ stats.resumo_geral }}</p>
            {% if stats.desvios_detalhes %}
                <ul>
                    {% for desvio in stats.desvios_detalhes %}
                        <li>{{ desvio }}</li>
                    {% endfor %}
                </ul>
            {% else %}
                <p style="color: var(--color-realizado); font-weight: 700; font-size: 0.88rem; margin: 0;">
                    ✓ Perfeito! 100% de aderência neste setor. Os apontamentos dos operadores no Mapa bateram exatamente com a planilha de PCP do encarregado.
                </p>
            {% endif %}
        </div>
        {% endif %}
    </section>
    {% endfor %}
</div>

<script>
    // Armazena as linhas ocultadas manualmente para cada setor
    const manuallyHiddenRows = {};

    function toggleFilter(button, status, sector) {
        const sectorSection = button.closest('.sector-section');
        const buttons = sectorSection.querySelectorAll('.status-filters .filter-btn');
        
        if (status === 'ALL') {
            // Se clicar em Todos, ativa "Todos" e desativa os outros
            buttons.forEach(btn => {
                if (btn.getAttribute('data-status') === 'ALL') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        } else {
            // Se clicar em qualquer outro, desativa "Todos" e alterna o clicado
            const allBtn = sectorSection.querySelector('.status-filters .filter-btn[data-status="ALL"]');
            allBtn.classList.remove('active');
            
            button.classList.toggle('active');
            
            // Se nenhum botão ficar ativo, reativa o "Todos"
            const activeButtons = sectorSection.querySelectorAll('.status-filters .filter-btn.active');
            if (activeButtons.length === 0) {
                allBtn.classList.add('active');
            }
        }
        
        applyFilters(sector);
    }

    function applyFilters(sector) {
        // Encontra a seção do setor correspondente
        const sections = document.querySelectorAll('.sector-section');
        let sectorSection = null;
        for (let sec of sections) {
            if (sec.querySelector('.sector-title').textContent.trim() === sector.trim()) {
                sectorSection = sec;
                break;
            }
        }
        if (!sectorSection) return;

        const searchInput = sectorSection.querySelector('.search-box input');
        const query = searchInput.value.toLowerCase().trim();
        
        // Obtém status ativos
        const activeButtons = sectorSection.querySelectorAll('.status-filters .filter-btn.active');
        const activeStatuses = Array.from(activeButtons).map(btn => btn.getAttribute('data-status'));
        const isAllActive = activeStatuses.includes('ALL');

        const rows = sectorSection.querySelectorAll('tbody tr:not(.no-results-row)');
        let visibleCount = 0;

        rows.forEach(row => {
            const rowStatus = row.getAttribute('data-status');
            const model = row.getAttribute('data-model') || '';
            const code = row.getAttribute('data-code') || '';
            
            // Verifica se está ocultada manualmente
            const isManuallyHidden = row.classList.contains('manually-hidden');
            
            // Filtro de texto
            const matchesSearch = query === '' || model.includes(query) || code.includes(query);
            
            // Filtro de status
            const matchesStatus = isAllActive || activeStatuses.includes(rowStatus);
            
            if (matchesSearch && matchesStatus && !isManuallyHidden) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Exibe mensagem de "sem resultados" se nenhuma linha estiver visível
        const noResultsRow = sectorSection.querySelector('.no-results-row');
        if (noResultsRow) {
            noResultsRow.style.display = visibleCount === 0 ? '' : 'none';
        }

        // Atualiza os totais da tabela
        updateTotals(sectorSection);
    }

    function hideRow(button, sector) {
        const row = button.closest('tr');
        row.classList.add('manually-hidden');
        row.style.display = 'none';

        if (!manuallyHiddenRows[sector]) {
            manuallyHiddenRows[sector] = [];
        }
        manuallyHiddenRows[sector].push(row);

        updateRestoreButton(sector);
        applyFilters(sector);
    }

    function restoreHiddenRows(sector) {
        const hiddenList = manuallyHiddenRows[sector] || [];
        hiddenList.forEach(row => {
            row.classList.remove('manually-hidden');
        });
        manuallyHiddenRows[sector] = [];

        updateRestoreButton(sector);
        applyFilters(sector);
    }

    function updateRestoreButton(sector) {
        // Encontra a seção do setor
        const sections = document.querySelectorAll('.sector-section');
        let sectorSection = null;
        for (let sec of sections) {
            if (sec.querySelector('.sector-title').textContent.trim() === sector.trim()) {
                sectorSection = sec;
                break;
            }
        }
        if (!sectorSection) return;

        const restoreBtn = sectorSection.querySelector('.btn-restore-hidden');
        const countSpan = restoreBtn.querySelector('.hidden-count');
        const hiddenCount = (manuallyHiddenRows[sector] || []).length;

        if (hiddenCount > 0) {
            countSpan.textContent = hiddenCount;
            restoreBtn.style.display = 'inline-flex';
        } else {
            restoreBtn.style.display = 'none';
        }
    }

    function updateTotals(sectorSection) {
        const rows = sectorSection.querySelectorAll('tbody tr:not(.no-results-row)');
        let totalProg = 0;
        let totalRealEnc = 0;
        let totalProd = 0;

        rows.forEach(row => {
            // Apenas soma se a linha estiver visível (style.display !== 'none' e não manualmente oculta)
            if (row.style.display !== 'none') {
                const progVal = parseInt(row.querySelector('.cell-prog').textContent) || 0;
                const realEncVal = parseInt(row.querySelector('.cell-real-enc').textContent) || 0;
                const prodVal = parseInt(row.querySelector('.cell-prod').textContent) || 0;
                
                totalProg += progVal;
                totalRealEnc += realEncVal;
                totalProd += prodVal;
            }
        });

        const totalDiff = totalProd - totalProg;

        // Atualiza os elementos de total do rodapé
        const tfoot = sectorSection.querySelector('tfoot');
        if (tfoot) {
            const progCell = tfoot.querySelector('.total-prog');
            const realEncCell = tfoot.querySelector('.total-real-enc');
            const prodCell = tfoot.querySelector('.total-prod');
            const diffCell = tfoot.querySelector('.total-diff');

            if (progCell) progCell.textContent = totalProg;
            if (realEncCell) realEncCell.textContent = totalRealEnc;
            if (prodCell) prodCell.textContent = totalProd;

            if (diffCell) {
                const prefix = totalDiff > 0 ? '+' : '';
                diffCell.textContent = prefix + totalDiff;
                
                // Atualiza cores do desvio
                diffCell.classList.remove('positive', 'negative', 'zero');
                if (totalDiff > 0) {
                    diffCell.classList.add('positive');
                } else if (totalDiff < 0) {
                    diffCell.classList.add('negative');
                } else {
                    diffCell.classList.add('zero');
                }
            }
        }
    }
</script>
</body>
</html>
"""

class HtmlReportGenerator:
    def generate(self, data, date_str):
        """
        Gera o relatório HTML a partir dos dados consolidados e salva na pasta de relatórios.
        Retorna o caminho absoluto do arquivo salvo.
        """
        now = datetime.now()
        
        # Mapeia as variáveis de contexto para renderizar o template
        context = {
            "data_analisada": datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y"),
            "data_geracao": now.strftime("%d/%m/%Y"),
            "hora_geracao": now.strftime("%H:%M"),
            "total_programado": data["total_programado"],
            "total_realizado_encarregado": data["total_realizado_encarregado"],
            "total_produzido": data["total_produzido"],
            "diferenca_total": data["diferenca_total"],
            "aderencia_pct": data["aderencia_pct"],
            "itens_nao_produzidos": data["itens_nao_produzidos"],
            "itens_nao_programados": data["itens_nao_programados"],
            "itens_nao_produzidos_detalhes": data["itens_nao_produzidos_detalhes"],
            "itens_nao_programados_detalhes": data["itens_nao_programados_detalhes"],
            "setores": data["setores"],
            "analise": data["analise"]
        }

        logger.info("Renderizando template HTML do relatório...")
        template = Template(HTML_TEMPLATE)
        html_content = template.render(context)

        # Salva o arquivo final
        filename = f"relatorio_pcp_producao_{date_str}.html"
        filepath = config.REPORTS_DIR / filename
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html_content)

        logger.info(f"Relatório HTML criado com sucesso em: {filepath}")
        return str(filepath)
