// src/controllers/reviews/reviews.controller.js

import ReviewsService from "../../services/reviews/reviews.service.js";

export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const { tmdb_id, rating, text, contains_spoiler } = req.body;

    const review = await ReviewsService.createReview({
      userId,
      tmdbId: tmdb_id,
      rating,
      text,
      containsSpoiler: contains_spoiler,
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

export const getReviewsByMovie = async (req, res, next) => {
  try {
    const { tmdbId } = req.params;

    const reviews = await ReviewsService.getReviewsByMovie(tmdbId);

    res.json(reviews);
  } catch (err) {
    next(err);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const review = await ReviewsService.updateReview({
      userId,
      reviewId: id,
      ...req.body,
    });

    res.json(review);
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await ReviewsService.deleteReview(userId, id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const likeReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await ReviewsService.likeReview(userId, id);

    res.status(201).send();
  } catch (err) {
    next(err);
  }
};

export const unlikeReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await ReviewsService.unlikeReview(userId, id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};