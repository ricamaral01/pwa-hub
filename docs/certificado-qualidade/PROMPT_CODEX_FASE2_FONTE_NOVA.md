# Prompt para o Codex — Fase 2: trocar a fonte para o Controle Estatístico NOVO

Use **depois** que o Codex terminar a execução do `PROMPT_CODEX.md` (relatório
`docs/certificado-qualidade/relatorio-execucao.md` gerado). Abra o Codex na raiz de `pwa-hub-fase1` e cole:

---

```text
EXECUÇÃO AUTÔNOMA — não me pergunte nada. Continuação do módulo Certificados de qualidade
(docs/certificado-qualidade/). Leia antes: certificado-qualidade-laboratorio.md e relatorio-execucao.md.

OBJETIVO
O certificado deve passar a buscar os resultados dos corpos de prova no Controle Estatístico NOVO
(o que roda na VPS nova / Unificado), e NÃO mais no Controle Estatístico antigo da VPS antiga.
As regras de negócio não mudam: resistência pela DATA DE PRODUÇÃO do poste = data de moldagem dos CPs;
média 3d/7d/28d por data; conforme se média 28d > fck; mais de um traço na data → maior média 28d.

PASSOS
1. Localizar o Controle Estatístico novo (código no repositório e banco na VPS nova): tabelas/views de
   CPs, data de moldagem, traço, idade, resistência individual, data de rompimento, unidade/fábrica.
   Documentar em docs/certificado-qualidade/fonte-controle-estatistico-novo.md.
2. Implementar a leitura como um ADAPTADOR de fonte, somente leitura, com a mesma interface usada hoje
   ("CPs moldados em <data>"), selecionável por configuração no servidor
   (ex.: CQ_FONTE_CP=novo | antigo). Nada de credencial no repositório.
3. Conferência antes da troca: para as datas de produção dos últimos 90 dias, comparar fonte antiga ×
   nova (nº de CPs, médias 3/7/28d, traço escolhido, resultado). Gerar
   docs/certificado-qualidade/comparacao-fontes.md com as diferenças. Diferença de valor não bloqueia a
   troca (a fonte nova é a oficial), mas datas que existem na antiga e faltam na nova devem ser listadas.
4. Certificados JÁ EMITIDOS não mudam: continuam mostrando a cópia fixa gravada na emissão.
   Rascunhos passam a recalcular pela fonte nova ao serem abertos.
5. Testes automatizados da nova fonte (mesmos casos da fase 1: > fck, maior traço, aguardando 28 dias,
   sem resultado, 1/5/6/10 datas em 1 página).
6. Commit, push, merge na main após testes verdes.
7. Deploy no :18446 com o procedimento já ensaiado (snapshot de permissões, backup, www-data, nenhum
   777/666, smoke, gate 7/7) com CQ_FONTE_CP=novo; emitir certificados de teste com 3 e 10 datas.
8. Produção: mesmo procedimento com CQ_FONTE_CP=novo. Se qualquer verificação falhar, voltar
   CQ_FONTE_CP=antigo (ou executar o retorno completo) imediatamente e registrar a causa.
9. Após 100% em produção: remover do servidor o acesso de leitura à VPS antiga usado pelo certificado
   (credencial/variável/rota), mantendo o código do adaptador antigo apenas para reversão, e registrar.

ÚNICA SITUAÇÃO PARA PARAR
O Controle Estatístico novo não tiver a data de moldagem dos CPs (ou equivalente que ligue o CP à data
de produção). Nesse caso: não trocar a fonte, manter a antiga em produção e relatar o que falta.

ENTREGA: docs/certificado-qualidade/relatorio-fase2-fonte-nova.md com fonte encontrada, comparação,
testes, commits, deploy, gate e estado final da configuração.
```
