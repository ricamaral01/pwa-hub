# T2 · Permissões

## Implementação

- Sete telas no catálogo do Unificado: `cronoanalise.inicio`, `coletar`, `medicoes`, `catalogo`, `dimensionar`, `simular` e `metodologia`.
- Três ações: `laboratorio.cronoanalise.coletar`, `analisar` e `configurar`. A visualização depende da tela, sem ação `ver` separada, conforme a decisão do usuário.
- As telas novas começam desmarcadas para usuários comuns, inclusive quem já tem acesso ao Laboratório. O superusuário conserva acesso implícito. Um cronometrista pode receber apenas Cronoanálise.
- Cadastro de usuários com caixas para as ações; a asserção assinada para o Laboratório passa telas e ações explicitamente.
- Migração aditiva da restrição de `user_action_permissions.action_id`, preservando ações da Qualidade.

## Verificação

- `python -m pytest -q tests/auth/test_crono_screen_access.py`: testes novos passaram.
- `python -m py_compile` nos módulos Python e `node --check` no cadastro de usuários: passaram.
- Catálogos JSON analisados sem erro.
- Migração aplicada duas vezes em banco descartável `cronoanalise_test_permissions_20261018`; ação preexistente da Qualidade permaneceu e ação Cronoanálise foi aceita. Banco descartável removido.
- Testes de API para sessão ausente e ação ausente: 401 e 403, respectivamente.

O print do cadastro fica para T6a, após a publicação em homologação. Os arquivos de integração preexistentes e não rastreados, assim como alterações preexistentes em `unificado/mapa/api/app.py`, permanecem fora deste commit por decisão expressa do usuário.
