import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
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

const { width: SW, height: SH } = Dimensions.get('window');

const C = {
  red:    '#ef0d1a',
  white:  '#ffffff',
  black:  '#111827',
  gray50: '#f9fafb',
  gray100:'#f3f4f6',
  gray200:'#e5e7eb',
  gray400:'#9ca3af',
  gray500:'#6b7280',
  gray700:'#374151',
  gray800:'#1f2937',
  yellow: '#f59e0b',
  bg:     '#f3f4f6',
};

const HERO_H     = Math.round(SH * 0.30);
const CARD_W     = Math.floor((SW - 52) / 3);
const ROW_CARD_W = Math.round(SW * 0.26);

// ─────────────────────────────────────────
// Stars
// ─────────────────────────────────────────
function Stars({ rating, size = 10 }) {
  const filled = Math.round((rating / 10) * 5);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < filled ? C.yellow : 'rgba(255,255,255,0.25)' }}>★</Text>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────
// HeroCarousel
// ─────────────────────────────────────────
function HeroCarousel({ movies, onPress }) {
  const [idx, setIdx] = useState(0);
  const ref           = useRef(null);
  const list          = movies.slice(0, 5);

  const goTo = useCallback((i) => {
    const next = Math.max(0, Math.min(i, list.length - 1));
    setIdx(next);
    ref.current?.scrollTo({ x: next * SW, animated: true });
  }, [list.length]);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => goTo((idx + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [idx, list.length, goTo]);

  if (list.length === 0) return null;

  return (
    <View style={{ width: SW, height: HERO_H }}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / SW);
          setIdx(i);
        }}
      >
        {list.map((movie) => (
          <Pressable
            key={movie.tmdb_id}
            onPress={() => onPress(movie.tmdb_id)}
            style={{ width: SW, height: HERO_H }}
          >
            {(movie.backdrop_url || movie.poster_url)
              ? <Image
                  source={{ uri: movie.backdrop_url || movie.poster_url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.gray800 }]} />
            }
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.48)' }]} />
            <View style={{ position: 'absolute', bottom: 14, left: 14, right: 70 }}>
              <Stars rating={movie.vote_average} size={11} />
              <Text
                style={{ color: C.white, fontSize: 16, fontWeight: '800', marginTop: 3 }}
                numberOfLines={1}
              >
                {movie.title}
              </Text>
              {movie.release_date && (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>
                  {movie.release_date.slice(0, 4)}
                </Text>
              )}
              <Pressable
                onPress={() => onPress(movie.tmdb_id)}
                hitSlop={8}
                style={{
                  marginTop: 8,
                  backgroundColor: C.white,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  alignSelf: 'flex-start',
                }}
              >
                <Text style={{ color: C.black, fontSize: 11, fontWeight: '800' }}>▶ Voir</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Flèche gauche */}
      {idx > 0 && (
        <Pressable
          onPress={() => goTo(idx - 1)}
          hitSlop={10}
          style={s.arrowLeft}
        >
          <Text style={s.arrowTxt}>‹</Text>
        </Pressable>
      )}

      {/* Flèche droite */}
      {idx < list.length - 1 && (
        <Pressable
          onPress={() => goTo(idx + 1)}
          hitSlop={10}
          style={s.arrowRight}
        >
          <Text style={s.arrowTxt}>›</Text>
        </Pressable>
      )}

      {/* Dots */}
      <View style={{ position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', gap: 4 }}>
        {list.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
            <View style={{
              width: i === idx ? 14 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === idx ? C.white : 'rgba(255,255,255,0.4)',
            }} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// MovieCard (grille)
// ─────────────────────────────────────────
function MovieCard({ movie, onPress }) {
  return (
    <Pressable onPress={() => onPress(movie.tmdb_id)} style={{ width: CARD_W }}>
      <View style={{ width: CARD_W, height: Math.round(CARD_W * 1.5), borderRadius: 10, overflow: 'hidden', backgroundColor: C.gray200 }}>
        {movie.poster_url
          ? <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>🎬</Text>
            </View>
        }
      </View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: C.black, marginTop: 5 }} numberOfLines={1}>
        {movie.title}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontSize: 10, color: C.gray400 }}>{movie.release_date?.slice(0, 4) || '—'}</Text>
        {movie.vote_average > 0 && (
          <Text style={{ fontSize: 10, color: C.yellow, fontWeight: '700' }}>
            ★{movie.vote_average.toFixed(1)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View style={{ width: CARD_W, opacity: 0.4 }}>
      <View style={{ width: CARD_W, height: Math.round(CARD_W * 1.5), borderRadius: 10, backgroundColor: C.gray200 }} />
      <View style={{ height: 9, backgroundColor: C.gray200, borderRadius: 4, marginTop: 5, width: '80%' }} />
      <View style={{ height: 8, backgroundColor: C.gray200, borderRadius: 4, marginTop: 3, width: '50%' }} />
    </View>
  );
}

// ─────────────────────────────────────────
// MovieRow horizontal
// ─────────────────────────────────────────
function MovieRow({ title, movies, onPress, loading }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ width: ROW_CARD_W, opacity: 0.4 }}>
                <View style={{ width: ROW_CARD_W, height: Math.round(ROW_CARD_W * 1.45), borderRadius: 10, backgroundColor: C.gray200 }} />
                <View style={{ height: 9, backgroundColor: C.gray200, borderRadius: 4, marginTop: 6, width: '80%' }} />
              </View>
            ))
          : movies.map((m) => (
              <Pressable key={m.tmdb_id} onPress={() => onPress(m.tmdb_id)} style={{ width: ROW_CARD_W }}>
                <View style={{ width: ROW_CARD_W, height: Math.round(ROW_CARD_W * 1.45), borderRadius: 10, overflow: 'hidden', backgroundColor: C.gray200 }}>
                  {m.poster_url
                    ? <Image source={{ uri: m.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>🎬</Text>
                      </View>
                  }
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: C.black, marginTop: 5 }} numberOfLines={1}>
                  {m.title}
                </Text>
                {m.vote_average > 0 && (
                  <Text style={{ fontSize: 10, color: C.yellow }}>★{m.vote_average.toFixed(1)}</Text>
                )}
              </Pressable>
            ))
        }
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// GenrePills
// ─────────────────────────────────────────
function GenrePills({ genres, selectedIds, onToggle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 2 }}
    >
      {genres.map((g) => {
        const sel = selectedIds.includes(String(g.id));
        return (
          <Pressable
            key={g.id}
            onPress={() => onToggle(String(g.id))}
            hitSlop={4}
            style={[s.pill, sel && s.pillActive]}
          >
            <Text style={[s.pillTxt, sel && s.pillTxtActive]}>{g.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─────────────────────────────────────────
// SearchItem
// ─────────────────────────────────────────
function SearchItem({ item, onPress }) {
  if (item.type === 'movie') {
    return (
      <Pressable onPress={() => onPress(item.tmdb_id)} style={s.searchItem}>
        <View style={s.searchPoster}>
          {item.poster_url
            ? <Image source={{ uri: item.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <Text style={{ fontSize: 14 }}>🎬</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.searchTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.searchSub}>{item.release_date?.slice(0, 4) || '—'}</Text>
          {item.vote_average > 0 && (
            <Text style={{ fontSize: 11, color: C.yellow, fontWeight: '700', marginTop: 2 }}>
              ★{item.vote_average.toFixed(1)}
            </Text>
          )}
        </View>
        <Text style={{ color: C.gray400, fontSize: 20, paddingLeft: 8 }}>›</Text>
      </Pressable>
    );
  }
  if (item.type === 'user') {
    return (
      <Pressable style={s.searchItem}>
        <View style={[s.searchAvatar, { backgroundColor: C.red }]}>
          <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>
            {item.username?.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.searchTitle}>@{item.username}</Text>
          {item.bio && <Text style={s.searchSub} numberOfLines={1}>{item.bio}</Text>}
        </View>
        <Text style={{ color: C.gray400, fontSize: 20, paddingLeft: 8 }}>›</Text>
      </Pressable>
    );
  }
  if (item.type === 'list') {
    return (
      <Pressable style={s.searchItem}>
        <View style={[s.searchAvatar, { backgroundColor: '#7c3aed' }]}>
          <Text style={{ fontSize: 16 }}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.searchTitle}>{item.name}</Text>
          <Text style={s.searchSub}>{item.movie_count || 0} films</Text>
        </View>
        <Text style={{ color: C.gray400, fontSize: 20, paddingLeft: 8 }}>›</Text>
      </Pressable>
    );
  }
  return null;
}

// ─────────────────────────────────────────
// FilterPanel
// ─────────────────────────────────────────
function FilterPanel({ visible, genres, genreIds, yearRange, minRating, sortBy,
  onToggleGenre, onYearRange, onRating, onSort, onApply, onReset }) {

  const YEARS = [
    { label: '2020+',   min: 2020, max: 2025 },
    { label: '2010-19', min: 2010, max: 2019 },
    { label: '2000-09', min: 2000, max: 2009 },
    { label: '90s',     min: 1990, max: 1999 },
    { label: '<1990',   min: 1900, max: 1989 },
  ];
  const SORTS = [
    { value: 'popularity.desc',           label: 'Populaires' },
    { value: 'vote_average.desc',         label: 'Mieux notés' },
    { value: 'primary_release_date.desc', label: 'Récents' },
    { value: 'primary_release_date.asc',  label: 'Anciens' },
  ];
  const RATES = [
    { label: '9+', value: 9 },
    { label: '8+', value: 8 },
    { label: '7+', value: 7 },
    { label: '6+', value: 6 },
  ];

  if (!visible) return null;

  return (
    <View style={s.filterPanel}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.black }}>Filtres & Tri</Text>
        <Pressable onPress={onReset} hitSlop={8}>
          <Text style={{ fontSize: 13, color: C.red, fontWeight: '700' }}>Effacer tout</Text>
        </Pressable>
      </View>

      <Text style={s.filterLbl}>TRIER PAR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {SORTS.map((o) => (
          <Pressable key={o.value} onPress={() => onSort(o.value)} style={[s.pill, sortBy === o.value && s.pillActive]}>
            <Text style={[s.pillTxt, sortBy === o.value && s.pillTxtActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.filterLbl}>GENRES (multi-sélection)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {genres.map((g) => {
          const sel = genreIds.includes(String(g.id));
          return (
            <Pressable key={g.id} onPress={() => onToggleGenre(String(g.id))}
              style={[s.pill, sel && s.pillActive]}>
              <Text style={[s.pillTxt, sel && s.pillTxtActive]}>{sel ? '✓ ' : ''}{g.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.filterLbl}>PÉRIODE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {YEARS.map((r) => (
          <Pressable key={r.label}
            onPress={() => onYearRange(yearRange?.label === r.label ? null : r)}
            style={[s.pill, yearRange?.label === r.label && s.pillActive]}>
            <Text style={[s.pillTxt, yearRange?.label === r.label && s.pillTxtActive]}>{r.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.filterLbl}>NOTE MINIMUM</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {RATES.map((o) => (
          <Pressable key={o.value}
            onPress={() => onRating(minRating === o.value ? '' : o.value)}
            style={[s.pill, minRating === o.value && { backgroundColor: C.yellow, borderColor: C.yellow }]}>
            <Text style={[s.pillTxt, minRating === o.value && { color: C.white }]}>★{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onApply}
        style={{ backgroundColor: C.red, paddingVertical: 13, borderRadius: 10, alignItems: 'center' }}>
        <Text style={{ color: C.white, fontSize: 14, fontWeight: '800' }}>Appliquer</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────
// Discover (main)
// ─────────────────────────────────────────
export default function Discover() {
  const router = useRouter();

  const [query, setQuery]                   = useState('');
  const [searchResults, setResults]         = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [isSearching, setIsSearching]       = useState(false);

  const [genreIds, setGenreIds]             = useState([]);
  const [yearRange, setYearRange]           = useState(null);
  const [minRating, setMinRating]           = useState('');
  const [sortBy, setSortBy]                 = useState('popularity.desc');
  const [filterOpen, setFilterOpen]         = useState(false);
  const [isFiltering, setIsFiltering]       = useState(false);

  const [genres, setGenres]                 = useState([]);
  const [trending, setTrending]             = useState([]);
  const [topRated, setTopRated]             = useState([]);
  const [nowPlaying, setNowPlaying]         = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [filterLoading, setFilterLoading]   = useState(false);

  const debounceRef = useRef(null);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setIsSearching(false); setResults([]); return; }
    setIsSearching(true);
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchMovies({ query });
        setResults((res.results || []).slice(0, 10).map((m) => ({ ...m, type: 'movie' })));
      } catch { setResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
  }, [query]);

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
    } catch { setFiltered([]); }
    finally { setFilterLoading(false); }
  }, [genreIds, yearRange, minRating, sortBy]);

  useEffect(() => {
    const active = genreIds.length > 0 || yearRange || minRating;
    setIsFiltering(!!active);
    if (active) loadFiltered();
  }, [genreIds, yearRange, minRating, sortBy]);

  const handlePress  = (id) => router.push(`/movie/${id}`);
  const toggleGenre  = (id) => setGenreIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const resetFilters = () => { setGenreIds([]); setYearRange(null); setMinRating(''); setSortBy('popularity.desc'); };
  const activeCount  = [genreIds.length > 0 ? 1 : null, yearRange, minRating].filter(Boolean).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Top Navbar */}
      <TopNavbar username="User" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 72 }}
        >
          {/* Hero */}
          {!isSearching && !isFiltering && trending.length > 0 && (
            <HeroCarousel movies={trending} onPress={handlePress} />
          )}

          {/* Search bar */}
          <View style={s.searchBar}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, fontSize: 15, color: C.black, paddingVertical: 0 }}
              placeholder="Films, utilisateurs, listes..."
              placeholderTextColor={C.gray400}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10} style={{ paddingLeft: 8 }}>
                <Text style={{ color: C.gray400, fontSize: 18 }}>✕</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setFilterOpen((o) => !o)}
              hitSlop={6}
              style={[s.filterBtn, (filterOpen || activeCount > 0) && s.filterBtnActive]}
            >
              <Text style={{ fontSize: 16 }}>⚙</Text>
              {activeCount > 0 && (
                <View style={s.filterBadge}>
                  <Text style={s.filterBadgeTxt}>{activeCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Filter panel */}
          <View style={{ paddingHorizontal: 16 }}>
            <FilterPanel
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
          </View>

          {/* Search results */}
          {isSearching && (
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <Text style={s.sectionTitle}>
                {searchLoading ? 'Recherche...' : `${searchResults.length} résultat(s)`}
              </Text>
              {searchLoading
                ? <ActivityIndicator color={C.red} style={{ marginTop: 24 }} />
                : searchResults.length === 0
                  ? <Text style={{ color: C.gray400, fontSize: 14, textAlign: 'center', marginTop: 24 }}>
                      Aucun résultat pour "{query}"
                    </Text>
                  : searchResults.map((item, i) => (
                      <SearchItem key={i} item={item} onPress={handlePress} />
                    ))
              }
            </View>
          )}

          {/* Filtered */}
          {!isSearching && isFiltering && (
            <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={s.sectionTitle}>
                  {filterLoading ? 'Chargement...' : `${filtered.length} film(s)`}
                </Text>
                <Pressable onPress={resetFilters} hitSlop={8}>
                  <Text style={{ color: C.red, fontSize: 13, fontWeight: '700' }}>Effacer</Text>
                </Pressable>
              </View>
              {filterLoading
                ? <View style={s.grid}>{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</View>
                : <View style={s.grid}>
                    {filtered.map((m) => <MovieCard key={m.tmdb_id} movie={m} onPress={handlePress} />)}
                  </View>
              }
            </View>
          )}

          {/* Discover */}
          {!isSearching && !isFiltering && (
            <>
              <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
                <Text style={[s.sectionTitle, { marginBottom: 10 }]}>Genres</Text>
              </View>
              <GenrePills genres={genres} selectedIds={genreIds} onToggle={toggleGenre} />
              <View style={{ paddingHorizontal: 16 }}>
                <MovieRow title="🔥 Tendances"   movies={trending}   onPress={handlePress} loading={sectionsLoading} />
                <MovieRow title="⭐ Mieux notés" movies={topRated}   onPress={handlePress} loading={sectionsLoading} />
                <MovieRow title="🎬 Au cinéma"   movies={nowPlaying} onPress={handlePress} loading={sectionsLoading} />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const s = StyleSheet.create({
  arrowLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrowTxt: {
    color: C.white,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
    marginTop: -2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterBtnActive: {
    borderColor: C.red,
    backgroundColor: '#fff0f0',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeTxt: {
    color: C.white,
    fontSize: 9,
    fontWeight: '800',
  },
  filterPanel: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  filterLbl: {
    fontSize: 10,
    fontWeight: '800',
    color: C.gray400,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  pillActive: {
    backgroundColor: C.red,
    borderColor: C.red,
  },
  pillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.gray700,
  },
  pillTxtActive: {
    color: C.white,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.black,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  searchPoster: {
    width: 38,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.black,
  },
  searchSub: {
    fontSize: 12,
    color: C.gray400,
    marginTop: 2,
  },
});