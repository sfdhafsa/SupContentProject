// backend/src/controllers/library/library.controller.js

import * as libraryService from '../../services/library/library.service.js';

/**
 * GET /api/library
 * Retourne la bibliothèque de l'utilisateur connecté.
 * Query param optionnel : ?status=to_watch|watching|completed|abandoned
 */
async function getMyLibrary(req, res, next) {
  try {
    const { status } = req.query;
    const library = await libraryService.getUserLibrary(req.user.id, status || null);
    res.json({ success: true, data: library });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/library
 * Ajoute ou met à jour le statut d'un film.
 * Body : { movieId, status }
 */
async function upsertEntry(req, res, next) {
  try {
    const { movieId, status } = req.body;
    if (!movieId || !status) {
      return res.status(400).json({ success: false, message: 'movieId et status requis' });
    }
    const entry = await libraryService.upsertLibraryEntry(req.user.id, movieId, status);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/library/:movieId
 * Supprime un film de la bibliothèque.
 */
async function removeEntry(req, res, next) {
  try {
    const { movieId } = req.params;
    const result = await libraryService.removeLibraryEntry(req.user.id, movieId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/library/movie/:movieId/status
 * Retourne le statut d'un film pour l'utilisateur connecté.
 * Utilisé par la fiche film pour afficher le bouton d'ajout.
 */
async function getMovieStatus(req, res, next) {
  try {
    const { movieId } = req.params;
    const status = await libraryService.getMovieStatus(req.user.id, movieId);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/library/stats
 * Retourne les statistiques du dashboard.
 */
async function getStats(req, res, next) {
  try {
    const stats = await libraryService.getUserStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export { getMyLibrary, upsertEntry, removeEntry, getMovieStatus, getStats };