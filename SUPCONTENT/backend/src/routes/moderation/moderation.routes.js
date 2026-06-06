import express from "express";

import {
  deleteReportedTarget,
  dismissReportedContent,
  handleReport,
  listReports,
  listPendingReports,
  listResolvedReports,
} from "../../controllers/moderation/moderation.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.get("/reports", protect, requireRole("ADMIN"), listReports);
router.get("/reports/pending", protect, requireRole("ADMIN"), listPendingReports);
router.get("/reports/resolved", protect, requireRole("ADMIN"), listResolvedReports);
router.patch("/reports/:id/dismiss", protect, requireRole("ADMIN"), dismissReportedContent);
router.delete("/reports/:id/target", protect, requireRole("ADMIN"), deleteReportedTarget);
router.patch("/reports/:id", protect, requireRole("ADMIN"), handleReport);

export default router;
