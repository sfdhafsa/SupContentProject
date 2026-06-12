import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
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
const HERO_H     = Math.round(SH * 0.30);
const CARD_W     = Math.floor((SW - 52) / 3);
const ROW_CARD_W = Math.round(SW * 0.26);

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

// ─────────────────────────────────────────
// Skeleton animé
// ─────────────────────────────────────────
function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: C.gray200, opacity: anim }, style]} />
  );
}

function SkeletonCard() {
  return (
    <View style={{ width: CARD_W }}>
      <SkeletonBox width={CARD_W} height={Math.round(CARD_W * 1.5)} borderRadius={10} />
      <SkeletonBox width={CARD_W * 0.8} height={9} borderRadius={4} style={{ marginTop: 6 }} />
      <SkeletonBox width={CARD_W * 0.5} height={8} borderRadius={4} style={{ marginTop: 3 }} />
    </View>
  );
}

function SkeletonRowCard() {
  return (
    <View style={{ width: ROW_CARD_W }}>
      <SkeletonBox width={ROW_CARD_W} height={Math.round(ROW_CARD_W * 1.45)} borderRadius={10} />
      <SkeletonBox width={ROW_CARD_W * 0.8} height={9} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
  );
}

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
// AnimatedMovieCard
// ─────────────────────────────────────────
function AnimatedMovieCard({ movie, onPress, width, height }) {
  const scale = useRef(new Animated.Value(1)).current;
  const W = width  || CARD_W;
  const H = height || Math.round(W * 1.5);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 20 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Pressable
      onPress={() => onPress(movie.tmdb_id)}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View style={{ width: W, transform: [{ scale }] }}>
        <View style={{ width: W, height: H, borderRadius: 10, overflow: 'hidden', backgroundColor: C.gray200 }}>
          {movie.poster_url
            ? <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🎬</Text>
              </View>
          }
        </View>
        <Text style={{ fontSize: 11, fontWeight: '600', color: C.black, marginTop: 5 }} numberOfLines={1}>
          {movie.title}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={{ fontSize: 10, color: C.gray400 }}>{movie.release_date?.slice(0, 4) || '—'}</Text>
          {movie.vote_average > 0 && (
            <Text style={{ fontSize: 10, color: C.yellow, fontWeight: '700' }}>★{movie.vote_average.toFixed(1)}</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
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
          setIdx(Math.round(e.nativeEvent.contentOffset.x / SW));
        }}
      >
        {list.map((movie) => (
          <Pressable
            key={movie.tmdb_id}
            onPress={() => onPress(movie.tmdb_id)}
            style={{ width: SW, height: HERO_H }}
          >
            {(movie.backdrop_url || movie.poster_url)
              ? <Image source={{ uri: movie.backdrop_url || movie.poster_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.gray800 }]} />
            }
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.48)' }]} />
            <View style={{ position: 'absolute', bottom: 14, left: 14, right: 70 }}>
              <Stars rating={movie.vote_average} size={11} />
              <Text style={{ color: C.white, fontSize: 16, fontWeight: '800', marginTop: 3 }} numberOfLines={1}>
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
                style={{ marginTop: 8, backgroundColor: C.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: C.black, fontSize: 11, fontWeight: '800' }}>▶ Voir</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {idx > 0 && (
        <Pressable onPress={() => goTo(idx - 1)} hitSlop={10} style={s.arrowLeft}>
          <Text style={s.arrowTxt}>‹</Text>
        </Pressable>
      )}
      {idx < list.length - 1 && (
        <Pressable onPress={() => goTo(idx + 1)} hitSlop={10} style={s.arrowRight}>
          <Text style={s.arrowTxt}>›</Text>
        </Pressable>
      )}

      <View style={{ position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', gap: 4 }}>
        {list.map((_, i) => (
          <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
            <View style={{ width: i === idx ? 14 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? C.white : 'rgba(255,255,255,0.4)' }} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────
// GenrePill animé
// ─────────────────────────────────────────
function GenrePill({ genre, selected, onToggle }) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, speed: 30 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start();
    onToggle(String(genre.id));
  };

  return (
    <Pressable onPress={press} hitSlop={4}>
      <Animated.View style={[
        s.pill,
        selected && s.pillActive,
        { transform: [{ scale }] },
      ]}>
        <Text style={[s.pillTxt, selected && s.pillTxtActive]}>
          {selected ? '✓ ' : ''}{genre.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function GenrePills({ genres, selectedIds, onToggle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}
    >
      {genres.map((g) => (
        <GenrePill
          key={g.id}
          genre={g}
          selected={selectedIds.includes(String(g.id))}
          onToggle={onToggle}
        />
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────
// MovieRow horizontal
// ─────────────────────────────────────────
function MovieRow({ title, movies, onPress, loading }) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonRowCard key={i} />)
          : movies.map((m) => (
              <AnimatedMovieCard
                key={m.tmdb_id}
                movie={m}
                onPress={onPress}
                width={ROW_CARD_W}
                height={Math.round(ROW_CARD_W * 1.45)}
              />
            ))
        }
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────
// SearchItem
// ─────────────────────────────────────────
function SearchItem({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 25 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 25 }).start();

  const content = (() => {
    if (item.type === 'movie') {
      return (
        <>
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
              <Text style={{ fontSize: 11, color: C.yellow, fontWeight: '700', marginTop: 2 }}>★{item.vote_average.toFixed(1)}</Text>
            )}
          </View>
          <Text style={{ color: C.gray400, fontSize: 20, paddingLeft: 8 }}>›</Text>
        </>
      );
    }
    if (item.type === 'user') {
      return (
        <>
          <View style={[s.searchAvatar, { backgroundColor: C.red }]}>
            <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>{item.username?.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.searchTitle}>@{item.username}</Text>
            {item.bio && <Text style={s.searchSub} numberOfLines={1}>{item.bio}</Text>}
          </View>
          <Text style={{ color: C.gray400, fontSize: 20, paddingLeft: 8 }}>›</Text>
        </>
      );
    }
    if (item.type === 'list') {
      return (
        <>
          <View style={[s.searchAvatar, { backgroundColor: '#7c3aed' }]}>
            <Text style={{ fontSize: 16 }}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.searchTitle}>{item.name}</Text>
            <Text style={s.searchSub}>{item.movie_count || 0} films</Text>
          </View>
          <Text style={{ color: C.gray400, fontSize: 20, paddingLeft: 8 }}>›</Text>
        </>
      );
    }
    return null;
  })();

  return (
    <Pressable
      onPress={() => item.type === 'movie' && onPress(item.tmdb_id)}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View style={[s.searchItem, { transform: [{ scale }] }]}>
        {content}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────
// FilterPanel
// ─────────────────────────────────────────
function FilterPanel({ visible, genres, genreIds, yearRange, minRating, sortBy,
  onToggleGenre, onYearRange, onRating, onSort, onApply, onReset }) {

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, [visible]);

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
  const RATES = [{ label: '9+', value: 9 }, { label: '8+', value: 8 }, { label: '7+', value: 7 }, { label: '6+', value: 6 }];

  if (!visible) return null;

  return (
    <Animated.View style={[s.filterPanel, {
      opacity: slideAnim,
      transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.black }}>Filtres & Tri</Text>
        <Pressable onPress={onReset} hitSlop={8}>
          <Text style={{ fontSize: 13, color: C.red, fontWeight: '700' }}>Effacer tout</Text>
        </Pressable>
      </View>

      <Text style={s.filterLbl}>TRIER PAR</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {SORTS.map((o) => (
          <Pressable key={o.value} onPress={() => onSort(o.value)} style={[s.pill, sortBy === o.value && s.pillActive]}>
            <Text style={[s.pillTxt, sortBy === o.value && s.pillTxtActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.filterLbl}>GENRES (multi-sélection)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {genres.map((g) => (
          <GenrePill
            key={g.id}
            genre={g}
            selected={genreIds.includes(String(g.id))}
            onToggle={onToggleGenre}
          />
        ))}
      </View>

      <Text style={s.filterLbl}>PÉRIODE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {YEARS.map((r) => (
          <Pressable key={r.label} onPress={() => onYearRange(yearRange?.label === r.label ? null : r)}
            style={[s.pill, yearRange?.label === r.label && s.pillActive]}>
            <Text style={[s.pillTxt, yearRange?.label === r.label && s.pillTxtActive]}>{r.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.filterLbl}>NOTE MINIMUM</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {RATES.map((o) => (
          <Pressable key={o.value} onPress={() => onRating(minRating === o.value ? '' : o.value)}
            style={[s.pill, minRating === o.value && { backgroundColor: C.yellow, borderColor: C.yellow }]}>
            <Text style={[s.pillTxt, minRating === o.value && { color: C.white }]}>★{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={onApply}
        style={{ backgroundColor: C.red, paddingVertical: 13, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ color: C.white, fontSize: 14, fontWeight: '800' }}>Appliquer</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────
// Discover (main)
// ─────────────────────────────────────────
export default function Discover() {
  const router       = useRouter();
  const searchParams = useLocalSearchParams();

  const [query, setQuery]                   = useState(searchParams.q || '');
  const [searchResults, setResults]         = useState([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [isSearching, setIsSearching]       = useState(!!searchParams.q);

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

  const debounceRef  = useRef(null);
  const resultsAnim  = useRef(new Animated.Value(0)).current;

  // Barre de recherche inline dans discover (séparée de TopNavbar)
  const [inlineQuery, setInlineQuery] = useState(searchParams.q || '');

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

  // Animation résultats
  const animateResults = () => {
    resultsAnim.setValue(0);
    Animated.spring(resultsAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setIsSearching(false); setResults([]); return; }
    setIsSearching(true);
    setSearchLoading(true);
    try {
      const res = await searchMovies({ query: q });
      setResults((res.results || []).slice(0, 10).map((m) => ({ ...m, type: 'movie' })));
      animateResults();
    } catch { setResults([]); }
    finally { setSearchLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(inlineQuery), 400);
  }, [inlineQuery]);

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
      animateResults();
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

  // Callback pour TopNavbar
  const handleTopSearch = useCallback((text) => {
    setInlineQuery(text);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TopNavbar username="User" onSearch={handleTopSearch} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Hero */}
          {!isSearching && !isFiltering && trending.length > 0 && (
            <HeroCarousel movies={trending} onPress={handlePress} />
          )}

          {/* Search bar inline */}
          <View style={s.searchBarInline}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, fontSize: 15, color: C.black, paddingVertical: 0 }}
              placeholder="Films, utilisateurs, listes..."
              placeholderTextColor={C.gray400}
              value={inlineQuery}
              onChangeText={setInlineQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {inlineQuery.length > 0 && (
              <Pressable onPress={() => setInlineQuery('')} hitSlop={10} style={{ paddingLeft: 8 }}>
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
            <Animated.View style={{
              paddingHorizontal: 16,
              marginTop: 8,
              opacity: resultsAnim,
              transform: [{ translateY: resultsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}>
              <Text style={s.sectionTitle}>
                {searchLoading ? 'Recherche...' : `${searchResults.length} résultat(s)`}
              </Text>
              {searchLoading
                ? <ActivityIndicator color={C.red} style={{ marginTop: 24 }} />
                : searchResults.length === 0
                  ? <Text style={{ color: C.gray400, fontSize: 14, textAlign: 'center', marginTop: 24 }}>
                      Aucun résultat pour "{inlineQuery}"
                    </Text>
                  : searchResults.map((item, i) => (
                      <SearchItem key={i} item={item} onPress={handlePress} />
                    ))
              }
            </Animated.View>
          )}

          {/* Filtered */}
          {!isSearching && isFiltering && (
            <Animated.View style={{
              paddingHorizontal: 16,
              marginTop: 12,
              opacity: resultsAnim,
              transform: [{ translateY: resultsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}>
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
                    {filtered.map((m) => (
                      <AnimatedMovieCard key={m.tmdb_id} movie={m} onPress={handlePress} />
                    ))}
                  </View>
              }
            </Animated.View>
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

      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  arrowLeft: {
    position: 'absolute', left: 10, top: '50%', marginTop: -20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  arrowRight: {
    position: 'absolute', right: 10, top: '50%', marginTop: -20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  arrowTxt: {
    color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30, marginTop: -2,
  },
  searchBarInline: {
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
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: C.gray200,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  filterBtnActive: { borderColor: C.red, backgroundColor: '#fff0f0' },
  filterBadge: {
    position: 'absolute', top: -5, right: -5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.red, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeTxt: { color: C.white, fontSize: 9, fontWeight: '800' },
  filterPanel: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: C.gray200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 6,
  },
  filterLbl: {
    fontSize: 10, fontWeight: '800', color: C.gray400,
    letterSpacing: 0.8, marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#f0f0f5',
    borderWidth: 1.5,
    borderColor: C.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pillActive: {
    backgroundColor: C.red,
    borderColor: C.red,
    shadowColor: C.red,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  pillTxt: {
    fontSize: 12, fontWeight: '700', color: C.gray700,
  },
  pillTxtActive: { color: C.white },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: C.black, marginBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  searchItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.gray100,
    backgroundColor: C.white,
  },
  searchPoster: {
    width: 38, height: 54, borderRadius: 8, overflow: 'hidden',
    backgroundColor: C.gray200, alignItems: 'center', justifyContent: 'center',
  },
  searchAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  searchTitle: { fontSize: 14, fontWeight: '700', color: C.black },
  searchSub:   { fontSize: 12, color: C.gray400, marginTop: 2 },
});