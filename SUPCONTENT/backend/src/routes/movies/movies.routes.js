import express from "express";
import {
  search,
  getMovie,
  genres,
  popular,
  addMovieToLibrary,
  removeMovieFromLibrary,
  getLibraryStatus,
} from "../../controllers/movies/movies.controllers.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Routes publiques
router.get("/search", search);
router.get("/genres", genres);
router.get("/popular", popular);
router.get("/:id", getMovie);

// Routes authentifiées
router.get("/:id/library-status", protect, getLibraryStatus);
router.post("/:id/library", protect, addMovieToLibrary);
router.delete("/:id/library", protect, removeMovieFromLibrary);

export default router;