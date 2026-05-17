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
          u.avatar_url
       FROM notifications n
       LEFT JOIN users u ON u.id = n.actor_user_id
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