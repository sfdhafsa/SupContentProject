import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import MainLayout from "../layouts/MainLayout";
import MovieLayout from "../layouts/MovieLayout.jsx";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import OAuthCallback from "../pages/auth/OAuthCallback.jsx";
import Home from "../pages/home/Home";
import Profile from "../pages/user/Profile.jsx";
import Settings from "../pages/user/Settings.jsx";
import Search from "../pages/movies/Search.jsx";
import MovieDetail from "../pages/movies/MovieDetail.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="w-8 h-8 border-4 border-[#D0021B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"      element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Discover est la page principale publique */}
      <Route element={<MainLayout />}>
        <Route path="/"         element={<Search />} />
        <Route path="/discover" element={<Search />} />
      </Route>

      {/* Movie detail */}
      <Route element={<MovieLayout />}>
        <Route path="/movies/:id" element={<MovieDetail />} />
      </Route>

      {/* Pages protégées — Home devient accessible après login */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/home"     element={<Home />} />
        <Route path="/profile"  element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        {/* <Route path="/library" element={<Library />} /> */}
        {/* <Route path="/lists"   element={<Lists />} /> */}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}