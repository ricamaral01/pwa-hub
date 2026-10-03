# Relatório da unificação PCP Concrefer + Mapa de Concretagem

**Atualizado em:** 03/10/2026  
**Escopo:** trabalho realizado até esta data no repositório e no ambiente separado de testes.  
**Estado geral:** início, login e consultas do Mapa disponíveis; operação completa do Mapa e integração do PCP ainda em desenvolvimento.

## O que deve ser preservado

A orientação vigente é reunir as duas aplicações em uma só experiência, mantendo **todas as funcionalidades e a forma atual de operar**. No Mapa, a programação, liberação e concretagem são feitas no tablet por modos e toques nos cartões das formas. Inspeção, montagem, fotos, retrabalho, relatórios e permissões também precisam manter seus fluxos. As mudanças permitidas são de layout e backend; a única função nova desejada é a unificação. O início já aprovado, com atalhos rápidos, deve permanecer.

## Onde consultar agora

| Endereço | Estado em 03/10/2026 | Uso atual |
|---|---|---|
| [Início do unificado](https://concrefer.concretrack.com.br/unificado/) | Publicado; HTTP 200 na conferência de hoje | Ver o layout e os atalhos. Os indicadores de setores ainda são ilustrativos e os atalhos operacionais aguardam integração. |
| [Login](https://concrefer.concretrack.com.br/unificado/login.html) | Publicado; HTTP 200 | Entrar com uma conta do Mapa migrada para o banco de testes; há fluxo de troca de senha no primeiro acesso. |
| [Histórico do Mapa](https://concrefer.concretrack.com.br/unificado/mapa/) | Publicado; HTTP 200 | Consultar dados históricos com filtros e paginação, sem apontamentos. |
| [Prévia do Mapa no tablet](https://concrefer.concretrack.com.br/unificado/mapa/consulta/) | Publicada; HTTP 200 | Ver a interface atual de cartões e modos usando a fotografia do banco de testes. Toques de apontamento e gravações estão bloqueados. |
| PCP dentro do unificado | Preparado apenas no repositório | A cópia ainda não foi publicada nem homologada para operação. |

O Mapa de produção e o PCP atual continuam sendo os sistemas operacionais. Nenhum domínio antigo foi redirecionado. O endereço publicado do teste é `concrefer.concretrack.com.br/unificado/`; o endereço `pcp.concretrack.com.br/unificado/` constava do plano inicial, mas não é a publicação descrita aqui.

## Etapas realizadas

### 1. Levantamento e estrutura do unificado

- Foram inventariadas as rotas, a navegação, o login, os dados locais do navegador, o cache, os modos do Mapa e as telas do PCP. O plano inicial e a etiqueta de retorno `pre-unificacao-20261002` foram registrados.
- Foi criada a estrutura `unificado/` com início, login, menu compartilhado, estilos, fontes e bibliotecas locais. O login recebeu os logos da **Concrefer** e da **ConcreTrack**. A versão local do conjunto está em `unificado/VERSION` (`0.2.0`).
- A página inicial foi mantida com seus atalhos rápidos. Os números de setores apresentados ali ainda não são dados reais integrados.
- O levantamento mostrou que a cópia chamada “teste” do Mapa apontava para o mesmo Supabase da produção. Ela não foi usada como banco de teste.

### 2. Cópia local do frontend PCP

- O frontend completo disponível na VPS foi obtido em modo somente leitura: **24 pastas de páginas** e arquivos estáticos.
- `scripts/import_unificado_pcp.py` gera a cópia em `unificado/pcp/`, ajusta caminhos de páginas e arquivos, direciona o login à nova tela e usa bibliotecas locais.
- `unificado/pcp/readonly-guard.js` é carregado antes dos scripts das páginas para impedir requisições de escrita durante a validação.
- As 24 rotas e 26 recursos referenciados por HTML responderam localmente; arquivos JavaScript selecionados passaram na checagem de sintaxe; uma escrita simulada foi bloqueada antes de chegar à rede.
- Isso comprova a preparação técnica da cópia. **Não comprova paridade de telas, impressão, permissões, login ou uso operacional.** O PCP não foi publicado no novo endereço.

### 3. Migração histórica do Mapa para PostgreSQL isolado

- Foi criada a base `mapa_unificado_teste` em uma VPS separada para testes. A origem Supabase foi lida sem gravação; os arquivos exportados foram conferidos por hash SHA-256, contagem de linhas e identificação dos registros antes da importação.
- Foram importados **40.140 registros** em sete tabelas:

| Tabela | Registros |
|---|---:|
| `usuarios` | 38 |
| `programacao_pcp` | 3.280 |
| `liberacao_formas` | 5.307 |
| `producao` | 22.523 |
| `montagem_poste` | 8.990 |
| `formas_manutencao` | 2 |
| `prog_s3_s4` | 0 |
| **Total** | **40.140** |

- As senhas das 38 contas migradas foram armazenadas no destino com **Argon2id**. O login usa uma conta SQL restrita; as visões de leitura não expõem o hash da senha.
- Foram preparados PostgREST de leitura, API Flask de autenticação/proxy e serviço `mapa-unificado-auth.service`. Os serviços internos escutam apenas em `127.0.0.1` na VPS; o acesso público passa por HTTPS e Nginx.
- O backup da configuração anterior do Nginx foi guardado antes da publicação. Também foram criados backups privados da base de testes antes dos experimentos de escrita.
- A migração é uma **fotografia de 02/10/2026**. Não há sincronização automática das alterações posteriores feitas na produção.

### 4. Publicação do login e do histórico

- Foram publicados o início, o login e o visualizador histórico em rotas separadas sob `/unificado/`.
- O login valida a conta migrada no PostgreSQL, admite troca de senha no primeiro acesso e cria sessão assinada em cookie `HttpOnly`, `Secure` e `SameSite=Strict`.
- O histórico apresenta resumo, filtro por data e setor e paginação para seis tabelas operacionais. A API de consulta exige sessão e limita o acesso a métodos de leitura.
- Os testes verificaram login válido e inválido, primeiro acesso, troca de senha, leitura autenticada, bloqueio sem sessão e ausência de exposição do hash da senha. Contas sintéticas usadas nos testes foram removidas; a contagem final voltou a 38 usuários.

### 5. Experimentos de escrita e correção de rumo

- Em uma etapa intermediária, foram testadas operações isoladas de programação, liberação, concretagem, inspeção e montagem no banco de testes. Os testes cobriram perfil, setor, origem, estado da forma, checklist e auditoria. Registros sintéticos foram removidos ao final.
- Essas telas usavam formulários genéricos e **não reproduziam o apontamento por modos e toques nos cartões do tablet**. Após a orientação de preservar a operação existente, as páginas experimentais `operacoes.html` e `montagem.html` foram retiradas do site e seus links do menu foram removidos. Ambas responderam **HTTP 404** na conferência de 03/10/2026; as rotas experimentais de escrita retornam `410` após autenticação.
- Os backups e parte do código de teste permanecem como material técnico de retorno e comparação. **Não há apontamento operacional liberado no unificado.**

### 6. Preparação da interface atual do Mapa

- A fonte de comportamento foi fixada em `mapa-concretagem/`. O `app.js` local teve o mesmo SHA-256 do arquivo publicado no Mapa atual em 03/10/2026; `current-mapa/` foi identificado como cópia anterior.
- Foi documentada a paridade exigida: programar e desprogramar por cartão, liberar, concretar com tipo, cancelar pelo modo Odin, manutenção, inspeção, montagem, fotos, segunda inspeção, retrabalho `RR`, relatórios, dashboards, usuários e permissões.
- A visão PostgreSQL `api.vw_formas_status` foi criada para reconstruir os estados e cores dos cartões por data, setor e forma. A consulta é autenticada e somente leitura. A visão reuniu **22.038 chaves de forma** no banco de testes.
- `scripts/build_unificado_mapa_tablet.py` monta uma cópia da interface atual, aponta as leituras para a API de testes, usa a sessão do unificado, reconhece `?tela=` para futuros atalhos e evita endereços operacionais de produção. O service worker original foi desativado nessa cópia para evitar mistura de caches.

### 7. Prévia de consulta no tablet

- Foi publicada a rota [Mapa no tablet — consulta](https://concrefer.concretrack.com.br/unificado/mapa/consulta/), com interface baseada no Mapa atual e data inicial **02/10/2026**, a data mais recente da fotografia importada.
- A prévia mostra um aviso de que os dados são históricos. Um bloqueio de interação impede o apontamento ao tocar nos cartões; outro bloqueio impede requisições de escrita. O backend publicado também permanece de leitura. Quem entra pelo link direto volta à prévia após o login.
- Em navegador com dimensões **1024 × 768** e **768 × 1024**, apareceram **52 cartões do Setor 3** e nenhum pedido de gravação foi enviado após toque. Nesse teste visual as respostas de leitura foram simuladas; o acesso real à visão PostgreSQL foi validado separadamente com conta temporária, depois removida.
- Esta entrega permite **consultar a apresentação no tablet**. Ainda não é uma validação de todos os fluxos do Mapa nem substitui o aplicativo operacional.

## Arquitetura atual do ambiente de testes

```text
Tablet ou navegador
  └─ HTTPS /unificado/
       ├─ Início e login com as duas marcas
       ├─ Histórico do Mapa (leitura)
       └─ Prévia do Mapa no tablet (leitura, toques bloqueados)
            └─ Nginx → API de autenticação/proxy → PostgreSQL isolado

PCP copiado no repositório → ainda não publicado no ambiente de testes
Mapa e PCP originais → continuam disponíveis para a operação atual
```

## Verificações e limites desta entrega

| Verificação | Resultado conhecido |
|---|---|
| Início, login, histórico e prévia por HTTPS | HTTP 200 em 03/10/2026 |
| Páginas experimentais de escrita removidas | HTTP 404 em 03/10/2026 |
| API de leitura sem sessão | HTTP 401 nos testes de integração |
| Dados migrados | Contagens e identificação conferidas; 40.140 registros na fotografia |
| Login e primeiro acesso | Testados com conta temporária; conta removida após o teste |
| Prévia horizontal e vertical | Cartões apresentados; toques sem gravação nos testes de navegador |
| Funcionalidade integral do Mapa no PostgreSQL | **Pendente** |
| PCP publicado e homologado no unificado | **Pendente** |
| Sincronização contínua da produção com o banco de testes | **Inexistente** |

O repositório contém alterações locais ainda não consolidadas e outros arquivos de trabalho não relacionados. Este relatório descreve o estado observado, não afirma que toda a implementação esteja em um commit único.

## Próximas etapas para concluir a unificação

1. Portar para a API PostgreSQL todas as transições atuais dos cartões do Mapa, mantendo os mesmos modos, cliques, cores, bloqueios por perfil e setor, inclusive cancelamento, manutenção, inspeção, montagem, segunda inspeção e retrabalho.
2. Integrar fotos, RPCs, administração de usuários, relatórios, dashboard e comportamento offline/sincronização ao backend de testes, sem alterar a sequência de operação no tablet.
3. Comparar os fluxos completos, lado a lado, com o Mapa atual em tablets reais. Liberar escrita no unificado somente após a equivalência funcional e as permissões estarem verificadas.
4. Integrar autenticação e backend do PCP à entrada unificada; conferir todas as 24 páginas, impressão e permissões antes de publicar o módulo.
5. Alimentar os cartões do início com dados reais de PCP e Mapa, conservando o layout e os atalhos já aprovados. Depois, validar a operação conjunta em ambiente de testes e planejar a entrada em produção.

## Arquivos de referência

- `docs/plano-unificacao.md`: levantamento inicial e registro cronológico das etapas 0 a 18.
- `docs/paridade-mapa-unificado.md`: lista de fluxos do Mapa que precisam permanecer iguais.
- `unificado/LEIA-ME.md`, `unificado/mapa/LEIA-ME.md` e `unificado/pcp/LEIA-ME.md`: estado e instruções de cada módulo.
- `mapa-concretagem/`: fonte atual do Mapa; `unificado/`: interface e serviços do ambiente unificado.
- `scripts/import_unificado_pcp.py` e `scripts/build_unificado_mapa_tablet.py`: geração reproduzível das cópias locais.

Este documento não contém senhas, tokens, chaves privadas nem dados pessoais das contas migradas.
