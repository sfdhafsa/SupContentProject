import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MovieLayout() {
  return (
    <div className="min-h-screen bg-gray-950 transition-colors duration-300">
      <Navbar />
      <Outlet />
    </div>
  );
}