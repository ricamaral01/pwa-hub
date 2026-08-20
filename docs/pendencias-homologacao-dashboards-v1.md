# Pendencias de Homologacao - Dashboards V1

Status: controle para aprovacao SGQ
Ambiente: `mapa-concretagem-teste`
Data: 2026-08-20

## Pendencias obrigatorias antes da aprovacao formal

| ID | Pendencia | Impacto | Responsavel sugerido | Status |
|---|---|---|---|---|
| PH-001 | Definir codigo oficial, responsaveis, aprovadores, local oficial, retencao e distribuicao dos documentos. | Controle SGQ incompleto. | SGQ | Aberta |
| PH-002 | Confirmar escopo certificado e processos/unidades abrangidos. | Evita declarar cobertura indevida. | SGQ/Direcao | Aberta |
| PH-003 | Confirmar procedimentos internos relacionados e codigos reais. | Rastreabilidade documental. | SGQ | Aberta |
| PH-004 | Aprovar identidade oficial de producao, poste, inspecao, status e datas-base. | Deduplicacao e formulas. | Qualidade/Producao/TI | Aberta |
| PH-005 | Aprovar metas por indicador ou manter metas como proposta. | Evita meta ilustrativa virar regra. | Gestao/SGQ | Aberta |
| PH-006 | Definir regra final para `UNCLASSIFIED` e `Setor de Testes`. | Total e alertas setoriais. | Qualidade/Producao | Aberta |
| PH-007 | Definir perfis/alcadas para custos, detalhes e administracao. | Seguranca e RLS. | TI/Gestao | Aberta |
| PH-008 | Validar visualmente desktop, tablet, celular e TV. | Aceite de experiencia. | TI/Usuarios-chave | Aberta |
| PH-009 | Medir p50/p95 das RPCs em janela representativa. | Gate de desempenho. | TI | Aberta |
| PH-010 | Acompanhar dois periodos fechados. | PQ e estabilidade. | TI/Qualidade/Producao | Aberta |
| PH-011 | Coletar assinaturas de homologacao e liberacao. | Cutover formal. | SGQ/Direcao | Aberta |
| PH-012 | Decidir remocao de legado e CSS morto apenas apos aceite e backup marcado. | Evita perda de rollback. | TI | Aberta |

## Pendencias tecnicas nao bloqueantes para push

- O conector de navegador nao estava disponivel neste ambiente; validacao visual automatizada nao foi concluida.
- `git diff --check` global falha por arquivos pre-existentes fora desta entrega.
- Ainda existem `select("*")` em fluxos operacionais antigos fora dos dashboards refatorados.
- `supabase/.temp/` e gerado pela CLI e esta ignorado por `.gitignore`.

## Criterio de fechamento

Esta lista deve ser revisada em reuniao de homologacao. Cada item deve ser marcado como:

- aprovado;
- aprovado com ressalva;
- pendente com prazo;
- bloqueador de release produtiva.
