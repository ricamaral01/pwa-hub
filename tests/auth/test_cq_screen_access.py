"""Certificate API routes must inherit the certificate screen permission."""
from pathlib import Path
import sys


sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'unificado/mapa/api'))
from screen_access import screen_for_uri  # noqa: E402


def test_certificate_page_and_api_share_screen():
    for uri in (
        '/unificado/laboratorio/certificados-qualidade/',
        '/unificado/laboratorio/certificados-qualidade/?tab=historico',
        '/unificado/laboratorio/certificados-qualidade/?tab=cadastros',
        '/unificado/laboratorio/certificados-qualidade/api/config',
        '/unificado/laboratorio/certificados-qualidade/api/certificados',
    ):
        assert screen_for_uri(uri)['id'] == 'labCertificados'
