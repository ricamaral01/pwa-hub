# Alinhamento funcional ? gera??o isolada de teste

Publicado em 18/11/2026 na porta 18446. A vers?o visual permanece 1.4.8 neste marco; as fases 3?7 continuam em execu??o.

Foram provisionadas APIs com o c?digo publicado de Mapa, PCP, Arma??o, Log?stica, Suprimentos, Laborat?rio, CQ, Qualidade, Dosagem, relat?rios de Usinas, Carta Tra?o e CEC das duas unidades. GED usa a mesma imagem publicada de frontend e backend; mant?m seu banco e backend exclusivos de homologa??o. Hub e TV continuam nas inst?ncias de teste existentes.

As c?pias anteriores do Mapa e do Laborat?rio tinham uma depend?ncia compartilhada com a Carta Tra?o publicada. Por isso o alinhamento criou bancos e servi?os novos, sem modificar esses bancos ou servi?os anteriores. A lista autorizada est? em `docs/ambiente-homologacao-unificado.md`. Portas pr?prias 141xx, armazenamento pr?prio e bloqueio de sa?da externa nas unidades systemd. N?o foram iniciados sincronizadores contra produ??o.

Backups privados verificados precedem as altera??es. DDL aditivo veio dos esquemas de backups offline existentes, sem conectar em bancos de produ??o. Contas e concess?es individuais da homologa??o foram preservadas. As tr?s tabelas adicionais de slump, flow e umidade vieram do backup offline de Laborat?rio de 09/11. Noroeste CEC recebeu somente estrutura: n?o foram apresentados dados de Campinas como se fossem dessa unidade.

Nginx: backup do vhost de teste e snippets exclusivos `visual-full-*`; `nginx -t` passou antes do reload. O vhost de produ??o foi conferido por SHA-256 e permanece igual.

## Verifica??o neste marco

- Gate b?sico na 18446: **7/7**.
- APIs Mapa, PCP e cat?logos principais: respostas 200 nos probes de leitura registrados.
- Capturas iniciais: 26 telas nas quatro larguras, sem exce??es JavaScript no percurso.
- Auditoria de 893 arquivos de produ??o: nenhuma altera??o. Processos persistentes de produ??o sem mudan?a; tarefas oneshot tiveram ciclos naturais registrados separadamente.
- Alinhados 146 arquivos est?ticos publicados que estavam ausentes ou antigos fora dos arquivos protegidos das fases 1?2.

## Trabalho que permanece

A captura inicial identificou assets ausentes de Log?stica e Manuten??o, corrigidos pelo alinhamento est?tico posterior ? captura. Ainda ? necess?rio revalid?-los. Algumas leituras de produ??o/Mapa retornam 403 com o autorizador publicado; investigar o contexto de tela sem ampliar permiss?es. CEC Noroeste ainda n?o tem medi??es carregadas. As capturas iniciais n?o comprovam todos os fluxos de escrita, todos os perfis nem a conclus?o das fases visuais. N?o declarar paridade integral ou aprova??o final com base apenas no gate.

Os arquivos `generation-*.json`, invent?rio e SQL aditivo registram destinos, proveni?ncia e resultados sem credenciais. Dumps e configura??es privadas permanecem no servidor.
