import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api/axios";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, token, login } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (!user?.theme_preference) return;

    setDarkMode(user.theme_preference === "dark");
  }, [user?.theme_preference]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleTheme = async () => {
    const nextDarkMode = !darkMode;
    const nextTheme = nextDarkMode ? "dark" : "light";
    const previousTheme = darkMode ? "dark" : "light";

    setDarkMode(nextDarkMode);

    if (!token || !user) return;

    try {
      const res = await api.put("/users/me", {
        theme_preference: nextTheme,
      });

      login(token, {
        ...user,
        ...(res.data.user ?? res.data.data ?? {}),
        theme_preference: nextTheme,
      });
    } catch (err) {
      console.error("Failed to save theme preference:", err);
      setDarkMode(previousTheme === "dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
