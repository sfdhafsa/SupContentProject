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

// Format uniforme pour fiche détaillée
export const formatMovie = (movie) => ({
  tmdb_id: String(movie.external_id),
  title: movie.title,
  poster_url: movie.poster_url,
  release_date: movie.release_date,
  overview: movie.overview,
  runtime_minutes: movie.runtime_minutes,
});

// Format uniforme pour listes (search, popular)
const formatMovieList = (movie) => ({
  tmdb_id: String(movie.id),
  title: movie.title,
  poster_url: formatPosterUrl(movie.poster_path),
  release_date: movie.release_date,
  overview: movie.overview,
  vote_average: movie.vote_average,
  genre_ids: movie.genre_ids,
});

const validatePage = (page) => {
  const parsed = parseInt(page, 10);
  return Math.min(Math.max(parsed || 1, 1), 500);
};

const validateTmdbId = (tmdbId) => {
  if (!tmdbId || isNaN(tmdbId)) {
    throw Object.assign(new Error("Invalid movie id"), { status: 400 });
  }
  return String(tmdbId);
};

export const searchMovies = async ({ query, page = 1, year, genre_id }) => {
  if (!query || query.trim() === "") {
    throw Object.assign(new Error("Le paramètre 'q' est requis"), { status: 400 });
  }

  const pageNum = validatePage(page);
  const params = { query: query.trim(), page: pageNum };

  const yearNum = year ? parseInt(year, 10) : undefined;
  if (yearNum && !isNaN(yearNum)) params.primary_release_year = yearNum;

  const genreNum = genre_id ? parseInt(genre_id, 10) : undefined;
  if (genreNum && !isNaN(genreNum)) params.with_genres = genreNum;

  try {
    const response = await tmdb.get("search/movie", { params });
    return {
      results: response.data.results.map(formatMovieList),
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

export const getMovieById = async (tmdbId) => {
  const validId = validateTmdbId(tmdbId);

  // 1. Vérifier le cache
  const cached = await MovieModel.findByExternalId(validId);
  if (cached && isCacheValid(cached.cached_at)) {
    return formatMovie(cached);
  }

  // 2. Appel TMDB
  try {
    const response = await tmdb.get(`movie/${validId}`);
    const data = response.data;

    const movieData = {
      external_id: validId,
      title: data.title,
      overview: data.overview ?? null,
      poster_url: formatPosterUrl(data.poster_path),
      release_date: data.release_date || null,
      runtime_minutes: data.runtime ?? null,
    };

    // 3. Update ou create avec protection race condition
    let movie;
    if (cached) {
      movie = await MovieModel.update(validId, movieData);
    } else {
      try {
        movie = await MovieModel.create(movieData);
      } catch (err) {
        // Race condition — un autre appel a déjà créé le film
        movie = await MovieModel.findByExternalId(validId);
      }
    }

    return formatMovie(movie);
  } catch (err) {
    if (err.status === 400) throw err;
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
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
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

export const getPopularMovies = async (page = 1) => {
  const pageNum = validatePage(page);

  try {
    const response = await tmdb.get("movie/popular", {
      params: { page: pageNum },
    });

    return {
      results: response.data.results.map(formatMovieList),
      page: response.data.page,
      total_pages: response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};