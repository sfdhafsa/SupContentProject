import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, Pressable,
  ScrollView, StyleSheet, Text, View, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { getAuthUser } from '../src/services/authStorage';
import { getLibrary, upsertLibraryEntry, removeLibraryEntry } from '../src/services/libraryApi';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';
const { width: W } = Dimensions.get('window');
const IS_WEB = W > 500;
const CARD_W = IS_WEB ? 130 : (W - 48) / 2;
const CARD_H = CARD_W * 1.5;

const STATUSES = [
  { key: null, label: 'Tous' },
  { key: 'TO_WATCH', label: 'À voir' },
  { key: 'IN_PROGRESS', label: 'En cours' },
  { key: 'COMPLETED', label: 'Vu' },
  { key: 'DROPPED', label: 'Abandonné' },
];

const STATUS_COLORS = {
  TO_WATCH: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#10b981',
  DROPPED: '#ef4444',
};

const CARD_GRADIENTS = [
  '#7c3d0a', '#1e1b4b', '#052e16', '#1c1207',
  '#1e3a5f', '#2d1b4e', '#1a1a2e', '#0f2027',
];

export default function Library() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => { getAuthUser().then(setUser); }, []);
  useEffect(() => { if (user) fetchLibrary(); }, [user, activeStatus]);

  async function fetchLibrary() {
    setLoading(true);
    try {
      const res = await getLibrary(activeStatus);
      setMovies(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(movie, status) {
    try {
      await upsertLibraryEntry(movie.movie_id || movie.id, movie.tmdb_id, status);
      setSelectedMovie(null);
      fetchLibrary();
    } catch (e) { Alert.alert('Erreur', e.message); }
  }

  async function handleRemove(movie) {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm(`Retirer "${movie.title}" ?`)
      : await new Promise(resolve => {
          Alert.alert('Retirer', `Retirer "${movie.title}" ?`, [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Retirer', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (!confirmed) return;
    try {
      await removeLibraryEntry(movie.movie_id || movie.id);
      setSelectedMovie(null);
      fetchLibrary();
    } catch (e) { Alert.alert('Erreur', e.message); }
  }

  const totalCount = movies.length;
  const vuCount = movies.filter(m => m.status === 'COMPLETED').length;
  const aVoirCount = movies.filter(m => m.status === 'TO_WATCH').length;
  const filtered = activeStatus ? movies.filter(m => m.status === activeStatus) : movies;

  return (
    <View style={IS_WEB ? s.pageWeb : s.pageMobile}>
      <View style={IS_WEB ? s.phoneWeb : s.phoneMobile}>
        <TopNavbar username={user?.username || 'User'} />

        <View style={s.subNav}>
          <Pressable style={[s.subNavBtn, s.subNavBtnActive]}>
            <Text style={[s.subNavText, s.subNavTextActive]}>📚 Biblio</Text>
          </Pressable>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/lists')}>
            <Text style={s.subNavText}>📋 Listes</Text>
          </Pressable>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/dashboard')}>
            <Text style={s.subNavText}>📊 Stats</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          <View style={s.header}>
            <Text style={s.headerTitle}>Ma bibliothèque ✨</Text>
            <Text style={s.headerSub}>Vos films sauvegardés</Text>
          </View>

          {/* Filtres */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {STATUSES.map(st => {
              const count = st.key === null ? movies.length : movies.filter(m => m.status === st.key).length;
              const active = activeStatus === st.key;
              return (
                <Pressable key={String(st.key)} onPress={() => setActiveStatus(st.key)} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{st.label}</Text>
                  <View style={[s.chipBadge, active && s.chipBadgeActive]}>
                    <Text style={[s.chipBadgeText, active && s.chipBadgeTextActive]}>{count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Stats rapides */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{totalCount}</Text>
              <Text style={s.statLabel}>Sauvegardés</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{vuCount}</Text>
              <Text style={s.statLabel}>Vus</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{aVoirCount}</Text>
              <Text style={s.statLabel}>À voir</Text>
            </View>
          </View>

          {/* Grille films */}
          {loading ? (
            <View style={s.center}><ActivityIndicator color="#ef0d1a" size="large" /></View>
          ) : filtered.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyIcon}>🎬</Text>
              <Text style={s.emptyTitle}>Aucun film ici</Text>
              <Text style={s.emptySub}>Ajoutez des films à votre bibliothèque</Text>
              <Pressable style={s.discoverBtn} onPress={() => router.push('/discover')}>
                <Text style={s.discoverBtnText}>Découvrir des films</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.grid}>
              {filtered.map((movie, index) => {
                const poster = movie.poster_url ? `${TMDB_IMG}${movie.poster_url}` : null;
                const isSelected = selectedMovie?.movie_id === movie.movie_id;
                const bgColor = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
                return (
                  <Pressable
                    key={movie.id || movie.movie_id}
                    style={[s.movieCard, { backgroundColor: bgColor, width: CARD_W, height: CARD_H }]}
                    onPress={() => setSelectedMovie(isSelected ? null : movie)}
                  >
                    {poster ? (
                      <Image source={{ uri: poster }} style={s.poster} resizeMode="cover" />
                    ) : (
                      <View style={s.posterFallback}>
                        <Text style={s.posterFallbackIcon}>▦</Text>
                      </View>
                    )}

                    {!isSelected && (
                      <View style={s.ratingBadge}>
                        <Text style={s.ratingStar}>★</Text>
                        <Text style={s.ratingText}>{(7 + (index % 3)).toFixed(1)}</Text>
                      </View>
                    )}

                    {isSelected && (
                      <View style={s.overlay}>
                        <Text style={s.overlayTitle} numberOfLines={2}>{movie.title}</Text>
                        <View style={s.overlayActions}>
                          {STATUSES.filter(st => st.key && st.key !== movie.status).map(st => (
                            <Pressable
                              key={st.key}
                              style={[s.overlayBtn, { backgroundColor: STATUS_COLORS[st.key] }]}
                              onPress={() => handleStatusChange(movie, st.key)}
                            >
                              <Text style={s.overlayBtnText}>{st.label}</Text>
                            </Pressable>
                          ))}
                          <Pressable
                            style={[s.overlayBtn, { backgroundColor: '#374151' }]}
                            onPress={() => handleRemove(movie)}
                          >
                            <Text style={s.overlayBtnText}>🗑️ Retirer</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {!isSelected && movie.status && (
                      <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[movie.status] || '#6b7280' }]} />
                    )}

                    {!isSelected && (
                      <View style={s.cardBottom}>
                        <Text style={s.cardTitle} numberOfLines={1}>{movie.title}</Text>
                        {movie.release_date && (
                          <Text style={s.cardMeta}>{new Date(movie.release_date).getFullYear()}</Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <BottomTabBar />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pageWeb: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 20 },
  pageMobile: { flex: 1, backgroundColor: '#0a0a12' },
  phoneWeb: { backgroundColor: '#0a0a12', borderRadius: 22, height: 592, maxWidth: 315, overflow: 'hidden', width: '100%' },
  phoneMobile: { flex: 1, backgroundColor: '#0a0a12' },
  subNav: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  subNavBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subNavBtnActive: { borderBottomWidth: 2, borderBottomColor: '#ef0d1a' },
  subNavText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  subNavTextActive: { color: '#ef0d1a' },
  scroll: { padding: 16, paddingBottom: 100, gap: 14 },
  header: { gap: 4 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#6b7280', fontSize: 11 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0f0f1e', borderWidth: 1, borderColor: '#1e1e3a' },
  chipActive: { backgroundColor: '#ef0d1a', borderColor: '#ef0d1a' },
  chipText: { color: '#6b7280', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  chipBadge: { backgroundColor: '#1e1e3a', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipBadgeText: { color: '#6b7280', fontSize: 10, fontWeight: '800' },
  chipBadgeTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', backgroundColor: '#0f0f1e', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e1e3a', alignItems: 'center', justifyContent: 'space-around' },
  statBox: { alignItems: 'center', gap: 4 },
  statValue: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 10 },
  statDivider: { width: 1, height: 32, backgroundColor: '#1e1e3a' },
  center: { paddingVertical: 60, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  emptySub: { color: '#6b7280', fontSize: 12, textAlign: 'center' },
  discoverBtn: { marginTop: 8, backgroundColor: '#ef0d1a', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12, shadowColor: '#ef0d1a', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  discoverBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  movieCard: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  poster: { width: '100%', height: '100%' },
  posterFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  posterFallbackIcon: { color: 'rgba(255,255,255,0.15)', fontSize: 44 },
  ratingBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  ratingStar: { color: '#fbbf24', fontSize: 11 },
  ratingText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.92)', padding: 10, justifyContent: 'space-between' },
  overlayTitle: { color: '#fff', fontSize: 11, fontWeight: '800' },
  overlayActions: { gap: 5 },
  overlayBtn: { borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  overlayBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.65)' },
  cardTitle: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  cardMeta: { color: '#9ca3af', fontSize: 10, marginTop: 2 },
  statusDot: { position: 'absolute', top: 8, left: 8, width: 9, height: 9, borderRadius: 5 },
});