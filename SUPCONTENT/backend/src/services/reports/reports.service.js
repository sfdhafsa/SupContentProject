import { CommentModel } from "../../models/comment.model.js";
import { ReportModel } from "../../models/report.model.js";
import { ReviewModel } from "../../models/review.model.js";

const REPORT_TARGET_TYPES = ["REVIEW", "COMMENT"];
const REPORT_REASONS = ["UNMARKED_SPOILER", "INSULT", "OTHER"];
const REPORT_STATUSES = ["PENDING", "REVIEWED", "RESOLVED"];

const normalizeUpper = (value) => String(value || "").trim().toUpperCase();

const assertTargetExists = async (targetType, targetId) => {
  if (targetType === "REVIEW") {
    return ReviewModel.findById(targetId);
  }

  if (targetType === "COMMENT") {
    return CommentModel.findById(targetId);
  }

  return null;
};

export const createReport = async ({
  reporterUserId,
  targetType,
  targetId,
  reason,
}) => {
  const normalizedTargetType = normalizeUpper(targetType);
  const normalizedReason = normalizeUpper(reason);

  if (!REPORT_TARGET_TYPES.includes(normalizedTargetType)) {
    throw Object.assign(new Error("Invalid report target type."), { status: 400 });
  }

  if (!Number.isInteger(Number(targetId)) || Number(targetId) <= 0) {
    throw Object.assign(new Error("Invalid report target id."), { status: 400 });
  }

  if (!REPORT_REASONS.includes(normalizedReason)) {
    throw Object.assign(new Error("Invalid report reason."), { status: 400 });
  }

  const target = await assertTargetExists(normalizedTargetType, targetId);

  if (!target) {
    throw Object.assign(new Error("Reported content not found."), { status: 404 });
  }

  const existingReport = await ReportModel.findOpenByReporterAndTarget({
    reporter_user_id: reporterUserId,
    target_type: normalizedTargetType,
    target_id: Number(targetId),
  });

  if (existingReport) {
    throw Object.assign(
      new Error("You have already reported this content."),
      { status: 409 }
    );
  }

  return ReportModel.create({
    reporter_user_id: reporterUserId,
    target_type: normalizedTargetType,
    target_id: Number(targetId),
    reason: normalizedReason,
  });
};

export const getReports = async ({ status } = {}) => {
  const normalizedStatus = status ? normalizeUpper(status) : undefined;

  if (normalizedStatus && !REPORT_STATUSES.includes(normalizedStatus)) {
    throw Object.assign(new Error("Invalid report status."), { status: 400 });
  }

  return ReportModel.findAll({ status: normalizedStatus });
};

export const getPendingReports = () => getReports({ status: "PENDING" });

export const updateReportStatus = async ({
  reportId,
  status,
  handledBy,
}) => {
  const normalizedStatus = normalizeUpper(status);

  if (!["REVIEWED", "RESOLVED"].includes(normalizedStatus)) {
    throw Object.assign(
      new Error("Report status must be REVIEWED or RESOLVED."),
      { status: 400 }
    );
  }

  const report = await ReportModel.updateStatus({
    report_id: reportId,
    status: normalizedStatus,
    handled_by: handledBy,
  });

  if (!report) {
    throw Object.assign(new Error("Report not found."), { status: 404 });
  }

  return report;
};
