import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api/axios.js";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verification de votre adresse email...");

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Le lien de verification est incomplet.");
      return;
    }

    try {
      const response = await api.get("/auth/verify-email", { params: { token } });
      setStatus("success");
      setMessage(response.data?.message || "Votre adresse email est maintenant verifiee.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error?.response?.data?.message ||
        "Ce lien de verification est invalide ou a expire."
      );
    }
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-red-50 text-[#D0021B] flex items-center justify-center text-xl font-bold">
          {status === "loading" ? "..." : status === "success" ? "OK" : "!"}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {status === "success" ? "Email verifie" : "Verification de l'email"}
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-7">{message}</p>
        {status === "error" ? (
          <Link to="/verification-pending" className="block w-full py-3 rounded-xl bg-[#D0021B] text-white font-semibold">
            Renvoyer un email
          </Link>
        ) : null}
        {status === "success" ? (
          <Link to="/login" className="block w-full py-3 rounded-xl bg-[#D0021B] text-white font-semibold">
            Se connecter
          </Link>
        ) : null}
      </section>
    </main>
  );
}
