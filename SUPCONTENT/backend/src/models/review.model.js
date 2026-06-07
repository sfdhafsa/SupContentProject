// src/models/review.model.js

import pool from "../config/db.js";

let featuredColumnsReady = false;

export const ReviewModel = {
  async ensureFeaturedColumns() {
    if (featuredColumnsReady) return;

    await pool.query(
      `
      ALTER TABLE reviews
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS featured_by UUID,
      ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP;
      `
    );

    await pool.query(
      `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'reviews_featured_by_fkey'
        ) THEN
          ALTER TABLE reviews
          ADD CONSTRAINT reviews_featured_by_fkey
          FOREIGN KEY (featured_by) REFERENCES users (id) ON DELETE SET NULL;
        END IF;
      END $$;
      `
    );

    featuredColumnsReady = true;
  },

  async create({
    user_id,
    movie_id,
    rating,
    text,
    contains_spoiler,
  }) {
    await this.ensureFeaturedColumns();

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
    await this.ensureFeaturedColumns();

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
    await this.ensureFeaturedColumns();

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
    await this.ensureFeaturedColumns();

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
      ORDER BY r.is_featured DESC, r.featured_at DESC NULLS LAST, r.created_at DESC
      `,
      [movieId]
    );

    return rows;
  },

  async findAllForAdmin({ featured } = {}) {
    await this.ensureFeaturedColumns();

    const values = [];
    const featuredFilter =
      typeof featured === "boolean" ? "AND r.is_featured = $1" : "";

    if (typeof featured === "boolean") {
      values.push(featured);
    }

    const { rows } = await pool.query(
      `
      SELECT
        r.*,
        u.username,
        u.avatar_url,
        u.is_banned AS author_is_banned,
        m.external_id,
        m.title AS movie_title,
        m.poster_url,
        featured_admin.username AS featured_by_username,
        COUNT(rl.review_id)::INT AS likes_count
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN movies m ON m.id = r.movie_id
      LEFT JOIN users featured_admin ON featured_admin.id = r.featured_by
      LEFT JOIN review_likes rl ON rl.review_id = r.id
      WHERE r.deleted_at IS NULL
      AND NULLIF(BTRIM(r.text), '') IS NOT NULL
      ${featuredFilter}
      GROUP BY r.id, u.id, m.id, featured_admin.id
      ORDER BY r.is_featured DESC, r.featured_at DESC NULLS LAST, r.created_at DESC;
      `,
      values
    );

    return rows;
  },

  async update(reviewId, userId, data) {
    await this.ensureFeaturedColumns();

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
    await this.ensureFeaturedColumns();

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

  async softDeleteById(reviewId) {
    await this.ensureFeaturedColumns();

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING *;
      `,
      [reviewId]
    );

    return rows[0] || null;
  },

  async updateFeaturedStatus(reviewId, isFeatured, featuredBy) {
    await this.ensureFeaturedColumns();

    const { rows } = await pool.query(
      `
      UPDATE reviews
      SET
        is_featured = $1,
        featured_by = CASE WHEN $1 THEN $2::uuid ELSE NULL END,
        featured_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE id = $3
      AND deleted_at IS NULL
      AND (NOT $1 OR NULLIF(BTRIM(text), '') IS NOT NULL)
      RETURNING *;
      `,
      [
        isFeatured,
        featuredBy,
        reviewId,
      ]
    );

    return rows[0] || null;
  },
};

