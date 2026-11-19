import unittest
from review_expectations import legacy_login_challenge

class LegacyChallengeTests(unittest.TestCase):
 def test_native_401_requires_the_real_visible_login_form(self):
  response={'status':401,'url':'https://concrefer.concretrack.com.br:18446/unificado/mapa/api/usina/legacy/estoque/saldo'}
  self.assertTrue(legacy_login_challenge(response,'usinas',True))
  self.assertFalse(legacy_login_challenge(response,'usinas',False))
  self.assertFalse(legacy_login_challenge(response,'laboratorio',True))
 def test_other_errors_are_never_waived(self):
  for status,path in [(500,'/unificado/mapa/api/usina/legacy/saldo'),(403,'/unificado/mapa/api/usina/legacy/saldo'),(401,'/unificado/mapa/api/me')]:
   self.assertFalse(legacy_login_challenge({'status':status,'url':path},'usinas',True))
