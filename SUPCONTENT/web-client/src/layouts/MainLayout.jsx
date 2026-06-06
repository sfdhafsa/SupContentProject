import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-3 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
