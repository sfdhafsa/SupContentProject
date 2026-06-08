import { Server } from "socket.io";
import { UserModel } from "../../../models/user.model.js";
import { TokenBlacklistModel } from "../../../models/tokenBlacklist.model.js";
import { verifyToken } from "../../../utils/jwt.utils.js";
import { sendMessage } from "./messages.service.js";

export const onlineUsers = new Map();
let ioServer = null;

const addUserSocket = (userId, socketId) => {
  const key = String(userId);
  const socketIds = onlineUsers.get(key) || new Set();
  socketIds.add(socketId);
  onlineUsers.set(key, socketIds);
};

const removeUserSocket = (userId, socketId) => {
  const key = String(userId);
  const socketIds = onlineUsers.get(key);

  if (!socketIds) return;

  socketIds.delete(socketId);

  if (socketIds.size === 0) {
    onlineUsers.delete(key);
  }
};

export const emitToUser = (userId, eventName, payload) => {
  if (!ioServer || !userId || !eventName) return;

  const socketIds = onlineUsers.get(String(userId));
  if (!socketIds) return;

  socketIds.forEach((socketId) => {
    ioServer.to(socketId).emit(eventName, payload);
  });
};

export const emitNotificationSync = (userId, payload = {}) => {
  emitToUser(userId, "notifications_changed", payload);
};

const getSocketToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization;

  if (authToken) return authToken;
  if (header?.startsWith("Bearer ")) return header.split(" ")[1];

  return null;
};

export const initializeMessagesSocket = (server, corsOptions = {}) => {
  const io = new Server(server, {
    cors: corsOptions,
  });
  ioServer = io;

  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);

      if (!token) {
        return next(new Error("Token missing."));
      }

      const decoded = verifyToken(token);

      if (await TokenBlacklistModel.has(token)) {
        return next(new Error("Token revoked."));
      }

      const user = await UserModel.findById(decoded.sub);

      if (!user) {
        return next(new Error("User not found."));
      }

      if (user.is_banned) {
        return next(new Error("Account suspended."));
      }

      socket.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        roles: (user.roles || []).map((role) => String(role).toLowerCase()),
      };

      return next();
    } catch (err) {
      return next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId;
    addUserSocket(userId, socket.id);

    socket.on("send_message", async (payload = {}) => {
      try {
        const message = await sendMessage(
          userId,
          payload.receiverId,
          payload.content
        );

        emitToUser(payload.receiverId, "receive_message", message);

        socket.emit("message_sent", message);
      } catch (err) {
        socket.emit("message_error", {
          message: err.message || "Unable to send message.",
          status: err.status || err.statusCode || 500,
        });
      }
    });

    socket.on("disconnect", () => {
      removeUserSocket(userId, socket.id);
    });
  });

  return io;
};
