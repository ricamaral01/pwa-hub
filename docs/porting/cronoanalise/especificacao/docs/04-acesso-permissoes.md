# 04 · Acesso e permissões

O submódulo usa **o login do Unificado**. Não existe tela de login, cadastro de usuários, senha ou sessão própria do Cronoanálise.

## Regras

- Toda rota da API do submódulo exige sessão válida do Unificado (mesma dependência de autenticação que os outros módulos usam).
- Cada rota exige a permissão da tabela de `docs/01` (`ver`, `coletar`, `analisar`, `configurar`). Sem permissão: 403 com mensagem clara.
- O menu mostra só os subitens que o usuário pode abrir.
- Quem cronometrou é o usuário logado (`autor_id`). O campo "cronometrista" na tela vem preenchido com o nome do usuário e pode ser trocado (ex.: um tablet do setor usado por várias pessoas).
- Toda escrita (medições, invalidação, catálogo, parâmetros, layout, rodadas) grava auditoria, na tabela central do Unificado se existir.

## Matriz

| Ação | ver | coletar | analisar | configurar |
| --- | --- | --- | --- | --- |
| Ver Início, Medições, Dimensionar, Simular, Metodologia | sim | sim | sim | sim |
| Cronometrar e enviar medições | não | sim | — | — |
| Invalidar as próprias medições (até 24 h) | não | sim | sim | — |
| Invalidar/restaurar qualquer medição, exportar | não | não | sim | — |
| Salvar rodadas de simulação e cenários | não | não | sim | — |
| Editar catálogo, parâmetros, layout, base da simulação | não | não | não | sim |

`coletar`, `analisar` e `configurar` incluem `ver`.

## Cadastro

Na tela de usuários do Unificado, no grupo Laboratório, acrescentar as caixas "Cronoanálise: ver / coletar / analisar / configurar". Um cronometrista recebe só "Cronoanálise: coletar" e vê o Laboratório com apenas esse submódulo. Não alterar as permissões já gravadas de nenhum usuário.

## Celular sem internet e sessão

O cronometrista pode perder sinal no pátio. As medições ficam no IndexedDB e são enviadas quando a conexão volta. Se a sessão do Unificado expirar nesse meio-tempo, o app pede login de novo **sem perder** a fila; a fila só é apagada depois que o servidor confirma cada id. Seguir a estratégia de sessão longa do PWA do Unificado (ADR-014).
