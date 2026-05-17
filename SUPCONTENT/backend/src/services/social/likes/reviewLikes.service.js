import { ReviewLikeModel } from "../../../models/reviewLike.model.js";
import { ReviewModel } from "../../../models/review.model.js";

export const toggleLikeReview = async (userId, reviewId) => {
  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  const alreadyLiked = await ReviewLikeModel.exists(userId, reviewId);

  if (alreadyLiked) {
    await ReviewLikeModel.delete(userId, reviewId);
    return { status: "unliked" };
  }

  await ReviewLikeModel.create(userId, reviewId);
  return { status: "liked" };
};

export const countReviewLikes = async (reviewId) => {
  return await ReviewLikeModel.countByReviewId(reviewId);
};

export const hasUserLiked = async (userId, reviewId) => {
  if (!userId) return false;

  return await ReviewLikeModel.exists(userId, reviewId);
};
