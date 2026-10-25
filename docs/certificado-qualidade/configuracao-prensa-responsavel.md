# Configuração da prensa e do responsável pelo laboratório

**Publicado em produção:** 25/10/2026. Acesso: [Certificados de Qualidade no Unificado](https://concrefer.concretrack.com.br/unificado/?view=laboratorio%2Fcertificados-qualidade%2F).

## Como configurar

1. Abra **Laboratório → Certificados de Qualidade → Cadastros → Prensas**. Na prensa desejada, clique em **Editar**, informe a **empresa/laboratório calibrador** que emitiu o certificado, confira número e datas da calibração e clique em **Salvar alterações**. Os campos opcionais patrimônio, capacidade e classe podem ficar vazios. O PDF de calibração já anexado continua associado à prensa.
2. Em **Cadastros → Parâmetros**, escolha o **responsável padrão pelo laboratório** entre Ricardo Do Amaral e Philippe Augusto e salve. O formulário de novo certificado inicia com esse nome; ele ainda pode ser trocado no próprio certificado.
3. Em **Emitir → Responsáveis e prensa**, os links levam aos dois cadastros. Uma prensa com calibrador ausente ou calibração vencida aparece com aviso e não fica disponível para emissão. O servidor mantém a mesma validação.

O calibrador da Kratos **não foi preenchido automaticamente**. A origem informa “Não informado no cadastro de origem”, e o sistema exige o dado real antes de emitir com ela. A AMC 2TQC foi cadastrada depois, com [certificado de calibração próprio do GED](prensa-amc-certificado-ged.md). Certificados já emitidos conservam o snapshot da prensa e o PDF original.

## Implementação e verificação

- Migração aditiva `004_responsavel_padrao.sql` guarda o responsável padrão; endpoints de configuração e atualização da prensa aceitam a edição sem recriar a prensa.
- Homologação `:18446`: alteração e restauração de uma prensa de teste; alteração e restauração do responsável padrão; PDF anteriormente emitido preservado byte a byte; interface conferida em 1440 e 390 px, sem erro de JavaScript nem rolagem horizontal.
- Capturas: [prensa desktop](evidencias/configuracao-prensa-desktop.png), [prensa celular](evidencias/configuracao-prensa-celular.png), [responsável desktop](evidencias/configuracao-responsavel-desktop.png), [responsável celular](evidencias/configuracao-responsavel-celular.png).
- `node --check`, `python -m py_compile` e 17 testes existentes passaram. Homologação e produção passaram no gate geral **7/7**.
- Produção: backup `/opt/concrefer-unificado/backups/cq-production-20261025T104754Z`; `CQ_FONTE_CP=novo`; bootstrap, página autenticada e API de configuração retornaram **200**. Uma prensa oficial, nenhuma prensa de teste. Nenhum certificado foi emitido nesta verificação.
- Branch `feat/laboratorio-certificado-producao`; `main` permanece sem merge, conforme decisão anterior. A reconciliação de `main` e a rotação da senha fixa da trilha legada `db/*.py` continuam pendentes.

**Arquivos alterados:** `app.py`, `static/index.html`, `static/app.js`, `static/app.css`, `migrations/004_responsavel_padrao.sql`, `deploy/deploy_phase2_homolog.sh`, `deploy/deploy_phase2_production.sh`, `tests/production_config_smoke.py` e este relatório.
