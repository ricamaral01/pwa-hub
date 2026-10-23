# CEC Campinas na VPS nova

O controle estatístico de Campinas usa o banco PostgreSQL `controle_est_concre_campinas` e os serviços `cec-campinas-api` e `cec-campinas-worker` na VPS nova. O código desta pasta foi copiado da versão em produção em 23/10/2026, sem os arquivos de credenciais. A API escuta apenas em `127.0.0.1:3086`.

## Migração e virada de 23/10/2026

- Foi gerado um `pg_dump` somente de leitura da origem `controle_est_concre_db` e restaurado no banco isolado da VPS nova. SHA-256 do arquivo: `ccbbd0cd364070740f8c17ebdbebb9395e7b82ad9f01bd91522e5e5b4bb751eb`.
- Conferência antes da virada: 874 `rompimentos` e 6.431.682 `rompimentos_eventos` em ambos os bancos; o maior `created_at` das leituras era `2026-10-23 14:33:12.035775+00`.
- Leitura e cálculo estatístico foram exercitados em um banco de validação isolado na VPS nova.
- O ERP antigo mantém código, banco e permissões originais. Apenas o destino de `CONTROLE_ESTATISTICO_API_URL` passou a apontar, via `concretrack-api.service.d/cec-forward.conf`, para `https://concrefer.concretrack.com.br/cec-bridge/api/v1/rompimentos`.
- A ponte Nginx na VPS nova aceita somente o IP da VPS antiga. O ERP antigo continua aplicando sua autenticação antes do encaminhamento. A interface nativa do Unificado usa a sessão do Unificado e os endpoints `/unificado/mapa/api/usina/cec/`.

## Operação

Configuração de banco e serviço: `/etc/concrefer/cec-campinas.env` (modo 0600). Unidades systemd e trecho de Nginx estão em `deploy/`. O banco antigo deve ser mantido para consulta e eventual retorno até que a operação confirme leituras reais após a virada.

Para retorno do leitor antigo ao CEC antigo, remover somente `/etc/systemd/system/concretrack-api.service.d/cec-forward.conf` na VPS antiga e executar `systemctl daemon-reload && systemctl restart concretrack-api.service`. A interface nativa continuará consultando o banco da VPS nova. Se houver novas leituras após a virada, reconciliar os dois bancos antes de reativar a origem para evitar divisão dos dados.

## Limites atuais

As etiquetas nativas são geradas a partir de leituras já registradas no CEC. A geração prévia de etiquetas a partir das massadas do ERP é uma integração distinta, ainda não migrada para o banco novo. A validação de uma leitura real com a conta operacional antiga depende do uso do leitor em produção; a ponte, a API e a escrita com recálculo foram verificadas separadamente.
