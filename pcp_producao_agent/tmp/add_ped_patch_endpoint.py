from pathlib import Path
main = Path('tmp/remote/main/estoque.py').read_text(encoding='utf-8')
ped_path = Path('tmp/remote/ped/estoque.py')
ped = ped_path.read_text(encoding='utf-8')
if '@router.patch("/estoque/movimentos/{mov_id}")' not in ped:
    start = main.index('@router.patch("/estoque/movimentos/{mov_id}")')
    end = main.index('@router.delete("/estoque/movimentos/{mov_id}")', start)
    ped = ped.replace('@router.delete("/estoque/movimentos/{mov_id}")', main[start:end] + '@router.delete("/estoque/movimentos/{mov_id}")')
ped_path.write_text(ped, encoding='utf-8')
print('ped patch endpoint', '@router.patch("/estoque/movimentos/{mov_id}")' in ped)
