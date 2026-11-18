# Alinhamento antes da fase 1

Os dois endpoints existem na versão publicada 1.4.6 e agora respondem 200
autenticados na porta 18446. As respostas reais estão em `api-smoke.json`.

- Acesso rápido: módulo publicado `quick_access.py` e registro idêntico no
  aplicativo isolado do Mapa. Aplicado somente o DDL publicado das duas tabelas.
  O seed pessoal do Osmar e as concessões da implantação original foram excluídos.
  Sem configuração pessoal, a resposta legítima é `enabled:false`.
- Armação: código publicado e dependências com os mesmos bytes, serviço próprio
  `unificado-homolog-armacao.service`, porta 13168, armazenamento próprio.
  Migrações publicadas `a1_20261029`, `a6_20261029`, `a6b_20261029`,
  `a6c_20261030` somente no PCP de homologação. A dependência adicional
  `unificado_auth.user_units` recebeu apenas o DDL publicado, sem atribuições
  de unidades a usuários. Não foi executada a migração IAM que semeia permissões.
- Bancos: `pcp_unificado_homolog_20261016` e `mapa_unificado_homolog_20261016`.
  Ambos tiveram dump verificado antes, conforme `results.json`.
- Cookie de homologação traduzido apenas no proxy para o nome esperado pelo
  código publicado de Armação, usando a chave de assinatura de homologação.
- Encaminhamento adicionado somente ao vhost 18446, com backup e `nginx -t`
  aprovado antes da recarga. Vhost de produção, arquivos e PIDs de produção
  comparados e inalterados. Não houve conexão a banco de produção.
- Serviço de Armação limitado a conexões locais; sem token de agente externo,
  sem envio de e-mail e sem destinos de armazenamento de produção.
- Concessões de telas, ações e vínculos de identidade preservados.

A primeira execução parou por falta de privilégio DDL do usuário de aplicação
do Mapa; a transação foi revertida e o arquivo do aplicativo restaurado antes
da execução corrigida com o administrador do banco **de homologação**. O primeiro
teste de Armação identificou a tabela `user_units` ausente; seu DDL publicado
foi aplicado ao mesmo banco já protegido pelo dump. Nenhum perfil foi alterado.
