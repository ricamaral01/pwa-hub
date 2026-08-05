# Autenticacao facial operacional

Feature flag: `FACIAL_AUTH_ENABLED=false` por padrao.

Uso exclusivo: login operacional do colaborador no tablet. O fluxo exige HTTPS,
conexao com a API, chave `BIOMETRIC_ENCRYPTION_KEY` e governanca biometrica
configurada por `BIOMETRIC_GOVERNANCE_CONFIGURED=true`.

Modelo real: OpenCV SFace `face_recognition_sface_2021dec_int8bq.onnx`.
Origem: Hugging Face `opencv/face_recognition_sface`.
Licenca: Apache 2.0 conforme model card do repositorio.
Tamanho: 10.667.852 bytes.
Checksum SHA-256: `fb143eea07838aa532d1c95df5f69899974ea0140e1fba05e94204be13ed74ee`.
Modelo sintetico permanece somente em testes automatizados sem rostos reais.

Inferencia: cliente captura camera e executa prova de presenca; comparacao 1:N
ocorre no backend, limitada a empresa, unidade, colaborador ativo, biometria ativa,
dispositivo ativo e maquina vinculada.

Decisao provisoria: threshold `0.363`, margem minima `0.05`, qualidade minima
`0.60`, prova de presenca valida e resultado nao ambiguo. Esses valores exigem
calibracao fisica antes de piloto.

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
