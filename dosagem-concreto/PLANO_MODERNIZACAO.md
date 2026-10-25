# Revisão e plano de modernização — ConcreTrack Dosagem

**Data da revisão:** 17/10/2026  
**Escopo:** aplicação em `dosagem-concreto/`, integrações Apps Script, testes locais e dependências diretas do PWA Hub.  
**Objetivo:** tornar a dosagem mais confiável, simples de operar, completa e fácil de manter, preservando os dados existentes.

## 1. Resumo executivo

A aplicação reúne cadastro de fornecedores e materiais, ensaios de laboratório, dosagem, cálculo inverso, comparação de custos, traços experimentais, cartas de traço e impressão. Há bastante funcionalidade útil, mas a interface e as regras cresceram em paralelo. Hoje, quase toda a aplicação está em um único `index.html` de aproximadamente 702 KB. O resultado é que um mesmo traço pode ser representado e calculado de formas distintas conforme a tela.

As primeiras entregas devem resolver **confirmação de salvamento**, **proteção das operações de dados** e **consistência dos cálculos**. A reorganização visual deve vir apoiada em um modelo único de traço e em testes dos fluxos completos.

> **Alcance desta revisão:** o código da aplicação e dos três Apps Scripts foi inspecionado; os três conjuntos de testes de cálculo foram executados e passaram; as telas principais foram abertas em navegador local em largura desktop e celular. Não foram feitas alterações, gravações ou exclusões nas planilhas de produção. Não houve certificação das fórmulas ou das referências normativas por um responsável de engenharia. A versão publicada pode diferir desta cópia local. Portanto, este documento é um plano de correção e validação, não uma garantia de ausência de bugs.

## 2. Inventário atual

| Área | Estado observado |
|---|---|
| Interface | 24 seções com identificação `sec-*`, aproximadamente 241 campos `input`, 26 `select` e 149 botões em `index.html`. |
| Código da página | Aproximadamente 249 declarações de função no `index.html`, além de módulos JS separados para cálculos e interface. Há muitos manipuladores de evento diretamente nos atributos HTML. |
| Cálculos isolados | `argamassa-calculo.js`, `dosagem-cientifica.js` e `dosagem-por-argamassa.js` têm testes próprios. |
| Persistência | Dados distribuídos entre `localStorage` e três Web Apps de Google Apps Script/Sheets. |
| Autenticação da página | O Hub carrega `auth/config.js`, `auth/client.js` e `auth/guard.js`. |
| Publicação | Página estática servida pelo GitHub Pages em `https://usina.concretrack.com.br/dosagem-concreto/`. |
| Offline | O service worker do Hub inclui `dosagem-concreto/index.html` e `manual.html` na lista inicial de cache. É preciso testar o conjunto de arquivos necessários para operação offline. |

### Jornadas existentes que precisam ser preservadas

1. Cadastrar fornecedor e consultar relatório.
2. Registrar massa específica e granulometria de agregados.
3. Caracterizar materiais e transferir propriedades para a dosagem.
4. Calcular dosagem manual, científica e por teor de argamassa.
5. Avaliar volume, empacotamento, resistência e traço experimental.
6. Cadastrar custos MCC e comparar alternativas.
7. Salvar, carregar, versionar, imprimir e exportar cartas de traço.

## 3. Achados priorizados

### P0 — Confirmação de salvamento não confiável

O envio de traços e experimentais usa `fetch` com `mode: 'no-cors'` e, quando a chamada não lança uma exceção de rede, mostra mensagem de sucesso. Nesse modo, a página não consegue ler a resposta do servidor para confirmar que a operação foi aceita. O salvamento de cartas locais segue a mesma lógica ao acrescentar “planilha sincronizada”. O cadastro de fornecedor também tem um caminho alternativo de envio `no-cors`, embora sua mensagem nesse caso peça confirmação na planilha.

**Evidências:** `index.html:3904-3906`, `index.html:5020-5022`, `index.html:5228`, `index.html:9737-9748`.

**Correção:** criar uma API de gravação que devolva resposta verificável com ID, versão e data; consultar o registro depois da gravação quando necessário; separar os estados `rascunho local`, `pendente`, `confirmado` e `falhou`; permitir nova tentativa sem duplicar registro.

**Aceite:** nenhuma tela afirma que um registro foi salvo na nuvem sem confirmação verificável; falhas de rede mantêm o rascunho e oferecem nova tentativa.

### P0 — Operações de dados precisam de autorização no servidor

O Apps Script de dosagem descreve uma implantação acessível por “Qualquer pessoa”. Os `doPost` dos scripts processam ações recebidas, e o script de custos inclui exclusão por ID. Não foi identificada uma checagem de identidade ou permissão dentro desses manipuladores. O `auth/guard.js` protege a entrada na página, mas uma requisição direta ao endpoint precisa ser protegida no próprio serviço.

**Evidências:** `AppsScript_dosagem.gs:16,197`, `AppsScript_custoMCC.gs:75,180-194`, `AppsScript_fornecedores_e_granulometria.gs:29`.

**Correção:** autenticar cada chamada de leitura sensível, gravação, edição e exclusão; aplicar permissões por unidade e função; registrar autor e horário; manter credenciais fora do JavaScript público; revisar a configuração das implantações ativas.

**Aceite:** chamadas sem credencial válida ou sem permissão são recusadas pelo serviço, inclusive quando feitas fora da interface.

### P1 — Indicadores a/c e a/aglomerante divergentes

Na dosagem principal, `a/c` é água dividida por cimento e `a/aglomerante` é água dividida por cimento mais adição. No comparador e no banco de traços, o valor rotulado `ac` usa cimento mais adição. Isso altera a leitura de uma mesma composição.

**Evidências:** `index.html:6835-6836`, `index.html:9803-9806`, `index.html:9933-9943`.

**Correção:** definir os dois indicadores no modelo de domínio com nomes distintos (`relacaoAguaCimento`, `relacaoAguaAglomerante`); exibir cada um com seu nome em todas as telas e relatórios; acrescentar testes de consistência entre telas.

**Aceite:** para um traço com adição, a/c e a/aglomerante aparecem como valores diferentes e corretos em dosagem, comparação, carta e impressão.

### P1 — Segunda areia e segundo aditivo não percorrem todos os fluxos

A dosagem principal pode somar uma segunda areia e um segundo aditivo. Porém, os resumos do comparador e do banco de traços não representam esses componentes separadamente; aplicar um cenário também não restaura todos eles. O cálculo de volume do segundo aditivo utiliza `rho.adit` mesmo existindo um campo de massa específica próprio (`dos_rho_adit2`). A carta também calcula o volume dos aditivos agrupados com a densidade do primeiro.

**Evidências:** `index.html:6802-6827`, `index.html:6889-6892`, `index.html:9584-9605`, `index.html:9803-9815`, `index.html:9933-9943`, `index.html:12168-12176`.

**Correção:** representar cada material como item independente, com massa, densidade, custo, umidade e identificação; usar a mesma lista de materiais em cálculo, comparação, salvamento e relatório; migrar os registros antigos para o novo formato.

**Aceite:** salvar e reabrir um traço com duas areias e dois aditivos preserva todos os valores; volume e custo coincidem em todas as telas.

### P1 — Validação incompleta no cálculo principal

O cálculo principal usa `m.agua / m.cim`, `m.agua / (m.cim + m.adic)` e normalização pelo volume total sem uma etapa inicial única que valide todos esses denominadores. Vários campos usam `parseFloat(...) || 0`, o que também transforma entradas inválidas em zero silenciosamente. Os módulos de cálculo separados já têm algumas validações melhores, mas elas não cobrem automaticamente o cálculo grande dentro do HTML.

**Evidências:** `index.html:6787-6859`; validações exemplares em `argamassa-calculo.js` e `dosagem-por-argamassa.js`.

**Correção:** centralizar interpretação e validação de valores; exigir cimento e volume positivos quando a fórmula os requer; verificar densidades, limites, porcentagens e unidade; bloquear cálculo e salvamento inválidos com mensagem junto ao campo.

**Aceite:** entrada vazia, negativa, inválida ou fisicamente inviável nunca gera carta aparentemente válida nem `NaN`/`Infinity` no resultado.

### P2 — Fontes de dados e versões redundantes

Há traços na planilha, cartas no `localStorage`, um banco local de traços e cenários A/B/C. Isso permite versões concorrentes do mesmo traço e dificulta identificar o registro oficial. A exportação JSON é mais um formato que precisa permanecer compatível.

**Evidências:** rotinas de salvamento e listagem em `index.html:3807-4112`, `index.html:9577-9760`, `index.html:9802-9818`, `index.html:9919-10070`.

**Correção:** estabelecer um repositório oficial de traços com ID estável, número de versão, unidade, estado e histórico; usar armazenamento local apenas para rascunhos e fila offline; criar migração e importação antes de retirar caminhos antigos.

**Aceite:** o usuário encontra uma única lista de traços e consegue ver qual versão está ativa, onde está salva e quem a alterou.

### P2 — Interface extensa e difícil de aprender

O menu mistura tarefas sequenciais, ferramentas avançadas e saídas. Muitos campos aparecem de uma vez, e ações semelhantes de salvar/carregar se repetem em lugares diferentes. Na análise estática do HTML, a maioria dos controles não tem associação programática com `label`, ainda que muitos tenham texto visual próximo ou `placeholder`.

**Evidências:** navegação em `index.html:969-1080`; formulários a partir de `index.html:1178`; seções distribuídas até o fim do arquivo.

**Correção:** construir um percurso guiado com cinco etapas; mostrar campos avançados sob demanda; apresentar unidades e exemplos; adicionar ajuda no próprio campo; associar `label` e controle, corrigir foco, mensagens e uso por teclado.

**Aceite:** um usuário novo consegue produzir uma carta básica seguindo as etapas sem procurar comandos em outras seções; os formulários essenciais funcionam por teclado e leitor de tela.

### P2 — Código e testes concentrados em áreas diferentes

Os três módulos matemáticos isolados são testados, mas a maior parte das regras, integração e renderização está no HTML. Os testes atuais verificam poucos conjuntos de dados e não cobrem persistência, reabertura, impressão, segunda areia/aditivo, falhas de rede ou permissões.

**Evidências:** `index.html`, `tests/argamassa-calculo.test.js`, `tests/dosagem-cientifica.test.js`, `tests/dosagem-por-argamassa.test.js`.

**Correção:** extrair domínio, validação, persistência e apresentação em módulos; testar regras com exemplos de referência; adicionar testes de fluxo no navegador e contratos da API.

**Aceite:** alterações de fórmula, dados ou interface passam por testes automatizados dos fluxos afetados antes de publicar.

### P3 — Manual, observabilidade e operação offline

O manual descreve os fluxos principais, mas não acompanha integralmente os recursos e caminhos de dados mais recentes. O cache inicial do service worker lista a página e o manual; a dependência dos demais scripts precisa ser verificada em teste offline. Não há um mecanismo claro para o usuário informar um erro com identificação de versão e estado de sincronização.

**Evidências:** `manual.html`, `../sw.js:47-48`, referências a scripts em `index.html:12422-12427`.

**Correção:** atualizar o manual a partir da interface final; testar abertura e cálculo offline; exibir versão da aplicação e situação de sincronização; registrar falhas de cálculo e integração sem expor dados sensíveis.

**Aceite:** documentação corresponde à interface publicada, e um ensaio offline tem comportamento conhecido e verificável.

## 4. Experiência de uso proposta

### Percurso principal

| Etapa | O usuário faz | A aplicação ajuda com |
|---|---|---|
| 1. Materiais | Seleciona ou cadastra cimento, adições, areias, britas, água e aditivos. | Busca, valores recentes, unidades, densidades e origem do dado. |
| 2. Ensaios | Vincula granulometria, massa específica e umidade. | Indicação de ensaio ausente, vencido ou ainda não aplicado. |
| 3. Dosagem | Define objetivo e ajusta massas/proporções. | Atualização imediata de volume, a/c, a/aglomerante, teor de argamassa e custo. |
| 4. Validação | Confere alertas e registra resultados experimentais. | Lista de pendências, memória de cálculo e comparação com versões anteriores. |
| 5. Carta | Revisa, salva, aprova e imprime. | Prévia fiel, versão, responsável, data e confirmação de gravação. |

### Regras de interface

- Um cabeçalho persistente mostra nome do traço, unidade, versão e estado de salvamento.
- Cada tela tem uma ação principal clara; ações avançadas ficam próximas do contexto em que são usadas.
- Campos mostram unidade no próprio rótulo. Valores calculados e valores digitados têm aparência distinta.
- Alertas explicam a causa, o campo envolvido e a ação necessária.
- O comparador usa os mesmos componentes e indicadores que a dosagem.
- Dados relevantes permanecem visíveis ao mudar de etapa; não há necessidade de copiar valores manualmente.
- Desktop e celular usam os mesmos conceitos e nomenclatura, com tabelas adaptadas ao espaço disponível.

## 5. Arquitetura proposta

Modernização incremental, mantendo a operação enquanto os módulos são substituídos:

```text
Interface por etapas
  ├── Formulários e validação
  ├── Resultados e comparação
  └── Carta e impressão
           │
Modelo único de traço e ensaio
  ├── Cálculos puros e versionados
  ├── Regras de negócio / alertas
  └── Serialização e migração
           │
API autenticada
  ├── Materiais e fornecedores
  ├── Ensaios
  ├── Traços, versões e aprovações
  └── Custos e auditoria
           │
Banco oficial + rascunhos locais / fila offline
```

O modelo deve carregar unidades explícitas, por exemplo `massaKg`, `densidadeKgPorL`, `custoPorKg` e `umidadePct`. Os cálculos recebem dados e devolvem resultados, sem ler campos HTML nem alterar a página. A camada de interface apenas coleta entradas, mostra erros e apresenta resultados. A API é responsável por identidade, permissões, validação de gravação e histórico.

Não é obrigatório trocar toda a tecnologia de uma vez. Pode-se extrair módulos e introduzir uma ferramenta de build aos poucos. A escolha de framework deve ser posterior à definição do modelo, da API e dos fluxos; o ganho principal vem da separação de responsabilidades.

## 6. Plano de execução

### Fase 0 — Linha de base e homologação

**Entregas:** inventário de telas e dados; cópia de segurança dos registros; comparação entre código local e versão publicada; ambiente de homologação; casos de referência aprovados por engenharia.

**Saída:** matriz de fluxos existentes, amostras representativas de traços simples e complexos e lista das implantações Apps Script em uso.

### Fase 1 — Correções críticas

**Entregas:** confirmação real de salvamento; autenticação e autorização no serviço; correção dos indicadores a/c e a/aglomerante; validação de entradas; correção de segunda areia e segundo aditivo; testes de regressão desses casos.

**Saída:** traços existentes continuam abrindo; novo traço complexo calcula, salva e reabre com valores iguais; erros de rede ou permissão são mostrados corretamente.

### Fase 2 — Modelo e persistência unificados

**Entregas:** esquema único de traço, materiais, ensaios e custos; versões; migração/importação de registros locais, planilhas e JSON; API com contratos documentados; fila local para rascunhos offline.

**Saída:** uma lista oficial de traços, sem duplicação silenciosa, com versão e origem visíveis.

### Fase 3 — Interface guiada

**Entregas:** navegação em cinco etapas, formulários reduzidos, busca e seleção de materiais/ensaios, validação junto ao campo, comparação consistente e melhorias de acessibilidade.

**Saída:** percurso básico completo em desktop e celular, validado com usuários reais do laboratório.

### Fase 4 — Recursos completos e documentação

**Entregas:** histórico de mudanças, aprovação técnica, rastreabilidade de ensaios, memória de cálculo consistente, cartas padronizadas, manual atualizado e indicadores de sincronização.

**Saída:** um traço pode ser auditado da entrada de materiais até a carta aprovada.

### Fase 5 — Publicação controlada

**Entregas:** execução automática de testes, verificação visual, piloto com usuários, monitoramento de erros, plano de reversão e publicação gradual.

**Saída:** a versão publicada é a mesma que passou pelos testes e tem um caminho definido para correção rápida.

## 7. Matriz mínima de testes

| Grupo | Casos obrigatórios |
|---|---|
| Cálculo | Traço padrão; apenas uma areia/brita; duas areias e dois aditivos; adição mineral; umidade; volume acima/abaixo de 1 m³; valores zero, negativos e ausentes. |
| Consistência | Mesmo a/c, a/aglomerante, volume, massas e custo em dosagem, comparador, carta e impressão. |
| Dados | Salvar, confirmar, reabrir, editar, versionar, importar JSON e migrar dados antigos. |
| Rede | Sem conexão; timeout; resposta de erro; tentativa repetida; conflito entre versões; sincronização posterior. |
| Permissões | Acesso autorizado por unidade; acesso negado; chamada direta à API; exclusão; histórico de autor. |
| Interface | Desktop, celular, teclado, foco, rótulos, mensagens de erro, tabelas e impressão/PDF. |
| Offline | Abertura, cálculo e rascunho sem rede; retomada e confirmação de sincronização. |

Os valores esperados dos testes de engenharia devem ser calculados independentemente do código e aprovados pelo responsável técnico. Testes que apenas repetem a mesma fórmula da implementação não detectam um erro conceitual compartilhado.

## 8. Critérios para considerar a modernização concluída

1. Todos os caminhos de salvar, carregar e imprimir usam o mesmo modelo de traço.
2. Segunda areia, segundo aditivo e respectivas propriedades sobrevivem a todo o ciclo de vida do registro.
3. Cada indicador técnico tem definição única e explícita; referências normativas e limites foram revisados por engenharia.
4. O serviço recusa operações não autorizadas e registra autor, versão e horário das alterações.
5. O usuário sempre distingue rascunho local, envio pendente e gravação confirmada.
6. Registros antigos são migrados ou importáveis, com conferência de contagem e conteúdo.
7. Os principais percursos passam em testes automatizados e em homologação desktop/celular.
8. O manual corresponde à versão efetivamente publicada.

## 9. Decisões necessárias antes da implementação

- Definir com engenharia as fórmulas oficiais, arredondamentos, critérios de aceitação e normas aplicáveis a cada tipo de dosagem.
- Escolher a fonte oficial dos dados e a política de retenção das planilhas existentes.
- Definir papéis: quem pode criar, alterar, aprovar, inativar e excluir traços e custos; e como as unidades se relacionam.
- Definir quais operações devem funcionar offline e como resolver conflitos de sincronização.
- Validar com usuários do laboratório o percurso principal proposto e os campos realmente obrigatórios.

## 10. Estimativa e ordem de prioridade

As fases 0 e 1 devem preceder a reformulação visual. Uma estimativa inicial para uma pessoa desenvolvedora com disponibilidade de revisão de engenharia é de **6 a 10 semanas**, sujeita ao volume de dados a migrar, à escolha da API e às regras de aprovação. O trabalho deve ser entregue em incrementos que possam ser testados e revertidos. A estimativa deve ser refinada após a fase 0.

**Primeira entrega recomendada:** corrigir a confirmação de salvamento, proteger as operações no servidor e adicionar testes de consistência para a/c, segunda areia e segundo aditivo. Essa entrega reduz o risco operacional imediato e cria uma base segura para simplificar a experiência.
