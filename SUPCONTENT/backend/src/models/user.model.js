import pool from '../config/db.js';

export const UserModel = {

  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, username, display_name, avatar_url, bio, is_public, provider, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, passwordHash, username }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, username, display_name)
       VALUES ($1, $2, $3, $3)
       RETURNING id, email, username, display_name, created_at`,
      [email, passwordHash, username]
    );
    return rows[0];
  },

  async createOAuth({ email, username, displayName, provider, providerId, avatarUrl }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, username, display_name, provider, provider_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE
         SET provider_id = EXCLUDED.provider_id,
             avatar_url  = EXCLUDED.avatar_url
       RETURNING id, email, username, display_name, avatar_url`,
      [email, username, displayName, provider, providerId, avatarUrl]
    );
    return rows[0];
  },

  async update(id, fields) {
    // Construction dynamique des champs à mettre à jour
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(fields)];
    const { rows } = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1
       RETURNING id, email, username, display_name, avatar_url, bio, is_public`,
      values
    );
    return rows[0];
  },
};