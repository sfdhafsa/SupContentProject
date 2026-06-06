import express from "express";

import {
  handleReport,
  listReports,
  reportContent,
} from "../../controllers/moderation/moderation.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post("/reports", protect, reportContent);
router.get("/reports", protect, requireRole("ADMIN"), listReports);
router.patch("/reports/:id", protect, requireRole("ADMIN"), handleReport);

export default router;
