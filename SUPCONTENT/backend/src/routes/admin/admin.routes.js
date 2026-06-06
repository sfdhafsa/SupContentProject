import express from "express";
import { param } from "express-validator";
import { promoteUser } from "../../controllers/admin/admin.controllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.patch(
  "/users/:id/promote",
  authenticate,
  requireAdmin,
  param("id").isUUID().withMessage("User id invalide."),
  promoteUser
);

export default router;
