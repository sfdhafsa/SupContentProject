import tmdb from "../../config/tmdb.js";
import { MovieModel } from "../../models/movie.model.js";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const CACHE_DURATION_HOURS = 24;

const isCacheValid = (cachedAt) => {
  if (!cachedAt) return false;
  const diffHours = (Date.now() - new Date(cachedAt)) / (1000 * 60 * 60);
  return diffHours < CACHE_DURATION_HOURS;
};

const formatPosterUrl = (posterPath) => {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}${posterPath}`;
};

// Format uniforme — tmdb_id partout
export const formatMovie = (movie) => ({
  tmdb_id: String(movie.external_id),
  title: movie.title,
  poster_url: movie.poster_url,
  release_date: movie.release_date,
  overview: movie.overview,
  runtime_minutes: movie.runtime_minutes,
});

export const searchMovies = async ({ query, page = 1, year, genre_id }) => {
  if (!query || query.trim() === "") {
    throw Object.assign(new Error("Le paramètre 'q' est requis"), { status: 400 });
  }

  const pageNum = Math.min(Number(page) || 1, 500);
  const params = { query: query.trim(), page: pageNum };
  if (year) params.primary_release_year = parseInt(year, 10);
  if (genre_id) params.with_genres = genre_id;

  try {
    const response = await tmdb.get("search/movie", { params });
    return {
      results: response.data.results.map((movie) => ({
        tmdb_id: String(movie.id),
        title: movie.title,
        poster_url: formatPosterUrl(movie.poster_path),
        release_date: movie.release_date,
        overview: movie.overview,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
      })),
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: 502 });
  }
};

export const getMovieById = async (tmdbId) => {
  // 1. Vérifier le cache
  const cached = await MovieModel.findByExternalId(tmdbId);
  if (cached && isCacheValid(cached.cached_at)) {
    return formatMovie(cached);
  }

  // 2. Appel TMDB
  try {
    const response = await tmdb.get(`movie/${tmdbId}`);
    const data = response.data;

    const movieData = {
      external_id: String(data.id),
      title: data.title,
      overview: data.overview ?? null,
      poster_url: formatPosterUrl(data.poster_path),
      release_date: data.release_date || null,
      runtime_minutes: data.runtime ?? null,
    };

    const movie = cached
      ? await MovieModel.update(tmdbId, movieData)
      : await MovieModel.create(movieData);

    return formatMovie(movie);
  } catch (err) {
    if (err.status === 502) throw err;
    throw Object.assign(new Error("Erreur API TMDB"), { status: 502 });
  }
};

export const getGenres = async () => {
  try {
    const response = await tmdb.get("genre/movie/list");
    return response.data.genres.map((g) => ({
      id: g.id,
      name: g.name,
    }));
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: 502 });
  }
};

export const getPopularMovies = async (page = 1) => {
  const pageNum = Math.min(Number(page) || 1, 500);

  try {
    const response = await tmdb.get("movie/popular", {
      params: { page: pageNum },
    });

    return {
      results: response.data.results.map((movie) => ({
        tmdb_id: String(movie.id),
        title: movie.title,
        poster_url: formatPosterUrl(movie.poster_path),
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids,
      })),
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: 502 });
  }
};