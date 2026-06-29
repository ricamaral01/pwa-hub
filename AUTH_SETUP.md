# Autenticação do Hub Concretrack

## Arquitetura

Senhas e sessões são gerenciadas exclusivamente pelo Supabase Auth. A tabela `users_app` não contém senhas. O frontend usa somente a chave pública `anon`; operações administrativas usam `SUPABASE_SERVICE_ROLE_KEY` dentro das Edge Functions.

O GitHub Pages continua público no nível dos arquivos estáticos. O guard redireciona usuários sem sessão e o RLS impede acesso aos dados privados.

## Aplicar o backend

```powershell
npx supabase login
npx supabase link --project-ref fbvvdyirhtgvycullsqy
npx supabase db push
npx supabase secrets set APP_ORIGIN=https://usina.concretrack.com.br
npx supabase functions deploy auth-login --no-verify-jwt
npx supabase functions deploy admin-users
npx supabase functions deploy change-password
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são disponibilizadas automaticamente às Edge Functions pelo Supabase.

## Criar o primeiro Master

Copie `.env.example` para `.env`, preencha localmente e execute o seed. `.env` é ignorado pelo Git. Não use uma senha real permanente; ela será trocada no primeiro acesso.

```powershell
npm install
npm run seed:master
```

Para recuperar um Master, use o painel Supabase Auth para redefinir a senha ou execute a ação de redefinição com outro Master. O seed recusa execução quando já existem usuários.

## Testes

```powershell
npm test
```

Valide em produção: redirecionamento sem sessão, primeiro acesso, logout, bloqueio por nível e administração exclusiva Master.
