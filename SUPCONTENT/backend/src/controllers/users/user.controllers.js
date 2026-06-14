/* eslint-disable no-undef */
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import { UserModel } from '../../models/user.model.js';
import pool from '../../config/db.js';

const getPublicBaseUrl = (req) =>
  process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

const getLocalAvatarPath = (avatarUrl) => {
  if (!avatarUrl?.includes('/uploads/avatars/')) return null;

  return path.join('uploads', 'avatars', path.basename(avatarUrl));
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return `"${value.toISOString()}"`;
  if (Array.isArray(value)) return `"${value.join(';').replace(/"/g, '""')}"`;
  if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;

  return `"${String(value).replace(/"/g, '""')}"`;
};

const normalizeDate = (value) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeDateFields = (row, fields) =>
  fields.reduce(
    (normalized, field) => ({
      ...normalized,
      [field]: normalizeDate(row[field]),
    }),
    { ...row }
  );

const toCsvSection = (title, rows) => {
  if (!rows.length) return `${title}\n`;

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(',')
  );

  return `${title}\n${headers.join(',')}\n${lines.join('\n')}\n`;
};

const getExportData = async (userId) => {
  const user = await UserModel.findById(userId);

  if (!user) return null;

  const { password_hash, is_banned, ...profile } = user;

  const [library, customLists, reviews] = await Promise.all([
    pool.query(
      `SELECT
         ul.id,
         ul.status,
         ul.started_at,
         ul.completed_at,
         ul.last_interaction_at,
         ul.created_at,
         ul.updated_at,
         m.id AS movie_id,
         m.external_id,
         m.source_api,
         m.title,
         m.poster_url,
         m.release_date,
         m.runtime_minutes
       FROM user_library ul
       JOIN movies m ON m.id = ul.movie_id
       WHERE ul.user_id = $1
       ORDER BY ul.updated_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT
         cl.id,
         cl.name,
         cl.description,
         cl.is_public,
         cl.created_at,
         cl.updated_at,
         COALESCE(
           json_agg(
             json_build_object(
               'id', m.id,
               'external_id', m.external_id,
               'source_api', m.source_api,
               'title', m.title,
               'poster_url', m.poster_url,
               'release_date', m.release_date,
               'runtime_minutes', m.runtime_minutes,
               'added_at', clm.added_at,
               'position', clm.position
             )
             ORDER BY clm.added_at DESC
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'
         ) AS movies
       FROM custom_lists cl
       LEFT JOIN custom_list_movies clm ON clm.list_id = cl.id
       LEFT JOIN movies m ON m.id = clm.movie_id
       WHERE cl.user_id = $1
       GROUP BY cl.id
       ORDER BY cl.updated_at DESC`,
      [userId]
    ),
    pool.query(
      `SELECT
         r.id,
         r.rating,
         r.text,
         r.contains_spoiler,
         r.created_at,
         r.updated_at,
         r.deleted_at,
         m.id AS movie_id,
         m.external_id,
         m.source_api,
         m.title,
         m.poster_url,
         m.release_date
       FROM reviews r
       JOIN movies m ON m.id = r.movie_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    ),
  ]);

  return {
    exported_at: new Date().toISOString(),
    profile: normalizeDateFields(profile, ['created_at', 'updated_at', 'banned_at']),
    library: library.rows.map((row) =>
      normalizeDateFields(row, ['started_at', 'completed_at', 'last_interaction_at', 'created_at', 'updated_at', 'release_date'])
    ),
    custom_lists: customLists.rows.map((row) => ({
      ...normalizeDateFields(row, ['created_at', 'updated_at']),
      movies: (row.movies || []).map((movie) => normalizeDateFields(movie, ['release_date', 'added_at'])),
    })),
    reviews: reviews.rows.map((row) =>
      normalizeDateFields(row, ['created_at', 'updated_at', 'deleted_at', 'release_date'])
    ),
  };
};

// =====================
// GET /api/users/me
// =====================
export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const { password_hash, ...safeUser } = user;
    res.json({ user: normalizeDateFields(safeUser, ['created_at', 'updated_at', 'banned_at']) });

  } catch (err) {
    next(err);
  }
};

// =====================
// PUT /api/users/me
// =====================
export const updateMe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const updatedUser = await UserModel.updateById(userId, req.body);

    res.json({
      message: 'Profil mis à jour.',
      user: normalizeDateFields(updatedUser, ['created_at', 'updated_at', 'banned_at']),
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/me/notification-preferences
// =====================
export const getNotificationPreferences = async (req, res, next) => {
  try {
    const preferences = await UserModel.getNotificationPreferences(req.user.userId);

    if (!preferences) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    res.json({ preferences });
  } catch (err) {
    next(err);
  }
};

// =====================
// PATCH /api/users/me/notification-preferences
// =====================
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const preferences = await UserModel.updateNotificationPreferences(
      req.user.userId,
      req.body || {}
    );

    if (!preferences) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    res.json({
      message: 'Preferences de notification mises a jour.',
      preferences,
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// PATCH /api/users/me/password
// =====================
export const updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Les deux mots de passe sont requis.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
    }

    // Récupère le user avec le hash
    const user = await UserModel.findByIdWithPassword(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Vérifie l'ancien mot de passe
    const isValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    }

    // Hash et sauvegarde le nouveau
    const newHash = await bcrypt.hash(new_password, 10);
    await UserModel.updatePassword(req.user.userId, newHash);

    res.json({ message: 'Mot de passe mis à jour avec succès.' });

  } catch (err) {
    next(err);
  }
};

// =====================
// PATCH /api/users/me/avatar
// =====================
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    const userId = req.user.userId;

    // Récupère l'ancien avatar pour le supprimer
    const user = await UserModel.findById(userId);
    const oldPath = getLocalAvatarPath(user?.avatar_url);
    if (oldPath && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }

    // URL publique de l'avatar
    const avatarUrl = `${getPublicBaseUrl(req)}/uploads/avatars/${req.file.filename}`;

    const updatedUser = await UserModel.updateById(userId, { avatar_url: avatarUrl });

    const { password_hash, ...safeUser } = updatedUser;

    res.json({
      message: 'Avatar mis à jour.',
      user: normalizeDateFields(safeUser, ['created_at', 'updated_at', 'banned_at']),
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/me/export
// =====================
export const exportMyData = async (req, res, next) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const exportData = await getExportData(req.user.userId);

    if (!exportData) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="supmovies-data.csv"');

      const csv = [
        toCsvSection('profile', [exportData.profile]),
        toCsvSection('library', exportData.library),
        toCsvSection('custom_lists', exportData.custom_lists),
        toCsvSection('reviews', exportData.reviews),
      ].join('\n');

      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="supmovies-data.json"');
    res.json(exportData);

  } catch (err) {
    next(err);
  }
};

// =====================
// DELETE /api/users/me
// =====================
export const deleteMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Supprime l'avatar si existant
    const user = await UserModel.findById(userId);
    const avatarPath = getLocalAvatarPath(user?.avatar_url);
    if (avatarPath && fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    await UserModel.deleteById(userId);

    res.json({ message: 'Compte supprimé avec succès.' });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/:id (PUBLIC)
// =====================
export const getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const { password_hash, is_banned, email, ...publicUser } = user;

    res.json({ user: normalizeDateFields(publicUser, ['created_at', 'updated_at', 'banned_at']) });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/search?q=username
// =====================
export const searchUsers = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();

    if (query.length < 2) {
      return res.json({ users: [] });
    }

    const users = await UserModel.searchByUsername(query, req.user.userId);

    return res.json({ users });
  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/:id/activity (PUBLIC)
// =====================
export const getPublicUserActivity = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const includePrivateLists = String(req.user?.userId || '') === String(userId);
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const [reviews, publicLists, likedReviews, comments, followers, following, watched] = await Promise.all([
      pool.query(
        `SELECT
           r.id,
           r.rating,
           r.text,
           r.contains_spoiler,
           r.created_at,
           r.updated_at,
           m.id AS movie_id,
           m.external_id,
           m.source_api,
           m.title,
           m.poster_url,
           m.release_date,
           COUNT(DISTINCT rl.user_id)::INT AS likes_count,
           COUNT(DISTINCT c.id)::INT AS comments_count
         FROM reviews r
         JOIN movies m ON m.id = r.movie_id
         LEFT JOIN review_likes rl ON rl.review_id = r.id
         LEFT JOIN comments c ON c.review_id = r.id AND c.deleted_at IS NULL
         WHERE r.user_id = $1
           AND r.deleted_at IS NULL
         GROUP BY r.id, m.id
         ORDER BY r.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT
           cl.id,
           cl.name,
           cl.description,
           cl.is_public,
           cl.created_at,
           cl.updated_at,
           COUNT(clm.movie_id)::INT AS movie_count
         FROM custom_lists cl
         LEFT JOIN custom_list_movies clm ON clm.list_id = cl.id
         WHERE cl.user_id = $1
           AND ($2::BOOLEAN OR cl.is_public = TRUE)
         GROUP BY cl.id
         ORDER BY cl.created_at DESC`,
        [userId, includePrivateLists]
      ),
      pool.query(
        `SELECT
           rl.review_id AS id,
           rl.created_at,
           r.rating,
           r.text AS review_text,
           m.external_id,
           m.title,
           m.poster_url,
           m.release_date
         FROM review_likes rl
         JOIN reviews r ON r.id = rl.review_id AND r.deleted_at IS NULL
         JOIN movies m ON m.id = r.movie_id
         WHERE rl.user_id = $1
         ORDER BY rl.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT
           c.id,
           c.text,
           c.created_at,
           c.review_id,
           r.rating,
           r.text AS review_text,
           m.external_id,
           m.title,
           m.poster_url,
           m.release_date
         FROM comments c
         JOIN reviews r ON r.id = c.review_id AND r.deleted_at IS NULL
         JOIN movies m ON m.id = r.movie_id
         WHERE c.user_id = $1
           AND c.deleted_at IS NULL
         ORDER BY c.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*)::INT AS count FROM follows WHERE followed_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*)::INT AS count FROM follows WHERE follower_id = $1`,
        [userId]
      ),
      pool.query(
        `SELECT COUNT(*)::INT AS count
         FROM user_library
         WHERE user_id = $1
           AND status = 'COMPLETED'`,
        [userId]
      ),
    ]);

    const normalizedReviews = reviews.rows.map((row) =>
        normalizeDateFields(row, ['created_at', 'updated_at', 'release_date'])
      );
    const normalizedLists = publicLists.rows.map((row) =>
      normalizeDateFields(row, ['created_at', 'updated_at'])
    );
    const activities = [
      ...normalizedReviews.map((review) => ({
        type: 'REVIEW_CREATED',
        id: `review-${review.id}`,
        created_at: review.created_at,
        review,
      })),
      ...normalizedLists.map((list) => ({
        type: 'LIST_CREATED',
        id: `list-${list.id}`,
        created_at: list.created_at,
        list,
      })),
      ...likedReviews.rows.map((row) => {
        const review = normalizeDateFields(row, ['created_at', 'release_date']);
        return {
          type: 'REVIEW_LIKED',
          id: `like-${review.id}`,
          created_at: review.created_at,
          review,
        };
      }),
      ...comments.rows.map((row) => {
        const normalized = normalizeDateFields(row, ['created_at', 'release_date']);
        return {
          type: 'REVIEW_COMMENTED',
          id: `comment-${normalized.id}`,
          created_at: normalized.created_at,
          comment: { id: normalized.id, text: normalized.text },
          review: normalized,
        };
      }),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      reviews: normalizedReviews,
      lists: normalizedLists,
      activities,
      stats: {
        followers: followers.rows[0]?.count || 0,
        following: following.rows[0]?.count || 0,
        movies_watched: watched.rows[0]?.count || 0,
        reviews: reviews.rows.length,
      },
    });
  } catch (err) {
    next(err);
  }
};
