import pool from '../config/db.js';

export const CustomListModel = {
  async findById(listId) {
    const { rows } = await pool.query(
      'SELECT * FROM custom_lists WHERE id = $1',
      [listId]
    );

    return rows[0] || null;
  },

  async touchUpdatedAt(listId) {
    const { rows } = await pool.query(
      `UPDATE custom_lists
       SET updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [listId]
    );

    return rows[0] || null;
  },
};
