import pool from "../config/db.js";

export const MessageModel = {
  async createMessage(senderId, receiverId, content) {
    const { rows } = await pool.query(
      `
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [senderId, receiverId, content]
    );

    return rows[0];
  },

  async getConversation(userId, otherUserId) {
    const { rows } = await pool.query(
      `
      SELECT
        m.*,
        sender.username AS sender_username,
        sender.avatar_url AS sender_avatar_url,
        receiver.username AS receiver_username,
        receiver.avatar_url AS receiver_avatar_url
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      JOIN users receiver ON receiver.id = m.receiver_id
      WHERE (
        m.sender_id = $1 AND m.receiver_id = $2
      ) OR (
        m.sender_id = $2 AND m.receiver_id = $1
      )
      ORDER BY m.created_at ASC;
      `,
      [userId, otherUserId]
    );

    return rows;
  },

  async getConversations(userId) {
    const { rows } = await pool.query(
      `
      WITH user_messages AS (
        SELECT
          m.*,
          CASE
            WHEN m.sender_id = $1 THEN m.receiver_id
            ELSE m.sender_id
          END AS other_user_id,
          ROW_NUMBER() OVER (
            PARTITION BY CASE
              WHEN m.sender_id = $1 THEN m.receiver_id
              ELSE m.sender_id
            END
            ORDER BY m.created_at DESC, m.id DESC
          ) AS row_number
        FROM messages m
        WHERE m.sender_id = $1 OR m.receiver_id = $1
      )
      SELECT
        user_messages.id AS last_message_id,
        user_messages.sender_id,
        user_messages.receiver_id,
        user_messages.content AS last_message_content,
        user_messages.is_read AS last_message_is_read,
        user_messages.created_at AS last_message_created_at,
        user_messages.other_user_id,
        other_user.username AS other_username,
        other_user.avatar_url AS other_avatar_url,
        COALESCE(unread_counts.unread_count, 0)::INT AS unread_count
      FROM user_messages
      JOIN users other_user ON other_user.id = user_messages.other_user_id
      LEFT JOIN (
        SELECT sender_id, COUNT(*) AS unread_count
        FROM messages
        WHERE receiver_id = $1
        AND is_read = FALSE
        GROUP BY sender_id
      ) unread_counts ON unread_counts.sender_id = user_messages.other_user_id
      WHERE user_messages.row_number = 1
      ORDER BY user_messages.created_at DESC, user_messages.id DESC;
      `,
      [userId]
    );

    return rows;
  },

  async markAsRead(messageId, userId) {
    const { rows } = await pool.query(
      `
      UPDATE messages
      SET is_read = TRUE
      WHERE id = $1
      AND receiver_id = $2
      RETURNING *;
      `,
      [messageId, userId]
    );

    return rows[0] || null;
  },
};
