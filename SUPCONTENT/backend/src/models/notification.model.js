import pool from '../config/db.js';

export const NotificationModel = {
  async create(notification) {
    const {
      user_id,
      actor_user_id,
      type,
      entity_type,
      entity_id,
    } = notification;

    const { rows } = await pool.query(
      `INSERT INTO notifications 
        (user_id, actor_user_id, type, entity_type, entity_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, actor_user_id, type, entity_type, entity_id]
    );

    return rows[0];
  },

  async getByUser(userId, limit, offset) {
    const { rows } = await pool.query(
      `SELECT 
          n.*,
          u.id AS actor_id,
          u.username,
          u.avatar_url,
          EXISTS (
            SELECT 1
            FROM follows viewer_follow
            WHERE viewer_follow.follower_id = n.user_id
            AND viewer_follow.followed_id = n.actor_user_id
          ) AS viewer_follows_actor,
          COALESCE(m.id, recommended_movie.id) AS movie_id,
          COALESCE(m.external_id, recommended_movie.external_id) AS movie_tmdb_id,
          COALESCE(m.title, recommended_movie.title) AS movie_title,
          COALESCE(m.poster_url, recommended_movie.poster_url) AS movie_poster_url,
          source_movie.id AS source_movie_id,
          source_movie.external_id AS source_movie_tmdb_id,
          source_movie.title AS source_movie_title,
          CASE
            WHEN n.type = 'MOVIE_RECOMMENDATION' AND source_movie.title IS NOT NULL AND recommended_movie.title IS NOT NULL
              THEN 'because you added "' || source_movie.title || '", you might enjoy "' || recommended_movie.title || '"'
            ELSE NULL
          END AS message
       FROM notifications n
       LEFT JOIN users u ON u.id = n.actor_user_id
       LEFT JOIN movies m ON n.entity_type = 'MOVIE' AND n.entity_id = m.id::text
       LEFT JOIN movies source_movie
         ON source_movie.id::text = CASE
          WHEN n.entity_type = 'MOVIE_RECOMMENDATION' AND n.entity_id LIKE '{%'
            THEN n.entity_id::jsonb ->> 'sourceMovieId'
          ELSE NULL
        END
       LEFT JOIN movies recommended_movie
         ON recommended_movie.id::text = CASE
          WHEN n.entity_type = 'MOVIE_RECOMMENDATION' AND n.entity_id LIKE '{%'
            THEN n.entity_id::jsonb ->> 'recommendationMovieId'
          ELSE NULL
        END
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return rows;
  },

  async markAsRead(notificationId, userId) {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    return rows[0];
  },

  async markAllAsRead(userId) {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );

    return rows;
  },

  async getUnreadCount(userId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return rows[0].count;
  },
};
