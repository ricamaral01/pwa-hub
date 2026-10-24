# T3 — Seed provisório de produtos e metas

O arquivo `seed/seed_produtos_pederneiras.csv` contém 112 produtos de 9 famílias. A leitura UTF-8 e validação em `scripts/seed_pederneiras_produtos.py` encontrou 23 pendências, uma letra `P` duplicada, 85 letras vazias e um código Pro vazio. Códigos Pro preenchidos não se repetem.

O importador inicia em simulação e exige `--apply` e `DATABASE_URL` explícitos para gravar. Ele exige catálogo vazio para Pederneiras, preserva as pendências e deixa todo `volume_m3` como `NULL`, pois o CSV não traz esse campo. Também prepara a meta de outubro/2026: 23 dias úteis × 64 peças/dia = **1.472 postes**, meta **5,9 postes/homem**, como no requisito.

O CSV recebido em `Downloads` é idêntico ao CSV já versionado (SHA-256 igual). O script não insere áreas de mão de obra: Ricardo informou que enviará uma classificação MOD/MOI corrigida. O lote de produtos é transacional e só prossegue se o catálogo da unidade estiver vazio.

**Estado:** simulação validada; sem gravação no banco operacional. A carga real depende da aplicação da migration e da validação da tabela provisória. O gestor específico será criado depois; Ricardo, Marcelo e Alex permanecem masters.
