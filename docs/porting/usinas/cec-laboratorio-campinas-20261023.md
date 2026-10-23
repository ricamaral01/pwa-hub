# Campinas — Controle Estatístico em Laboratórios

Publicado em `https://concrefer.concretrack.com.br/unificado/laboratorio/cec/`.

## Origem e paridade

- Telas do ERP copiadas de `/var/www/concretrack-erp/public/cec/` na VPS `31.97.241.84`: visão geral, resultados, relatório, leitor e etiquetas.
- A análise ativa foi copiada de `https://usina.concretrack.com.br/controle-estatistico/` com suas páginas `index.html`, `resultado-cp.html`, `relatorio.html`, `api-client.js`, manifesto e service worker.
- As páginas `resultados/` e `relatorio/` do ERP eram estruturas sem carregamento de dados. O menu novo aponta para as versões funcionais da análise; as estruturas originais continuam disponíveis no pacote.
- O botão de dashboard do ERP não tinha tela própria e caía na página inicial. No novo hub abre o relatório estatístico ativo.
- Leitor e etiquetas mantêm HTML, estilos, cálculo de datas, formato do QR, geração de PDF, validação de MPa e fila offline. Mudaram somente URLs internas, autenticação e caminhos dos arquivos do PWA.

## Dados e API

- A API `/unificado/laboratorio/cec-api/` devolve o contrato antigo de `/qrcp` e `/massadas` por meio do serviço CEC na própria VPS (`127.0.0.1:3086`).
- `POST /qrcp` grava em `controle_est_concre_campinas`; `GET /qrcp` lê seu histórico. A exclusão permanece desabilitada.
- `/massadas` lê `public.tbl_massadas` espelhada na mesma VPS. A API devolve data `YYYY-MM-DD` para preservar o cálculo original das etiquetas.
- `/rompimentos-grupos` alimenta as páginas de análise a partir do banco novo.
- A autenticação é a sessão do Unificado com permissão de Laboratório/CEC. A API retorna `401` quando a sessão expira para preservar a fila offline do leitor.

## Validação de publicação

- Sintaxe Python, JavaScript, JSON e Nginx validada; serviços `laboratorio-unificado`, `mapa-unificado-auth` e `cec-campinas-api` ativos.
- Com sessão autorizada, páginas, PWA, histórico, massadas e estatísticas responderam HTTP 200 na VPS nova.
- No navegador, a etiqueta gerou oito QR para quatro idades, com o payload antigo intacto, e baixou PDF.
- No navegador, o leitor enviou um POST simulado e preservou uma leitura na fila offline.
- Sem sessão, a API retorna HTTP 401 e a página do leitor redireciona ao login.

## Operação

Após instalar e confirmar o leitor novo no celular da usina, desativar o PWA antigo de `dautomacao.com/concretrack/cec/leitura/`. O leitor antigo continua encaminhado ao banco novo até ser removido do aparelho. Instalar o novo em `https://concrefer.concretrack.com.br/unificado/laboratorio/cec/leitura/` com a conta do Unificado.

Backup do corte na VPS: `/opt/concrefer-unificado/backups/20261023-cec-laboratorio/`.
