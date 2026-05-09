// src/services/reviews/reviews.service.js

import ReviewModel from "../../models/review.model.js";
import ReviewLikeModel from "../../models/reviewLike.model.js";
import {MovieModel} from "../../models/movie.model.js";

const ReviewsService = {
  async createReview({ userId, tmdbId, rating, text, containsSpoiler }) {
    // 1. récupérer le film (via TMDB mapping)
    const movie = await MovieModel.findOrCreateByTmdbId(tmdbId);

    // 2. vérifier si review existe déjà
    const existing = await ReviewModel.findByUserAndMovie(userId, movie.id);
    if (existing) {
      throw new Error("You already reviewed this movie");
    }

    // 3. validation
    if (rating < 1 || rating > 5) {
      throw new Error("Invalid rating");
    }

    // 4. création
    return await ReviewModel.create({
      user_id: userId,
      movie_id: movie.id,
      rating,
      text,
      contains_spoiler: containsSpoiler || false,
    });
  },

  async getReviewsByMovie(tmdbId) {
    const movie = await MovieModel.findByTmdbId(tmdbId);
    if (!movie) return [];

    return await ReviewModel.findByMovieId(movie.id);
  },

  async updateReview({ userId, reviewId, rating, text, containsSpoiler }) {
    const review = await ReviewModel.findById(reviewId);

    if (!review) throw new Error("Review not found");
    if (review.user_id !== userId) throw new Error("Unauthorized");

    const updatedData = {
      rating: rating ?? review.rating,
      text: text ?? review.text,
      contains_spoiler: containsSpoiler ?? review.contains_spoiler,
    };

    if (updatedData.rating < 1 || updatedData.rating > 5) {
      throw new Error("Invalid rating");
    }

    return await ReviewModel.update(reviewId, userId, updatedData);
  },

  async deleteReview(userId, reviewId) {
    const review = await ReviewModel.findById(reviewId);

    if (!review) throw new Error("Review not found");
    if (review.user_id !== userId) throw new Error("Unauthorized");

    return await ReviewModel.softDelete(reviewId, userId);
  },

  async likeReview(userId, reviewId) {
    const exists = await ReviewLikeModel.exists(userId, reviewId);
    if (exists) return;

    return await ReviewLikeModel.create(userId, reviewId);
  },

  async unlikeReview(userId, reviewId) {
    return await ReviewLikeModel.delete(userId, reviewId);
  },
};

export default ReviewsService;