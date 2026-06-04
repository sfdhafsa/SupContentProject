import pool from "../config/db.js";

const toStr = (id) => String(id);

export const MovieModel = {
  async findById(movieId) {
    const { rows } = await pool.query(
      `SELECT * FROM movies WHERE id = $1`,
      [movieId]
    );
    return rows[0] || null;
  },

  async findByExternalId(tmdbId) {
    const { rows } = await pool.query(
      `SELECT * FROM movies WHERE external_id = $1 AND source_api = 'tmdb'`,
      [toStr(tmdbId)]
    );
    return rows[0] || null;
  },

  async findInternalIdByTmdbId(tmdbId) {
    const { rows } = await pool.query(
      `SELECT id FROM movies WHERE external_id = $1 AND source_api = 'tmdb'`,
      [toStr(tmdbId)]
    );
    return rows[0]?.id || null;
  },

  async create(movieData) {
    const { external_id, title, overview, poster_url, release_date, runtime_minutes } = movieData;
    const { rows } = await pool.query(
      `INSERT INTO movies (external_id, source_api, title, overview, poster_url, release_date, runtime_minutes, cached_at)
       VALUES ($1, 'tmdb', $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [toStr(external_id), title, overview, poster_url, release_date, runtime_minutes]
    );
    return rows[0];
  },

  async update(tmdbId, movieData) {
    const { title, overview, poster_url, release_date, runtime_minutes } = movieData;
    const { rows } = await pool.query(
      `UPDATE movies
       SET title = $1, overview = $2, poster_url = $3, release_date = $4, runtime_minutes = $5, cached_at = NOW()
       WHERE external_id = $6 AND source_api = 'tmdb'
       RETURNING *`,
      [title, overview, poster_url, release_date, runtime_minutes, toStr(tmdbId)]
    );
    return rows[0] || null;
  },
};
