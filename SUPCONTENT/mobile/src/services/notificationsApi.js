import api from '../config/api';

const DEFAULT_LIMIT = 30;

export async function getNotifications({ limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const { data } = await api.get(`/social/notifications?${params.toString()}`);
  return Array.isArray(data) ? data : [];
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get('/social/notifications/unread-count');
  return Math.max(0, Number(data?.count) || 0);
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await api.patch(`/social/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch('/social/notifications/read-all');
  return data;
}

export async function getFollowStatus(userId) {
  const { data } = await api.get(`/social/follow/${userId}/follow-status`);
  return Boolean(data?.isFollowing);
}

export async function followUser(userId) {
  const { data } = await api.post(`/social/follow/${userId}`);
  return data;
}
