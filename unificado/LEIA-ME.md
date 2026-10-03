# Sistema unificado — estrutura local

Esta é a entrega da **Fase 1**. A casca visual deriva de `preview-unificado/`. Não há autenticação ativa, páginas operacionais copiadas ou conexão com API nesta fase. Links dos módulos e ações de produção aparecem indisponíveis para impedir navegação para rotas incompletas.

## Abrir

```sh
cd unificado
python -m http.server 8090
```

Abra `http://localhost:8090`. A página de login visual está em `http://localhost:8090/login.html`. O layout usa fontes locais e não faz chamadas a CDN ou API. Em largura até 1024 px, mostra apenas o aviso de disponibilidade no computador, como na prévia aprovada.

## Arquivos locais

- `shell/`: CSS, JS, configuração única do menu, marcador de autenticação inativa e fontes Geist.
- `vendor/`: Bootstrap 5.3.3, Bootstrap Icons 1.11.3 e Chart.js 4.4.4, com as licenças dos pacotes. Ainda não são carregados pela casca; serão usados apenas nas cópias das telas que precisam deles.
- `VERSION` e `scripts/bump_unificado.py`: versão própria das referências CSS/JS.

Os números e o usuário Ricardo continuam ilustrativos. A continuação está condicionada aos impedimentos descritos em `docs/plano-unificacao.md`, sobretudo a falta de um ambiente Mapa isolado para testes.
