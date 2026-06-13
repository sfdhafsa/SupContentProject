import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../services/api/axios.js";

export default function VerificationPending() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const resend = async (event) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    if (!email.trim()) {
      setError("Saisissez votre adresse email.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/resend-verification", {
        email: email.trim(),
      });
      setFeedback(response.data?.message || "Un nouvel email a ete envoye.");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
        "Impossible de renvoyer l'email pour le moment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
        <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-red-50 text-[#D0021B] flex items-center justify-center text-2xl">
          @
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Verifiez votre email
        </h1>
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-7">
          Nous avons envoye un lien valable 24 heures. Ouvrez-le pour activer votre compte.
        </p>
        <form onSubmit={resend}>
          <label className="block text-sm font-medium text-gray-800 mb-2">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#D0021B]"
            placeholder="name@example.com"
          />
          {feedback ? <p className="mt-3 text-sm text-green-700">{feedback}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 py-3 rounded-xl bg-[#D0021B] text-white font-semibold disabled:opacity-60"
          >
            {loading ? "Envoi..." : "Renvoyer l'email"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Adresse deja verifiee ?{" "}
          <Link to="/login" className="text-[#D0021B] font-semibold">Se connecter</Link>
        </p>
      </section>
    </main>
  );
}
