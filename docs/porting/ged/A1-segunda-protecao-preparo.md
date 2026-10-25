# A1 — segunda proteção da chave: preparação

O script [a1_password_recovery.py](../../../scripts/porting/a1_password_recovery.py) usa `scrypt` (`N=131072`, `r=8`, `p=1`, sal aleatório) e AES-256-GCM para proteger **a mesma chave A1** hoje encapsulada por DPAPI. `prepare` pede a senha duas vezes, sem eco, exige 20 caracteres e cria somente o invólucro local fora do Git. A senha não entra em argumento, variável de ambiente, arquivo ou log. Após Ricardo executar `prepare`, a etapa separada `copy` copia o invólucro e os três artefatos já cifrados para `/root/concrefer-backups/ged-a1-2026-10-15/` no destino, com diretório `0700`, arquivos `0600` e conferência de SHA-256. Ela não lê nem recebe a senha.

`verify`, também executado por Ricardo, pede a senha novamente por prompt sem eco, lê somente o invólucro, compara SHA-256 das cópias remotas, decifra os artefatos em memória e restaura o dump em PostgreSQL 16 temporário sem rede, além de validar os tar dos uploads/configuração. **Não usa `key.dpapi` nem DPAPI.** Só depois dessa execução e do registro sem segredos no A6 a condição A1 estará cumprida.

**Pendente:** Ricardo executar `python .\scripts\porting\a1_password_recovery.py prepare` no PowerShell e informar que o comando concluiu. Os três artefatos cifrados locais estão presentes; o invólucro por senha ainda não existe. Depois, a cópia será executada pela equipe e Ricardo executará `python .\scripts\porting\a1_password_recovery.py verify`. Nenhuma dessas três etapas foi executada ainda. A sintaxe Python foi validada; o teste criptográfico descartável não substitui a restauração real.

Comando exato de criação, independente da pasta atual do PowerShell:

```powershell
python "C:\Users\Admin\Documents\pwa-hub-fase1\scripts\porting\a1_password_recovery.py" prepare
```

Após a cópia remota, o comando de restauração será o mesmo caminho com `verify` no lugar de `prepare`; a senha será pedida novamente sem eco.
