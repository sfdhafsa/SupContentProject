import { NotificationModel } from '../../../models/notification.model.js';
import { UserModel } from '../../../models/user.model.js';
import { sendNotificationEmail } from './emailNotification.service.js';
import { notificationTypes } from '../../../utils/notificationTypes.js';
import { emitNotificationSync } from '../messages/messages.socket.js';

const getNotificationChannelPreferences = async (userId) => {
  const preferences = await UserModel.getNotificationPreferences(userId);
  return {
    push: preferences?.notification_push_enabled !== false,
    email: preferences?.notification_email_enabled === true,
    likes: preferences?.notification_likes_enabled !== false,
    comments: preferences?.notification_comments_enabled !== false,
    followers: preferences?.notification_followers_enabled !== false,
  };
};

const isNotificationTypeEnabled = (type, preferences) => {
  if (type === notificationTypes.REVIEW_LIKE) {
    return preferences.likes;
  }

  if (
    type === notificationTypes.REVIEW_COMMENT ||
    type === notificationTypes.COMMENT_REPLY
  ) {
    return preferences.comments;
  }

  if (type === notificationTypes.FOLLOW) {
    return preferences.followers;
  }

  return true;
};

const sendEmailSafely = async (payload) => {
  try {
    await sendNotificationEmail(payload);
  } catch (err) {
    globalThis.console.error('[EMAIL] Failed to send notification email:', err);
  }
};

const syncNotifications = async (userId, reason, notification = null) => {
  try {
    const unreadCount = await NotificationModel.getUnreadCount(userId);
    emitNotificationSync(userId, {
      reason,
      unreadCount,
      notification,
    });
  } catch (err) {
    globalThis.console.error('[NOTIFICATIONS] Failed to sync notification socket:', err);
  }
};

// CREATE NOTIFICATION (internal use only)
export const createNotification = async ({
  userId,
  actorUserId,
  type,
  entityType = null,
  entityId = null,
}) => {
  if (!userId || !actorUserId || !type) return;

  // prevent self notifications
  if (userId === actorUserId) return;

  const channels = await getNotificationChannelPreferences(userId);
  if (!isNotificationTypeEnabled(type, channels)) return;

  const payload = {
    userId,
    actorUserId,
    type,
    entityType,
    entityId,
  };

  if (channels.email) {
    await sendEmailSafely(payload);
  }

  if (!channels.push) return;

  const notification = await NotificationModel.create({
    user_id: userId,
    actor_user_id: actorUserId,
    type,
    entity_type: entityType,
    entity_id: entityId,
  });

  await syncNotifications(userId, 'created', notification);

  return notification;
};

// CREATE SYSTEM NOTIFICATION (internal use only)
export const createSystemNotification = async ({
  userId,
  type,
  entityType = null,
  entityId = null,
  forcePush = false,
}) => {
  if (!userId || !type) return;

  const channels = await getNotificationChannelPreferences(userId);
  const payload = {
    userId,
    actorUserId: null,
    type,
    entityType,
    entityId,
  };

  if (channels.email) {
    await sendEmailSafely(payload);
  }

  if (!forcePush && !channels.push) return;

  const notification = await NotificationModel.create({
    user_id: userId,
    actor_user_id: null,
    type,
    entity_type: entityType,
    entity_id: entityId,
  });

  await syncNotifications(userId, 'created', notification);

  return notification;
};

// GET notifications
export const getNotifications = async (userId, limit = 20, offset = 0) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    return {
      status: 404,
      data: { message: 'Utilisateur introuvable.' },
    };
  }

  const notifications = await NotificationModel.getByUser(
    userId,
    limit,
    offset
  );

  return {
    status: 200,
    data: notifications,
  };
};

// MARK ONE AS READ
export const markAsRead = async (notificationId, userId) => {
  const updated = await NotificationModel.markAsRead(
    notificationId,
    userId
  );

  if (!updated) {
    return {
      status: 404,
      data: { message: 'Notification introuvable.' },
    };
  }

  await syncNotifications(userId, 'read', updated);

  return {
    status: 200,
    data: updated,
  };
};

export const markEntityNotificationsAsRead = async ({
  userId,
  type,
  entityType,
  entityId,
}) => {
  if (!userId || !type || !entityType || !entityId) return [];

  const updated = await NotificationModel.markByEntityAsRead(
    userId,
    type,
    entityType,
    entityId
  );

  if (updated.length > 0) {
    await syncNotifications(userId, 'read', updated[0]);
  }

  return updated;
};

export const markMessageNotificationsAsRead = async (userId) => {
  if (!userId) return {
    status: 400,
    data: { message: 'Utilisateur introuvable.' },
  };

  const updated = await NotificationModel.markByTypeAsRead(
    userId,
    notificationTypes.MESSAGE
  );

  if (updated.length > 0) {
    await syncNotifications(userId, 'read-message-notifications', updated[0]);
  }

  return {
    status: 200,
    data: { count: updated.length },
  };
};

// MARK ALL AS READ
export const markAllAsRead = async (userId) => {
  const updated = await NotificationModel.markAllAsRead(userId);

  await syncNotifications(userId, 'read-all');

  return {
    status: 200,
    data: {
      message: 'Toutes les notifications ont été marquées comme lues.',
      count: updated.length,
    },
  };
};

// UNREAD COUNT
export const getUnreadCount = async (userId) => {
  const count = await NotificationModel.getUnreadCount(userId);

  return {
    status: 200,
    data: { count },
  };
};
