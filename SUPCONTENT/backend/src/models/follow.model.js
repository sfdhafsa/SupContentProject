import pool from '../config/db.js';

export const FollowModel = {
  async findFollow(followerId, followedId) {
    const { rows } = await pool.query(
      `SELECT follower_id, followed_id, created_at
       FROM follows
       WHERE follower_id = $1 AND followed_id = $2`,
      [followerId, followedId]
    );
    return rows[0] || null;
  },

  async createFollow(followerId, followedId) {
    const { rows } = await pool.query(
      `INSERT INTO follows (follower_id, followed_id)
       VALUES ($1, $2)
       RETURNING follower_id, followed_id, created_at`,
      [followerId, followedId]
    );
    return rows[0];
  },

  async deleteFollow(followerId, followedId) {
    const { rowCount } = await pool.query(
      `DELETE FROM follows
       WHERE follower_id = $1 AND followed_id = $2`,
      [followerId, followedId]
    );
    return rowCount > 0;
  },

  async getFollowers(userId) {
    const { rows } = await pool.query(
      `SELECT 
          u.id,
          u.username,
          u.avatar_url,
          f.created_at
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.followed_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async getFollowing(userId) {
    const { rows } = await pool.query(
      `SELECT 
          u.id,
          u.username,
          u.avatar_url,
          f.created_at
       FROM follows f
       JOIN users u ON u.id = f.followed_id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async countFollowers(userId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM follows
       WHERE followed_id = $1`,
      [userId]
    );
    return rows[0].count;
  },

  async countFollowing(userId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM follows
       WHERE follower_id = $1`,
      [userId]
    );
    return rows[0].count;
  },
};