# Backend da Dosagem v2 (Apps Script)

1. Crie uma planilha nova chamada **ConcreTrack Dosagem v2**. Não use nem altere as planilhas antigas.
2. Crie um projeto Apps Script associado ou independente e faça push dos arquivos desta pasta com `clasp` após configurar o ID do script localmente. Não comite `.clasp.json` com identificadores privados.
3. Em **Configurações do projeto → Propriedades de script**, defina `PLANILHA_ID`, `ADMIN_EMAIL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Como alternativa à introspecção Supabase, configure `JWT_SECRET` e `JWT_AUDIENCE` para tokens HS256 emitidos por provedor confiável.
4. Para a importação posterior, configure `LEGADO_DOSAGEM_ID`, `LEGADO_CUSTOS_ID` e `LEGADO_FORNECEDORES_ID`. Essas planilhas são lidas sem escrita.
5. Implante como **Web App**, executar como proprietário do projeto e acesso **qualquer pessoa**. A API exige e valida o token do Hub em cada `POST`.
6. Copie a URL da implantação para `VITE_API_URL` em `.env.local`, gere novo build e publique `dosagem-concreto/v2/` no domínio do Hub.
7. Autentique como `ADMIN_EMAIL`, cadastre papéis na aba `usuarios`, simule a importação e confira os dados antes da importação efetiva.

`doGet` serve somente ao health check. Veja `docs/dosagem-v2/API.md` para o contrato. As abas de documentos e `requisicoes` são criadas na primeira utilização. O backend ainda requer testes reais no ambiente Apps Script, sobretudo autenticação, concorrência, importação e permissões.
