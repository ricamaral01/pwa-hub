const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error', err);
});

/**
 * Executa uma query no pool
 * @param {string} text SQL query
 * @param {Array}  params Parâmetros parametrizados
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB]', { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
}

module.exports = { pool, query };
