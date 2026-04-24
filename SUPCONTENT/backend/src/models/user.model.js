import pool from '../config/db.js';

export const UserModel = {

  //  Get user by email
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  // Get user by ID + roles
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT 
          u.id,
          u.email,
          u.username,
          u.avatar_url,
          u.bio,
          u.website_url,
          u.theme_preference,
          u.language_preference,
          u.is_banned,
          u.created_at,
          COALESCE(
            array_remove(array_agg(DISTINCT r.name), NULL),
            '{}'
          ) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    return rows[0] || null;
  },

  //  Get user by username
  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  },

  //  Create user + assign default role "user"
  async createLocal({ email, username, passwordHash }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create user
      const { rows } = await client.query(
        `INSERT INTO users (email, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, username, created_at`,
        [email, username || null, passwordHash]
      );

      const user = rows[0];

      // 2. Get default role
      const { rows: roleRows } = await client.query(
        `SELECT id FROM roles WHERE name = 'user'`
      );

      const roleId = roleRows[0]?.id;

      // 3. Assign role
      if (roleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
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

  // Get roles of user only
  async findRolesByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return rows.map(r => r.name);
  },
    // =====================
  // UPDATE USER PROFILE
  // =====================
  async updateById(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    if (data.username !== undefined) {
      fields.push(`username = $${index++}`);
      values.push(data.username);
    }

    if (data.avatar_url !== undefined) {
      fields.push(`avatar_url = $${index++}`);
      values.push(data.avatar_url);
    }

    if (data.bio !== undefined) {
      fields.push(`bio = $${index++}`);
      values.push(data.bio);
    }

    if (data.website_url !== undefined) {
      fields.push(`website_url = $${index++}`);
      values.push(data.website_url);
    }

    if (data.theme_preference !== undefined) {
      fields.push(`theme_preference = $${index++}`);
      values.push(data.theme_preference);
    }

    if (data.language_preference !== undefined) {
      fields.push(`language_preference = $${index++}`);
      values.push(data.language_preference);
    }

    if (fields.length === 0) {
      throw new Error("Aucune donnée à mettre à jour");
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${index}
      RETURNING 
        id,
        email,
        username,
        avatar_url,
        bio,
        website_url,
        theme_preference,
        language_preference,
        created_at
    `;

    const { rows } = await pool.query(query, values);
    return rows[0];
  }
};