import tmdb from "../../config/tmdb.js";
import { MovieModel } from "../../models/movie.model.js";

const TMDB_IMAGE_BASE_W500 = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BASE_ORIG = "https://image.tmdb.org/t/p/original";
const TMDB_IMAGE_BASE_W300 = "https://image.tmdb.org/t/p/w300";
const TMDB_IMAGE_BASE_FACE = "https://image.tmdb.org/t/p/w185";
const CACHE_DURATION_HOURS = 24;
const TMDB_LANGUAGE = "fr-FR";

const isCacheValid = (cachedAt) => {
  if (!cachedAt) return false;
  const diffHours = (Date.now() - new Date(cachedAt)) / (1000 * 60 * 60);
  return diffHours < CACHE_DURATION_HOURS;
};

const formatPosterUrl   = (path) => path ? `${TMDB_IMAGE_BASE_W500}${path}` : null;
const formatBackdropUrl = (path) => path ? `${TMDB_IMAGE_BASE_ORIG}${path}` : null;
const formatFaceUrl     = (path) => path ? `${TMDB_IMAGE_BASE_FACE}${path}` : null;
const formatThumbUrl    = (path) => path ? `${TMDB_IMAGE_BASE_W300}${path}` : null;

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

const withLanguage = (params = {}) => ({
  ...params,
  language: TMDB_LANGUAGE,
});

const formatMovieList = (movie) => ({
  tmdb_id:      String(movie.id),
  title:        movie.title,
  poster_url:   formatPosterUrl(movie.poster_path),
  backdrop_url: formatThumbUrl(movie.backdrop_path),
  release_date: movie.release_date,
  overview:     movie.overview,
  vote_average: movie.vote_average,
  genre_ids:    movie.genre_ids,
});

const formatMovie = (movie) => ({
  tmdb_id:         String(movie.external_id),
  title:           movie.title,
  poster_url:      movie.poster_url,
  release_date:    movie.release_date,
  overview:        movie.overview,
  runtime_minutes: movie.runtime_minutes,
});

const formatMovieDetail = (data, credits, videos, similar) => {
  const cast = (credits?.cast || []).slice(0, 12).map((p) => ({
    id:        p.id,
    name:      p.name,
    character: p.character,
    photo_url: formatFaceUrl(p.profile_path),
  }));

  const crew      = credits?.crew || [];
  const directors = crew.filter((p) => p.job === "Director").map((p) => ({ id: p.id, name: p.name, photo_url: formatFaceUrl(p.profile_path) }));
  const writers   = crew.filter((p) => ["Screenplay", "Writer", "Story"].includes(p.job)).slice(0, 3).map((p) => ({ id: p.id, name: p.name, job: p.job }));
  const producers = crew.filter((p) => p.job === "Producer").slice(0, 3).map((p) => ({ id: p.id, name: p.name }));

  const trailer = (videos?.results || []).find((v) => v.type === "Trailer" && v.site === "YouTube")
    || (videos?.results || []).find((v) => v.site === "YouTube");

  const similarMovies = (similar?.results || []).slice(0, 8).map((m) => ({
    tmdb_id:      String(m.id),
    title:        m.title,
    poster_url:   formatPosterUrl(m.poster_path),
    vote_average: m.vote_average,
    release_date: m.release_date,
  }));

  return {
    tmdb_id:           String(data.id),
    title:             data.title,
    original_title:    data.original_title,
    tagline:           data.tagline || null,
    overview:          data.overview,
    poster_url:        formatPosterUrl(data.poster_path),
    backdrop_url:      formatBackdropUrl(data.backdrop_path),
    release_date:      data.release_date,
    runtime_minutes:   data.runtime,
    vote_average:      data.vote_average,
    vote_count:        data.vote_count,
    popularity:        data.popularity,
    original_language: data.original_language,
    genres:            (data.genres || []).map((g) => ({ id: g.id, name: g.name })),
    budget:            data.budget || null,
    revenue:           data.revenue || null,
    status:            data.status,
    homepage:          data.homepage || null,
    cast,
    directors,
    writers,
    producers,
    trailer: trailer ? {
      key:   trailer.key,
      name:  trailer.name,
      url:   `https://www.youtube.com/watch?v=${trailer.key}`,
      embed: `https://www.youtube.com/embed/${trailer.key}`,
    } : null,
    similar: similarMovies,
  };
};

// 🔎 SEARCH
export const searchMovies = async ({ query, page = 1, year, genre_id }) => {
  if (!query || query.trim() === "") {
    throw Object.assign(new Error("Le paramètre 'q' est requis"), { status: 400 });
  }
  const pageNum  = validatePage(page);
  const params   = { query: query.trim(), page: pageNum };
  const yearNum  = year ? parseInt(year, 10) : undefined;
  const genreNum = genre_id ? parseInt(genre_id, 10) : undefined;
  if (yearNum  && !isNaN(yearNum))  params.primary_release_year = yearNum;
  if (genreNum && !isNaN(genreNum)) params.with_genres           = genreNum;
  try {
    const response = await tmdb.get("search/movie", { params: withLanguage(params) });
    return {
      results:       response.data.results.map(formatMovieList),
      page:          response.data.page,
      total_pages:   response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 🎬 GET MOVIE BY ID
export const getMovieById = async (tmdbId) => {
  const validId = validateTmdbId(tmdbId);
  const cached  = await MovieModel.findByExternalId(validId);
  try {
    const [movieRes, creditsRes, videosRes, similarRes] = await Promise.all([
      tmdb.get(`movie/${validId}`, { params: withLanguage() }),
      tmdb.get(`movie/${validId}/credits`, { params: withLanguage() }),
      tmdb.get(`movie/${validId}/videos`, { params: withLanguage() }),
      tmdb.get(`movie/${validId}/similar`, { params: withLanguage() }),
    ]);
    const data      = movieRes.data;
    const movieData = {
      external_id:     validId,
      title:           data.title,
      overview:        data.overview ?? null,
      poster_url:      formatPosterUrl(data.poster_path),
      release_date:    data.release_date || null,
      runtime_minutes: data.runtime ?? null,
    };
    if (cached) {
      await MovieModel.update(validId, movieData);
    } else {
      try { await MovieModel.create(movieData); } catch { /* Race condition */ }
    }
    return formatMovieDetail(data, creditsRes.data, videosRes.data, similarRes.data);
  } catch (err) {
    if (err.status === 400) throw err;
    if (cached) return formatMovie(cached);
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 🎭 GENRES
export const getGenres = async () => {
  try {
    const response = await tmdb.get("genre/movie/list", { params: withLanguage() });
    return response.data.genres.map((g) => ({ id: g.id, name: g.name }));
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 🔥 POPULAR
export const getPopularMovies = async (page = 1) => {
  const pageNum = validatePage(page);
  try {
    const response = await tmdb.get("movie/popular", { params: withLanguage({ page: pageNum }) });
    return {
      results:       response.data.results.map(formatMovieList),
      page:          response.data.page,
      total_pages:   response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 🔍 DISCOVER
export const discoverMovies = async ({ page = 1, genre_ids, year_min, year_max, min_rating, sort_by = "popularity.desc" }) => {
  const pageNum = validatePage(page);
  const params  = { page: pageNum, sort_by, "vote_count.gte": 50 };
  if (genre_ids && genre_ids.length > 0) params.with_genres = genre_ids.join(",");
  if (year_min)   params["primary_release_date.gte"] = `${year_min}-01-01`;
  if (year_max)   params["primary_release_date.lte"] = `${year_max}-12-31`;
  if (min_rating) params["vote_average.gte"]          = min_rating;
  try {
    const response = await tmdb.get("discover/movie", { params: withLanguage(params) });
    return {
      results:       response.data.results.map(formatMovieList),
      page:          response.data.page,
      total_pages:   response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 📈 TRENDING
export const getTrendingMovies = async (timeWindow = "week") => {
  try {
    const response = await tmdb.get(`trending/movie/${timeWindow}`, { params: withLanguage() });
    return {
      results: response.data.results.map((movie) => ({
        tmdb_id:      String(movie.id),
        title:        movie.title,
        poster_url:   formatPosterUrl(movie.poster_path),
        backdrop_url: formatBackdropUrl(movie.backdrop_path),
        release_date: movie.release_date,
        overview:     movie.overview,
        vote_average: movie.vote_average,
        genre_ids:    movie.genre_ids,
      })),
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 🎬 TOP RATED
export const getTopRatedMovies = async (page = 1) => {
  const pageNum = validatePage(page);
  try {
    const response = await tmdb.get("movie/top_rated", { params: withLanguage({ page: pageNum }) });
    return {
      results:       response.data.results.map(formatMovieList),
      page:          response.data.page,
      total_pages:   response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

// 🆕 NOW PLAYING
export const getNowPlayingMovies = async (page = 1) => {
  const pageNum = validatePage(page);
  try {
    const response = await tmdb.get("movie/now_playing", { params: withLanguage({ page: pageNum }) });
    return {
      results:       response.data.results.map(formatMovieList),
      page:          response.data.page,
      total_pages:   response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};

export const getSimilarMovies = async (tmdbId, page = 1) => {
  const validId = validateTmdbId(tmdbId);
  const pageNum = validatePage(page);
  try {
    const response = await tmdb.get(`movie/${validId}/similar`, { params: withLanguage({ page: pageNum }) });
    return {
      results:       response.data.results.map(formatMovieList),
      page:          response.data.page,
      total_pages:   response.data.total_pages,
      total_results: response.data.total_results,
    };
  } catch (err) {
    throw Object.assign(new Error("Erreur API TMDB"), { status: err.response?.status || 502 });
  }
};
