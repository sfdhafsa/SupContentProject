import express from 'express';
const router = express.Router();
import * as libraryController from '../../controllers/library/library.controller.js';
import * as customListController from '../../controllers/library/customList.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

// ─── BIBLIOTHÈQUE PERSONNELLE ─────────────────────────────
router.get('/library/stats', protect, libraryController.getStats);
router.get('/library/movie/:movieId/status', protect, libraryController.getMovieStatus);
router.get('/library', protect, libraryController.getMyLibrary);
router.post('/library', protect, libraryController.upsertEntry);
router.delete('/library/:movieId', protect, libraryController.removeEntry);

// ─── LISTES PUBLIQUES ─────────────────────────────────────
router.get('/lists/public', customListController.getPublicLists);

// ─── LISTES PAR UTILISATEUR ───────────────────────────────
router.get('/users/:userId/lists', customListController.getUserLists);

// ─── CRUD LISTES ──────────────────────────────────────────
router.get('/lists/:listId', customListController.getListById);
router.post('/lists', protect, customListController.createList);
router.put('/lists/:listId', protect, customListController.updateList);
router.delete('/lists/:listId', protect, customListController.deleteList);
router.post('/lists/:listId/movies', protect, customListController.addMovieToList);
router.delete('/lists/:listId/movies/:movieId', protect, customListController.removeMovieFromList);

export default router;