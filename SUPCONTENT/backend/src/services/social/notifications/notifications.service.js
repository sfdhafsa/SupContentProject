import { NotificationModel } from '../../../models/notification.model.js';
import { UserModel } from '../../../models/user.model.js';
import { sendNotificationEmail } from './emailNotification.service.js';

const getNotificationChannelPreferences = async (userId) => {
  const preferences = await UserModel.getNotificationPreferences(userId);
  return {
    push: preferences?.notification_push_enabled !== false,
    email: preferences?.notification_email_enabled === true,
  };
};

const sendEmailSafely = async (payload) => {
  try {
    await sendNotificationEmail(payload);
  } catch (err) {
    globalThis.console.error('[EMAIL] Failed to send notification email:', err);
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

  return await NotificationModel.create({
    user_id: userId,
    actor_user_id: actorUserId,
    type,
    entity_type: entityType,
    entity_id: entityId,
  });
};

// CREATE SYSTEM NOTIFICATION (internal use only)
export const createSystemNotification = async ({
  userId,
  type,
  entityType = null,
  entityId = null,
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

  if (!channels.push) return;

  return await NotificationModel.create({
    user_id: userId,
    actor_user_id: null,
    type,
    entity_type: entityType,
    entity_id: entityId,
  });
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

  return {
    status: 200,
    data: updated,
  };
};

// MARK ALL AS READ
export const markAllAsRead = async (userId) => {
  const updated = await NotificationModel.markAllAsRead(userId);

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
