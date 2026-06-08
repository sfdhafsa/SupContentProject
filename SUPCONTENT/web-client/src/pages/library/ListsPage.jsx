import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';
import { formatShortDate } from '../../utils/format';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

export default function ListsPage() {
  const { user } = useAuth();
  const { getMyLists, createList, updateList, deleteList, loading } = useLibrary();
  const [lists, setLists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const navigate = useNavigate();
  async function fetchLists() {
    try {
      const res = await getMyLists(user.id || user.userId);
      setLists(res.data || []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    if (user) fetchLists();
  }, [user]);

  async function handleCreate(data) {
    try {
      await createList(data);
      setShowModal(false);
      fetchLists();
    } catch (err) { console.error(err); }
  }

  async function handleUpdate(listId, data) {
    try {
      await updateList(listId, data);
      setEditingList(null);
      fetchLists();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(e, listId, name) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteList(listId);
      fetchLists();
    } catch (err) { console.error(err); }
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white px-6 py-8 max-w-screen-xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Lists</h1>
          <p className="text-gray-400 text-sm">Create and manage your custom movie lists</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#D0021B] hover:bg-[#b30218] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <PlusIcon /> Create List
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-[#1a1a2e] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="text-6xl mb-5">📋</span>
          <p className="text-white font-semibold text-xl mb-2">No lists yet</p>
          <p className="text-gray-500 text-sm mb-8">Create your first list to organize your films</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#D0021B] hover:bg-[#b30218] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Create a list
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onClick={() => navigate(`/lists/${list.id}`)}
              onEdit={(e) => { e.stopPropagation(); setEditingList(list); }}
              onDelete={(e) => handleDelete(e, list.id, list.name)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ListModal title="Create new list" onSubmit={handleCreate} onClose={() => setShowModal(false)} />
      )}
      {editingList && (
        <ListModal
          title="Edit list"
          initialData={editingList}
          onSubmit={(data) => handleUpdate(editingList.id, data)}
          onClose={() => setEditingList(null)}
        />
      )}
    </div>
  );
}

function ListCard({ list, onClick, onEdit, onDelete }) {
  const count = parseInt(list.movie_count) || 0;
  const movies = list.movies || [];
  const date = formatShortDate(list.updated_at);

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#111120] border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-gray-600 transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Cover grid */}
      <div className="relative h-44 bg-[#1a1a2e] overflow-hidden">
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 h-full gap-0.5">
            {[...Array(Math.min(4, movies.length))].map((_, i) => {
              const movie = movies[i];
              const poster = movie?.poster_url ? `${TMDB_IMG}${movie.poster_url}` : null;
              return (
                <div key={i} className="overflow-hidden bg-[#0d0d14]">
                  {poster ? (
                    <img src={poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">🎬</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">🎬</span>
          </div>
        )}
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111120] via-transparent to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg text-gray-300 hover:text-white hover:bg-black/90 transition-colors"
          >
            <EditIcon />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg text-gray-300 hover:text-red-400 hover:bg-black/90 transition-colors"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-white text-sm truncate">{list.name}</p>
          <span className={`flex-shrink-0 ${list.is_public ? 'text-green-400' : 'text-gray-500'}`}>
            {list.is_public ? <GlobeIcon /> : <LockIcon />}
          </span>
        </div>
        {list.description && (
          <p className="text-gray-500 text-xs line-clamp-1 mb-2">{list.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">{count} film{count !== 1 ? 's' : ''}</span>
          {date && <span className="text-gray-600 text-xs">{date}</span>}
        </div>
      </div>
    </div>
  );
}

function ListModal({ title, initialData = {}, onSubmit, onClose }) {
  const [name, setName] = useState(initialData.name || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [isPublic, setIsPublic] = useState(initialData.is_public ?? false);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    onSubmit({ name, description, isPublic });
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111120] border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My horror favorites…"
              maxLength={100}
              className="w-full bg-[#0a0a1a] border border-gray-700 focus:border-[#D0021B] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5 font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
              rows={3}
              className="w-full bg-[#0a0a1a] border border-gray-700 focus:border-[#D0021B] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between bg-[#0a0a1a] border border-gray-700 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm text-white font-medium">Public list</p>
              <p className="text-xs text-gray-500">Visible to everyone</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-[#D0021B]' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded-xl py-2.5 text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-[#D0021B] hover:bg-[#b30218] text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
              {initialData.name ? 'Save changes' : 'Create list'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
