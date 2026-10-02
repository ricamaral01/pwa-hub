# Prévia unificada — Concrefer

Esta pasta contém apenas uma proposta visual para a casca de Planejamento (PCP) e Produção (Mapa de Concretagem). Nenhum dos dois sistemas atuais foi modificado.

## Abrir

No terminal, dentro desta pasta:

```sh
python -m http.server 8090
```

Abra `http://localhost:8090` em um navegador com largura de pelo menos 1025 px. A interface e as fontes funcionam sem internet. Para abrir os sistemas atuais pelos links, é necessária a rede e o login próprio de cada sistema.

## O que é ilustrativo

- O nome Ricardo e o perfil Administrador são fixos.
- O status “Sincronizado” é apenas visual; não consulta serviço algum.
- Os quatro cartões mostram a capacidade de formas, mas Programado e Realizado ficam sem números reais e sem progresso.
- O botão Sair não encerra sessão. Autenticação compartilhada está fora do escopo.
- Os atalhos do Mapa abrem a página inicial atual do Mapa. A tela específica precisa ser escolhida no menu interno, pois o código atual não aceita URL para escolher uma tela. Os nomes internos das telas estão documentados em `menu.config.js` para a fase seguinte.
- “Programação” e “Relatórios de Programação” no Acesso rápido apontam para Setor 1 e 2 como porta de entrada; as demais rotas estão no menu lateral.

## Rotas conferidas

As rotas do PCP foram conferidas na cópia local `.work-pcp-report/` e no panorama visual do PCP. O Mapa foi conferido em `mapa-concretagem/index.html` e `app.js`. As URLs base ficam no topo de `menu.config.js`.

## Fase 2 — passos propostos, ainda não executados

1. Definir e implementar no Mapa uma URL estável para cada tela e setor, com validação de permissão e retorno ao destino após o login.
2. Integrar esta casca aos dois sistemas, mantendo as telas operacionais, etiquetas e réplicas de planilha existentes.
3. Definir autenticação e saída compartilhadas entre os domínios.
4. Conectar os cartões de setores e o status de sincronização a dados reais, com tratamento de erro e atualização.
5. Validar as rotas e fluxos completos em teste, inclusive service workers, antes da publicação em produção.

Fontes Geist e Geist Mono locais, sob [SIL Open Font License](fonts/OFL.txt), obtidas do [repositório oficial da Vercel](https://github.com/vercel/geist-font).
