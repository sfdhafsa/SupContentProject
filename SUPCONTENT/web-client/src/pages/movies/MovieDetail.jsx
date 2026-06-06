import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { moviesApi } from "../../services/api/movies.api";
import ReviewsSection from "./ReviewsSection.jsx";

const BackIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 20 20" className={`w-4 h-4 ${filled ? "text-yellow-400" : "text-gray-600"}`} fill="currentColor">
    <path d="M10 1l2.39 4.84L18 6.76l-4 3.9.94 5.5L10 13.77l-4.94 2.39.94-5.5-4-3.9 5.61-.92z" />
  </svg>
);
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Skeleton() {
  return (
    <div className="animate-pulse bg-gray-950 min-h-screen">
      <div className="h-[65vh] bg-gray-800 w-full" />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 -mt-40 sm:-mt-48 relative z-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
          <div className="w-56 aspect-[2/3] rounded-2xl bg-gray-700 flex-shrink-0" />
          <div className="flex-1 pt-0 sm:pt-32 space-y-4">
            <div className="h-8 w-2/3 bg-gray-700 rounded-xl" />
            <div className="h-4 w-1/3 bg-gray-700 rounded" />
            <div className="h-20 bg-gray-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cast Carousel — pleine largeur ──
function CastCarousel({ cast }) {
  const [index, setIndex] = useState(0);
  const visible    = 8;
  const canPrev    = index > 0;
  const canNext    = index + visible < cast.length;

  return (
    <div className="relative">
      {/* Arrow Left */}
      {canPrev && (
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 2))}
          className="absolute -left-4 top-1/2 -translate-y-8 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-[#D0021B] backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 shadow-xl"
        >
          <ChevronLeftIcon />
        </button>
      )}

      {/* Cards — pleine largeur */}
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4 px-0 sm:px-6">
        {cast.slice(index, index + visible).map((person) => (
          <div key={person.id} className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-700 mx-auto mb-2 ring-2 ring-white/10 hover:ring-[#D0021B] transition-all">
              {person.photo_url ? (
                <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-white truncate">{person.name}</p>
            <p className="text-xs text-gray-400 truncate">{person.character}</p>
          </div>
        ))}
      </div>

      {/* Arrow Right */}
      {canNext && (
        <button
          onClick={() => setIndex((i) => Math.min(cast.length - visible, i + 2))}
          className="absolute -right-4 top-1/2 -translate-y-8 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-[#D0021B] backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 shadow-xl"
        >
          <ChevronRightIcon />
        </button>
      )}

      {/* Dots indicator */}
      {cast.length > visible && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: Math.ceil(cast.length / visible) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i * visible)}
              className={`rounded-full transition-all ${
                Math.floor(index / visible) === i
                  ? "w-4 h-1.5 bg-[#D0021B]"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Crew Card ──
function CrewCard({ name, role }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D0021B] to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
        {role && <p className="text-xs text-gray-400 truncate">{role}</p>}
      </div>
    </div>
  );
}

// ── Similar Card ──
function SimilarCard({ movie, onClick }) {
  return (
    <div onClick={() => onClick(movie.tmdb_id)} className="flex-shrink-0 w-32 cursor-pointer group">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-700 mb-2 group-hover:ring-2 ring-[#D0021B] transition-all">
        {movie.poster_url ? (
          <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-white truncate">{movie.title}</p>
      {movie.vote_average > 0 && <p className="text-xs text-yellow-400">★ {movie.vote_average?.toFixed(1)}</p>}
    </div>
  );
}

// ── Trailer Modal ──
function TrailerModal({ trailer, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl mx-4 aspect-video rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <iframe src={`${trailer.embed}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
      </div>
      <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">✕</button>
    </div>
  );
}

const formatMoney = (n) => {
  if (!n || n === 0) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
};

export default function MovieDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [movie, setMovie]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [trailer, setTrailer]     = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setImgLoaded(false);
    window.scrollTo(0, 0);
    moviesApi.getById(id)
      .then((res) => setMovie(res.data.data))
      .catch(() => setError("Film introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-[#D0021B] text-white rounded-xl text-sm font-semibold">Retour</button>
        </div>
      </div>
    );
  }

  const year    = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const rating  = movie.vote_average ? parseFloat(movie.vote_average) : null;
  const stars   = rating ? Math.round(rating / 2) : 0;
  const budget  = formatMoney(movie.budget);
  const revenue = formatMoney(movie.revenue);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── HERO BACKDROP — pleine largeur, pas de container ── */}
      <div className="relative w-full h-[58vh] min-h-[420px] overflow-hidden sm:h-[65vh]">
        {movie.backdrop_url && (
          <img
            src={movie.backdrop_url}
            alt={movie.title}
            onLoad={() => setImgLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${imgLoaded ? "opacity-60" : "opacity-0"}`}
          />
        )}
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(208,2,27,0.4) 0%, rgba(80,0,80,0.3) 40%, transparent 70%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/70 via-transparent to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-3 sm:top-6 sm:left-6 flex items-center gap-2 px-3 py-2 sm:px-4 rounded-xl bg-black/40 backdrop-blur-sm text-white text-sm hover:bg-black/60 transition-all border border-white/10"
        >
          <BackIcon />
          Retour
        </button>
      </div>

      {/* ── CONTENT — container centré ── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 -mt-56 sm:-mt-48 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">

          {/* Poster avec glow */}
          <div className="flex-shrink-0 w-full md:w-56">
            <div className="relative mx-auto w-40 sm:w-48 md:w-full">
              <div
                className="absolute -inset-3 rounded-2xl opacity-50 blur-xl"
                style={{ background: "radial-gradient(ellipse, rgba(208,2,27,0.6) 0%, rgba(120,0,120,0.4) 50%, transparent 70%)" }}
              />
              <div className="relative rounded-2xl overflow-hidden aspect-[2/3] shadow-2xl ring-1 ring-white/10">
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">
                    <svg viewBox="0 0 48 48" fill="none" className="w-16 h-16">
                      <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-0 md:pt-24">
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {movie.genres.map((g) => (
                  <span key={g.id} className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/10">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 leading-tight">{movie.title}</h1>

            {movie.tagline && (
              <p className="text-base sm:text-lg text-gray-400 italic mb-4">"{movie.tagline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-5 text-sm text-gray-400">
              {year && <span>{year}</span>}
              {movie.runtime_minutes && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center gap-1"><ClockIcon />{Math.floor(movie.runtime_minutes / 60)}h {movie.runtime_minutes % 60}min</span>
                </>
              )}
              {movie.original_language && (
                <><span className="text-gray-600">•</span><span className="uppercase">{movie.original_language}</span></>
              )}
              {movie.status && (
                <><span className="text-gray-600">•</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/40 text-green-400 border border-green-800">{movie.status}</span></>
              )}
            </div>

            {rating && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <StarIcon key={i} filled={i < stars} />)}
                </div>
                <span className="text-2xl font-bold text-white">{rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">/ 10</span>
                {movie.vote_count && <span className="text-gray-500 text-xs">({movie.vote_count?.toLocaleString()} votes)</span>}
              </div>
            )}

            {movie.overview && (
              <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl text-sm md:text-base">{movie.overview}</p>
            )}

            {(budget || revenue) && (
              <div className="flex flex-wrap gap-6 mb-6">
                {budget && <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Budget</p><p className="text-sm font-semibold text-white">{budget}</p></div>}
                {revenue && <div><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Revenus</p><p className="text-sm font-semibold text-green-400">{revenue}</p></div>}
              </div>
            )}

            {movie.directors?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{movie.directors.length > 1 ? "Réalisateurs" : "Réalisateur"}</p>
                <div className="flex flex-wrap gap-2">
                  {movie.directors.map((d) => <CrewCard key={d.id} name={d.name} />)}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {movie.trailer && (
                <button onClick={() => setTrailer(true)} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg">
                  <PlayIcon />Bande-annonce
                </button>
              )}
              <button
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D0021B] hover:bg-[#b30218] text-white text-sm font-semibold rounded-xl transition-all"
                onClick={() => {/* personne 3 branchera ici */}}
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Ajouter à ma bibliothèque
              </button>
              <button onClick={() => navigate("/discover")} className="px-6 py-2.5 border border-white/20 text-sm font-semibold text-gray-300 rounded-xl hover:bg-white/10 transition-all">
                ← Recherche
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CASTING — pleine largeur ── */}
      {movie.cast?.length > 0 && (
        <div className="mt-12 w-full">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 mb-4">
            <h2 className="text-lg font-bold text-white">Casting</h2>
          </div>
          <div className="max-w-screen-xl mx-auto relative px-4 sm:px-8">
            <CastCarousel cast={movie.cast} />
          </div>
        </div>
      )}

      {/* ── ÉQUIPE ── */}
      {(movie.writers?.length > 0 || movie.producers?.length > 0) && (
        <div className="mt-10 max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {movie.writers?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Scénariste(s)</p>
                <div className="flex flex-col gap-2">
                  {movie.writers.map((w) => <CrewCard key={w.id} name={w.name} role={w.job} />)}
                </div>
              </div>
            )}
            {movie.producers?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Producteur(s)</p>
                <div className="flex flex-col gap-2">
                  {movie.producers.map((p) => <CrewCard key={p.id} name={p.name} role="Producteur" />)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FILMS SIMILAIRES ── */}
      {movie.similar?.length > 0 && (
        <div className="mt-12 mb-12 max-w-screen-xl mx-auto px-4 sm:px-6">
          <h2 className="text-lg font-bold text-white mb-4">Films similaires</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {movie.similar.map((m) => (
              <SimilarCard key={m.tmdb_id} movie={m} onClick={(tmdbId) => navigate(`/movies/${tmdbId}`)} />
            ))}
          </div>
        </div>
      )}

      <ReviewsSection tmdbId={id} />

      {trailer && movie.trailer && (
        <TrailerModal trailer={movie.trailer} onClose={() => setTrailer(false)} />
      )}
    </div>
  );
}
