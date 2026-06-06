import { CommentModel } from "../../models/comment.model.js";
import { ReportModel } from "../../models/report.model.js";
import { ReviewModel } from "../../models/review.model.js";

const REPORT_TARGET_TYPES = ["REVIEW", "COMMENT"];
const REPORT_REASONS = ["UNMARKED_SPOILER", "INSULT", "OTHER"];
const REPORT_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

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
    const error = new Error("Type de contenu invalide.");
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(Number(targetId)) || Number(targetId) <= 0) {
    const error = new Error("Identifiant de contenu invalide.");
    error.status = 400;
    throw error;
  }

  if (!REPORT_REASONS.includes(normalizedReason)) {
    const error = new Error("Motif de signalement invalide.");
    error.status = 400;
    throw error;
  }

  const target = await assertTargetExists(normalizedTargetType, targetId);

  if (!target) {
    const error = new Error("Contenu introuvable.");
    error.status = 404;
    throw error;
  }

  const existingReport = await ReportModel.findOpenByReporterAndTarget({
    reporter_user_id: reporterUserId,
    target_type: normalizedTargetType,
    target_id: targetId,
  });

  if (existingReport) {
    const error = new Error("Ce contenu a deja ete signale par cet utilisateur.");
    error.status = 409;
    throw error;
  }

  return ReportModel.create({
    reporter_user_id: reporterUserId,
    target_type: normalizedTargetType,
    target_id: targetId,
    reason: normalizedReason,
  });
};

export const getReports = async ({ status } = {}) => {
  const normalizedStatus = status ? normalizeUpper(status) : undefined;

  if (normalizedStatus && !REPORT_STATUSES.includes(normalizedStatus)) {
    const error = new Error("Statut de signalement invalide.");
    error.status = 400;
    throw error;
  }

  return ReportModel.findAll({ status: normalizedStatus });
};

export const updateReportStatus = async ({
  reportId,
  status,
  handledBy,
}) => {
  const normalizedStatus = normalizeUpper(status);

  if (!["APPROVED", "REJECTED"].includes(normalizedStatus)) {
    const error = new Error("Le statut doit etre APPROVED ou REJECTED.");
    error.status = 400;
    throw error;
  }

  const report = await ReportModel.updateStatus({
    report_id: reportId,
    status: normalizedStatus,
    handled_by: handledBy,
  });

  if (!report) {
    const error = new Error("Signalement introuvable.");
    error.status = 404;
    throw error;
  }

  return report;
};
