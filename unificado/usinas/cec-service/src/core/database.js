const { Pool } = require('pg');
const { config } = require('./config');

function createPool() {
  const poolConfig = config.databaseUrl
    ? { connectionString: config.databaseUrl }
    : {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
      };

  return new Pool(Object.assign(poolConfig, {
    max: config.database.poolSize,
    idleTimeoutMillis: config.database.idleTimeoutMs,
    connectionTimeoutMillis: config.database.connectionTimeoutMs,
  }));
}

const pool = createPool();

async function query(text, params) {
  return pool.query(text, params);
}

async function readyCheck() {
  await pool.query('select 1');
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, query, readyCheck, closePool };
