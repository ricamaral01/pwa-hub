# Retomada da publicação: resposta aos dois impedimentos do checkpoint

Complementa `PROMPT_CODEX_PRODUCAO.md` e substitui o que ele dizia sobre Armação. O resto do prompt continua valendo, incluindo a autorização de publicar hoje. Use o backup `producao-20261120T170515Z`; refaça só o que mudou.

## Decisões

**1. Armação: não mexa na produção.**
- Minha decisão original era "Armação não está sendo usada em produção, deixe como está". O prompt errou ao escrever "continua desativada".
- **Não execute o UPDATE.** Os quatro registros de `armacao.configuracao_unidade` continuam `enabled:true` na produção.
- Como a candidata foi validada com Armação desabilitada, antes de publicar confira na homologação **com Armação habilitada** (ver item 3). Com Armação habilitada, a 1.4.30 deve mostrar as telas de Armação no menu, nas páginas de módulo e na busca **para os mesmos perfis que já as veem na 1.4.6 da produção**. Nem mais perfis, nem menos.
- Registre no relatório o que a 1.4.6 de produção mostra hoje de Armação, por perfil (só leitura).

**2. CQ: o FCK da produção fica em 25.**
- Não altere o FCK nem o DEFAULT da produção.
- A candidata não pode depender de FCK 35. Procure no pacote algum 35 fixo ligado a FCK; se houver, pare e me avise.

**3. Homologação igual à configuração da produção, só nesses dois pontos.**
- Faça e verifique o dump dos bancos da homologação que vai alterar.
- Na homologação, habilite as quatro unidades de Armação e coloque FCK 25, valor e DEFAULT, iguais aos da produção. Exporte as linhas antes, para poder voltar.
- Rode o gate 7/7, a matriz de 9 perfis e 72 casos e as 48 consultas da busca. Rode também as provas de certificados e PDF do CQ (histórico, emissão em PDF de visualização, sem gerar registro novo). Se precisar de registro de teste, só na homologação.
- **Deixe a homologação assim** (Armação habilitada, FCK 25), igual à produção. Não volte para 35.

## Ponto de verificação de novo

Siga direto para a Fase 3 se:
- os itens do checkpoint original continuam OK;
- a homologação com Armação habilitada e FCK 25 passou em tudo do item 3;
- nada mudou na produção desde o inventário (hashes e as linhas de Armação e CQ).

Se algo falhar, pare antes de tocar a produção e me explique.

## Publicação

Pelo seu delta, a publicação é **só frontend**: sem migração, sem concessão nova (o `alex` já tem tudo), sem reinício e sem Nginx. Mantenha assim. Se aparecer necessidade de qualquer coisa além dos arquivos estáticos do manifesto, pare e me avise.

Depois, siga as Fases 4 e 5 do prompt original. Sobre o login com senha, que você não consegue testar: registre no relatório como pendente para eu testar com a minha conta logo após a publicação.
