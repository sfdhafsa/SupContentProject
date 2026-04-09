import tmdb from "../../config/tmdb.js";
import Movie from "../../models/movie.model.js";
import UserLibrary from "../../models/userLibrary.model.js";

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

// 🔎 SEARCH avec filtres + pagination
export const searchMovies = async ({ query, page = 1, year, genre_id }) => {
  if (!query || query.trim() === "") {
    throw Object.assign(new Error("Le paramètre 'q' est requis"), { status: 400 });
  }

  const params = {
    query: query.trim(),
    page: parseInt(page),
  };
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

// 🎬 GET MOVIE BY TMDB ID (avec cache BDD)
export const getMovieById = async (tmdbId) => {
  // 1. Chercher en cache
  let movie = await Movie.findOne({
    where: { external_id: String(tmdbId), source_api: "tmdb" },
  });

  if (movie && isCacheValid(movie.cached_at)) {
    return movie;
  }

  // 2. Appel TMDB
  const response = await tmdb.get(`movie/${tmdbId}`);
  const data = response.data;

  const movieData = {
    external_id: String(data.id),
    source_api: "tmdb",
    title: data.title,
    overview: data.overview ?? null,
    poster_url: formatPosterUrl(data.poster_path),
    release_date: data.release_date || null,
    runtime_minutes: data.runtime ?? null,
    cached_at: new Date(),
  };

  // 3. Update ou create
  if (movie) {
    await movie.update(movieData);
  } else {
    movie = await Movie.create(movieData);
  }

  return movie;
};

// 🎭 GET GENRES
export const getGenres = async () => {
  const response = await tmdb.get("genre/movie/list");
  return response.data.genres;
};

// 🔥 GET POPULAR MOVIES avec pagination
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

// 📚 AJOUTER À LA BIBLIOTHÈQUE
export const addToLibrary = async (userId, tmdbId, status = "TO_WATCH") => {
  // 1. S'assurer que le film est en cache
  const movie = await getMovieById(tmdbId);

  // 2. Vérifier si déjà dans la bibliothèque
  const existing = await UserLibrary.findOne({
    where: { user_id: userId, movie_id: movie.id },
  });

  if (existing) {
    // Mettre à jour le statut
    await existing.update({
      status,
      last_interaction_at: new Date(),
      updated_at: new Date(),
    });
    return existing;
  }

  // 3. Créer l'entrée
  const entry = await UserLibrary.create({
    user_id: userId,
    movie_id: movie.id,
    status,
    last_interaction_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });

  return entry;
};

// 🗑️ SUPPRIMER DE LA BIBLIOTHÈQUE
export const removeFromLibrary = async (userId, tmdbId) => {
  const movie = await Movie.findOne({
    where: { external_id: String(tmdbId), source_api: "tmdb" },
  });

  if (!movie) {
    throw Object.assign(new Error("Film non trouvé"), { status: 404 });
  }

  const deleted = await UserLibrary.destroy({
    where: { user_id: userId, movie_id: movie.id },
  });

  if (!deleted) {
    throw Object.assign(new Error("Film non présent dans la bibliothèque"), { status: 404 });
  }

  return { message: "Film supprimé de la bibliothèque" };
};

// 📖 GET STATUT D'UN FILM pour un utilisateur
export const getMovieLibraryStatus = async (userId, tmdbId) => {
  const movie = await Movie.findOne({
    where: { external_id: String(tmdbId), source_api: "tmdb" },
  });

  if (!movie) return null;

  const entry = await UserLibrary.findOne({
    where: { user_id: userId, movie_id: movie.id },
  });

  return entry ? entry.status : null;
};