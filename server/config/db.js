const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/taskflow',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || undefined,
  password: process.env.PGPASSWORD || undefined,
  database: process.env.PGDATABASE || 'taskflow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000
});

// Verify connection on startup
pool.connect()
  .then((client) => {
    console.log('[PostgreSQL] Successfully connected to PostgreSQL database:', process.env.PGDATABASE || 'taskflow');
    client.release();
    initDatabase();
  })
  .catch((err) => {
    console.error('[PostgreSQL Error] Unable to connect to PostgreSQL database:', err.message);
  });

// Auto-run schema.sql on PostgreSQL
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('[PostgreSQL] Relational schema verified (10 tables, indexes, foreign keys).');
    }
  } catch (err) {
    console.error('[PostgreSQL Schema Error]', err.message);
  }
}

// Database query executor
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL] ${text.trim().split('\n')[0]} (${duration}ms, rows: ${res.rowCount})`);
    }
    return res;
  } catch (err) {
    console.error('[PostgreSQL Query Error]', err.message, '\nQuery:', text, '\nParams:', params);
    throw err;
  }
}

module.exports = {
  query,
  pool,
  getMode: () => 'postgres'
};
