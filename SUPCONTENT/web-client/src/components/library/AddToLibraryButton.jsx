import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'TO_WATCH',    label: 'Watchlist',  color: '#6366f1' },
  { value: 'IN_PROGRESS', label: 'Watching',   color: '#f59e0b' },
  { value: 'COMPLETED',   label: 'Completed',  color: '#10b981' },
  { value: 'DROPPED',     label: 'Dropped',    color: '#ef4444' },
];

export default function AddToLibraryButton({ movieId, tmdbId, variant = 'default', className = '' }) {
  const { user } = useAuth();
  const { getMovieStatus, upsertEntry, removeEntry, getMyLists, addMovieToList, loading } = useLibrary();
  const [currentStatus, setCurrentStatus] = useState(null);
  const [lists, setLists] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [feedback, setFeedback] = useState('');
  const ref = useRef(null);

  async function fetchStatus() {
    try {
      const res = await getMovieStatus(movieId);
      setCurrentStatus(res.data?.status || res.status || null);
    } catch (err) { console.error(err); }
  }

  async function fetchLists() {
    try {
      const res = await getMyLists(user.id || user.userId);
      setLists(res.data || res.lists || []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    if (user && (movieId || tmdbId)) {
      if (movieId) fetchStatus();
      fetchLists();
    }
  }, [user, movieId, tmdbId]);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowDropdown(false);
        setShowLists(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);



  async function handleStatus(status) {
    try {
      await upsertEntry({ movieId: tmdbId ? undefined : movieId, tmdb_id: tmdbId || undefined }, status);
      setCurrentStatus(status);
      flash('Added to library ✓');
    } catch (err) { console.error(err); }
    setShowDropdown(false);
  }

  async function handleRemove() {
    try {
      await removeEntry(movieId);
      setCurrentStatus(null);
      flash('Removed from library');
    } catch (err) { console.error(err); }
    setShowDropdown(false);
  }

  async function handleAddToList(listId) {
    try {
      await addMovieToList(listId, tmdbId ? undefined : movieId, tmdbId || undefined);
      flash('Added to list ✓');
    } catch (err) { console.error(err); }
    setShowLists(false);
    setShowDropdown(false);
  }

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 2000);
  }

  if (!user) {
    if (variant === 'icon') {
      return (
        <Link
          to="/login"
          className={className}
          style={{ ...btnStyles.icon, textDecoration: 'none' }}
          title="Login to add"
          aria-label="Login to add"
          onClick={(event) => event.stopPropagation()}
        >
          <span style={btnStyles.iconLabel}>+</span>
        </Link>
      );
    }

    return (
      <Link to="/login" style={btnStyles.secondary}>
        🔐 Login to add
      </Link>
    );
  }

  const active = STATUS_OPTIONS.find((o) => o.value === currentStatus);
  const isIcon = variant === 'icon';

  return (
    <div
      className={className}
      style={{ position: 'relative' }}
      ref={ref}
      onClick={(event) => event.stopPropagation()}
    >
      {feedback && (
        <div style={btnStyles.feedback}>{feedback}</div>
      )}

      <button
        type="button"
        title={isIcon ? 'Add to library or list' : undefined}
        aria-label={isIcon ? 'Add to library or list' : undefined}
        style={
          isIcon
            ? { ...btnStyles.icon, ...(active ? { color: active.color, borderColor: active.color + '66' } : {}) }
            : active
              ? { ...btnStyles.primary, background: active.color + '22', color: active.color, borderColor: active.color + '44' }
              : btnStyles.primary
        }
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
      >
        {isIcon && <span style={btnStyles.iconLabel}>+</span>}
        {active ? `${active.label} ▾` : '+ Add to library'}
      </button>

      {showDropdown && (
        <div style={{ ...btnStyles.dropdown, ...(isIcon ? { left: 'auto', right: 0 } : {}) }}>
          <p style={btnStyles.dropSection}>Status</p>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...btnStyles.dropItem,
                ...(currentStatus === opt.value ? { background: '#1a1a3e', color: '#fff' } : {}),
              }}
              onClick={() => handleStatus(opt.value)}
            >
              <span style={{ ...btnStyles.dot, background: opt.color }} />
              {opt.label}
              {currentStatus === opt.value && <span style={{ marginLeft: 'auto', color: opt.color }}>✓</span>}
            </button>
          ))}

          <div style={btnStyles.divider} />

          <button
            style={btnStyles.dropItem}
            onClick={() => setShowLists(!showLists)}
          >
            📋 Add to a list
          </button>

          {showLists && (
            <div style={btnStyles.listPicker}>
              {lists.length === 0 ? (
                <Link to="/lists" style={{ ...btnStyles.dropItem, textDecoration: 'none' }}>
                  + Create a list
                </Link>
              ) : (
                lists.map((list) => (
                  <button
                    key={list.id}
                    style={btnStyles.dropItem}
                    onClick={() => handleAddToList(list.id)}
                  >
                    <span style={{ flex: 1, textAlign: 'left' }}>{list.name}</span>
                    <span style={{ fontSize: 10, color: '#555' }}>
                      {list.is_public ? '🌐' : '🔒'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {currentStatus && (
            <>
              <div style={btnStyles.divider} />
              <button
                style={{ ...btnStyles.dropItem, color: '#f87171' }}
                onClick={handleRemove}
              >
                🗑 Remove from library
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const btnStyles = {
  primary: {
    background: '#4a4aff',
    color: '#fff',
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  secondary: {
    display: 'inline-block',
    background: 'transparent',
    color: '#888',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    textDecoration: 'none',
  },
  icon: {
    width: 28,
    height: 28,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 0,
    lineHeight: 1,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    backdropFilter: 'blur(6px)',
  },
  iconLabel: {
    fontSize: 20,
    lineHeight: 1,
    marginTop: -2,
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    background: '#111120',
    border: '1px solid #2a2a4a',
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 100,
    minWidth: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  dropSection: {
    margin: 0,
    padding: '8px 12px 4px',
    fontSize: 10,
    color: '#444',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#a0a0c0',
    padding: '9px 12px',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: '#1a1a2e',
    margin: '4px 0',
  },
  listPicker: {
    background: '#0d0d1e',
    borderTop: '1px solid #1a1a2e',
  },
  feedback: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a3a2e',
    color: '#4ade80',
    border: '1px solid #2a5a3e',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 12,
    whiteSpace: 'nowrap',
    zIndex: 101,
  },
};
