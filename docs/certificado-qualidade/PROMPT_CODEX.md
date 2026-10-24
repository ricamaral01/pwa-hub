# Prompt para o Codex — Certificado de Qualidade (execução completa)

Abra o Codex na raiz de `C:\Users\Admin\Documents\pwa-hub-fase1` e cole o bloco abaixo.

---

```text
EXECUÇÃO AUTÔNOMA — não me pergunte nada. Todas as decisões de negócio estão na especificação. Execute
do início ao fim: análise, código, testes, commit, push e deploy em homologação e produção.

FONTES (leia antes de começar)
- docs/certificado-qualidade/certificado-qualidade-laboratorio.md  → especificação APROVADA (v2 + decisões, seção 8)
- docs/certificado-qualidade/MAPEAMENTO_SISTEMA.md                  → sistema antigo (PWA + Apps Script + Sheets)
- docs/certificado-qualidade/mockups/png/  01-emitir · 02-historico · 03-certificado-a4 (10 datas) ·
  03b-certificado-a4-poucas-linhas (3 datas)
- docs/certificado-qualidade/mockups/fonte/ → HTML de referência visual (layout, textos, cores, tamanhos).
  NÃO copie o formato .dc.html nem support.js; implemente no padrão do Unificado.
- docs/laboratorio-unificado-implantacao.md e docs/laboratorio/ → como o módulo Laboratório roda hoje.
- Sistema antigo (somente leitura): C:\Users\Admin\Documents\certificado-qualidade (index.html,
  AppsScript_certificado.gs, logo-concrefer.png).
- Assinatura do engenheiro: C:\Users\Admin\Documents\certificado-qualidade\assets\assinatura-marcelo.png
  (NUNCA commitar; enviar à VPS para diretório protegido fora de public, só leitura do serviço).

O QUE CONSTRUIR
Módulo "Certificados de qualidade" dentro do Laboratório do Unificado, substituindo o PWA separado.
Telas 01 (emitir) e 02 (histórico) iguais aos mockups; PDF A4 igual a 03/03b, gerado no servidor.

REGRAS DE NEGÓCIO (obrigatórias, já decididas)
1. Resistência pela DATA DE PRODUÇÃO do poste: buscar no Controle Estatístico (VPS antiga, SOMENTE
   LEITURA) os CPs moldados nessa data. Por data: nº de CPs, média 3d, 7d, 28d.
2. Conforme quando média 28d > fck (35 MPa padrão, parametrizável). Sem critério de mínimo.
3. Mais de um traço na mesma data: usar o de MAIOR média 28d; gravar qual traço foi usado.
4. Situações por data: conforme / aguardando 28 dias (mostrar data prevista) / não conforme (bloqueia)
   / sem resultado (bloqueia). Pendente → só rascunho.
5. Até 10 datas de produção por certificado, sempre UMA folha A4. Rodapé ampliado (QR maior, título
   "Documento emitido eletronicamente", assinatura maior) quando ≤ 5 datas; compacto de 6 a 10.
   Acima do que cabe numa folha: bloquear emissão com mensagem, nunca gerar 2 páginas.
6. PDF: tabelas centralizadas, coluna Modelo larga (~38%, nomes até 2× "DT 11/300"), tabela de
   resistência SEM coluna Traço, sem seção Parecer, Normas + Prensa num quadro compacto.
7. Engenheiro responsável FIXO: Eng. Marcelo Eduardo Ishizaki de Sousa · CREA 5063392251, nome impresso
   + imagem da assinatura. Responsável pelo laboratório: escolha entre Ricardo Do Amaral e Philippe
   Augusto (nome impresso; imagem só quando cadastrada). Assinatura só no PDF EMITIDO; rascunho e
   pré-visualização sem assinatura e com marca "RASCUNHO".
8. Prensa de aferição: cadastro cq_prensas (fabricante, modelo, série, patrimônio, kN, classe, nº
   certificado de calibração, laboratório RBC, data calibração, validade). Escolhida na emissão; dados
   copiados para o certificado; calibração vencida bloqueia emissão.
9. Numeração: novos = CQ-AAAA-NNNN sequencial por ano, gerado no banco sem colisão. Antigos importados
   do Sheets mantêm o número original.
10. Emitido = travado + cópia fixa dos resultados (cq_resultados_data) + hash do PDF. Correção = nova
   revisão; anterior vira "Substituído".
11. Permissões: EMITIR = todos os perfis com acesso ao Laboratório. CORRIGIR (revisão) = somente os
   usuários Ricardo, Alex, Philippe e Marcelo (mapear para os IDs reais do Unificado; se algum não
   existir, registrar no relatório e seguir com os existentes).
12. QR + link /v/<numero> no PDF; a página pública de verificação está fora do escopo (rota pode
   responder "em breve").

SEGURANÇA
- Autenticação/permissões do Unificado; validação no servidor; nada de dados em HTML inline/onclick.
- Acesso à VPS antiga por usuário/endpoint read-only; credenciais só em variável de ambiente/arquivo
  protegido no servidor, nunca no repositório. Não usar a senha fixa encontrada em db/*.py do sistema
  antigo; registrar no relatório que ela deve ser trocada.
- Não alterar outros módulos, manifesto/service worker do Unificado nem o serviço oficial do laboratório.

ORDEM DE EXECUÇÃO (sem paradas para aprovação)
1. Branch feat/laboratorio-certificado-qualidade a partir da main atualizada.
2. Mapear o Controle Estatístico na VPS antiga (só leitura): tabela/view de CPs, data de moldagem,
   traço, idade, resistência, data de rompimento. Criar a leitura read-only (view ou endpoint).
3. Banco: migração só de adição, idempotente, com script de reversão (cq_certificados, cq_itens,
   cq_resultados_data, cq_prensas, cq_parametros, cq_modelos_poste, sequência por ano).
4. Backend (API) + telas + PDF no servidor (WeasyPrint ou o gerador já usado no Laboratório) +
   cadastros de prensa, modelos e parâmetros + menu do Laboratório.
5. Importar o histórico da aba "certificado" do Sheets (somente leitura da planilha), preservando número,
   e o mapa de resistências quando existir.
6. Testes automatizados: regra > fck, maior traço, datas pendentes/sem resultado, 1/5/6/10 datas no PDF
   (1 página sempre), numeração concorrente, revisão, permissões de correção, calibração vencida.
7. Commit(s) no padrão tipo(modulo): descrição; push da branch; merge na main após testes verdes; push.
8. Deploy no :18446 com o procedimento já ensaiado (snapshot de permissões, backup do banco, cópia
   preservando dono/modo, verificação www-data, nenhum 777/666, smoke, gate 7/7).
9. Homologação automática: emitir no :18446 certificados com 3 e 10 datas usando dados reais do
   Controle Estatístico; comparar 10 certificados antigos (mesmas datas) com o resultado novo; gerar os
   PDFs e conferir que cada um tem exatamente 1 página.
10. Produção: mesmo procedimento. Se QUALQUER smoke, gate ou verificação falhar, executar o retorno
   imediatamente, sem tentar corrigir em produção, e registrar a causa.

ÚNICA SITUAÇÃO PARA PARAR
Bloqueio que impeça continuar sem inventar dados (ex.: credencial da VPS antiga inexistente,
Controle Estatístico sem a data de moldagem). Nesse caso: concluir tudo o que não depende do bloqueio,
publicar no :18446 com o módulo indicando "fonte indisponível", NÃO publicar em produção, e relatar.

ENTREGA FINAL: docs/certificado-qualidade/relatorio-execucao.md com arquivos criados/alterados,
migrações, commits e hashes, resultado dos testes, PDFs de exemplo (1 página), evidências de
homologação e produção, gate, links finais e pendências.
```
