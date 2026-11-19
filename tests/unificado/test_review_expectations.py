import unittest
from review_expectations import legacy_login_challenge,permitted_external_report,EXTERNAL_REPORT_PREFIX

class LegacyChallengeTests(unittest.TestCase):
 def test_only_the_authorized_external_get_prefix_is_allowed(self):
  url=EXTERNAL_REPORT_PREFIX+'relatorio_pcp_producao_2026-10-30.html'
  self.assertTrue(permitted_external_report(url,'GET'))
  for method in ['HEAD','POST','PUT','DELETE']:self.assertFalse(permitted_external_report(url,method))
  for other in ['http://'+url.removeprefix('https://'),url.replace('dautomacao.com/','dautomacao.com.evil/'),EXTERNAL_REPORT_PREFIX+'../outside.html',EXTERNAL_REPORT_PREFIX+'%2e%2e%2foutside.html','https://dautomacao.com/concretrack/relatorios/reports-diarios/manifest.json']:
   self.assertFalse(permitted_external_report(other,'GET'),other)
 def test_native_401_requires_the_real_visible_login_form(self):
  response={'status':401,'url':'https://concrefer.concretrack.com.br:18446/unificado/mapa/api/usina/legacy/estoque/saldo'}
  self.assertTrue(legacy_login_challenge(response,'usinas',True))
  self.assertFalse(legacy_login_challenge(response,'usinas',False))
  self.assertFalse(legacy_login_challenge(response,'laboratorio',True))
 def test_other_errors_are_never_waived(self):
  for status,path in [(500,'/unificado/mapa/api/usina/legacy/saldo'),(403,'/unificado/mapa/api/usina/legacy/saldo'),(401,'/unificado/mapa/api/me')]:
   self.assertFalse(legacy_login_challenge({'status':status,'url':path},'usinas',True))
