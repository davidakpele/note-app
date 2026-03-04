const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 5432,
  database:           process.env.DB_NAME     || 'notes_db',
  user:               process.env.DB_USER     || 'postgres',
  password:           process.env.DB_PASSWORD || '',
  max:                parseInt(process.env.DB_POOL_MAX)         || 10,
  min:                parseInt(process.env.DB_POOL_MIN)         || 2,
  idleTimeoutMillis:  parseInt(process.env.DB_IDLE_TIMEOUT)     || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT) || 5000,
  allowExitOnIdle:    true,
});

pool.on('error', (err) => {
  process.stderr.write(JSON.stringify({
    timestamp: new Date().toISOString(),
    level:     'ERROR',
    context:   'db:pool',
    message:   'Unexpected error on idle client',
    error:     err.message,
  }) + '\n');
  process.exit(-1);
});

module.exports = pool;