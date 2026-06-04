import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const finishOAuth = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("Connexion Google impossible.");
        return;
      }

      try {
        await login(token);
        navigate("/profile", { replace: true });
      } catch (err) {
        console.error("OAuth callback error:", err);
        localStorage.removeItem("token");
        setError("Impossible de charger votre profil Google.");
      }
    };

    finishOAuth();
  }, [login, navigate, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion echouee</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#D0021B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b30218] transition-colors"
          >
            Retour a la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#D0021B] border-t-transparent rounded-full animate-spin" />
    </main>
  );
}
