import api from "./axios";

export const messagesApi = {
  getConversations() {
    return api.get("/social/messages/conversations");
  },

  getConversation(userId) {
    return api.get(`/social/messages/${userId}`);
  },

  sendMessage(receiverId, content) {
    return api.post(`/social/messages/${receiverId}`, { content });
  },

  markAsRead(messageId) {
    return api.patch(`/social/messages/${messageId}/read`);
  },

  searchUsers(query) {
    return api.get("/users/search", {
      params: { q: query },
    });
  },
};
