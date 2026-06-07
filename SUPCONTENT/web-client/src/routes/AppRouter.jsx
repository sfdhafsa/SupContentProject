import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import MainLayout from "../layouts/MainLayout";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import OAuthCallback from "../pages/auth/OAuthCallback.jsx";
import Home from "../pages/home/Home";
import Help from "../pages/help/Help.jsx";
import Profile from "../pages/user/Profile.jsx";
import PublicProfile from "../pages/user/PublicProfile.jsx";
import Settings from "../pages/user/Settings.jsx";
import Feed from "../pages/social/feed.jsx";
import Notifications from "../pages/social/Notifications.jsx";
import Search from "../pages/movies/Search.jsx";
import MovieDetail from "../pages/movies/MovieDetail.jsx";
import MovieLayout from "../layouts/MovieLayout.jsx";
import LibraryPage from "../pages/library/LibraryPage.jsx";
import ListsPage from "../pages/library/ListsPage.jsx";
import ListDetailPage from "../pages/library/ListDetailPage.jsx";
import DashboardPage from "../pages/library/DashboardPage.jsx";

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

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? "/home" : "/discover"} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      <Route path="/" element={<HomeRedirect />} />
      <Route element={<MainLayout />}>
        <Route path="/discover" element={<Search />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/help" element={<Help />} />
      </Route>

      <Route element={<MovieLayout />}>
        <Route path="/movies/:id" element={<MovieDetail />} />
      </Route>

      {/* Pages protégées */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/home" element={<Home />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/lists/:listId" element={<ListDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}