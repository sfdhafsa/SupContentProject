// src/models/review.model.js

import db from "../config/db.js";

const ReviewModel = {
  // 🔹 CREATE
  async create({ user_id, movie_id, rating, text, contains_spoiler }) {
    const query = `
      INSERT INTO reviews (
        user_id,
        movie_id,
        rating,
        text,
        contains_spoiler
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      user_id,
      movie_id,
      rating,
      text,
      contains_spoiler ?? false,
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  // 🔹 FIND by ID (only active)
  async findById(reviewId) {
    const query = `
      SELECT *
      FROM reviews
      WHERE id = $1
      AND deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [reviewId]);
    return rows[0];
  },

  // 🔹 FIND by user + movie (respect UNIQUE)
  async findByUserAndMovie(userId, movieId) {
    const query = `
      SELECT *
      FROM reviews
      WHERE user_id = $1
      AND movie_id = $2
      AND deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [userId, movieId]);
    return rows[0];
  },

  // 🔹 GET all reviews for a movie
  async findByMovieId(movieId) {
    const query = `
      SELECT 
        r.*,
        u.username,
        u.avatar_url
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.movie_id = $1
      AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC;
    `;

    const { rows } = await db.query(query, [movieId]);
    return rows;
  },

  // 🔹 UPDATE (ownership handled in service)
  async update(reviewId, userId, { rating, text, contains_spoiler }) {
    const query = `
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
    `;

    const values = [
      rating,
      text,
      contains_spoiler,
      reviewId,
      userId,
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  // 🔹 SOFT DELETE
  async softDelete(reviewId, userId) {
    const query = `
      UPDATE reviews
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
      AND user_id = $2
      AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, [reviewId, userId]);
    return rows[0];
  },

  // 🔹 OPTIONAL: get reviews with likes count (useful later)
  async findByMovieIdWithLikes(movieId) {
    const query = `
      SELECT 
        r.*,
        u.username,
        u.avatar_url,
        COUNT(rl.review_id) AS likes_count
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      LEFT JOIN review_likes rl ON rl.review_id = r.id
      WHERE r.movie_id = $1
      AND r.deleted_at IS NULL
      GROUP BY r.id, u.username, u.avatar_url
      ORDER BY r.created_at DESC;
    `;

    const { rows } = await db.query(query, [movieId]);
    return rows;
  }
};

export default ReviewModel;