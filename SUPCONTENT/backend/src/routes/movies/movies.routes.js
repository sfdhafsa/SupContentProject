import express from "express";
import {
  search,
  getMovie,
  genres,
  popular,
} from "../../controllers/movies/movies.controllers.js";

const router = express.Router();

// Toutes publiques — library c'est le rôle de la personne 3
router.get("/search", search);
router.get("/genres", genres);
router.get("/popular", popular);
router.get("/:id", getMovie);

export default router;