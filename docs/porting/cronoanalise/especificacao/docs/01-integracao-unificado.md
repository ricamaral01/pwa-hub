# 01 · Integração no Unificado (Laboratório → Cronoanálise)

Decisão do Ricardo (18/10/2026): o CronoTrack **não** é um sistema separado. Ele vira o submódulo **Cronoanálise** dentro do módulo **Laboratório** do Unificado ConcreTrack/Concrefer, rodando na **VPS nova 2.25.163.32**. Não instalar nada na VPS antiga (31.97.241.84).

## O que é reaproveitado do Unificado (não criar de novo)

| Item | Usar o que já existe |
| --- | --- |
| Repositório | `C:\Users\Admin\Documents\pwa-hub-fase1` (o mesmo em que o Codex já trabalha) |
| Backend | FastAPI + SQLAlchemy 2 + Alembic do Unificado. Novo pacote do módulo ao lado dos módulos existentes do Laboratório (descubra o caminho real; ex.: `backend/app/modules/laboratorio/cronoanalise/`) |
| Banco | O banco PostgreSQL do Unificado. Tabelas num **schema próprio `cronoanalise`**, criadas por migração Alembic do Unificado (nova revisão encadeada no `head` atual) |
| Login e sessão | Login único do Unificado. Sem tela de login própria, sem tabela de usuários própria, sem cookie próprio |
| Usuários e permissões | Cadastro geral de usuários do Unificado, com as caixas de marcar por módulo/submódulo. Acrescentar as permissões da seção abaixo |
| Unidade | `unidade_id` do Unificado (Concrefer) |
| Casca visual | Menu lateral modelo A (módulos em lista), logos Concrefer e "C" ConcreTrack, bolinha **amarela** do Laboratório, modos PC, tablet e PWA do Unificado |
| Deploy | O mesmo processo de publicação do Unificado (Uvicorn :18110 + SPA :18180 na 2.25.163.32). Sem serviço, porta, NGINX ou banco novos |
| Backup | O backup do banco do Unificado já cobre o schema `cronoanalise` (confirmar e registrar) |

## Regras de não interferência

- Não alterar telas, rotas, tabelas ou permissões de outros módulos (PCP, Mapa, GED, Qualidade, demais telas do Laboratório).
- Não mudar o comportamento dos modos PWA existentes; a tela de coleta no celular entra como nova tela PWA do submódulo, no mesmo padrão das telas PWA que já existem.
- Migração aditiva apenas: cria o schema `cronoanalise` e suas tabelas; não altera tabelas existentes, exceto inserir as novas chaves de permissão no catálogo de permissões do Unificado (se esse catálogo for tabela).
- Antes e depois do deploy, rodar `deploy/00_inventario.sh` e comparar: mesmos serviços, mesmas portas, mesmo status HTTP, Alembic avançou só pela(s) revisão(ões) deste módulo.

## Permissões novas

| Chave | Dá direito a |
| --- | --- |
| `laboratorio.cronoanalise.ver` | Ver o submódulo: Início, Medições, Dimensionar, Simular, Metodologia |
| `laboratorio.cronoanalise.coletar` | Cronometrar e enviar medições; invalidar as próprias até 24 h |
| `laboratorio.cronoanalise.analisar` | Invalidar/restaurar qualquer medição, exportar CSV/XLSX, salvar rodadas de simulação e cenários |
| `laboratorio.cronoanalise.configurar` | Editar catálogo, parâmetros de dimensionamento, layout e base da simulação |

O Ricardo (admin) recebe todas. Hoje o Laboratório é liberado só para ele; os cronometristas vão precisar ver o Laboratório **apenas** no submódulo Cronoanálise. Se o Unificado ainda não permite liberar um submódulo sem liberar o módulo inteiro, implemente isso no cadastro de usuários (caixas por submódulo) sem mudar as permissões já gravadas de ninguém.

## Rotas

- Frontend: `/laboratorio/cronoanalise` (Início), `/coletar`, `/medicoes`, `/catalogo`, `/dimensionar`, `/simular`, `/metodologia`.
- API: prefixo do Unificado + `/laboratorio/cronoanalise/...` (ver `docs/03`).
- Item no menu do Laboratório: **Cronoanálise**, com subitens das telas acima conforme permissão.

## Ambiente

Hoje o Unificado na 2.25.163.32 roda com Uvicorn em 18110 e SPA em 18180, sem TLS, e o deploy é feito com senha SSH. Isso não muda nesta tarefa. O submódulo só não pode depender de nada que piore isso (ex.: não abrir portas novas). Registrar no relatório que o cronômetro no celular precisa de HTTPS para algumas funções do navegador (manter tela acesa, instalação do PWA); a coleta funciona sem elas.
