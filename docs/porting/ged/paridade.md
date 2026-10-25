# GED nativo no Unificado — paridade após o corte

**Estado em 15/10/2026:** levantamento inicial. Construção e publicação somente **depois** de A6/C1/C2, sobre o banco GED já migrado. Nesta janela o GED atual continua em `/unificado/ged/`, em iframe de mesma origem, com login e visual próprios até D1. Este documento não autoriza troca de frontend, API, autenticação ou dados.

## Fonte de comparação

O frontend atual está em `infra/ged/app/frontend/src/app/`, com Next 16.2.4 e React 18.3.1; a API Express 4.22.1 está em `infra/ged/app/backend/`. O destino publicado, os papéis, as regras de aprovação e os downloads autenticados após o corte serão a linha de base. Fazer inventário de rotas e contratos novamente **após** restaurar o dump final.

| Jornada atual | Rotas/telas encontradas | Paridade a verificar no GED nativo |
|---|---|---|
| Acesso | `/login`, `/change-password`, `/dashboard`, `/users` | D1 sem segunda autenticação; sessão, expiração, usuários, papéis e auditoria preservados. |
| Documentos | `/documents`, `/documents/[id]`, `/approvals` | Busca, upload PDF, revisões, aprovação em dois níveis, publicação, obsolescência, ciência, permissões e downloads 401/403/200. |
| Calibrações | `/calibrations`, `/calibrations/label/[id]`, `/calibrations/verify/[id]` | Cadastro, anexos, etiqueta/QR impresso e verificação pública pelo domínio antigo durante os 12 meses de alias. |
| Tarefas | `/tasks`, `/tasks/[id]` | Atribuição, prazos, status, anexos e permissões. Tarefas continuam no GED nesta fase. |
| RNC legado | `/rnc`, `/rnc/new`, `/rnc/[id]` | Após C2, leitura com aviso; escritas respondem 410 e abertura nova segue para Qualidade. Não recriar escrita RNC no GED nativo. |

## Critérios de paridade

1. Comparar, com os **quatro usuários reais do GED** e contas de prova próprias, quais telas e ações cada papel alcança. Ricardo permanece `ADMIN_MASTER`, sem exceção individual que retire permissões.
2. Comparar registros, revisões, status, anexos e SHA-256 de uma amostra de documentos e calibrações contra o GED publicado depois de A6. Não alterar o banco para produzir a comparação.
3. Reexecutar A5: PDF, aprovações, obsolescência/caminho de versões, ciência, tarefa/anexo, limites 20/25/50 MB, falha de carimbo em PDF malformado e downloads autenticados.
4. Garantir URLs públicas e diretas existentes, sobretudo `/calibrations/verify/:id`; conservar redirect 302 por rota até confirmação dos QR impressos, documentos e links diretos. A mudança de frontend não muda esses contratos sem uma decisão própria.
5. Definir o contrato D1 de identidade, logout, autorização e auditoria antes de implementar o login único. O shell atual já é o contêiner visual; o GED nativo poderá substituir o iframe só depois de equivalência funcional, testes no celular/tablet e janela separada.

## Pendências para iniciar a construção

- Confirmar o modelo de frontend nativo e o contrato D1 depois do corte, com base no banco final e nas rotas efetivamente publicadas.
- Registrar endpoints e tabelas de cada jornada a partir da API e do banco já migrados, inclusive restrições de papel e arquivos fora de `public`.
- Criar plano de adoção e retorno independente do A6. **Nenhum arquivo desta frente é publicado em 15/10/2026.**
