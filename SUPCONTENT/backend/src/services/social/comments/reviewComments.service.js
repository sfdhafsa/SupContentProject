// src/services/social/comments/reviewComments.service.js

import {CommentModel} from "../../../models/comment.model.js";
import {ReviewModel} from "../../../models/review.model.js";

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

  return await CommentModel.create({
    review_id: reviewId,
    user_id: userId,
    text: text.trim(),
    parent_comment_id: parentCommentId,
  });
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