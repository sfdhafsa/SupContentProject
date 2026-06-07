import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { moviesApi } from "../../services/api/movies.api";
import api from "../../services/api/axios";
import { useAuth } from "../../context/AuthContext";

const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-gray-400 flex-shrink-0">
    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" className={`w-3 h-3 ${filled ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor">
    <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77l-4.94 2.39.94-5.5-4-3.9 5.61-.92z" />
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 20 20" fill="none" className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
    <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3">
    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const SortIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M3 5h14M5 10h10M7 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SORT_OPTIONS = [
  { value: "popularity.desc",           label: "Popularité" },
  { value: "vote_average.desc",         label: "Mieux notés" },
  { value: "primary_release_date.desc", label: "Plus récents" },
  { value: "primary_release_date.asc",  label: "Plus anciens" },
  { value: "revenue.desc",              label: "Box-office" },
];
const YEAR_RANGES = [
  { label: "2020 — Aujourd'hui", min: 2020, max: 2025 },
  { label: "2010 — 2019",        min: 2010, max: 2019 },
  { label: "2000 — 2009",        min: 2000, max: 2009 },
  { label: "1990 — 1999",        min: 1990, max: 1999 },
  { label: "Avant 1990",         min: 1900, max: 1989 },
];
const RATING_OPTIONS = [
  { label: "★ 9+", value: 9 },
  { label: "★ 8+", value: 8 },
  { label: "★ 7+", value: 7 },
  { label: "★ 6+", value: 6 },
];

function MovieCard({ movie, onClick }) {
  return (
    <div
      onClick={() => onClick(movie.tmdb_id)}
      className="cursor-pointer group rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[#D0021B] hover:shadow-xl transition-all duration-200"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
              <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <p className="text-white text-xs leading-relaxed line-clamp-3">{movie.overview}</p>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{movie.title}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {movie.release_date ? movie.release_date.slice(0, 4) : "—"}
          </span>
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1">
              <StarIcon filled />
              <span className="text-xs text-gray-500 dark:text-gray-400">{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#D0021B]/10 text-[#D0021B] border border-[#D0021B]/20">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity"><CloseIcon /></button>
    </span>
  );
}

// ── Hero Carousel — sans sortir du container ──
function HeroCarousel({ movies, onMovieClick, onAddToLibrary }) {
  const [current, setCurrent]   = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const heroMovies = movies.slice(0, 6);

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((i) => (i + 1) % heroMovies.length);
      setImgLoaded(false);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  if (heroMovies.length === 0) return null;
  const movie = heroMovies[current];

  return (
    <div className="relative w-full h-[50vh] min-h-[380px] rounded-3xl overflow-hidden mb-8 group">
      {movie.backdrop_url && (
        <img
          key={movie.tmdb_id}
          src={movie.backdrop_url}
          alt={movie.title}
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="max-w-2xl">
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} filled={i < Math.round(movie.vote_average / 2)} />
                ))}
              </div>
              <span className="text-white text-sm font-semibold">{movie.vote_average.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">/ 10</span>
            </div>
          )}
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-1 leading-tight">{movie.title}</h2>
          {movie.release_date && (
            <p className="text-gray-300 text-sm mb-2">{movie.release_date.slice(0, 4)}</p>
          )}
          {movie.overview && (
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 max-w-lg">{movie.overview}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => onMovieClick(movie.tmdb_id)}
              className="flex items-center gap-2 px-5 py-2 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all"
            >
              <PlayIcon />Voir le film
            </button>
            <button
              onClick={() => onAddToLibrary(movie)}
              className="px-5 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/20"
            >
              <span className="text-sm">+ Ma bibliotheque</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 right-6 flex gap-1.5">
        {heroMovies.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setImgLoaded(false); }}
            className={`rounded-full transition-all ${i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => { setCurrent((i) => (i - 1 + heroMovies.length) % heroMovies.length); setImgLoaded(false); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeftIcon />
      </button>
      <button
        onClick={() => { setCurrent((i) => (i + 1) % heroMovies.length); setImgLoaded(false); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}

// ── Movie Section avec flèches ──
function MovieSection({ title, movies, onMovieClick, loading }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-[#D0021B] hover:text-[#D0021B] transition-all"
          >
            <ChevronLeftIcon />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-[#D0021B] hover:text-[#D0021B] transition-all"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 animate-pulse">
              <div className="aspect-[2/3] rounded-xl bg-gray-200 dark:bg-gray-700 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
          {movies.map((movie) => (
            <div
              key={movie.tmdb_id}
              className="flex-shrink-0 w-32 cursor-pointer group"
              onClick={() => onMovieClick(movie.tmdb_id)}
            >
              <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-2 group-hover:ring-2 ring-[#D0021B] transition-all">
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{movie.title}</p>
              {movie.vote_average > 0 && (
                <p className="text-xs text-yellow-500">★ {movie.vote_average.toFixed(1)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Genre Pills ──
function GenrePills({ genres, selectedIds, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {genres.map((g) => {
        const isSelected = selectedIds.includes(String(g.id));
        return (
          <button
            key={g.id}
            onClick={() => onToggle(String(g.id))}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? "bg-[#D0021B] text-white shadow-lg shadow-red-500/20"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {g.name}
          </button>
        );
      })}
    </div>
  );
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate  = useNavigate();
  const { isAuthenticated } = useAuth();
  const filterRef = useRef(null);

  const [query, setQuery]         = useState(searchParams.get("q") || "");
  const [genreIds, setGenreIds]   = useState([]);
  const [minRating, setMinRating] = useState("");
  const [yearRange, setYearRange] = useState(null);
  const [sortBy, setSortBy]       = useState("popularity.desc");
  const [page, setPage]           = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [movies, setMovies]             = useState([]);
  const [genres, setGenres]             = useState([]);
  const [trending, setTrending]         = useState([]);
  const [topRated, setTopRated]         = useState([]);
  const [nowPlaying, setNowPlaying]     = useState([]);
  const [totalPages, setTotal]          = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading]           = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [error, setError]               = useState(null);

  const activeFiltersCount = [genreIds.length > 0 ? 1 : null, yearRange, minRating].filter(Boolean).length;
  const selectedSort       = SORT_OPTIONS.find((s) => s.value === sortBy);

  useEffect(() => {
    moviesApi.getGenres()
      .then((res) => setGenres(res.data.data))
      .catch(() => {});

    setSectionsLoading(true);
    Promise.all([
      moviesApi.getTrending("week"),
      moviesApi.getTopRated(),
      moviesApi.getNowPlaying(),
    ]).then(([trendRes, topRes, nowRes]) => {
      setTrending(trendRes.data.data.results   || []);
      setTopRated(topRes.data.data.results     || []);
      setNowPlaying(nowRes.data.data.results   || []);
    }).catch(() => {})
      .finally(() => setSectionsLoading(false));
  }, []);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (query.trim()) {
        res = await moviesApi.search(query, page, undefined, genreIds[0] || undefined);
      } else {
        res = await moviesApi.discover({
          page,
          genre_ids:  genreIds.length > 0 ? genreIds : undefined,
          year_min:   yearRange?.min,
          year_max:   yearRange?.max,
          min_rating: minRating || undefined,
          sort_by:    sortBy,
        });
      }
      setMovies(res.data.data.results);
      setTotal(res.data.data.total_pages);
      setTotalResults(res.data.data.total_results || 0);
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [query, page, genreIds, minRating, yearRange, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtering = !!(query.trim() || genreIds.length > 0 || yearRange || minRating);
      setIsSearchMode(filtering);
      if (filtering) { setPage(1); loadMovies(); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const filtering = !!(query.trim() || genreIds.length > 0 || yearRange || minRating);
    setIsSearchMode(filtering);
    if (filtering) loadMovies();
  }, [page, genreIds, minRating, yearRange, sortBy]);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMovieClick = (tmdbId) => navigate(`/movies/${tmdbId}`);

  const handleAddToLibrary = async (movie) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    await api.post("/library", {
      tmdb_id: movie.tmdb_id,
      status: "TO_WATCH",
    });
  };

  const toggleGenre = (id) => {
    setGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
    setPage(1);
  };

  const resetAllFilters = () => {
    setGenreIds([]);
    setYearRange(null);
    setMinRating("");
    setSortBy("popularity.desc");
    setQuery("");
    setPage(1);
    setIsSearchMode(false);
  };

  const getTitle = () => {
    if (query.trim()) return `Résultats pour "${query}"`;
    if (genreIds.length > 0) {
      const names = genreIds.map((id) => genres.find((g) => String(g.id) === id)?.name).filter(Boolean);
      return `Films — ${names.join(", ")}`;
    }
    if (yearRange) return `Films — ${yearRange.label}`;
    return "Découvrir des films";
  };

  return (
    <div className="max-w-screen-xl mx-auto px-0 sm:px-6">

      {/* Hero — seulement en mode découverte */}
      {!isSearchMode && trending.length > 0 && (
        <HeroCarousel
          movies={trending}
          onMovieClick={handleMovieClick}
          onAddToLibrary={handleAddToLibrary}
        />
      )}

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Rechercher un film..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:border-[#D0021B] focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20 transition-all"
          />
          {query && (
            <button onClick={() => { setQuery(""); setPage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <CloseIcon />
            </button>
          )}
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${
              filtersOpen || activeFiltersCount > 0
                ? "border-[#D0021B] bg-[#D0021B]/5 text-[#D0021B] dark:bg-[#D0021B]/10"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <FilterIcon />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#D0021B] text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronIcon open={filtersOpen} />
          </button>

          {filtersOpen && (
            <div className="fixed inset-x-3 top-24 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-30 overflow-hidden sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-80">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Filtres & Tri</span>
                {activeFiltersCount > 0 && (
                  <button onClick={resetAllFilters} className="text-xs text-[#D0021B] hover:underline font-medium">Tout effacer</button>
                )}
              </div>

              <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Tri */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <SortIcon />Trier par
                  </p>
                  <div className="flex flex-col gap-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setPage(1); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                          sortBy === opt.value
                            ? "bg-[#D0021B]/10 text-[#D0021B] font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {opt.label}
                        {sortBy === opt.value && (
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Genres multi-sélection */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Genres <span className="normal-case font-normal">(multi-sélection)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((g) => {
                      const isSelected = genreIds.includes(String(g.id));
                      return (
                        <button
                          key={g.id}
                          onClick={() => toggleGenre(String(g.id))}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-[#D0021B] text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {isSelected && "✓ "}{g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Période */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Période</p>
                  <div className="flex flex-col gap-1">
                    {YEAR_RANGES.map((range) => (
                      <button
                        key={range.label}
                        onClick={() => { setYearRange(yearRange?.label === range.label ? null : range); setPage(1); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                          yearRange?.label === range.label
                            ? "bg-[#D0021B]/10 text-[#D0021B] font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {range.label}
                        {yearRange?.label === range.label && (
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Note */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Note minimum</p>
                  <div className="flex gap-2">
                    {RATING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setMinRating(minRating === opt.value ? "" : opt.value); setPage(1); }}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          minRating === opt.value
                            ? "bg-yellow-400 text-gray-900"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full py-2.5 bg-[#D0021B] hover:bg-[#b30218] text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filter tags */}
      {(activeFiltersCount > 0 || sortBy !== "popularity.desc") && (
        <div className="flex flex-wrap gap-2 mb-6">
          {genreIds.map((id) => {
            const genre = genres.find((g) => String(g.id) === id);
            return genre ? <FilterTag key={id} label={genre.name} onRemove={() => toggleGenre(id)} /> : null;
          })}
          {yearRange && <FilterTag label={yearRange.label} onRemove={() => { setYearRange(null); setPage(1); }} />}
          {minRating && <FilterTag label={`Note ≥ ${minRating}`} onRemove={() => { setMinRating(""); setPage(1); }} />}
          {sortBy !== "popularity.desc" && <FilterTag label={selectedSort?.label} onRemove={() => { setSortBy("popularity.desc"); setPage(1); }} />}
        </div>
      )}

      {/* ── MODE FILTRE ── */}
      {isSearchMode && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{getTitle()}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {loading ? "Chargement..." : totalResults > 0 ? `${totalResults.toLocaleString()} films` : `${movies.length} film(s)`}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((movie) => (
              <MovieCard key={movie.tmdb_id} movie={movie} onClick={handleMovieClick} />
            ))}
      </div>

          {!loading && movies.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun film trouvé</p>
              <button onClick={resetAllFilters} className="mt-4 px-4 py-2 rounded-xl text-sm text-[#D0021B] border border-[#D0021B] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                Effacer les filtres
              </button>
            </div>
          )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3 mt-10 mb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Précédent
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    p === page
                      ? "bg-[#D0021B] text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Suivant →
          </button>
        </div>
      )}
        </>
      )}

      {!isSearchMode && (
        <>
          <GenrePills genres={genres} selectedIds={genreIds} onToggle={toggleGenre} />
          <MovieSection title="Tendances" movies={trending} onMovieClick={handleMovieClick} loading={sectionsLoading} />
          <MovieSection title="Mieux notes" movies={topRated} onMovieClick={handleMovieClick} loading={sectionsLoading} />
          <MovieSection title="Au cinema" movies={nowPlaying} onMovieClick={handleMovieClick} loading={sectionsLoading} />
        </>
      )}
    </div>
  );
}
