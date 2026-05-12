import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD USER ON APP START
  // =========================
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");

      // Pas de token → utilisateur non connecté
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        // L'interceptor axios ajoute automatiquement le header Authorization
        const res = await api.get("/users/me");

        // Ton backend renvoie { user: { ... } }
        setUser(res.data.user);
      } catch (err) {
        if (err?.response?.status === 401) {
          console.warn("Session expirée, déconnexion automatique.");
        } else {
          console.error("Auth error:", err);
        }
        // Token invalide ou expiré → on nettoie
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // ← [] : une seule fois au démarrage, pas de boucle infinie

  // =========================
  // LOGIN
  // =========================
  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

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

export const useAuth = () => useContext(AuthContext);
