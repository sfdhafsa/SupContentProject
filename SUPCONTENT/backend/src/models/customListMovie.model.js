import pool from '../config/db.js';

export const CustomListMovieModel = {
  async addMovie(listId, movieId) {
    const { rows } = await pool.query(
      `INSERT INTO custom_list_movies (list_id, movie_id, added_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (list_id, movie_id) DO NOTHING
       RETURNING *`,
      [listId, movieId]
    );

    return rows[0] || null;
  },

  async removeMovie(listId, movieId) {
    const { rows } = await pool.query(
      `DELETE FROM custom_list_movies
       WHERE list_id = $1 AND movie_id = $2
       RETURNING *`,
      [listId, movieId]
    );

    return rows[0] || null;
  },
};
