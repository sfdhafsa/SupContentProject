// backend/src/controllers/library/customList.controller.js

import * as customListService from '../../services/library/customList.service.js';

/**
 * GET /api/lists/public
 * Listes publiques de la communauté (recherche avancée).
 * Query : ?page=1&limit=20&search=texte
 */
async function getPublicLists(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const search = req.query.search || '';
    const result = await customListService.getPublicLists(page, limit, search);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:userId/lists
 * Listes d'un utilisateur.
 * Si c'est soi-même, on retourne toutes les listes.
 * Sinon, uniquement les publiques.
 */
async function getUserLists(req, res, next) {
  try {
    const ownerId = req.params.userId;
    const viewerId = req.user ? req.user.userId : null;
    const lists = await customListService.getUserLists(ownerId, viewerId);
    res.json({ success: true, data: lists });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/lists/:listId
 * Détail d'une liste avec ses films.
 */
async function getListById(req, res, next) {
  try {
    const viewerId = req.user ? req.user.userId : null;
    const list = await customListService.getListById(req.params.listId, viewerId);
    res.json({ success: true, data: list });
  } catch (err) {
    if (err.message === 'Accès refusé à cette liste privée') {
      return res.status(403).json({ success: false, message: err.message });
    }
    if (err.message === 'Liste introuvable') {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/lists
 * Crée une liste personnalisée.
 * Body : { name, description?, isPublic? }
 */
async function createList(req, res, next) {
  try {
    const { name, description, isPublic } = req.body;
    const list = await customListService.createList(req.user.userId, { name, description, isPublic });
    res.status(201).json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/lists/:listId
 * Met à jour une liste.
 * Body : { name?, description?, isPublic? }
 */
async function updateList(req, res, next) {
  try {
    const { name, description, isPublic } = req.body;
    const list = await customListService.updateList(
      req.params.listId,
      req.user.userId,
      { name, description, isPublic }
    );
    res.json({ success: true, data: list });
  } catch (err) {
    if (err.message === 'Non autorisé à modifier cette liste') {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * DELETE /api/lists/:listId
 * Supprime une liste.
 */
async function deleteList(req, res, next) {
  try {
    const result = await customListService.deleteList(req.params.listId, req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    if (err.message === 'Non autorisé à supprimer cette liste') {
      return res.status(403).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/lists/:listId/movies
 * Ajoute un film dans une liste.
 * Body : { movieId } or { tmdb_id }
 */
async function addMovieToList(req, res, next) {
  try {
    const { movieId, tmdb_id } = req.body || {};
    const result = await customListService.addMovieToList(
      req.params.listId,
      req.user.userId,
      { movieId, tmdbId: tmdb_id }
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/lists/:listId/movies/:movieId
 * Retire un film d'une liste.
 */
async function removeMovieFromList(req, res, next) {
  try {
    const result = await customListService.removeMovieFromList(
      req.params.listId,
      req.user.userId,
      req.params.movieId
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export { getPublicLists, getUserLists, getListById, createList, updateList, deleteList, addMovieToList, removeMovieFromList };
