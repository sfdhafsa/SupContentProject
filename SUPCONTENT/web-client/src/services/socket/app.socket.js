const SOCKET_IO_CDN = "https://cdn.socket.io/4.8.1/socket.io.min.js";

const getSocketUrl = () => {
  const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";
  return rawUrl.replace(/\/api\/?$/, "");
};

let socketIoLoadPromise = null;

const loadSocketIoClient = () => {
  if (window.io) return Promise.resolve(window.io);

  if (!socketIoLoadPromise) {
    socketIoLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SOCKET_IO_CDN;
      script.async = true;
      script.onload = () => resolve(window.io);
      script.onerror = () => reject(new Error("Unable to load Socket.IO client."));
      document.head.appendChild(script);
    });
  }

  return socketIoLoadPromise;
};

export const createAppSocket = async (token) => {
  const io = await loadSocketIoClient();

  return io(getSocketUrl(), {
    auth: { token },
    withCredentials: true,
  });
};
