// src/services/social/comments/reviewComments.service.js

import {CommentModel} from "../../../models/comment.model.js";
import {ReviewModel} from "../../../models/review.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { notificationTypes } from "../../../utils/notificationTypes.js";

// CREATE COMMENT
export const createComment = async ({
  userId,
  reviewId,
  text,
  parentCommentId = null,
}) => {
  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  if (!text || text.trim() === "") {
    const error = new Error("Comment text is required");
    error.status = 400;
    throw error;
  }

  const parentComment = parentCommentId
    ? await CommentModel.findById(parentCommentId)
    : null;

  if (parentCommentId && !parentComment) {
    const error = new Error("Parent comment not found");
    error.status = 404;
    throw error;
  }

  if (parentComment && String(parentComment.review_id) !== String(reviewId)) {
    const error = new Error("Parent comment does not belong to this review");
    error.status = 400;
    throw error;
  }

  const comment = await CommentModel.create({
    review_id: reviewId,
    user_id: userId,
    text: text.trim(),
    parent_comment_id: parentCommentId,
  });

  if (!comment) {
    const error = new Error("Parent comment does not belong to this review");
    error.status = 400;
    throw error;
  }

  if (parentComment) {
    await createNotification({
      userId: parentComment.user_id,
      actorUserId: userId,
      type: notificationTypes.COMMENT_REPLY,
      entityType: "COMMENT",
      entityId: comment.id.toString(),
    });
  } else {
    await createNotification({
      userId: review.user_id,
      actorUserId: userId,
      type: notificationTypes.REVIEW_COMMENT,
      entityType: "COMMENT",
      entityId: comment.id.toString(),
    });
  }

  return comment;
};

// GET COMMENTS
export const getCommentsByReview = async (reviewId) => {
  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    const error = new Error("Review not found");
    error.status = 404;
    throw error;
  }

  return await CommentModel.findByReviewId(reviewId);
};

// UPDATE COMMENT
export const updateComment = async ({
  userId,
  commentId,
  text,
}) => {
  const comment = await CommentModel.findById(commentId);

  if (!comment) {
    const error = new Error("Comment not found");
    error.status = 404;
    throw error;
  }

  if (comment.user_id !== userId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (!text || text.trim() === "") {
    const error = new Error("Comment text is required");
    error.status = 400;
    throw error;
  }

  return await CommentModel.update(
    commentId,
    userId,
    text.trim()
  );
};

// DELETE COMMENT
export const deleteComment = async (
  userId,
  commentId
) => {
  const comment = await CommentModel.findById(commentId);

  if (!comment) {
    const error = new Error("Comment not found");
    error.status = 404;
    throw error;
  }

  if (comment.user_id !== userId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  return await CommentModel.softDelete(
    commentId,
    userId
  );
};
