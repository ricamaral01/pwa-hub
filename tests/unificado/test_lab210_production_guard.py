import ast,sys,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'scripts'))
from lab210_production_patch import backend
from lab210_migration import complete_ddl
class Guard(unittest.TestCase):
    def test_production_artifact_changes_only_expected_database_and_error_label(self):
        source=(R/'unificado/laboratorio/service/server/cec_units.py').read_text(encoding='utf-8')
        result=backend(source)
        constants={n.targets[0].id:ast.literal_eval(n.value) for n in ast.parse(result).body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id=='EXPECTED_DATABASE'}
        self.assertEqual(constants['EXPECTED_DATABASE'],'concretrack_postes')
        self.assertIn("engine.url.database != EXPECTED_DATABASE",result)
        self.assertIn("EXPECTED_DATABASE = 'laboratorio_visual_homolog_20261118'",source)
    def test_homolog_migration_guard_is_preserved(self):
        ddl=complete_ddl();self.assertIn("current_database() <> 'laboratorio_visual_homolog_20261118'",ddl)
        self.assertNotIn("current_database() <> 'concretrack_postes'",ddl)
if __name__=='__main__':unittest.main()
