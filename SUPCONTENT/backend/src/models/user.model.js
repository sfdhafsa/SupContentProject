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
      `SELECT u.id, u.email, u.username, u.avatar_url, u.bio,
              u.website_url, u.theme_preference, u.language_preference,
              u.is_banned, u.created_at,
              array_agg(r.name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  },

  // Inscription locale — retourne le user créé + lui assigne le rôle USER
  async createLocal({ email, username, passwordHash }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Créer le user
      const { rows } = await client.query(
        `INSERT INTO users (email, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, username, created_at`,
        [email, username, passwordHash]
      );
      const user = rows[0];

      // 2. Récupérer l'id du rôle USER
      const { rows: roleRows } = await client.query(
        `SELECT id FROM roles WHERE name = 'USER'`
      );
      const roleId = roleRows[0]?.id;

      // 3. Assigner le rôle
      if (roleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
          [user.id, roleId]
        );
      }

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};