// src/services/reviews/reviews.service.js

import { ReviewModel } from "../../models/review.model.js";
import { MovieModel } from "../../models/movie.model.js";
import { getMovieById } from "../movies/movies.service.js";

export const createReview = async ({
  userId,
  tmdbId,
  rating,
  text,
  containsSpoiler,
}) => {
  if (!tmdbId || isNaN(tmdbId)) {
    throw Object.assign(new Error("Invalid TMDB id"), {
      status: 400,
    });
  }

  if (!rating || rating < 1 || rating > 5) {
    throw Object.assign(new Error("Rating must be between 1 and 5"), {
      status: 400,
    });
  }

  // Ensure movie exists in local DB cache
  await getMovieById(tmdbId);

  const movie = await MovieModel.findByExternalId(tmdbId);

  if (!movie) {
    throw Object.assign(new Error("Movie not found"), {
      status: 404,
    });
  }

  const existing = await ReviewModel.findByUserAndMovie(userId, movie.id);

  if (existing) {
    throw Object.assign(new Error("You already reviewed this movie"), {
      status: 409,
    });
  }

  return await ReviewModel.create({
    user_id: userId,
    movie_id: movie.id,
    rating,
    text,
    contains_spoiler: containsSpoiler,
  });
};

export const getReviewsByMovie = async (tmdbId) => {
  const movie = await MovieModel.findByExternalId(tmdbId);

  if (!movie) {
    return [];
  }

  return await ReviewModel.findByMovieId(movie.id);
};

export const updateReview = async ({
  userId,
  reviewId,
  rating,
  text,
  containsSpoiler,
}) => {
  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    throw Object.assign(new Error("Review not found"), {
      status: 404,
    });
  }

  if (review.user_id !== userId) {
    throw Object.assign(new Error("Unauthorized"), {
      status: 403,
    });
  }

  return await ReviewModel.update(reviewId, userId, {
    rating: rating ?? review.rating,
    text: text ?? review.text,
    contains_spoiler: containsSpoiler ?? review.contains_spoiler,
  });
};

export const deleteReview = async (userId, reviewId) => {
  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    throw Object.assign(new Error("Review not found"), {
      status: 404,
    });
  }

  if (review.user_id !== userId) {
    throw Object.assign(new Error("Unauthorized"), {
      status: 403,
    });
  }

  return await ReviewModel.softDelete(reviewId, userId);
};
