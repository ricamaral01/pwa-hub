# Usinas — espelho de receitas Campinas

Primeiro recorte da Etapa 2. A fonte oficial é `supervisorio_db.public.tbl_receitas`
na VPS antiga. O espelho foi testado em
`mapa_unificado_homolog_20261016.usinas.receitas` e publicado em
`mapa_unificado_teste.usinas.receitas`, banco usado pelo serviço oficial do
Unificado na VPS nova. As 42 colunas
de origem são copiadas sem recalcular traço, além de unidade, banco, ID,
`_source_hash` SHA-256 e instante de ingestão. Uma transação de snapshot na
origem e uma transação no destino fazem upsert e removem linhas ausentes. O
volume medido na origem em 22/10/2026 foi 265 linhas; por isso este recorte
usa varredura completa a cada ciclo. Outras tabelas precisarão estratégia
incremental própria.

## Arquivos

- `migrations/001_receitas_homolog.sql`: espelho, checkpoint e outbox inerte.
- `migrations/002_outbox_guard_homolog.sql`: bloqueio de novas operações e
  despachos enquanto a ação não estiver aprovada.
- `migrations/003_receitas_producao_leitura.sql`: espelho oficial sem outbox,
  com SELECT para a API e DML somente para o sincronizador.
- `sync_receitas.py`: leitura somente da origem e gravação somente do espelho;
  `--once --ids ID...` permite atualização imediata de registros confirmados.
- `tests/test_sync_receitas.py`: contrato do hash.
- `tests/test_receitas_read_api.py`: autorização e leitura da API nativa.
- `write_preflight.py` e `tests/test_write_preflight.py`: conferência read-only
  de `nome_traco` normalizado na fonte oficial antes de um futuro cadastro.
- `tests/integration_homolog.py`: teste de integração com origem sintética.
- `tests/probe_real_read.py` e `tests/verify_real_mirror.py`: acesso restrito
  e comparação da origem real com o espelho, sem imprimir conteúdo de linhas.
- `concrefer-usinas-homolog.service`: serviço isolado de homologação.
- `concrefer-usinas-prod.service`: ciclo oficial de leitura a cada minuto.
- `index.html`: tela nativa de consulta em Usinas, com busca, estado do
  espelho, detalhe, histórico de revisões e impressão simples.
- `nginx-usinas-homolog.conf`: proteção da tela pela sessão e permissão
  `usinasInicio` do Unificado.

## Execução prevista

O processo exige `USINAS_SOURCE_DATABASE_URL` para conexão de **leitura** ao
banco legado e `USINAS_HOMOLOG_DATABASE_URL` para conexão ao banco de teste.
Ele recusa destino cujo nome não corresponda exatamente a
`USINAS_EXPECTED_TARGET_DB` e confere que a origem é `supervisorio_db`
(`USINAS_EXPECTED_SOURCE_DB`). A conexão da origem força
`default_transaction_read_only=on`. As credenciais não pertencem ao repositório
nem aos argumentos de linha de comando.

```sh
python sync_receitas.py --once
python sync_receitas.py                 # um ciclo a cada 60 segundos
python sync_receitas.py --once --ids 123 124
```

O sincronizador usa TLS e transação somente leitura na origem. Os arquivos de
ambiente e as credenciais ficam fora do repositório. O papel da aplicação tem
apenas `SELECT` no espelho; somente o processo de sincronização o atualiza.
Revisar os privilégios herdados do banco antes de classificar uma conta como
estritamente sem escrita.

A primeira carga real trouxe 265 linhas. `verify_real_mirror.py` comparou
IDs, hashes e as 42 colunas de origem: 0 faltantes, 0 extras, 0 divergentes.
Há ciclos separados de 60 segundos nos bancos de homologação e produção do
Unificado. A API Mapa expõe `GET /unificado/mapa/api/usina/receitas`, após
validar sessão e permissão `usinasInicio`. O papel `mapa_api_login` recebeu
`USAGE` em `usinas` e `SELECT` em `usinas.receitas` e `usinas.sync_status`
nos dois bancos. A tela `/unificado/usinas/` usa a mesma sessão,
mostra as cartas do espelho e atualiza a consulta a cada minuto. O detalhe
permite navegar entre revisões e imprimir a composição com os rótulos e
unidades do legado de Campinas. As resistências exibidas são os valores
cadastrados, sem integração das médias de ensaios. Nenhum endpoint ou controle
de edição foi publicado. A tela responde 403 e a API 401 sem sessão.

Para suspender um espelho, parar o serviço correspondente e seguir o registro
operacional de reversão. As receitas oficiais não são alteradas pela suspensão.

A outbox e as três flags (`criar`, `nova_revisao`, `alterar_ativa`) estão
desligadas. Não existe worker de despacho nem endpoint de edição do Unificado.
Esses itens dependem da solução de autenticação delegada, idempotência no
endpoint legado e conflito atômico. `espelho_rw` não foi criado.

Pederneiras e Noroeste continuam fora deste recorte. Em 23/10/2026, não havia
fonte de leitura autorizada para espelhar as receitas de Pederneiras com o
acesso atual; para Noroeste, o contrato de unidade e a interpretação dos
materiais ainda precisam de validação. A decisão atual mantém origem e
permissões intactas. Isso também impede ativar edição com os contratos legados
disponíveis. Nenhuma instância adicional foi ativada.

## Campinas: CEC, relatórios e estoque

O menu de `https://dautomacao.com/concretrack/` abre estas três áreas. A tela
de Usinas no Unificado oferece links identificados para seus menus originais,
em nova aba; eles continuam usando a autenticação e as permissões do ERP antigo.
Isso mantém o acesso operacional enquanto a migração de dados e funções não
está concluída. Os links não representam integração de sessão, dados ou escrita.

| Área | Telas existentes na origem | Fonte necessária para paridade no Unificado |
|---|---|---|
| Controle estatístico (CEC) | leitura, resultados, etiquetas, análise, relatório | banco `controle_est_concre_db`, API CEC e vínculo com massadas/QRCP |
| Relatórios gerenciais | cartas de traço, consumo, custos, exportação, fechamento mensal e diário, produção por período, reports diários | massadas, receitas, movimentos de estoque, custos, paradas, PCP/Mapa e fontes externas do fechamento |
| Controle de estoque | entrada, saldo, relatório, consumo, consumo de cimento, mapeamento de agregados, acerto | materiais, movimentos, silos, configuração do misturador e massadas |

O papel de espelhamento atual possui `SELECT` apenas em `tbl_receitas` de
Campinas. A base nova possui somente `usinas.receitas` e `usinas.sync_status`
para este módulo. Portanto, nenhuma das três áreas dispõe hoje de dados
completos e atuais no Unificado. O contrato de escrita do ERP/CEC também não
oferece autenticação delegada e proteção atômica contra duplicatas e conflitos
para a migração funcional das ações. Com a decisão de não alterar a origem nem
suas permissões, essas funções permanecem no ERP antigo.

O inventário de telas, rotas, tabelas, fórmulas e integrações está em
`docs/porting/usinas/`. Para retomar a implementação nativa, é preciso definir
uma fonte de leitura autorizada para cada banco/tabela sem alterar a origem e
um contrato de escrita seguro para cada ação. Até então, não publicar saldos,
estatísticas ou fechamentos calculados só com receitas: seriam incompletos.
