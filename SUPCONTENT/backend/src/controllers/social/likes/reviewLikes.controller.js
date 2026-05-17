// src/controllers/social/likes/reviewLikes.controller.js
import {
  toggleLikeReview,
  countReviewLikes,
} from "../../../services/social/likes/reviewLikes.service.js";

export const toggleLike = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const result = await toggleLikeReview(userId, id);

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const count = async (req, res, next) => {
  try {
    const { id } = req.params;

    const likesCount = await countReviewLikes(id);

    return res.json({
      reviewId: id,
      likes: likesCount,
    });
  } catch (err) {
    next(err);
  }
};
