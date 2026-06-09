import api from '../config/api';

/**
 * GET /messages/conversations
 * Returns the list of conversations for the current user.
 */
export async function getConversations() {
  const { data } = await api.get('/messages/conversations');
  return data.conversations || [];
}

/**
 * GET /messages/:userId
 * Returns all messages between the current user and another user.
 */
export async function getConversation(userId) {
  const { data } = await api.get(`/messages/${userId}`);
  return data.messages || [];
}

/**
 * POST /messages/:receiverId
 * Sends a message to a user.
 */
export async function sendMessage(receiverId, content) {
  const { data } = await api.post(`/messages/${receiverId}`, { content });
  return data.message;
}

/**
 * PATCH /messages/:messageId/read
 * Marks a message as read.
 */
export async function markMessageAsRead(messageId) {
  const { data } = await api.patch(`/messages/${messageId}/read`);
  return data.message;
}