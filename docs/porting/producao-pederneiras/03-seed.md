# T3 — Seed provisório de produtos e metas

O arquivo `seed/seed_produtos_pederneiras.csv` contém 112 produtos de 9 famílias. A leitura UTF-8 e validação em `scripts/seed_pederneiras_produtos.py` encontrou 23 pendências, uma letra `P` duplicada, 85 letras vazias e um código Pro vazio. Códigos Pro preenchidos não se repetem.

O importador inicia em simulação e exige `--apply` e `DATABASE_URL` explícitos para gravar. Ele exige catálogo vazio para Pederneiras, preserva as pendências e deixa todo `volume_m3` como `NULL`, pois o CSV não traz esse campo. Também prepara a meta de outubro/2026: 23 dias úteis × 64 peças/dia = **1.472 postes**, meta **5,9 postes/homem**, como no requisito.

O script também prepara as cinco áreas de mão de obra como registros editáveis no cadastro atual. A classificação MOD/MOI é a proposta provisória do documento de requisitos e continua pendente de confirmação; nenhuma regra a fixa no código da API. O lote é transacional e só prossegue se produtos e áreas da unidade estiverem vazios.

**Estado:** simulação validada; sem gravação no banco operacional. A carga real depende da aplicação da migration, da confirmação do gestor e da validação da tabela provisória.
