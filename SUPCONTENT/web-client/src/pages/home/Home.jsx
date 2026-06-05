import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const featuredMovies = [
  { title: "Dune", year: "2021", tone: "from-amber-600 to-stone-900" },
  { title: "Interstellar", year: "2014", tone: "from-sky-700 to-gray-950" },
  { title: "Parasite", year: "2019", tone: "from-emerald-700 to-gray-950" },
  { title: "Whiplash", year: "2014", tone: "from-red-700 to-zinc-950" },
];

const stats = [
  { value: "TMDB", label: "movie metadata" },
  { value: "OAuth", label: "Google login ready" },
  { value: "Profile", label: "avatar and settings" },
];

function PosterCard({ movie }) {
  return (
    <div className={`aspect-[2/3] rounded-2xl bg-gradient-to-br ${movie.tone} p-4 flex flex-col justify-between shadow-xl ring-1 ring-white/10`}>
      <div className="w-10 h-1.5 rounded-full bg-white/50" />
      <div>
        <p className="text-white text-lg font-bold leading-tight">{movie.title}</p>
        <p className="text-white/70 text-sm mt-1">{movie.year}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex flex-col gap-10">
      <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
        <div className="py-6">
          <p className="text-xs font-bold tracking-[0.22em] text-[#D0021B] mb-4">
            SUPMOVIES SOCIAL NETWORK
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-950 dark:text-white leading-tight max-w-3xl">
            Discover movies, manage your profile, and share your taste.
          </h1>
          <p className="mt-5 text-base text-gray-500 dark:text-gray-400 leading-7 max-w-2xl">
            SUPMOVIES connects movie discovery with user profiles, personal settings, reviews, lists, and community activity.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/discover"
              className="px-5 py-3 rounded-2xl bg-[#D0021B] hover:bg-[#b30218] text-white text-sm font-bold transition-colors"
            >
              Discover movies
            </Link>
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                My profile
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Create account
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-gray-950 p-5 sm:p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#D0021B]/30 blur-2xl" />
          <div className="relative grid grid-cols-4 gap-3">
            {featuredMovies.map((movie) => (
              <PosterCard key={movie.title} movie={movie} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5">
            <p className="text-2xl font-black text-gray-950 dark:text-white">{item.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </section>

      {isAuthenticated && (
        <section className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back</p>
          <h2 className="text-2xl font-black text-gray-950 dark:text-white mt-1">
            {user?.username || "Movie fan"}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/settings" className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-800 dark:text-gray-200">
              Settings
            </Link>
            <Link to="/discover" className="px-4 py-2.5 rounded-xl bg-[#D0021B] text-sm font-bold text-white">
              Search films
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
