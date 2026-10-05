# Operação paralela do sistema unificado — 05/10/2026

## Publicação

- URL: `https://concrefer.concretrack.com.br/unificado/`
- Versão: `0.6.0`
- Sistemas antigos continuam oficiais; não houve DNS, redirecionamento ou escrita neles.
- O ambiente novo não exibe faixa ou aviso de teste. `/unificado/testar/` permanece como área autenticada de suporte e relatos, fora do fluxo de entrada.

## Proteção dos dados

- Backup anterior às mudanças: bancos em `/var/backups/concrefer-unificado/20261005T005252Z`, fotos em `/var/backups/concrefer-unificado-fotos/20261005T005252Z` e versão em `/var/backups/concrefer-unificado/releases/0.5.12-before-parallel-20261005T005312Z`.
- Backup final, depois da limpeza sintética: bancos em `/var/backups/concrefer-unificado/20261005T012814Z` e fotos em `/var/backups/concrefer-unificado-fotos/20261005T012823Z`.
- Todos os dumps foram restaurados em base temporária e tiveram contagens conferidas; o arquivo de fotos foi extraído e teve hashes conferidos.
- Bancos: agenda horária, retenção integral por 48 horas e um diário por 30 dias. Fotos: agenda diária e retenção por 30 dias.
- Os backups continuam somente na VPS `2.25.163.32`; uma falha total dessa VPS também pode atingir os backups.
- O monitor roda a cada cinco minutos, registra transições de serviço/disco na tabela de relatos e alerta com disco a partir de 80%.

## Fotografia travada

Os scripts `refresh_mapa_snapshot.py` e `refresh_unificado_snapshots.py` recusam a mutação sem `--confirmacao-ricardo "RICARDO AUTORIZOU REFAZER A FOTOGRAFIA"`. A recusa foi testada na VPS. A fotografia não foi refeita nesta rodada.

## Comparação sob demanda

Executar da estação com os aliases SSH configurados:

```powershell
python scripts/compare_old_new_business.py 2026-10-01 --setores 1 2 3 4 --saida comparacao.json
```

O comando usa somente GET no Supabase/PCP antigos, consulta o PostgreSQL novo e classifica por chave de negócio: igual, diferente, só no antigo e só no novo. Não importa nem corrige dados. O relatório lembra que o novo elimina a duplicação antiga de defeitos.

Prova: 01/10/2026, Setor 1, retornou 77 chaves iguais do Mapa e 16 iguais do PCP, sem diferenças ou exclusividades.

## Evidência publicada

- Android Chrome e iPad Safari, retrato e paisagem: login único, HUB, Liberação S1, Inspeção e Relatório de Manutenção; PWA com nome `Concrefer Produção`, ícone próprio e nenhum host externo.
- Desktop: casca conferida em 1366×768 e 1920×1080.
- PCP: 24/24 páginas abriram em ADMIN, sem erro de página, chamada externa ou escrita inesperada; gravações de programação, circular S3/S4, produção, mão de obra, rateio, Mega e usuários passaram e foram limpas.
- Impressões: sete famílias deram PDFs iguais ao original, inclusive a ordem de todas as etiquetas comuns em 01/10.
- Tempo real: produção e manutenção atualizaram um segundo navegador em aproximadamente 0,4 segundo. Seis sessões simultâneas gravaram e enxergaram seis linhas, com máximo de 226 ms e zero erro.
- Segunda inspeção: toque real mostrou as opções e encerrou como RR (reaprovado) ou R (perda), preservando a primeira inspeção. Dashboards (18 casos), Tratativa e Histórico passaram na mesma fotografia.
- Contas e dados sintéticos foram removidos ao fim.

## Limitações restantes

A matriz funcional anterior certifica 24/24 fluxos por critérios de requisição, banco e cartão. Nesta rodada, apenas inspeção/segunda inspeção foi reescrita integralmente para toque real; os outros fluxos ainda dependem parcialmente de chamadas internas nos testes automatizados. O varredor dinâmico executou 29 ações sem host externo, mas a ação de compatibilidade legado da inspeção falhou no próprio instrumento e o WhatsApp usa uma suíte separada com o destino externo bloqueado. Por isso ainda não há evidência suficiente para declarar 100% operacional segundo o critério novo de toque real em todas as ações.
