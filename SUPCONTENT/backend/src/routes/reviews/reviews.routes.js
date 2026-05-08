// src/routes/reviews/reviews.routes.js

import express from "express";

import {
  createReview,
  getReviewsByMovie,
  updateReview,
  deleteReview,
} from "../../controllers/reviews/reviews.controller.js";
//methods from reviwLikes controller
import{
  toggleLike,
  count,
}from "../../controllers/social/likes/reviewLikes.controller.js"
//methods from reviewComment
import {
  create,
  getByReview,
  update,
  remove,
} from "../../controllers/social/comments/reviewComments.controller.js";

import {
  protect,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/",protect,createReview);

router.get("/movie/:tmdbId",getReviewsByMovie);

router.patch("/:id",protect,updateReview);

router.delete("/:id",protect,deleteReview);

//likes routes 
router.post("/:id/likes", protect, toggleLike);

router.get("/:id/likesCount", count);

//comments routes 

router.post("/:reviewId/comments",protect,create);

router.get("/:reviewId/comments",getByReview);

router.patch("/comments/:commentId",protect,update);

router.delete("/comments/:commentId",protect,remove);

export default router;