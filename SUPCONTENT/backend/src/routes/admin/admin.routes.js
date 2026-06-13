import express from "express";
import { param } from "express-validator";
import { promoteUser, unpromoteUser } from "../../controllers/admin/admin.controllers.js";
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

router.patch(
  "/users/:id/unpromote",
  authenticate,
  requireAdmin,
  param("id").isUUID().withMessage("User id invalide."),
  unpromoteUser
);

export default router;
