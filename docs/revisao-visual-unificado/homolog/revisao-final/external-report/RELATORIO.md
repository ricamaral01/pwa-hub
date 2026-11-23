# Fechamento diário de Usinas — dependência externa

Decisão do usuário: manter a dependência pública existente, somente por GET,
sem copiar manifesto ou relatórios, alterar constantes ou reiniciar serviços.
Produção e homologação dependem de **dautomacao.com**.

A matriz permite exclusivamente o prefixo
`https://dautomacao.com/concretrack/relatorios/reports-diarios/generated/pcp-producao/`.
Outros endereços externos e métodos continuam reprovando. Há testes negativos
para domínio semelhante, HTTP, caminhos fora do prefixo e travessia codificada.

Na candidata local, a tela consulta o manifesto existente, seleciona a data
solicitada ou a primeira disponível e verifica a disponibilidade pelo endpoint
existente e a conexão do navegador antes de abrir o HTML original no iframe. Falhas mostram texto simples
e botão “Tentar novamente”; o iframe fica oculto durante a falha.
Nenhum endpoint, formato, regra, permissão ou constante de servidor foi alterado.

## Evidências

- [Cenários controlados](fixtures.json): navegação inicial, troca de data,
  relatório ausente, falha da origem, falha de conexão do navegador,
  falha do manifesto e lista vazia.
  Conteúdo sintético identificado explicitamente; não comprova dados reais.
- [Consulta real na 18446](live.json): a indisponibilidade foi apresentada com
  mensagem legível e ação para tentar novamente; capturas 1440 e 390 anexadas.
- Consulta GET ao relatório público de 30/10/2026: HTTP 200, 132675 bytes.
  O conteúdo não foi salvo como cópia local.
- Esse HTML referencia uma folha de ícones em
  `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.47.0/tabler-icons.min.css`.
  Ela está fora do prefixo autorizado e continua bloqueada/reprovando na matriz.
  Não foi criada exceção adicional nem baixada essa folha. A referência foi
  identificada pela leitura do HTML permitido.
- Na 18446, tanto `manifest` quanto `report/2026-10-30` retornaram HTTP 503,
  com mensagens públicas de indisponibilidade. Não houve abertura real nem
  troca de data comprovada nessa instância.
- Leitura de `systemctl show unificado-visual-homolog-mapa.service`:
  `IPAddressAllow=127.0.0.0/8 ::1/128` e `IPAddressDeny=0.0.0.0/0 ::/0`.
  Fora do serviço, GET por curl e urllib no mesmo servidor retornaram 200.
  O bloqueio de saída do serviço explica a indisponibilidade do proxy existente.

Nenhuma configuração foi alterada. O teste real permanece reprovado e impede
afirmar que o fluxo completo foi validado. Resolver essa restrição do serviço
exigiria uma decisão adicional, pois a orientação atual proíbe reinício e não
autoriza mudança de infraestrutura. A exceção da matriz, sozinha, não modifica
as restrições de rede do serviço.

## Revisão das capturas

Capturas dos cenários controlados e da indisponibilidade real foram conferidas
em 1440 e 390. A interface permanece legível, sem página vazia, códigos HTTP ou
erro técnico. A renderização e troca de data do documento real continuam pendentes.
