import { Router } from 'express';
import { getFeed } from '../../controllers/social/feed/feed.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getFeed);

export default router;
