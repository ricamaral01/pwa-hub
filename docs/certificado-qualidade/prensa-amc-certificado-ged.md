# Prensa AMC 2TQC — certificado GED M-0397/26

**Aplicado em homologação e produção em 25/10/2026.** Fonte: [verificação pública no GED](https://concrefer.concretrack.com.br/unificado/ged/calibrations/verify/d06562a5-5e89-4e24-9c27-8ec786de86ff) e PDF **M-0397/26** disponível nessa página. O PDF foi lido e conferido visualmente antes do cadastro.

| Dado | Valor registrado |
| --- | --- |
| Prensa | AMC 2TQC, código GED 2TQC-226, série S/N |
| Capacidade | 0 a 1000 kN |
| Certificado de calibração | M-0397/26 |
| Emissor do certificado | Técnica Paraíso Ltda - EPP |
| Calibração | 10/07/2026 |
| Próxima calibração no GED | 10/07/2027 |
| Responsável padrão pelos certificados | Ricardo Do Amaral |

O PDF da prensa cita o **IPT, RBC Cal 0003**, como calibrador da **célula de carga usada como padrão**. Isso não prova acreditação RBC da Técnica Paraíso nem faz do IPT o emissor da calibração da prensa. Por isso, a interface e o PDF do módulo passaram a usar o rótulo **“Empresa/laboratório calibrador”**. A coluna interna `laboratorio_rbc` foi preservada para compatibilidade, com o emissor real do documento.

A AMC foi cadastrada **separadamente** da Kratos IK-14 A/P, série 2220879, certificado 2354/26, encontrada na base de ensaios. Nenhum dado da Kratos foi sobrescrito. Ela continua com calibrador não informado e emissão bloqueada se for selecionada. O PDF M-0397/26 pertence à AMC e não pode servir para completar a Kratos.

O PDF do GED foi anexado pelo endpoint autenticado de calibração, fora da pasta pública do módulo. O download protegido foi comparado byte a byte com o original: SHA-256 `f8c36d455e917c33916c2b625085394bae1d3782e61fca8d0346fb60271d5bd5`. Em produção, a AMC é a prensa **#2**; na homologação, é a **#5**. O responsável padrão foi confirmado em ambos os ambientes como Ricardo Do Amaral. **Nenhum certificado de qualidade foi emitido nesta operação.**

Verificações: 17 testes de regras/API/PDF passaram; o teste do PDF usa os dados reais da AMC e confirma texto e página A4; `node --check` e `py_compile` passaram. Homologação e produção passaram no gate geral **7/7**. Backup de homologação: `/opt/concrefer-unificado/homolog/backups/cq-phase2-20261025T111626Z`; backup de produção: `/opt/concrefer-unificado/backups/cq-production-20261025T111734Z`. A configuração autenticada em produção retornou HTTP 200, `CQ_FONTE_CP=novo`, duas prensas e Ricardo como padrão.

Arquivos: `migrations/005_seed_prensa_amc_ged.sql`, `report.py`, `app.py`, `static/index.html`, `static/app.js`, scripts de deploy e `tests/configure_ged_press.py`.
