"""Cria apenas contas sintéticas da homologação, papéis e um CC de teste.

Credenciais ficam no diretório protegido de backup; nunca são escritas no Git.
"""
from __future__ import annotations
import json
import os
import secrets
import sys
from pathlib import Path
import psycopg
from psycopg.rows import dict_row

sys.path.insert(0,str(Path.cwd()))
from app import connect, hasher
sys.path.insert(0,"/opt/concrefer-unificado/homolog-next/suprimentos/service")
from suprimentos.ids import uuid7

credential_file=Path(sys.argv[1]).resolve()
if credential_file.exists():
    credentials=json.loads(credential_file.read_text(encoding="utf-8"))
else:
    credentials={}
accounts=[
    ("e2e-suprimentos-sol","SOLICITANTE",None,["suprimentosPainel","suprimentosSolicitacoes","suprimentosNova"]),
    ("e2e-suprimentos-aprov1","APROVADOR",1,["suprimentosPainel","suprimentosSolicitacoes"]),
    ("e2e-suprimentos-aprov2","APROVADOR",2,["suprimentosPainel","suprimentosSolicitacoes"]),
    ("e2e-suprimentos-almox","ALMOXARIFE",None,["suprimentosPainel","suprimentosSolicitacoes"]),
    ("e2e-suprimentos-compras","COMPRADOR",None,["suprimentosPainel","suprimentosSolicitacoes","suprimentosFornecedores"]),
    ("e2e-suprimentos-qualidade","QUALIDADE",None,["suprimentosPainel","suprimentosFornecedores"]),
]
all_screens=["suprimentosPainel","suprimentosSolicitacoes","suprimentosNova",
             "suprimentosFornecedores","suprimentosCadastros"]
with connect() as conn, conn.cursor() as cur:
    cur.execute("SELECT id FROM public.usuarios WHERE id='ricardo.teste' AND ativo AND NOT primeiro_acesso")
    if not cur.fetchone(): raise RuntimeError("ricardo.teste indisponível na IAM de homologação")
    for user,role,level,screens in accounts:
        cur.execute("SELECT id FROM public.usuarios WHERE id=%s",(user,))
        if not cur.fetchone():
            password=secrets.token_urlsafe(18)
            credentials[user]=password
            cur.execute("""INSERT INTO public.usuarios
                           (id,nome,perfil,senha_hash,ativo,setor,primeiro_acesso)
                           VALUES (%s,%s,'CONVIDADO',%s,true,'Todos',false)""",
                        (user,"Teste Suprimentos · "+role,hasher.hash(password)))
        elif user not in credentials:
            raise RuntimeError(f"Conta {user} existe sem credencial no backup protegido")
        for screen in screens:
            cur.execute("""INSERT INTO unificado_auth.user_screen_permissions
                           (user_id,screen_id,allowed,updated_by)
                           VALUES (%s,%s,true,'user-ricardo')
                           ON CONFLICT(user_id,screen_id) DO UPDATE SET
                           allowed=true,updated_by='user-ricardo',updated_at=now()""",(user,screen))
    for screen in all_screens:
        cur.execute("""INSERT INTO unificado_auth.user_screen_permissions
                       (user_id,screen_id,allowed,updated_by)
                       VALUES ('ricardo.teste',%s,true,'user-ricardo')
                       ON CONFLICT(user_id,screen_id) DO UPDATE SET
                       allowed=true,updated_by='user-ricardo',updated_at=now()""",(screen,))
    conn.commit()

credential_file.write_text(json.dumps(credentials,ensure_ascii=False,indent=2),encoding="utf-8")
credential_file.chmod(0o600)

dsn=os.environ["SUPRIMENTOS_DATABASE_URL"].replace("postgresql+psycopg://","postgresql://",1)
with psycopg.connect(dsn,row_factory=dict_row) as conn, conn.cursor() as cur:
    cur.execute("SELECT id FROM suprimentos.sup_unidade WHERE codigo='campinas'")
    unit=cur.fetchone()["id"]
    cur.execute("SELECT id FROM suprimentos.sup_centro_custo WHERE unidade_id=%s AND codigo='E2E-SUP'",(unit,))
    found=cur.fetchone()
    cc=found["id"] if found else uuid7()
    if not found:
        cur.execute("""INSERT INTO suprimentos.sup_centro_custo
                       (id,unidade_id,codigo,nome,setor,criado_por,atualizado_por)
                       VALUES (%s,%s,'E2E-SUP','Produção Campinas · homologação','Produção',
                               'user-ricardo','user-ricardo')""",(cc,unit))
    assignments=[("ricardo.teste","ADMIN",None,None)]
    assignments += [(user,role,cc if role in {"SOLICITANTE","APROVADOR"} else None,level)
                    for user,role,level,_ in accounts]
    for user,role,scope,level in assignments:
        cur.execute("""SELECT id FROM suprimentos.sup_usuario_papel
                       WHERE iam_user_id=%s AND unidade_id=%s AND papel=%s
                         AND cc_id IS NOT DISTINCT FROM %s AND nivel IS NOT DISTINCT FROM %s
                         AND ativo""",(user,unit,role,scope,level))
        if not cur.fetchone():
            cur.execute("""INSERT INTO suprimentos.sup_usuario_papel
                           (id,iam_user_id,unidade_id,papel,cc_id,nivel,criado_por,atualizado_por)
                           VALUES (%s,%s,%s,%s,%s,%s,'user-ricardo','user-ricardo')""",
                        (uuid7(),user,unit,role,scope,level))
    conn.commit()

print("CC_TESTE=E2E-SUP; usuários de teste: " + ", ".join(user for user,*_ in accounts) + ", ricardo.teste")
