import {
  searchMovies,
  getMovieById,
  getGenres,
  getPopularMovies,
  discoverMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
} from "../../services/movies/movies.service.js";

export const search = async (req, res, next) => {
  try {
    const { q, page, year, genre_id } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });
    const pageNum = Math.min(Math.max(parseInt(page, 10) || 1, 1), 500);
    const data = await searchMovies({ query: q, page: pageNum, year, genre_id });
    return res.json({ data, meta: { page: pageNum } });
  } catch (err) { next(err); }
};

export const getMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid movie id" });
    const movie = await getMovieById(id);
    if (!movie) return res.status(404).json({ error: "Film non trouvé" });
    return res.json({ data: movie });
  } catch (err) { next(err); }
};

export const genres = async (req, res, next) => {
  try {
    const data = await getGenres();
    return res.json({ data, meta: {} });
  } catch (err) { next(err); }
};

export const popular = async (req, res, next) => {
  try {
    const pageNum = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 500);
    const data = await getPopularMovies(pageNum);
    return res.json({ data, meta: { page: pageNum } });
  } catch (err) { next(err); }
};

export const discover = async (req, res, next) => {
  try {
    const { page, genre_ids, year_min, year_max, min_rating, sort_by } = req.query;
    const pageNum   = Math.min(Math.max(parseInt(page, 10) || 1, 1), 500);
    // genre_ids peut Ãªtre "28,35,18" ou un tableau
    const genreIds  = genre_ids
      ? (Array.isArray(genre_ids) ? genre_ids : genre_ids.split(",")).filter(Boolean)
      : [];
    const data = await discoverMovies({
      page:       pageNum,
      genre_ids:  genreIds.length > 0 ? genreIds : undefined,
      year_min:   year_min   || undefined,
      year_max:   year_max   || undefined,
      min_rating: min_rating || undefined,
      sort_by:    sort_by    || "popularity.desc",
    });
    return res.json({ data, meta: { page: pageNum } });
  } catch (err) { next(err); }
};

export const trending = async (req, res, next) => {
  try {
    const { window = "week" } = req.query;
    const data = await getTrendingMovies(window);
    return res.json({ data });
  } catch (err) { next(err); }
};

export const topRated = async (req, res, next) => {
  try {
    const pageNum = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 500);
    const data = await getTopRatedMovies(pageNum);
    return res.json({ data, meta: { page: pageNum } });
  } catch (err) { next(err); }
};

export const nowPlaying = async (req, res, next) => {
  try {
    const pageNum = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 500);
    const data = await getNowPlayingMovies(pageNum);
    return res.json({ data, meta: { page: pageNum } });
  } catch (err) { next(err); }
};
