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
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <Link to="/lists" style={styles.backLink}>
          <ArrowLeftIcon />
          Back to Lists
        </Link>

        {isOwner && (
          <div style={styles.actions}>
            <Link to="/discover" style={styles.addBtn}>
              <PlusIcon />
              Add Movie
            </Link>
            <button type="button" style={styles.moreBtn} onClick={() => setShowEdit(true)} aria-label="Edit list">
              <MoreIcon />
            </button>
          </div>
        )}
      </div>

      <header style={styles.header}>
        <div>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>{list.name}</h1>
            <span style={styles.visibilityIcon} title={list.is_public ? 'Public' : 'Private'}>
              {list.is_public ? <GlobeIcon /> : <LockIcon />}
            </span>
          </div>
          {list.description && <p style={styles.description}>{list.description}</p>}
          <div style={styles.meta}>
            <Link to={`/profile/${list.user_id}`} style={styles.owner}>
              <span style={styles.avatar}>{getInitials(list.owner_username)}</span>
              <span>by {list.owner_username}</span>
            </Link>
            <span style={styles.count}>{movies.length} movie{movies.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </header>

      {movies.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>This list is empty</p>
          {isOwner && <Link to="/discover" style={styles.addBtn}>Add Movie</Link>}
        </div>
      ) : (
        <div style={styles.grid}>
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
  );
}

function MoviePosterCard({ movie, isOwner, onRemove }) {
  const poster = getPoster(movie);
  const year = getYear(movie.release_date);
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;

  return (
    <article style={styles.card}>
      <Link to={`/movies/${movie.external_id}`} style={styles.posterLink} title={`${movie.title}${year ? ` (${year})` : ''}`}>
        {poster ? (
          <img src={poster} alt={movie.title} style={styles.poster} loading="lazy" />
        ) : (
          <div style={styles.posterFallback}>{movie.title}</div>
        )}

        {rating && (
          <span style={styles.ratingBadge}>
            <StarIcon />
            {rating}
          </span>
        )}

        {isOwner && (
          <button
            type="button"
            style={styles.bookmarkBtn}
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
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit list</h2>
          <button type="button" style={styles.modalClose} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              maxLength={100}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...styles.input, resize: 'vertical' }}
            />
          </div>
          <div style={styles.toggleRow}>
            <div>
              <p style={styles.toggleLabel}>Public list</p>
              <p style={styles.toggleDesc}>Visible to everyone</p>
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
          <div style={styles.modalActions}>
            <button type="button" style={styles.deleteTextBtn} onClick={onDelete}>Delete</button>
            <div style={styles.modalRightActions}>
              <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button type="submit" style={styles.submitBtn}>Save changes</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
