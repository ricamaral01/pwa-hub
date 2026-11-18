"""Personal shortcuts reuse the existing screen and action authorizers."""
from copy import deepcopy
import json

from flask import jsonify,request


SHORTCUTS=[
 {'id':'etiquetas-circular','label':'Etiquetas Circular','detail':'Setor 3','module':'planejamento','code':'EC','destinations':[{'screen':'etiquetasSc','label':'Imprimir etiquetas Circular','path':'pcp/etiquetas-sc/'}]},
 {'id':'etiquetas-setor4','label':'Etiquetas Setor 4','detail':'Setor 4','module':'planejamento','code':'E4','destinations':[{'screen':'etiquetasSetor4','label':'Imprimir etiquetas Setor 4','path':'pcp/etiquetas-setor4/'}]},
 {'id':'armaduras','label':'Armaduras','detail':'Programação e PDF','module':'planejamento','code':'AR','destinations':[{'screen':'armadurasProgramacao','label':'Programação de armaduras','path':'pcp/armaduras/'},{'screen':'armadurasRelatorio','label':'Relatório de armaduras','path':'pcp/armaduras-relatorio/'}]},
 {'id':'numeros-serie','label':'Números de série','detail':'Postes · Setor 3','module':'planejamento','code':'NS','destinations':[{'screen':'postesNumerosSerie','label':'Séries do dia e PDF','path':'pcp/numeros-serie/'}]},
 {'id':'programacao-semanal','label':'Programação semanal','detail':'Setores 1 e 2','module':'planejamento','code':'PS','destinations':[{'screen':'programacaoSemanal12','label':'Programação semanal','path':'pcp/programacao-semanal/'}]},
 {'id':'relatorios-producao','label':'Relatórios de produção','detail':'Por setor','module':'planejamento','code':'RP','destinations':[{'screen':'relatorio12','label':'Setores 1 e 2','path':'pcp/relatorio-producao/'},{'screen':'relatorio3','label':'Setor 3','path':'pcp/relatorio-programacao-s3/'},{'screen':'relatorio4','label':'Setor 4','path':'pcp/relatorio-programacao-s4/'}]},
 {'id':'acmp-concretagem','label':'Acmp. Concretagem','detail':'Acompanhamento · Campinas','module':'producao','code':'AC','destinations':[{'screen':'acmpConcretagem','label':'Acompanhamento de concretagem','path':'relatorios/acmp-concretagem/'}]},
 {'id':'manutencao-formas','label':'Manutenção de formas','detail':'Controle · Campinas','module':'producao','code':'MF','destinations':[{'screen':'manutencao','label':'Manutenção de formas','path':'mapa/operacao/?tela=RELATORIO_MANUTENCAO'}]},
]
BY_ID={row['id']:row for row in SHORTCUTS}


def effective(items,allowed):
    allowed=set(allowed);result=[]
    for key in items:
        if key not in BY_ID:continue
        row=deepcopy(BY_ID[key]);row['destinations']=[dest for dest in row['destinations'] if dest['screen'] in allowed]
        if row['destinations']:result.append(row)
    return result


def register(app,connect,authenticated_user,screen_access_state,unified_user_admin,master_ids):
    def response(value,status=200):
        result=jsonify(value);result.status_code=status;result.headers['Cache-Control']='no-store';return result

    def config(cur,user_id):
        cur.execute('SELECT enabled,home,items,revision FROM unificado_auth.user_quick_access WHERE user_id=%s',(user_id,))
        row=cur.fetchone()
        return dict(row) if row else {'enabled':False,'home':False,'items':list(BY_ID),'revision':0}

    @app.get('/unified/quick-access/me')
    def my_quick_access():
        actor=authenticated_user()
        if not actor:return response({'error':'Entre novamente.'},401)
        with connect() as conn,conn.cursor() as cur:stored=config(cur,actor['id'])
        if not stored['enabled']:return response({'enabled':False,'home':False,'items':[]})
        allowed,_=screen_access_state(actor)
        return response({'enabled':True,'home':stored['home'],'revision':stored['revision'],
                         'user':{'id':actor['id'],'name':actor['nome']},'items':effective(stored['items'],allowed)})

    @app.route('/unified/users/<user_id>/quick-access',methods=['GET','PUT'])
    def user_quick_access(user_id):
        actor=unified_user_admin()
        if not actor:return response({'error':'Acesso restrito à administração de usuários.'},403)
        if user_id in master_ids and actor['id'] not in master_ids:return response({'error':'Somente Master pode configurar esta conta.'},403)
        if request.method=='PUT' and request.headers.get('Origin')!='https://concrefer.concretrack.com.br':
            return response({'error':'Origem inválida.'},403)
        with connect() as conn,conn.cursor() as cur:
            cur.execute('SELECT id,nome,perfil,ativo FROM public.usuarios WHERE id=%s AND deleted_at IS NULL',(user_id,))
            target=cur.fetchone()
        if not target:return response({'error':'Conta não encontrada.'},404)
        allowed,_=screen_access_state(target)
        catalog=effective(list(BY_ID),allowed);available={row['id'] for row in catalog}
        if request.method=='GET':
            with connect() as conn,conn.cursor() as cur:stored=config(cur,user_id)
            return response({'user':{'id':target['id'],'name':target['nome']},'config':stored,
                             'catalog':[{**row,'available':row['id'] in available} for row in SHORTCUTS]})
        body=request.get_json(silent=True)
        if not isinstance(body,dict):return response({'error':'Informe a configuração.'},422)
        items=body.get('items');revision=body.get('revision')
        if (not isinstance(items,list) or len(items)>len(BY_ID) or any(not isinstance(item,str) or item not in BY_ID for item in items)
                or len(set(items))!=len(items) or type(body.get('enabled')) is not bool or type(body.get('home')) is not bool
                or type(revision) is not int or revision<0):
            return response({'error':'Configuração de atalhos inválida.'},422)
        # Removing an old inaccessible item is possible; enabling it never grants a screen.
        if body['enabled'] and (not items or any(item not in available for item in items)):
            return response({'error':'Escolha atalhos permitidos para a conta. Ajuste as permissões na edição de usuários.'},422)
        with connect() as conn,conn.cursor() as cur:
            cur.execute('SELECT pg_advisory_xact_lock(hashtext(%s))',('user-quick-access:'+user_id,))
            before=config(cur,user_id)
            if revision!=before['revision']:return response({'error':'A configuração mudou. Reabra e confira antes de salvar.'},409)
            after={'enabled':body['enabled'],'home':body['home'],'items':items,'revision':revision+1}
            cur.execute('''INSERT INTO unificado_auth.user_quick_access(user_id,enabled,home,items,revision,updated_by)
              VALUES(%s,%s,%s,%s::jsonb,%s,%s) ON CONFLICT(user_id) DO UPDATE SET
              enabled=excluded.enabled,home=excluded.home,items=excluded.items,revision=excluded.revision,
              updated_by=excluded.updated_by,updated_at=now()''',
              (user_id,after['enabled'],after['home'],json.dumps(items),after['revision'],actor['id']))
            cur.execute('''INSERT INTO unificado_auth.user_quick_access_audit(user_id,actor,before_state,after_state)
              VALUES(%s,%s,%s::jsonb,%s::jsonb)''',(user_id,actor['id'],json.dumps(before),json.dumps(after)))
        return response({'ok':True,'config':after})
