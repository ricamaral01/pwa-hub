"""Security boundaries for new units; no server, account, pool or DB required."""
import importlib.util,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('lab_cec_units',R/'unificado/mapa/api/lab_cec_units.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)


class AccessTests(unittest.TestCase):
 def test_absent_scope_does_not_grant_new_unit_even_to_pcp_admin(self):
  self.assertEqual(m.filter_allowed({'id':'jgabriel'},['labCec','labNoroCec','labPedeCec','labRibCec'],{}),['labCec','labNoroCec'])
 def test_alex_explicit_master_access(self):
  for identity in ['alex','user-alex']:
   self.assertEqual(m.filter_allowed({'id':identity},['labPedeCec','labRibCec'],{},homolog_aliases=True),['labPedeCec','labRibCec'])
 def test_homolog_alias_is_never_a_production_master(self):
  self.assertEqual(m.filter_allowed({'id':'user-alex'},['labPedeCec','labRibCec'],{}),[])
 def test_master_without_approved_nominal_grant_gets_no_new_unit(self):
  self.assertEqual(m.filter_allowed({'id':'marcelo'},['labPedeCec','labRibCec'],{}),[])
 def test_explicit_grant_is_unit_scoped_and_preserves_old_screens(self):
  self.assertEqual(m.filter_allowed({'id':'tecnico'},['labCec','labPedeCec','labRibCec'],{'labPedeCec':True},'pederneiras'),['labCec','labPedeCec'])
 def test_central_primary_scope_still_limits_an_explicit_screen_grant(self):
  self.assertEqual(m.filter_allowed({'id':'tecnico'},['labRibCec'],{'labRibCec':True},'pederneiras'),[])
 def test_explicit_extra_unit_is_honored(self):
  self.assertEqual(m.filter_allowed({'id':'tecnico'},['labRibCec'],{'labRibCec':True},'pederneiras',{'ribeirao'}),['labRibCec'])
 def test_read_and_launch_have_distinct_screens(self):
  base='/unificado/laboratorio/ribeirao/cec-api/'
  self.assertEqual(m.api_screen(base+'qrcp','POST'),'labRibCecLeitura')
  self.assertEqual(m.api_screen(base+'moldagens','POST'),'labRibCecEtiquetas')
  self.assertEqual(m.api_screen(base+'rompimentos-grupos','GET'),'labRibCec')
 def test_assertion_carries_exact_unit_method_and_operation(self):
  scope=m.assertion_scope('/unificado/laboratorio/pederneiras/cec-api/qrcp','POST')
  self.assertEqual(scope,{'cec_unit':'pederneiras','cec_method':'POST','cec_operation':'qrcp'})
  self.assertEqual(m.assertion_scope('/unificado/laboratorio/noroeste/cec-api/qrcp','POST'),{})
 def test_other_modules_and_existing_unit_catalogue_are_preserved(self):
  old=['labCec','labNoroCec','programacao12','usinasNoroCec','labRegisters']
  self.assertEqual(m.filter_allowed({'id':'operador'},old,{}),old)


if __name__=='__main__':unittest.main()
