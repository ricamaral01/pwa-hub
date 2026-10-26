"""Cria demonstração removível do almoxarifado apenas no banco de homologação."""
from __future__ import annotations
import os
from datetime import date,timedelta
from decimal import Decimal
from sqlalchemy import insert,select,update,and_
from sqlalchemy.orm import Session
from suprimentos.auth import Actor,context
from suprimentos.db import database,table
from suprimentos.ids import uuid7
from suprimentos.api.estoque import movement

assert os.environ.get('SUPRIMENTOS_ENVIRONMENT')=='homolog'
engine,_=database()
with Session(engine) as db:
    actor=Actor('e2e-suprimentos-almox','Almoxarife DEMO')
    ctx=context('campinas',actor,db)
    m=table('sup_material');mu=table('sup_material_unidade');loc=table('sup_local');addr=table('sup_endereco')
    measure=db.execute(select(table('sup_unidade_medida').c.id).where(table('sup_unidade_medida').c.sigla=='un')).scalar_one()
    local=db.execute(select(loc.c.id).where(and_(loc.c.unidade_id==ctx.unit_id,loc.c.nome=='DEMO-F2 Almoxarifado'))).scalar_one_or_none()
    if not local:
        local=uuid7();db.execute(insert(loc).values(id=local,unidade_id=ctx.unit_id,tipo='almoxarifado',nome='DEMO-F2 Almoxarifado',criado_por='DEMO-F2',atualizado_por='DEMO-F2'))
    address=db.execute(select(addr.c.id).where(and_(addr.c.local_id==local,addr.c.codigo=='A-01'))).scalar_one_or_none()
    if not address:
        address=uuid7();db.execute(insert(addr).values(id=address,unidade_id=ctx.unit_id,local_id=local,codigo='A-01',criado_por='DEMO-F2',atualizado_por='DEMO-F2'))
    for code,label,category,quantity,price,point in (
        ('DEMO-F2-ABR','Disco de corte 7 pol.','ABRASIVO',Decimal(38),Decimal('14.90'),Decimal(25)),
        ('DEMO-F2-FER','Broca aço rápido 10 mm','FERRAMENTA',Decimal(9),Decimal('32.50'),Decimal(12)),
        ('DEMO-F2-EPI','Luva de proteção nitrílica','EPI',Decimal(50),Decimal('8.70'),Decimal(30))):
        material=db.execute(select(m.c.id).where(m.c.codigo==code)).scalar_one_or_none()
        if not material:
            material=uuid7();db.execute(insert(m).values(id=material,codigo=code,descricao=label,categoria=category,
                un_estoque=measure,controla_estoque=True,dominio='almoxarifado',exige_ca=category=='EPI',
                criado_por='DEMO-F2',atualizado_por='DEMO-F2'))
            db.execute(insert(mu).values(material_id=material,unidade_id=ctx.unit_id,ponto_pedido=point,
                lead_time_dias=7,seguranca_dias=3,lote_economico=10,criado_por='DEMO-F2',atualizado_por='DEMO-F2'))
        movement(db,ctx,material_id=material,address_id=address,quantity=quantity,kind='ENTRADA',
            key=f'DEMO-F2:{code}:entrada',reference_type='DEMO',unit_cost=price)
        if category=='EPI':
            ca=table('sup_epi_ca')
            exists=db.execute(select(ca.c.id).where(and_(ca.c.material_id==material,ca.c.numero_ca=='DEMO-CA-2026'))).scalar_one_or_none()
            if not exists:db.execute(insert(ca).values(id=uuid7(),material_id=material,numero_ca='DEMO-CA-2026',
                validade=date.today()+timedelta(days=365),criado_por='DEMO-F2',atualizado_por='DEMO-F2'))
    db.commit()
print('DEMO_F2_OK materiais=3 endereco=1')
