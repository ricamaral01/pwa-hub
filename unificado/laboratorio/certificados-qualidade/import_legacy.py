"""Import a read-only export of the old Sheet. No calls to its write endpoint."""
import json
import sys
from datetime import date
from pathlib import Path

from app import db


def optional_date(raw):
    try:
        return date.fromisoformat(str(raw)[:10])
    except (TypeError, ValueError):
        return None


def optional_num(raw):
    try:
        return float(raw) if raw not in ('',None) else None
    except (TypeError,ValueError):
        return None


def import_rows(rows):
    added=0
    with db() as conn:
        with conn.cursor() as cur:
            for row in rows:
                number=str(row.get('numCert') or '').strip()
                if not number or cur.execute('SELECT 1 FROM cq_certificados WHERE numero=%s AND revisao=0',(number,)).fetchone():
                    continue
                issued=optional_date(row.get('dataEmissao')) or date.today()
                values=(number,str(row.get('cliente') or 'Cliente não informado'),str(row.get('endereco') or ''),
                        str(row.get('notaFiscal') or ''),issued,str(row.get('respLab') or 'Não informado no legado'),
                        str(row.get('respTecnico') or 'Eng. Marcelo Eduardo Ishizaki de Sousa · CREA 5063392251'),
                        str(row.get('observacoes') or ''),json.dumps(row,ensure_ascii=False))
                cert=cur.execute('''INSERT INTO cq_certificados(numero,revisao,status,cliente,endereco,nota_fiscal,
                 data_emissao,resp_laboratorio,resp_tecnico,observacoes,fck_mpa,criado_por,origem,legado_snapshot)
                 VALUES (%s,0,'legado',%s,%s,%s,%s,%s,%s,%s,35,'importacao-sheets','sheets',%s)
                 RETURNING id''',values).fetchone()
                try: products=json.loads(row.get('produtos') or '[]')
                except (ValueError,TypeError): products=[]
                for item in products:
                    day=optional_date(item.get('data')) or optional_date(row.get('dataProducao'))
                    if not day: continue
                    cur.execute('''INSERT INTO cq_itens(certificado_id,modelo,altura_m,carga_dan,peso_kg,quantidade,data_producao,lote)
                     VALUES (%s,%s,%s,%s,%s,%s,%s,%s)''',
                     (cert['id'],str(item.get('modelo') or 'Não informado'),optional_num(item.get('altura')),
                      optional_num(item.get('carga')),optional_num(item.get('peso')),int(item.get('qtd') or 1),
                      day,str(item.get('lote') or 'L'+day.strftime('%Y%m%d'))))
                day=optional_date(row.get('dataProducao'))
                if day and any(row.get(k) not in ('',None) for k in ('res3','res7','res28')):
                    r28=optional_num(row.get('res28'))
                    cur.execute('''INSERT INTO cq_resultados_data(certificado_id,data_producao,traco,n_cps,r3_media,r7_media,r28_media,r28_min,resultado)
                      VALUES (%s,%s,NULL,NULL,%s,%s,%s,NULL,%s)''',
                      (cert['id'],day,optional_num(row.get('res3')),optional_num(row.get('res7')),r28,
                       'conforme' if r28 is not None and r28>35 else 'nao_conforme' if r28 is not None else 'aguardando_28_dias'))
                added+=1
    return added


if __name__=='__main__':
    source=Path(sys.argv[1])
    print('importados:',import_rows(json.loads(source.read_text(encoding='utf-8'))))
