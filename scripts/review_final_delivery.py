"""Publish an honest local handoff, never an approval or a remote deployment."""
import html,json,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
O=R/'docs/revisao-visual-unificado/homolog/revisao-final'
def read(name):return json.loads((O/name).read_text(encoding='utf-8'))
def write(name,value):(O/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
bugs=read('bugs-backend.json')
new=[
 {'id':'INFRA-CONN-001','status':'bloqueia matriz completa','cause':'O cluster PostgreSQL compartilhado apresentou 96 conexões para max_connections=100; serviços isolados falham ao abrir conexões comuns. A contagem sozinha não atribui a origem ao teste.','evidence':'journalctl dos serviços unificado-visual-homolog-mapa e pcp, 19/11/2026 11:25–11:38 UTC: psycopg.OperationalError: FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute.','proposal':'Investigar capacidade e ciclo de vida dos pools em etapa de infraestrutura autorizada. Não aumentar limites, encerrar sessões ou reiniciar serviços nesta rodada. Reexecutar matriz após estabilização.','action_taken':'Matriz interrompida; nenhum serviço ou banco alterado.'},
 {'id':'USINAS-AUTH-001','status':'bloqueia validação das subrotas de estoque','cause':'As subrotas nativas exigem conta antiga do ERP além da sessão central; retornam 401 e exibem Conta antiga.','evidence':'Capturas e respostas HTTP das subrotas usinas estoque na matriz GERENCIA/LABORATORIO.','proposal':'Validar o acesso com identidade de homologação já autorizada no ERP; qualquer mudança de integração ou permissão exige decisão separada.','permission_writes':0},
 {'id':'IG-CALENDAR-001','status':'lacuna de dados para o texto solicitado','cause':'As consultas atuais expõem dias com produção, sem calendário de dias úteis.','evidence':'As respostas de produção mensal, dashboard e maodeobra/resumo não expõem calendário útil nem feriados.','proposal':'Confirmar uma fonte já existente para dias úteis ou autorizar evolução separada. A candidata exibe dias com produção, sem inventar cálculo de calendário.','api_changes':0}
]
bugs=[b for b in bugs if b['id'] not in {x['id'] for x in new}]+new;write('bugs-backend.json',bugs)
write('login-comparison-context.json',{'candidate_version':'1.4.26','baseline_version':'1.4.25','displayed_version_in_both_captures':'1.4.25','reason':'O endpoint VERSION permanece publicado em 1.4.25. A comparação controla o texto variável da versão para verificar somente o layout congelado até 1024px. Os arquivos locais de HTML/CSS são da candidata.','results':read('login-comparison.json')})
changed=subprocess.check_output(['git','diff','--name-only','9e1de890'],cwd=R,text=True,encoding='utf-8',stderr=subprocess.DEVNULL).splitlines()
added=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=R,text=True,encoding='utf-8').splitlines()
sources=sorted({p for p in changed+added if p.startswith(('unificado/','tests/unificado/','scripts/review_final')) and not any('/'+part+'/' in '/'+p for part in ['node_modules','dist','dist-tasks'])})
(O/'arquivos-alterados.txt').write_text('\n'.join(sources)+'\n',encoding='utf-8')
s=read('resumo-matriz.json');inv=read('rotas-adicionadas.json')
notes={
 'shell-001':'Inspeção da folha: início e login legíveis; lab-monitor-ajuda apresenta superfícies coloridas aninhadas e ícone decorativo grande. Módulo não aprovado.',
 'suprimentos-001':'Inspeção da folha: fornecedores e solicitações mostram filtros extensos; botões verdes de estoque. Filtros e cores corrigidos após captura; repetir validação real.',
 'planejamento-001':'Inspeção da folha: filtros e resumos ocupam altura excessiva no celular em capturas anteriores aos últimos ajustes. Repetir capturas e revisão individual.',
 'producao-001':'Inspeção da folha: formulários físicos de formas preservados; montagem mostra filtros longos no celular e acentos de cor nos resumos. Sem aprovação global.',
 'usinas-001':'Inspeção da folha: tabelas legíveis; ações de consulta verdes foram corrigidas após captura. Repetir validação.'
}
reviews=read('revisao-visual.json');index=read('qa-index.json')
for review in reviews:
 for name,note in notes.items():
  sheet='folhas/qa/'+name+'.png'
  if review['key'] in index.get(sheet,[]):review.update(status='problema',reviewed_sheet=sheet,review_note=note)
write('revisao-visual.json',reviews)
write('inspecao-amostra.json',{'scope':'Somente a amostra efetivamente vista. Demais capturas pendentes; nenhuma aprovação inferida da matriz.','sheets':notes,'individual_images_viewed':['depois/login-1440.png','capturas/gerencia/indicadorGeralProducao-1440.png','capturas/gerencia/indicadorGeralProducao-390.png']})
write('validation-ready.json',{'version':'1.4.26','ready':False,'published':False,'gates':{'matrix_zero_failures':False,'all_roles_complete':False,'all_visual_reviews_approved':False,'narrow_login_pixel_identity':True,'live_sw_upgrade':False,'gate_7_of_7':True,'all_print_templates_sha256_verified':False},'reason':'Falhas reais de backend/autenticação, matriz e revisão visual incompletas. Pacote de candidata não autorizado pelo próprio critério de pronto.'})
samples=[
 ('3.1','Alinhamento do menu','Reserva de 16px, inclusive em itens sem ícone; mapa ampliado.','dashboard'),
 ('3.2','Meu acesso rápido','Item normal com estrela; faixa extra removida e navegação inferior Início.','setor1'),
 ('3.3','Botões','Primárias em navy; detecção automática por cor computada. Cobertura global ainda sem aprovação.','etiquetasArmaduras'),
 ('3.4','Texto','Acentos e m³ em textos de interface; originais preservados ao imprimir.','dashboard'),
 ('3.5','Cabeçalhos','Quebra de linha e largura mínima; auditoria de corte no DOM.','dashboard'),
 ('3.6','Superfícies','Resumos em faixas e remoção de caixas decorativas; amostras antigas ainda mostram desvios. Recaptura necessária.','tratativa'),
 ('3.7','Nomes e siglas','Exceções Cobli/Mega/SC/DT/CEC/PCP e demais nomes solicitados; teste funcional.','logisticaCobli'),
 ('3.8','Título único','Deduplicação considera a barra realmente visível; correção posterior às capturas de tablet.','suprimentosFornecedores'),
 ('3.9','Topo padrão','Etiquetas armaduras com .ph; mesmos campos, ações e região de impressão.','etiquetasArmaduras'),
 ('3.10','Filtros móveis','Details preserva nós e eventos; aplicado também a fornecedores e relatórios nativos após inspeção. Recaptura necessária.','suprimentosFornecedores')]
def capture(screen,before=False):
 base=O.parent/'revisao-completa' if before else O
 for name in [screen]:
  p=base/'capturas/gerencia'/f'{name}-390.png'
  if p.exists():return '../revisao-completa/'+p.relative_to(base).as_posix() if before else p.relative_to(O).as_posix()
 return None
parts=['<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Revisão final — candidata 1.4.26</title><style>body{max-width:1100px;margin:32px auto;padding:16px;font:15px/1.6 system-ui;color:#0b1730}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd3dd;padding:10px;text-align:left}a{color:#16416f}.blocked{background:#fff3cd;padding:16px}code{overflow-wrap:anywhere}</style><h1>Candidata 1.4.26 · não publicada</h1><p class="blocked">A entrega não satisfaz o critério de pronto. A homologação permanece em 1.4.25. Não há aprovação visual global, matriz zerada ou prova de atualização do service worker. Nenhum push ou PR foi feito.</p>',
 '<p>Branch <code>feat/padrao-visual-unificado</code>, base <code>9e1de890</code>. Trabalho somente local e leituras na 18446. APIs, regras, IAM, Nginx e serviços não foram alterados. Não houve escrita direta de dados de aplicação ou migração.</p>',
 '<p><a href="galeria.html">Galeria e folhas por módulo</a> · <a href="arquivos-alterados.txt">Arquivos alterados</a> · <a href="matriz.json">Matriz detalhada</a> · <a href="revisao-visual.json">Registro visual</a> · <a href="bugs-backend.json">Bugs e propostas</a></p>',
 '<h2>Cobertura efetiva</h2>',f'<p>Inventário: {inv["previous"]} → {inv["current"]} entradas; 236 ativas e três controles legados inativos, justificados. Foram acrescentadas 57 entradas. <a href="rotas-adicionadas.json">Lista completa e origem</a>. O Indicador geral faltava porque o inventário anterior usava o catálogo sem expandir o alias do menu ligado à permissão produtividade. A nova cobertura inclui as unidades de Produção, parâmetros de Usinas, abas internas, diálogos e variantes do Modelo A.</p>',
 f'<p>{s["cases"]} combinações tela × perfil; {s["viewports"]} larguras executadas; {s["failures"]} casos reprovados. As larguras previstas são 1440, 1024, 820 e 390. Casos anteriores aos últimos ajustes precisam ser repetidos. Nenhuma contagem representa aprovação visual.</p><table><tr><th>Perfil</th><th>Casos</th><th>Reprovados</th><th>Larguras</th><th>Faltantes</th></tr>']
for r in s['profiles']:parts.append('<tr>'+''.join(f'<td>{html.escape(str(r[k]))}</td>' for k in ['profile','cases','failed','widths','missing'])+'</tr>')
parts+=['</table><p>Para perfis ainda não executados, “1 faltante” é o marcador profile_not_run; não significa uma única tela pendente. O acesso esperado ainda precisa ser obtido sem alterar permissões.</p><h2>Seção 3 · resultado item por item</h2><p>Os links são evidências reais da rodada, não um atestado de aprovação. As correções posteriores exigem nova captura quando a infraestrutura permitir.</p><table><tr><th>Item</th><th>Tema</th><th>Resultado</th><th>Antes</th><th>Depois capturado</th></tr>']
for number,title,status,screen in samples:
 links=[f'<a href="{html.escape(p)}">390px</a>' if (p:=capture(screen,before)) else 'Sem par comparável' for before in [True,False]]
 parts.append(f'<tr><td>{number}</td><td>{title}</td><td>{status}</td><td>{links[0]}</td><td>{links[1]}</td></tr>')
parts+=['</table><h2>Login e Indicador geral</h2><p>Login desktop com logo oficial e cores da marca. Em 1024, 820 e 390: zero pixels alterados, com texto de versão controlado igualmente nos dois lados. <a href="login-comparison-context.json">Método e resultado</a>. <a href="antes/login-1440.png">Antes desktop</a> · <a href="depois/login-1440.png">Depois desktop</a>.</p><p>Indicador geral mantém consultas e cálculos existentes, com faixa, tabela/lista, divisores ausentes em travessão e eixo inteiro distinto. Os dados capturados mostram 11 postes, 0 homens-dia e dois dias incompletos em Campinas. Dias úteis continuam pendentes de fonte existente. <a href="capturas/gerencia/indicadorGeralProducao-1440.png">Desktop</a> · <a href="capturas/gerencia/indicadorGeralProducao-390.png">Celular</a>.</p>',
 '<h2>Validações e limites</h2><p>10 testes Node e testes reais de DOM passaram; nove tipos de regressão são detectados. Guard estático: 310 arquivos sem desvios e quatro testes do guard aprovados. Sintaxe: 118 blocos sem erro, além dos novos scripts de apresentação. Sete builds de fontes aprovados; Qualidade: 13 testes de interface e Laboratório: 27 testes registrados nos logs. Gate de fronteira 7/7. <a href="builds.json">Builds</a> · <a href="syntax-checks.json">Sintaxe</a> · <a href="dom-tests.json">DOM</a> · <a href="gate-result.txt">Gate</a>.</p>',
 '<p>Os dois PDFs de referência (armaduras e séries) mantêm SHA-256; isso não comprova todos os modelos de impressão. A preservação dos textos e filtros durante beforeprint/afterprint tem teste local. A atualização real 1.4.25 → 1.4.26 do service worker não foi executada porque não houve publicação. <a href="pdf-verification.json">Hashes dos PDFs</a>.</p>',
 '<p>A auditoria compara hashes de arquivos de aplicação, serviços e Nginx de produção e cinco conjuntos de IAM de homologação: sem alterações atribuídas à rodada. Há diferença em um índice operacional de fotos, com POST real de produção e armazenamento de homologação separado e inalterado. O relatório preserva essa ocorrência; não afirma igualdade de todos os bytes nem auditoria direta de bancos de produção. <a href="production-iam-audit.json">Auditoria completa</a>.</p><h2>Bloqueios e propostas</h2>']
for b in bugs:parts.append(f'<p><strong>{html.escape(b["id"])}</strong>: {html.escape(b["cause"])} {html.escape(b["proposal"])}</p>')
parts+=['<h2>Roteiro após retomada e publicação</h2><ol><li>Estabilizar infraestrutura e validar as identidades nativas sem alterar o escopo desta rodada.</li><li>Repetir todas as telas/perfis/larguras e revisar cada captura 1440/390, com recortes e registro individual. Corrigir qualquer desvio visual restante.</li><li>Completar hashes de impressões, auditoria e matriz zero; publicar apenas na 18446 com backup e validar atualização automática do service worker.</li><li>Conferir login desktop e mobile, Indicador geral, menus, fornecedores e Programação final em <a href="https://concrefer.concretrack.com.br:18446/unificado/">homologação</a>. Aguardar o teste definitivo do usuário; produção somente após aprovação explícita.</li></ol><p>O endereço acima ainda exibe 1.4.25. A candidata é consultável nesta galeria local.</p></html>']
(O/'RELATORIO.html').write_text('\n'.join(parts),encoding='utf-8')
gallery=O/'galeria.html';gallery.write_text(gallery.read_text(encoding='utf-8').replace('RELATORIO.md','RELATORIO.html'),encoding='utf-8')
print(json.dumps({'ready':False,'version':'1.4.26','cases':s['cases'],'failures':s['failures'],'files':len(sources)}))
