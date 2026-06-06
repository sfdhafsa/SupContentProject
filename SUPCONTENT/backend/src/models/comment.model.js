// src/models/comment.model.js

import db from "../config/db.js";

export const CommentModel = {
  // CREATE
  async create({
    review_id,
    user_id,
    text,
    parent_comment_id = null,
  }) {
    const query = `
      INSERT INTO comments (
        review_id,
        user_id,
        text,
        parent_comment_id
      )
      SELECT $1, $2, $3, $4
      WHERE $4::BIGINT IS NULL
      OR EXISTS (
        SELECT 1
        FROM comments parent
        WHERE parent.id = $4
        AND parent.review_id = $1
        AND parent.deleted_at IS NULL
      )
      RETURNING *;
    `;

    const values = [
      review_id,
      user_id,
      text,
      parent_comment_id,
    ];

    const { rows } = await db.query(query, values);

    return rows[0];
  },

  // FIND BY ID
  async findById(commentId) {
    const query = `
      SELECT *
      FROM comments
      WHERE id = $1
      AND deleted_at IS NULL;
    `;

    const { rows } = await db.query(query, [commentId]);

    return rows[0];
  },

  // GET COMMENTS BY REVIEW
  async findByReviewId(reviewId) {
    const query = `
      SELECT
        c.*,
        u.username,
        u.avatar_url
      FROM comments c
      JOIN users u
        ON u.id = c.user_id
      WHERE c.review_id = $1
      AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC;
    `;

    const { rows } = await db.query(query, [reviewId]);

    return rows;
  },

  // UPDATE COMMENT
  async update(commentId, userId, text) {
    const query = `
      UPDATE comments
      SET
        text = $1,
        updated_at = NOW()
      WHERE id = $2
      AND user_id = $3
      AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, [
      text,
      commentId,
      userId,
    ]);

    return rows[0];
  },

  // SOFT DELETE
  async softDelete(commentId, userId) {
    const query = `
      UPDATE comments
      SET
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      AND user_id = $2
      AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, [
      commentId,
      userId,
    ]);

    return rows[0];
  },

  async softDeleteById(commentId) {
    const query = `
      UPDATE comments
      SET
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING *;
    `;

    const { rows } = await db.query(query, [commentId]);

    return rows[0] || null;
  },
};

