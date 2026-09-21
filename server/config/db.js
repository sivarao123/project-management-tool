const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let mode = 'postgres';
let pgPool = null;
let sqliteDb = null;

// Determine if we should attempt PostgreSQL
const usePostgres = Boolean(process.env.DATABASE_URL || process.env.PGDATABASE || process.env.USE_POSTGRES === 'true');

if (usePostgres) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'taskflow',
      connectionTimeoutMillis: 2000
    });
  } catch (err) {
    console.warn('[DB] PostgreSQL initialization error, falling back to SQLite:', err.message);
    pgPool = null;
  }
}

function initSqlite() {
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'taskflow.sqlite');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  mode = 'sqlite';
  console.log(`[DB] Using SQLite database at: ${dbPath}`);
  initTablesSqlite();
}

function initTablesSqlite() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'Member',
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#4F46E5',
      priority TEXT DEFAULT 'Medium',
      start_date DATE,
      due_date DATE,
      status TEXT DEFAULT 'Active',
      is_archived INTEGER DEFAULT 0,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'Member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'TODO',
      priority TEXT DEFAULT 'Medium',
      position INTEGER DEFAULT 0,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#6366F1'
    );

    CREATE TABLE IF NOT EXISTS task_labels (
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      label_id INTEGER REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_logs(project_id);
  `);
}

async function query(text, params = []) {
  if (mode === 'postgres' && pgPool) {
    try {
      const res = await pgPool.query(text, params);
      return res;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('connect')) {
        console.warn('[DB] PostgreSQL connection failed, switching dynamically to SQLite fallback.');
        mode = 'sqlite';
        initSqlite();
        return query(text, params);
      }
      throw err;
    }
  }

  // SQLite execution path
  if (!sqliteDb) {
    initSqlite();
  }

  // Normalize PostgreSQL syntax to SQLite syntax if needed
  let sql = text;

  // Handle RETURNING clause in INSERT/UPDATE for SQLite
  // SQLite 3.35+ supports RETURNING natively! better-sqlite3 supports returning via .all() or .get()
  const isSelect = /^\s*(SELECT|WITH|PRAGMA)/i.test(sql);
  const hasReturning = /RETURNING\s+/i.test(sql);

  // Convert PostgreSQL $1, $2, $1 placeholders to SQLite ? and remap parameters correctly
  const remappedParams = [];
  const sqliteSql = sql.replace(/\$(\d+)/g, (match, num) => {
    const idx = parseInt(num, 10) - 1;
    remappedParams.push(params[idx]);
    return '?';
  });

  try {
    const stmt = sqliteDb.prepare(sqliteSql);
    if (isSelect || hasReturning) {
      const rows = stmt.all(...remappedParams);
      return {
        rows,
        rowCount: rows.length
      };
    } else {
      const info = stmt.run(...remappedParams);
      return {
        rows: info.lastInsertRowid ? [{ id: Number(info.lastInsertRowid) }] : [],
        rowCount: info.changes
      };
    }
  } catch (err) {
    console.error('[DB Query Error]', err.message, '\nSQL:', sqliteSql, '\nParams:', remappedParams);
    throw err;
  }
}

// Initial DB check
if (!pgPool) {
  initSqlite();
} else {
  pgPool.query('SELECT 1').then(() => {
    console.log('[DB] Connected successfully to PostgreSQL.');
    mode = 'postgres';
  }).catch(() => {
    console.warn('[DB] PostgreSQL server not reachable. Activating embedded SQLite engine.');
    initSqlite();
  });
}

module.exports = {
  query,
  getMode: () => mode
};
