import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api/axios.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setResetUrl("");

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message || "If this account exists, a reset link has been generated.");
      setResetUrl(res.data.reset_url || "");
    } catch (err) {
      const apiError =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        "Unable to request a reset link.";
      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-[430px]">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#D0021B]">
            SUPMOVIES
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-gray-900">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Enter your email and we will generate a secure reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {resetUrl && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Development reset link
              </p>
              <a
                href={resetUrl}
                className="break-all text-sm font-medium text-[#D0021B] hover:underline"
              >
                {resetUrl}
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-800">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#D0021B] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#b30218] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-5 text-center text-[13.5px] text-gray-500">
            Remember your password?{" "}
            <Link to="/login" className="font-semibold text-[#D0021B] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
