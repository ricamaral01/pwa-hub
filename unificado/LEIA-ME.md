# Sistema unificado — ambiente de testes

O ambiente de testes está em `https://concrefer.concretrack.com.br/unificado/`. O login usa contas do Mapa migradas para PostgreSQL; `/unificado/mapa/` permite consultar o histórico. As telas de escrita experimentais foram retiradas da publicação porque não preservavam o modo de apontamento por toque usado nos tablets. A cópia local do frontend PCP tem 24 páginas com bloqueio de escrita, ainda sem homologação ou publicação no ambiente de testes. Os links operacionais continuam indisponíveis até a migração funcional completa.

Para consultar a interface atual do Mapa no tablet, abra `/unificado/mapa/consulta/` com o mesmo login de testes. A prévia mostra a fotografia dos dados de 02/10/2026 e bloqueia apontamentos. O início e seus atalhos permanecem como estavam.

## Abrir

```sh
cd unificado
python -m http.server 8090
```

Abra `http://localhost:8090` para conferir o visual. A autenticação e os dados históricos funcionam apenas no domínio HTTPS de testes, que encaminha `/unificado/mapa/api/` ao serviço local da VPS. A casca ainda mostra o aviso de disponibilidade no computador em largura até 1024 px.

Para avaliar as cópias PCP em suas rotas finais, sirva a raiz do repositório em outra porta:

```sh
python -m http.server 8091
```

Abra `http://localhost:8091/unificado/`. As páginas PCP exigem uma sessão PCP e estão em modo somente leitura. Consulte `pcp/LEIA-ME.md`.

## Arquivos locais

- `shell/`: CSS, JS, configuração única do menu, login do Mapa de testes e fontes Geist.
- `vendor/`: Bootstrap 5.3.3, Bootstrap Icons 1.11.3 e Chart.js 4.4.4, com as licenças dos pacotes. Ainda não são carregados pela casca; serão usados apenas nas cópias das telas que precisam deles.
- `VERSION` e `scripts/bump_unificado.py`: versão própria das referências CSS/JS.

Os cartões de setores da página inicial ainda são ilustrativos. O Mapa de testes usa a cópia PostgreSQL isolada. Mudanças feitas na produção após a fotografia inicial não são sincronizadas automaticamente. Consulte `docs/plano-unificacao.md` para as etapas pendentes.
