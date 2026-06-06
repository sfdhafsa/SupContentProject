import { CommentModel } from "../../models/comment.model.js";
import { ReportModel } from "../../models/report.model.js";
import { ReviewModel } from "../../models/review.model.js";
import {
  getReports,
  updateReportStatus,
} from "../reports/reports.service.js";

const normalizeUpper = (value) => String(value || "").trim().toUpperCase();

export { getReports, updateReportStatus };

export const dismissReport = async ({ reportId, handledBy }) =>
  updateReportStatus({
    reportId,
    status: "REVIEWED",
    handledBy,
  });

export const deleteReportedContent = async ({ reportId, handledBy }) => {
  const report = await ReportModel.findById(reportId);

  if (!report) {
    throw Object.assign(new Error("Report not found."), { status: 404 });
  }

  if (normalizeUpper(report.status) !== "PENDING") {
    throw Object.assign(new Error("This report has already been handled."), { status: 409 });
  }

  let deletedTarget = null;

  if (report.target_type === "REVIEW") {
    deletedTarget = await ReviewModel.softDeleteById(report.target_id);
  } else if (report.target_type === "COMMENT") {
    deletedTarget = await CommentModel.softDeleteById(report.target_id);
  }

  if (!deletedTarget) {
    throw Object.assign(
      new Error("Reported content was not found or has already been deleted."),
      { status: 404 }
    );
  }

  const updatedReport = await updateReportStatus({
    reportId,
    status: "RESOLVED",
    handledBy,
  });

  return {
    report: updatedReport,
    deletedTarget,
  };
};
