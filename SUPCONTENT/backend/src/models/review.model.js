// src/models/review.model.js

import pool from "../config/db.js";

export const ReviewModel = {
  async create({
    user_id,
    movie_id,
    rating,
    text,
    contains_spoiler,
  }) {
    const { rows } = await pool.query(
      `
      INSERT INTO reviews (
        user_id,
        movie_id,
        rating,
        text,
        contains_spoiler
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [
        user_id,
        movie_id,
        rating,
        text || null,
        contains_spoiler ?? false,
      ]
    );

    return rows[0];
  },

  async findById(reviewId) {
    const { rows } = await pool.query(
      `
      SELECT r.*, u.username, u.avatar_url
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = $1
      AND r.deleted_at IS NULL
      `,
      [reviewId]
    );

    return rows[0] || null;
  },

  async findByUserAndMovie(userId, movieId) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM reviews
      WHERE user_id = $1
      AND movie_id = $2
      AND deleted_at IS NULL
      `,
      [userId, movieId]
    );

    return rows[0] || null;
  },

  async findByMovieId(movieId) {
    const { rows } = await pool.query(
      `
      SELECT
        r.*,
        u.username,
        u.avatar_url,
        COUNT(rl.review_id)::INT AS likes_count
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN review_likes rl ON rl.review_id = r.id
      WHERE r.movie_id = $1
      AND r.deleted_at IS NULL
      GROUP BY r.id, u.id
      ORDER BY r.created_at DESC
      `,
      [movieId]
    );

    return rows;
  },

  async update(reviewId, userId, data) {
    const { rating, text, contains_spoiler } = data;

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET
        rating = $1,
        text = $2,
        contains_spoiler = $3,
        updated_at = NOW()
      WHERE id = $4
      AND user_id = $5
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [
        rating,
        text,
        contains_spoiler,
        reviewId,
        userId,
      ]
    );

    return rows[0] || null;
  },

  async softDelete(reviewId, userId) {
    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      AND user_id = $2
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [reviewId, userId]
    );

    return rows[0] || null;
  },
};