import {
  createReport,
  getReports,
  updateReportStatus,
} from "../../services/moderation/moderation.service.js";

export const reportContent = async (req, res, next) => {
  try {
    const report = await createReport({
      reporterUserId: req.user.userId,
      targetType: req.body.target_type,
      targetId: req.body.target_id,
      reason: req.body.reason,
    });

    return res.status(201).json({
      message: "Signalement envoye.",
      report,
    });
  } catch (err) {
    next(err);
  }
};

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

export const handleReport = async (req, res, next) => {
  try {
    const report = await updateReportStatus({
      reportId: req.params.id,
      status: req.body.status,
      handledBy: req.user.userId,
    });

    return res.json({
      message: "Signalement traite.",
      report,
    });
  } catch (err) {
    next(err);
  }
};
