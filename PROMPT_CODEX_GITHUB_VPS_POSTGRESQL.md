# PROMPT ÚNICO PARA O CODEX — GITHUB + VPS + POSTGRESQL

Execute o deploy completo do projeto aberto no VS Code, de ponta a ponta, com segurança e possibilidade de rollback.

## Objetivos

1. Auditar o projeto atual.
2. Preparar o repositório para produção.
3. Publicar o código no GitHub.
4. Conectar à VPS `31.97.241.84`.
5. Criar um banco PostgreSQL exclusivo para esta aplicação.
6. Aplicar migrations ou schema existentes.
7. Configurar variáveis de ambiente sem expor segredos.
8. Instalar e iniciar a aplicação.
9. Configurar Nginx sem quebrar outras aplicações.
10. Validar frontend, API e persistência.
11. Entregar relatório final e procedimento de rollback.

## Dados conhecidos

```text
VPS_HOST=31.97.241.84
VPS_USER=root
NOME_PROJETO=resultado-ensaios-usina
DIRETORIO_PADRAO=/opt/resultado-ensaios-usina
BANCO_PADRAO=resultado_ensaios_db
ROLE_PADRAO=resultado_ensaios_app
```

Não coloque nenhuma senha neste arquivo, no código, no GitHub, nos commits, no terminal visível ou no relatório final.

A autenticação inicial deve usar uma chave SSH já configurada. Se não houver chave funcionando, pare apenas nesse ponto e peça que eu autentique interativamente. Nunca coloque senha em comando, script ou histórico.

## Regras invioláveis

- Não apagar bancos, tabelas, serviços, arquivos ou aplicações existentes.
- Não executar `DROP`, `TRUNCATE`, reset, limpeza de dados ou `rm -rf` sem caminho validado.
- Não usar `git push --force`.
- Não sobrescrever Nginx sem backup.
- Não abrir a porta PostgreSQL para a internet.
- Não usar `postgres` como usuário permanente da aplicação.
- Não executar a aplicação como `root`.
- Não publicar `.env`, chaves, credenciais, dumps, uploads ou certificados.
- Não inventar tabelas olhando apenas o frontend.
- Não alterar contratos atuais da API sem necessidade comprovada.
- Não instalar uma segunda cópia de PostgreSQL, Node, Nginx, PM2 ou outro serviço antes de verificar o que já existe.
- Não declarar sucesso sem executar testes reais.
- Pare somente diante de risco real de perda de dados, falta de acesso ao GitHub ou ausência do domínio necessário.

## 1. Auditoria local

Antes de alterar arquivos, identifique:

- stack, versão e arquivo de entrada;
- scripts do `package.json`;
- framework do backend;
- diretório público;
- endpoints;
- migrations;
- schema;
- variáveis de ambiente;
- porta esperada;
- health check;
- gerenciador de processo;
- arquivos que não podem ir ao GitHub.

Execute:

```bash
git status
git remote -v
git branch --show-current
node --version
npm --version
```

Verifique se há segredos versionados. Não mostre os valores; informe apenas os arquivos afetados.

## 2. Proteção de segredos

Crie ou corrija o `.gitignore`:

```gitignore
.env
.env.*
!.env.example
*.pem
*.key
*.crt
credentials/
secrets/
uploads/
backups/
dumps/
*.sql
*.dump
node_modules/
coverage/
logs/
*.log
```

Não ignore migrations válidas.

Crie `.env.example` apenas com nomes e exemplos falsos:

```dotenv
NODE_ENV=production
PORT=8010
DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/NOME_DO_BANCO
```

Inclua todas as variáveis realmente exigidas, sem valores reais.

## 3. Validação local

Use somente scripts existentes:

```bash
npm ci
npm test
npm run lint
npm run build
```

Não invente scripts ausentes. Se não houver build, valide sintaxe, imports, rotas, referências CSS/JS e inicialização do servidor.

Corrija erros antes de publicar.

## 4. GitHub

1. Preserve o `origin` existente.
2. Se não houver `origin`:
   - verifique `gh auth status`;
   - se autenticado, crie repositório privado `resultado-ensaios-usina`;
   - se não estiver autenticado, peça somente a URL do repositório.
3. Nunca publique segredos.
4. Não altere histórico existente.
5. Crie um commit claro:

```text
chore: prepare production deployment
```

6. Faça push da branch atual.
7. Registre URL, branch e hash do commit.
8. Confirme `git status` limpo.

## 5. Acesso da VPS ao GitHub

Prefira deploy key exclusiva e somente leitura.

Na VPS:

1. Verifique se já existe chave própria do projeto.
2. Se não existir, gere Ed25519 sem sobrescrever outras chaves:

```text
/root/.ssh/resultado_ensaios_deploy
/root/.ssh/resultado_ensaios_deploy.pub
```

3. Nunca mostre a chave privada.
4. Adicione somente a chave pública em `Settings > Deploy keys` do repositório.
5. Não habilite acesso de escrita.
6. Configure alias específico no `~/.ssh/config`.
7. Teste autenticação antes de clonar.
8. Não reutilize essa deploy key em outro repositório.

## 6. Auditoria da VPS

Conecte por SSH e execute:

```bash
hostnamectl
cat /etc/os-release
df -h
free -h
ss -lntp
systemctl --type=service --state=running
nginx -v
psql --version
node --version
npm --version
```

Verifique:

- aplicações e serviços existentes;
- portas ocupadas;
- sites Nginx;
- certificados;
- PostgreSQL, versão, cluster e porta;
- PM2 ou systemd;
- espaço em disco;
- diretórios existentes;
- usuário Linux adequado.

Não alterar nada antes dessa auditoria.

## 7. Usuário Linux da aplicação

A aplicação não pode rodar como root.

Se não existir usuário apropriado, crie:

```text
resultado-ensaios
```

Esse usuário deve:

- não ter senha interativa;
- ser proprietário dos arquivos da aplicação;
- ter somente as permissões necessárias;
- executar o serviço;
- não ser administrador do banco.

Root deve ser usado somente para instalação, permissões, Nginx, PostgreSQL e serviço.

## 8. PostgreSQL

### Descoberta

1. Detecte versão, cluster e porta reais.
2. Verifique se existem:
   - banco `resultado_ensaios_db`;
   - role `resultado_ensaios_app`.
3. Se o banco já existir e possuir dados, faça backup antes de migrations.
4. Não recrie objetos existentes sem compreender o estado atual.

### Criação

Se não existirem, crie:

```text
DATABASE=resultado_ensaios_db
ROLE=resultado_ensaios_app
```

A role deve:

- ter `LOGIN`;
- não ser superusuária;
- não ter `CREATEDB`;
- não ter `CREATEROLE`;
- não ter `REPLICATION`;
- possuir apenas o banco da aplicação;
- usar senha forte aleatória gerada na VPS.

Não reutilize senha enviada em conversa.

O banco deve:

- ser propriedade de `resultado_ensaios_app`;
- usar UTF-8;
- permanecer em `127.0.0.1`;
- não exigir porta PostgreSQL pública.

### Arquivo de ambiente

Crie fora do repositório:

```text
/etc/resultado-ensaios-usina/resultado-ensaios.env
```

Permissões:

```text
root:resultado-ensaios
0640
```

Conteúdo, adaptado à aplicação real:

```dotenv
NODE_ENV=production
PORT=<PORTA_INTERNA_LIVRE>
DATABASE_URL=postgresql://resultado_ensaios_app:<SENHA_GERADA>@127.0.0.1:<PORTA_POSTGRES>/resultado_ensaios_db
```

Adicione as demais variáveis realmente necessárias.

Não mostre a `DATABASE_URL` completa. No relatório, masque a senha.

### Schema e migrations

Use esta prioridade:

1. migrations existentes;
2. script oficial existente;
3. schema definido pelo backend;
4. apenas se nada existir, crie migration versionada e revisável.

Não derive schema somente do HTML.

Antes de aplicar migrations:

- confirme o banco de destino;
- liste migrations;
- faça backup se houver dados;
- verifique controle de versão.

Depois:

- liste tabelas;
- verifique owners e privilégios;
- teste conexão usando a role da aplicação;
- não mostre senha.

## 9. Deploy da aplicação

Use deploy atômico:

```text
/opt/resultado-ensaios-usina/
  releases/
  shared/
  current -> releases/<timestamp>
```

Fluxo:

1. criar release;
2. clonar o commit do GitHub;
3. confirmar hash;
4. instalar dependências;
5. executar build, se houver;
6. vincular arquivos persistentes;
7. aplicar migrations;
8. testar na porta interna;
9. trocar `current` somente após teste;
10. manter a release anterior para rollback.

Não copiar `node_modules` do Windows.

Para Node.js, use `npm ci --omit=dev` somente se compatível.

Uploads persistentes devem ficar em `shared/`, fora da release.

## 10. Serviço

Detecte o gerenciador existente:

- se o projeto já usa PM2 corretamente, preserve PM2;
- caso contrário, prefira systemd;
- não use PM2 e systemd simultaneamente para o mesmo processo.

Nome sugerido:

```text
resultado-ensaios-usina.service
```

O serviço deve:

- executar como `resultado-ensaios`;
- usar `/opt/resultado-ensaios-usina/current`;
- carregar o `EnvironmentFile` protegido;
- reiniciar em falha;
- iniciar após rede e PostgreSQL;
- usar o script oficial de produção;
- não expor segredos no comando.

Valide:

```bash
systemctl daemon-reload
systemctl enable resultado-ensaios-usina
systemctl restart resultado-ensaios-usina
systemctl status resultado-ensaios-usina --no-pager
journalctl -u resultado-ensaios-usina -n 100 --no-pager
```

Não concluir se o serviço estiver falhando ou reiniciando em loop.

## 11. Nginx

1. Verifique sites existentes.
2. Descubra se já existe domínio ou subdomínio destinado ao projeto.
3. Não invente domínio.
4. Se o domínio não puder ser identificado, valide localmente e peça somente esse dado.
5. Faça backup do arquivo antes de alterar.
6. Crie configuração isolada.
7. Faça proxy para `127.0.0.1:<PORTA_INTERNA>`.
8. Preserve headers necessários.
9. Não alterar sites não relacionados.

Antes de recarregar:

```bash
nginx -t
```

Somente se estiver válido:

```bash
systemctl reload nginx
```

Preserve HTTPS existente. Não emitir certificado sem confirmar que o DNS aponta para a VPS.

## 12. Firewall e rede

- Não abrir PostgreSQL.
- Não expor a porta interna da aplicação.
- Nginx deve ser o ponto de entrada.
- Não remover regras existentes.
- Não bloquear SSH.
- Não alterar UFW sem necessidade.
- Preservar 80 e 443 quando já utilizados.

## 13. Validação real

### Banco

- conexão com a role da aplicação;
- migrations aplicadas;
- tabelas criadas;
- privilégios mínimos;
- criar, ler, atualizar e excluir um registro de teste somente pela API.

### Backend

- processo ativo;
- health check;
- unidades;
- listagem;
- criação;
- leitura;
- atualização;
- exclusão;
- mensagens de erro.

### Frontend

- nenhum arquivo 404;
- console sem erro;
- API correta;
- persistência no PostgreSQL;
- relatórios pelo ID;
- impressão;
- responsividade básica.

### Infraestrutura

```bash
systemctl status <SERVICO> --no-pager
nginx -t
curl -I http://127.0.0.1:<PORTA_INTERNA>
curl -I https://<DOMINIO>
ss -lntp
```

Não teste URL externa até o domínio estar confirmado.

## 14. Rollback

Deixe preparado:

1. release anterior;
2. backup do Nginx;
3. backup do banco antes de migration que possa alterar dados;
4. comando para apontar `current` para a release anterior;
5. comando para reiniciar o serviço;
6. procedimento de restauração do banco, sem executar automaticamente.

Não apagar backups durante esse deploy.

## 15. Correções após deploy

Toda correção deve:

1. ser feita no repositório;
2. ser testada;
3. receber commit;
4. ser enviada ao GitHub;
5. gerar nova release na VPS.

Não editar a release diretamente sem registrar no GitHub.

A VPS deve terminar exatamente em um commit existente no GitHub.

## Relatório final obrigatório

Entregue:

```text
GitHub:
- Repositório:
- Branch:
- Commit implantado:

VPS:
- Host:
- Diretório:
- Usuário da aplicação:
- Serviço:
- Porta interna:
- URL pública:

PostgreSQL:
- Versão:
- Host:
- Porta:
- Banco:
- Role:
- Migrations:
- Backup:
- Senha: NÃO EXIBIDA

Validação:
- Testes:
- Health check:
- API:
- Persistência:
- Nginx:
- HTTPS:

Rollback:
- Release anterior:
- Backup Nginx:
- Backup banco:

Pendências:
- ...
```

Não mostrar senhas, chaves privadas, tokens, connection string completa, `.env`, cookies ou credenciais administrativas.

## Critério de conclusão

Somente concluir quando:

- o código estiver no GitHub;
- a VPS estiver no commit informado;
- a aplicação rodar como usuário não-root;
- PostgreSQL estiver ativo;
- banco e role exclusivos existirem;
- migrations estiverem aplicadas;
- os dados persistirem;
- Nginx estiver válido;
- a aplicação estiver acessível;
- nenhum segredo estiver no GitHub;
- existir rollback;
- serviços existentes continuarem funcionando.
