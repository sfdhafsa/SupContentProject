// src/controllers/social/comments/reviewComments.controller.js

import {
  createComment,
  getCommentsByReview,
  updateComment,
  deleteComment,
} from "../../../services/social/comments/reviewComments.service.js";

// CREATE
export const create = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const { reviewId } = req.params;

    const { text, parent_comment_id } = req.body;

    const comment = await createComment({
      userId,
      reviewId,
      text,
      parentCommentId: parent_comment_id,
    });

    return res.status(201).json(comment);

  } catch (err) {
    next(err);
  }
};

// GET COMMENTS
export const getByReview = async (
  req,
  res,
  next
) => {
  try {
    const { reviewId } = req.params;

    const comments = await getCommentsByReview(
      reviewId
    );

    return res.json(comments);

  } catch (err) {
    next(err);
  }
};

// UPDATE
export const update = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.userId;

    const { commentId } = req.params;

    const { text } = req.body;

    const updatedComment = await updateComment({
      userId,
      commentId,
      text,
    });

    return res.json(updatedComment);

  } catch (err) {
    next(err);
  }
};

// DELETE
export const remove = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.userId;

    const { commentId } = req.params;

    await deleteComment(userId, commentId);

    return res.status(204).send();

  } catch (err) {
    next(err);
  }
};