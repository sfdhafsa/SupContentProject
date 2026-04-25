import tmdb from "../../config/tmdb.js";
import { MovieModel } from "../../models/movie.model.js";
import { UserLibraryModel } from "../../models/userLibrary.model.js";

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

export const searchMovies = async ({ query, page = 1, year, genre_id }) => {
  if (!query || query.trim() === "") {
    throw Object.assign(new Error("Le paramètre 'q' est requis"), { status: 400 });
  }

  const params = { query: query.trim(), page: parseInt(page) };
  if (year) params.primary_release_year = parseInt(year);
  if (genre_id) params.with_genres = genre_id;

  const response = await tmdb.get("search/movie", { params });

  return {
    results: response.data.results.map((movie) => ({
      tmdb_id: movie.id,
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
};

export const getMovieById = async (tmdbId) => {
  // 1. Vérifier le cache
  const cached = await MovieModel.findByExternalId(tmdbId);
  if (cached && isCacheValid(cached.cached_at)) {
    return cached;
  }

  // 2. Appel TMDB
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

  // 3. Update ou create
  if (cached) {
    return await MovieModel.update(tmdbId, movieData);
  }
  return await MovieModel.create(movieData);
};

export const getGenres = async () => {
  const response = await tmdb.get("genre/movie/list");
  return response.data.genres;
};

export const getPopularMovies = async (page = 1) => {
  const response = await tmdb.get("movie/popular", {
    params: { page: parseInt(page) },
  });

  return {
    results: response.data.results.map((movie) => ({
      tmdb_id: movie.id,
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
};

export const addToLibrary = async (userId, tmdbId, status = "TO_WATCH") => {
  // S'assurer que le film est en cache
  const movie = await getMovieById(tmdbId);

  const existing = await UserLibraryModel.findEntry(userId, movie.id);

  if (existing) {
    return await UserLibraryModel.update(userId, movie.id, status);
  }

  return await UserLibraryModel.create(userId, movie.id, status);
};

export const removeFromLibrary = async (userId, tmdbId) => {
  const movie = await MovieModel.findByExternalId(tmdbId);

  if (!movie) {
    throw Object.assign(new Error("Film non trouvé"), { status: 404 });
  }

  const deleted = await UserLibraryModel.delete(userId, movie.id);

  if (!deleted) {
    throw Object.assign(new Error("Film non présent dans la bibliothèque"), { status: 404 });
  }

  return { message: "Film supprimé de la bibliothèque" };
};

export const getMovieLibraryStatus = async (userId, tmdbId) => {
  const movie = await MovieModel.findByExternalId(tmdbId);
  if (!movie) return null;

  const entry = await UserLibraryModel.findEntry(userId, movie.id);
  return entry ? entry.status : null;
};