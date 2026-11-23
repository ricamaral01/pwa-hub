# Publicação 2.1.0 - escopo e autorização

Base aprovada: `53f77c6cd4026418ca33a09cb81dc0d6f4312e13`.
O usuário autorizou publicar a 2.1.0 e depois continuar o manual e a Ajuda em
branch separada, sem publicá-los em produção. Em 22/11/2026 autorizou também
“libere Laboratório para Francisco”.

## Pessoas e unidades

- Alex (`alex`), Marcelo (`marcelo`), Philippe (`philippe`) e Ricardo do Amaral
  (`user-ricardo`): sete telas de cada unidade, conforme lista nominal aprovada.
- Francisco Augusto (`francisco`, PCP 149): sete telas de Pederneiras; acesso LB
  técnico, incluindo leitura e lançamento. Nenhum acesso a Ribeirão.
- Ricardo Gonçalves (`ricardogoncalvesrb`, PCP 150): sete telas de Ribeirão;
  mantém os acessos LB admin de Noroeste que já possuía. Nenhum acesso a Pederneiras.
- Francielli Moura (`francielli.moura`): somente conferência dos acessos existentes
  de Noroeste, sem concessão nova.

As identidades de Francisco e Ricardo Gonçalves, já existentes em produção,
foram espelhadas na cópia da Central da homologação para testar as mesmas pessoas
e unidades. Nenhuma senha foi criada, impressa ou enviada ao navegador. As
concessões antes/depois e os IDs estão nos recibos de execução. Não foram
alterados papéis PL/PR nem concedidas unidades em outros módulos de produção.

## Artefato e dados

- Reutiliza o serviço, banco e pool existentes do Laboratório. Novos schemas
  `lab_cec_pederneiras` e `lab_cec_ribeirao` em `concretrack_postes`.
- O fonte validado na H conserva a guarda H. O artefato de produção troca
  exclusivamente o banco esperado e a mensagem correspondente, mantendo a
  recusa se a conexão apontar para outro destino. Migração H continua recusando
  produção.
- Os dois backends existentes recebem patches limitados; catálogo, menu e
  estáticos incluem as 14 telas aprovadas. Não copiar os classificadores de
  ambiente da homologação para produção. Armação e FCK existentes são preservados.
- A carga é um snapshot de massadas do ERP em transação somente leitura, sem
  migrar histórico de CP. Os oito IDs 70195 e 70990-70996 continuam explicitamente
  excluídos mesmo se a origem for corrigida posteriormente. Não importar fixtures.
- Não há sincronizador automático novo, serviço, worker ou pool adicional.
  A atualização contínua das massadas e o histórico ERP permanecem separados;
  esta publicação não declara que a carga inicial se atualiza sozinha.

## Capacidade e serviços antigos

Parada permitida somente pelos nomes da proposta aprovada. Suprimentos antigo
tem chamador ativo e permanece ligado. As sete paradas elegíveis e seus backups
estão em `execucao/stop.json`. Os quatro timers antigos explicitamente citados
no texto de `SERVICOS_ANTIGOS_PROPOSTA.html` são tratados separadamente:
`unificado-homolog-tarefas-{ged,notify,outbox,suprimentos}.timer`.

Só os timers do banco `qualidade_homolog_20261016` são candidatos. Aguardar os
oneshots terminarem naturalmente. Nenhum timer de produção nem fonte da
18446 entra nessa parada. Sem `disable`, remoção de contêiner, alteração de
`max_connections` ou encerramento de sessões por SQL. Após reboot, serviços
habilitados e políticas Docker podem trazê-los de volta: a folga deve ser
medida novamente; não houve autorização para torná-los permanentemente desabilitados.

## Backup e rollback

Backup de Lab, IAM de produção e IAM H, release atual, fontes afetados, unidades,
drop-ins, ambientes e Nginx. Dumps e configurações privadas ficam apenas no servidor.
Ensaiar a restauração em bancos temporários privados, conferir o arquivo da
release em diretório isolado e eliminar as bases de ensaio.

O comando independente de rollback fica dentro do próprio backup e deve passar
em `rollback_check`. Ele restaura os arquivos e concessões anteriores e reinicia
somente os dois serviços de produção envolvidos. Preserva os schemas novos para
não apagar lançamentos posteriores ao backup. O relatório final terá o comando
com o caminho real do backup.

Antes de publicar: gate H 7/7, acesso/recusa por unidade e folga de pelo menos 25
após os ajustes autorizados. Depois de publicar: gate, acessos, recusas de POSTs
com payload vazio, dados e hashes do artefato. Qualquer falha dessa verificação
dispara o rollback da publicação para 2.0.0.

O manual e a Ajuda não fazem parte deste artefato nem do PR do Laboratório.
