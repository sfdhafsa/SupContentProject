// src/models/reviewLike.model.js

import db from "../config/db.js";

export const ReviewLikeModel = {
  //  CREATE like
  async create(userId, reviewId) {
    const query = `
      INSERT INTO review_likes (user_id, review_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;

    const { rows } = await db.query(query, [userId, reviewId]);
    return rows[0];
  },

  //  DELETE like (unlike)
  async delete(userId, reviewId) {
    const query = `
      DELETE FROM review_likes
      WHERE user_id = $1 AND review_id = $2
      RETURNING *;
    `;

    const { rows } = await db.query(query, [userId, reviewId]);
    return rows[0];
  },

  //  CHECK if like exists
  async exists(userId, reviewId) {
    const query = `
      SELECT 1
      FROM review_likes
      WHERE user_id = $1 AND review_id = $2;
    `;

    const { rowCount } = await db.query(query, [userId, reviewId]);
    return rowCount > 0;
  },

  //  COUNT likes for a review (utile pour feed)
  async countByReviewId(reviewId) {
    const query = `
      SELECT COUNT(*)::int AS count
      FROM review_likes
      WHERE review_id = $1;
    `;

    const { rows } = await db.query(query, [reviewId]);
    return rows[0].count;
  },
};

