import pool from '../config/db.js';

let initialized = false;

const ensureTable = async () => {
  if (initialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      token TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  initialized = true;
};

export const TokenBlacklistModel = {
  async add(token, expiresAt) {
    await ensureTable();

    await pool.query(
      `INSERT INTO token_blacklist (token, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (token) DO NOTHING`,
      [token, expiresAt]
    );
  },

  async has(token) {
    await ensureTable();

    await pool.query(`DELETE FROM token_blacklist WHERE expires_at < NOW()`);

    const { rows } = await pool.query(
      `SELECT token FROM token_blacklist WHERE token = $1`,
      [token]
    );

    return rows.length > 0;
  },
};
