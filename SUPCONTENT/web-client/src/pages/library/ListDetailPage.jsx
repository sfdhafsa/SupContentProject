import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';
import { getYear } from '../../utils/format';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

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
      <div style={styles.backRow}>
        <Link to="/lists" style={styles.backLink}>
          ← My Lists
        </Link>
      </div>

      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerTop}>
            <span style={{
              ...styles.visibilityBadge,
              ...(list.is_public ? styles.publicBadge : styles.privateBadge),
            }}>
              {list.is_public ? '🌐 Public' : '🔒 Private'}
            </span>
          </div>
          <h1 style={styles.title}>{list.name}</h1>
          {list.description && <p style={styles.description}>{list.description}</p>}
          <div style={styles.meta}>
            <span style={styles.metaItem}>
              <span style={{ marginRight: 4 }}>🎬</span>
              {movies.length} film{movies.length !== 1 ? 's' : ''}
            </span>
            <span style={styles.metaDot}>·</span>
            <span style={styles.metaItem}>
              By <Link to={`/profile/${list.user_id}`} style={styles.ownerLink}>
                {list.owner_username}
              </Link>
            </span>
          </div>
        </div>

        {isOwner && (
          <div style={styles.headerActions}>
            <button style={styles.editBtn} onClick={() => setShowEdit(true)}>
              ✎ Edit
            </button>
            <button style={styles.deleteBtn} onClick={handleDelete}>
              🗑 Delete
            </button>
          </div>
        )}
      </div>

      {movies.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>🎬</p>
          <p style={styles.emptyTitle}>This list is empty</p>
          {isOwner && (
            <Link to="/discover" style={styles.emptyBtn}>Browse films to add</Link>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {movies.map((movie) => {
            const poster = movie.poster_url
              ? movie.poster_url.startsWith('http') ? movie.poster_url : `${TMDB_IMG}${movie.poster_url}`
              : null;
            const year = getYear(movie.release_date);
            return (
              <div key={movie.id} style={styles.card}>
                <Link to={`/movies/${movie.external_id}`} style={styles.posterLink}>
                  {poster ? (
                    <img src={poster} alt={movie.title} style={styles.poster} loading="lazy" />
                  ) : (
                    <div style={styles.posterFallback}>🎬</div>
                  )}
                  <div style={styles.posterOverlay}>
                    <span style={styles.viewBtn}>View</span>
                  </div>
                </Link>
                <div style={styles.cardBody}>
                  <p style={styles.movieTitle}>{movie.title}</p>
                  <p style={styles.movieYear}>{year}</p>
                  {isOwner && (
                    <button
                      style={styles.removeBtn}
                      onClick={() => handleRemoveMovie(movie.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showEdit && (
        <EditModal
          list={list}
          onSubmit={handleUpdate}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}

function EditModal({ list, onSubmit, onClose }) {
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
          <button style={styles.modalClose} onClick={onClose}>✕</button>
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
            >
              <span style={{
                ...styles.toggleThumb,
                transform: isPublic ? 'translateX(20px)' : 'translateX(0)',
              }} />
            </button>
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.submitBtn}>Save changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#444' }}>Loading…</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#f87171', fontSize: 16 }}>{message}</p>
        <Link to="/lists" style={{ color: '#6666cc', textDecoration: 'none' }}>← Back to lists</Link>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e8e8f0',
    padding: '2rem',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  backRow: { marginBottom: '1.5rem' },
  backLink: {
    color: '#555',
    textDecoration: 'none',
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    gap: 16,
    flexWrap: 'wrap',
  },
  headerLeft: { flex: 1 },
  headerTop: { marginBottom: 8 },
  visibilityBadge: {
    display: 'inline-block',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 500,
  },
  publicBadge: {
    background: '#0f2a1e',
    color: '#4ade80',
    border: '1px solid #1a4a2e',
  },
  privateBadge: {
    background: '#1a1a2e',
    color: '#6666aa',
    border: '1px solid #2a2a4a',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
    color: '#fff',
  },
  description: {
    color: '#666',
    fontSize: 15,
    margin: '0 0 12px',
    lineHeight: 1.6,
  },
  meta: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { fontSize: 13, color: '#555', display: 'flex', alignItems: 'center' },
  metaDot: { color: '#333' },
  ownerLink: { color: '#7777cc', textDecoration: 'none', marginLeft: 4 },
  headerActions: { display: 'flex', gap: 8, flexShrink: 0 },
  editBtn: {
    background: 'transparent',
    border: '1px solid #2a2a4a',
    color: '#888',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
  },
  deleteBtn: {
    background: 'transparent',
    border: '1px solid #4a1a1a',
    color: '#f87171',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#0e0e1e',
    border: '1px solid #1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  posterLink: {
    display: 'block',
    position: 'relative',
    aspectRatio: '2/3',
    overflow: 'hidden',
    textDecoration: 'none',
  },
  poster: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  posterFallback: {
    width: '100%',
    height: '100%',
    background: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    fontSize: 32,
  },
  posterOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  viewBtn: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
  },
  cardBody: { padding: '10px 12px' },
  movieTitle: {
    margin: 0,
    fontSize: 13,
    fontWeight: 500,
    color: '#d0d0e8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  movieYear: { margin: '2px 0 8px', fontSize: 12, color: '#444' },
  removeBtn: {
    background: 'transparent',
    border: '1px solid #4a1a1a',
    color: '#f87171',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    width: '100%',
  },
  empty: { textAlign: 'center', padding: '6rem 2rem' },
  emptyIcon: { fontSize: 48, margin: '0 0 1rem' },
  emptyTitle: { color: '#555', fontSize: 16, margin: '0 0 1.5rem' },
  emptyBtn: {
    display: 'inline-block',
    background: '#e53e3e',
    color: '#fff',
    borderRadius: 8,
    padding: '10px 24px',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    background: '#111120',
    border: '1px solid #2a2a4a',
    borderRadius: 16,
    padding: '1.5rem',
    width: '100%',
    maxWidth: 440,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: '#fff' },
  modalClose: {
    background: 'transparent',
    border: 'none',
    color: '#555',
    fontSize: 16,
    cursor: 'pointer',
  },
  formGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: 13, color: '#888', marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%',
    background: '#0a0a1a',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    color: '#e0e0f0',
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
    background: '#0a0a1a',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: '1.5rem',
  },
  toggleLabel: { margin: 0, fontSize: 14, color: '#d0d0e8', fontWeight: 500 },
  toggleDesc: { margin: '2px 0 0', fontSize: 12, color: '#444' },
  toggle: {
    width: 44,
    height: 24,
    background: '#2a2a4a',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  toggleOn: { background: '#4a4aff' },
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
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid #2a2a4a',
    color: '#888',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
  },
  submitBtn: {
    background: '#e53e3e',
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
