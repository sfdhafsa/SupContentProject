import {
  banUser,
  deleteReportedContent,
  dismissReport,
  getReports,
  getModerationUsers,
  unbanUser,
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
