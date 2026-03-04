require('dotenv').config();
const createApp = require('./app');
const pool      = require('./db/pool');

const PORT = process.env.PORT || 8292;

async function startServer() {
  try {
    await pool.query('SELECT 1');

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[server] Could not connect to database:', err.message);
    process.exit(1);
  }
}

startServer();