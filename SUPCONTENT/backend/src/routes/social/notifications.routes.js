import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../controllers/social/notifications/notifications.controller.js';

import { protect } from '../middlewares/protect.js';

const router = express.Router();

// GET notifications
router.get('/', protect, getNotifications);

// unread count
router.get('/unread-count', protect, getUnreadCount);

// mark one as read
router.patch('/:id/read', protect, markAsRead);

// mark all as read
router.patch('/read-all', protect, markAllAsRead);

export default router;