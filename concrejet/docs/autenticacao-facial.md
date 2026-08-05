# Autenticacao facial operacional

Feature flag: `FACIAL_AUTH_ENABLED=false` por padrao.

Uso exclusivo: login operacional do colaborador no tablet. O fluxo exige HTTPS,
conexao com a API, chave `BIOMETRIC_ENCRYPTION_KEY` e governanca biometrica
configurada por `BIOMETRIC_GOVERNANCE_CONFIGURED=true`.

Modelo: `SyntheticFaceEmbedding dev-1.0` no ambiente de desenvolvimento e testes,
sem rostos reais. A arquitetura reserva Face Landmarker para enquadramento,
landmarks e prova de presenca, e modelo dedicado de embeddings para identidade.
Landmarks nao sao usados como identidade.

Inferencia: cliente captura camera e executa prova de presenca; comparacao 1:N
ocorre no backend, limitada a empresa, unidade, colaborador ativo, biometria ativa,
dispositivo ativo e maquina vinculada.

Decisao: threshold `0.82`, margem minima `0.04` entre primeiro e segundo candidato,
qualidade minima `0.55`, prova de presenca valida e resultado nao ambiguo.

Endpoints:
- `POST /employees/:id/face-enrollment/start`
- `POST /employees/:id/face-enrollment/complete`
- `POST /employees/:id/face-enrollment/test`
- `POST /employees/:id/face-enrollment/revoke`
- `DELETE /employees/:id/face-enrollment`
- `GET /employees/:id/face-enrollment/status`
- `POST /auth/operator-face/challenge`
- `POST /auth/operator-face-login`

Nao armazenar fotos, videos, frames ou embeddings crus em banco, logs, auditoria,
localStorage, sessionStorage ou IndexedDB.
