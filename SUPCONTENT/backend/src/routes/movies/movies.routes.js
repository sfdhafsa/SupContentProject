import express from "express";
import {
  search,
  getMovie,
  genres,
  popular,
  discover,
} from "../../controllers/movies/movies.controllers.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/search",   search);
router.get("/genres",   genres);
router.get("/popular",  popular);
router.get("/discover", discover);
router.get("/:id",      getMovie);

export default router;