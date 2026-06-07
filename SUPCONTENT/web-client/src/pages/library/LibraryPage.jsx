import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

const FILTERS = [
  { key: 'TO_WATCH',    label: 'To Watch' },
  { key: 'IN_PROGRESS', label: 'Watching' },
  { key: 'COMPLETED',  label: 'Watched' },
  { key: 'DROPPED',    label: 'Abandoned' },
];

const SORT_OPTIONS = ['Date Added', 'Title', 'Rating'];

const BookmarkFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-400">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function LibraryPage() {
  const { user: _user } = useAuth();
  const { getLibrary, getStats, removeEntry, loading } = useLibrary();
  const [activeFilter, setActiveFilter] = useState(null);
  const [library, setLibrary] = useState([]);
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState('Date Added');
  const [showSort, setShowSort] = useState(false);

  async function fetchLibrary() {
    try {
      const res = await getLibrary(activeFilter);
      setLibrary(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function fetchStats() {
    try {
      const res = await getStats();
      setStats(res.data);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    fetchLibrary();
    fetchStats();
  }, [activeFilter]);

  async function handleRemove(movieId) {
    try {
      await removeEntry(movieId);
      fetchLibrary();
      fetchStats();
    } catch (err) { console.error(err); }
  }

  const getCount = (key) => stats?.counts?.[key] ?? 0;

  const sorted = [...library].sort((a, b) => {
    if (sortBy === 'Title') return a.title.localeCompare(b.title);
    if (sortBy === 'Rating') return (b.vote_average || 0) - (a.vote_average || 0);
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white px-6 py-8 max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Library</h1>
        <p className="text-gray-400 text-sm">Organize and track all your movies in one place</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(activeFilter === f.key ? null : f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activeFilter === f.key
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-400'
            }`}
          >
            {f.label}
            <span className={`ml-2 ${activeFilter === f.key ? 'text-black' : 'text-gray-500'}`}>
              ({getCount(f.key)})
            </span>
          </button>
        ))}
      </div>

      {library.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm">
            <span className="text-white font-semibold">{library.length}</span> movie{library.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white transition-colors">
              <FilterIcon />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-2 bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 hover:border-gray-500 transition-all"
              >
                {sortBy} <ChevronIcon />
              </button>
              {showSort && (
                <div className="absolute right-0 top-[calc(100%+4px)] bg-[#1a1a2e] border border-gray-700 rounded-lg overflow-hidden z-10 min-w-[140px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSort(false); }}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === opt ? 'text-white bg-[#2a2a4a]' : 'text-gray-400 hover:bg-[#2a2a3e] hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-[#1a1a2e] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="text-5xl mb-4">🎬</span>
          <p className="text-white font-semibold text-lg mb-2">No films here yet</p>
          <p className="text-gray-500 text-sm mb-6">
            {activeFilter ? 'No films in this category' : 'Start adding films to your library'}
          </p>
          <Link
            to="/discover"
            className="bg-[#D0021B] hover:bg-[#b30218] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Discover films
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((entry) => (
            <MovieCard key={entry.id} entry={entry} onRemove={() => handleRemove(entry.movie_id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MovieCard({ entry, onRemove }) {
  const [bookmarked, setBookmarked] = useState(true);
  const poster = entry.poster_url ? `${TMDB_IMG}${entry.poster_url}` : null;
  const year = entry.release_date ? entry.release_date.slice(0, 4) : '';
  const rating = entry.vote_average ? parseFloat(entry.vote_average).toFixed(1) : null;

  return (
    <div className="group relative rounded-xl overflow-hidden bg-[#1a1a2e] aspect-[2/3] cursor-pointer">
      <Link to={`/movies/${entry.external_id}`}>
        {poster ? (
          <img
            src={poster}
            alt={entry.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
            <span className="text-4xl">🎬</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {rating && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
          <StarIcon />
          <span className="text-xs font-bold text-white">{rating}</span>
        </div>
      )}

      <button
        onClick={(e) => { e.preventDefault(); setBookmarked(!bookmarked); if (bookmarked) onRemove(); }}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[#D0021B] rounded-lg text-white hover:bg-[#b30218] transition-colors"
      >
        {bookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-xs font-semibold truncate">{entry.title}</p>
        {year && <p className="text-gray-400 text-xs">{year}</p>}
      </div>
    </div>
  );
}