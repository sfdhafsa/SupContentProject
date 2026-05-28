import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD USER ON APP START
  // =========================
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");

      // Pas de token → pas besoin d'appeler le backend
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        setUser(res.data.user ?? res.data.data);
        setToken(savedToken);
      } catch (err) {
        // Token expiré ou invalide → on nettoie silencieusement
        if (err?.response?.status === 401) {
          console.warn("Session expirée, déconnexion automatique.");
        } else {
          console.error("Auth error:", err);
        }
        logout(); // nettoie le localStorage et reset le state
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // ← on lance une seule fois au démarrage

  // =========================
  // LOGIN
  // =========================
  const login = useCallback(async (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (userData) {
      setUser(userData);
      return userData;
    }

    const res = await api.get("/users/me", {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
    });

    const loadedUser = res.data.user ?? res.data.data;
    setUser(loadedUser);
    return loadedUser;
  }, []);

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // =========================
  // CONTEXT VALUE
  // =========================
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook custom
export const useAuth = () => useContext(AuthContext);
