import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import api from '../config/api';
import useAuthSession from '../hooks/useAuthSession';
import { saveAuthSession } from '../services/authStorage';

const THEME_KEY = 'supcontent.theme';

const lightColors = {
  mode: 'light',
  red: '#ef0d1a',
  bg: '#f3f4f6',
  page: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',
  card: '#ffffff',
  cardMuted: '#f9fafb',
  elevated: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  subtle: '#9ca3af',
  border: '#e5e7eb',
  navBorder: '#eef0f3',
  iconButton: '#f3f4f6',
  input: '#f9fafb',
  activeSoft: '#fff0f0',
  shadow: '#000000',
};

const darkColors = {
  mode: 'dark',
  red: '#ef0d1a',
  bg: '#0f172a',
  page: '#111827',
  surface: '#1f2937',
  surfaceAlt: '#111827',
  card: '#1f2937',
  cardMuted: '#111827',
  elevated: '#1f2937',
  text: '#f9fafb',
  muted: '#d1d5db',
  subtle: '#9ca3af',
  border: '#374151',
  navBorder: '#1f2937',
  iconButton: '#374151',
  input: '#111827',
  activeSoft: 'rgba(239, 13, 26, 0.16)',
  shadow: '#000000',
};

const ThemeContext = createContext(null);

function getInitialDarkMode() {
  return Appearance.getColorScheme() === 'dark';
}

export function ThemeProvider({ children }) {
  const { user, token } = useAuthSession();
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (!mounted || !saved) return;
        setDarkMode(saved === 'dark');
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user?.theme_preference) return;
    setDarkMode(user.theme_preference === 'dark');
  }, [user?.theme_preference]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light').catch(() => null);
  }, [darkMode, loaded]);

  const toggleTheme = async () => {
    const nextDarkMode = !darkMode;
    const nextTheme = nextDarkMode ? 'dark' : 'light';
    const previousTheme = darkMode ? 'dark' : 'light';

    setDarkMode(nextDarkMode);
    AsyncStorage.setItem(THEME_KEY, nextTheme).catch(() => null);

    if (!token || !user) return;

    try {
      const res = await api.put('/users/me', { theme_preference: nextTheme });
      const nextUser = {
        ...user,
        ...(res.data?.user ?? res.data?.data ?? {}),
        theme_preference: nextTheme,
      };

      await saveAuthSession(token, nextUser);
    } catch (err) {
      console.error('Failed to save theme preference:', err);
      setDarkMode(previousTheme === 'dark');
      AsyncStorage.setItem(THEME_KEY, previousTheme).catch(() => null);
    }
  };

  const value = useMemo(() => ({
    darkMode,
    colors: darkMode ? darkColors : lightColors,
    themeName: darkMode ? 'dark' : 'light',
    toggleTheme,
  }), [darkMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }

  return context;
}
