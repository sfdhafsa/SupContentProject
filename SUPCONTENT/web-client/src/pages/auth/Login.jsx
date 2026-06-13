import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

const FEATURES = [
  { title: "Discover & Track", desc: "Browse millions of movies and build your watchlist" },
  { title: "Review & Rate",    desc: "Share your thoughts and rate your favorite films" },
  { title: "Connect & Share",  desc: "Follow friends and explore curated lists" },
];

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const authBaseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client: "web",
    redirect_uri: `${window.location.origin}/auth/callback`,
  });

  return `${authBaseUrl}/auth/google?${params.toString()}`;
};

export default function Login() {
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const { login }   = useAuth();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState(
    searchParams.get("error") === "banned" ? "your account is banned" : ""
  );
  const [loading, setLoading]   = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const validate = () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: "" }));
    if (apiError) setApiError("");
    if (needsVerification) setNeedsVerification(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }

    setLoading(true);
    setApiError("");
    setNeedsVerification(false);

    try {
      const res = await api.post("/auth/login", {
        email:    form.email,
        password: form.password,
      });

      const token    = res.data.token;  // ← string JWT
      const userData = res.data.user;   // ← objet user (fallback)

      // ✅ token EN PREMIER, userData en second
      await login(token, userData);
      navigate("/");

    } catch (error) {
      setNeedsVerification(error?.response?.data?.code === "EMAIL_NOT_VERIFIED");
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error   ||
        "Invalid email or password.";
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
            Your personal cinema universe
          </h1>
          <p className="text-sm text-gray-500 mb-10 leading-relaxed">
            Track movies, share reviews, and connect with film enthusiasts worldwide.
          </p>

          <div className="flex flex-col gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-red-50 border-2 border-[#D0021B] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#D0021B]" />
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

          <h2 className="text-2xl md:text-[28px] font-bold text-gray-900 mb-1.5">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-7">Sign in to your account to continue</p>

          {/* Google */}
          <button
            type="button"
            onClick={() => window.location.href = getGoogleAuthUrl()}
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
              {needsVerification ? (
                <Link
                  to="/verification-pending"
                  state={{ email: form.email }}
                  className="block mt-2 font-semibold underline"
                >
                  Renvoyer l'email de verification
                </Link>
              ) : null}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mb-5">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-gray-800">Password</label>
                <Link to="/forgot-password" className="text-[13px] font-medium text-[#D0021B] hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                className={inputClass("password")}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange("password")}
              />
              {errors.password && <p className="text-[11.5px] text-red-600 mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-1 bg-[#D0021B] hover:bg-[#b30218] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[15px] font-semibold rounded-xl transition-all"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-[13.5px] text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#D0021B] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
