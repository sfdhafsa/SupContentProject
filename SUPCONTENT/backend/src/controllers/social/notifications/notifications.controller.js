import {
  getNotifications as getNotificationsService,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  markMessageNotificationsAsRead as markMessageNotificationsAsReadService,
  getUnreadCount as getUnreadCountService,
} from '../../../services/social/notifications/notifications.service.js';

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getNotificationsService(
      userId,
      limit,
      offset
    );

    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const result = await markAsReadService(
      notificationId,
      userId
    );

    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/messages/read-all
export const markMessageNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await markMessageNotificationsAsReadService(userId);

    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await markAllAsReadService(userId);

    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await getUnreadCountService(userId);

    return res.status(result.status).json(result.data);
  } catch (err) {
    next(err);
  }
};
