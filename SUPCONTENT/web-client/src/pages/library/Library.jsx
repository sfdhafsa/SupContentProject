import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LIBRARY_STATUSES, libraryApi } from "../../services/api/library.api";

const FilmIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400">
    <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M2 7h16M2 13h16M6 4v3M6 13v3M10 4v3M10 13v3M14 4v3M14 13v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M9 9v4M11 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function statusLabel(status) {
  return LIBRARY_STATUSES.find((item) => item.value === status)?.label || status;
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="mt-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-2 h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

function EmptyLibrary({ filtered }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <FilmIcon />
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {filtered ? "Aucun film dans ce statut" : "Votre bibliotheque est vide"}
      </p>
      <Link to="/discover" className="mt-4 inline-flex rounded-xl bg-[#D0021B] px-4 py-2 text-sm font-bold text-white hover:bg-[#b30218]">
        Decouvrir des films
      </Link>
    </div>
  );
}

function LibraryCard({ item, onStatusChange, onRemove, busy }) {
  const movieHref = item.external_id ? `/movies/${item.external_id}` : "/discover";

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <Link to={movieHref} className="block aspect-[2/3] bg-gray-100 dark:bg-gray-800">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FilmIcon />
          </div>
        )}
      </Link>

      <div className="space-y-3 p-3">
        <div>
          <Link to={movieHref} className="line-clamp-2 text-sm font-bold text-gray-900 hover:text-[#D0021B] dark:text-white">
            {item.title}
          </Link>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {item.release_date ? item.release_date.slice(0, 4) : "Date inconnue"}
          </p>
        </div>

        <select
          value={item.status}
          disabled={busy}
          onChange={(event) => onStatusChange(item, event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition-colors focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {LIBRARY_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(item)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-900 dark:hover:bg-red-900/20"
        >
          <TrashIcon />
          Retirer
        </button>
      </div>
    </article>
  );
}

export default function Library() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [libraryRes, statsRes] = await Promise.all([
        libraryApi.getMine(filter || undefined),
        libraryApi.getStats(),
      ]);
      setItems(libraryRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de charger la bibliotheque.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const totals = useMemo(() => stats?.counts || {}, [stats]);

  const handleStatusChange = async (item, status) => {
    setBusyId(item.id);
    try {
      await libraryApi.saveMovie({ movieId: item.movie_id, status });
      await loadLibrary();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de modifier ce film.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyId(item.id);
    try {
      await libraryApi.removeMovie(item.movie_id);
      await loadLibrary();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de retirer ce film.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-950 dark:text-white">Ma bibliotheque</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {stats ? `${stats.totalMovies} film(s), ${stats.totalHoursWatched || 0}h vues` : "Vos films sauvegardes"}
          </p>
        </div>

        <Link to="/discover" className="inline-flex justify-center rounded-xl bg-[#D0021B] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#b30218]">
          Ajouter des films
        </Link>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("")}
          className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-colors ${filter === "" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"}`}
        >
          Tous {stats ? `(${stats.totalMovies})` : ""}
        </button>
        {LIBRARY_STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => setFilter(status.value)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition-colors ${filter === status.value ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"}`}
          >
            {status.label} ({totals[status.value] || 0})
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <LibrarySkeleton />
      ) : items.length === 0 ? (
        <EmptyLibrary filtered={Boolean(filter)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {filter && items.length > 0 && (
        <p className="mt-4 text-sm text-gray-400">
          Filtre actif: {statusLabel(filter)}
        </p>
      )}
    </div>
  );
}
