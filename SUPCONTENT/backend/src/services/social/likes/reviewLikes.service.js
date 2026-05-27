import { ReviewLikeModel } from "../../../models/reviewLike.model.js";
import { ReviewModel } from "../../../models/review.model.js";
import { createNotification } from '../notifications/notifications.service.js';
import { notificationTypes } from '../../../utils/notificationTypes.js';


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
  if (review.user_id !== userId) {
  await createNotification({
    userId: review.user_id,
    actorUserId: userId,
    type: notificationTypes.REVIEW_LIKE,
    entityType: 'REVIEW',
    entityId: reviewId.toString(),
  });
}
  return { status: "liked" };
};

export const countReviewLikes = async (reviewId) => {
  return await ReviewLikeModel.countByReviewId(reviewId);
};

export const hasUserLiked = async (userId, reviewId) => {
  if (!userId) return false;

  return await ReviewLikeModel.exists(userId, reviewId);
};
