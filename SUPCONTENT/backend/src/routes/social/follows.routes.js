import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from '../../controllers/social/follows.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/:id/follow', protect, followUser);
router.delete('/:id/follow', protect, unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.get('/:id/follow-status', protect, getFollowStatus);

export default router;