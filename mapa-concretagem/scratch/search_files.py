import os

def search():
    print("Iniciando busca em Python...")
    target = "sheets_service.py"
    exclude_dirs = {"Windows", "Program Files", "Program Files (x86)", "AppData", "$RECYCLE.BIN"}
    
    for root, dirs, files in os.walk("C:\\", topdown=True):
        # Filtra pastas excluídas in-place para acelerar a busca
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        if target in files:
            path = os.path.join(root, target)
            print(f"ENCONTRADO: {path}")
            return
            
    print("Busca finalizada. Arquivo não encontrado.")

if __name__ == "__main__":
    search()
