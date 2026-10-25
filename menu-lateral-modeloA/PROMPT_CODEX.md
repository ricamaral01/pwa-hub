# Tarefa: aplicar o novo menu lateral (Modelo A) no Unificado

Repositório: `C:\Users\Admin\Documents\pwa-hub-fase1` (frontend React + TS + Vite).
Formato: uma tarefa, uma evidência. Não avance para outra coisa sem aprovação.

## O que fazer

1. Copie a pasta `src/components/sidebar/` deste pacote para o frontend, **sem reescrever o visual**.
   Os arquivos `Sidebar.tsx`, `sidebar.css`, `icons.tsx` e `navConfig.ts` são a referência visual
   aprovada. Não troque cores, tamanhos, espaçamentos, fontes nem ícones. Não "melhore" o layout.
2. Em `navConfig.ts`, substitua as rotas de exemplo pelas **rotas reais** do Unificado. Mantenha:
   - as cores dos módulos (Laboratório = amarelo `#F2B705`, diferente dos demais);
   - os títulos das seções em branco;
   - o GED sem itens RNC e Usuários (RNC vai para Qualidade → Não conformidades; usuários no cadastro geral).
3. Filtre `modules` e os itens pelas **permissões do usuário logado** antes de passar ao `<Sidebar>`
   (por enquanto só o usuário Ricardo vê Laboratório). Módulo ou seção sem itens visíveis não aparece.
4. No layout principal (casca do app), troque o menu lateral atual pelo `<Sidebar>`:
   - `activePath` = `location.pathname`; `onNavigate` = `navigate(href)`;
   - `activeModuleId` = módulo da rota atual;
   - `onSelectModule` vai direto para a primeira tela do módulo, **sem tela intermediária**
     (inclui a troca Planejamento ↔ Produção);
   - `collapsed` / `onToggleCollapsed` vêm do hook `useSidebarCollapsed()`;
   - `logoConcrefer` e `logoConcretrack` usam os logos reais que já existem no projeto;
   - `updateAvailable` / `onUpdate` ligados ao aviso atual de "Atualizar aplicativo" (service worker);
   - `user`, `version` e `onLogout` vêm da sessão atual.
5. O botão "Atualizar aplicativo" e o selo de versão saem do topo — agora ficam no rodapé do menu.
6. O conteúdo à direita deve ocupar o resto da largura (`flex: 1; min-width: 0`) e rolar sozinho;
   o menu fica fixo na altura da tela.

## Escopo — NÃO mexer

- **Modos PWA / celular**: continuam exatamente como estão. O novo menu vale só para PC e tablet.
  Use o mesmo critério que o app já usa hoje para decidir PWA × desktop/tablet.
- Nenhuma tela de conteúdo, rota ou regra de permissão além do filtro do item 3.
- Sistema antigo / VPS antiga: nada.

## Critérios de aceite (evidência)

Entregue `docs/porting/menu-lateral-modelo-a.md` com prints de:
1. PC 1440×900, menu aberto, Laboratório → Monitoramento ativo.
2. PC, menu recolhido (só ícones), com a dica flutuante aparecendo ao passar o mouse.
3. Tablet 1024×768 (paisagem) e 768×1024 (retrato), aberto e recolhido; rolagem do menu funcionando
   quando os itens não cabem.
4. Seletor de módulo aberto, e troca Planejamento → Produção indo direto para a tela.
5. PWA/celular **sem alteração** (print antes × depois).
6. `npm run build` e `tsc` sem erros.

Se algum item não puder ser cumprido sem mudar o visual, pare e descreva o motivo no documento,
em vez de adaptar por conta própria.
