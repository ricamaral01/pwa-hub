"""Record A5 continuation and exact final deployment state."""
from pathlib import Path

target = Path("docs/porting/ged/A5-ensaio.md")
marker = "## Continuação do lote 2 — estado final"
if marker in target.read_text(encoding="utf-8"):
    raise SystemExit("A5 continuation already present")
text = """

## Continuação do lote 2 — estado final

O ciclo de redirecionamento da raiz GED foi corrigido no snippet Nginx: `/unificado/ged` abre com 200; a variante com barra converge por 308. Antes do reload houve backup e `nginx -t`; o gate PCP, Mapa e Laboratório passou 7/7, seguido de salvamento PCP sintético.

O teste headless de login visual inicialmente submeteu o formulário antes da hidratação e acionou seu fallback GET nativo, colocando a senha **sintética** da conta `e2e-ged-a5-admin-master` na URL de diagnóstico. A senha foi rotacionada imediatamente; a sessão antiga recebeu 401, o novo login recebeu 200 e o arquivo `/etc/ged-a5-probe.env` permaneceu modo 600. O HTML GED foi corrigido para `method="post"`, com backup e build controlado da imagem frontend `ged-concrefer-frontend:a5-login-post`. O teste sem JavaScript enviou POST sem credencial na URL. Com hidratação completa, o login visual headless entrou no dashboard nos papéis ADMIN_MASTER, QUALIDADE e OPERACIONAL. A imagem frontend corrigida permanece ativa.

O backend GED recebeu, após backup/build controlado, validação de acesso antes do Multer gravar anexos de tarefa. O ensaio criou a tarefa `b7ed9e58-156e-4440-8281-1e4fd406be81`, anexo `5df478b3-2f5b-4846-96c4-cf301900fb8a`, confirmou download 401/200 e upload negado 403 à conta OPERACIONAL. Havia apenas um arquivo com o nome do ensaio, o autorizado. A calibração sintética `d24102dc-ad44-423d-b6e7-39599b837353` gerou QR PNG decodificado por OpenCV para a rota de verificação no novo prefixo; a rota abriu com 200. A leitura de QR **impresso** continua no roteiro presencial.

### Fronteiras de arquivo e rollback

Arquivos com um byte acima dos tetos foram recusados: calibração 20 MiB e tarefa 25 MiB por 400; documento 50 MiB por 413 do Nginx. Arquivos exatamente iguais aos tetos inicialmente falharam: 20/25/50 MiB receberam 400 do Multer; 50 MiB também recebia 413 antes de elevar provisoriamente o envelope Nginx de 50m para 51m. Foi construída imagem backend de ensaio com Multer `teto + 1 byte`: 20 MiB e 25 MiB exatos passaram (calibração `96719bf2-61c1-4d4b-bf7b-9b09b5973bbe`, anexo `7b52d43c-1337-4ff7-8373-b5f59d6c971c`).

O ensaio de 50 MiB exatos usou um PDF **malformado** grande. A tentativa bloqueou a resposta do backend por mais de 120 segundos e o health expirou. A imagem backend foi revertida imediatamente para `ged-concrefer-backend:a5-task-preflight`, preservando a correção do anexo de tarefa. O snippet Nginx GED foi restaurado do backup `/root/ged-a5-20261015/ged-unificado.before-51m.conf` (SHA-256 `51608def41f4e9da275c9840df3e39aa915d8552199c004ce820db6746b53daa`), com `client_max_body_size 50m`. `nginx -t`, reload, health 200, gate 7/7 e salvamento PCP id 7262 passaram após rollback. O estado final **não aceita** arquivos exatamente no teto; a correção `teto + 1 byte` foi testada em 20/25 MiB mas não permanece ativa. O teste de 50 MiB deve usar PDF válido em contêiner isolado, com limite de CPU/memória e timeout, antes de decidir um novo deploy. Não repetir o arquivo malformado no serviço ativo.

O backup do controller de tarefa anterior ao primeiro patch está em `/root/ged-a5-20261015/taskController.before.js`; o Compose anterior em `docker-compose.before.yml`. Backups dos quatro arquivos e do Compose antes do segundo build estão no mesmo diretório. Nenhum dado ou arquivo de teste foi removido. As diferenças de fonte do backend final limitam-se ao preflight do anexo de tarefa; o frontend final acrescenta `method="post"` no login.
"""
with target.open("a", encoding="utf-8", newline="\n") as stream:
    stream.write(text)
print("A5 continuation appended")
