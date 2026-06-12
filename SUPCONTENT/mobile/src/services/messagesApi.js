import api from '../config/api';

/**
 * GET /social/messages/conversations
 * Returns the list of conversations for the current user.
 */
export async function getConversations() {
  const { data } = await api.get('/social/messages/conversations');
  return data.conversations || [];
}

/**
 * GET /social/messages/:userId
 * Returns all messages between the current user and another user.
 */
export async function getConversation(userId) {
  const { data } = await api.get(`/social/messages/${userId}`);
  return data.messages || [];
}

/**
 * POST /social/messages/:receiverId
 * Sends a message to a user.
 */
export async function sendMessage(receiverId, content) {
  const { data } = await api.post(`/social/messages/${receiverId}`, { content });
  return data.message;
}

/**
 * PATCH /social/messages/:messageId/read
 * Marks a message as read.
 */
export async function markMessageAsRead(messageId) {
  const { data } = await api.patch(`/social/messages/${messageId}/read`);
  return data.message;
}

export async function searchUsers(query) {
  const { data } = await api.get('/users/search', { params: { q: query } });
  return data.users || [];
}
