-- B1: roteiro psql proposto para administrador PostgreSQL. NÃO EXECUTAR antes de G-B1.
-- Fornecer qualidade_password por variável psql em canal seguro; não salvar senha no Git.
-- Rodar fora de transação porque CREATE DATABASE não pode ocorrer nela.
CREATE ROLE qualidade_app LOGIN PASSWORD :'qualidade_password';
CREATE DATABASE qualidade OWNER postgres;
REVOKE ALL ON DATABASE qualidade FROM PUBLIC;
GRANT CONNECT ON DATABASE qualidade TO qualidade_app;

\connect qualidade
-- A migration Alembic do schema Qualidade usa uma identidade administrativa separada.
-- Depois de aplicar B1-ddl-proposto.sql via Alembic, conceder apenas DML à role de serviço:
GRANT USAGE ON SCHEMA qualidade TO qualidade_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA qualidade TO qualidade_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA qualidade
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO qualidade_app;
-- PostgreSQL pode herdar CONNECT de PUBLIC nos outros bancos. Completar o isolamento
-- com pg_hba.conf específico para qualidade_app ANTES das regras genéricas:
-- local qualidade qualidade_app scram-sha-256
-- local all       qualidade_app reject
-- host qualidade qualidade_app 127.0.0.1/32 scram-sha-256
-- host all       qualidade_app 127.0.0.1/32 reject
-- host qualidade qualidade_app ::1/128      scram-sha-256
-- host all       qualidade_app ::1/128      reject
-- Recarregar e testar que qualidade_app conecta a qualidade e é recusada nos demais.
