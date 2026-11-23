# Fase 2 — casca e menu para revisão

**Versão 1.4.8**, somente na homologação:
https://concrefer.concretrack.com.br:18446/unificado/.
**Parada na fase 2. As fases 3–7 não foram iniciadas.**

## O que mudou

- Início com cabeçalho simples, faixa de quatro números, tabela de setores e
  lista de módulos. Celular apresenta os setores como listas com rótulos.
- Os números vêm das mesmas consultas PCP/Mapa já usadas na casca. Resumo
  exibe programado, realizado, realizado/programado e soma dos saldos positivos
  por setor. Ausência de fonte ou divisor zero fica como traço; não há meta
  inventada. Os zeros das capturas são os retornos reais da homologação no dia.
- Menu com ícones de traço, grupos em caixa normal e cinza, sem pontos ou
  contadores. Item ativo com traço laranja de 2px. Tablet usa trilho de 64px.
- Páginas de módulo com listas de telas, sem faixas coloridas, ornamentos,
  siglas como ícones, descrições genéricas ou setas diagonais. As buscas,
  agrupamentos, unidades, destinos e filtragem IAM existentes foram mantidos.
- Fontes e tokens compartilhados; paleta uniforme. O fonte React do Modelo A
  foi recompilado novamente com TypeScript e Vite.
- Login novo em duas colunas a partir de 1025px, mantendo os mesmos formulários,
  nomes de campos, ações, autenticação e controle de mostrar senha.
- Login de tablet/celular preservado, com comparação pixel a pixel.
- Versão, URLs de recursos e service worker atualizados. Arquivos públicos
  efetivamente enviados: `arquivos-alterados.txt` (101); hashes em `manifest.json`.

## Evidências

| Verificação | Resultado | Arquivo |
| --- | --- | --- |
| Início, Planejamento, Laboratório, Suprimentos e login nas quatro larguras | 20 capturas antes e depois; sem erro JavaScript, HTTP >=400, fonte externa ou rolagem lateral no corpo | `antes/`, `depois/`, `depois-results.json` |
| Acesso rápido | 4 capturas de prévia de componentes, identificadas na própria imagem | `depois/acesso-rapido-previa-*.png` |
| Perfis ADMIN/gerência, PCP, produção e consulta | Links visíveis pertencem ao IAM; busca funciona; três leituras PCP 200 por perfil | `acceptance.json` |
| Produção e consulta tentando editar semana/calendário | 403; sem alteração | `acceptance.json` |
| Dados do Início | Valores conferidos com respostas reais das mesmas APIs | `home-data.json` |
| Login 1024, 820 e 390 | Idêntico, exceto rodapé da versão | `login-comparison.json` |
| Build React e sintaxe | TypeScript/Vite aprovados; 12 JS verificados com Node | `syntax-and-pdf.json` |
| PDFs já emitidos na fase 0.5 | Reimpressão de séries e armaduras idêntica byte a byte | `syntax-and-pdf.json` |
| Atualização automática de cache | 1.4.7 → 1.4.8, sem limpeza manual | `service-worker.json` |
| Gate de fronteiras na 18446 | **7/7** | `gate.txt` |
| Produção e permissões | 394 arquivos originais iguais; PIDs e vhost iguais; contas e concessões preservadas | `final-audit.json` |

As capturas foram inspecionadas visualmente e comparadas com os HTMLs de
referência. A [galeria](galeria.html) reúne antes/depois e links para as referências.
O ZIP local `capturas-fase-2.zip` contém as capturas finais, sem credenciais.

## Limites e diferenças em relação aos exemplos

1. A navegação efetivamente publicada 1.4.6 já carrega `navigation.js` e já tem
   a barra inferior móvel. Ela foi preservada; não foi criada outra navegação.
   Isso diverge da descrição do pedido, mas evita mudar sua estrutura atual.
2. As telas e contagens são reais do catálogo autorizado, por isso diferem dos
   exemplos estáticos. Módulos/aplicações existentes continuam disponíveis.
3. A conta usada nas capturas tem acesso rápido **desativado**. A configuração
   real não foi alterada. As quatro imagens desse componente usam somente um
   cenário de apresentação no navegador, filtrado pelos destinos realmente
   autorizados pelo IAM. Não representam uma configuração ativa nem validam
   a administração de atalhos. `quick-access-preview.json` registra essa distinção.
4. O código publicado do administrador de atalhos mantém sua validação de
   Origin. Não foi modificado para liberar gravação na porta 18446 nesta fase.
5. Detalhes internos de Suprimentos, Planejamento, Laboratório e demais módulos
   pertencem às próximas fases. Aqui foram revistas suas páginas de entrada e
   a casca; não se declara o sistema inteiro visualmente concluído.
6. Impressões/PDFs e regras de produção não foram redesenhados. Os exports de
   teste foram apenas lidos/reimpressos, sem criar novas emissões nesta fase.

O primeiro smoke encontrou uma referência ao antigo título do Início, já
removido do HTML. Ela foi apontada ao novo cabeçalho e o smoke foi repetido.
Também foram corrigidos largura das listas móveis, ornamentos herdados e
versão exibida no menu antes de gerar as capturas finais.

## Roteiro de conferência na 18446

1. Abrir o [login](https://concrefer.concretrack.com.br:18446/unificado/login.html)
   em 1440: conferir duas colunas, identidade visual, campos e mostrar senha.
   Repetir em 1024, 820 e 390: o login deve continuar com o desenho anterior.
2. Entrar com sua conta e abrir **Início**. Conferir a versão **1.4.8**, a faixa
   amarela de teste, os números e as quatro linhas de setores. Os valores
   dependem dos dados e das permissões da sua conta.
3. Em 1440, conferir o menu escuro, os ícones e o traço do item ativo.
   Expandir/recolher grupos e usar a busca. Não deve haver siglas coloridas,
   bolinhas ou contadores nos títulos de grupo.
4. Em 1024 e 820, conferir o trilho de ícones, abrir o painel e trocar módulos.
   Em 390, usar a navegação móvel já existente, conferir o título da tela e
   rolar a lista de setores até o fim, sem rolagem lateral.
5. Abrir as entradas de **Planejamento**, **Laboratório** e **Suprimentos**.
   Conferir listas, busca, unidades do Laboratório e abertura de uma tela
   permitida. As telas internas ainda mantêm o desenho das fases seguintes.
6. Se sua conta já tiver Meu acesso rápido habilitado, conferir as listas de
   atalhos. Contas sem configuração continuam no Início geral. Para revisar
   apenas o desenho desse componente, usar as imagens identificadas na galeria.
7. Conferir sair e entrar novamente. Relatar qualquer corte, sobreposição,
   acesso indevido ou diferença visual que queira ajustar antes da fase 3.

Não houve push nem PR. Aguardar a revisão do usuário antes de iniciar módulos.
