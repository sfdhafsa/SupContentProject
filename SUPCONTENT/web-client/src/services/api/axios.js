import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const baseURL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const language = localStorage.getItem("supcontent.language") || navigator.language?.slice(0, 2) || "fr";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["Accept-Language"] = language;
  config.headers["X-Language"] = language;

  return config;
});

export default api;
