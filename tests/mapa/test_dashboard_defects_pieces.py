"""Run against a disposable PostgreSQL using MAPA_TEST_POSTGRES_DSN."""
import os
import sys
import unittest
from datetime import date
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'unificado' / 'mapa' / 'api'))
from dashboard_defects_indicators import PRODUCTION_QUERY, CRITICAL_ITEMS


@unittest.skipUnless(os.getenv('MAPA_TEST_POSTGRES_DSN'), 'Requires disposable PostgreSQL DSN')
class ProductionPiecesTests(unittest.TestCase):
    def setUp(self):
        self.db = psycopg.connect(os.environ['MAPA_TEST_POSTGRES_DSN'], row_factory=dict_row)
        self.addCleanup(self.db.close)
        self.db.execute('''CREATE TEMP TABLE producao (
            id uuid, setor text, forma text, modelo text, data_fabricacao date);
            CREATE TEMP TABLE montagem_poste (
            record_id text, etapa text, status_montagem text, finalizado_em timestamp,
            checklists jsonb, montador_nome text)''')
        self.db.execute("""INSERT INTO producao
            SELECT ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid,
                   'Setor 1','F'||n,'Modelo A','2026-11-01' FROM generate_series(1,150) n;
            INSERT INTO producao VALUES
              ('00000000-0000-0000-0000-000000000151','Setor 2','F151','Modelo B','2026-11-01'),
              ('00000000-0000-0000-0000-000000000152','Setor 1','F152','Modelo A','2026-10-31');
            INSERT INTO montagem_poste
            SELECT id::text,'FINALIZACAO',CASE WHEN forma='F1' THEN 'RR' ELSE 'R' END,
                   '2026-11-02',
                   CASE WHEN substring(forma from 2)::int <= 10
                     THEN '{"checagem_inicial":{"trincas":"nao","rebarbas":"nao","falhas_preenchimento":"nao"}}'::jsonb
                     WHEN substring(forma from 2)::int <= 120
                     THEN '{"checagem_inicial":{"rebarbas":"nao","fissuras":"nao"}}'::jsonb
                     ELSE '{"checagem_inicial":{"rebarbas":"sim"}}'::jsonb END,
                   'Operador A'
            FROM producao WHERE substring(forma from 2)::int <= 140;
            -- Duplicate historical event and subsequent clean reinspection.
            INSERT INTO montagem_poste SELECT record_id,'HISTORICO_REPROVACAO','R',
              finalizado_em,checklists,montador_nome FROM montagem_poste
              WHERE record_id='00000000-0000-0000-0000-000000000001';
            INSERT INTO montagem_poste VALUES
              ('00000000-0000-0000-0000-000000000001','REINSPECAO','RR','2026-11-03','{}','Operador A'),
              ('00000000-0000-0000-0000-000000000141','CHECAGEM_INICIAL',NULL,NULL,
               '{"checagem_inicial":{"trincas":"nao"}}','Operador A'),
              (NULL,'FINALIZACAO','R','2026-11-02',
               '{"checagem_inicial":{"trincas":"nao"}}','Operador A');
        """)

    def query(self, sector='Setor 1', status='', search=''):
        return self.db.execute(PRODUCTION_QUERY.replace('public.', 'pg_temp.'), (
            date(2026,11,1), date(2026,11,1), sector, status, search, CRITICAL_ITEMS
        )).fetchall()

    def test_unique_pieces_include_later_inspections_and_keep_critical_history(self):
        self.assertEqual(self.query(), [dict(sector='Setor 1', produced=150, inspected=140,
            affected=120, critical=10, noncritical_only=110)])

    def test_search_selects_same_pieces_for_numerator_and_denominator(self):
        self.assertEqual(self.query(search='Operador A')[0]['produced'], 141)
        result = self.query(search='F150')[0]
        self.assertEqual((result['produced'], result['inspected'], result['affected']), (1,0,0))

    def test_current_status_preserves_historical_defects(self):
        result = self.query(status='RR')[0]
        self.assertEqual((result['produced'],result['affected'],result['critical']), (1,1,1))

    def test_combined_sectors_and_empty_result(self):
        self.assertEqual(sum(row['produced'] for row in self.query(sector='Setores 1 e 2')),151)
        self.assertEqual(self.query(sector='Setor 4'), [])


if __name__ == '__main__':
    unittest.main()
