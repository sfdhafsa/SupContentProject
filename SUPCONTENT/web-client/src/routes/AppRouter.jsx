import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import MainLayout from "../layouts/MainLayout";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import Home from "../pages/home/Home";
import Profile from "../pages/user/Profile.jsx";
import Settings from "../pages/user/Settings.jsx";
import PublicProfile from "../pages/user/PublicProfile.jsx";
// ── Route protégée : redirige vers /login si non connecté ──
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D0021B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ── Route publique : redirige vers / si déjà connecté ──
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <Routes>

      {/* Pages auth — sans Navbar, redirigent si déjà connecté */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      {/* Pages PUBLIQUES avec Navbar — accessibles sans connexion */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
      </Route>

      {/* Pages PROTÉGÉES avec Navbar — connexion requise */}
      <Route element={
        <ProtectedRoute><MainLayout /></ProtectedRoute>
      }>
        {/* <Route path="/library" element={<Library />} />
        <Route path="/lists" element={<Lists />} /> */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}
