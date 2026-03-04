require('dotenv').config();
const pool = require('./pool');

const SQL = {
  createTable: `
    CREATE TABLE IF NOT EXISTS notes (
      id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      title       VARCHAR(255)  NOT NULL,
      content     TEXT,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `,

  createTriggerFn: `
    CREATE OR REPLACE FUNCTION fn_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `,

  createTrigger: `
    DROP TRIGGER IF EXISTS trg_notes_updated_at ON notes;
    CREATE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
  `,
};

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('[migrate] Running migrations...');
    await client.query(SQL.createTable);
    await client.query(SQL.createTriggerFn);
    await client.query(SQL.createTrigger);
    console.log('[migrate] Done.');
  } catch (err) {
    console.error('[migrate] Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}
migrate();