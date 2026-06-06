import pool from '../config/db.js';

export const UserModel = {
  async ensureNotificationPreferenceColumns() {
    await pool.query(
      `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS notification_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
       ADD COLUMN IF NOT EXISTS notification_email_enabled BOOLEAN NOT NULL DEFAULT FALSE`
    );
  },

  // =====================
  // GET USER BY EMAIL
  // =====================
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  // =====================
  // GET USER BY ID + ROLES
  // =====================
  async findById(id) {
    await this.ensureNotificationPreferenceColumns();

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
          COALESCE(u.notification_push_enabled, TRUE) AS notification_push_enabled,
          COALESCE(u.notification_email_enabled, FALSE) AS notification_email_enabled,
          u.is_banned,
          u.created_at,
          COALESCE(
            array_remove(array_agg(DISTINCT LOWER(r.name)), NULL),
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

  // =====================
  // GET USER BY USERNAME
  // =====================
  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  },

  // =====================
  // CREATE LOCAL USER
  // =====================
  async createLocal({ email, username, passwordHash }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO users (email, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, username, created_at`,
        [email, username || null, passwordHash]
      );
      const user = rows[0];

      const { rows: roleRows } = await client.query(
        `SELECT id FROM roles WHERE LOWER(name) = 'user'`
      );
      const roleId = roleRows[0]?.id;

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

  // =====================
  // GET ROLES BY USER ID
  // =====================
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

    const allowed = [
      'username', 'avatar_url', 'bio',
      'website_url', 'theme_preference', 'language_preference',
      'notification_push_enabled', 'notification_email_enabled'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${index++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING 
        id, email, username, avatar_url, bio,
        website_url, theme_preference, language_preference,
        notification_push_enabled, notification_email_enabled, created_at
    `;

    const { rows } = await pool.query(query, values);
    return rows[0] ? this.findById(id) : null;
  },

  // =====================
  // GET USER WITH PASSWORD HASH
  // =====================
  async findByIdWithPassword(id) {
    const { rows } = await pool.query(        
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  // =====================
  // UPDATE PASSWORD
  // =====================
  async updatePassword(id, newHash) {
    await pool.query(                         // ← pool, pas db
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newHash, id]
    );
  },

  // =====================
  // PROMOTE USER TO ADMIN
  // =====================
  async promoteToAdmin(id) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: userRows } = await client.query(
        `SELECT id FROM users WHERE id = $1`,
        [id]
      );

      if (!userRows[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      const { rows: roleRows } = await client.query(
        `SELECT id FROM roles WHERE LOWER(name) = 'admin'`
      );
      const roleId = roleRows[0]?.id;

      if (!roleId) {
        throw Object.assign(new Error('Role admin introuvable.'), { status: 500 });
      }

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [id, roleId]
      );

      await client.query('COMMIT');
      return this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // =====================
  // GET NOTIFICATION PREFERENCES
  // =====================
  async getNotificationPreferences(id) {
    await this.ensureNotificationPreferenceColumns();

    const { rows } = await pool.query(
      `SELECT notification_push_enabled, notification_email_enabled
       FROM users
       WHERE id = $1`,
      [id]
    );

    return rows[0] || null;
  },

  // =====================
  // UPDATE NOTIFICATION PREFERENCES
  // =====================
  async updateNotificationPreferences(id, data) {
    await this.ensureNotificationPreferenceColumns();

    const fields = [];
    const values = [];
    let index = 1;

    const allowed = ['notification_push_enabled', 'notification_email_enabled'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${index++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      throw Object.assign(new Error('Aucune preference de notification a mettre a jour'), { status: 400 });
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${index}
       RETURNING notification_push_enabled, notification_email_enabled`,
      values
    );

    return rows[0] || null;
  },

  // =====================
  // DELETE USER
  // =====================
  async deleteById(id) {
    await pool.query(                         
      `DELETE FROM users WHERE id = $1`,
      [id]
    );
  },
};
