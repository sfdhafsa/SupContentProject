import express from "express";

import {
  banModerationUser,
  deleteReportedTarget,
  dismissReportedContent,
  featureModerationReview,
  handleReport,
  listModerationUsers,
  listModerationReviews,
  listReports,
  listPendingReports,
  listResolvedReports,
  unbanModerationUser,
  unfeatureModerationReview,
} from "../../controllers/moderation/moderation.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get("/reports", protect, requireRole("ADMIN"), listReports);
router.get("/reports/pending", protect, requireRole("ADMIN"), listPendingReports);
router.get("/reports/resolved", protect, requireRole("ADMIN"), listResolvedReports);
router.get("/users", protect, requireRole("ADMIN"), listModerationUsers);
router.get("/reviews", protect, requireRole("ADMIN"), listModerationReviews);
router.patch("/users/:id/ban", protect, requireRole("ADMIN"), banModerationUser);
router.patch("/users/:id/unban", protect, requireRole("ADMIN"), unbanModerationUser);
router.patch("/reviews/:id/feature", protect, requireRole("ADMIN"), featureModerationReview);
router.patch("/reviews/:id/unfeature", protect, requireRole("ADMIN"), unfeatureModerationReview);
router.patch("/reports/:id/dismiss", protect, requireRole("ADMIN"), dismissReportedContent);
router.delete("/reports/:id/target", protect, requireRole("ADMIN"), deleteReportedTarget);
router.patch("/reports/:id", protect, requireRole("ADMIN"), handleReport);

export default router;
