import pool from "../config/db.js";

export const UserLibraryModel = {
  async findEntry(userId, movieId) {
    const { rows } = await pool.query(
      `SELECT * FROM user_library WHERE user_id = $1 AND movie_id = $2`,
      [userId, movieId]
    );
    return rows[0] || null;
  },

  async create(userId, movieId, status) {
    const { rows } = await pool.query(
      `INSERT INTO user_library (user_id, movie_id, status, last_interaction_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW(), NOW())
       RETURNING *`,
      [userId, movieId, status]
    );
    return rows[0];
  },

  async update(userId, movieId, status) {
    const { rows } = await pool.query(
      `UPDATE user_library
       SET status = $1, last_interaction_at = NOW(), updated_at = NOW()
       WHERE user_id = $2 AND movie_id = $3
       RETURNING *`,
      [status, userId, movieId]
    );
    return rows[0];
  },

  async delete(userId, movieId) {
    const { rowCount } = await pool.query(
      `DELETE FROM user_library WHERE user_id = $1 AND movie_id = $2`,
      [userId, movieId]
    );
    return rowCount > 0;
  },
};