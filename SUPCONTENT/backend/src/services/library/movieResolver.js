import { MovieModel } from '../../models/movie.model.js';
import { getMovieById } from '../movies/movies.service.js';

const serviceError = (message, status) => Object.assign(new Error(message), { status });

export const resolveMovieId = async ({ movieId, tmdbId }) => {
  const hasMovieId = movieId !== undefined && movieId !== null && movieId !== '';
  const hasTmdbId = tmdbId !== undefined && tmdbId !== null && tmdbId !== '';

  if (hasMovieId === hasTmdbId) {
    throw serviceError('Provide exactly one of movieId or tmdb_id', 400);
  }

  if (hasMovieId) {
    const movie = await MovieModel.findById(movieId);
    if (!movie) {
      throw serviceError('Film introuvable en base locale', 404);
    }

    return movie.id;
  }

  await getMovieById(tmdbId);
  const movie = await MovieModel.findByExternalId(tmdbId);

  if (!movie) {
    throw serviceError('Film introuvable apres synchronisation TMDB', 404);
  }

  return movie.id;
};
