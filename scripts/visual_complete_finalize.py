"""Reject partial matrices, update report totals and separate obsolete captures."""
import json,shutil
from pathlib import Path
R=Path(__file__).resolve().parents[1]
O=(R/'docs/revisao-visual-unificado/homolog/revisao-completa').resolve()
matrix=json.loads((O/'matriz.json').read_text(encoding='utf-8'))
s=matrix['summary'];rows=matrix['cases']
expected={'GERENCIA':182,'LABORATORIO':138,'PCP':56,'PRODUCAO':19,'QUALIDADE':17,'SUPRIMENTOS':9,'CONSULTA':15}
assert {p['profile']:p['cases'] for p in s['profiles']}==expected,s['profiles']
assert s['capture_versions']=={'1.4.25':sum(expected.values())}
assert all(len(r['layout'])==4 and {m['width'] for m in r['layout']}=={1440,1024,820,390} for r in rows)
assert all(len(r.get('module_states',[]))==4 for r in rows if r['screen'].startswith('module-'))
assert s['negative_cases']==31 and not s['open_visual_issues']
old_cases={'GERENCIA':['pdrProdutos','rbrProdutos','fechamentoDiario'],'PRODUCAO':['programacaoSemanal12','dashboard','comparacao','armadurasProgramacao','postesNumerosSerie','armadurasRelatorio'],'SUPRIMENTOS':['suprimentosSolicitacoes','suprimentosPainel','manutencaoUsina','suprimentosNova']}
retested=[]
for profile,ids in old_cases.items():
    for screen in ids:
        matches=[r for r in rows if r['profile']==profile and r['screen']==screen]
        assert len(matches)==1 and matches[0]['ok'],(profile,screen)
        retested.append({'profile':profile,'screen':screen,'version':matches[0]['review_version'],'widths':[m['width'] for m in matches[0]['layout']],'status':'passed'})
(O/'historico-13-reteste.json').write_text(json.dumps(retested,indent=2),encoding='utf-8')
p=O/'RELATORIO.md';text=p.read_text(encoding='utf-8')
for before,after in [('425 cenários','436 cenários'),('1.700 verificações','1.744 verificações'),('394 acessos','405 acessos'),('177 entradas e 176 identificadores','182 entradas e 181 identificadores'),('| Gerência/admin | 177 | 157 | 20 | 708 |','| Gerência/admin | 182 | 162 | 20 | 728 |'),('| Laboratório | 133 | 122 | 11 | 532 |','| Laboratório | 138 | 127 | 11 | 552 |'),('| Qualidade | 16 | 16 | 0 | 64 |','| Qualidade | 17 | 17 | 0 | 68 |')]:
    text=text.replace(before,after)
text=text.replace('As capturas das rodadas 1.4.24 e 1.4.25 mantêm sua versão de origem. Os destinos corrigidos foram reabertos, com resultado substituído pelo reteste.','Todas as capturas finais são da 1.4.25, com abertura nova em cada largura. Os índices de módulos foram reabertos após a seleção assíncrona, incluindo a unidade Noroeste. Os resultados intermediários permanecem nos arquivos de diagnóstico.')
p.write_text(text,encoding='utf-8')
used={(O/'capturas'/row['profile'].lower()/(row['screen']+'-'+str(m['width'])+'.png')).resolve() for row in rows for m in row['layout']}
assert all(p.is_file() and p.is_relative_to(O/'capturas') for p in used)
archive=O/'primeira-rodada/capturas-nao-finais';moved=[]
for source in (O/'capturas').rglob('*.png'):
    source=source.resolve()
    if source in used:continue
    target=(archive/source.relative_to(O/'capturas')).resolve()
    assert source.is_relative_to(O/'capturas') and target.is_relative_to(archive)
    assert not target.exists(),target
    target.parent.mkdir(parents=True,exist_ok=True);shutil.move(source,target);moved.append(str(source.relative_to(O)))
(O/'capturas-arquivadas.json').write_text(json.dumps(moved,indent=2),encoding='utf-8')
print(json.dumps({'final_cases':len(rows),'viewports':s['viewports'],'unique_capture_files':len(used),'obsolete_captures_archived':len(moved)}))
