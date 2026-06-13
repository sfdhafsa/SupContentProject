import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { useTheme } from '../src/context/ThemeContext';
import { getAuthUser } from '../src/services/authStorage';
import { getLibrary, upsertLibraryEntry, removeLibraryEntry } from '../src/services/libraryApi';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';
const { width: W } = Dimensions.get('window');
const CARD_W = (W - 48) / 2;
const CARD_H = CARD_W * 1.5;

const STATUSES = [
  { key: null,          label: 'Tous' },
  { key: 'TO_WATCH',    label: 'A voir' },
  { key: 'IN_PROGRESS', label: 'En cours' },
  { key: 'COMPLETED',   label: 'Vu' },
  { key: 'DROPPED',     label: 'Abandonne' },
];

const STATUS_COLORS = {
  TO_WATCH:    '#6366f1',
  IN_PROGRESS: '#f59e0b',
  COMPLETED:   '#10b981',
  DROPPED:     '#ef4444',
};

export default function Library() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser]                   = useState(null);
  const [activeStatus, setActiveStatus]   = useState(null);
  const [movies, setMovies]               = useState([]);
  const [loading, setLoading]             = useState(false);
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
    Alert.alert('Retirer', `Retirer "${movie.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: async () => {
        try {
          await removeLibraryEntry(movie.movie_id || movie.id);
          setSelectedMovie(null);
          fetchLibrary();
        } catch (e) { Alert.alert('Erreur', e.message); }
      }},
    ]);
  }

  const totalCount = movies.length;
  const vuCount    = movies.filter(m => m.status === 'COMPLETED').length;
  const aVoirCount = movies.filter(m => m.status === 'TO_WATCH').length;
  const filtered   = activeStatus ? movies.filter(m => m.status === activeStatus) : movies;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <TopNavbar username={user?.username || 'User'} />

      <View style={[s.subNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={[s.subNavBtn, s.subNavBtnActive]}>
          <Text style={[s.subNavText, s.subNavTextActive]}>Biblio</Text>
        </Pressable>
        <Pressable style={s.subNavBtn} onPress={() => router.push('/lists')}>
          <Text style={[s.subNavText, { color: colors.subtle }]}>Listes</Text>
        </Pressable>
        <Pressable style={s.subNavBtn} onPress={() => router.push('/dashboard')}>
          <Text style={[s.subNavText, { color: colors.subtle }]}>Stats</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>Ma bibliotheque</Text>
          <Text style={[s.headerSub, { color: colors.muted }]}>Vos films sauvegardes</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {STATUSES.map(st => {
            const count  = st.key === null ? movies.length : movies.filter(m => m.status === st.key).length;
            const active = activeStatus === st.key;
            return (
              <Pressable key={String(st.key)} onPress={() => setActiveStatus(st.key)}
                style={[s.chip, { backgroundColor: colors.card, borderColor: colors.border }, active && s.chipActive]}>
                <Text style={[s.chipText, { color: colors.muted }, active && s.chipTextActive]}>{st.label}</Text>
                <View style={[s.chipBadge, { backgroundColor: colors.cardMuted }, active && s.chipBadgeActive]}>
                  <Text style={[s.chipBadgeText, { color: colors.muted }, active && s.chipBadgeTextActive]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[s.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: colors.text }]}>{totalCount}</Text>
            <Text style={[s.statLabel, { color: colors.subtle }]}>Sauvegardes</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: colors.text }]}>{vuCount}</Text>
            <Text style={[s.statLabel, { color: colors.subtle }]}>Vus</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statValue, { color: colors.text }]}>{aVoirCount}</Text>
            <Text style={[s.statLabel, { color: colors.subtle }]}>A voir</Text>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#D0021B" size="large" /></View>
        ) : filtered.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>Aucun film ici</Text>
            <Text style={s.emptySub}>Ajoutez des films a votre bibliotheque</Text>
            <Pressable style={s.discoverBtn} onPress={() => router.push('/discover')}>
              <Text style={s.discoverBtnText}>Decouvrir des films</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.grid}>
            {filtered.map((movie) => {
              const poster     = movie.poster_url ? `${TMDB_IMG}${movie.poster_url}` : null;
              const isSelected = selectedMovie?.movie_id === movie.movie_id;
              return (
                <Pressable key={movie.id || movie.movie_id}
                  style={[s.movieCard, { width: CARD_W, height: CARD_H }]}
                  onPress={() => setSelectedMovie(isSelected ? null : movie)}>
                  {poster
                    ? <Image source={{ uri: poster }} style={s.poster} resizeMode="cover" />
                    : <View style={s.posterFallback}><Text style={s.posterFallbackText}>?</Text></View>
                  }
                  {!isSelected && movie.status && (
                    <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[movie.status] }]} />
                  )}
                  {isSelected && (
                    <View style={s.overlay}>
                      <Text style={s.overlayTitle} numberOfLines={2}>{movie.title}</Text>
                      <View style={s.overlayActions}>
                        {STATUSES.filter(st => st.key && st.key !== movie.status).map(st => (
                          <Pressable key={st.key}
                            style={[s.overlayBtn, { backgroundColor: STATUS_COLORS[st.key] }]}
                            onPress={() => handleStatusChange(movie, st.key)}>
                            <Text style={s.overlayBtnText}>{st.label}</Text>
                          </Pressable>
                        ))}
                        <Pressable style={[s.overlayBtn, { backgroundColor: '#6b7280' }]}
                          onPress={() => handleRemove(movie)}>
                          <Text style={s.overlayBtnText}>Retirer</Text>
                        </Pressable>
                      </View>
                    </View>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:                { flex: 1, backgroundColor: '#f9fafb' },
  subNav:              { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  subNavBtn:           { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subNavBtnActive:     { borderBottomWidth: 2, borderBottomColor: '#D0021B' },
  subNavText:          { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  subNavTextActive:    { color: '#D0021B' },
  scroll:              { padding: 16, paddingBottom: 100, gap: 16 },
  header:              { gap: 4 },
  headerTitle:         { color: '#111827', fontSize: 22, fontWeight: '900' },
  headerSub:           { color: '#6b7280', fontSize: 12 },
  chips:               { gap: 8, paddingVertical: 4 },
  chip:                { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive:          { backgroundColor: '#D0021B', borderColor: '#D0021B' },
  chipText:            { color: '#6b7280', fontSize: 12, fontWeight: '700' },
  chipTextActive:      { color: '#fff' },
  chipBadge:           { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipBadgeText:       { color: '#6b7280', fontSize: 10, fontWeight: '800' },
  chipBadgeTextActive: { color: '#fff' },
  statsRow:            { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'space-around' },
  statBox:             { alignItems: 'center', gap: 4 },
  statValue:           { color: '#111827', fontSize: 24, fontWeight: '900' },
  statLabel:           { color: '#9ca3af', fontSize: 10 },
  statDivider:         { width: 1, height: 32, backgroundColor: '#e5e7eb' },
  center:              { paddingVertical: 60, alignItems: 'center' },
  emptyBox:            { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle:          { color: '#111827', fontSize: 16, fontWeight: '800' },
  emptySub:            { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
  discoverBtn:         { marginTop: 8, backgroundColor: '#D0021B', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 },
  discoverBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },
  grid:                { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  movieCard:           { borderRadius: 14, overflow: 'hidden', position: 'relative', backgroundColor: '#e5e7eb' },
  poster:              { width: '100%', height: '100%' },
  posterFallback:      { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  posterFallbackText:  { color: '#9ca3af', fontSize: 32 },
  statusDot:           { position: 'absolute', top: 8, left: 8, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
  overlay:             { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', padding: 10, justifyContent: 'space-between' },
  overlayTitle:        { color: '#fff', fontSize: 11, fontWeight: '800' },
  overlayActions:      { gap: 5 },
  overlayBtn:          { borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  overlayBtnText:      { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBottom:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
  cardTitle:           { color: '#fff', fontSize: 11, fontWeight: '800' },
  cardMeta:            { color: '#d1d5db', fontSize: 10, marginTop: 2 },
});
