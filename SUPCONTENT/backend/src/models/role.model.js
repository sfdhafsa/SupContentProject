import pool from '../config/db.js';

export const RoleModel = {

  async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM roles ORDER BY id'
    );
    return rows;
  },

  async findByName(name) {
    const { rows } = await pool.query(
      'SELECT * FROM roles WHERE name = $1',
      [name]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create(name) {
    const { rows } = await pool.query(
      `INSERT INTO roles (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name.toLowerCase()]
    );

    return rows[0] || null;
  },

  async assignRoleToUser(userId, roleId) {
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, roleId]
    );
  },

  async removeRoleFromUser(userId, roleId) {
    await pool.query(
      `DELETE FROM user_roles
       WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );
  },

  async getRolesByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT r.name
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return rows.map(r => r.name);
  }
};