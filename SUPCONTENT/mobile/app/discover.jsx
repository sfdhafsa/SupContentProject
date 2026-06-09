import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import {
  discoverMovies,
  getGenres,
  getNowPlaying,
  getTopRated,
  getTrending,
  searchMovies,
} from '../src/services/moviesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH  = (SCREEN_WIDTH - 48) / 3;
const HERO_HEIGHT = 220;

// ── Colors ──
const C = {
  red:        '#ef0d1a',
  white:      '#ffffff',
  black:      '#111827',
  gray50:     '#f9fafb',
  gray100:    '#f3f4f6',
  gray200:    '#e5e7eb',
  gray400:    '#9ca3af',
  gray500:    '#6b7280',
  gray700:    '#374151',
  gray800:    '#1f2937',
  gray900:    '#111827',
  yellow:     '#f59e0b',
  bg:         '#f3f4f6',
};

// ── Star Rating ──
function Stars({ rating, size = 10 }) {
  const stars = Math.round((rating / 10) * 5);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < stars ? C.yellow : C.gray200 }}>★</Text>
      ))}
    </View>
  );

}

// ── Movie Card (grille) ──
function MovieCard({ movie, onPress }) {
  return (
    <Pressable onPress={() => onPress(movie.tmdb_id)} style={styles.card}>
      <View style={styles.cardPoster}>
        {movie.poster_url ? (
          <Image source={{ uri: movie.poster_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardNoImage}>
            <Text style={{ color: C.gray400, fontSize: 24 }}>🎬</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={styles.cardYear}>{movie.release_date?.slice(0, 4) || '—'}</Text>
        {movie.vote_average > 0 && (
          <Text style={styles.cardRating}>★ {movie.vote_average.toFixed(1)}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Movie Card Skeleton ──
function SkeletonCard() {
  return (
    <View style={[styles.card, { opacity: 0.5 }]}>
      <View style={[styles.cardPoster, { backgroundColor: C.gray200 }]} />
      <View style={{ height: 10, backgroundColor: C.gray200, borderRadius: 4, marginTop: 6, width: '80%' }} />
      <View style={{ height: 8, backgroundColor: C.gray200, borderRadius: 4, marginTop: 4, width: '50%' }} />
    </View>
  );
}

// ── Horizontal Movie Row ──
function MovieRow({ title, movies, onPress, loading }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : movies.map((movie) => (
              <Pressable key={movie.tmdb_id} onPress={() => onPress(movie.tmdb_id)} style={styles.rowCard}>
                <View style={styles.rowCardPoster}>
                  {movie.poster_url ? (
                    <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={[styles.rowCardPoster, { backgroundColor: C.gray200, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 20 }}>🎬</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rowCardTitle} numberOfLines={2}>{movie.title}</Text>
                {movie.vote_average > 0 && (
                  <Text style={styles.rowCardRating}>★ {movie.vote_average.toFixed(1)}</Text>
                )}
              </Pressable>
            ))
        }
      </ScrollView>
    </View>
  );
}

// ── Hero Carousel ──
function HeroCarousel({ movies, onPress }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      const next = (current + 1) % Math.min(movies.length, 5);
      setCurrent(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [current, movies.length]);

  if (movies.length === 0) return null;

  return (
    <View style={styles.hero}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrent(idx);
        }}
      >
        {movies.slice(0, 5).map((movie, i) => (
          <Pressable key={movie.tmdb_id} onPress={() => onPress(movie.tmdb_id)} style={styles.heroSlide}>
            {movie.backdrop_url ? (
              <Image source={{ uri: movie.backdrop_url }} style={styles.heroImage} resizeMode="cover" />
            ) : movie.poster_url ? (
              <Image source={{ uri: movie.poster_url }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, { backgroundColor: C.gray800 }]} />
            )}
            {/* Gradient overlay */}
            <View style={styles.heroOverlay} />
            {/* Content */}
            <View style={styles.heroContent}>
              {movie.vote_average > 0 && <Stars rating={movie.vote_average} size={12} />}
              <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>
              {movie.release_date && (
                <Text style={styles.heroYear}>{movie.release_date.slice(0, 4)}</Text>
              )}
              <Pressable onPress={() => onPress(movie.tmdb_id)} style={styles.heroButton}>
                <Text style={styles.heroButtonText}>▶  Voir le film</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.heroDots}>
        {movies.slice(0, 5).map((_, i) => (
          <View key={i} style={[styles.heroDot, i === current && styles.heroDotActive]} />
        ))}
      </View>
    </View>
  );
}

// ── Genre Pills ──
function GenrePills({ genres, selectedIds, onToggle }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genrePills}>
      {genres.map((g) => {
        const isSelected = selectedIds.includes(String(g.id));
        return (
          <Pressable
            key={g.id}
            onPress={() => onToggle(String(g.id))}
            style={[styles.genrePill, isSelected && styles.genrePillActive]}
          >
            <Text style={[styles.genrePillText, isSelected && styles.genrePillTextActive]}>
              {g.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Search Result Item ──
function SearchResultItem({ item, onPress }) {
  // Film
  if (item.type === 'movie') {
    return (
      <Pressable onPress={() => onPress(item.tmdb_id)} style={styles.searchItem}>
        <View style={styles.searchItemPoster}>
          {item.poster_url ? (
            <Image source={{ uri: item.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={[styles.searchItemPoster, { backgroundColor: C.gray200, alignItems: 'center', justifyContent: 'center' }]}>
              <Text>🎬</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.searchItemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.searchItemSub}>{item.release_date?.slice(0, 4) || '—'}</Text>
          {item.vote_average > 0 && (
            <Text style={styles.searchItemRating}>★ {item.vote_average.toFixed(1)}</Text>
          )}
        </View>
        <Text style={{ color: C.gray400, fontSize: 16 }}>›</Text>
      </Pressable>
    );
  }

  // User
  if (item.type === 'user') {
    return (
      <Pressable style={styles.searchItem}>
        <View style={styles.searchItemAvatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
          ) : (
            <Text style={{ color: C.white, fontWeight: '800', fontSize: 14 }}>
              {item.username?.slice(0, 1).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.searchItemTitle}>@{item.username}</Text>
          {item.bio && <Text style={styles.searchItemSub} numberOfLines={1}>{item.bio}</Text>}
        </View>
        <Text style={{ color: C.gray400, fontSize: 16 }}>›</Text>
      </Pressable>
    );
  }

  // List
  if (item.type === 'list') {
    return (
      <Pressable style={styles.searchItem}>
        <View style={[styles.searchItemAvatar, { backgroundColor: '#7c3aed' }]}>
          <Text style={{ color: C.white, fontSize: 16 }}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.searchItemTitle}>{item.name}</Text>
          <Text style={styles.searchItemSub}>{item.movie_count || 0} films</Text>
        </View>
        <Text style={{ color: C.gray400, fontSize: 16 }}>›</Text>
      </Pressable>
    );
  }

  return null;
}

// ── Filter Modal ──
function FilterModal({ visible, genres, genreIds, yearRange, minRating, sortBy, onToggleGenre, onYearRange, onRating, onSort, onApply, onReset }) {
  const YEAR_RANGES = [
    { label: '2020 — Aujourd\'hui', min: 2020, max: 2025 },
    { label: '2010 — 2019',         min: 2010, max: 2019 },
    { label: '2000 — 2009',         min: 2000, max: 2009 },
    { label: '1990 — 1999',         min: 1990, max: 1999 },
    { label: 'Avant 1990',          min: 1900, max: 1989 },
  ];
  const SORT_OPTIONS = [
    { value: 'popularity.desc',           label: 'Popularité' },
    { value: 'vote_average.desc',         label: 'Mieux notés' },
    { value: 'primary_release_date.desc', label: 'Plus récents' },
    { value: 'primary_release_date.asc',  label: 'Plus anciens' },
  ];
  const RATING_OPTIONS = [
    { label: '★ 9+', value: 9 },
    { label: '★ 8+', value: 8 },
    { label: '★ 7+', value: 7 },
    { label: '★ 6+', value: 6 },
  ];

  if (!visible) return null;

  return (
    <View style={styles.filterModal}>
      <View style={styles.filterModalHeader}>
        <Text style={styles.filterModalTitle}>Filtres & Tri</Text>
        <Pressable onPress={onReset}>
          <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>Effacer</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

        {/* Tri */}
        <Text style={styles.filterSection}>TRIER PAR</Text>
        <View style={{ gap: 4 }}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onSort(opt.value)}
              style={[styles.filterOption, sortBy === opt.value && styles.filterOptionActive]}
            >
              <Text style={[styles.filterOptionText, sortBy === opt.value && styles.filterOptionTextActive]}>
                {opt.label}
              </Text>
              {sortBy === opt.value && <Text style={{ color: C.red }}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* Genres */}
        <Text style={[styles.filterSection, { marginTop: 16 }]}>GENRES (multi)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {genres.map((g) => {
            const isSelected = genreIds.includes(String(g.id));
            return (
              <Pressable
                key={g.id}
                onPress={() => onToggleGenre(String(g.id))}
                style={[styles.genrePill, isSelected && styles.genrePillActive]}
              >
                <Text style={[styles.genrePillText, isSelected && styles.genrePillTextActive]}>
                  {isSelected ? '✓ ' : ''}{g.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Période */}
        <Text style={[styles.filterSection, { marginTop: 16 }]}>PÉRIODE</Text>
        <View style={{ gap: 4 }}>
          {YEAR_RANGES.map((range) => (
            <Pressable
              key={range.label}
              onPress={() => onYearRange(yearRange?.label === range.label ? null : range)}
              style={[styles.filterOption, yearRange?.label === range.label && styles.filterOptionActive]}
            >
              <Text style={[styles.filterOptionText, yearRange?.label === range.label && styles.filterOptionTextActive]}>
                {range.label}
              </Text>
              {yearRange?.label === range.label && <Text style={{ color: C.red }}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* Note */}
        <Text style={[styles.filterSection, { marginTop: 16 }]}>NOTE MINIMUM</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {RATING_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => onRating(minRating === opt.value ? '' : opt.value)}
              style={[styles.ratingButton, minRating === opt.value && styles.ratingButtonActive]}
            >
              <Text style={[styles.ratingButtonText, minRating === opt.value && styles.ratingButtonTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Pressable onPress={onApply} style={styles.filterApply}>
        <Text style={styles.filterApplyText}>Appliquer</Text>
      </Pressable>
    </View>
  );
}

// ── Main Page ──
export default function Discover() {
  const router = useRouter();

  // Search
  const [query, setQuery]           = useState('');
  const [searchResults, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearching, setIsSearching]     = useState(false);

  // Filters
  const [genreIds, setGenreIds]     = useState([]);
  const [yearRange, setYearRange]   = useState(null);
  const [minRating, setMinRating]   = useState('');
  const [sortBy, setSortBy]         = useState('popularity.desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Data
  const [genres, setGenres]         = useState([]);
  const [trending, setTrending]     = useState([]);
  const [topRated, setTopRated]     = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [filterLoading, setFilterLoading]     = useState(false);

  const debounceRef = useRef(null);

  // Load initial data
  useEffect(() => {
    getGenres().then(setGenres).catch(() => {});
    setSectionsLoading(true);
    Promise.all([getTrending(), getTopRated(), getNowPlaying()])
      .then(([t, top, now]) => {
        setTrending(t.results || []);
        setTopRated(top.results || []);
        setNowPlaying(now.results || []);
      })
      .catch(() => {})
      .finally(() => setSectionsLoading(false));
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setIsSearching(false);
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const [moviesRes] = await Promise.all([
          searchMovies({ query }),
        ]);

        const movieItems = (moviesRes.results || []).slice(0, 8).map((m) => ({
          ...m,
          type: 'movie',
        }));

        setResults(movieItems);
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [query]);

  // Load filtered movies
  const loadFiltered = useCallback(async () => {
    setFilterLoading(true);
    try {
      const res = await discoverMovies({
        genre_ids:  genreIds.length > 0 ? genreIds : undefined,
        year_min:   yearRange?.min,
        year_max:   yearRange?.max,
        min_rating: minRating || undefined,
        sort_by:    sortBy,
      });
      setFiltered(res.results || []);
    } catch {
      setFiltered([]);
    } finally {
      setFilterLoading(false);
    }
  }, [genreIds, yearRange, minRating, sortBy]);

  // Trigger filter when active
  useEffect(() => {
    const active = genreIds.length > 0 || yearRange || minRating;
    setIsFiltering(!!active);
    if (active) loadFiltered();
  }, [genreIds, yearRange, minRating, sortBy]);

  const handleMoviePress = (tmdbId) => router.push(`/movie/${tmdbId}`);

  const toggleGenre = (id) => {
    setGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const resetFilters = () => {
    setGenreIds([]);
    setYearRange(null);
    setMinRating('');
    setSortBy('popularity.desc');
  };

  const activeFiltersCount = [genreIds.length > 0 ? 1 : null, yearRange, minRating].filter(Boolean).length;

  return (
    <View style={styles.page}>
      <TopNavbar username="User" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* ── HERO ── */}
        {!isSearching && !isFiltering && trending.length > 0 && (
          <HeroCarousel movies={trending} onPress={handleMoviePress} />
        )}

        {/* ── SEARCH BAR ── */}
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <Text style={styles.searchIconText}>🔍</Text>
            <TextInput
              style={styles.searchField}
              placeholder="Rechercher films, utilisateurs, listes..."
              placeholderTextColor={C.gray400}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Text style={{ color: C.gray400, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Filter button */}
          <Pressable
            onPress={() => setFilterOpen((o) => !o)}
            style={[styles.filterButton, (filterOpen || activeFiltersCount > 0) && styles.filterButtonActive]}
          >
            <Text style={{ fontSize: 14 }}>⚙</Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── FILTER MODAL ── */}
        <FilterModal
          visible={filterOpen}
          genres={genres}
          genreIds={genreIds}
          yearRange={yearRange}
          minRating={minRating}
          sortBy={sortBy}
          onToggleGenre={toggleGenre}
          onYearRange={setYearRange}
          onRating={setMinRating}
          onSort={setSortBy}
          onApply={() => setFilterOpen(false)}
          onReset={resetFilters}
        />

        {/* ── SEARCH RESULTS ── */}
        {isSearching && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>
              {searchLoading ? 'Recherche...' : `${searchResults.length} résultat(s)`}
            </Text>
            {searchLoading ? (
              <ActivityIndicator color={C.red} style={{ marginTop: 20 }} />
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucun résultat pour "{query}"</Text>
              </View>
            ) : (
              searchResults.map((item, i) => (
                <SearchResultItem key={i} item={item} onPress={handleMoviePress} />
              ))
            )}
          </View>
        )}

        {/* ── FILTERED RESULTS ── */}
        {!isSearching && isFiltering && (
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>
                {filterLoading ? 'Chargement...' : `${filtered.length} film(s)`}
              </Text>
              <Pressable onPress={resetFilters}>
                <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>Effacer filtres</Text>
              </Pressable>
            </View>
            {filterLoading ? (
              <View style={styles.gridRow}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </View>
            ) : (
              <View style={styles.gridRow}>
                {filtered.map((movie) => (
                  <MovieCard key={movie.tmdb_id} movie={movie} onPress={handleMoviePress} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── DISCOVER MODE ── */}
        {!isSearching && !isFiltering && (
          <>
            {/* Genre pills */}
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 10 }]}>
                Parcourir par genre
              </Text>
              <GenrePills genres={genres} selectedIds={genreIds} onToggle={toggleGenre} />
            </View>

            {/* Sections */}
            <MovieRow title="🔥 Tendances" movies={trending}   onPress={handleMoviePress} loading={sectionsLoading} />
            <MovieRow title="⭐ Mieux notés" movies={topRated}   onPress={handleMoviePress} loading={sectionsLoading} />
            <MovieRow title="🎬 Au cinéma"   movies={nowPlaying} onPress={handleMoviePress} loading={sectionsLoading} />
          </>
        )}

      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },

  // Hero
  hero: {
    position: 'relative',
    height: HERO_HEIGHT,
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.75,
    backgroundColor: 'transparent',
    // Simulate gradient with a semi-transparent black
    background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
    // For RN we use opacity trick:
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  heroYear: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 10,
  },
  heroButton: {
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: C.black,
    fontSize: 12,
    fontWeight: '800',
  },
  heroDots: {
    position: 'absolute',
    bottom: 10,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  heroDotActive: {
    width: 16,
    backgroundColor: C.white,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIconText: {
    fontSize: 14,
    marginRight: 6,
  },
  searchField: {
    flex: 1,
    fontSize: 14,
    color: C.black,
    height: '100%',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    borderColor: C.red,
    backgroundColor: '#fff0f0',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: C.white,
    fontSize: 9,
    fontWeight: '800',
  },

  // Filter Modal
  filterModal: {
    backgroundColor: C.white,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    maxHeight: 480,
    borderWidth: 1,
    borderColor: C.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  filterModalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.black,
  },
  filterSection: {
    fontSize: 10,
    fontWeight: '800',
    color: C.gray400,
    letterSpacing: 1,
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.gray50,
  },
  filterOptionActive: {
    backgroundColor: '#fff0f0',
  },
  filterOptionText: {
    fontSize: 13,
    color: C.gray700,
  },
  filterOptionTextActive: {
    color: C.red,
    fontWeight: '700',
  },
  filterApply: {
    marginTop: 12,
    backgroundColor: C.red,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterApplyText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.gray100,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#f59e0b',
  },
  ratingButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.gray700,
  },
  ratingButtonTextActive: {
    color: C.white,
  },

  // Genre pills
  genrePills: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.gray100,
  },
  genrePillActive: {
    backgroundColor: C.red,
  },
  genrePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.gray700,
  },
  genrePillTextActive: {
    color: C.white,
  },

  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.black,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  // Row cards
  rowCard: {
    width: 100,
  },
  rowCardPoster: {
    width: 100,
    height: 148,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.gray200,
    marginBottom: 6,
  },
  rowCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: C.black,
    lineHeight: 14,
  },
  rowCardRating: {
    fontSize: 10,
    color: C.yellow,
    marginTop: 2,
  },

  // Grid cards
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.gray200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardNoImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.gray100,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: C.black,
    marginTop: 6,
    lineHeight: 14,
  },
  cardYear: {
    fontSize: 10,
    color: C.gray400,
  },
  cardRating: {
    fontSize: 10,
    color: C.yellow,
    fontWeight: '700',
  },

  // Search results
  searchResults: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  searchResultsTitle: {
    fontSize: 13,
    color: C.gray400,
    marginBottom: 8,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  searchItemPoster: {
    width: 40,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.gray200,
  },
  searchItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.black,
  },
  searchItemSub: {
    fontSize: 11,
    color: C.gray400,
    marginTop: 2,
  },
  searchItemRating: {
    fontSize: 11,
    color: C.yellow,
    fontWeight: '700',
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: C.gray400,
  },
});