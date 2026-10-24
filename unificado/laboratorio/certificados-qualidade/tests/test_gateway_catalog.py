import importlib.util
from pathlib import Path


ROOT=Path(__file__).resolve().parents[3]/'mapa'/'api'
spec=importlib.util.spec_from_file_location('cq_screen_access',ROOT/'screen_access.py')
access=importlib.util.module_from_spec(spec)
spec.loader.exec_module(access)


def test_certificate_granted_to_existing_laboratory_user():
    user=dict(id='user-ricardo',nome='Ricardo',perfil='GERENCIA')
    allowed=access.allowed_screens(user,None,{},frozenset({'user-ricardo'}))
    assert 'labCertificados' in allowed
    assert access.screen_for_uri('/unificado/laboratorio/certificados-qualidade/api/config')['id']=='labCertificados'


def test_certificate_denied_without_laboratory_access():
    user=dict(id='unrelated',nome='Outro',perfil='APONTADOR')
    allowed=access.allowed_screens(user,None,{},frozenset())
    assert 'labCertificados' not in allowed


def test_guest_with_lab_permission_gets_certificate():
    user=dict(id='guest-lab',nome='Visitante',perfil='CONVIDADO')
    allowed=access.allowed_screens(user,None,{'labPole':True},frozenset({'guest-lab'}))
    assert 'labCertificados' in allowed


def test_philippe_named_corrector_has_certificate_screen():
    user=dict(id='philippe',nome='Philippe',perfil='GERENCIA')
    allowed=access.allowed_screens(user,None,{},frozenset())
    assert 'labCertificados' in allowed
