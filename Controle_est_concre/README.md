# Controle_est_concre

API Node.js + PostgreSQL para persistencia dos rompimentos do QR Concreto.

## Endpoints

- `GET /health`
- `POST /api/v1/rompimentos`
- `GET /api/v1/rompimentos?limit=100`

## Deploy esperado na VPS

Pasta: `/root/Controle_est_concre`

Portas:
- App Node interno: `3086`
- Nginx externo: `8086`
- PostgreSQL: `5432` local

## Banco esperado

- Database: `controle_est_concre_db`
- User: `controle_est_concre_user`

## Observacao importante

Se o PWA estiver servido em HTTPS, a escrita dupla ideal deve ser feita pelo Apps Script ou por uma API HTTPS com dominio valido. O endpoint HTTP por IP continua util para integracoes servidor-servidor e homologacao.
