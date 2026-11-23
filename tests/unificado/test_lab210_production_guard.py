import ast,sys,unittest,importlib.util,json,tempfile
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
    def test_retry_preserves_existing_schemas_and_never_reimports_batches(self):
        spec=importlib.util.spec_from_file_location('release_under_test',R/'scripts/lab210_production_release.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            module.S=Path(directory);(module.S/'gate-homolog-approved.json').write_text(json.dumps({'passed':True}))
            state={'phase':'prepared','migration_applied':True,'imports':[{'unit':'pederneiras','imported':1613}]};calls=[]
            module.receipt=lambda:state;module.store=lambda r:None
            def sql(db,query,readonly=False):
                self.assertTrue(readonly,'Retry must not run schema/data DDL');calls.append(query)
                return [['2.1.0','2.1.0']] if 'release_metadata' in query else [0]
            module.sql=sql;module.write_grants=lambda db:[{'allowed':True}]
            module.extract=lambda:self.fail('Retry cannot extract/reimport or overwrite existing data')
            result=module.migrate();self.assertTrue(result['reused_own_schemas_and_preserved_data']);self.assertEqual(result['imports'],state['imports']);self.assertEqual(len(calls),2)
if __name__=='__main__':unittest.main()
