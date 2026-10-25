# A4 — Downloads e CORS do GED

**Data:** 15/10/2026. Código em [infra/ged/app/backend](../../../infra/ged/app/backend). Esta evidência depende do smoke HTTPS descrito na [A3](A3-prefixo.md).

## Controle aplicado

- `express.static('/uploads')` foi removido do entrypoint real `backend/server.js`. O endpoint `GET /uploads/*` aceita apenas pastas conhecidas, rejeita travessia de diretório e symlinks fora da raiz, consulta a referência no banco e entrega o arquivo com `nosniff` e `private, no-store`.
- Versões de documentos exigem JWT válido, sessão ativa, permissão `documents.download`, mesma empresa e `canAccessDocument`, que considera status, visibilidade e departamento. Anexos de tarefa e RNC exigem a referência no banco e as regras de leitura respectivas. Arquivos órfãos não são baixáveis, mas permanecem no disco.
- Somente arquivo e QR vinculados a uma linha de `calibration_certificates` têm leitura pública, por caminho explícito em `calibrations/`; a rota pública `/api/calibrations/public/:id` continua disponível.
- Para links diretos, o login emite `ged_download_session` com JWT existente, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/unificado/ged/uploads/` e máximo de 8 horas. A consulta `/api/auth/me` renova o cookie quando o JWT de cabeçalho ainda é válido; logout chama `/api/auth/logout` e o limpa. A API de escrita segue exigindo `Authorization: Bearer`; o cookie só é aceito na rota de download. A revogação por `session_version`, inativação e troca obrigatória de senha é reaproveitada do middleware de autenticação.
- CORS aceita somente `https://concrefer.concretrack.com.br`. Origem diferente não recebe `Access-Control-Allow-Origin`. O SMTP e alertas de expiração permanecem desligados no destino até o corte.

## Testes

O [smoke automatizado](../../../infra/ged/a3-download-smoke.js) foi executado **dentro do backend isolado** com JWT assinado para usuário já existente, sem exibir o token: arquivo privado sem cookie **401**; versão autorizada **200**, 408.064 bytes; arquivo sem referência **403**; travessia sem acesso; **9** arquivos/QR de calibração públicos **200**; verificações públicas **200**; CORS permitido e não permitido conforme origem. Todos os usuários ativos restaurados podiam ler essa versão, então não houve conta real sem permissão para ensaiar o `403` nessa mesma referência. `node --check` e o teste de armazenamento passaram.

Links de `/uploads/` copiados fora do sistema agora exigem uma sessão GED válida no domínio novo. O [smoke HTTPS com cookie válido](../../../infra/ged/a3-https-cookie-smoke.py) confirmou que o Nginx encaminha o cookie e entrega a versão autorizada com HTTP **200** e 408.064 bytes; sem cookie, a mesma versão retorna **401**. `GET /api/auth/me` via Nginx retornou **200** com Bearer e **401** quando recebeu apenas o cookie de download, confirmando que este não autentica a API. O `Set-Cookie` de um login com senha real e o envio automático pelo navegador ficam para A5. O Nginx do domínio antigo não foi modificado.
