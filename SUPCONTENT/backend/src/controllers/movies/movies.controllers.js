import {
  searchMovies,
  getMovieById,
  getGenres,
  getPopularMovies,
  addToLibrary,
  removeFromLibrary,
  getMovieLibraryStatus,
} from "../../services/movies/movies.service.js";

export const search = async (req, res, next) => {
  try {
    const { q, page = 1, year, genre_id } = req.query;
    const data = await searchMovies({ query: q, page, year, genre_id });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getMovie = async (req, res, next) => {
  try {
    const movie = await getMovieById(req.params.id);
    res.json(movie);
  } catch (err) {
    next(err);
  }
};

export const genres = async (req, res, next) => {
  try {
    const data = await getGenres();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const popular = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const data = await getPopularMovies(page);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const addMovieToLibrary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const entry = await addToLibrary(userId, id, status);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
};

export const removeMovieFromLibrary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await removeFromLibrary(userId, id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getLibraryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const status = await getMovieLibraryStatus(userId, id);
    res.json({ status });
  } catch (err) {
    next(err);
  }
};