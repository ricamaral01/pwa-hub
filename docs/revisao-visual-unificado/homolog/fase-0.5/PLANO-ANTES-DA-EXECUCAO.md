# Fase 0.5 — plano antes da execução

## Origem e limites

Origem: arquivos efetivamente publicados em produção em 18/11/2026, junto da casca **1.4.6**. A identificação exata dos backends está em `backend-hashes.json`; não se presume que o número da casca identifique sozinho cada arquivo de API.

Somente os arquivos de produção serão lidos. Nenhuma conexão a banco de produção será aberta. As conexões de homologação foram conferidas por nome de banco e endereço local, sem imprimir credenciais.

Não será iniciada a fase 1 até o usuário aprovar o relatório da fase 0.5.

## Três telas e dependências ausentes

| Tela | Página | APIs existentes em produção e ausentes na homologação |
| --- | --- | --- |
| Números de série dos postes, Setor 3 | `pcp/numeros-serie/` | `/api/postes-series/*`: catálogo, previsão, saldos, execução, sincronização, confirmação e emissão/reimpressão de PDF |
| Programação da semana, Setores 1 e 2 | `pcp/programacao-semanal/` | `/api/programacao-semanal*` e `/api/programacao-semana/*`: versões, rascunho, itens, dias, parâmetros, validação e publicação |
| Programação de armaduras e seu relatório | `pcp/armaduras/` e `pcp/armaduras-relatorio/` | `/api/armaduras/*`: programação, calendário, relatório e emissão/reimpressão de PDF |

Serviços envolvidos:

- `unificado-homolog-pcp.service`, porta local **13154**: código `app/`, modelos e migrações copiados do PCP publicado. Esse serviço receberá as três APIs e será reiniciado apenas após backup, migrações e conferência de isolamento.
- `unificado-homolog-mapa.service`, porta local **13152**: apenas `screen_access.py` e `screen_catalog.json` publicados, necessários para reconhecer os IDs das três telas. O `app.py` isolado de homologação e seus cookies/endereços próprios serão preservados. Nenhuma concessão individual ou perfil será editado.
- Casca e arquivos estáticos do PCP: cópias publicadas, sem redesign. A faixa de homologação será mantida. A versão continuará 1.4.6 nesta sincronização funcional.

Não é necessário alterar o Nginx: as localizações existentes encaminham os novos caminhos para o PCP e servem as páginas estáticas.

## Bancos e backups

- Migrações **somente** em `pcp_unificado_homolog_20261016`, endereço local.
- `mapa_unificado_homolog_20261016`: backup preventivo e leitura de sessões/perfis; **nenhuma migração prevista**.
- Os demais bancos de homologação não serão alterados.
- Antes de qualquer alteração: dumps em formato custom de ambos os bancos, inventário SHA-256, teste `pg_restore -l` e backup dos arquivos substituídos. Dumps permanecerão na VPS em diretório privado, fora do Git.
- As permissões SQL necessárias nas tabelas novas serão atribuídas ao papel técnico **já usado pelo PCP de homologação**. As instruções GRANT das migrações que citam o papel de produção serão direcionadas ao papel equivalente de homologação durante a execução; os arquivos das migrações permanecerão idênticos aos publicados. Não se alteram perfis nem permissões de negócio.

## Migrações publicadas a aplicar, na ordem

O banco PCP de homologação ainda não contém histórico Alembic nem o esquema `producao`. A cadeia publicada será executada sem alterar suas regras:

| Revisão | Arquivo | Efeito existente em produção |
| --- | --- | --- |
| `20261023_01` | `20261023_01_producao_unidade_expand.py` | Esquema de produção por unidade e vínculo da mão de obra à unidade |
| `20261023_02` | `20261023_02_producao_acesso.py` | Estrutura de vínculos usuário/unidade e observação na mão de obra; não concede acesso a contas |
| `20261023_03` | `20261023_03_maodeobra_grupo_unidade.py` | Chaves de grupo de mão de obra por unidade |
| `20261024_01` | `20261024_01_producao_operador.py` | Papel operacional já existente no domínio de produção |
| `20261027_04` | `20261027_04_ribeirao_unidade.py` | Unidade Ribeirão e passo de pessoas |
| `20261029_01` | `20261029_01_noroeste_unidade.py` | Unidade Noroeste e referência ao catálogo de Campinas |
| `20261029_02` | `20261029_02_dt15_setor4.py` | Tipos DT15 do Setor 4, sem inventar peso ou volume |
| `20261029_03` | `20261029_03_etiquetas_armaduras_fontes.py` | Estrutura de arquivos de origem das etiquetas de armaduras |
| `20261029_04` | `20261029_04_programacao_alex_reserva.py` | Campo de reserva do estoque Mega |
| `20261029_05` | `20261029_05_programacao_semanal_expand.py` | Versões semanais, dias, itens e parâmetros de programação |
| `20261029_06` | `20261029_06_programacoes_s12_unicas.py` | Consolidação de duplicatas e índice único S1/S2, com cópia interna das linhas removidas |
| `20261029_07` | `20261029_07_massa_concreto_2300.py` | Parâmetro publicado de massa estimada de concreto |
| `20261103_01` | `20261103_01_indicador_importado.py` | Estrutura de indicadores importados e peso próprio opcional |
| `20261105_01` | `20261105_01_dt15_setor3.py` | Transferência da programação futura DT15 para o Setor 3 conforme regra publicada |
| `20261105_02` | `20261105_02_forma_layout_dt.py` | Catálogo e posições físicas de formas DT |
| `20261111_01` | `20261111_01_armaduras_planejamento.py` | Calendário de trabalho e emissões de armaduras |
| `20261111_02` | `20261111_02_armaduras_codigo_10x2500.py` | Código 15298 do modelo Circular 10X2500, somente se ausente |
| `20261111_03` | `20261111_03_series_setor3.py` | Modelos, contadores anuais, referências, execuções e auditoria de séries; saldos de referência da migração publicada |
| `20261111_04` | `20261111_04_series_emissoes_pdf.py` | Emissões imutáveis de PDF de séries |

A pré-condição especial de `20261029_06` foi conferida por consulta somente leitura: homologação tem **54 grupos duplicados e 55 linhas excedentes**, exatamente os valores exigidos pela migração. Em caso de divergência ou falha de outra pré-condição, a transação será revertida; não se adaptarão os dados para forçar a migração.

Os campos de confirmação da mão de obra, metadados mobile, código de tipo de forma e ciclo de vida de usuários já existem na homologação. Não há migração manual adicional prevista para eles.

## Dependências e isolamento

Bibliotecas já presentes no ambiente publicado, mas ausentes no PCP de homologação: Alembic 1.14.1, Mako 1.4.3, MarkupSafe 3.0.4, ReportLab 4.4.4, Pillow 12.3.0, openpyxl 3.1.5 e et_xmlfile 2.0.0. Serão instaladas somente no ambiente Python de homologação, nas mesmas versões.

Serão preservados os arquivos de ambiente isolados de homologação. Endereços de bancos, cookies, portas, segredos de sessão e destinos de integração não serão substituídos pelos de produção. A origem de produção não será usada nos testes. As configurações de e-mail e de integrações externas de escrita permanecerão desativadas. A origem da produção do Mapa continuará sendo o endpoint local **13153**, sem serviço externo Supabase.

## Aceitação e retorno

1. Confirmar hashes dos arquivos publicados que serão copiados e guardar hashes/PIDs de produção para comparação posterior.
2. Fazer e verificar os backups; executar as migrações somente com o alvo de homologação validado.
3. Copiar arquivos por substituição atômica e reiniciar somente os dois serviços de homologação indicados.
4. Abrir as três telas na porta 18446; testar consulta e as ações permitidas aos perfis existentes de administração/gerência, PCP, produção e consulta, incluindo recusa das ações não permitidas.
5. Validar salvamento de programação e geração/reimpressão de PDFs com dados de teste, sem integração externa.
6. Rodar gate 7/7, comparar hashes/PIDs de produção e atualizar o documento oficial.
7. Commit e relatório próprios. Aguardar o ok do usuário antes da fase 1.

Se ocorrer falha, restaurar os arquivos de homologação e o estado de homologação a partir dos backups, com os serviços de homologação parados durante uma eventual restauração. Nunca restaurar dumps sobre bancos de produção.
