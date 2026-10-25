# Dosagem v2 — aplicação e validação do novo layout

Data local: 21/10/2026 (America/Sao_Paulo). Este documento preserva a validação inicial e registra a correção e a publicação autorizada depois dela.

## Origem, backup e aplicação

- O ZIP não estava na raiz indicada; foi encontrado em `dosagem-concreto-v2/dosagem-v2-novo-layout.zip`. SHA-256: `0b4d2f5bcf52efe2a96139211c3d1e5adc73d55846e9a7f8d2ae1a21bc07cb31`.
- O ZIP contém exatamente os 11 caminhos informados, todos sob `dosagem-concreto-v2/src/`; nenhum caminho externo foi extraído.
- Antes da extração, `dosagem-concreto-v2/src` foi copiado para `dosagem-concreto-v2/src.bak-layout-20261021`. Os 61 arquivos do backup conferem por SHA-256 com o estado anterior.
- Foram substituídos os dez arquivos existentes e criado `src/app/home.css`. A comparação com o backup apontou somente esses 11 arquivos alterados/criados, sem remoções. `src/app/home.css` existe.
- `package.json`, `package-lock.json`, API, banco e arquivos de configuração não foram editados. O backup foi preservado e não houve restauração.

## Comandos solicitados

| Comando | Resultado |
|---|---|
| `npm run build` | **Passou**, código 0. TypeScript, Vite e service worker PWA gerados. |
| `npx vitest run` | **Passou**, código 0: 17 arquivos, 45 testes. |
| `npm run test:e2e` | **Passou**, código 0: 20/20 testes nos projetos desktop, tablet retrato, tablet paisagem e celular. |
| `npm run gates -- --perfil piloto` | **Falhou em P-F3**. P-F1 e P-F2 passaram. O Playwright com API real teve 17 testes aprovados e 11 falhas; exigia pelo menos 20 aprovados. A execução foi interrompida durante P-F4, em cumprimento à instrução de parar ao encontrar falha. |

### Portões piloto

| Portão | Estado observado | Evidência |
|---|---|---|
| P-F1 | **Verde** | Núcleo TS 25/25, Python 17/17 e IDs verificados. |
| P-F2 | **Verde** | API 53/53, importação 3/3, migração aditiva e auditoria F2 aprovadas. |
| P-F3 | **Vermelho** | Build e contêineres passaram; Playwright com API real terminou 17/28, com 11 falhas, incluindo contraste insuficiente detectado pelo axe. |
| P-F4 | **Não concluído** | O script iniciou P-F4 automaticamente mesmo após P-F3 falhar. Foi interrompido antes do resultado E2E, backup e compatibilidade. O `GATES-PILOTO.json` é um registro parcial desta execução; o campo `green` de P-F4 reflete apenas os comandos iniciais que chegaram a terminar e **não** aprova o portão. A homologação Docker local foi encerrada. |

### Mensagens de falha capturadas

O verificador de P-F3 registrou exatamente:

```text
Expected at least 20 passing tests
```

O primeiro erro detalhado do Playwright/axe, no estudo dos módulos em desktop, foi:

```text
Error: expect(received).toEqual(expected) // deep equality
Element has insufficient color contrast of 1.14 (foreground color: #fcebf0, background color: #ffffff, font size: 28.8pt (38.4px), font weight: bold). Expected contrast ratio of 3:1
<div class="ct-letter-watermark" aria-hidden="true">PILOTO · NÃO LIBERADO</div>
```

O teste `piloto: login local, troca da senha inicial e saída` também falhou nos quatro tamanhos. Ele executa o axe após o login e na carta; a saída resumida não preservou os detalhes individuais das demais falhas. Não se conclui que a autenticação em si falhou. Os artefatos temporários do Playwright foram limpos ao iniciar P-F4; os demais detalhes exatos não estão disponíveis nesta execução. Nenhum teste foi repetido após a falha.

## Capturas do E2E local

As oito capturas foram atualizadas por `npm run test:e2e` em `dosagem-concreto-v2/tests/e2e/__screenshots__/`:

| Tela | Desktop | Tablet retrato | Tablet paisagem | Celular |
|---|---|---|---|---|
| Início | [inicio-desktop.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-desktop.png) | [inicio-tablet-retrato.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-tablet-retrato.png) | [inicio-tablet-paisagem.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-tablet-paisagem.png) | [inicio-celular.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/inicio-celular.png) |
| Editor | [editor-desktop.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/editor-desktop.png) | [editor-tablet-retrato.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/editor-tablet-retrato.png) | [editor-tablet-paisagem.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/editor-tablet-paisagem.png) | [editor-celular.png](../../dosagem-concreto-v2/tests/e2e/__screenshots__/editor-celular.png) |

## Estado após a primeira validação

O novo layout permanece aplicado **somente no workspace local**. O piloto público continua na release `20261021-frontend-packing-piloto`. Nenhum pacote foi enviado à VPS e nenhuma release foi ativada. A ativação depende de correção das falhas, novos portões verdes e autorização explícita do Ricardo; a release atual deve permanecer disponível para rollback.

## Correção e publicação autorizada — 21/10/2026

Após o pedido explícito do Ricardo para corrigir e subir o layout, foram feitos quatro ajustes no código do layout:

1. Removida da carta a marca d'água decorativa de opacidade 0,08 que produzia contraste 1,14:1. O aviso legível no rodapé da carta permanece.
2. Escurecida a cor da faixa “água” de `#5B7BD5` para `#4A67BD`, elevando o contraste com texto branco de cerca de 4,01:1 para 5,29:1.
3. Mantido no novo aviso compacto o seletor `.ct-pilot-banner` e o texto completo para leitor de tela, sem perder o `role="status"`.
4. Adicionado o botão “Sair” à barra superior do celular, também acessível sem abrir o menu “Mais”.

O aviso PILOTO continua visível e a API segue em `piloto=true`: os portões da Release 1 oficial ainda não estão completos. Foi retirada somente a sobreposição decorativa de baixo contraste.

### Verificação da versão corrigida

| Comando/verificação | Resultado |
|---|---|
| `npm run build` | Passou. |
| `npx vitest run` | 45/45 testes aprovados em 17 arquivos. |
| `npm run test:e2e` | 20/20 testes aprovados; as oito capturas locais acima foram atualizadas. |
| Playwright com API real em homologação | 20/20 testes aprovados nos quatro tamanhos, com axe nas telas exercitadas. |
| `npm run gates -- --perfil piloto` | **P-F1, P-F2, P-F3 e P-F4 verdes**, conforme `GATES-PILOTO.json`, concluído em 21/10/2026 21:04 BRT. P-F3 e P-F4: 28/28 E2E cada; P-F4 também validou backup/restauração e compatibilidade N−1. |

### Ativação no piloto

- Somente o frontend foi empacotado e enviado como `deploy-dosagem`, sem alterar API, banco, credenciais ou configuração. Pacote SHA-256 local/remoto: `36a0d49e90500921b496d1b537e73ac3553137dda143b8bfec6da2617a86a86c`.
- Release ativa: `/opt/concretrack-dosagem/releases/20261021-frontend-layout-piloto`. Release anterior preservada para rollback: `/opt/concretrack-dosagem/releases/20261021-frontend-packing-piloto`.
- Página pública, bundle novo e `/api/v1/saude` responderam HTTP 200; saúde `banco=ok`, `piloto=true`. Os nove sites vizinhos mantiveram 200/200/301/302/302/200/200/200/200.
- Navegação pública com autenticação simulada confirmou o novo início, o módulo por volume e o módulo por empacotamento em desktop e celular. Esta conferência não usou credenciais reais nem gravou dados na produção.
- Capturas da página pública: [desktop](capturas/layout-publico-desktop.png) e [celular](capturas/layout-publico-celular.png).

O legado permanece oficial até os portões completos da Release 1 e a decisão sobre os dados piloto.
