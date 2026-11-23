"""Keep CEC batch series in every new-unit frontend grouping; pure transformation."""
def transform(source,relative):
    path=str(relative).replace('\\','/')
    if path=='analise/api-client.js':
        source=source.replace('traco_id: g.traco_id,','traco_id: g.traco_id,\n        numero_serie: g.numero_serie,')
    if path in ['analise/resultado-cp.html','analise/relatorio.html']:
        source=source.replace("+'|'+r.traco_id+'|'+r.idade_dias", "+'|'+r.traco_id+'|'+r.numero_serie+'|'+r.idade_dias")
        source=source.replace('traco_id:r.traco_id,idade_dias:', 'traco_id:r.traco_id,numero_serie:r.numero_serie,idade_dias:')
        escape="function escapeCec(value){const e=document.createElement('span');e.textContent=String(value??'');return e.innerHTML;}\n"
        anchor='function groupRows(rawRows){' if 'resultado-cp' in path else 'function buildGroups(rawRows){'
        source=source.replace(anchor,escape+anchor)
        source=source.replace("(g.traco_id||'--')", "escapeCec((g.traco_id||'--')+' · Série '+(g.numero_serie||'--'))")
        if path.endswith('relatorio.html'):
            source=source.replace('return g.traco_id;}))];', 'return JSON.stringify([g.traco_id,g.numero_serie]);}))];')
            source=source.replace('tracoes.forEach(function(tr){','tracoes.forEach(function(batch){\n      var [tr,serie]=JSON.parse(batch);')
            source=source.replace('g.data_moldagem===dt&&g.traco_id===tr;', 'g.data_moldagem===dt&&g.traco_id===tr&&g.numero_serie===serie;')
            source=source.replace('rows.push({dt:dt,tr:tr,byAge:byAge});','rows.push({dt:dt,tr:tr,serie:serie,byAge:byAge});')
            source=source.replace("(r.tr||'--')", "escapeCec((r.tr||'--')+' · Série '+(r.serie||'--'))")
        source=source.replace('class="lft"','class="lft cec-batch-id"')
        source=source.replace('</head>','<style>td.cec-batch-id{white-space:normal!important;overflow-wrap:anywhere}</style>\n</head>')
    if path=='rompimentos-mes/index.html':
        source=source.replace('JSON.stringify([mold,trace])','JSON.stringify([mold,trace,item.numero_serie])')
        source=source.replace('{mold,trace,byAge:new Map()}', '{mold,trace,series:item.numero_serie,byAge:new Map()}')
        source=source.replace("td(row,group.trace||'—','trace');", "td(row,group.trace?(group.trace+' · Série '+(group.series||'—')):'—','trace');")
    return source
