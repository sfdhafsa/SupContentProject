import {
  banUser,
  deleteReportedContent,
  dismissReport,
  getReports,
  getModerationUsers,
  getModerationReviews,
  unbanUser,
  updateReviewFeaturedStatus,
  updateReportStatus,
} from "../../services/moderation/moderation.service.js";

export const listReports = async (req, res, next) => {
  try {
    const reports = await getReports({
      status: req.query.status,
    });

    return res.json({ reports });
  } catch (err) {
    next(err);
  }
};

export const listPendingReports = async (req, res, next) => {
  try {
    const reports = await getReports({
      status: "PENDING",
    });

    return res.json({ reports });
  } catch (err) {
    next(err);
  }
};

export const listResolvedReports = async (req, res, next) => {
  try {
    const reports = await getReports({
      status: "RESOLVED",
    });

    return res.json({ reports });
  } catch (err) {
    next(err);
  }
};

export const handleReport = async (req, res, next) => {
  try {
    const report = await updateReportStatus({
      reportId: req.params.id,
      status: req.body.status,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "Report handled.",
      report,
    });
  } catch (err) {
    next(err);
  }
};

export const dismissReportedContent = async (req, res, next) => {
  try {
    const report = await dismissReport({
      reportId: req.params.id,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "Report dismissed.",
      report,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteReportedTarget = async (req, res, next) => {
  try {
    const result = await deleteReportedContent({
      reportId: req.params.id,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "Reported content deleted.",
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

export const listModerationUsers = async (req, res, next) => {
  try {
    const users = await getModerationUsers();

    return res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const listModerationReviews = async (req, res, next) => {
  try {
    const reviews = await getModerationReviews({
      featured: req.query.featured,
    });

    return res.json({ reviews });
  } catch (err) {
    next(err);
  }
};

export const banModerationUser = async (req, res, next) => {
  try {
    const user = await banUser({
      userId: req.params.id,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "User banned.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const unbanModerationUser = async (req, res, next) => {
  try {
    const user = await unbanUser({
      userId: req.params.id,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "User unbanned.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const featureModerationReview = async (req, res, next) => {
  try {
    const review = await updateReviewFeaturedStatus({
      reviewId: req.params.id,
      isFeatured: true,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "Review featured.",
      review,
    });
  } catch (err) {
    next(err);
  }
};

export const unfeatureModerationReview = async (req, res, next) => {
  try {
    const review = await updateReviewFeaturedStatus({
      reviewId: req.params.id,
      isFeatured: false,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "Review unfeatured.",
      review,
    });
  } catch (err) {
    next(err);
  }
};
