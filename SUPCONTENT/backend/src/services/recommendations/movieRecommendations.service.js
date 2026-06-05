import db from '../../config/db.js';
import { MovieModel } from '../../models/movie.model.js';
import { getMovieById, getSimilarMovies } from '../movies/movies.service.js';
import { createSystemNotification } from '../social/notifications/notifications.service.js';
import { notificationTypes } from '../../utils/notificationTypes.js';

const getUserSavedTmdbIds = async (userId) => {
  const { rows } = await db.query(
    `SELECT DISTINCT m.external_id
     FROM user_library ul
     JOIN movies m ON m.id = ul.movie_id
     WHERE ul.user_id = $1 AND m.source_api = 'tmdb'

     UNION

     SELECT DISTINCT m.external_id
     FROM custom_lists cl
     JOIN custom_list_movies clm ON clm.list_id = cl.id
     JOIN movies m ON m.id = clm.movie_id
     WHERE cl.user_id = $1 AND m.source_api = 'tmdb'`,
    [userId]
  );

  return new Set(rows.map((row) => String(row.external_id)));
};

const hasRecommendationNotification = async (userId, movieId) => {
  const { rows } = await db.query(
    `SELECT id
     FROM notifications
     WHERE user_id = $1
       AND type = $2
       AND (
         (entity_type = 'MOVIE' AND entity_id = $3)
         OR (
           CASE
             WHEN entity_type = 'MOVIE_RECOMMENDATION' AND entity_id LIKE '{%'
               THEN entity_id::jsonb ->> 'recommendationMovieId'
             ELSE NULL
           END = $3
         )
       )
     LIMIT 1`,
    [userId, notificationTypes.MOVIE_RECOMMENDATION, String(movieId)]
  );

  return rows.length > 0;
};

export const generateMovieRecommendations = async (userId, tmdbMovieId) => {
  const sourceTmdbId = String(tmdbMovieId);
  const savedTmdbIds = await getUserSavedTmdbIds(userId);
  savedTmdbIds.add(sourceTmdbId);

  const sourceMovie = await MovieModel.findByExternalId(sourceTmdbId);
  if (!sourceMovie) {
    return [];
  }

  const similarMovies = await getSimilarMovies(sourceTmdbId);
  const candidates = similarMovies.results
    .filter((movie) => movie.tmdb_id && !savedTmdbIds.has(String(movie.tmdb_id)));

  for (const candidate of candidates) {
    await getMovieById(candidate.tmdb_id);
    const recommendedMovie = await MovieModel.findByExternalId(candidate.tmdb_id);

    if (!recommendedMovie) {
      continue;
    }

    const alreadyRecommended = await hasRecommendationNotification(userId, recommendedMovie.id);
    if (alreadyRecommended) {
      continue;
    }

    const notification = await createSystemNotification({
      userId,
      type: notificationTypes.MOVIE_RECOMMENDATION,
      entityType: 'MOVIE_RECOMMENDATION',
      entityId: JSON.stringify({
        sourceMovieId: sourceMovie.id.toString(),
        recommendationMovieId: recommendedMovie.id.toString(),
      }),
    });

    return notification ? [notification] : [];
  }

  return [];
};
