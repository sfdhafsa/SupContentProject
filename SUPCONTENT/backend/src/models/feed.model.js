import pool from '../config/db.js';

export const FeedModel = {
  async getFollowingReviews(userId, limit, offset) {
    const { rows } = await pool.query(
      `
      SELECT
        r.id AS review_id,
        r.rating,
        r.text,
        r.contains_spoiler,
        r.created_at,
        r.updated_at,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url,
        m.id AS movie_id,
        m.external_id AS movie_external_id,
        m.source_api AS movie_source_api,
        m.title AS movie_title,
        m.poster_url AS movie_poster_url,
        m.release_date AS movie_release_date,
        COUNT(DISTINCT rl.user_id)::INT AS likes_count,
        COUNT(DISTINCT c.id)::INT AS comments_count,
        EXISTS (
          SELECT 1
          FROM review_likes viewer_like
          WHERE viewer_like.review_id = r.id
          AND viewer_like.user_id = $1
        ) AS has_liked
      FROM reviews r
      JOIN follows f
        ON f.followed_id = r.user_id
        AND f.follower_id = $1
      JOIN users u
        ON u.id = r.user_id
      JOIN movies m
        ON m.id = r.movie_id
      LEFT JOIN review_likes rl
        ON rl.review_id = r.id
      LEFT JOIN comments c
        ON c.review_id = r.id
        AND c.deleted_at IS NULL
      WHERE r.deleted_at IS NULL
      GROUP BY r.id, u.id, m.id
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3;
      `,
      [userId, limit, offset]
    );

    return rows;
  },
};
