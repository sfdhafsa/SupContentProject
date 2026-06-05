import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api/axios.js";

const validatePassword = (password) => {
  if (password.length < 8) return "Password must contain at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return "";
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState(token ? "" : "Reset token is missing.");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    if (error && token) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        password: form.password,
      });

      setMessage(res.data.message || "Password has been reset successfully.");
      setForm({ password: "", confirmPassword: "" });
    } catch (err) {
      const apiError =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        "Unable to reset password.";
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
          <h1 className="mt-8 text-3xl font-bold text-gray-900">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Use at least 8 characters, one uppercase letter, and one number.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-800">
                New password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                placeholder="Enter a new password"
                disabled={!token || Boolean(message)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-50 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-800">
                Confirm password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="Confirm your new password"
                disabled={!token || Boolean(message)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-red-600 focus:ring-2 focus:ring-red-50 disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || Boolean(message)}
              className="w-full rounded-xl bg-[#D0021B] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#b30218] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Reset password"}
            </button>
          </form>

          <p className="mt-5 text-center text-[13.5px] text-gray-500">
            Ready to sign in?{" "}
            <Link to="/login" className="font-semibold text-[#D0021B] hover:underline">
              Go to login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
