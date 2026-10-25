"""Append the retained synthetic GED A5 records without touching older entries."""
from pathlib import Path

target = Path("docs/porting/dados-sinteticos.md")
marker = "## Complemento A5 — ensaios de limite e login"
content = target.read_text(encoding="utf-8")
if marker in content:
    raise SystemExit("A5 inventory supplement already present")
supplement = """

## Complemento A5 — ensaios de limite e login

- GED destino: tarefa sintética `b7ed9e58-156e-4440-8281-1e4fd406be81`; anexo pequeno `5df478b3-2f5b-4846-96c4-cf301900fb8a`; anexo de exatamente 25 MiB `7b52d43c-1337-4ff7-8373-b5f59d6c971c`. O upload de prova negado à conta OPERACIONAL retornou 403 e não deixou segundo arquivo com o nome de prova.
- GED destino: calibração sintética `d24102dc-ad44-423d-b6e7-39599b837353`, com QR virtual verificado; calibração sintética de 20 MiB exatos `96719bf2-61c1-4d4b-bf7b-9b09b5973bbe`. Os registros e arquivos permanecem no destino.
- PCP: smokes adicionais IDs `7261` (`2099-11-01`) e `7262` (`2099-11-02`), setor 3, já incorporados à faixa da tabela acima. A tentativa em `2099-10-20` não criou registro porque a data já tinha linha.
- Durante o ensaio visual GED, um envio antes da hidratação executou o fallback GET nativo do formulário e expôs a senha **sintética** de `e2e-ged-a5-admin-master` na URL de diagnóstico. A senha foi rotacionada imediatamente; a sessão anterior retornou 401, o novo login retornou 200 e `/etc/ged-a5-probe.env` continuou com modo 600. O formulário publicado recebeu `method="post"`; o teste sem JavaScript confirmou POST sem credenciais na URL. Nenhuma conta real foi usada.
- Ensaio de PDF sintético malformado com 50 MiB exatos deixou o backend GED sem resposta por mais de 120 segundos. O backend foi revertido à imagem `a5-task-preflight`; o snippet Nginx voltou a 50m. O frontend com fallback POST permaneceu. O health e o gate de regressão passaram após rollback. O limite exato de 50 MiB segue pendente de ensaio isolado com PDF válido.
"""
with target.open("a", encoding="utf-8", newline="\n") as stream:
    stream.write(supplement)
print("A5 inventory supplement appended")
