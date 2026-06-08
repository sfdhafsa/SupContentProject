import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  markMessageNotificationsAsRead,
  getUnreadCount,
} from '../../controllers/social/notifications/notifications.controller.js';

import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// GET notifications
router.get('/', protect, getNotifications);

// unread count
router.get('/unread-count', protect, getUnreadCount);

// mark all as read
router.patch('/read-all', protect, markAllAsRead);

// mark message notifications as read
router.patch('/messages/read-all', protect, markMessageNotificationsAsRead);

// mark one as read
router.patch('/:id/read', protect, markAsRead);

export default router;
