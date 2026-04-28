import * as libraryService from '../../services/library/library.service.js';

async function getMyLibrary(req, res, next) {
  try {
    const { status } = req.query;
    const library = await libraryService.getUserLibrary(req.user.userId, status || null);
    res.json({ success: true, data: library });
  } catch (err) {
    next(err);
  }
}

async function upsertEntry(req, res, next) {
  try {
    const { movieId, status } = req.body;
    if (!movieId || !status) {
      return res.status(400).json({ success: false, message: 'movieId et status requis' });
    }
    const entry = await libraryService.upsertLibraryEntry(req.user.userId, movieId, status);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
}

async function removeEntry(req, res, next) {
  try {
    const { movieId } = req.params;
    const result = await libraryService.removeLibraryEntry(req.user.userId, movieId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getMovieStatus(req, res, next) {
  try {
    const { movieId } = req.params;
    const status = await libraryService.getMovieStatus(req.user.userId, movieId);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await libraryService.getUserStats(req.user.userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export { getMyLibrary, upsertEntry, removeEntry, getMovieStatus, getStats };