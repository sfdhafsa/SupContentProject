import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LIBRARY_STATUSES, libraryApi } from "../../services/api/library.api";
import { getYear, toDisplayNumber } from "../../utils/format";

const STATUS_META = {
  TO_WATCH: { label: "A voir", accent: "bg-indigo-500", tint: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
  IN_PROGRESS: { label: "En cours", accent: "bg-amber-500", tint: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  COMPLETED: { label: "Vu", accent: "bg-emerald-500", tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  DROPPED: { label: "Abandonne", accent: "bg-rose-500", tint: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

const FilmIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
    <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 7h16M2 13h16M6 4v3M6 13v3M10 4v3M10 13v3M14 4v3M14 13v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6M9 9v4M11 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function statusLabel(status) {
  return STATUS_META[status]?.label || LIBRARY_STATUSES.find((item) => item.value === status)?.label || status;
}

function LibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="aspect-[2/3] animate-pulse bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-2 p-3">
            <div className="h-3 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyLibrary({ filtered }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <FilmIcon />
      </div>
      <p className="text-base font-bold text-gray-950 dark:text-white">
        {filtered ? "Aucun film dans ce statut" : "Votre bibliotheque est vide"}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
        {filtered ? "Essayez un autre filtre ou ajoutez de nouveaux films." : "Ajoutez des films depuis la page Discover pour commencer a suivre votre progression."}
      </p>
      <Link to="/discover" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#D0021B] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b30218]">
        Ajouter des films
        <ArrowIcon />
      </Link>
    </div>
  );
}

function StatTile({ label, value, tone = "bg-gray-900 dark:bg-white" }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className={`mb-3 h-1.5 w-10 rounded-full ${tone}`} />
      <p className="text-2xl font-black text-gray-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}

function LibraryCard({ item, onStatusChange, onRemove, busy }) {
  const movieHref = item.external_id ? `/movies/${item.external_id}` : "/discover";
  const meta = STATUS_META[item.status] || STATUS_META.TO_WATCH;
  const year = getYear(item.release_date) || "Date inconnue";

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700">
      <Link to={movieHref} className="relative block aspect-[2/3] bg-gray-100 dark:bg-gray-800">
        {item.poster_url ? (
          <img src={item.poster_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <FilmIcon />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.tint}`}>
            {statusLabel(item.status)}
          </span>
        </div>
      </Link>

      <div className="space-y-3 p-3">
        <div className="min-h-12">
          <Link to={movieHref} className="line-clamp-2 text-sm font-bold leading-5 text-gray-950 hover:text-[#D0021B] dark:text-white">
            {item.title}
          </Link>
          <p className="mt-1 text-xs font-medium text-gray-400 dark:text-gray-500">{year}</p>
        </div>

        <select
          value={item.status}
          disabled={busy}
          onChange={(event) => onStatusChange(item, event.target.value)}
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 outline-none transition-colors focus:border-[#D0021B] disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {LIBRARY_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={busy}
          onClick={() => onRemove(item)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-900 dark:hover:bg-red-900/20"
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
  const totalMovies = toDisplayNumber(stats?.totalMovies);
  const completed = toDisplayNumber(totals.COMPLETED);
  const watchTime = `${toDisplayNumber(stats?.totalHoursWatched)}h ${toDisplayNumber(stats?.totalMinutesWatched)}m`;

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
    <div className="mx-auto max-w-screen-xl">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#D0021B]">Library</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">Ma bibliotheque</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            Suivez vos films, changez leur statut rapidement et retrouvez votre progression en un coup d'oeil.
          </p>
        </div>

        <Link to="/discover" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#D0021B] px-4 text-sm font-bold text-white transition-colors hover:bg-[#b30218]">
          Ajouter des films
          <ArrowIcon />
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatTile label="Total films" value={totalMovies} tone="bg-gray-950 dark:bg-white" />
        <StatTile label="Films vus" value={completed} tone="bg-emerald-500" />
        <StatTile label="Temps vu" value={watchTime} tone="bg-amber-500" />
      </div>

      <div className="mb-6 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setFilter("")}
            className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${filter === "" ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950" : "text-gray-500 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"}`}
          >
            Tous ({totalMovies})
          </button>
          {LIBRARY_STATUSES.map((status) => {
            const active = filter === status.value;
            const meta = STATUS_META[status.value];
            return (
              <button
                key={status.value}
                type="button"
                onClick={() => setFilter(status.value)}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-colors ${active ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950" : "text-gray-500 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"}`}
              >
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${meta?.accent || "bg-gray-400"}`} />
                {status.label} ({toDisplayNumber(totals[status.value])})
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
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
        <p className="mt-5 text-sm font-medium text-gray-400">Filtre actif: {statusLabel(filter)}</p>
      )}
    </div>
  );
}
