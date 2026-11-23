"""The approved H backend stays H-only; the production artifact has its own guard."""
import ast
def backend(source):
    old="EXPECTED_DATABASE = 'laboratorio_visual_homolog_20261118'"
    assert source.count(old)==1
    result=source.replace(old,"EXPECTED_DATABASE = 'concretrack_postes'")
    result=result.replace('Laboratório desta unidade disponível somente na homologação configurada.',
                          'Laboratório desta unidade disponível somente no banco configurado para o ambiente.')
    ast.parse(result)
    return result
