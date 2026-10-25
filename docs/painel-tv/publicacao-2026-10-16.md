# Painel TV — publicação em 16/10/2026

**Estado atual: publicado às 20h09.** Houve uma primeira tentativa revertida às 20h05: o gate após criar `tv-producao` ficou 6/7 porque a prova de logout do Mapa avançou com cookies ainda presentes. O mesmo teste falhou após restaurar os arquivos e desativar a conta, e passou isoladamente. A prova foi reforçada para exigir a resposta HTTP 200 de `/logout` antes de verificar o bloqueio; o gate passou 7/7 duas vezes no estado restaurado. A segunda publicação passou 7/7 antes e depois da reativação da conta. O backup da primeira tentativa também foi preservado em `/opt/concrefer-unificado/backups/painel-tv-20261016T230242Z/`.

**Endereço de produção atual:** https://concrefer.concretrack.com.br/unificado/tv/formas/?unidade=campinas

O painel foi publicado na VPS nova `2.25.163.32` após a [conferência de dois dias e as capturas no teste](conferencia-homologacao.md). A página é uma tela cheia independente da casca, com carrossel Visão geral (30 s) → setores 1 a 4 (20 s cada), pausa, setas, atualização a cada 60 s e último dado preservado se a API falhar.

## Troca e recuperação

- Backup anterior à publicação mantida: `/opt/concrefer-unificado/backups/painel-tv-20261016T230909Z/`. Contém os sete arquivos/vhost anteriores com SHA-256 e dumps custom dos bancos Mapa e PCP. O script `scripts/painel-tv/rollback-prod.sh` restaura os arquivos/Nginx e desliga somente o serviço novo da TV; os dumps não foram restaurados sobre bancos ativos.
- `nginx -t` antes e depois da troca: aprovado. Os avisos preexistentes de opção de protocolo e nome de servidor duplicado persistem.
- Serviço novo `unificado-tv.service` em `127.0.0.1:13181`; a role `tv_prod_reader` tem `default_transaction_read_only=on` e `SELECT` apenas nas três tabelas Mapa e seis tabelas PCP necessárias. O API HTTP não executa gravação.
- O Mapa auth recebeu somente a sessão exclusiva de 30 dias para `tv-producao`, com renovação pelo endpoint de sessão existente. Catálogo e menus receberam `Painel TV — Formas`; a permissão é explícita para outros usuários. Nginx ganhou somente as rotas da TV e do resumo.
- API, HTML e JavaScript da TV em teste e produção com SHA-256 idênticos: API `cc218d09d26b43571b54885447e64e5c57b70663752208e1951c81403b9bbfbb`, HTML `2607d25afa297f3bc836d54052b3344a9ea783c8b614e60f029188d5bfd45d9d`, JS `421b0228589fb012480496c5860ca2fb30abffee51cc2f7df4c256d4e3c4caa3`.

## Resultado

- Gate pré e pós da segunda publicação e após reativar a conta: **7/7**. Smoke autenticado em produção: página/API 200, quatro setores, data local 16/10, carrossel e Pausar funcionando, sem erro JavaScript. A API local respondeu 200 em 1,9 ms com cache.
- O menu Modelo A mostrou `Painel TV — Formas` para Ricardo e abriu a tela cheia em uma nova aba; a mesma entrada ficou oculta para uma conta sem concessão. Acesso anônimo à TV: 403. Consulta fria do resumo: 34,9 ms e HTTP 200, abaixo do limite de 500 ms.
- Conta de serviço `tv-producao` ativa, criada pelo fluxo de usuários, perfil Convidado, somente `tvFormas` com ação `view`. TV/API 200; PCP 403; Produção 403; Qualidade 401; sessão renovada para 30 dias. Não há vínculo GED em produção. A senha foi gerada sem registro em relatório; Ricardo pode redefini-la na tela de usuários para instalar a TV.
- A unidade `ribeirao` retorna 422 até existir fonte própria. O Setor 2 mostra 86 formas cadastradas e o aviso de que Ricardo confirmou 87, sem inventar o código faltante. As divergências PCP × Mapa são expostas, e eventos Mapa sem programação oficial nos setores 3/4 não são somados ao programado.

**Limite:** o PCP não identifica cada forma nos setores 1/2; o Mapa complementa apenas a identificação visual, com alerta quando diverge da quantidade oficial. Tipos das formas pendentes sem produto apontado não são deduzidos. O volume realizado é estimado pelo cadastro do produto e identificado assim na tela.

## Acesso simplificado da TV — 16/10/2026, 20h55

A pedido de Ricardo, a conta adicional `tv` foi criada no teste isolado e em produção com a senha solicitada. O provisionamento pontual em [provision_tv_login.py](../../scripts/painel-tv/provision_tv_login.py) preservou as regras gerais do cadastro (login mínimo de 3 caracteres e senha mínima de 6) e gravou somente o perfil `CONVIDADO`, a tela `tvFormas` e a ação `view`; não há concessão para outros módulos. O Mapa auth foi ajustado apenas para dar a `tv` a mesma sessão renovável de 30 dias de `tv-producao`. A conta anterior foi preservada.

Backup de produção antes da alteração: `/opt/concrefer-unificado/backups/tv-login-20261016/` (dump custom do banco Mapa e cópia do `app.py`). O gate pré falhou uma vez no caso de logout do Mapa já intermitente e passou 7/7 na repetição antes da troca. O gate pós passou **7/7**. Login real `tv` na tela da TV: teste e produção exibiram indicadores no navegador; página e API HTTP 200, PCP e Mapa 403, Qualidade 401, sessão 30 dias. A senha curta foi solicitada expressamente para esta conta de leitura e deve ser conhecida apenas por quem opera a TV.

## Atualização Campinas e fonte Mapa — 16/10/2026, 21h49

Ricardo corrigiu a unidade para **Campinas**, confirmou as abas 20 (Setor 3) e 22 (Setor 4) como programação oficial, e escolheu o **Mapa** como fonte do Realizado, com divergência contra a planilha exibida. O código passou primeiro no teste isolado. Backup anterior à troca: `/opt/concrefer-unificado/backups/tv-mapa-pcp-20261016-2145/`, com arquivos, `.env` e dump custom do banco PCP validado por `pg_restore -l`. Nenhum arquivo ou banco da VPS antiga foi tocado.

O PCP de produção agora seleciona o workbook de outubro pelo período solicitado. A importação de 16/10 gravou atomicamente **44** programações S3 e **29** S4; a lista dos 73 IDs está no backup para retorno seletivo. A TV mostra os apontamentos brutos do Mapa como **etiquetas**, sem tratá-los como formas físicas. O Setor 4 mostra **52 etiquetas** no Mapa, **42 postes** na planilha (diferença **+10**) e **9/29 formas conciliadas**. As 52 etiquetas ficam verdes na visão geral. A taxa é rotulada **Conciliação**; não se calcula 52/29 como percentual de produção.

Pré-publicação: smoke autenticado TV 200 e restrições PCP/Mapa/Qualidade preservadas, `nginx -t`, gate **7/7**. Pós-publicação: TV/API 200, navegador sem erro JavaScript, login `tv` com somente `tvFormas`, `nginx -t` e gate **7/7**. API, referência da planilha, JavaScript e dois arquivos do PCP têm SHA-256 idênticos aos do teste. [Capturas da visão geral](evidencias/campinas-16-10-visao-geral-producao.png) e do [Setor 4](evidencias/campinas-16-10-setor4-producao.png); [diagnóstico completo](diagnostico-campinas-2026-10-16.md).

**Limite atual:** a referência da planilha exibida foi conferida para 16/10; o PCP importa programação por ação manual, sem timer diário. As 37 formas físicas confirmadas do Setor 4 ainda não estão conciliadas com os 61 códigos do layout e as 52 etiquetas do Mapa. Para outros dias, a TV mostra o Mapa e só apresenta comparação com a planilha quando existir referência conferida.
