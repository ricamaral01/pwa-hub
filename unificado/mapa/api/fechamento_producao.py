"""Conferência física do fechamento de produção de Campinas.

O mapa de posições reproduz a disposição exibida pela operação. A confirmação
é independente do apontamento e só vale para o ID de produção conferido.
"""

from __future__ import annotations

from datetime import date
import json
from pathlib import Path
import re

from flask import jsonify, request


LAYOUT = json.loads(Path(__file__).with_name('fechamento_formas.json').read_text(encoding='utf-8'))
SECTORS = tuple(LAYOUT)
CONFIRMER_ID = 'jcarlos'


def key(value):
    return re.sub(r'[^A-Z0-9]', '', str(value or '').upper())


def is_concreted(production):
    if not production:
        return False
    kind = str(production.get('tipo_concreto') or '').strip().lower()
    return production['status'] == 'CONCRETADO' or kind not in {'', 'padrão', 'padrao'}


def rows_by_key(cursor, table, day, sectors):
    fields = {
        'programacao_pcp': 'id, setor, forma, data_hora, modelo',
        'liberacao_formas': 'id, setor, forma, data_hora, colaborador',
        'producao': 'id, setor, forma, data_hora, status, tipo_concreto, modelo, colaborador',
    }
    query = f"""SELECT DISTINCT ON (setor, regexp_replace(upper(forma), '[^A-Z0-9]', '', 'g'))
                    {fields[table]}
                FROM public.{table}
                WHERE data_fabricacao=%s AND setor=ANY(%s)
                  AND forma IS NOT NULL
                ORDER BY setor, regexp_replace(upper(forma), '[^A-Z0-9]', '', 'g'),
                         data_hora DESC NULLS LAST, id DESC"""
    cursor.execute(query, (day, list(sectors)))
    return {(row['setor'], key(row['forma'])): row for row in cursor.fetchall()}


def register(app, authenticated_user, screen_access_state, writer_connect, pcp_connect):
    def access(write=False):
        user = authenticated_user()
        if not user:
            return None, (jsonify(ok=False, error='Sessão expirada.'), 401)
        allowed, _ = screen_access_state(user)
        if 'acmpConcretagem' not in allowed or user.get('perfil') == 'CONVIDADO':
            return None, (jsonify(ok=False, error='Sem acesso ao acompanhamento da concretagem.'), 403)
        if write and user.get('id') != CONFIRMER_ID:
            return None, (jsonify(ok=False, error='A confirmação cabe a José Carlos da Silva.'), 403)
        return user, None

    def valid_day(raw):
        try:
            return date.fromisoformat(str(raw))
        except (TypeError, ValueError):
            return None

    @app.get('/fechamento-producao')
    def fechamento_producao():
        user, denied = access()
        if denied:
            return denied
        day = valid_day(request.args.get('data'))
        sector = request.args.get('setor', 'Setor 1')
        if not day or sector not in (*SECTORS, 'Todos'):
            return jsonify(ok=False, error='Informe data e setor válidos.'), 400
        sectors = SECTORS if sector == 'Todos' else (sector,)
        with writer_connect() as conn, conn.cursor() as cursor:
            programmed = rows_by_key(cursor, 'programacao_pcp', day, sectors)
            released = rows_by_key(cursor, 'liberacao_formas', day, sectors)
            produced = rows_by_key(cursor, 'producao', day, sectors)
            cursor.execute("""SELECT setor, forma_chave, producao_id, confirmado_por, confirmado_em
                              FROM public.fechamento_producao_confirmacoes
                              WHERE data_fabricacao=%s AND setor=ANY(%s)""", (day, list(sectors)))
            confirmed = {(row['setor'], row['forma_chave'], str(row['producao_id'])): row
                         for row in cursor.fetchall()}
        with pcp_connect() as conn, conn.cursor() as cursor:
            cursor.execute("""SELECT p.setor_id, p.codigo_forma, p.quantidade_programada,
                                     produto.codigo AS produto_codigo
                              FROM public.programacoes p
                              LEFT JOIN public.produtos produto ON produto.id=p.produto_id
                              WHERE p.data=%s AND p.setor_id=ANY(%s)
                                AND p.quantidade_programada>0""",
                           (day, [int(s[-1]) for s in sectors]))
            pcp_rows = cursor.fetchall()
        pcp_programmed = {(f"Setor {row['setor_id']}", key(row['codigo_forma']))
                          for row in pcp_rows if row['codigo_forma']}
        for name in sectors:
            quantities = {}
            for row in pcp_rows:
                if row['setor_id'] != int(name[-1]) or row['codigo_forma']:
                    continue
                product = key(row['produto_codigo'])
                if product:
                    quantities[product] = quantities.get(product, 0) + row['quantidade_programada']
            lanes = [lane['formas'] for lane in LAYOUT[name]['colunas']]
            for position in range(max(map(len, lanes), default=0)):
                for lane in lanes:
                    if position >= len(lane):
                        continue
                    form = lane[position]
                    reference = (name, key(form['forma']))
                    product = key(form.get('codigo_produto'))
                    if product and quantities.get(product, 0) > 0 and reference not in pcp_programmed:
                        pcp_programmed.add(reference)
                        quantities[product] -= 1
        results = []
        summary = {'formas': 0, 'programadas': 0, 'liberadas': 0,
                   'concretadas': 0, 'confirmadas': 0, 'pendentes': 0}
        for name in sectors:
            known = set()
            lanes = LAYOUT[name]['colunas']
            for lane in lanes:
                for position, form in enumerate(lane['formas'], 1):
                    code = form['forma']
                    form_key = key(code)
                    known.add(form_key)
                    reference = (name, form_key)
                    production = produced.get(reference)
                    concreted = is_concreted(production)
                    confirmation = confirmed.get((name, form_key, str(production['id']))) if concreted else None
                    item = {'setor': name, 'forma': code, 'modelo': form.get('modelo'),
                            'lado': lane['lado'], 'posicao': position,
                            'programada': reference in programmed or reference in pcp_programmed,
                            'liberada': reference in released, 'concretada': concreted,
                            'confirmada': bool(confirmation),
                            'confirmado_por': confirmation['confirmado_por'] if confirmation else None,
                            'confirmado_em': confirmation['confirmado_em'].isoformat() if confirmation else None,
                            'producao_id': str(production['id']) if concreted else None,
                            'tipo_concreto': production.get('tipo_concreto') if concreted else None,
                            'fora_mapa': False}
                    results.append(item)
            for reference, production in produced.items():
                if reference[0] != name or reference[1] in known:
                    continue
                form_key = reference[1]
                concreted = is_concreted(production)
                confirmation = confirmed.get((name, form_key, str(production['id']))) if concreted else None
                results.append({'setor': name, 'forma': production['forma'], 'modelo': production.get('modelo'),
                                'lado': 'Fora do mapa', 'posicao': None,
                                'programada': reference in programmed or reference in pcp_programmed,
                                'liberada': reference in released, 'concretada': concreted,
                                'confirmada': bool(confirmation),
                                'confirmado_por': confirmation['confirmado_por'] if confirmation else None,
                                'confirmado_em': confirmation['confirmado_em'].isoformat() if confirmation else None,
                                'producao_id': str(production['id']) if concreted else None,
                                'tipo_concreto': production.get('tipo_concreto') if concreted else None,
                                'fora_mapa': True})
        for item in results:
            summary['formas'] += 1
            for field, source in [('programadas', 'programada'), ('liberadas', 'liberada'),
                                  ('concretadas', 'concretada'), ('confirmadas', 'confirmada')]:
                summary[field] += int(item[source])
        summary['pendentes'] = summary['concretadas'] - summary['confirmadas']
        response = jsonify(ok=True, data=day.isoformat(), setor=sector,
                           pode_confirmar=user['id'] == CONFIRMER_ID,
                           responsavel='José Carlos da Silva', resumo=summary, formas=results)
        response.headers['Cache-Control'] = 'no-store'
        return response

    @app.post('/fechamento-producao/confirmar')
    def confirmar_producao():
        user, denied = access(write=True)
        if denied:
            return denied
        if request.headers.get('Origin') != 'https://concrefer.concretrack.com.br':
            return jsonify(ok=False, error='Origem inválida.'), 403
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            return jsonify(ok=False, error='Dados inválidos.'), 400
        day = valid_day(body.get('data'))
        sector, code = body.get('setor'), body.get('forma')
        form_key = key(code)
        production_id = str(body.get('producao_id') or '')
        if not day or sector not in SECTORS or not form_key or len(form_key) > 80 or not re.fullmatch(r'[0-9a-fA-F-]{36}', production_id):
            return jsonify(ok=False, error='Data, setor, forma ou produção inválidos.'), 400
        with writer_connect() as conn, conn.cursor() as cursor:
            cursor.execute("""SELECT id FROM public.producao
                              WHERE id=%s::uuid AND data_fabricacao=%s AND setor=%s
                                AND regexp_replace(upper(forma), '[^A-Z0-9]', '', 'g')=%s
                                AND (status='CONCRETADO' OR lower(btrim(coalesce(tipo_concreto,''))) NOT IN ('', 'padrão', 'padrao'))
                              FOR SHARE""", (production_id, day, sector, form_key))
            if not cursor.fetchone():
                return jsonify(ok=False, error='Apontamento de concretagem não encontrado. Atualize a tela.'), 409
            cursor.execute("""SELECT id FROM public.producao
                              WHERE data_fabricacao=%s AND setor=%s
                                AND regexp_replace(upper(forma), '[^A-Z0-9]', '', 'g')=%s
                              ORDER BY data_hora DESC NULLS LAST, id DESC LIMIT 1""", (day, sector, form_key))
            latest = cursor.fetchone()
            if not latest or str(latest['id']) != production_id:
                return jsonify(ok=False, error='O apontamento mudou. Recarregue antes de confirmar.'), 409
            cursor.execute("""INSERT INTO public.fechamento_producao_confirmacoes
                              (data_fabricacao, setor, forma, forma_chave, producao_id, confirmado_por)
                              VALUES (%s,%s,%s,%s,%s::uuid,%s)
                              ON CONFLICT (data_fabricacao, setor, forma_chave, producao_id) DO NOTHING
                              RETURNING confirmado_em""",
                           (day, sector, str(code).strip(), form_key, production_id, user['id']))
            inserted = cursor.fetchone()
        return jsonify(ok=True, confirmada=True, ja_confirmada=inserted is None,
                       responsavel='José Carlos da Silva')
