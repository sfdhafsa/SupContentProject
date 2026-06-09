import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../services/authStorage';

/**
 * Connects to the backend Socket.IO server and handles real-time message events.
 *
 * @param {object} options
 * @param {function} options.onReceiveMessage  - called with a message object when a new message arrives
 * @param {function} options.onMessageSent     - called with a message object when your own send is confirmed
 * @param {function} options.onError           - called with an error payload on send failure
 */
export function useSocket({ onReceiveMessage, onMessageSent, onError } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;

    const connect = async () => {
      const token = await getAuthToken();
      if (!token) return;

      // Strip /api suffix — Socket.IO connects at root
      const serverUrl = API_BASE_URL.replace(/\/api$/, '');

      socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('receive_message', (message) => {
        onReceiveMessage?.(message);
      });

      socket.on('message_sent', (message) => {
        onMessageSent?.(message);
      });

      socket.on('message_error', (err) => {
        onError?.(err);
      });
    };

    connect();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendSocketMessage = (receiverId, content) => {
    socketRef.current?.emit('send_message', { receiverId, content });
  };

  return { sendSocketMessage };
}