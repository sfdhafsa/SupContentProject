import express from "express";
import { reportContent } from "../../controllers/reports/reports.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, reportContent);

export default router;
