"""Import must preserve factory identities and quarantine incomplete batches."""
import sys,unittest
from pathlib import Path
from decimal import Decimal
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts'))
from lab210_snapshot import normalize

class ImportTests(unittest.TestCase):
 def row(self,**values):
  return dict(id=12,produto='Poste',formula='Traço fábrica',data='2026-11-20',numero_serie=Decimal('123.000'),qtd=Decimal('.25'),**values)
 def test_numeric_series_keeps_factory_number_without_decimal_suffix(self):
  row=normalize(self.row());self.assertEqual(row['numero_serie'],'123');self.assertEqual(row['raw']['qtd'],Decimal('.25'))
 def test_text_series_is_never_replaced_with_batch_id(self):
  raw=self.row();raw['numero_serie']='PEDE-001-A';self.assertEqual(normalize(raw)['numero_serie'],'PEDE-001-A')
 def test_missing_product_formula_or_series_is_not_fabricated(self):
  for field in ['produto','formula','numero_serie']:
   for missing in [None,'','  ']:
    with self.subTest(field=field,value=missing):
     raw=self.row();raw[field]=missing
     with self.assertRaises(ValueError):normalize(raw)
 def test_invalid_date_and_oversized_series_are_rejected(self):
  for field,value in [('data','2026-02-30'),('numero_serie','A'*101)]:
   raw=self.row();raw[field]=value
   with self.assertRaises(ValueError):normalize(raw)

if __name__=='__main__':unittest.main()
