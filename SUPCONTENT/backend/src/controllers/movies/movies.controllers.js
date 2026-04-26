import {
  searchMovies,
  getMovieById,
  getGenres,
  getPopularMovies,
} from "../../services/movies/movies.service.js";

export const search = async (req, res, next) => {
  try {
    const { q, page, year, genre_id } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query is required" });
    }

    const pageNum = Math.min(Number(page) || 1, 500);
    const data = await searchMovies({ query: q, page: pageNum, year, genre_id });

    res.json({ data, meta: { page: pageNum } });
  } catch (err) {
    next(err);
  }
};

export const getMovie = async (req, res, next) => {
  try {
    const movie = await getMovieById(req.params.id);

    if (!movie) {
      return res.status(404).json({ error: "Film non trouvé" });
    }

    res.json({ data: movie });
  } catch (err) {
    next(err);
  }
};

export const genres = async (req, res, next) => {
  try {
    const data = await getGenres();
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const popular = async (req, res, next) => {
  try {
    const pageNum = Math.min(Number(req.query.page) || 1, 500);
    const data = await getPopularMovies(pageNum);
    res.json({ data, meta: { page: pageNum } });
  } catch (err) {
    next(err);
  }
};