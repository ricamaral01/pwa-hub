"""Almoxarifado geral S2. Movimentos são apêndices; saldos são projeções transacionais."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response
from sqlalchemy import and_, func, insert, select, text, update
from sqlalchemy.orm import Session

from ..auth import Actor, check_action, context, current_actor
from ..db import session, table
from ..ids import uuid7
from ..workflow import allocate_number,record_event

router = APIRouter(prefix="/api/suprimentos/estoque", tags=["Almoxarifado S2"])
UTC = timezone.utc
ZERO = Decimal("0")
CENT = Decimal("0.01")


def number(raw, label="Quantidade", positive=False):
    try:
        value = Decimal(str(raw).replace(",", "."))
        if not value.is_finite() or (value <= 0 if positive else value < 0) or value.as_tuple().exponent < -4:
            raise InvalidOperation()
        return value
    except (TypeError, InvalidOperation):
        raise HTTPException(422, f"{label} inválido") from None


def uid(raw, label="Registro"):
    try:
        return UUID(str(raw))
    except (ValueError, TypeError):
        raise HTTPException(422, f"{label} inválido") from None


def gate(db, user, unidade, action, cc_id=None):
    ctx = context(unidade, user, db)
    check_action(ctx, action, cc_id, write=True, phase="S2", db=db)
    return ctx


def stock_row(db, ctx, material_id, address_id):
    t = table("sup_saldo")
    db.execute(text("INSERT INTO suprimentos.sup_saldo(unidade_id,material_id,endereco_id) VALUES (:u,:m,:e) ON CONFLICT DO NOTHING"),
               {"u":ctx.unit_id,"m":material_id,"e":address_id})
    return db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.material_id==material_id,t.c.endereco_id==address_id)).with_for_update()).mappings().one()


def cost_row(db, ctx, material_id):
    db.execute(text("INSERT INTO suprimentos.sup_custo_medio(unidade_id,material_id) VALUES (:u,:m) ON CONFLICT DO NOTHING"),
               {"u":ctx.unit_id,"m":material_id})
    t=table("sup_custo_medio")
    return db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,t.c.material_id==material_id)).with_for_update()).mappings().one()


def material_address(db, ctx, material_id, address_id):
    m,mu,e=table("sup_material"),table("sup_material_unidade"),table("sup_endereco")
    material=db.execute(select(m).join(mu,mu.c.material_id==m.c.id).where(and_(
        m.c.id==material_id,mu.c.unidade_id==ctx.unit_id,m.c.ativo.is_(True),
        mu.c.ativo.is_(True),m.c.dominio=="almoxarifado"))).mappings().one_or_none()
    address=db.execute(select(e.c.id).where(and_(e.c.id==address_id,e.c.unidade_id==ctx.unit_id,
        e.c.ativo.is_(True)))).scalar_one_or_none()
    if not material or address is None:
        raise HTTPException(422,"Material ou endereço indisponível nesta unidade")
    return material


def movement(db, ctx, *, material_id, address_id, quantity, kind, key, reference_type,
             reference_id=None, unit_cost=None, when=None, reverses=None):
    """Aplica um delta uma vez. Trava o custo por material antes de qualquer saldo."""
    when=when or datetime.now(UTC)
    if when > datetime.now(UTC)+timedelta(seconds=30):
        raise HTTPException(422,"Movimento com data futura não entra no saldo")
    material_address(db,ctx,material_id,address_id)
    if not key or len(key)>120:
        raise HTTPException(422,"Chave de idempotência obrigatória")
    cost=cost_row(db,ctx,material_id)
    ledger=table("sup_movimento")
    existing=db.execute(select(ledger).where(and_(ledger.c.unidade_id==ctx.unit_id,
        ledger.c.chave_idempotencia==key))).mappings().one_or_none()
    if existing:
        if (existing['material_id']!=material_id or existing['endereco_id']!=address_id
                or existing['quantidade']!=quantity or existing['tipo']!=kind):
            raise HTTPException(409,"Chave de idempotência reutilizada com outro movimento")
        return dict(existing)
    balance=stock_row(db,ctx,material_id,address_id)
    new_quantity=balance['quantidade']+quantity
    if new_quantity < balance['reservado']:
        raise HTTPException(409,"Saldo insuficiente ou reservado")
    before=cost['quantidade']
    after=before+quantity
    if after < 0:
        raise HTTPException(409,"Saldo total insuficiente")
    if quantity>0:
        try:
            price=Decimal(str(unit_cost if unit_cost is not None else cost['custo_medio']).replace(',','.'))
            if not price.is_finite() or price<0 or price.as_tuple().exponent < -6:raise InvalidOperation()
        except (TypeError,InvalidOperation):
            raise HTTPException(422,'Custo inválido') from None
        total=(cost['custo_total']+quantity*price).quantize(CENT,rounding=ROUND_HALF_UP)
    else:
        price=Decimal(unit_cost) if kind=='ESTORNO' and unit_cost is not None else cost['custo_medio']
        total=(cost['custo_total']+quantity*price).quantize(CENT,rounding=ROUND_HALF_UP)
        if total<0:
            raise HTTPException(409,'Custo insuficiente para estornar após movimentos posteriores')
    average=(total/after).quantize(Decimal('0.000001')) if after else ZERO
    db.execute(update(table('sup_saldo')).where(and_(table('sup_saldo').c.unidade_id==ctx.unit_id,
        table('sup_saldo').c.material_id==material_id,table('sup_saldo').c.endereco_id==address_id))
        .values(quantidade=new_quantity,atualizado_em=datetime.now(UTC)))
    db.execute(update(table('sup_custo_medio')).where(and_(table('sup_custo_medio').c.unidade_id==ctx.unit_id,
        table('sup_custo_medio').c.material_id==material_id)).values(
        quantidade=after,custo_total=total,custo_medio=average,atualizado_em=datetime.now(UTC)))
    row=db.execute(insert(ledger).values(unidade_id=ctx.unit_id,material_id=material_id,
        endereco_id=address_id,tipo=kind,quantidade=quantity,custo_unitario=price,
        custo_total=(abs(quantity)*price).quantize(CENT,rounding=ROUND_HALF_UP),
        referencia_tipo=reference_type,referencia_id=reference_id,chave_idempotencia=key,
        estorna_movimento_id=reverses,
        efetivado_em=when,criado_por=ctx.actor.id).returning(ledger)).mappings().one()
    record_event(db,ctx,reference_id or material_id,None,kind,
                 f"Movimento {row['id']}: {quantity}",target_type='estoque')
    return dict(row)


def reserve_approved(db, ctx, request):
    """Chamado na mesma transação da aprovação final; a última unidade só é reservada uma vez."""
    flag=table('sup_flag')
    enabled=db.execute(select(flag.c.habilitado).where(and_(flag.c.unidade_id==ctx.unit_id,
        flag.c.fase=='S2'))).scalar_one_or_none()
    if not enabled:return
    items=table('sup_solicitacao_item'); balances=table('sup_saldo'); reservations=table('sup_reserva_estoque')
    rows=db.execute(select(items).where(and_(items.c.unidade_id==ctx.unit_id,
        items.c.solicitacao_id==request['id'])).order_by(items.c.id).with_for_update()).mappings().all()
    for item in rows:
        need=item['qtd']-item['qtd_entregue']
        if not item['material_id'] or need<=0:
            db.execute(update(items).where(items.c.id==item['id']).values(destino='COMPRA',qtd_comprar=max(ZERO,need)))
            continue
        addresses=db.execute(select(balances).where(and_(balances.c.unidade_id==ctx.unit_id,
            balances.c.material_id==item['material_id'],balances.c.quantidade>balances.c.reservado))
            .order_by(balances.c.endereco_id).with_for_update()).mappings().all()
        reserved=ZERO
        for balance in addresses:
            take=min(need-reserved,balance['quantidade']-balance['reservado'])
            if take<=0:continue
            db.execute(update(balances).where(and_(balances.c.unidade_id==ctx.unit_id,
                balances.c.material_id==item['material_id'],balances.c.endereco_id==balance['endereco_id']))
                .values(reservado=balance['reservado']+take,atualizado_em=datetime.now(UTC)))
            db.execute(insert(reservations).values(id=uuid7(),unidade_id=ctx.unit_id,
                solicitacao_item_id=item['id'],material_id=item['material_id'],
                endereco_id=balance['endereco_id'],quantidade=take,
                criado_por=ctx.actor.id,atualizado_por=ctx.actor.id))
            reserved+=take
            if reserved==need:break
        missing=need-reserved
        db.execute(update(items).where(items.c.id==item['id']).values(
            destino='COMPRA' if missing else 'ALMOXARIFADO',qtd_comprar=missing,
            atualizado_por=ctx.actor.id,atualizado_em=datetime.now(UTC)))
        record_event(db,ctx,item['id'],None,'RESERVADO' if reserved else 'COMPRA',
            f"Reservado {reserved}; compra {missing}",target_type='item')


def deliver_reserved(db,ctx,item,quantity):
    flag=table('sup_flag')
    enabled=db.execute(select(flag.c.habilitado).where(and_(flag.c.unidade_id==ctx.unit_id,
        flag.c.fase=='S2'))).scalar_one_or_none()
    if not enabled or not item['material_id']:return []
    reservation=table('sup_reserva_estoque');balance=table('sup_saldo')
    rows=db.execute(select(reservation).where(and_(reservation.c.unidade_id==ctx.unit_id,
        reservation.c.solicitacao_item_id==item['id'],reservation.c.status=='ATIVA'))
        .order_by(reservation.c.endereco_id).with_for_update()).mappings().all()
    remaining=quantity;out=[]
    for row in rows:
        take=min(remaining,row['quantidade']-row['entregue'])
        if take<=0:continue
        cost_row(db,ctx,row['material_id'])
        current=stock_row(db,ctx,row['material_id'],row['endereco_id'])
        db.execute(update(balance).where(and_(balance.c.unidade_id==ctx.unit_id,
            balance.c.material_id==row['material_id'],balance.c.endereco_id==row['endereco_id']))
            .values(reservado=current['reservado']-take))
        move=movement(db,ctx,material_id=row['material_id'],address_id=row['endereco_id'],
            quantity=-take,kind='ENTREGA',key=f'entrega:{item["id"]}:{row["id"]}:{row["entregue"]}',
            reference_type='SOLICITACAO',reference_id=item['id'])
        delivered=row['entregue']+take
        db.execute(update(reservation).where(reservation.c.id==row['id']).values(entregue=delivered,
            status='CONCLUIDA' if delivered==row['quantidade'] else 'ATIVA',
            atualizado_por=ctx.actor.id,atualizado_em=datetime.now(UTC)))
        out.append(move['id']);remaining-=take
        if remaining<=0:break
    # O restante pode ser entrega direta de compra; F3 registrará entrada e saída vinculadas.
    return out


def release_reservations(db,ctx,item_ids):
    flag=table('sup_flag')
    if not db.execute(select(flag.c.habilitado).where(and_(flag.c.unidade_id==ctx.unit_id,
        flag.c.fase=='S2'))).scalar_one_or_none():return
    reservation=table('sup_reserva_estoque');balance=table('sup_saldo')
    rows=db.execute(select(reservation).where(and_(reservation.c.unidade_id==ctx.unit_id,
        reservation.c.solicitacao_item_id.in_(item_ids),reservation.c.status=='ATIVA'))
        .order_by(reservation.c.material_id,reservation.c.endereco_id).with_for_update()).mappings().all()
    for row in rows:
        remaining=row['quantidade']-row['entregue']
        current=stock_row(db,ctx,row['material_id'],row['endereco_id'])
        db.execute(update(balance).where(and_(balance.c.unidade_id==ctx.unit_id,
            balance.c.material_id==row['material_id'],balance.c.endereco_id==row['endereco_id']))
            .values(reservado=current['reservado']-remaining))
        db.execute(update(reservation).where(reservation.c.id==row['id']).values(status='CANCELADA',
            atualizado_por=ctx.actor.id,atualizado_em=datetime.now(UTC)))
        record_event(db,ctx,row['solicitacao_item_id'],'RESERVADO','RESERVA_CANCELADA',
            f'Liberado {remaining}',target_type='item')


@router.get('/saldos')
def balances(unidade:str='campinas',categoria:str|None=None,abaixo_pp:bool=False,
             page:int=Query(1,ge=1),size:int=Query(50,ge=1,le=100),
             user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.ver')
    sql="""SELECT m.id material_id,m.codigo,m.descricao,m.categoria,mu.ponto_pedido,
      COALESCE(sum(s.quantidade),0) saldo,COALESCE(sum(s.reservado),0) reservado,
      COALESCE(sum(s.quantidade-s.reservado),0) disponivel,
      COALESCE(c.custo_medio,0) custo_medio,COALESCE(c.custo_total,0) valor_estoque
      FROM suprimentos.sup_material_unidade mu JOIN suprimentos.sup_material m ON m.id=mu.material_id
      LEFT JOIN suprimentos.sup_saldo s ON s.unidade_id=mu.unidade_id AND s.material_id=m.id
      LEFT JOIN suprimentos.sup_custo_medio c ON c.unidade_id=mu.unidade_id AND c.material_id=m.id
      WHERE mu.unidade_id=:unit AND mu.ativo AND m.ativo AND m.dominio='almoxarifado'
      AND (CAST(:categoria AS text) IS NULL OR m.categoria=:categoria)
      GROUP BY m.id,mu.ponto_pedido,c.custo_medio,c.custo_total
      HAVING (NOT :abaixo OR COALESCE(sum(s.quantidade-s.reservado),0)<mu.ponto_pedido)
      ORDER BY m.descricao LIMIT :limit OFFSET :offset"""
    rows=db.execute(text(sql),{'unit':ctx.unit_id,'categoria':categoria,'abaixo':abaixo_pp,
        'limit':size,'offset':(page-1)*size}).mappings().all()
    return jsonable_encoder({'items':[dict(r) for r in rows],'page':page,'size':size})


@router.get('/movimentos')
def movements(unidade:str='campinas',material_id:str|None=None,page:int=Query(1,ge=1),
              size:int=Query(50,ge=1,le=100),user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.ver'); t=table('sup_movimento')
    where=[t.c.unidade_id==ctx.unit_id]
    if material_id:where.append(t.c.material_id==uid(material_id,'Material'))
    rows=db.execute(select(t).where(and_(*where)).order_by(t.c.id.desc())
        .limit(size).offset((page-1)*size)).mappings().all()
    return jsonable_encoder({'items':[dict(r) for r in rows],'page':page})


@router.get('/consumo')
def consumption(unidade:str='campinas',dias:int=Query(30,ge=1,le=366),
                user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.ver')
    rows=db.execute(text("""SELECT COALESCE(cc.codigo,'SEM_CC') centro_codigo,
      COALESCE(cc.nome,'Sem centro de custo') centro_nome,COALESCE(cc.setor,'Sem setor') setor,
      mov.material_id,mat.descricao material,coalesce(sum(-mov.quantidade),0) quantidade,
      coalesce(sum(-mov.quantidade*mov.custo_unitario),0) valor
      FROM suprimentos.sup_movimento mov
      JOIN suprimentos.sup_material mat ON mat.id=mov.material_id
      LEFT JOIN suprimentos.sup_solicitacao_item si ON mov.referencia_tipo='SOLICITACAO' AND si.id=mov.referencia_id
      LEFT JOIN suprimentos.sup_solicitacao req ON req.id=si.solicitacao_id
      LEFT JOIN suprimentos.sup_centro_custo cc ON cc.id=req.cc_id AND cc.unidade_id=mov.unidade_id
      WHERE mov.unidade_id=:unit AND mov.tipo='ENTREGA' AND mov.quantidade<0
        AND mov.efetivado_em>=now()-(:days * interval '1 day')
      GROUP BY cc.codigo,cc.nome,cc.setor,mov.material_id,mat.descricao
      ORDER BY valor DESC LIMIT 100"""),{'unit':ctx.unit_id,'days':dias}).mappings().all()
    return jsonable_encoder({'periodo_dias':dias,'items':[dict(r) for r in rows]})


@router.post('/movimentos')
def post_movement(data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.movimentar')
    kind=data.get('tipo')
    if kind not in {'ENTRADA','ENTREGA','AJUSTE'}:raise HTTPException(422,'Tipo de movimento inválido')
    if kind!='ENTRADA' and len((data.get('motivo') or '').strip())<8:
        raise HTTPException(422,'Motivo obrigatório para saída ou ajuste')
    quantity=number(data.get('quantidade'),'Quantidade',positive=True)
    if kind=='ENTREGA':quantity=-quantity
    if kind=='AJUSTE' and data.get('sentido')=='SAIDA':quantity=-quantity
    row=movement(db,ctx,material_id=uid(data.get('material_id'),'Material'),
        address_id=uid(data.get('endereco_id'),'Endereço'),quantity=quantity,kind=kind,
        key=data.get('chave_idempotencia'),reference_type='MANUAL',
        unit_cost=data.get('custo_unitario') if kind=='ENTRADA' else None)
    db.commit();return jsonable_encoder(row)


@router.post('/movimentos/{movement_id}/estornar')
def reverse(movement_id:int,data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.movimentar')
    if len((data.get('motivo') or '').strip())<8:raise HTTPException(422,'Motivo do estorno obrigatório')
    t=table('sup_movimento')
    original=db.execute(select(t).where(and_(t.c.id==movement_id,t.c.unidade_id==ctx.unit_id))).mappings().one_or_none()
    if not original:raise HTTPException(404,'Movimento não encontrado')
    previous=db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,
        t.c.estorna_movimento_id==movement_id))).mappings().one_or_none()
    if previous:return jsonable_encoder(dict(previous))
    row=movement(db,ctx,material_id=original['material_id'],address_id=original['endereco_id'],
        quantity=-original['quantidade'],kind='ESTORNO',key=f'estorno:{movement_id}',
        reference_type='ESTORNO',reference_id=original['referencia_id'],
        unit_cost=original['custo_unitario'],reverses=movement_id)
    db.commit();return jsonable_encoder(row)


@router.post('/transferir')
def transfer(data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.movimentar')
    mid=uid(data.get('material_id'),'Material');origin=uid(data.get('origem_id'),'Origem')
    destination=uid(data.get('destino_id'),'Destino')
    if origin==destination:raise HTTPException(422,'Endereços devem ser diferentes')
    quantity=number(data.get('quantidade'),'Quantidade',positive=True)
    key=str(data.get('chave_idempotencia') or '')
    # Bloqueia o custo antes dos endereços; cada lançamento mantém a trilha própria.
    cost=cost_row(db,ctx,mid)['custo_medio']
    out=movement(db,ctx,material_id=mid,address_id=origin,quantity=-quantity,
        kind='TRANSFERENCIA',key=key+':saida',reference_type='TRANSFERENCIA')
    incoming=movement(db,ctx,material_id=mid,address_id=destination,quantity=quantity,
        kind='TRANSFERENCIA',key=key+':entrada',reference_type='TRANSFERENCIA',unit_cost=cost)
    db.commit();return jsonable_encoder({'saida':out,'entrada':incoming})


@router.get('/reservas')
def reservations(unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.ver');t=table('sup_reserva_estoque')
    rows=db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,t.c.status=='ATIVA'))
        .order_by(t.c.criado_em.desc()).limit(100)).mappings().all()
    return jsonable_encoder({'items':[dict(r) for r in rows]})


@router.post('/colaboradores')
def add_employee(data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.epi')
    name=(data.get('nome') or '').strip();code=(data.get('matricula') or '').strip()
    if not name or not code:raise HTTPException(422,'Nome e matrícula obrigatórios')
    t=table('sup_colaborador');identifier=uuid7()
    db.execute(insert(t).values(id=identifier,unidade_id=ctx.unit_id,nome=name,matricula=code,
        setor=(data.get('setor') or '').strip(),criado_por=user.id,atualizado_por=user.id))
    record_event(db,ctx,identifier,None,'COLABORADOR_CADASTRADO',target_type='colaborador')
    db.commit();return {'id':str(identifier)}


@router.get('/colaboradores')
def employees(unidade:str='campinas',q:str='',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.epi');t=table('sup_colaborador')
    rows=db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,t.c.ativo.is_(True),
        t.c.nome.ilike('%'+q[:60]+'%'))).order_by(t.c.nome).limit(100)).mappings().all()
    return jsonable_encoder({'items':[dict(r) for r in rows]})


@router.post('/epi/entregar')
def issue_epi(data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.epi')
    employee=uid(data.get('colaborador_id'),'Colaborador');mid=uid(data.get('material_id'),'Material')
    address=uid(data.get('endereco_id'),'Endereço');quantity=number(data.get('quantidade'),positive=True)
    c=table('sup_colaborador');ca=table('sup_epi_ca');mat=table('sup_material')
    if db.execute(select(c.c.id).where(and_(c.c.id==employee,c.c.unidade_id==ctx.unit_id,c.c.ativo.is_(True)))).scalar_one_or_none() is None:
        raise HTTPException(404,'Colaborador não encontrado')
    material=db.execute(select(mat).where(mat.c.id==mid)).mappings().one_or_none()
    if not material or material['categoria']!='EPI':raise HTTPException(422,'Material não é EPI')
    ca_number=str(data.get('numero_ca') or '')
    valid=db.execute(select(ca.c.id).where(and_(ca.c.material_id==mid,ca.c.numero_ca==ca_number,
        ca.c.ativo.is_(True),ca.c.validade>=date.today()))).scalar_one_or_none()
    if valid is None:raise HTTPException(409,'CA inexistente ou vencido; entrega bloqueada')
    row=movement(db,ctx,material_id=mid,address_id=address,quantity=-quantity,
        kind='ENTREGA',key=str(data.get('chave_idempotencia') or ''),reference_type='EPI',reference_id=employee)
    t=table('sup_ficha_epi');existing=db.execute(select(t.c.id).where(t.c.movimento_id==row['id'])).scalar_one_or_none()
    if existing:db.commit();return {'id':str(existing),'movimento_id':row['id']}
    identifier=uuid7()
    db.execute(insert(t).values(id=identifier,unidade_id=ctx.unit_id,colaborador_id=employee,
        material_id=mid,numero_ca=ca_number,quantidade=quantity,movimento_id=row['id'],
        criado_por=user.id,atualizado_por=user.id))
    db.commit();return {'id':str(identifier),'movimento_id':row['id']}


@router.post('/epi/{record_id}/confirmar')
def confirm_epi(record_id:str,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.epi');t=table('sup_ficha_epi')
    result=db.execute(update(t).where(and_(t.c.id==uid(record_id),t.c.unidade_id==ctx.unit_id,
        t.c.confirmado_em.is_(None))).values(confirmado_por=user.id,
        confirmado_em=datetime.now(UTC),atualizado_por=user.id,atualizado_em=datetime.now(UTC))).rowcount
    if not result:raise HTTPException(409,'Ficha não encontrada ou já confirmada')
    db.commit();return {'status':'CONFIRMADA'}


@router.get('/epi/fichas')
def epi_records(unidade:str='campinas',colaborador_id:str|None=None,user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.epi');t=table('sup_ficha_epi')
    where=[t.c.unidade_id==ctx.unit_id]
    if colaborador_id:where.append(t.c.colaborador_id==uid(colaborador_id))
    rows=db.execute(select(t).where(and_(*where)).order_by(t.c.criado_em.desc()).limit(100)).mappings().all()
    return jsonable_encoder({'items':[dict(r) for r in rows]})


@router.post('/inventarios')
def open_inventory(data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar')
    address=uid(data.get('endereco_id'),'Endereço');kind=data.get('tipo','CICLICO')
    if kind not in {'ABERTURA','CICLICO'}:raise HTTPException(422,'Tipo de inventário inválido')
    e=table('sup_endereco')
    if db.execute(select(e.c.id).where(and_(e.c.id==address,e.c.unidade_id==ctx.unit_id))).scalar_one_or_none() is None:
        raise HTTPException(404,'Endereço não encontrado')
    t=table('sup_inventario');identifier=uuid7()
    db.execute(insert(t).values(id=identifier,unidade_id=ctx.unit_id,tipo=kind,
        endereco_id=address,corte_em=datetime.now(UTC),contador_id=user.id,
        criado_por=user.id,atualizado_por=user.id))
    record_event(db,ctx,identifier,None,'INVENTARIO_ABERTO',target_type='inventario')
    db.commit();return {'id':str(identifier),'status':'ABERTO'}


@router.get('/inventarios')
def inventories(unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar');t=table('sup_inventario')
    rows=db.execute(select(t).where(t.c.unidade_id==ctx.unit_id)
        .order_by(t.c.criado_em.desc()).limit(100)).mappings().all()
    return jsonable_encoder({'items':[dict(r) for r in rows]})


@router.get('/inventarios/{inventory_id}/ficha')
def count_sheet(inventory_id:str,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar');t=table('sup_inventario')
    inv=db.execute(select(t).where(and_(t.c.id==uid(inventory_id),t.c.unidade_id==ctx.unit_id))).mappings().one_or_none()
    if not inv:raise HTTPException(404,'Inventário não encontrado')
    # Ficha cega: nenhum campo de saldo é enviado ao contador.
    rows=db.execute(text("""SELECT m.id,m.codigo,m.descricao,m.categoria FROM suprimentos.sup_material m
      JOIN suprimentos.sup_material_unidade mu ON mu.material_id=m.id AND mu.unidade_id=:u
      WHERE m.ativo AND mu.ativo AND m.dominio='almoxarifado' ORDER BY m.descricao"""),
      {'u':ctx.unit_id}).mappings().all()
    return jsonable_encoder({'inventario':{'id':inv['id'],'tipo':inv['tipo'],
        'corte_em':inv['corte_em'],'status':inv['status']},
        'materiais':[dict(r) for r in rows]})


def inventory_row(db,ctx,inventory_id,lock=False):
    t=table('sup_inventario')
    q=select(t).where(and_(t.c.id==uid(inventory_id),t.c.unidade_id==ctx.unit_id))
    if lock:q=q.with_for_update()
    row=db.execute(q).mappings().one_or_none()
    if not row:raise HTTPException(404,'Inventário não encontrado')
    return dict(row)


@router.post('/inventarios/{inventory_id}/contagens')
def register_count(inventory_id:str,data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar');inv=inventory_row(db,ctx,inventory_id,True)
    if inv['status']!='ABERTO':raise HTTPException(409,'Inventário não está aberto')
    mid=uid(data.get('material_id'),'Material');count=number(data.get('quantidade'),'Contagem')
    material_address(db,ctx,mid,inv['endereco_id'])
    t=table('sup_contagem')
    if db.execute(select(t.c.id).where(and_(t.c.inventario_id==inv['id'],t.c.material_id==mid))).scalar_one_or_none():
        raise HTTPException(409,'Material já contado; abra uma nova versão de inventário')
    row_id=uuid7()
    db.execute(insert(t).values(id=row_id,unidade_id=ctx.unit_id,inventario_id=inv['id'],
        material_id=mid,contado=count,criado_por=user.id,atualizado_por=user.id))
    db.commit();return {'id':str(row_id),'status':'REGISTRADA'}


@router.get('/inventarios/{inventory_id}/contagens')
def list_counts(inventory_id:str,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar');inv=inventory_row(db,ctx,inventory_id)
    t=table('sup_contagem')
    rows=db.execute(select(t).where(t.c.inventario_id==inv['id']).order_by(t.c.criado_em)).mappings().all()
    blind=(inv['status']=='ABERTO' or inv['contador_id']==user.id)
    return jsonable_encoder({'inventario':{'id':inv['id'],'status':inv['status']},
        'items':[{'id':row['id'],'material_id':row['material_id'],'contado':row['contado'],
            'status':row['status'],**({} if blind else {'saldo_corte':row['saldo_corte'],
                'diferenca':row['diferenca']})} for row in rows]})


def cut_balance(db,ctx,inv,mid):
    t=table('sup_movimento')
    return db.execute(select(func.coalesce(func.sum(t.c.quantidade),0)).where(and_(
        t.c.unidade_id==ctx.unit_id,t.c.endereco_id==inv['endereco_id'],
        t.c.material_id==mid,t.c.efetivado_em<=inv['corte_em']))).scalar_one()


@router.post('/inventarios/{inventory_id}/concluir')
def close_inventory(inventory_id:str,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar');inv=inventory_row(db,ctx,inventory_id,True)
    if inv['status'] not in {'ABERTO','EM_APROVACAO'}:raise HTTPException(409,'Inventário já encerrado')
    t=table('sup_contagem');rows=db.execute(select(t).where(t.c.inventario_id==inv['id']).order_by(t.c.material_id).with_for_update()).mappings().all()
    if not rows:raise HTTPException(409,'Registre pelo menos uma contagem')
    p=table('sup_parametro')
    threshold=db.execute(select(p.c.valor).where(and_(p.c.unidade_id==ctx.unit_id,
        p.c.chave=='inventario_aprovacao_valor'))).scalar_one()
    tolerance=db.execute(select(p.c.valor).where(and_(p.c.unidade_id==ctx.unit_id,
        p.c.chave=='inventario_tolerancia_pct'))).scalar_one()
    pending=[];applied=[]
    for item in rows:
        if item['status']=='AJUSTADA':continue
        cut=cut_balance(db,ctx,inv,item['material_id']);difference=item['contado']-cut
        cost=cost_row(db,ctx,item['material_id'])['custo_medio']
        mat=table('sup_material')
        category=db.execute(select(mat.c.categoria).where(mat.c.id==item['material_id'])).scalar_one()
        beyond_tolerance=(abs(difference)*Decimal(100)/max(Decimal(1),cut))>tolerance
        needs_approval=difference!=0 and (category=='EPI' or (beyond_tolerance and abs(difference)*cost>threshold))
        if needs_approval and item['aprovado_em'] is None:
            db.execute(update(t).where(t.c.id==item['id']).values(saldo_corte=cut,diferenca=difference,
                status='PENDENTE_APROVACAO',atualizado_por=user.id,atualizado_em=datetime.now(UTC)))
            pending.append(str(item['id']));continue
        if difference:
            movement(db,ctx,material_id=item['material_id'],address_id=inv['endereco_id'],
                quantity=difference,kind='AJUSTE',key=f'inventario:{item["id"]}',
                reference_type='INVENTARIO',reference_id=inv['id'],unit_cost=cost)
        db.execute(update(t).where(t.c.id==item['id']).values(saldo_corte=cut,diferenca=difference,
            status='AJUSTADA',atualizado_por=user.id,atualizado_em=datetime.now(UTC)))
        applied.append(str(item['id']))
    new_status='EM_APROVACAO' if pending else 'CONCLUIDO'
    db.execute(update(table('sup_inventario')).where(table('sup_inventario').c.id==inv['id'])
        .values(status=new_status,atualizado_por=user.id,atualizado_em=datetime.now(UTC)))
    record_event(db,ctx,inv['id'],inv['status'],new_status,target_type='inventario')
    db.commit();return {'status':new_status,'pendentes':pending,'ajustadas':applied}


@router.post('/inventarios/{inventory_id}/contagens/{count_id}/aprovar')
def approve_count(inventory_id:str,count_id:str,data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.inventariar');inv=inventory_row(db,ctx,inventory_id,True)
    if inv['status']!='EM_APROVACAO':raise HTTPException(409,'Inventário sem ajuste pendente')
    if inv['contador_id']==user.id:raise HTTPException(403,'Contador não pode aprovar a própria divergência')
    t=table('sup_contagem');row=db.execute(select(t).where(and_(t.c.id==uid(count_id),
        t.c.inventario_id==inv['id'],t.c.status=='PENDENTE_APROVACAO')).with_for_update()).mappings().one_or_none()
    if not row:raise HTTPException(404,'Divergência não encontrada')
    if len((data.get('parecer') or '').strip())<8:raise HTTPException(422,'Parecer obrigatório')
    db.execute(update(t).where(t.c.id==row['id']).values(aprovado_por=user.id,
        aprovado_em=datetime.now(UTC),atualizado_por=user.id,atualizado_em=datetime.now(UTC)))
    record_event(db,ctx,inv['id'],'PENDENTE_APROVACAO','APROVADO',data['parecer'],target_type='inventario')
    db.commit();return {'status':'APROVADO'}


@router.post('/reposicao/calcular')
def replenish(unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.sugerir')
    sql="""SELECT mu.material_id,mu.lead_time_dias,mu.seguranca_dias,mu.lote_economico,
      COALESCE(sum(CASE WHEN mov.quantidade<0 AND mov.tipo='ENTREGA'
        AND mov.efetivado_em>=now()-interval '30 days' THEN -mov.quantidade ELSE 0 END),0) consumed,
      COALESCE((SELECT sum(s.quantidade-s.reservado) FROM suprimentos.sup_saldo s
        WHERE s.unidade_id=mu.unidade_id AND s.material_id=mu.material_id),0) available
      FROM suprimentos.sup_material_unidade mu
      JOIN suprimentos.sup_material m ON m.id=mu.material_id AND m.dominio='almoxarifado' AND m.ativo
      LEFT JOIN suprimentos.sup_movimento mov ON mov.unidade_id=mu.unidade_id AND mov.material_id=mu.material_id
      WHERE mu.unidade_id=:u AND mu.ativo GROUP BY mu.unidade_id,mu.material_id"""
    rows=db.execute(text(sql),{'u':ctx.unit_id}).mappings().all();t=table('sup_sugestao_ressuprimento')
    created=[]
    for r in rows:
        point=max(ZERO,(r['consumed']/Decimal(30))*(r['lead_time_dias']+r['seguranca_dias']))
        if point<=r['available']:continue
        quantity=max(point-r['available'],r['lote_economico'])
        if quantity<=0:continue
        existing=db.execute(select(t.c.id).where(and_(t.c.unidade_id==ctx.unit_id,
            t.c.material_id==r['material_id'],t.c.status=='SUGERIDA',
            t.c.origem=='almoxarifado'))).scalar_one_or_none()
        if existing:continue
        active=db.execute(select(t.c.id).join(table('sup_solicitacao'),
            table('sup_solicitacao').c.id==t.c.solicitacao_id).where(and_(
            t.c.unidade_id==ctx.unit_id,t.c.material_id==r['material_id'],
            t.c.origem=='almoxarifado',t.c.status=='CONFIRMADA',
            table('sup_solicitacao').c.status.in_(('RASCUNHO','EM_APROVACAO','APROVADA','EM_ATENDIMENTO'))))).scalar_one_or_none()
        if active:continue
        identifier=uuid7()
        db.execute(insert(t).values(id=identifier,unidade_id=ctx.unit_id,material_id=r['material_id'],
            origem='almoxarifado',qtd=quantity,
            destino_ref=f'Consumo 30d {r["consumed"]}; disponível {r["available"]}; ponto {point}',
            criado_por=user.id,atualizado_por=user.id))
        created.append(str(identifier))
    db.commit();return {'criadas':created}


@router.get('/reposicao')
def suggestions(unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.sugerir');t=table('sup_sugestao_ressuprimento')
    rows=db.execute(select(t).where(and_(t.c.unidade_id==ctx.unit_id,t.c.status=='SUGERIDA',
        t.c.origem=='almoxarifado'))
        .order_by(t.c.criado_em.desc()).limit(100)).mappings().all()
    return jsonable_encoder({'items':[{**dict(r),'quantidade':r['qtd'],
        'motivo':r['destino_ref']} for r in rows]})


@router.post('/reposicao/{suggestion_id}/decidir')
def decide_suggestion(suggestion_id:str,data:dict,unidade:str='campinas',user:Actor=Depends(current_actor),db:Session=Depends(session)):
    ctx=gate(db,user,unidade,'estoque.sugerir');decision=data.get('decisao')
    if decision not in {'CONFIRMADA','DESCARTADA'}:raise HTTPException(422,'Decisão inválida')
    t=table('sup_sugestao_ressuprimento')
    row=db.execute(select(t).where(and_(t.c.id==uid(suggestion_id),t.c.unidade_id==ctx.unit_id,
        t.c.status=='SUGERIDA',t.c.origem=='almoxarifado')).with_for_update()).mappings().one_or_none()
    if not row:raise HTTPException(404,'Sugestão não encontrada')
    request_id=None
    if decision=='CONFIRMADA':
        cc_id=uid(data.get('cc_id'),'Centro de custo')
        check_action(ctx,'estoque.sugerir',str(cc_id),write=True,phase='S2',db=db)
        cc=table('sup_centro_custo')
        if db.execute(select(cc.c.id).where(and_(cc.c.id==cc_id,cc.c.unidade_id==ctx.unit_id,
            cc.c.ativo.is_(True)))).scalar_one_or_none() is None:
            raise HTTPException(422,'Centro de custo indisponível')
        material=table('sup_material')
        unit=db.execute(select(material.c.un_estoque).where(material.c.id==row['material_id'])).scalar_one()
        cost=db.execute(select(table('sup_custo_medio').c.custo_medio).where(and_(
            table('sup_custo_medio').c.unidade_id==ctx.unit_id,
            table('sup_custo_medio').c.material_id==row['material_id']))).scalar_one_or_none()
        request_id=uuid7();item_id=uuid7()
        db.execute(insert(table('sup_solicitacao')).values(id=request_id,unidade_id=ctx.unit_id,
            numero=allocate_number(db,ctx),cc_id=cc_id,solicitante_id=user.id,
            solicitante_nome=user.name,origem='ressuprimento',status='RASCUNHO',
            justificativa=f'Ponto de pedido: {row["destino_ref"] or "reposição sugerida"}',
            criado_por=user.id,atualizado_por=user.id))
        db.execute(insert(table('sup_solicitacao_item')).values(id=item_id,unidade_id=ctx.unit_id,
            solicitacao_id=request_id,material_id=row['material_id'],qtd=row['qtd'],un=unit,
            preco_informado=(Decimal(cost).quantize(CENT) if cost and cost>0 else None),
            criado_por=user.id,atualizado_por=user.id))
        record_event(db,ctx,request_id,None,'RASCUNHO','Ressuprimento confirmado pelo comprador')
    db.execute(update(t).where(t.c.id==row['id']).values(status=decision,solicitacao_id=request_id,
        atualizado_por=user.id,atualizado_em=datetime.now(UTC)))
    record_event(db,ctx,row['id'],'SUGERIDA',decision,target_type='reposicao')
    db.commit();return {'status':decision,'solicitacao_id':str(request_id) if request_id else None}
