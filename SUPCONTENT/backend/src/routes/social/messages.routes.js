import express from "express";
import {
  getConversationWithUser,
  listConversations,
  markMessageAsRead,
  sendPrivateMessage,
} from "../../controllers/social/messages/messages.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validateUUIDParam } from "../../middlewares/validation.middleware.js";

const router = express.Router();

router.post("/:receiverId", protect, validateUUIDParam("receiverId"), sendPrivateMessage);
router.get("/conversations", protect, listConversations);
router.get("/:userId", protect, validateUUIDParam("userId"), getConversationWithUser);
router.patch("/:messageId/read", protect, markMessageAsRead);

export default router;
