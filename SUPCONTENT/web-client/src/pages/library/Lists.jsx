import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listsApi } from "../../services/api/lists.api";
import { toDisplayNumber } from "../../utils/format";

const ListIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 5V3.5A1.5 1.5 0 017.5 2h5A1.5 1.5 0 0114 3.5V5M6 10h8M6 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M9 9v4M11 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function PosterPreview({ movie, index }) {
  return (
    <div className="aspect-[2/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800" title={movie?.title}>
      {movie?.poster_url ? (
        <img
          src={movie.poster_url}
          alt={movie.title || `Movie ${index + 1}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover/list:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
          Film
        </div>
      )}
    </div>
  );
}

function ListsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="grid h-40 grid-cols-4 gap-1 p-3">
            {Array.from({ length: 4 }).map((__, posterIndex) => (
              <div key={posterIndex} className="animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
          <div className="space-y-2 p-4 pt-1">
            <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-8 w-28 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyLists({ isAuthenticated }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <ListIcon />
      </div>
      <p className="text-base font-bold text-gray-950 dark:text-white">
        {isAuthenticated ? "Aucune liste pour le moment" : "Aucune liste publique"}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
        {isAuthenticated ? "Creez une liste pour organiser vos films par humeur, genre ou coups de coeur." : "Les collections publiques apparaitront ici des qu'elles seront partagees."}
      </p>
    </div>
  );
}

function ListCard({ list, onDelete, deleting, canManage = false }) {
  const previewMovies = list.preview_movies || list.movies || [];
  const movieCount = toDisplayNumber(list.movie_count ?? previewMovies.length);
  const visiblePosters = previewMovies.slice(0, 4);

  const handleDeleteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete(list);
  };

  return (
    <article className="group/list overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <Link to={`/lists/${list.id}`} className="block focus:outline-none focus:ring-2 focus:ring-[#D0021B]/50">
        <div className="relative p-3 pb-0">
          {visiblePosters.length > 0 ? (
            <div className="grid h-44 grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <PosterPreview key={visiblePosters[index]?.id || index} movie={visiblePosters[index]} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-500">
              <ListIcon />
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-1 text-base font-black text-gray-950 dark:text-white">{list.name}</h2>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500 dark:text-gray-400">
                {list.description || "Aucune description."}
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteClick}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {movieCount} film{movieCount !== 1 ? "s" : ""}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${list.is_public ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"}`}>
                {list.is_public ? "Publique" : "Privee"}
              </span>
            </div>
            <span className="text-gray-300 transition-transform group-hover/list:translate-x-0.5 dark:text-gray-600">
              <ArrowIcon />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function CreateListPanel({ form, setForm, creating, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-gray-950 dark:text-white">Nouvelle liste</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Creez une collection rapide et ajoutez vos films ensuite.</p>
        </div>
        <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-[#D0021B] dark:bg-red-950/30 sm:flex">
          <PlusIcon />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Nom</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            maxLength={100}
            placeholder="Ex: Films a voir ce mois-ci"
            className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 outline-none transition-colors focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Description</span>
          <input
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Optionnel"
            className="mt-1 h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 outline-none transition-colors focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-bold text-gray-600 dark:border-gray-700 dark:text-gray-300">
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#D0021B] px-4 text-sm font-bold text-white transition-colors hover:bg-[#b30218] disabled:opacity-50"
          >
            <PlusIcon />
            {creating ? "Creation..." : "Creer"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function Lists() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", isPublic: false });

  const loadLists = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    setError("");

    try {
      const res = user?.id
        ? await listsApi.getUserLists(user.id)
        : await listsApi.getPublic({ page: 1, limit: 20 });
      setLists(res.data.data || res.data.lists || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de charger les listes.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user?.id]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const totalMovies = useMemo(
    () => lists.reduce((sum, list) => sum + toDisplayNumber(list.movie_count ?? list.movies?.length), 0),
    [lists],
  );

  const publicCount = useMemo(
    () => lists.filter((list) => list.is_public).length,
    [lists],
  );

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || creating) return;

    setCreating(true);
    setError("");

    try {
      await listsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
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
    <div className="mx-auto max-w-screen-xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D0021B]">Lists</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
            {isAuthenticated ? "Mes listes" : "Listes publiques"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            {isAuthenticated
              ? "Organisez vos films par themes, envies, recommandations ou coups de coeur."
              : "Decouvrez les collections publiques partagees par la communaute."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-80">
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-black text-gray-950 dark:text-white">{lists.length}</p>
            <p className="text-[11px] font-bold uppercase text-gray-400">Listes</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-black text-gray-950 dark:text-white">{totalMovies}</p>
            <p className="text-[11px] font-bold uppercase text-gray-400">Films</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-lg font-black text-gray-950 dark:text-white">{publicCount}</p>
            <p className="text-[11px] font-bold uppercase text-gray-400">Publiques</p>
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="mb-6">
          <CreateListPanel form={form} setForm={setForm} creating={creating} onSubmit={handleCreate} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <ListsSkeleton />
      ) : lists.length === 0 ? (
        <EmptyLists isAuthenticated={isAuthenticated} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              deleting={deletingId === list.id}
              onDelete={handleDelete}
              canManage={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
