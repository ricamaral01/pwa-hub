# Login novo e nome "Uni" — somente na homologação (18446)

Implante a nova tela de login e passe a chamar o sistema de **Uni**. Tudo somente na homologação 18446. Produção só com "aprovado, publicar em produção".

## Referências (mockups aprovados)

- `docs/revisao-visual-unificado/telas/f3-login-uni.html`: tela normal com aviso do sistema.
- `docs/revisao-visual-unificado/telas/f3-login-uni-erro.html`: senha errada com Caps Lock.
- Imagens: `docs/revisao-visual-unificado/img/f3/login-uni-aviso.png`, `login-uni-erro.png`, `login-uni-1440.png`, `login-uni-1280.png`.
- Estilos do mockup: `telas/base.css` e `telas/f2.css`. Logo oficial: `telas/assets/logo-concrefer-oficial.png`.

## 1. Login no computador (≥1025px)

Siga o mockup.

**Painel azul (#16416F)**
- O desenho de poste e cabos continua como está.
- Embaixo, à esquerda:
  - "Uni": 64px, peso 600, branco;
  - "Sistema de gestão da Concrefer": 18px;
  - "Planejamento, produção, laboratório, qualidade, usinas, suprimentos, logística e documentos.": 14px, cor #a9bcd3;
  - linha fina;
  - unidades em texto simples separadas por traço vertical: Campinas | Pederneiras | Ribeirão Preto | Noroeste. **Retire as bolinhas**: elas parecem botões de opção.

**Formulário**
- Logo oficial.
- Título "Entrar no Uni".
- Usuário.
- Senha, com "Mostrar".
- "Lembrar meu usuário neste aparelho".
- Botão "Entrar" (#16416F).
- Rodapé: "Sem acesso ou esqueceu a senha? Fale com o PCP da sua unidade." à esquerda e "Uni 1.4.27" à direita, sem quebra de linha.

Cores da marca **somente no login**. No resto do sistema, o botão primário continua #0b1730.

## 2. Comportamentos novos (todas as larguras)

**a) Erro de login**
- Faixa vermelha acima dos campos: "Usuário ou senha incorretos. Confira e tente de novo." O campo de senha fica com borda vermelha.
- A mesma mensagem para usuário inexistente e para senha errada: não revelar qual dos dois falhou.
- Sem servidor: "Sem conexão com o servidor. Tente de novo em instantes."
- Nunca mostre erro técnico.

**b) Caps Lock**
- Com o foco na senha e o Caps Lock ligado, mostre "Caps Lock está ativado." embaixo do campo (`getModifierState('CapsLock')`, em keydown e keyup).
- Some quando desligar.

**c) Lembrar meu usuário**
- Desmarcado na primeira vez.
- Quando marcado, guarda **somente o usuário** em localStorage, em try/catch.
- **Nunca** guarde a senha nem o token por causa dessa opção.
- Desmarcar apaga o usuário salvo.
- A escolha fica lembrada no aparelho.

**d) Aviso do sistema**
- Faixa amarela acima de "Entrar no Uni", lida de um arquivo estático `shell/aviso.json` com o formato `{"ativo": true, "titulo": "...", "texto": "...", "ate": "2026-11-21T00:00:00-03:00"}`.
- Sem arquivo, com `ativo:false` ou com o prazo vencido: nada aparece e nenhum erro é mostrado.
- Sem API nova e sem tela de administração nesta etapa.
- Documente como editar o arquivo e publique-o com `ativo:false`.
- Mostre uma captura com o aviso ligado, só para a prova.

## 3. Celular e tablet

- **O layout do login no celular e no tablet NÃO muda.** Isso é decisão do usuário.
- Mude somente:
  - os textos: "Unificado" vira "Uni", o título vira "Entrar no Uni" e o rodapé passa a ser o novo;
  - os comportamentos 2a, 2c e 2d, encaixados no estilo atual. O Caps Lock só aparece se houver teclado físico.
- Prove com comparação de pixels: diferenças apenas nas áreas de texto e nos elementos novos.

## 4. Nome "Uni" no restante do sistema

1. **Inventário primeiro:** liste toda ocorrência **visível ao usuário** de "Unificado" em HTML, JS, títulos de aba, menu, versão, ajuda, PDFs, e-mails e manifest do PWA.
2. Troque por "Uni":
   - títulos de aba ("Tela · Uni");
   - menu e rodapé da barra lateral ("Uni 1.4.27");
   - textos de ajuda;
   - `name` e `short_name` do manifest do PWA.
3. **NÃO mude:**
   - o endereço `/unificado`;
   - nomes de pastas, rotas, IDs, serviços, bancos, cookies, chaves de cache e de localStorage;
   - nada interno.
   Se algum texto visível depender de identificador interno, troque só o rótulo.
4. PDFs e relatórios gerados: só o texto do rodapé ou cabeçalho, se tiver "Unificado". Mostre antes e depois e confira que o layout do PDF não muda.

## 5. Versão, publicação e provas

- Versão **1.4.27**: VERSION, `?v=` e cache do service worker.
- Publique na 18446 com backup.
- **Capturas** do login em 1440, 1280, 1024, 820 e 390, nos estados:
  - normal;
  - com aviso;
  - erro;
  - Caps Lock;
  - "lembrar" marcado e reaberto.
- **Testes:**
  - login certo;
  - login errado;
  - servidor fora;
  - lembrar e desmarcar (inspecione o localStorage e prove que não há senha nem token);
  - aviso ativo, inativo e vencido;
  - navegação por teclado (Tab e Enter) e foco visível;
  - leitor de tela: a mensagem de erro com `role="alert"`.
- **Atualização do PWA de 1.4.26 para 1.4.27** num aparelho com o app instalado: a nova versão chega sem limpar o cache, e o nome sob o ícone passa a "Uni", ou registre se o sistema operacional só troca o nome ao reinstalar.
- Gate 7/7, matriz de login de todos os perfis e auditoria de produção sem alteração.
- Commit próprio e relatório com as capturas. Pare e me entregue. Sem push, PR ou produção.
