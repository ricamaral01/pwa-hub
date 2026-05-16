# DOCFLOW

**DOCFLOW** – Plataforma SaaS de Gerenciamento Eletrônico de Documentos (GED) para ambientes industriais regulados.

## Visão geral
- **Backend**: FastAPI (Python 3.11) com JWT, Supabase Auth e Celery.
- **Frontend**: React 18 + Vite + Tailwind CSS (PWA).
- **Banco de dados**: Supabase (PostgreSQL) com RLS e políticas de multi‑tenant.
- **Deploy**: VPS Ubuntu 22.04 – Nginx + Gunicorn + Systemd, Docker‑Compose para dev local.

## Requisitos
- Python 3.11+, Node 20+, Docker Desktop, Redis, conta Supabase, Service Account do Google Drive.

## Iniciando (dev local)
```bash
# Clone e entre no diretório
git clone https://github.com/concrefer/docflow.git
cd docflow

# Copie .env.example e ajuste variáveis
cp backend/.env.example backend/.env

# Inicie tudo com Docker Compose
docker compose up -d
```
A API estará em `http://localhost:8000` e o frontend em `http://localhost:5173`.

## Deploy VPS
Veja o script `scripts/deploy.sh` e o workflow GitHub Actions (`.github/workflows/deploy.yml`).

---
*Este README é gerado automaticamente pela Antigravity.*
