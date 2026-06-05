import db from '../../config/db.js';
import { MovieModel } from '../../models/movie.model.js';
import { resolveMovieId } from './movieResolver.js';
import { generateMovieRecommendations } from '../recommendations/movieRecommendations.service.js';

const VALID_STATUSES = ['TO_WATCH', 'IN_PROGRESS', 'COMPLETED', 'DROPPED'];
const serviceError = (message, status) => Object.assign(new Error(message), { status });

async function getUserLibrary(userId, status = null) {
  let query = `
    SELECT
      ul.id,
      ul.status,
      ul.created_at,
      ul.updated_at,
      m.id AS movie_id,
      m.external_id,
      m.title,
      m.poster_url,
      m.release_date,
      m.runtime_minutes
    FROM user_library ul
    JOIN movies m ON ul.movie_id = m.id
    WHERE ul.user_id = $1
  `;
  const params = [userId];

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      throw serviceError('Statut invalide', 400);
    }

    query += ` AND ul.status = $2`;
    params.push(status);
  }

  query += ` ORDER BY ul.updated_at DESC`;
  const { rows } = await db.query(query, params);
  return rows;
}

async function upsertLibraryEntry(userId, movieRef, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw serviceError('Statut invalide', 400);
  }

  const movieId = await resolveMovieId(movieRef);
  const existing = await db.query(
    `SELECT id FROM user_library WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );

  const { rows } = await db.query(
    `INSERT INTO user_library (user_id, movie_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (user_id, movie_id)
     DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
     RETURNING *`,
    [userId, movieId, status]
  );

  if (existing.rows.length === 0) {
    try {
      const movie = await MovieModel.findById(movieId);
      if (movie?.external_id) {
        await generateMovieRecommendations(userId, movie.external_id);
      }
    } catch (err) {
      globalThis.console.error('[RECOMMENDATIONS] Failed to generate library recommendations:', err);
    }
  }

  return rows[0];
}

async function removeLibraryEntry(userId, movieId) {
  const { rows } = await db.query(
    `DELETE FROM user_library WHERE user_id = $1 AND movie_id = $2 RETURNING *`,
    [userId, movieId]
  );

  if (rows.length === 0) {
    throw serviceError('Entree introuvable', 404);
  }

  return rows[0];
}

async function getMovieStatus(userId, movieId) {
  const { rows } = await db.query(
    `SELECT status FROM user_library WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );

  return rows[0] || null;
}

async function getUserStats(userId) {
  const statusCountsQuery = `
    SELECT status, COUNT(*) AS count
    FROM user_library
    WHERE user_id = $1
    GROUP BY status
  `;

  const totalRuntimeQuery = `
    SELECT COALESCE(SUM(m.runtime_minutes), 0) AS total_minutes
    FROM user_library ul
    JOIN movies m ON ul.movie_id = m.id
    WHERE ul.user_id = $1 AND ul.status = 'COMPLETED'
  `;

  const avgRatingQuery = `
    SELECT ROUND(AVG(r.rating)::numeric, 1) AS avg_rating
    FROM reviews r
    WHERE r.user_id = $1
  `;

  const recentActivityQuery = `
    SELECT
      ul.status,
      ul.updated_at,
      m.title,
      m.poster_url,
      m.external_id
    FROM user_library ul
    JOIN movies m ON ul.movie_id = m.id
    WHERE ul.user_id = $1
    ORDER BY ul.updated_at DESC
    LIMIT 5
  `;

  const [statusCounts, totalRuntime, avgRating, recentActivity] = await Promise.all([
    db.query(statusCountsQuery, [userId]),
    db.query(totalRuntimeQuery, [userId]),
    db.query(avgRatingQuery, [userId]),
    db.query(recentActivityQuery, [userId]),
  ]);

  const counts = { TO_WATCH: 0, IN_PROGRESS: 0, COMPLETED: 0, DROPPED: 0 };
  for (const row of statusCounts.rows) {
    counts[row.status] = parseInt(row.count, 10);
  }

  const totalMinutes = parseInt(totalRuntime.rows[0].total_minutes, 10);

  return {
    counts,
    totalMovies: Object.values(counts).reduce((a, b) => a + b, 0),
    totalHoursWatched: Math.floor(totalMinutes / 60),
    totalMinutesWatched: totalMinutes % 60,
    averageRating: avgRating.rows[0].avg_rating,
    recentActivity: recentActivity.rows,
  };
}

export {
  getUserLibrary,
  upsertLibraryEntry,
  removeLibraryEntry,
  getMovieStatus,
  getUserStats,
  VALID_STATUSES,
};
