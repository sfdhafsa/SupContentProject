import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';
import { getYear } from '../../utils/format';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={styles.icon}>
    <path d="M12.5 15L7.5 10l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }}>
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 10h16M10 2c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }}>
    <rect x="4" y="8.5" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 8.5V6a3 3 0 016 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={styles.icon}>
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={styles.icon}>
    <circle cx="5" cy="10" r="1.5" fill="currentColor" />
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={styles.iconSmall}>
    <path d="M5.5 3.5h9v13l-4.5-3-4.5 3v-13z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 20 20" style={styles.starIcon}>
    <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.7-5 2.7.9-5.5-4-3.9 5.6-.8L10 1.8z" fill="currentColor" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" style={styles.icon}>
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export default function ListDetailPage() {
  const { listId } = useParams();
  const { user } = useAuth();
  const { getListById, updateList, deleteList, removeMovieFromList, loading } = useLibrary();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();

  async function fetchList() {
    try {
      const res = await getListById(listId);
      setList(res.data?.data || res.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchList();
  }, [listId]);

  async function handleUpdate(data) {
    try {
      await updateList(listId, data);
      setShowEdit(false);
      fetchList();
    } catch (err) { console.error(err); }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${list.name}"? This cannot be undone.`)) return;
    try {
      await deleteList(listId);
      navigate('/lists');
    } catch (err) { console.error(err); }
  }

  async function handleRemoveMovie(movieId) {
    if (!window.confirm('Remove from list?')) return;
    try {
      await removeMovieFromList(listId, movieId);
      fetchList();
    } catch (err) { console.error(err); }
  }

  if (loading && !list) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!list) return null;

  const isOwner = user && (String(user.id) === String(list.user_id) || String(user.userId) === String(list.user_id));
  const movies = list.movies || [];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50 px-4 py-7 font-sans text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to="/lists" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-[#D0021B] dark:text-gray-400 dark:hover:text-red-400">
          <ArrowLeftIcon />
          Retour aux listes
        </Link>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Link to="/discover" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D0021B] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#ad0016]">
              <PlusIcon />
              Ajouter un film
            </Link>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800" onClick={() => setShowEdit(true)} aria-label="Modifier la liste">
              <MoreIcon />
            </button>
          </div>
        )}
      </div>

      <header className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D0021B] dark:bg-red-950/40">
            <BookmarkIcon />
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300" title={list.is_public ? 'Publique' : 'Privée'}>
              {list.is_public ? <GlobeIcon /> : <LockIcon />}
              {list.is_public ? 'Publique' : 'Privée'}
          </span>
        </div>
        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">{list.name}</h1>
        {list.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400 sm:text-base">{list.description}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <Link to={`/profile/${list.user_id}`} className="inline-flex items-center gap-2 font-bold text-gray-700 transition-colors hover:text-[#D0021B] dark:text-gray-200 dark:hover:text-red-400">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-500 dark:bg-gray-800 dark:text-gray-300">{getInitials(list.owner_username)}</span>
              <span>par {list.owner_username}</span>
            </Link>
            <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <span className="font-bold text-gray-400 dark:text-gray-500">{movies.length} film{movies.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      {movies.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"><BookmarkIcon /></span>
          <p className="text-base font-black text-gray-950 dark:text-white">Cette liste est vide</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500 dark:text-gray-400">Les films ajoutés à cette liste apparaîtront ici.</p>
          {isOwner && <Link to="/discover" className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D0021B] px-4 text-sm font-bold text-white transition hover:bg-[#ad0016]"><PlusIcon /> Ajouter un film</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => (
            <MoviePosterCard
              key={movie.id}
              movie={movie}
              isOwner={isOwner}
              onRemove={() => handleRemoveMovie(movie.id)}
            />
          ))}
        </div>
      )}

      {showEdit && (
        <EditModal
          list={list}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setShowEdit(false)}
        />
      )}
      </div>
    </main>
  );
}

function MoviePosterCard({ movie, isOwner, onRemove }) {
  const poster = getPoster(movie);
  const year = getYear(movie.release_date);
  const numericRating = Number(movie.vote_average);
  const rating = Number.isFinite(numericRating) && numericRating > 0 ? numericRating.toFixed(1) : null;

  return (
    <article className="group min-w-0">
      <Link to={`/movies/${movie.external_id}`} className="relative block aspect-[2/3] overflow-hidden rounded-2xl bg-gray-200 shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg dark:bg-gray-800" title={`${movie.title}${year ? ` (${year})` : ''}`}>
        {poster ? (
          <img src={poster} alt={movie.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm font-bold text-gray-500 dark:text-gray-400">{movie.title}</div>
        )}

        {rating && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gray-950/85 px-2 py-1 text-xs font-black text-white backdrop-blur">
            <StarIcon />
            {rating}
          </span>
        )}

        {isOwner && (
          <button
            type="button"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-gray-950/75 text-white backdrop-blur transition hover:bg-[#D0021B]"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            aria-label={`Remove ${movie.title} from list`}
          >
            <BookmarkIcon />
          </button>
        )}
      </Link>
      <p className="mt-2 truncate text-sm font-bold text-gray-900 dark:text-gray-100">{movie.title}</p>
      {year && <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">{year}</p>}
    </article>
  );
}

function getPoster(movie) {
  if (!movie?.poster_url) return null;
  return movie.poster_url.startsWith('http') ? movie.poster_url : `${TMDB_IMG}${movie.poster_url}`;
}

function getInitials(name = '') {
  return name.trim().slice(0, 1).toUpperCase() || 'U';
}

function EditModal({ list, onSubmit, onDelete, onClose }) {
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || '');
  const [isPublic, setIsPublic] = useState(list.is_public);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, description, isPublic });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-950 dark:text-white">Modifier la liste</h2>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              maxLength={100}
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-[#D0021B] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="m-0 text-sm font-bold text-gray-900 dark:text-white">Liste publique</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Visible par tout le monde</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              style={{ ...styles.toggle, ...(isPublic ? styles.toggleOn : {}) }}
              aria-pressed={isPublic}
            >
              <span style={{
                ...styles.toggleThumb,
                transform: isPublic ? 'translateX(20px)' : 'translateX(0)',
              }} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="text-sm font-bold text-[#D0021B] transition hover:text-red-800" onClick={onDelete}>Supprimer</button>
            <div className="flex gap-2">
              <button type="button" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800" onClick={onClose}>Annuler</button>
              <button type="submit" className="rounded-xl bg-[#D0021B] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#ad0016]">Enregistrer</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 text-sm font-bold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
      Chargement...
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#D0021B', fontSize: 15, marginBottom: 12 }}>{message}</p>
        <Link to="/lists" style={styles.backLink}>
          <ArrowLeftIcon />
          Back to Lists
        </Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    background: '#f8fafc',
    color: '#0f172a',
    padding: '1.75rem 0 5.5rem',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: '1.5rem',
  },
  backLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#D0021B',
    color: '#fff',
    border: '1px solid #D0021B',
    borderRadius: 10,
    padding: '0.65rem 1rem',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    minHeight: 40,
    cursor: 'pointer',
  },
  moreBtn: {
    width: 40,
    height: 40,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    color: '#111827',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: '2rem',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 800,
    margin: 0,
    color: '#030712',
    letterSpacing: 0,
  },
  visibilityIcon: {
    color: '#6b7280',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  description: {
    color: '#64748b',
    fontSize: 14,
    margin: '0 0 1.1rem',
    lineHeight: 1.6,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    color: '#64748b',
    fontSize: 13,
  },
  owner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: '#111827',
    textDecoration: 'none',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e5e7eb',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 800,
    border: '1px solid #d1d5db',
  },
  count: {
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 214px))',
    gap: 14,
    alignItems: 'start',
  },
  card: {
    width: '100%',
    maxWidth: 214,
  },
  posterLink: {
    display: 'block',
    position: 'relative',
    aspectRatio: '2 / 3',
    overflow: 'hidden',
    borderRadius: 10,
    background: '#e5e7eb',
    textDecoration: 'none',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
  },
  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  posterFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 700,
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(17, 24, 39, 0.88)',
    color: '#fff',
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(17, 24, 39, 0.78)',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  starIcon: {
    width: 12,
    height: 12,
    color: '#facc15',
  },
  icon: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  iconSmall: {
    width: 15,
    height: 15,
    flexShrink: 0,
  },
  empty: {
    minHeight: 240,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    border: '1px dashed #d1d5db',
    borderRadius: 12,
    background: '#fff',
  },
  emptyTitle: {
    margin: 0,
    color: '#64748b',
    fontSize: 15,
    fontWeight: 600,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: '1.5rem',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' },
  modalClose: {
    width: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
  },
  formGroup: { marginBottom: '1.1rem' },
  label: { display: 'block', fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 700 },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    color: '#111827',
    padding: '10px 12px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: '1.5rem',
  },
  toggleLabel: { margin: 0, fontSize: 14, color: '#111827', fontWeight: 700 },
  toggleDesc: { margin: '2px 0 0', fontSize: 12, color: '#64748b' },
  toggle: {
    width: 44,
    height: 24,
    background: '#d1d5db',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  toggleOn: { background: '#D0021B' },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    background: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.2s',
    display: 'block',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalRightActions: {
    display: 'flex',
    gap: 10,
  },
  deleteTextBtn: {
    background: 'transparent',
    border: 'none',
    color: '#D0021B',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '10px 0',
  },
  cancelBtn: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    color: '#475569',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  submitBtn: {
    background: '#D0021B',
    border: 'none',
    color: '#fff',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
};
