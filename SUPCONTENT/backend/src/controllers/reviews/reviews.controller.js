// src/controllers/reviews/reviews.controller.js

import * as ReviewsService
from "../../services/reviews/reviews.service.js";

export const createReview = async (
  req,
  res,
  next
) => {
  try {

    const review =
      await ReviewsService.createReview({
        userId: req.user.userId,
        tmdbId: req.body.tmdb_id,
        rating: Number(req.body.rating),
        text: req.body.text,
        containsSpoiler:
          req.body.contains_spoiler,
      });

    return res.status(201).json(review);

  } catch (err) {
    next(err);
  }
};

export const getReviewsByMovie = async (
  req,
  res,
  next
) => {
  try {

    const reviews =
      await ReviewsService.getReviewsByMovie(
        req.params.tmdbId
      );

    return res.json(reviews);

  } catch (err) {
    next(err);
  }
};

export const updateReview = async (
  req,
  res,
  next
) => {
  try {

    const review =
      await ReviewsService.updateReview({
        userId: req.user.userId,
        reviewId: req.params.id,
        rating: req.body.rating,
        text: req.body.text,
        containsSpoiler:
          req.body.contains_spoiler,
      });

    return res.json(review);

  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (
  req,
  res,
  next
) => {
  try {

    await ReviewsService.deleteReview(
      req.user.userId,
      req.params.id
    );

    return res.status(204).send();

  } catch (err) {
    next(err);
  }
};