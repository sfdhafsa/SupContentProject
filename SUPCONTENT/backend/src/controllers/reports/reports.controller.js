import { createReport } from "../../services/reports/reports.service.js";

export const reportContent = async (req, res, next) => {
  try {
    const report = await createReport({
      reporterUserId: req.user.userId,
      targetType: req.body.target_type,
      targetId: req.body.target_id,
      reason: req.body.reason,
    });

    return res.status(201).json({
      message: "Report submitted.",
      report,
    });
  } catch (err) {
    next(err);
  }
};
