"""Gera uma planilha no formato do Sheets legado, com os defeitos conhecidos, para testar a carga."""
import sys, openpyxl
wb = openpyxl.Workbook(); cad = wb.active; cad.title = "cadastro"
cad.append(["ID","Nome","Revisão","Unidade","Status","Vigência","Cadastro","Fornecedor","Produto","Quantidade","Un. Medida","M.E.","Obs.","Tipo Frete"])
itens = [("Votorantim","Cimento CP V-ARI",380,"3,1"),("Areal Tietê","Areia fina",320,"2,63"),("Areal Tietê","Areia média",472,"2,62"),
         ("Pedreira Itapeva","Brita 0",300,"2,72"),("Pedreira Itapeva","Brita 1",750,"2,75"),("-","Água",190,"1"),
         ("-","Aditivo 1 (PC)","3,04","1,08"),("-","Aditivo 2 (RT)","1,9","1,1")]
rev2 = {"Cimento CP V-ARI":370,"Areia média":450,"Brita 1":780,"Aditivo 1 (PC)":"2,85"}
for f,p,q,me in itens: cad.append(["CT-101","FCK 25 · Brita 1",2,"Campinas","Inativa","01/08/2026","01/08/2026",f,p,rev2.get(p,q),"kg",me,"",""])
for f,p,q,me in itens: cad.append(["CT-140","FCK 25 · Brita 1",3,"Campinas","Ativa","25/10/2026","25/10/2026",f,p,q,"kg",me,"Ajuste graúdo",""])
# A1: duas revisões ativas
for rid,rev in (("CT-090",1),("CT-120",2)):
    for f,p,q,me in itens[:6]: cad.append([rid,"FCK 30",rev,"Campinas","Ativa","01/09/2026","01/09/2026",f,p,q+(10 if rev==2 else 0),"kg",me,"",""])
# mesma revisão salva duas vezes + nome com espaço duplo
for rid in ("CT-200","CT-201"):
    cad.append([rid,"FCK 20","1","Pederneiras","Ativa","10/09/2026","10/09/2026","-","Cimento CP V-ARI",300,"kg","3,1","",""])
    cad.append([rid,"FCK 20","1","Pederneiras","Ativa","10/09/2026","10/09/2026","-","Areia  média",800,"kg","2,62","",""])
    cad.append([rid,"FCK 20","1","Pederneiras","Ativa","10/09/2026","10/09/2026","-","Aditivo 1 (PC)","2,4","kg","1,08","",""])
cus = wb.create_sheet("custos")
cus.append(["ID","Data","Unidade","Fornecedor","Material","Un. Medida","Valor","ICMS %","Frete","Valor Líquido","Produto Fornecedor","Tipo Frete"])
rows = [("01/03/2026","Campinas","Votorantim","Cimento CP V-ARI","ton","650,00","12","13,60","585,60","CP V ARI RS","CIF"),
        ("12/10/2026","Campinas","Votorantim","Cimento CP V-ARI","ton","680,00","12","13,60","612,00","CP V ARI RS","CIF"),
        ("03/09/2026","Campinas","Areal Tietê","Areia fina","m³","200,00","12","13,36","189,36","","CIF"),
        ("03/09/2026","Campinas","Areal Tietê","Areia média","m³","190,00","12","10,96","178,16","","CIF"),
        ("20/08/2026","Campinas","Pedreira Itapeva","Brita 0","ton","90,00","12","5,80","85,00","","FOB"),
        ("20/08/2026","Campinas","Pedreira Itapeva","Brita 1","ton","85,00","12","5,20","80,00","","FOB"),
        ("01/01/2026","Campinas","Poço","Água","m³","4,00","0","0","4,00","",""),
        ("15/07/2026","Campinas","Aditivos SA","Aditivo 1 (PC)","kg","12,80","12","0,24","11,50","","CIF"),
        ("01/09/2026","Pederneiras","Votorantim","Cimento CP V-ARI","saco","32,00","12","1,00","29,16","","CIF"),
        ("01/09/2026","Pederneiras","Areal Tietê","Areia media","m³","185,00","12","9,00","171,80","","CIF"),   # A5: sem acento
        ("01/09/2026","Pederneiras","Aditivos SA","Aditivo 1 (PC)","litro","13,00","12","0,20","11,64","","CIF"),
        ("05/09/2026","Pederneiras","Aditivos SA","Aditivo 1 (PC)","litro","13,00","12","0,20","11,50","","CIF")] # líquido errado
for i,r in enumerate(rows,1): cus.append([f"CU-{i}",*r])
wb.save(sys.argv[1]); print("ok", sys.argv[1])
