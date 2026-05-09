import { Router } from "express";
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from "../../controllers/social/follows/follows.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { validateUUIDParam } from "../../middlewares/validation.middleware.js";

const router = Router();

router.post("/:id", validateUUIDParam("id"), protect, followUser);
router.delete("/:id/unfollow", validateUUIDParam("id"), protect, unfollowUser);
router.get("/:id/followers", validateUUIDParam("id"), getFollowers);
router.get("/:id/following", validateUUIDParam("id"), getFollowing);
router.get(
  "/:id/follow-status",
  validateUUIDParam("id"),
  protect,
  getFollowStatus,
);

export default router;
