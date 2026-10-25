ADENDO 4.3 — Piloto em produção hoje (decisão do Ricardo, 18/10/2026)
Vale junto com a 4.1 e o Adendo 4.2. Onde este adendo contradiz os anteriores, vale este adendo. Ele não altera os portões completos F1–F4 da Release 1: eles continuam valendo para a liberação oficial.
1. Decisão
Hoje a Dosagem v2 entra na VPS como PILOTO:
- o legado continua sendo o sistema oficial;
- o piloto serve para o Ricardo e os usuários convidados testarem com dados reais;
- os 13 fluxos E2E que faltam continuam sendo desenvolvidos e, quando passarem, o piloto vira oficial por um novo deploy normal.
2. Perfil de portões "piloto"
Acrescente ao scripts/gates.mjs o perfil npm run gates -- --perfil piloto, gravado em GATES-PILOTO.json. O perfil completo (npm run gates) e o GATES.json não mudam.
Portão pilotoVerde quando (todos por comando, nesta execução)P-F1Igual à F1P-F2Igual à F2P-F3npm run build sem erro + a suíte E2E existente (P1b, P5, A1 com X1, R1-13) nos 4 tamanhos, com axe, contra a API real em Docker + smoke de login local (entrar, trocar a senha inicial, sair) nos 4 tamanhosP-F4A mesma suíte P-F3 contra o docker-compose.hml.yml + backup/restauração + compatibilidade N−1
Se o smoke de login ainda não existir, crie esse teste (é pequeno). Nenhum outro fluxo é exigido no piloto.
3. Modo piloto na aplicação (variável MODO_PILOTO=true no .env da VPS)
1. Faixa fixa no topo de todas as telas, em âmbar com ícone: "PILOTO — o sistema oficial continua sendo o legado. Não use estas cartas na produção."
2. Carta e carta de produção: a marca d'água "PILOTO — NÃO LIBERADO PARA PRODUÇÃO" sai sempre, mesmo em traço aprovado.
3. Produção (betonada do dia, registro do dosado, liberação de desforma): funciona como simulação. Grava com piloto=true, mostra "simulação" em cada registro e não libera desforma real.
4. Usuários: só existe a conta de emergência admin. O Ricardo cria os demais depois.
5. Todo registro criado no piloto tem a coluna piloto=true, adicionada por migração aditiva. Quando o sistema virar oficial, o Ricardo decide se mantém ou descarta esses dados; nada é apagado automaticamente.
6. Tudo o que for Release 2 ou ainda não estiver pronto aparece como "Em breve" e desativado, sem erro.
4. Autorização de deploy do piloto (substitui a condição do Adendo 4.2 §6.2 só para o piloto)
O deploy está autorizado assim que GATES-PILOTO.json estiver todo verde, nas mesmas regras do Adendo 4.2 §6.2:
- somente deploy-dosagem, somente pelo wrapper;
- sem root e sem instalar nada;
- reutilizando o banco, a role, o .env e o Python isolado;
- F5 (medição de 10 min) antes, e F6 com rollback só de código.
Acréscimos:
- Acrescentar MODO_PILOTO=true ao .env existente, sem alterar nenhuma outra linha.
- DNS: se dosagem.concretrack.com.br resolver para 31.97.241.84, emitir o certificado (sudo /usr/local/sbin/ctdosagem-instalar certbot) e publicar em HTTPS. Se não resolver, publicar só o desafio HTTP, validar pelo túnel SSH e deixar no relatório o comando do certbot para rodar depois.
- Depois do deploy: 
  - conferir os códigos HTTP dos 9 sites vizinhos;
  - conferir /api/v1/saude;
  - fazer login com o admin;
  - criar o P1b pelo método Principal e o A1 pelo Alternativo e conferir os valores da §17 da 4.1;
  - apagar esses dois traços de teste.
- A senha provisória do admin aparece só no terminal e no arquivo protegido da VPS (§14.3 da 4.1). Nunca vai para o relatório.
5. Depois do piloto (mesma sessão, se houver tempo, ou próximas)
Continuar os fluxos R1-01 a R1-12 e R1-14 até o npm run gates completo ficar verde. Então:
1. novo deploy normal;
2. MODO_PILOTO=false;
3. o relatório registra a virada para oficial e a decisão sobre os dados do piloto.
