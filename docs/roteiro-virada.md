# Roteiro da virada para o sistema unificado

Este é **somente o procedimento planejado**. Nenhuma parada, cópia final, alteração de DNS, instalação em tablet ou troca dos sistemas oficiais foi executada nesta etapa de testes. A virada depende de todos os critérios de `docs/relatorio-final-unificacao.md` marcados como **sim** e de uma janela combinada com a operação.

## 1. Preparação antes da janela

1. Registrar os endereços, IPs, TTLs, certificados, configurações dos serviços e horários de funcionamento atuais do PCP e do Mapa. Garantir acesso administrativo independente do domínio que será alterado.
2. Conferir o inventário das contas e os vínculos PCP–Mapa confirmados pelo Ricardo. Testar login, troca de senha e saída com contas de cada tipo, sem ler ou registrar senhas em texto.
3. Rodar a matriz final de API e E2E com fotografia recente: 73/73 chamadas, 24/24 fluxos do Mapa, 63/63 leituras da API PCP, 24 páginas PCP, PDF, CSV, XLSX, offline, tempo real e comparação visual dos tamanhos pedidos. Arquivar hashes, capturas, logs de teste e contagens.
4. Confirmar que os serviços unificados estão em `/opt/concrefer-unificado/`, executam sem root, possuem cópia diária restaurada em banco temporário e não dependem de arquivos em `/root/`.
5. Reduzir previamente o TTL do DNS que será usado na virada e documentar o valor original para reposição. Guardar a configuração de DNS atual para o plano de volta.
6. Comunicar a janela, as telas que ficarão indisponíveis e o procedimento de apontamento manual aos responsáveis de PCP, produção, qualidade e tablets.

## 2. Congelamento e última cópia na janela

1. Anunciar o início da janela e interromper novas gravações nos sistemas oficiais. Aguardar as ações em andamento terminarem. Registrar a hora exata da última gravação aceita em cada sistema.
2. Gerar backups finais independentes do PostgreSQL PCP oficial, da origem do Mapa e dos arquivos/fotos envolvidos. Fazer restauração de prova em bancos temporários e conferir contagens e checksums.
3. Refazer a fotografia isolada com `python scripts/refresh_unificado_snapshots.py --apply`, a partir das origens oficiais em somente leitura. Conferir manifesto, carimbo, contagens por tabela, registros mais recentes e vínculos de identidade reaplicados. Não publicar se houver diferença sem explicação.
4. Executar uma última bateria curta na rota de testes: login por tipo de conta, programação, liberação, concretagem, inspeção/foto, PCP, impressão e saída. Confirmar que toda gravação de prova fica somente no banco unificado e restaurar a fotografia final depois dos testes.

## 3. Publicação e DNS

1. Colocar a versão certificada do unificado em operação preservando a configuração e os backups dos oficiais para retorno. Conferir serviços sem root, certificados TLS, reverse proxy, cabeçalhos, sessão, filas e backups.
2. Alterar apenas os registros DNS previstos na janela para direcionar os acessos escolhidos ao unificado. Registrar hora, valores antigos e novos, propagação e certificado apresentado. Restaurar o TTL habitual depois da estabilização.
3. Manter os sistemas oficiais preservados para consulta/retorno conforme o plano operacional. Não permitir gravação simultânea divergente nos oficiais e no novo sistema.
4. Em cada tablet, fechar o aplicativo anterior, atualizar o atalho/endereço, limpar o cache ou service worker antigo quando necessário, entrar novamente e testar online/offline/reenvio com uma conta autorizada. Registrar quais aparelhos foram atualizados.

## 4. Conferência após a virada

1. Validar com usuários reais, sem divulgar credenciais: login único, perfis e módulos permitidos, primeiro acesso, troca de senha e saída completa.
2. Conferir, por setor, Programado (PCP), Realizado (Mapa), programação/desprogramação, liberação, concretagem por tipo, ODIN, manutenção, inspeção com fotos, montagem, RR e apontamento PCP. Comparar linhas e cartões com a fotografia anterior e verificar que as planilhas Google seguem só leitura.
3. Conferir FL-PRO-15, PCP Diário, etiquetas 95×40 mm, CSV e XLSX no equipamento de impressão e nos tablets. Confirmar data, tamanho físico e conteúdo.
4. Monitorar erros, filas offline, sincronização, tempo real, uso de CPU/memória, backups e acessos às antigas origens. Registrar cada divergência com hora e setor.

## 5. Plano de volta

1. Se um fluxo essencial falhar sem correção dentro da janela, suspender imediatamente novas gravações no unificado e registrar a hora do último lançamento aceito. Preservar o banco unificado e seus logs; não descartá-los.
2. Repor os valores DNS originais registrados no item 1, verificar a propagação e reabrir as gravações nos oficiais somente após conferir seus bancos e acessos.
3. Reverter os atalhos dos tablets para os endereços originais, limpar o cache do novo aplicativo quando necessário e conferir login e um fluxo de leitura por setor.
4. Conciliar manualmente, com responsável designado, qualquer lançamento aceito no unificado entre a última cópia e o retorno. Não copiar diretamente linhas conflitantes para o oficial sem revisão de IDs, horários, usuários, fotos e ordem dos eventos.
5. Guardar os dois conjuntos de backups, manifests e logs para análise. Documentar causa, alcance, lançamentos reconciliados e novos critérios antes de agendar outra janela.
