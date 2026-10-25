# C1 — ensaio isolado das RNCs

**15/10/2026.** Exportação feita do GED **restaurado no destino**. Importação executada somente no banco `qualidade_c1_ensaio`, criado com o schema e os cadastros da Qualidade. O banco `qualidade` oficial permaneceu com **0 NCs legadas e 0 eventos IMPORTACAO**. Nenhuma escrita no GED antigo, DNS ou domínio antigo.

O mapa de unidade deste ensaio atribuiu **Pederneiras provisoriamente às três RNCs**. Ricardo depois confirmou **Campinas** e `user-ricardo` para as três; o mapa final da C1 deve substituir o provisório e ser conferido contra o dump final. Nenhum usuário foi pareado automaticamente por nome ou e-mail; os UUIDs GED originais estão no JSON do evento.

| GED restaurado | Qualidade no banco de ensaio | Unidade provisória |
|---|---|---|
| **RNC-2026-0001** — Poste quebou na extração; `ABERTA`, `ALTA` | **NC-2026-0001** — `REGISTRADA`, `MAIOR`; `id_legado=02b10424-73f9-42ce-b8ee-8454f3b45ac8` | Pederneiras |
| **RNC-2026-0002** — Cliente reclama que o poste está trincado; `ENCERRADA`, `MEDIA` | **NC-2026-0002** — `ENCERRADA`, `MENOR`; `id_legado=1cc06746-f92f-4252-a3ea-9deffee26166` | Pederneiras |
| **RNC-2026-0003** — Cliente reclama que o poste está torto; `ABERTA`, `MEDIA` | **NC-2026-0003** — `REGISTRADA`, `MENOR`; `id_legado=69919d1f-195c-446e-a104-6f47247106ff` | Pederneiras |

Contagens de origem: `rnc_reports=3`, `rnc_root_cause_analyses=0`, `rnc_action_plans=0`, `rnc_effectiveness_reviews=0`, `rnc_history=9`, `rnc_attachments=0`. Destino de ensaio: **3 NCs legadas**, **9 eventos históricos** e **3 eventos IMPORTACAO** com JSON original das seis tabelas. A segunda execução reutilizou as três NCs sem criar novos eventos nem consumir números. Código: [c1_migrate_rnc.py](../../../scripts/porting/c1_migrate_rnc.py), [c1_prepare_ensayo.sh](../../../scripts/porting/c1_prepare_ensayo.sh).

**Para a janela C1:** reexportar após o dump final, recontar, confirmar unidades e mapa de usuários, validar anexos novos se surgirem e só então migrar ao banco oficial junto de C2. O script agora prepara os anexos em diretório próprio, verifica tamanho e SHA-256 e grava `storage_path` relativo, compatível com o download autenticado da Qualidade; esse ramo ainda não foi exercitado porque a fonte tem zero anexos RNC. O alvo oficial exige `--target qualidade --commit-production`, diretório oficial de anexos e conexão `QUALIDADE_C1_DSN` apontando ao banco `qualidade`; nada disso foi executado no ensaio. Este ensaio não autoriza nem executa essa migração.

**Decisão atual para a janela:** após roteiro presencial aprovado, apresentar a Ricardo a lista final das sete NCs sintéticas atuais, do rascunho sem número e das NCs `TESTE` do roteiro que serão removidas, e aguardar seu OK. Se o GO das 19h permitir corte hoje, limpar entre 20h15 e 20h35: backup, ativar o bloqueio técnico, executar a limpeza aprovada com anexo e linhas vinculadas, zerar o contador e conferir. Manter o bloqueio técnico de `RASCUNHO → REGISTRADA` para todos até a C1; nesse intervalo smokes só criam e descartam rascunhos. **Antes de C1**, confirmar contador zero e ausência de NC numerada; qualquer desvio bloqueia a migração. Com a fonte ainda em três RNCs, C1 em transação única atribui `NC-2026-0001`–`0003` e preserva os códigos GED em `numero_legado`.

| RNC GED | Unidade confirmada por Ricardo | Usuário Unificado correspondente confirmado por Ricardo |
|---|---|---|
| `RNC-2026-0001` | **Campinas (`campinas`)** | **Ricardo (`user-ricardo`)** |
| `RNC-2026-0002` | **Campinas (`campinas`)** | **Ricardo (`user-ricardo`)** |
| `RNC-2026-0003` | **Campinas (`campinas`)** | **Ricardo (`user-ricardo`)** |

**Decisão de 15/10:** Ricardo confirmou as seis correspondências acima para o corte antecipado de **15/10/2026**. `campinas` foi cadastrado no banco Qualidade pela migration aditiva `20261015_04`, após ensaio isolado e backup fresco; o ensaio antigo em Pederneiras continua apenas como evidência histórica. O [mapa confirmado](C1-mapa-confirmado.json) atribui `campinas` e `user-ricardo` como **responsável de destino** a cada RNC; não reescreve a autoria histórica GED, preservada no JSON original. Conferir os IDs GED do dump final e repetir a comparação lado a lado antes da importação oficial. A C1 só prossegue após o GO das 19h e a limpeza aprovada.

**Novo ensaio isolado com o mapa confirmado:** exportei novamente as três RNCs do GED restaurado no destino e importei no banco separado `qualidade_c1_campinas_ensaio`. As três linhas ficaram, em ordem, `NC-2026-0001` `REGISTRADA`, `NC-2026-0002` `ENCERRADA` e `NC-2026-0003` `REGISTRADA`, todas em `campinas` e com `responsavel_id=user-ricardo`. Foram gravados 12 eventos (9 históricos e 3 IMPORTACAO). A segunda execução preservou 3 NCs, 12 eventos e contador 3. [Relatório JSON do ensaio](C1-campinas-ensaio-result.json). O banco oficial permaneceu sem RNC importada.
