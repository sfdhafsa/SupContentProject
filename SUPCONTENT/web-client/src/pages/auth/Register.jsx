import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";

const FilmIcon = () => (
  <svg viewBox="0 0 26 26" fill="none" className="w-6 h-6">
    <rect x="2" y="5" width="22" height="16" rx="2" stroke="white" strokeWidth="2" />
    <path d="M2 9h22M2 17h22M7 5v4M7 17v4M13 5v4M13 17v4M19 5v4M19 17v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4 flex-shrink-0">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
    <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5">
    <path d="M2 7L5.5 10.5L12 3.5" stroke="#D0021B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FEATURES = [
  { title: "Free forever", desc: "No credit card required, start exploring right away" },
  { title: "Personalized experience", desc: "Get recommendations based on your taste" },
  { title: "Connect with fans", desc: "Follow other movie lovers and share your passion" },
];

const hasStrongPassword = (password) =>
  password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (form.username.trim().length < 3) e.username = "Minimum 3 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!hasStrongPassword(form.password)) e.password = "Minimum 8 characters, 1 uppercase and 1 number";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: "" }));
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    setLoading(true);
    setApiError("");

    try {
      const res = await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Si le backend connecte directement après register
      const token = res.data?.token || res.data?.access_token;
      const userData = res.data?.user || res.data?.data;

      if (token) {
        login(token, userData); // connecte directement
        navigate("/");
      } else {
        navigate("/login"); // sinon redirige vers login
      }
    } catch (error) {
      const message =
        error?.response?.data?.errors?.[0]?.msg ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Registration failed. Please try again.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3.5 py-3 rounded-xl border text-sm text-gray-900 bg-white outline-none transition-all placeholder:text-gray-400 ${
      errors[field]
        ? "border-red-600 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-50"
    }`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── LEFT PANEL ── */}
      <aside
        className="relative flex flex-col md:flex-[0_0_52%] bg-rose-50 px-6 py-8 md:px-14 md:py-10 overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(208,2,27,0.13) 1.5px, transparent 1.5px)",
          backgroundSize: "44px 44px",
        }}
      >
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-11 h-11 bg-[#D0021B] rounded-xl flex items-center justify-center flex-shrink-0">
            <FilmIcon />
          </div>
          <span className="font-bold text-lg tracking-widest text-gray-900">SUPMOVIES</span>
        </div>

        <div className="relative z-10 my-auto py-10 md:py-0 md:mt-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
            Join the community
          </h1>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">
            Create your account and start exploring the world of cinema.
          </p>

          <div className="flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 mb-0.5">{f.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 hidden md:block text-xs text-gray-400 mt-auto pt-8">
          © 2026 SUPMOVIES. All rights reserved.
        </p>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-5 py-10 md:px-10">
        <div className="w-full max-w-[440px]">

          <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-1.5">Create an account</h2>
          <p className="text-sm text-gray-500 mb-7">Sign up to get started with SUPMOVIES</p>

          {/* Google */}
          <button
            type="button"
            onClick={() => window.location.href = "http://localhost:3000/api/auth/google"}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 mb-5 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-800 hover:border-gray-400 hover:shadow-sm transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-medium text-gray-400 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mb-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Username</label>
              <input
                className={inputClass("username")}
                placeholder="moviefan123"
                value={form.username}
                onChange={handleChange("username")}
              />
              {errors.username && <p className="text-[11.5px] text-red-600 mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Email</label>
              <input
                type="email"
                className={inputClass("email")}
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange("email")}
              />
              {errors.email && <p className="text-[11.5px] text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Password</label>
              <input
                type="password"
                className={inputClass("password")}
                placeholder="Create a password (min. 8 characters)"
                value={form.password}
                onChange={handleChange("password")}
              />
              {errors.password && <p className="text-[11.5px] text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-800 mb-1.5">Confirm password</label>
              <input
                type="password"
                className={inputClass("confirm")}
                placeholder="Confirm your password"
                value={form.confirm}
                onChange={handleChange("confirm")}
              />
              {errors.confirm && <p className="text-[11.5px] text-red-600 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-1 bg-[#D0021B] hover:bg-[#b30218] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[15px] font-semibold rounded-xl transition-all"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-[13.5px] text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#D0021B] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
