"""The Laboratory report page and its assets share one screen permission."""

from pathlib import Path
import sys
from unittest import TestCase

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "unificado" / "mapa" / "api"))
from screen_access import allowed_screens, screen_for_uri  # noqa: E402


class LaboratoryReportingAccessTest(TestCase):
    def test_page_and_assets_use_laboratory_permission(self):
        for path in (
            "/unificado/laboratorio/usinas-relatorios/",
            "/unificado/laboratorio/usinas-relatorios/native-areas.js",
            "/unificado/laboratorio/usinas-relatorios/native-areas.css",
        ):
            self.assertEqual(screen_for_uri(path)["id"], "labUsinasRelatorios")

    def test_existing_laboratory_grant_includes_reports_unless_denied(self):
        user = {"id": "lab-user", "nome": "Laboratório", "perfil": "LABORATORIO"}
        granted = allowed_screens(user, None, {"labCec": True}, {"lab-user"})
        self.assertIn("labUsinasRelatorios", granted)
        denied = allowed_screens(user, None,
                                 {"labCec": True, "labUsinasRelatorios": False},
                                 {"lab-user"})
        self.assertNotIn("labUsinasRelatorios", denied)
