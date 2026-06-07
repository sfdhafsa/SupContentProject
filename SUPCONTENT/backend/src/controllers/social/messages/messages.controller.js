import {
  getConversation,
  getConversations,
  markAsRead,
  sendMessage,
} from "../../../services/social/messages/messages.service.js";

export const sendPrivateMessage = async (req, res, next) => {
  try {
    const message = await sendMessage(
      req.user.userId,
      req.params.receiverId,
      req.body.content
    );

    return res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

export const listConversations = async (req, res, next) => {
  try {
    const conversations = await getConversations(req.user.userId);

    return res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

export const getConversationWithUser = async (req, res, next) => {
  try {
    const messages = await getConversation(req.user.userId, req.params.userId);

    return res.json({ messages });
  } catch (err) {
    next(err);
  }
};

export const markMessageAsRead = async (req, res, next) => {
  try {
    const message = await markAsRead(req.params.messageId, req.user.userId);

    return res.json({ message });
  } catch (err) {
    next(err);
  }
};
