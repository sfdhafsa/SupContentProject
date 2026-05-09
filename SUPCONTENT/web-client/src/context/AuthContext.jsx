import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD USER ON APP START
  // =========================
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data.data);
      } catch (err) {
        console.log("Auth error:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token]);

  // =========================
  // LOGIN
  // =========================
  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setToken(token);
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

// Hook custom
export const useAuth = () => useContext(AuthContext);