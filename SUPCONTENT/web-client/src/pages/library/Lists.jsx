import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listsApi } from "../../services/api/lists.api";

const ListIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 5V3.5A1.5 1.5 0 017.5 2h5A1.5 1.5 0 0114 3.5V5M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M9 9v4M11 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function ListsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-36 rounded-2xl border border-gray-100 bg-white p-5 animate-pulse dark:border-gray-800 dark:bg-gray-900">
          <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-8 h-8 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

function EmptyLists() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <ListIcon />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">Aucune liste pour le moment</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Creez une liste pour organiser vos films.</p>
    </div>
  );
}

function ListCard({ list, onDelete, deleting }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <ListIcon />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-1 text-base font-bold text-gray-900 dark:text-white">{list.name}</h2>
          <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">
            {list.description || "Aucune description."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {list.movie_count ?? list.movies?.length ?? 0} film(s)
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${list.is_public ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
            {list.is_public ? "Publique" : "Privee"}
          </span>
        </div>

        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(list)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
          title="Supprimer"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}

export default function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", isPublic: false });

  const loadLists = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await listsApi.getUserLists(user.id);
      setLists(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de charger les listes.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || creating) return;

    setCreating(true);
    setError("");

    try {
      await listsApi.create({
        name: form.name,
        description: form.description,
        isPublic: form.isPublic,
      });
      setForm({ name: "", description: "", isPublic: false });
      await loadLists();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de creer la liste.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (list) => {
    setDeletingId(list.id);
    setError("");

    try {
      await listsApi.remove(list.id);
      setLists((current) => current.filter((item) => item.id !== list.id));
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de supprimer la liste.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-950 dark:text-white">Mes listes</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Organisez vos films par themes, envies ou coups de coeur.</p>
      </div>

      <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-gray-400">Nom</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={100}
              placeholder="Ex: Films a voir ce mois-ci"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase text-gray-400">Description</span>
            <input
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optionnel"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 accent-[#D0021B]"
              />
              Publique
            </label>
            <button
              type="submit"
              disabled={creating || !form.name.trim()}
              className="rounded-xl bg-[#D0021B] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b30218] disabled:opacity-50"
            >
              {creating ? "Creation..." : "Creer"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <ListsSkeleton />
      ) : lists.length === 0 ? (
        <EmptyLists />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              deleting={deletingId === list.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link to="/discover" className="text-sm font-bold text-[#D0021B] hover:underline">
          Ajouter des films depuis Discover
        </Link>
      </div>
    </div>
  );
}
