"""Replace only the Defeitos header in the built unified Mapa HTML."""

START = '        <section class="df-v4-hero-grid" aria-label="Resumo de defeitos">'
END = '        <section class="df-v4-layout">'

HEADER = '''        <section class="df-new-head" aria-label="Indicadores de qualidade">
          <section class="df-new-panel" aria-label="Defeitos por poste produzido">
            <h3>Defeitos por poste produzido</h3>
            <p id="dfPieceCoverage">Aguardando dados</p>
            <div class="df-new-cards df-piece-cards" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))">
              <article class="df-new-card"><span>Postes com algum defeito</span><strong id="dfPieceAffected">—</strong><small id="dfPieceAffectedMeta">Aguardando dados</small><details><summary>Como é calculado</summary><p>Postes produzidos no período com pelo menos um “NÃO” registrado em inspeção concluída ÷ postes produzidos no mesmo recorte × 100. Cada poste conta uma vez, incluindo histórico e reinspeções.</p></details></article>
              <article class="df-new-card"><span>Postes com defeito crítico</span><strong id="dfPieceCritical">—</strong><small id="dfPieceCriticalMeta">Aguardando dados</small><details><summary>Como é calculado</summary><p>Postes produzidos no período com pelo menos um item crítico reprovado no checklist ÷ postes produzidos no mesmo recorte × 100. Estão incluídos nos postes com algum defeito. Falha crítica não significa segregação confirmada.</p></details></article>
            </div>
            <p id="dfPieceBreakdown"></p>
            <small>A data seleciona a fabricação do poste; inspeções posteriores também atualizam seu resultado. Sem inspeção vinculada, o poste permanece pendente. Situação filtra o status atual do poste; busca considera forma, modelo ou montador.</small>
          </section>
          <div class="df-new-cards">
            <article class="df-new-card"><span>Inspecionados</span><strong id="dfNewInspected">—</strong><small id="dfNewCoverage">Aguardando dados</small><details><summary>Como é calculado</summary><p>Postes distintos com primeira inspeção no período. Cobertura = inspecionados ÷ produzidos.</p></details></article>
            <article class="df-new-card df-new-main"><span>Postes não conformes</span><strong id="dfNewNonconforming">—</strong><small id="dfNewNonconformingMeta">Aguardando dados</small><details><summary>Como é calculado</summary><p>Postes com pelo menos um “NÃO” na primeira inspeção ÷ postes inspecionados.</p></details></article>
            <article class="df-new-card"><span>FPY · aprovados de primeira</span><strong id="dfNewFpy">—</strong><small id="dfNewFpyMeta">Aguardando dados</small><details><summary>Como é calculado</summary><p>Postes sem “NÃO” na primeira inspeção ÷ postes inspecionados.</p></details></article>
            <article class="df-new-card"><span>Defeitos encontrados</span><strong id="dfNewDefects">—</strong><small id="dfNewDefectsMeta">Aguardando dados</small><details><summary>Como é calculado</summary><p>Cada “NÃO” conta uma vez por poste e por inspeção. Por 100 = total de “NÃO” ÷ inspecionados × 100.</p></details></article>
            <article class="df-new-card"><span>Retrabalhados</span><strong id="dfNewReworked">—</strong><small id="dfNewReworkedMeta">Aguardando dados</small><div class="df-new-loss"><span>Perda do poste</span><strong id="dfNewLost">—</strong><small id="dfNewLostMeta"></small></div><details><summary>Como é calculado</summary><p>Resultados “Retrabalhado e aprovado” e “Perda do poste”, cada um ÷ postes inspecionados.</p></details></article>
          </div>
          <div class="df-new-secondary">
            <article><span>Defeitos por poste não conforme</span><strong id="dfNewPerAffected">—</strong><small id="dfNewPerAffectedMeta"></small><details><summary>Como é calculado</summary><p>Total de “NÃO” ÷ postes com “NÃO” na primeira inspeção.</p></details></article>
            <article><span>Taxa de não conformidade por oportunidade</span><strong id="dfNewOpportunity">—</strong><small id="dfNewOpportunityMeta"></small><details><summary>Como é calculado</summary><p>Total de “NÃO” ÷ oportunidades avaliadas. Cada avaliação tem 26 itens em S1/S2 ou 17 em S3/S4.</p></details></article>
          </div>
          <section class="df-new-panel df-reported" id="dfReportedPanel" hidden>
            <h3>Defeitos informados sem vínculo com inspeção</h3>
            <p><strong id="dfReportedTotal">0</strong> ocorrências no período e nos filtros selecionados. <span id="dfReportedTypes"></span> Cada linha recebida conta uma vez.</p>
            <small>Sem identificação do poste, estas ocorrências não entram em FPY, postes não conformes ou taxas por poste. O filtro de situação não se aplica a elas.</small>
            <div class="df-reported-details">
              <details><summary>Por modelo</summary><div class="df-new-table-scroll"><table><thead><tr><th>Modelo</th><th>Ocorrências</th></tr></thead><tbody id="dfReportedModels"></tbody></table></div></details>
              <details><summary>Por dia</summary><div class="df-new-table-scroll"><table><thead><tr><th>Data</th><th>Ocorrências</th></tr></thead><tbody id="dfReportedDays"></tbody></table></div></details>
            </div>
          </section>
          <div class="df-new-panels">
            <section class="df-new-panel"><h3>Indicadores por setor</h3><div class="df-new-table-scroll"><table><thead><tr><th>Escopo</th><th>Produzidos</th><th>Inspecionados</th><th>Cobertura</th><th>Não conformes</th><th>FPY</th><th>Defeitos / 100</th><th>Retrabalho</th><th>Perda</th></tr></thead><tbody id="dfNewSectorRows"></tbody></table></div><small>Percentuais de qualidade usam os inspecionados do mesmo escopo como denominador.</small></section>
            <section class="df-new-panel"><h3>Tendência mensal</h3><p>% de postes não conformes e FPY, pela primeira inspeção.</p><div id="dfNewTrend"></div></section>
          </div>
          <p class="df-new-note" id="dfNewUnspecified" hidden></p>
          <div class="df-new-export"><button id="dfNewExportXlsx" type="button">Exportar XLSX</button></div>
        </section>

'''


def apply(html: str) -> str:
    if html.count(START) != 1 or END not in html:
        raise RuntimeError("Dashboard Defeitos header changed in original HTML")
    left = html.index(START)
    right = html.index(END, left)
    return html[:left] + HEADER + html[right:]


def apply_to_published(html: str) -> str:
    """Add the production-cohort panel while preserving the published header."""
    if 'id="dfPieceAffected"' in html:
        raise RuntimeError('Production-cohort panel already published')
    marker = '<section class="df-new-head" aria-label="Indicadores de qualidade">\n'
    if html.count(marker) != 1:
        raise RuntimeError('Published Defeitos header changed')
    panel = HEADER.split(marker, 1)[1].split('          <div class="df-new-cards">', 1)[0]
    return html.replace(marker, marker + panel, 1)
