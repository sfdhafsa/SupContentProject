// src/routes/reviews/reviews.routes.js

import express from "express";
import {
  createReview,
  getReviewsByMovie,
  updateReview,
  deleteReview,
  likeReview,
  unlikeReview,
} from "../../controllers/reviews/reviews.controller.js";

import {protect} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createReview);

router.get("/movie/:tmdbId", getReviewsByMovie);

router.patch("/:id", protect, updateReview);

router.delete("/:id", protect, deleteReview);

router.post("/:id/like", protect, likeReview);

router.delete("/:id/like", protect, unlikeReview);

export default router;