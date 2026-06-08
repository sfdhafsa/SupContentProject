import { FollowModel } from "../../../models/follow.model.js";
import { MessageModel } from "../../../models/message.model.js";
import { UserModel } from "../../../models/user.model.js";
import {
  createNotification,
  markEntityNotificationsAsRead,
} from "../notifications/notifications.service.js";
import { notificationTypes } from "../../../utils/notificationTypes.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) => UUID_PATTERN.test(String(value || ""));

const assertMutualFollow = async (senderId, receiverId) => {
  const [senderFollowsReceiver, receiverFollowsSender] = await Promise.all([
    FollowModel.findFollow(senderId, receiverId),
    FollowModel.findFollow(receiverId, senderId),
  ]);

  if (!senderFollowsReceiver || !receiverFollowsSender) {
    throw Object.assign(
      new Error("You can only message users who mutually follow you."),
      { status: 403 }
    );
  }
};

export const sendMessage = async (senderId, receiverId, content) => {
  const normalizedContent = typeof content === "string" ? content.trim() : "";

  if (!normalizedContent) {
    throw Object.assign(new Error("Message content is required."), { status: 400 });
  }

  if (!receiverId) {
    throw Object.assign(new Error("Receiver id is required."), { status: 400 });
  }

  if (!isValidUuid(receiverId)) {
    throw Object.assign(new Error("Invalid receiver id."), { status: 400 });
  }

  if (String(senderId) === String(receiverId)) {
    throw Object.assign(new Error("You cannot message yourself."), { status: 400 });
  }

  const receiver = await UserModel.findById(receiverId);

  if (!receiver) {
    throw Object.assign(new Error("Receiver not found."), { status: 404 });
  }

  await assertMutualFollow(senderId, receiverId);

  const message = await MessageModel.createMessage(senderId, receiverId, normalizedContent);

  await createNotification({
    userId: receiverId,
    actorUserId: senderId,
    type: notificationTypes.MESSAGE,
    entityType: "MESSAGE",
    entityId: String(message.id),
  });

  return message;
};

export const getConversation = async (userId, otherUserId) => {
  if (!otherUserId) {
    throw Object.assign(new Error("User id is required."), { status: 400 });
  }

  if (!isValidUuid(otherUserId)) {
    throw Object.assign(new Error("Invalid user id."), { status: 400 });
  }

  const otherUser = await UserModel.findById(otherUserId);

  if (!otherUser) {
    throw Object.assign(new Error("User not found."), { status: 404 });
  }

  return MessageModel.getConversation(userId, otherUserId);
};

export const getConversations = (userId) =>
  MessageModel.getConversations(userId);

export const markAsRead = async (messageId, userId) => {
  if (!Number.isInteger(Number(messageId)) || Number(messageId) <= 0) {
    throw Object.assign(new Error("Invalid message id."), { status: 400 });
  }

  const message = await MessageModel.markAsRead(messageId, userId);

  if (!message) {
    throw Object.assign(new Error("Message not found."), { status: 404 });
  }

  await markEntityNotificationsAsRead({
    userId,
    type: notificationTypes.MESSAGE,
    entityType: "MESSAGE",
    entityId: message.id,
  });

  return message;
};
